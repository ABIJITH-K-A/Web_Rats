import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import roleGuard from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';
import { apiLimiter } from '../middleware/rateLimits.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

const createTicketSchema = z.object({
  orderId: z.string().trim().min(5).nullable().optional().default(null),
  type: z.enum(['order', 'payment', 'worker', 'client', 'bug', 'other']).default('order'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(1000),
});

const resolveTicketSchema = z.object({
  ticketId: z.string().trim().min(5),
  resolution: z.string().trim().min(5).max(500),
});

// POST /api/tickets — raise a ticket
router.post(
  '/',
  authGuard,
  apiLimiter,
  validateBody(createTicketSchema),
  asyncHandler(async (req, res) => {
    const { orderId, type, priority, title, description } = req.validatedBody;
    const { uid, role } = req.currentUser;

    if (orderId) {
      const orderSnap = await adminDb().collection('orders').doc(orderId).get();
      if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');
    }
    
    // Check priority auto-rules
    let finalPriority = priority;
    if (type === 'payment') finalPriority = 'high';
    // if (type === 'abuse') finalPriority = 'critical';

    const db = adminDb();
    const batch = db.batch();

    // Create ticket
    const ticketRef = db.collection('tickets').doc();
    const ticketData = {
      orderId,
      createdBy: uid,
      role,
      type,
      priority: finalPriority,
      title,
      description,
      status: 'open',
      assignedTo: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    batch.set(ticketRef, ticketData);

    // Initial message in ticket chat
    const msgRef = ticketRef.collection('messages').doc();
    batch.set(msgRef, {
      senderId: uid,
      senderRole: role,
      message: description,
      attachments: [],
      createdAt: FieldValue.serverTimestamp(),
    });

    if (orderId) {
      batch.update(db.collection('orders').doc(orderId), {
        escalation: true,
        ticketId: ticketRef.id,
        escalatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('chatPlaceholders').doc(orderId), {
        escalated: true,
        ticketId: ticketRef.id,
        escalatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();

    res.status(201).json({ ticketId: ticketRef.id, success: true });
  })
);

// GET /api/tickets — get tickets
router.get(
  '/',
  authGuard,
  asyncHandler(async (req, res) => {
    const { uid, role } = req.currentUser;
    let query = adminDb().collection('tickets');

    if (!['admin', 'owner'].includes(role)) {
      query = query.where('createdBy', '==', uid);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ tickets });
  })
);

// POST /api/tickets/:id/messages — add message to ticket
router.post(
  '/:id/messages',
  authGuard,
  apiLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, attachments = [] } = req.body;
    const { uid, role } = req.currentUser;

    const ticketRef = adminDb().collection('tickets').doc(id);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) throw new HttpError(404, 'Ticket not found.');

    const ticket = ticketSnap.data();
    const isCreator = ticket.createdBy === uid;
    const isStaff = ['admin', 'owner'].includes(role);

    if (!isCreator && !isStaff) throw new HttpError(403, 'Unauthorized.');

    const msgRef = ticketRef.collection('messages').doc();
    await msgRef.set({
      senderId: uid,
      senderRole: role,
      message,
      attachments,
      createdAt: FieldValue.serverTimestamp(),
    });

    await ticketRef.update({ updatedAt: FieldValue.serverTimestamp() });

    res.status(201).json({ success: true });
  })
);

// PATCH /api/tickets/resolve — resolve ticket
router.patch(
  '/resolve',
  authGuard,
  roleGuard(['admin', 'owner']),
  validateBody(resolveTicketSchema),
  asyncHandler(async (req, res) => {
    const { ticketId, resolution } = req.validatedBody;
    const { uid, role } = req.currentUser;

    const ticketRef = adminDb().collection('tickets').doc(ticketId);
    const ticketSnap = await ticketRef.get();
    if (!ticketSnap.exists) throw new HttpError(404, 'Ticket not found.');

    const { orderId } = ticketSnap.data();
    const db = adminDb();
    const batch = db.batch();

    batch.update(ticketRef, {
      status: 'resolved',
      resolvedBy: uid,
      resolution,
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (orderId) {
      batch.update(db.collection('orders').doc(orderId), {
        escalation: false,
        updatedAt: FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('chatPlaceholders').doc(orderId), {
        escalated: false,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();
    res.json({ success: true });
  })
);

export default router;
