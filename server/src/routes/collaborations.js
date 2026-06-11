const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/collaborationController');

router.use(protect);

router.post(
  '/',
  authorize('investor'),
  [
    body('entrepreneurId').isMongoId().withMessage('Invalid entrepreneur id'),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).escape()
  ],
  validate,
  ctrl.createRequest
);

router.get('/', ctrl.listRequests);

router.put(
  '/:id',
  authorize('entrepreneur'),
  [body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected')],
  validate,
  ctrl.respondToRequest
);

module.exports = router;
