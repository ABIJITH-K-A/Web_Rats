import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { serializeDocument } from '../lib/serialize.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';
import { getAssignedWorkerIds, getOrderStatusLabel } from '../lib/orderStatus.js';
import { isAdminLikeRole, normalizeValue } from '../lib/roles.js';

const router = Router();

const sendMessageSchema = z.object({
  orderId: z.string().trim().min(1).max(128),
  message: z.string().trim().max(4000).optional().default(''),
  fileUrl: z.string().trim().url().optional(),
  type: z.enum(['text', 'file', 'delivery', 'revision']).optional().default('text'),
  fileName: z.string().trim().max(255).optional(),
  previewOnly: z.boolean().optional(),
  downloadable: z.boolean().optional(),
});

const canAccessChat = (order, currentUser) => {
  const assignedWorkerIds = getAssignedWorkerIds(order);
  const clientIds = [order.userId, order.customerId].filter(Boolean);

  if (clientIds.includes(currentUser.uid)) {
    return true;
  }

  if (assignedWorkerIds.includes(currentUser.uid)) {
    return true;
  }

  return isAdminLikeRole(currentUser.role);
};

const getSenderRole = (role) =>
  normalizeValue(role) === 'client' ? 'client' : 'worker';

const buildLastMessageText = ({ type, message, fileName }) => {
  if (message) {
    return message;
  }

  if (type === 'delivery') {
    return 'Work uploaded for review';
  }

  if (type === 'revision') {
    return 'Revision requested';
  }

  if (fileName) {
    return `File shared: ${fileName}`;
  }

  return 'New message';
};

router.get(
  '/:orderId',
  authGuard,
  asyncHandler(async (req, res) => {
    const orderSnapshot = await adminDb().collection('orders').doc(req.params.orderId).get();

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() };
    if (!canAccessChat(order, req.currentUser)) {
      throw new HttpError(403, 'You do not have access to this chat.');
    }

    const [threadSnapshot, messageSnapshot] = await Promise.all([
      adminDb().collection('chatThreads').doc(req.params.orderId).get(),
      adminDb()
        .collection('messages')
        .where('orderId', '==', req.params.orderId)
        .orderBy('createdAt', 'asc')
        .limit(200)
        .get(),
    ]);

    res.json({
      order: {
        id: orderSnapshot.id,
        status: getOrderStatusLabel(order.statusKey || order.status),
      },
      thread: threadSnapshot.exists ? serializeDocument(threadSnapshot) : null,
      messages: messageSnapshot.docs.map((docSnapshot) => serializeDocument(docSnapshot)),
    });
  })
);

router.post(
  '/:orderId/init',
  authGuard,
  asyncHandler(async (req, res) => {
    const orderSnapshot = await adminDb().collection('orders').doc(req.params.orderId).get();

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() };
    if (!canAccessChat(order, req.currentUser)) {
      throw new HttpError(403, 'You do not have access to this chat.');
    }

    const threadRef = adminDb().collection('chatThreads').doc(req.params.orderId);
    const threadSnapshot = await threadRef.get();

    if (threadSnapshot.exists) {
      res.json({ exists: true });
      return;
    }

    await threadRef.set({
      orderId: req.params.orderId,
      clientId: order.customerId || order.userId || null,
      workerIds: getAssignedWorkerIds(order),
      lastMessage: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ created: true });
  })
);

router.post(
  '/send',
  authGuard,
  validateBody(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const { orderId, message, fileUrl, type, fileName, previewOnly, downloadable } = req.validatedBody;
    const { uid, role, profile, email } = req.currentUser;

    if (!message && !fileUrl) {
      throw new HttpError(400, 'Message text or fileUrl is required.');
    }

    const orderSnapshot = await adminDb().collection('orders').doc(orderId).get();
    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() };
    if (!canAccessChat(order, req.currentUser)) {
      throw new HttpError(403, 'You do not have access to this chat.');
    }

    const senderRole = getSenderRole(role);
    const senderName = profile?.name || email || 'Team Member';
    const messagePayload = {
      orderId,
      senderId: uid,
      senderRole,
      senderName,
      message: message || '',
      fileUrl: fileUrl || '',
      type,
      ...(fileName ? { fileName } : {}),
      ...(typeof previewOnly === 'boolean' ? { previewOnly } : {}),
      ...(typeof downloadable === 'boolean' ? { downloadable } : {}),
      createdAt: FieldValue.serverTimestamp(),
    };

    const messageRef = await adminDb().collection('messages').add(messagePayload);

    await adminDb()
      .collection('chatThreads')
      .doc(orderId)
      .set(
        {
          orderId,
          clientId: order.customerId || order.userId || null,
          workerIds: getAssignedWorkerIds(order),
          lastMessage: {
            text: buildLastMessageText({ type, message, fileName }),
            senderId: uid,
            senderRole,
            createdAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    res.status(201).json({
      id: messageRef.id,
      message: 'Sent',
    });
  })
);

export default router;
