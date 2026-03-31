import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { getAssignedWorkerIds } from '../lib/orderStatus.js';
import { isAdminLikeRole } from '../lib/roles.js';
import { serializeDocument } from '../lib/serialize.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const createDisputeSchema = z.object({
  orderId: z.string().trim().min(4).max(128),
  type: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(4000),
  requestedAmount: z.preprocess(
    (value) => Number(value || 0),
    z.number().finite().min(0)
  ).optional().default(0),
});

const resolveDisputeSchema = z.object({
  disputeId: z.string().trim().min(4).max(128),
  resolution: z.string().trim().min(2).max(80),
  refundAmount: z.preprocess(
    (value) => Number(value || 0),
    z.number().finite().min(0)
  ).optional().default(0),
  penaltyAmount: z.preprocess(
    (value) => Number(value || 0),
    z.number().finite().min(0)
  ).optional().default(0),
});

router.post(
  '/create',
  authGuard,
  validateBody(createDisputeSchema),
  asyncHandler(async (req, res) => {
    const { orderId, type, description, requestedAmount } = req.validatedBody;
    const orderSnapshot = await adminDb().collection('orders').doc(orderId).get();

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() };
    const assignedWorkers = getAssignedWorkerIds(order);
    const disputeRef = await adminDb().collection('disputes').add({
      orderId,
      orderDisplayId: orderId.slice(-8).toUpperCase(),
      raisedBy: req.currentUser.uid,
      raisedByName:
        req.currentUser.profile?.name || req.currentUser.email || 'User',
      raisedByRole: req.currentUser.role,
      assignedTo: assignedWorkers[0] || null,
      workerAssigned:
        order.workerAssigned || order.assignedTo || assignedWorkers[0] || null,
      assignedWorkers,
      type,
      description,
      requestedAmount,
      status: 'pending',
      resolution: null,
      refundAmount: 0,
      penaltyAmount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      messages: [
        {
          senderId: req.currentUser.uid,
          senderName:
            req.currentUser.profile?.name || req.currentUser.email || 'User',
          senderRole: req.currentUser.role,
          message: description,
          timestamp: FieldValue.serverTimestamp(),
          type: 'initial',
        },
      ],
      timeline: [
        {
          action: 'dispute_raised',
          by: req.currentUser.uid,
          at: FieldValue.serverTimestamp(),
        },
      ],
    });

    const createdSnapshot = await disputeRef.get();
    res.status(201).json({
      dispute: serializeDocument(createdSnapshot),
    });
  })
);

router.patch(
  '/resolve',
  authGuard,
  validateBody(resolveDisputeSchema),
  asyncHandler(async (req, res) => {
    if (!isAdminLikeRole(req.currentUser.role)) {
      throw new HttpError(403, 'Only admin-level users can resolve disputes.');
    }

    const { disputeId, resolution, refundAmount, penaltyAmount } =
      req.validatedBody;
    const disputeRef = adminDb().collection('disputes').doc(disputeId);
    const disputeSnapshot = await disputeRef.get();

    if (!disputeSnapshot.exists) {
      throw new HttpError(404, 'Dispute not found.');
    }

    const currentTimeline = Array.isArray(disputeSnapshot.data().timeline)
      ? disputeSnapshot.data().timeline
      : [];

    await disputeRef.update({
      status: 'resolved',
      resolution,
      refundAmount,
      penaltyAmount,
      resolvedBy: req.currentUser.uid,
      resolvedByName:
        req.currentUser.profile?.name || req.currentUser.email || 'Admin',
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      timeline: [
        ...currentTimeline,
        {
          action: 'dispute_resolved',
          resolution,
          refundAmount,
          penaltyAmount,
          by: req.currentUser.uid,
          at: FieldValue.serverTimestamp(),
        },
      ],
    });

    const updatedSnapshot = await disputeRef.get();
    res.json({
      dispute: serializeDocument(updatedSnapshot),
    });
  })
);

export default router;
