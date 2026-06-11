const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    entrepreneurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: [true, 'Message is required'], maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
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

collaborationRequestSchema.index({ entrepreneurId: 1, status: 1 });
collaborationRequestSchema.index({ investorId: 1, entrepreneurId: 1 }, { unique: false });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);
