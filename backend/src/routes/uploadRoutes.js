import { FieldValue } from 'firebase-admin/firestore';
import multer from 'multer';
import { Router } from 'express';
import { adminDb, adminStorage } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import { buildOrderStatusPatch, getAssignedWorkerIds } from '../lib/orderStatus.js';
import { normalizeValue } from '../lib/roles.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'video/mp4',
  'video/quicktime',
]);

const getSignedUrl = async (storagePath) => {
  const [url] = await adminStorage().bucket().file(storagePath).getSignedUrl({
    action: 'read',
    expires: new Date('2035-01-01T00:00:00.000Z'),
  });

  return url;
};

const canUploadReference = (order, currentUser) =>
  [order.userId, order.customerId].filter(Boolean).includes(currentUser.uid);

const canUploadDelivery = (order, currentUser) => {
  if (normalizeValue(currentUser.role) === 'owner') {
    return true;
  }

  return getAssignedWorkerIds(order).includes(currentUser.uid);
};

router.post(
  '/',
  authGuard,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    const orderId = String(req.body.orderId || '').trim();
    const uploadType = String(req.body.uploadType || '').trim().toLowerCase();
    const message = String(req.body.message || '').trim();

    if (!file) {
      throw new HttpError(400, 'File is required.');
    }

    if (!orderId) {
      throw new HttpError(400, 'orderId is required.');
    }

    if (!['reference', 'delivery'].includes(uploadType)) {
      throw new HttpError(400, 'uploadType must be either "reference" or "delivery".');
    }

    if (!ALLOWED_TYPES.has(file.mimetype)) {
      throw new HttpError(400, `Unsupported file type: ${file.mimetype}`);
    }

    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() };

    if (uploadType === 'reference' && !canUploadReference(order, req.currentUser)) {
      throw new HttpError(403, 'Only the client can upload reference files.');
    }

    if (uploadType === 'delivery' && !canUploadDelivery(order, req.currentUser)) {
      throw new HttpError(403, 'Only the assigned worker can upload delivery files.');
    }

    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${safeFileName}`;
    const storagePath = `orders/${orderId}/${uploadType}/${fileName}`;

    await adminStorage().bucket().file(storagePath).save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const fileUrl = await getSignedUrl(storagePath);
    const versionSnapshot = await adminDb()
      .collection('uploads')
      .where('orderId', '==', orderId)
      .where('uploadType', '==', uploadType)
      .get();

    const previewOnly = uploadType === 'delivery';
    const downloadable = uploadType !== 'delivery';
    const version = versionSnapshot.size + 1;

    const uploadPayload = {
      orderId,
      uploadedBy: req.currentUser.uid,
      fileUrl,
      previewOnly,
      downloadable,
      version,
      uploadType,
      fileName: file.originalname,
      mimeType: file.mimetype,
      storagePath,
      createdAt: FieldValue.serverTimestamp(),
    };

    const uploadRef = await adminDb().collection('uploads').add(uploadPayload);

    const senderRole = normalizeValue(req.currentUser.role) === 'client' ? 'client' : 'worker';
    const messageType = uploadType === 'delivery' ? 'delivery' : 'file';
    const messagePayload = {
      orderId,
      senderId: req.currentUser.uid,
      senderRole,
      senderName: req.currentUser.profile?.name || req.currentUser.email || 'Team Member',
      message:
        message ||
        (uploadType === 'delivery' ? 'Work uploaded for review' : `File shared: ${file.originalname}`),
      fileUrl,
      type: messageType,
      fileName: file.originalname,
      previewOnly,
      downloadable,
      uploadId: uploadRef.id,
      createdAt: FieldValue.serverTimestamp(),
    };

    const chatMessageRef = await adminDb().collection('messages').add(messagePayload);

    await adminDb()
      .collection('chatThreads')
      .doc(orderId)
      .set(
        {
          orderId,
          clientId: order.customerId || order.userId || null,
          workerIds: getAssignedWorkerIds(order),
          lastMessage: {
            text: messagePayload.message,
            senderId: req.currentUser.uid,
            senderRole,
            createdAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    if (uploadType === 'delivery') {
      await orderRef.set(buildOrderStatusPatch('delivered_preview'), { merge: true });
    }

    res.status(201).json({
      upload: {
        id: uploadRef.id,
        ...uploadPayload,
        fileUrl,
      },
      message: {
        id: chatMessageRef.id,
        ...messagePayload,
        fileUrl,
      },
    });
  })
);

export default router;
