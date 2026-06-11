const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const User = require('../models/User');

const POPULATE = [
  { path: 'owner', select: 'name avatarUrl role' },
  { path: 'sharedWith', select: 'name avatarUrl role' },
  { path: 'signatures.user', select: 'name avatarUrl role' }
];

function canAccess(doc, userId) {
  const id = userId.toString();
  return (
    doc.owner._id?.toString() === id ||
    doc.owner.toString?.() === id ||
    doc.sharedWith.some((u) => (u._id ? u._id.toString() : u.toString()) === id)
  );
}

// POST /api/documents  (multipart, field name: "file")
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const doc = await Document.create({
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
      owner: req.user._id
    });
    await doc.populate(POPULATE);

    res.status(201).json({ success: true, data: { document: doc } });
  } catch (err) {
    next(err);
  }
};

// GET /api/documents  (owned + shared with me)
exports.listDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({
      $or: [{ owner: req.user._id }, { sharedWith: req.user._id }]
    })
      .sort({ createdAt: -1 })
      .populate(POPULATE);

    res.json({ success: true, data: { documents: docs } });
  } catch (err) {
    next(err);
  }
};

// GET /api/documents/:id/download  (also used for inline preview)
exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || !canAccess(doc, req.user._id)) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    if (!fs.existsSync(doc.storagePath)) {
      return res.status(410).json({ success: false, message: 'File is no longer available on storage' });
    }

    res.setHeader('Content-Type', doc.mimeType);
    const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(doc.originalName)}"`
    );
    fs.createReadStream(doc.storagePath).pipe(res);
  } catch (err) {
    next(err);
  }
};

// PUT /api/documents/:id/share  { userId }
exports.shareDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const target = await User.findById(req.body.userId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User to share with not found' });
    }

    if (!doc.sharedWith.some((id) => id.toString() === target._id.toString())) {
      doc.sharedWith.push(target._id);
      await doc.save();
    }
    await doc.populate(POPULATE);

    res.json({ success: true, data: { document: doc } });
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/:id/sign  { signature: dataURL }
exports.signDocument = async (req, res, next) => {
  try {
    const { signature } = req.body;
    if (!signature || !/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(signature)) {
      return res
        .status(422)
        .json({ success: false, message: 'Signature must be a base64 image data URL' });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc || !canAccess(doc, req.user._id)) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    if (doc.signatures.some((s) => s.user.toString() === req.user._id.toString())) {
      return res.status(409).json({ success: false, message: 'You have already signed this document' });
    }

    doc.signatures.push({ user: req.user._id, signatureData: signature });
    doc.status = 'signed';
    await doc.save();
    await doc.populate(POPULATE);

    res.json({ success: true, data: { document: doc } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/documents/:id  { name?, status? }  (owner only)
exports.updateDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (req.body.name) doc.name = req.body.name;
    if (req.body.status && ['draft', 'in_review', 'final'].includes(req.body.status)) {
      doc.status = req.body.status;
    }
    await doc.save();
    await doc.populate(POPULATE);

    res.json({ success: true, data: { document: doc } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/documents/:id  (owner only)
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    await doc.deleteOne();
    fs.promises.unlink(doc.storagePath).catch(() => {});

    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};
