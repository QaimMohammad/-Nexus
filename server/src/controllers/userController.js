const User = require('../models/User');

// Fields a user may edit on their own profile
const EDITABLE_FIELDS = [
  'name',
  'avatarUrl',
  'bio',
  'twoFactorEnabled',
  // entrepreneur
  'startupName',
  'pitchSummary',
  'fundingNeeded',
  'industry',
  'location',
  'foundedYear',
  'teamSize',
  // investor
  'investmentInterests',
  'investmentStage',
  'portfolioCompanies',
  'totalInvestments',
  'minimumInvestment',
  'maximumInvestment'
];

// GET /api/users?role=investor|entrepreneur&search=...
exports.listUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      const re = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { startupName: re }, { industry: re }, { bio: re }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id  (self only)
exports.updateUser = async (req, res, next) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own profile' });
    }

    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
