const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production';

/**
 * Socket.IO layer:
 *  - presence            (user:online / user:offline)
 *  - real-time chat      (chat:send -> chat:message)
 *  - WebRTC signaling    (video:* events relay offers/answers/ICE candidates)
 *
 * Clients authenticate by passing the JWT in `auth.token` on connection.
 */
function registerSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Personal room lets REST controllers and other sockets reach this user
    socket.join(`user:${userId}`);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.broadcast.emit('user:online', { userId });

    // ---- Chat ----
    socket.on('chat:send', async ({ receiverId, content }, ack) => {
      try {
        if (!receiverId || !content?.trim()) {
          return ack?.({ success: false, message: 'receiverId and content are required' });
        }
        const message = await Message.create({
          senderId: userId,
          receiverId,
          content: content.trim().slice(0, 5000)
        });
        const payload = message.toJSON();
        io.to(`user:${receiverId}`).emit('chat:message', payload);
        ack?.({ success: true, message: payload });
      } catch (err) {
        ack?.({ success: false, message: 'Failed to send message' });
      }
    });

    // ---- WebRTC signaling ----
    socket.on('video:join-room', ({ roomId }) => {
      if (!roomId) return;
      socket.join(`room:${roomId}`);
      // Tell existing peers someone joined; they initiate offers to the new peer
      socket.to(`room:${roomId}`).emit('video:user-joined', {
        socketId: socket.id,
        userId,
        userName: socket.userName
      });
    });

    socket.on('video:offer', ({ roomId, targetSocketId, offer }) => {
      io.to(targetSocketId).emit('video:offer', {
        from: socket.id,
        userId,
        userName: socket.userName,
        offer
      });
    });

    socket.on('video:answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('video:answer', { from: socket.id, answer });
    });

    socket.on('video:ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('video:ice-candidate', { from: socket.id, candidate });
    });

    socket.on('video:toggle', ({ roomId, kind, enabled }) => {
      socket.to(`room:${roomId}`).emit('video:peer-toggled', {
        socketId: socket.id,
        kind, // 'audio' | 'video'
        enabled
      });
    });

    socket.on('video:leave-room', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('video:user-left', { socketId: socket.id, userId });
    });

    // ---- Disconnect ----
    socket.on('disconnecting', () => {
      // Notify any video rooms this socket was part of
      for (const room of socket.rooms) {
        if (room.startsWith('room:')) {
          socket.to(room).emit('video:user-left', { socketId: socket.id, userId });
        }
      }
    });

    socket.on('disconnect', async () => {
      // Only mark offline when no other tabs/devices remain connected
      const remaining = await io.in(`user:${userId}`).fetchSockets();
      if (remaining.length === 0) {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        socket.broadcast.emit('user:offline', { userId });
      }
    });
  });
}

module.exports = registerSocketHandlers;
