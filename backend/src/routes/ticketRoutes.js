import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import roleGuard from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

const createTicketSchema = z.object({
  orderId: z.string().trim().min(5),
  reason: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(1000),
});

const resolveTicketSchema = z.object({
  ticketId: z.string().trim().min(5),
  resolution: z.string().trim().min(5).max(500),
});

// POST /api/tickets — raise a ticket (worker or client)
router.post(
  '/',
  authGuard,
  validateBody(createTicketSchema),
  asyncHandler(async (req, res) => {
    const { orderId, reason, description } = req.validatedBody;
    const { uid } = req.currentUser;

    const orderSnap = await adminDb().collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');

    const order = orderSnap.data();
    const isClient = order.userId === uid;
    const isWorker = [
      order.assignedTo, order.workerAssigned,
      ...(order.assignedWorkers || [])
    ].includes(uid);

    if (!isClient && !isWorker) {
      throw new HttpError(403, 'Only the client or assigned worker can raise a ticket.');
    }

    const db = adminDb();
    const batch = db.batch();

    // Create ticket
    const ticketRef = db.collection('tickets').doc();
    batch.set(ticketRef, {
      orderId,
      raisedBy: uid,
      raisedByRole: isClient ? 'client' : 'worker',
      reason,
      description,
      status: 'open',
      assignedTo: null,
      createdAt: FieldValue.serverTimestamp(),
      resolvedAt: null,
      resolvedBy: null,
    });

    // Set escalation on order
    batch.update(db.collection('orders').doc(orderId), {
      escalation: true,
      escalationReason: reason,
      escalatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Set escalation on chat — grants admin read access
    batch.update(db.collection('chats').doc(orderId), {
      escalated: true,
      escalationReason: reason,
      escalatedAt: FieldValue.serverTimestamp(),
    });

    // Add system message to chat
    const systemMsgRef = db.collection('chats').doc(orderId)
      .collection('messages').doc();
    batch.set(systemMsgRef, {
      senderId: 'system',
      senderRole: 'system',
      type: 'system',
      encryptedContent: null,
      text: `⚠️ A ticket has been raised: "${reason}". Support team has been notified.`,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    res.status(201).json({ ticketId: ticketRef.id, success: true });
  })
);

// GET /api/tickets — get all open tickets (admin/manager/owner only)
router.get(
  '/',
  authGuard,
  roleGuard(['admin', 'manager', 'owner', 'super_admin']),
  asyncHandler(async (req, res) => {
    const snapshot = await adminDb().collection('tickets')
      .where('status', '==', 'open')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ tickets });
  })
);

// PATCH /api/tickets/resolve — resolve ticket (admin/manager/owner)
router.patch(
  '/resolve',
  authGuard,
  roleGuard(['admin', 'manager', 'owner', 'super_admin']),
  validateBody(resolveTicketSchema),
  asyncHandler(async (req, res) => {
    const { ticketId, resolution } = req.validatedBody;
    const { uid } = req.currentUser;

    const ticketRef = adminDb().collection('tickets').doc(ticketId);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) throw new HttpError(404, 'Ticket not found.');

    const { orderId } = ticketSnap.data();
    const db = adminDb();
    const batch = db.batch();

    // Resolve ticket
    batch.update(ticketRef, {
      status: 'resolved',
      resolvedBy: uid,
      resolution,
      resolvedAt: FieldValue.serverTimestamp(),
    });

    // Remove escalation from order
    batch.update(db.collection('orders').doc(orderId), {
      escalation: false,
      escalationResolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Remove escalation from chat — revokes admin access
    batch.update(db.collection('chats').doc(orderId), {
      escalated: false,
      resolvedAt: FieldValue.serverTimestamp(),
    });

    // Add resolution system message to chat
    const systemMsgRef = db.collection('chats').doc(orderId)
      .collection('messages').doc();
    batch.set(systemMsgRef, {
      senderId: 'system',
      senderRole: 'system',
      type: 'system',
      encryptedContent: null,
      text: `✅ Ticket resolved. Support team has left the chat.`,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    res.json({ success: true });
  })
);

export default router;
