const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/messages/conversations
exports.listConversations = async (req, res, next) => {
  try {
    const myId = req.user._id;

    // Latest message per counterparty plus unread count
    const conversations = await Message.aggregate([
      { $match: { $or: [{ senderId: myId }, { receiverId: myId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', myId] }, '$receiverId', '$senderId']
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', myId] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    const userIds = conversations.map((c) => c._id);
    const users = await User.find({ _id: { $in: userIds } });
    const usersById = new Map(users.map((u) => [u._id.toString(), u]));

    const data = conversations
      .filter((c) => usersById.has(c._id.toString()))
      .map((c) => ({
        user: usersById.get(c._id.toString()),
        unreadCount: c.unreadCount,
        lastMessage: {
          id: c.lastMessage._id.toString(),
          senderId: c.lastMessage.senderId,
          receiverId: c.lastMessage.receiverId,
          content: c.lastMessage.content,
          isRead: c.lastMessage.isRead,
          timestamp: c.lastMessage.createdAt
        }
      }));

    res.json({ success: true, data: { conversations: data } });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/:userId
exports.getMessagesWith = async (req, res, next) => {
  try {
    const otherId = new mongoose.Types.ObjectId(req.params.userId);
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });

    // Opening a conversation marks incoming messages as read
    await Message.updateMany(
      { senderId: otherId, receiverId: myId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, data: { messages } });
  } catch (err) {
    next(err);
  }
};

// POST /api/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      content
    });

    // Push to the recipient in real time if they are connected
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${receiverId}`).emit('chat:message', message.toJSON());
    }

    res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    next(err);
  }
};
