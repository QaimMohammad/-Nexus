const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: [true, 'Message content is required'], maxlength: 5000 },
    isRead: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        // Frontend expects a `timestamp` field
        ret.timestamp = ret.createdAt;
        delete ret._id;
        return ret;
      }
    }
  }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
