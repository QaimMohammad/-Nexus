const crypto = require('crypto');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    res.status(201).json({ success: true, data: { token: signToken(user), user } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (role && user.role !== role) {
      return res
        .status(401)
        .json({ success: false, message: `No ${role} account found for this email` });
    }

    // 2FA: instead of a token, issue a one-time code and ask for verification
    if (user.twoFactorEnabled) {
      const otp = String(crypto.randomInt(100000, 1000000));
      user.otpCode = hash(otp);
      user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
      await user.save({ validateBeforeSave: false });

      const { mocked } = await sendEmail({
        to: user.email,
        subject: 'Your Business Nexus verification code',
        text: `Your one-time verification code is ${otp}. It expires in 10 minutes.`
      });

      return res.json({
        success: true,
        data: {
          requiresOtp: true,
          userId: user._id.toString(),
          // Surfaced only when no SMTP is configured so the demo flow works
          ...(mocked && process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {})
        }
      });
    }

    res.json({ success: true, data: { token: signToken(user), user } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otpCode +otpExpires');
    if (!user || !user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(401).json({ success: false, message: 'Code expired, please log in again' });
    }
    if (hash(otp) !== user.otpCode) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: { token: signToken(user), user } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond 200 so the endpoint can't be used to enumerate accounts
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email is registered, reset instructions have been sent'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hash(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0]}/reset-password?token=${resetToken}`;
    const { mocked } = await sendEmail({
      to: user.email,
      subject: 'Reset your Business Nexus password',
      text: `Reset your password using this link (valid 30 minutes): ${resetUrl}`
    });

    res.json({
      success: true,
      message: 'If that email is registered, reset instructions have been sent',
      ...(mocked && process.env.NODE_ENV !== 'production' ? { devResetToken: resetToken } : {})
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: hash(token),
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};
