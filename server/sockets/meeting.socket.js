const Message = require('../models/Message');
const Whiteboard = require('../models/Whiteboard');
const Meeting = require('../models/Meeting');
const Participant = require('../models/Participant');

module.exports = (io) => {
  const socketToRoom = {};
  const roomToSockets = {}; // Map of roomCode -> Array of { socketId, user }

  io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id}`);

    // Join room event
    socket.on('join-room', async ({ meetingCode, user }) => {
      if (!meetingCode || !user) return;

      const code = meetingCode.toLowerCase();
      socket.join(code);
      socketToRoom[socket.id] = { meetingCode: code, user };

      if (!roomToSockets[code]) {
        roomToSockets[code] = [];
      }

      // Add socket to directory
      roomToSockets[code].push({ socketId: socket.id, user });

      // Save participant to database
      try {
        const meeting = await Meeting.findOne({ meetingCode: code });
        if (meeting) {
          const userId = user._id || user.id;
          const existingParticipant = await Participant.findOne({
            meeting: meeting._id,
            user: userId
          });
          
          if (!existingParticipant) {
            await Participant.create({
              meeting: meeting._id,
              user: userId,
              role: meeting.host.toString() === userId.toString() ? 'host' : 'participant',
              status: 'joined',
              joinTime: new Date()
            });
          } else {
            existingParticipant.status = 'joined';
            existingParticipant.joinTime = new Date();
            await existingParticipant.save();
          }
        }
      } catch (err) {
        console.error('[Socket] Error updating participant join db:', err.message);
      }

      // Notify other active peers in room
      socket.to(code).emit('user-joined', {
        socketId: socket.id,
        user
      });

      // Return existing participants to the joiner
      const usersInRoom = roomToSockets[code].filter((item) => item.socketId !== socket.id);
      socket.emit('all-users', usersInRoom);

      // Load persistent whiteboard state
      try {
        const meeting = await Meeting.findOne({ meetingCode: code });
        if (meeting) {
          const wb = await Whiteboard.findOne({ meeting: meeting._id });
          if (wb) {
            socket.emit('whiteboard-state', wb.elements);
          }
        }
      } catch (err) {
        console.error('[Socket] Error reading whiteboard state:', err.message);
      }
    });

    // WebRTC signaling transit
    socket.on('send-signal', ({ targetSocketId, signal }) => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      io.to(targetSocketId).emit('user-signaled', {
        callerSocketId: socket.id,
        signal,
        user: roomUser.user
      });
    });

    socket.on('return-signal', ({ targetSocketId, signal }) => {
      io.to(targetSocketId).emit('received-returned-signal', {
        senderSocketId: socket.id,
        signal
      });
    });

    // Message chat transit
    socket.on('send-message', async ({ meetingId, text, fileId }) => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      try {
        const messageData = {
          meeting: meetingId,
          sender: roomUser.user._id || roomUser.user.id,
          messageType: fileId ? 'file' : 'text'
        };

        if (text) messageData.text = text;
        if (fileId) messageData.file = fileId;

        const message = await Message.create(messageData);
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email avatar')
          .populate('file');

        io.to(roomUser.meetingCode).emit('receive-message', populatedMessage);
      } catch (error) {
        console.error('[Socket] Error storing message:', error.message);
      }
    });

    // Chat Typing Indicator
    socket.on('typing', ({ isTyping }) => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      socket.to(roomUser.meetingCode).emit('user-typing', {
        userId: roomUser.user._id || roomUser.user.id,
        userName: roomUser.user.name,
        isTyping
      });
    });

    // Media states toggling
    socket.on('toggle-mute', ({ isMuted }) => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      socket.to(roomUser.meetingCode).emit('user-muted', {
        socketId: socket.id,
        isMuted
      });
    });

    socket.on('toggle-camera', ({ isCameraOff }) => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      socket.to(roomUser.meetingCode).emit('user-camera-toggled', {
        socketId: socket.id,
        isCameraOff
      });
    });

    socket.on('raise-hand', ({ handRaised }) => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      socket.to(roomUser.meetingCode).emit('user-hand-raised', {
        socketId: socket.id,
        handRaised
      });
    });

    socket.on('send-reaction', ({ reaction }) => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      io.to(roomUser.meetingCode).emit('user-reaction', {
        socketId: socket.id,
        reaction
      });
    });

    // Whiteboard drawing synchronizer
    socket.on('draw-element', async ({ elements }) => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      // Broadcast drawing data to other peers
      socket.to(roomUser.meetingCode).emit('element-drawn', elements);

      // Save canvas state in database
      try {
        const meeting = await Meeting.findOne({ meetingCode: roomUser.meetingCode });
        if (meeting) {
          await Whiteboard.findOneAndUpdate(
            { meeting: meeting._id },
            { elements },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        console.error('[Socket] Error updating whiteboard elements db:', err.message);
      }
    });

    socket.on('clear-canvas', async () => {
      const roomUser = socketToRoom[socket.id];
      if (!roomUser) return;

      socket.to(roomUser.meetingCode).emit('canvas-cleared');

      try {
        const meeting = await Meeting.findOne({ meetingCode: roomUser.meetingCode });
        if (meeting) {
          await Whiteboard.findOneAndUpdate(
            { meeting: meeting._id },
            { elements: [] }
          );
        }
      } catch (err) {
        console.error('[Socket] Error resetting whiteboard canvas elements:', err.message);
      }
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      const roomUser = socketToRoom[socket.id];
      if (roomUser) {
        const { meetingCode, user } = roomUser;
        if (roomToSockets[meetingCode]) {
          roomToSockets[meetingCode] = roomToSockets[meetingCode].filter(
            (item) => item.socketId !== socket.id
          );
          if (roomToSockets[meetingCode].length === 0) {
            delete roomToSockets[meetingCode];
          }
        }
        
        // Update database participant status & leave time
        try {
          const meeting = await Meeting.findOne({ meetingCode });
          if (meeting) {
            await Participant.findOneAndUpdate(
              { meeting: meeting._id, user: user._id || user.id },
              { status: 'left', leaveTime: new Date() }
            );
          }
        } catch (err) {
          console.error('[Socket] Error updating participant leave db:', err.message);
        }

        socket.to(meetingCode).emit('user-left', socket.id);
        delete socketToRoom[socket.id];
      }
      console.log(`[Socket] Disconnected client: ${socket.id}`);
    });
  });
};
