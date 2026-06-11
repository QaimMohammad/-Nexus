const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/meetingController');

router.use(protect);

router.post(
  '/',
  [
    body('participantId').isMongoId().withMessage('Invalid participant id'),
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).escape(),
    body('description').optional().trim().isLength({ max: 2000 }).escape(),
    body('startTime').isISO8601().withMessage('startTime must be an ISO date'),
    body('endTime').isISO8601().withMessage('endTime must be an ISO date')
  ],
  validate,
  ctrl.createMeeting
);

router.get('/', ctrl.listMeetings);

router.put(
  '/:id/respond',
  [body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected')],
  validate,
  ctrl.respondToMeeting
);

router.put('/:id/cancel', ctrl.cancelMeeting);

module.exports = router;
