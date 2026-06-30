import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuthStore } from '../store/authStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { getMeetingByCodeAPI, endMeetingAPI, getMessagesByMeetingAPI, uploadAttachmentAPI } from '../services/meetingService';
import { WhiteboardCanvas } from '../components/WhiteboardCanvas';
import {
  Mic, MicOff, Video as Cam, VideoOff, Monitor, Hand, Smile,
  MessageSquare, Users, Edit3, PhoneOff, Copy, Check, Upload,
  Paperclip, Send, Loader2, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Separate Video Element renderer due to React HTML5 stream srcObject constraints
const PeerVideoCard: React.FC<{
  stream: MediaStream | null;
  userName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  handRaised: boolean;
  reaction?: string;
  isLocal?: boolean;
}> = ({ stream, userName, isMuted, isCameraOff, handRaised, reaction, isLocal }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative bg-white border rounded-2xl aspect-video flex items-center justify-center overflow-hidden transition-all shadow-sm ${
      handRaised ? 'border-yellow-500 shadow-md shadow-yellow-500/10' : 'border-slate-200'
    }`}>
      {/* Video Stream */}
      {!isCameraOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover rounded-2xl"
        />
      ) : (
        /* Avatar Placeholder */
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xl font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-500 font-semibold">{userName}</span>
        </div>
      )}

      {/* Grid Indicators overlays */}
      <div className="absolute bottom-3 left-3 bg-white/90 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur shadow-sm">
        <span className="text-[10px] font-bold text-slate-800 truncate max-w-[80px]">
          {userName} {isLocal && '(You)'}
        </span>
        {isMuted && <MicOff size={10} className="text-red-500" />}
      </div>

      {/* Hand raised Overlay banner */}
      {handRaised && (
        <div className="absolute top-3 left-3 bg-yellow-450 text-slate-950 font-bold px-2 py-0.5 rounded text-[9px] flex items-center gap-1 shadow-sm border border-yellow-250">
          <Hand size={8} /> Raised Hand
        </div>
      )}

      {/* Floated Reaction */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1.2, opacity: 1, y: -20 }}
            exit={{ scale: 0.5, opacity: 0, y: -40 }}
            className="absolute text-4xl pointer-events-none"
          >
            {reaction}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MeetingRoom: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const user = useAuthStore((state) => state.user);

  const [meeting, setMeeting] = useState<any>(null);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Layout states
  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard' | 'roster' | null>(null);
  
  // Real-time Chat States
  const [messages, setMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const typingTimeoutRef = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  // File Upload State
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Emoji Drawer Popup
  const [reactionOpen, setReactionOpen] = useState(false);

  // Connect WebRTC Hook
  const {
    peers,
    localStream,
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
  } = useWebRTC(code || '', socket, user);

  // Load meeting details & historic room messages
  useEffect(() => {
    if (!code) return;

    const loadData = async () => {
      try {
        const res = await getMeetingByCodeAPI(code);
        if (res.success && res.meeting) {
          setMeeting(res.meeting);
          
          // Load chat history
          const msgRes = await getMessagesByMeetingAPI(res.meeting._id);
          if (msgRes.success) {
            setMessages(msgRes.messages);
          }
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching room details:', err);
        navigate('/');
      } finally {
        setMeetingLoading(false);
      }
    };

    loadData();
  }, [code, navigate]);

  // Connect chat & typing socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('receive-message', (message: any) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-typing', ({ userId, userName, isTyping }) => {
      if (isTyping) {
        setTypingUsers((prev) => ({ ...prev, [userId]: userName }));

        // Auto clear indicator after inactivity timeout
        if (typingTimeoutRef.current[userId]) {
          clearTimeout(typingTimeoutRef.current[userId]);
        }
        typingTimeoutRef.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }, 3000);
      } else {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    });

    return () => {
      socket.off('receive-message');
      socket.off('user-typing');
    };
  }, [socket]);

  // Chat message submit
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !meeting) return;

    socket?.emit('send-message', {
      meetingId: meeting._id,
      text: chatText
    });
    socket?.emit('typing', { isTyping: false });
    setChatText('');
  };

  // Typing emitter check
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatText(e.target.value);
    if (socket) {
      socket.emit('typing', { isTyping: e.target.value.length > 0 });
    }
  };

  // File Upload trigger
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !meeting) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('meetingId', meeting._id);

    try {
      setUploadProgress(0);
      const res = await uploadAttachmentAPI(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });

      if (res.success && res.file) {
        // Send file index record over WebSockets
        socket?.emit('send-message', {
          meetingId: meeting._id,
          fileId: res.file._id
        });
      }
    } catch (err) {
      console.error('[Upload] Attachment failed:', err);
    } finally {
      setUploadProgress(null);
    }
  };

  // Copy meeting join code link
  const copyJoinLink = () => {
    const fullLink = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Leave room triggers
  const handleLeaveMeeting = async () => {
    const isHost = meeting?.host === user?.id || meeting?.host?._id === user?.id;

    if (isHost) {
      const confirmEnd = window.confirm('End this meeting room for all participants?');
      if (confirmEnd && meeting) {
        try {
          await endMeetingAPI(meeting._id);
        } catch (err) {
          console.error('Error closing room:', err);
        }
      }
    }
    navigate('/');
  };

  if (meetingLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 size={40} className="animate-spin text-brand-500" />
        <p className="text-sm text-slate-500 font-semibold">Verifying security codes...</p>
      </div>
    );
  }

  const isHostUser = meeting?.host?._id === user?.id || meeting?.host === user?.id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden h-screen text-slate-800">
      {/* Header controls bar */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 relative z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-slate-900 text-lg font-bold truncate max-w-[200px]">{meeting?.title}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold hidden sm:inline">
            CONNECTED MESH
          </span>
        </div>

        {/* Invite link copy actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg gap-2 text-xs font-mono text-slate-600">
            <span>{code}</span>
            <button
              onClick={copyJoinLink}
              className="text-slate-400 hover:text-slate-950 transition-colors"
              title="Copy Room URL"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main room view splits */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Calling Grid Pane */}
        <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center bg-slate-100/40 min-h-0">
          <div className="w-full max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Local User stream card */}
              <PeerVideoCard
                stream={localStream}
                userName={user?.name || 'Local Participant'}
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                handRaised={handRaised}
                reaction={myReaction || undefined}
                isLocal
              />

              {/* Remote active peer cards */}
              {peers.map((peer) => (
                <PeerVideoCard
                  key={peer.socketId}
                  stream={peer.stream}
                  userName={peer.user.name}
                  isMuted={peer.isMuted}
                  isCameraOff={peer.isCameraOff}
                  handRaised={peer.handRaised}
                  reaction={peer.reaction}
                />
              ))}
            </div>

            {peers.length === 0 && (
              <div className="text-center text-slate-450 mt-12 text-xs font-medium">
                Waiting for participants to join... Send them the code ` {code} `
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <AnimatePresence>
          {activeTab && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: window.innerWidth < 768 ? '100%' : 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="border-l border-slate-200 bg-white w-full md:w-[360px] flex flex-col shrink-0 min-h-0 absolute md:relative inset-y-0 right-0 h-full z-20 shadow-2xl"
            >
              {/* Tab Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {activeTab === 'chat' && 'Meeting Chat'}
                  {activeTab === 'whiteboard' && 'Drawing Board'}
                  {activeTab === 'roster' && 'Participant Roster'}
                </span>
                <button
                  onClick={() => setActiveTab(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto min-h-0 p-4">
                {/* 1. Roster tab */}
                {activeTab === 'roster' && (
                  <div className="space-y-4">
                    {/* Local profile */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-250/60">
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-brand-600" />
                        <span className="text-xs font-bold text-slate-900">{user?.name} (You)</span>
                      </div>
                      <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded border border-brand-200 font-bold">
                        {isHostUser ? 'Host' : 'Guest'}
                      </span>
                    </div>

                    {/* Active peers */}
                    {peers.map((peer) => (
                      <div
                        key={peer.socketId}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-250/60"
                      >
                        <div className="flex items-center gap-2">
                          <UserIcon size={14} className="text-slate-500" />
                          <span className="text-xs text-slate-800 truncate max-w-[120px] font-semibold">{peer.user.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold">
                          {peer.handRaised && (
                            <span className="text-[9px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded border border-yellow-200">
                              Hand Up
                            </span>
                          )}
                          <span className="text-[10px] text-slate-450">Connected</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Whiteboard Canvas tab */}
                {activeTab === 'whiteboard' && (
                  <div className="h-full min-h-[400px]">
                    <WhiteboardCanvas />
                  </div>
                )}

                {/* 3. Group chat tab */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-full justify-between min-h-[400px]">
                    {/* Message listing */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                      {messages.map((msg) => {
                        const isMine = msg.sender?._id === user?.id || msg.sender === user?.id;
                        return (
                          <div
                            key={msg._id}
                            className={`flex flex-col max-w-[85%] ${isMine ? 'ml-auto items-end' : 'mr-auto'}`}
                          >
                            <span className="text-[10px] text-slate-450 mb-1">
                              {isMine ? 'You' : msg.sender?.name}
                            </span>
                            <div className={`p-3 rounded-2xl text-xs shadow-sm ${
                              isMine ? 'bg-brand-600 text-white rounded-br-none' : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none'
                            }`}>
                              {msg.messageType === 'file' && msg.file ? (
                                <div className="flex items-center gap-2">
                                  <Paperclip size={14} />
                                  <a
                                    href={`http://localhost:5000/api/files/download/${msg.file._id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline font-bold"
                                  >
                                    {msg.file.originalName}
                                  </a>
                                </div>
                              ) : (
                                <span>{msg.text}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing indicator */}
                      {Object.keys(typingUsers).length > 0 && (
                        <div className="text-[10px] text-slate-450 italic animate-pulse font-medium">
                          {Object.values(typingUsers).join(', ')} is typing...
                        </div>
                      )}
                    </div>

                    {/* Chat inputs & upload form */}
                    <div className="border-t border-slate-200 pt-3">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={chatText}
                          onChange={handleInputChange}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
                        />
                        <button
                          type="submit"
                          className="p-2 rounded bg-brand-600 text-white hover:bg-brand-500 shadow-sm"
                        >
                          <Send size={14} />
                        </button>
                      </form>

                      {/* File upload action */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-150">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-900 font-bold"
                        >
                          <Upload size={12} /> Share attachment (PDF/Image)
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        {uploadProgress !== null && (
                          <span className="text-[10px] text-brand-600 font-bold">
                            Uploading {uploadProgress}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom meeting controllers */}
      <footer className="h-20 border-t border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 relative z-20 shadow-sm">
        {/* Side togglers (Chat, Draw, Users) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
            className={`p-2.5 rounded-lg border transition-colors ${
              activeTab === 'chat' 
                ? 'bg-brand-600 border-brand-500 text-white' 
                : 'bg-slate-55 border-slate-200 text-slate-600 hover:text-slate-950'
            }`}
            title="Toggle Meeting Chat"
          >
            <MessageSquare size={16} />
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'whiteboard' ? null : 'whiteboard')}
            className={`p-2.5 rounded-lg border transition-colors ${
              activeTab === 'whiteboard' 
                ? 'bg-brand-600 border-brand-500 text-white' 
                : 'bg-slate-55 border-slate-200 text-slate-600 hover:text-slate-950'
            }`}
            title="Toggle Collaborative Canvas"
          >
            <Edit3 size={16} />
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'roster' ? null : 'roster')}
            className={`p-2.5 rounded-lg border transition-colors ${
              activeTab === 'roster' 
                ? 'bg-brand-600 border-brand-500 text-white' 
                : 'bg-slate-55 border-slate-200 text-slate-600 hover:text-slate-950'
            }`}
            title="Toggle Participant Roster"
          >
            <Users size={16} />
          </button>
        </div>

        {/* Central calling tracks controllers */}
        <div className="flex items-center gap-3">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full border transition-all active:scale-[0.96] ${
              isMuted 
                ? 'bg-red-500 border-red-400 text-white hover:bg-red-600' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Camera toggle */}
          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full border transition-all active:scale-[0.96] ${
              isCameraOff 
                ? 'bg-red-500 border-red-400 text-white hover:bg-red-600' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? <VideoOff size={18} /> : <Cam size={18} />}
          </button>

          {/* Screen Share toggle */}
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full border transition-all active:scale-[0.96] ${
              isScreenSharing 
                ? 'bg-brand-50 border-brand-200 text-brand-600' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
            title={isScreenSharing ? 'Stop presenting screen' : 'Present screen'}
          >
            <Monitor size={18} />
          </button>

          {/* Hand Raise toggle */}
          <button
            onClick={toggleHandRaise}
            className={`p-3 rounded-full border transition-all active:scale-[0.96] ${
              handRaised 
                ? 'bg-yellow-50 border-yellow-350 text-yellow-750 font-bold shadow-sm' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
            title={handRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <Hand size={18} />
          </button>

          {/* Reactions trigger */}
          <div className="relative">
            <button
              onClick={() => setReactionOpen(!reactionOpen)}
              className={`p-3 rounded-full border transition-all active:scale-[0.96] ${
                reactionOpen ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
              title="Send emoji reaction"
            >
              <Smile size={18} />
            </button>

            {reactionOpen && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white border border-slate-200 p-2 rounded-xl flex gap-1.5 shadow-xl z-30">
                {['👍', '👏', '❤️', '😂', '🎉', '😮'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sendReaction(emoji);
                      setReactionOpen(false);
                    }}
                    className="h-8 w-8 hover:bg-slate-50 rounded flex items-center justify-center text-lg active:scale-[0.9] transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departure Red hangup button */}
        <div>
          <button
            onClick={handleLeaveMeeting}
            className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-600 text-white font-bold flex items-center gap-2 shadow-sm active:scale-[0.97] transition-all"
            title="Leave / End call"
          >
            <PhoneOff size={16} />
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
