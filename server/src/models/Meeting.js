const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    startTime: { type: Date, required: [true, 'Start time is required'] },
    endTime: { type: Date, required: [true, 'End time is required'] },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    },
    // Room id used by the WebRTC signaling layer when the meeting goes live
    roomId: { type: String, required: true }
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    }
  }
);

meetingSchema.index({ organizer: 1, startTime: 1 });
meetingSchema.index({ participant: 1, startTime: 1 });

/**
 * Returns meetings that overlap [startTime, endTime) for the given user ids,
 * counting only meetings that still occupy the slot (pending or accepted).
 */
meetingSchema.statics.findConflicts = function (userIds, startTime, endTime, excludeId) {
  const query = {
    status: { $in: ['pending', 'accepted'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    $or: [{ organizer: { $in: userIds } }, { participant: { $in: userIds } }]
  };
  if (excludeId) query._id = { $ne: excludeId };
  return this.find(query);
};

module.exports = mongoose.model('Meeting', meetingSchema);
