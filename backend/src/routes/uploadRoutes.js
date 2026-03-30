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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'video/mp4', 'video/quicktime',
];

// POST /api/upload/reference/:orderId
// Client uploads order reference files during booking
router.post(
  '/reference/:orderId',
  authGuard,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const file = req.file;

    if (!file) throw new HttpError(400, 'No file provided.');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new HttpError(400, 'File type not allowed.');
    }

    // Verify requester is the order client
    const orderSnap = await adminDb().collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');
    if (orderSnap.data().userId !== req.currentUser.uid) {
      throw new HttpError(403, 'Only the client can upload references.');
    }

    const filename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `orders/${orderId}/references/${filename}`;
    const bucket = adminStorage().bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    });

    const fileRecord = {
      name: file.originalname,
      filename,
      url,
      storagePath,
      size: file.size,
      type: file.mimetype,
      uploadedBy: req.currentUser.uid,
      uploadedAt: FieldValue.serverTimestamp(),
    };

    await adminDb().collection('orders').doc(orderId).update({
      references: FieldValue.arrayUnion(fileRecord),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ file: fileRecord });
  })
);

// POST /api/upload/deliverable/:orderId
// Worker uploads final deliverable
router.post(
  '/deliverable/:orderId',
  authGuard,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const file = req.file;

    if (!file) throw new HttpError(400, 'No file provided.');

    const orderSnap = await adminDb().collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');

    const order = orderSnap.data();
    const isAssigned = [
      order.assignedTo,
      order.workerAssigned,
      ...(order.assignedWorkers || [])
    ].includes(req.currentUser.uid);

    if (!isAssigned) throw new HttpError(403, 'Only the assigned worker can upload deliverables.');

    const filename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `orders/${orderId}/deliverables/${filename}`;
    const bucket = adminStorage().bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    });

    const fileRecord = {
      name: file.originalname,
      filename,
      url,
      storagePath,
      size: file.size,
      type: file.mimetype,
      uploadedBy: req.currentUser.uid,
      uploadedAt: FieldValue.serverTimestamp(),
      downloaded: false,
      downloadedAt: null,
    };

    await adminDb().collection('orders').doc(orderId).update({
      deliverables: FieldValue.arrayUnion(fileRecord),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ file: fileRecord });
  })
);

// PATCH /api/upload/downloaded/:orderId
// Client marks deliverable as downloaded — starts 24hr chat deletion timer
router.patch(
  '/downloaded/:orderId',
  authGuard,
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { filename } = req.body;

    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');
    if (orderSnap.data().userId !== req.currentUser.uid) {
      throw new HttpError(403, 'Only the client can confirm download.');
    }

    const order = orderSnap.data();
    const updatedDeliverables = (order.deliverables || []).map((f) =>
      f.filename === filename
        ? { ...f, downloaded: true, downloadedAt: new Date().toISOString() }
        : f
    );

    const allDownloaded = updatedDeliverables.every((f) => f.downloaded);

    await orderRef.update({
      deliverables: updatedDeliverables,
      ...(allDownloaded ? {
        chatDeletionScheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.json({ success: true, chatDeletionScheduled: allDownloaded });
  })
);

export default router;
