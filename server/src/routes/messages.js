const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/messageController');

router.use(protect);

router.get('/conversations', ctrl.listConversations);

router.get(
  '/:userId',
  [param('userId').isMongoId().withMessage('Invalid user id')],
  validate,
  ctrl.getMessagesWith
);

router.post(
  '/',
  [
    body('receiverId').isMongoId().withMessage('Invalid recipient id'),
    body('content').trim().notEmpty().withMessage('Message cannot be empty').isLength({ max: 5000 }).escape()
  ],
  validate,
  ctrl.sendMessage
);

module.exports = router;
