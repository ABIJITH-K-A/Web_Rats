import { Router } from 'express';
import { adminDb, adminStorage } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import { FieldValue } from 'firebase-admin/firestore';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'video/mp4', 'video/quicktime',
];

const getShortSignedUrl = async (storagePath) => {
  const bucket = adminStorage().bucket();
  const fileRef = bucket.file(storagePath);
  const [url] = await fileRef.getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  return url;
};

// POST /api/upload/:category/:orderId
// categories: reference, preview, revision, final
router.post(
  '/:category/:orderId',
  authGuard,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { category, orderId } = req.params;
    const file = req.file;
    const { uid, role } = req.currentUser;

    if (!file) throw new HttpError(400, 'No file provided.');

    // Validate file type (MIME type check)
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new HttpError(400, `Invalid file type: ${file.mimetype}. Allowed types are: ${ALLOWED_TYPES.join(', ')}`);
    }

    if (!['reference', 'preview', 'revision', 'final'].includes(category)) {
      throw new HttpError(400, 'Invalid category.');
    }

    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');
    const order = orderSnap.data();

    // Permission checks
    if (category === 'reference') {
      if (order.userId !== uid) throw new HttpError(403, 'Only the client can upload references.');
    } else {
      const isAssigned = [order.assignedTo, order.workerAssigned, ...(order.assignedWorkers || [])].includes(uid);
      if (!isAssigned && !['admin', 'manager', 'owner', 'super_admin'].includes(role)) {
        throw new HttpError(403, 'Unauthorized to upload deliverables.');
      }
    }

    const filename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `orders/${orderId}/${category}/${filename}`;
    const bucket = adminStorage().bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const url = await getShortSignedUrl(storagePath);

    const fileRecord = {
      name: file.originalname,
      filename,
      url, // Short-lived
      storagePath,
      size: file.size,
      type: file.mimetype,
      category,
      uploadedBy: uid,
      uploadedAt: FieldValue.serverTimestamp(),
      isLocked: category === 'final' && order.paymentStatus !== 'paid',
    };

    const updateData = {};
    if (category === 'reference') updateData.references = FieldValue.arrayUnion(fileRecord);
    else if (category === 'preview') updateData.previewFiles = FieldValue.arrayUnion(fileRecord);
    else if (category === 'revision') {
      updateData.revisionFiles = FieldValue.arrayUnion(fileRecord);
      updateData.revisionUsed = FieldValue.increment(1);
    }
    else if (category === 'final') updateData.finalFiles = FieldValue.arrayUnion(fileRecord);

    updateData.updatedAt = FieldValue.serverTimestamp();
    await orderRef.update(updateData);

    res.status(201).json({ file: fileRecord });
  })
);

// GET /api/upload/download/:orderId/:category/:filename
router.get(
  '/download/:orderId/:category/:filename',
  authGuard,
  asyncHandler(async (req, res) => {
    const { orderId, category, filename } = req.params;
    const { uid, role } = req.currentUser;

    const orderSnap = await adminDb().collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');
    const order = orderSnap.data();

    // Locking logic
    if (category === 'final' && order.paymentStatus !== 'paid') {
      if (order.userId === uid) {
        throw new HttpError(403, 'Please complete the final payment to download these files.');
      }
    }

    // Access check
    const isClient = order.userId === uid;
    const isStaff = ['admin', 'manager', 'owner', 'super_admin', 'worker'].includes(role);
    if (!isClient && !isStaff) throw new HttpError(403, 'Access denied.');

    const storagePath = `orders/${orderId}/${category}/${filename}`;
    const url = await getShortSignedUrl(storagePath);

    res.json({ url });
  })
);

export default router;
