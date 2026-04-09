import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { buildOrderStatusPatch, getAssignedWorkerIds } from '../lib/orderStatus.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';
import { dispatchNotification } from '../services/notificationDispatcher.js';

const router = Router();

const requestRevisionSchema = z.object({
  orderId: z.string().trim().min(1).max(128),
  message: z.string().trim().min(5).max(3000),
});

router.post(
  '/request',
  authGuard,
  validateBody(requestRevisionSchema),
  asyncHandler(async (req, res) => {
    const { orderId, message } = req.validatedBody;
    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() };
    const clientIds = [order.userId, order.customerId].filter(Boolean);

    if (!clientIds.includes(req.currentUser.uid)) {
      throw new HttpError(403, 'Only the client can request a revision.');
    }

    const revisionLimit = Number(order.revisionLimit ?? 1);
    const revisionsUsed = Number(order.revisionsUsed ?? 0);
    const paidRevisionCredits = Number(order.paidRevisionCredits ?? 0);
    const hasIncludedRevision = revisionsUsed < revisionLimit;
    const hasPaidRevisionCredit = paidRevisionCredits > 0;

    if (!hasIncludedRevision && !hasPaidRevisionCredit) {
      res.status(402).json({
        requiresPayment: true,
        amount: 20,
        revisionLimit,
        revisionsUsed,
      });
      return;
    }

    const revisionRef = adminDb().collection('revisions').doc();
    const chatMessageRef = adminDb().collection('messages').doc();
    const batch = adminDb().batch();

    batch.set(revisionRef, {
      orderId,
      message,
      requestedBy: req.currentUser.uid,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    batch.set(chatMessageRef, {
      orderId,
      senderId: req.currentUser.uid,
      senderRole: 'client',
      senderName: req.currentUser.profile?.name || req.currentUser.email || 'Client',
      message,
      type: 'revision',
      revisionId: revisionRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    batch.set(
      orderRef,
      {
        ...buildOrderStatusPatch('revision_requested'),
        revisionsUsed: FieldValue.increment(1),
        ...(hasPaidRevisionCredit ? { paidRevisionCredits: FieldValue.increment(-1) } : {}),
      },
      { merge: true }
    );

    batch.set(
      adminDb().collection('chatThreads').doc(orderId),
      {
        orderId,
        clientId: order.customerId || order.userId || null,
        workerIds: getAssignedWorkerIds(order),
        lastMessage: {
          text: 'Revision requested',
          senderId: req.currentUser.uid,
          senderRole: 'client',
          createdAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    const workerIds = getAssignedWorkerIds(order);
    await Promise.all(
      workerIds.map((workerId) =>
        dispatchNotification(workerId, 'revisionRequested', {
          orderId: order.id.slice(-8).toUpperCase(),
          service: order.service,
          customerName: req.currentUser.profile?.name || req.currentUser.email || 'Client',
          message: `Client requested revision for Order #${order.id.slice(-8).toUpperCase()}`,
        })
      )
    );

    res.status(201).json({
      revision: {
        id: revisionRef.id,
        orderId,
        message,
        requestedBy: req.currentUser.uid,
        status: 'pending',
      },
    });
  })
);

export default router;
