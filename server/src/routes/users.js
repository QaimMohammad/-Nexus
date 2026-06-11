const router = require('express').Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.use(protect);

router.get(
  '/',
  [query('role').optional().isIn(['entrepreneur', 'investor'])],
  validate,
  ctrl.listUsers
);

router.get('/:id', ctrl.getUser);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }).escape(),
    body('bio').optional().trim().isLength({ max: 1000 }).escape(),
    body('startupName').optional().trim().isLength({ max: 200 }).escape(),
    body('pitchSummary').optional().trim().isLength({ max: 2000 }).escape(),
    body('avatarUrl').optional().trim().isURL().withMessage('Avatar must be a valid URL'),
    body('foundedYear').optional().isInt({ min: 1900, max: 2100 }).toInt(),
    body('teamSize').optional().isInt({ min: 0 }).toInt(),
    body('totalInvestments').optional().isInt({ min: 0 }).toInt(),
    body('twoFactorEnabled').optional().isBoolean().toBoolean(),
    body('investmentInterests').optional().isArray(),
    body('investmentStage').optional().isArray(),
    body('portfolioCompanies').optional().isArray()
  ],
  validate,
  ctrl.updateUser
);

module.exports = router;
