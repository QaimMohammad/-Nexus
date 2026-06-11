const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// GET /api/payments/wallet
exports.getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { balance: user.walletBalance, currency: 'USD' } });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/deposit  { amount }
// Mock card charge: always succeeds (sandbox behaviour)
exports.deposit = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amount } },
      { new: true }
    );

    const transaction = await Transaction.create({
      type: 'deposit',
      amount,
      user: user._id,
      direction: 'in',
      status: 'completed',
      note: req.body.note || 'Wallet deposit (mock card)'
    });

    res.status(201).json({ success: true, data: { transaction, balance: user.walletBalance } });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/withdraw  { amount }
exports.withdraw = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    const user = await User.findById(req.user._id);

    if (user.walletBalance < amount) {
      const failed = await Transaction.create({
        type: 'withdraw',
        amount,
        user: user._id,
        direction: 'out',
        status: 'failed',
        failureReason: 'Insufficient funds',
        note: req.body.note || 'Wallet withdrawal'
      });
      return res.status(422).json({
        success: false,
        message: 'Insufficient funds',
        data: { transaction: failed, balance: user.walletBalance }
      });
    }

    user.walletBalance -= amount;
    await user.save({ validateBeforeSave: false });

    const transaction = await Transaction.create({
      type: 'withdraw',
      amount,
      user: user._id,
      direction: 'out',
      status: 'completed',
      note: req.body.note || 'Wallet withdrawal'
    });

    res.status(201).json({ success: true, data: { transaction, balance: user.walletBalance } });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/transfer  { recipientId, amount, note? }
exports.transfer = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    const { recipientId, note } = req.body;

    if (recipientId === req.user._id.toString()) {
      return res.status(422).json({ success: false, message: 'You cannot transfer to yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const sender = await User.findById(req.user._id);
    if (sender.walletBalance < amount) {
      const failed = await Transaction.create({
        type: 'transfer',
        amount,
        user: sender._id,
        counterparty: recipient._id,
        direction: 'out',
        status: 'failed',
        failureReason: 'Insufficient funds',
        note: note || ''
      });
      return res.status(422).json({
        success: false,
        message: 'Insufficient funds',
        data: { transaction: failed, balance: sender.walletBalance }
      });
    }

    sender.walletBalance -= amount;
    recipient.walletBalance += amount;
    await sender.save({ validateBeforeSave: false });
    await recipient.save({ validateBeforeSave: false });

    const [outTxn] = await Transaction.create([
      {
        type: 'transfer',
        amount,
        user: sender._id,
        counterparty: recipient._id,
        direction: 'out',
        status: 'completed',
        note: note || ''
      },
      {
        type: 'transfer',
        amount,
        user: recipient._id,
        counterparty: sender._id,
        direction: 'in',
        status: 'completed',
        note: note || ''
      }
    ]);

    res.status(201).json({ success: true, data: { transaction: outTxn, balance: sender.walletBalance } });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/transactions
exports.listTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('counterparty', 'name avatarUrl role');

    res.json({ success: true, data: { transactions } });
  } catch (err) {
    next(err);
  }
};
