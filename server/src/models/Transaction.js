const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'transfer'],
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive']
    },
    // The wallet owner this transaction belongs to
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Counterparty for transfers
    counterparty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    direction: { type: String, enum: ['in', 'out'], required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    note: { type: String, default: '', maxlength: 500 },
    failureReason: { type: String, default: '' },
    // Mock payment-provider reference (Stripe-style id)
    reference: {
      type: String,
      default: () => `txn_${crypto.randomBytes(10).toString('hex')}`
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

transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
