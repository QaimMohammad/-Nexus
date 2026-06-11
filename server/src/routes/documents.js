const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const upload = require('../config/upload');
const ctrl = require('../controllers/documentController');

router.use(protect);

router.post('/', upload.single('file'), ctrl.uploadDocument);
router.get('/', ctrl.listDocuments);
router.get('/:id/download', ctrl.downloadDocument);

router.put(
  '/:id/share',
  [body('userId').isMongoId().withMessage('Invalid user id')],
  validate,
  ctrl.shareDocument
);

router.post(
  '/:id/sign',
  [body('signature').notEmpty().withMessage('Signature is required')],
  validate,
  ctrl.signDocument
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 255 }).escape(),
    body('status').optional().isIn(['draft', 'in_review', 'final'])
  ],
  validate,
  ctrl.updateDocument
);

router.delete('/:id', ctrl.deleteDocument);

module.exports = router;
