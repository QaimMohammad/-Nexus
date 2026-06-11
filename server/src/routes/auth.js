const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/\d/)
  .withMessage('Password must contain at least one number');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).escape(),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    passwordRule,
    body('role').isIn(['entrepreneur', 'investor']).withMessage('Role must be entrepreneur or investor')
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').optional().isIn(['entrepreneur', 'investor'])
  ],
  validate,
  ctrl.login
);

router.post(
  '/verify-otp',
  [
    body('userId').isMongoId().withMessage('Invalid user id'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
  ],
  validate,
  ctrl.verifyOtp
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('A valid email is required').normalizeEmail()],
  validate,
  ctrl.forgotPassword
);

router.post(
  '/reset-password',
  [body('token').trim().notEmpty().withMessage('Reset token is required'), passwordRule],
  validate,
  ctrl.resetPassword
);

router.get('/me', protect, ctrl.me);

module.exports = router;
