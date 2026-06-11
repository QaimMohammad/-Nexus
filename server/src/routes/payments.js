const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

const amountRule = body('amount')
  .isFloat({ gt: 0, max: 1000000 })
  .withMessage('Amount must be a positive number (max 1,000,000)')
  .toFloat();

router.use(protect);

router.get('/wallet', ctrl.getWallet);
router.get('/transactions', ctrl.listTransactions);

router.post('/deposit', [amountRule, body('note').optional().trim().isLength({ max: 500 }).escape()], validate, ctrl.deposit);
router.post('/withdraw', [amountRule, body('note').optional().trim().isLength({ max: 500 }).escape()], validate, ctrl.withdraw);
router.post(
  '/transfer',
  [
    amountRule,
    body('recipientId').isMongoId().withMessage('Invalid recipient id'),
    body('note').optional().trim().isLength({ max: 500 }).escape()
  ],
  validate,
  ctrl.transfer
);

module.exports = router;
