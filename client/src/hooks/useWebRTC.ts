import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { User, SocketPeer } from '../types';

interface WebRTCPeer {
  socketId: string;
  user: User;
  stream: MediaStream;
  isMuted: boolean;
  isCameraOff: boolean;
  handRaised: boolean;
  reaction?: string;
}

export const useWebRTC = (meetingCode: string, socket: Socket | null, currentUser: User | null) => {
  const [peers, setPeers] = useState<WebRTCPeer[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const candidateQueue = useRef<{ [socketId: string]: RTCIceCandidate[] }>({});
  
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  // Helper to update individual peer state parameters
  const updatePeerState = useCallback((socketId: string, updates: Partial<WebRTCPeer>) => {
    setPeers((prev) =>
      prev.map((peer) => (peer.socketId === socketId ? { ...peer, ...updates } : peer))
    );
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socket?.emit('toggle-mute', { isMuted: !audioTrack.enabled });
      }
    }
  }, [socket]);

  // Camera toggle
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        socket?.emit('toggle-camera', { isCameraOff: !videoTrack.enabled });
      }
    }
  }, [socket]);

  // Hand raise toggle
  const toggleHandRaise = useCallback(() => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    socket?.emit('raise-hand', { handRaised: nextState });
  }, [handRaised, socket]);

  // Reaction broadcaster
  const sendReaction = useCallback((reaction: string) => {
    setMyReaction(reaction);
    socket?.emit('send-reaction', { reaction });
    setTimeout(() => {
      setMyReaction(null);
    }, 4000);
  }, [socket]);

  // Screen sharing handler
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        const screenVideoTrack = stream.getVideoTracks()[0];

        // Replace local video track with screen track in all peer connections
        Object.keys(pcsRef.current).forEach((socketId) => {
          const pc = pcsRef.current[socketId];
          const senders = pc.getSenders();
          const sender = senders.find((s) => s.track?.kind === 'video');
          if (sender && screenVideoTrack) {
            sender.replaceTrack(screenVideoTrack);
          }
        });

        // Handle stop sharing triggered by browser bar
        screenVideoTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.error('[WebRTC] Error sharing screen:', err);
      }
    } else {
      stopScreenSharing();
    }
  }, [isScreenSharing]);

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);

    // Restore local camera video track in all active peer connections
    if (localStreamRef.current) {
      const localVideoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.keys(pcsRef.current).forEach((socketId) => {
        const pc = pcsRef.current[socketId];
        const senders = pc.getSenders();
        const sender = senders.find((s) => s.track?.kind === 'video');
        if (sender && localVideoTrack) {
          sender.replaceTrack(localVideoTrack);
        }
      });
    }
  };

  // Create an individual RTCPeerConnection for a remote peer
  const createPeer = useCallback((targetSocketId: string, peerUser: User, initiateOffer: boolean) => {
    const pc = new RTCPeerConnection({ iceServers });
    pcsRef.current[targetSocketId] = pc;

    // Attach local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Capture remote streams
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setPeers((prev) => {
        const peerExists = prev.some((p) => p.socketId === targetSocketId);
        if (peerExists) {
          return prev.map((p) => (p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p));
        } else {
          return [
            ...prev,
            {
              socketId: targetSocketId,
              user: peerUser,
              stream: remoteStream,
              isMuted: false,
              isCameraOff: false,
              handRaised: false
            }
          ];
        }
      });
    };

    // Forward ICE Candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('send-signal', {
          targetSocketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    // If active participant (creator of connection), send SDP offer
    if (initiateOffer) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket?.emit('send-signal', {
            targetSocketId,
            signal: { sdp: pc.localDescription }
          });
        })
        .catch((err) => console.error('[WebRTC] Offer creation error:', err));
    }

    return pc;
  }, [socket]);

  // Connect WebRTC signaling listeners
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Initial capture of camera and mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Notify signaling server we joined
        socket.emit('join-room', { meetingCode, user: currentUser });
      })
      .catch((err) => {
        console.error('[WebRTC] Microphone/Camera access denied:', err);
        // Fallback: join without stream
        socket.emit('join-room', { meetingCode, user: currentUser });
      });

    // Receive other active participants
    socket.on('all-users', (usersInRoom: SocketPeer[]) => {
      usersInRoom.forEach(({ socketId, user }) => {
        createPeer(socketId, user, true); // Create and send offer
      });
    });

    // Handle new peer joining
    socket.on('user-joined', ({ socketId, user }: SocketPeer) => {
      createPeer(socketId, user, false); // Create and wait for offer
    });

    // Receive peer signal payload
    socket.on('user-signaled', async ({ callerSocketId, signal, user }) => {
      let pc = pcsRef.current[callerSocketId];

      if (!pc) {
        pc = createPeer(callerSocketId, user, false);
      }

      if (signal.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (pc.remoteDescription?.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('return-signal', {
              targetSocketId: callerSocketId,
              signal: { sdp: pc.localDescription }
            });
          }
          
          // Flush buffered candidates
          const queue = candidateQueue.current[callerSocketId] || [];
          for (const cand of queue) {
            try {
              await pc.addIceCandidate(cand);
            } catch (e) {
              console.error('[WebRTC] Error adding buffered candidate:', e);
            }
          }
          candidateQueue.current[callerSocketId] = [];
        } catch (err) {
          console.error('[WebRTC] Signaling SDP error:', err);
        }
      } else if (signal.candidate) {
        const iceCand = new RTCIceCandidate(signal.candidate);
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(iceCand);
          } catch (err) {
            console.error('[WebRTC] Candidate error:', err);
          }
        } else {
          if (!candidateQueue.current[callerSocketId]) {
            candidateQueue.current[callerSocketId] = [];
          }
          candidateQueue.current[callerSocketId].push(iceCand);
        }
      }
    });

    // Receive answer payload
    socket.on('received-returned-signal', async ({ senderSocketId, signal }) => {
      const pc = pcsRef.current[senderSocketId];
      if (pc && signal.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          
          // Flush buffered candidates
          const queue = candidateQueue.current[senderSocketId] || [];
          for (const cand of queue) {
            try {
              await pc.addIceCandidate(cand);
            } catch (e) {
              console.error('[WebRTC] Error adding buffered candidate:', e);
            }
          }
          candidateQueue.current[senderSocketId] = [];
        } catch (err) {
          console.error('[WebRTC] Returned signal error:', err);
        }
      }
    });

    // Peer disconnected
    socket.on('user-left', (socketId: string) => {
      const pc = pcsRef.current[socketId];
      if (pc) {
        pc.close();
        delete pcsRef.current[socketId];
      }
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    // Sync media states
    socket.on('user-muted', ({ socketId, isMuted }) => {
      updatePeerState(socketId, { isMuted });
    });

    socket.on('user-camera-toggled', ({ socketId, isCameraOff }) => {
      updatePeerState(socketId, { isCameraOff });
    });

    socket.on('user-hand-raised', ({ socketId, handRaised }) => {
      updatePeerState(socketId, { handRaised });
    });

    socket.on('user-reaction', ({ socketId, reaction }) => {
      updatePeerState(socketId, { reaction });
      setTimeout(() => {
        updatePeerState(socketId, { reaction: undefined });
      }, 4000);
    });

    // Cleanup listeners
    return () => {
      socket.off('all-users');
      socket.off('user-joined');
      socket.off('user-signaled');
      socket.off('received-returned-signal');
      socket.off('user-left');
      socket.off('user-muted');
      socket.off('user-camera-toggled');
      socket.off('user-hand-raised');
      socket.off('user-reaction');

      // Stop all tracks in local streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Close all peer connections
      Object.keys(pcsRef.current).forEach((socketId) => {
        pcsRef.current[socketId].close();
      });
      pcsRef.current = {};
      setPeers([]);
    };
  }, [socket, currentUser, meetingCode, createPeer, updatePeerState]);

  return {
    peers,
    localStream,
    screenStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    handRaised,
    myReaction,
    toggleMute,
    toggleCamera,
    toggleHandRaise,
    toggleScreenShare,
    sendReaction
  };
};
