const CollaborationRequest = require('../models/CollaborationRequest');
const User = require('../models/User');

// POST /api/collaborations  (investor -> entrepreneur)
exports.createRequest = async (req, res, next) => {
  try {
    const { entrepreneurId, message } = req.body;

    const target = await User.findById(entrepreneurId);
    if (!target || target.role !== 'entrepreneur') {
      return res.status(404).json({ success: false, message: 'Entrepreneur not found' });
    }

    const existing = await CollaborationRequest.findOne({
      investorId: req.user._id,
      entrepreneurId,
      status: 'pending'
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'You already have a pending request with this entrepreneur' });
    }

    const request = await CollaborationRequest.create({
      investorId: req.user._id,
      entrepreneurId,
      message
    });

    res.status(201).json({ success: true, data: { request } });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaborations  (investor: sent, entrepreneur: received)
exports.listRequests = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'investor'
        ? { investorId: req.user._id }
        : { entrepreneurId: req.user._id };

    const requests = await CollaborationRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('investorId', 'name avatarUrl role bio')
      .populate('entrepreneurId', 'name avatarUrl role startupName');

    res.json({ success: true, data: { requests } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/collaborations/:id  (entrepreneur accepts/rejects)
exports.respondToRequest = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' | 'rejected'

    const request = await CollaborationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.entrepreneurId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'Only the targeted entrepreneur can respond' });
    }
    if (request.status !== 'pending') {
      return res
        .status(409)
        .json({ success: false, message: `Request was already ${request.status}` });
    }

    request.status = status;
    await request.save();

    res.json({ success: true, data: { request } });
  } catch (err) {
    next(err);
  }
};
