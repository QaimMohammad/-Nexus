const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Base64 data URL of the drawn/uploaded signature image
    signatureData: { type: String, required: true },
    signedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    // Path on disk (local storage driver). Swap for an S3 key when using cloud storage.
    storagePath: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'final', 'signed'],
      default: 'draft'
    },
    signatures: { type: [signatureSchema], default: [] }
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.storagePath; // internal detail, not exposed to clients
        return ret;
      }
    }
  }
);

documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ sharedWith: 1 });

module.exports = mongoose.model('Document', documentSchema);
