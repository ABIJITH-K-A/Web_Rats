import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../../config/firebaseAdmin.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { HttpError } from '../../lib/httpError.js';
import { authGuard } from '../../middleware/authGuard.js';
import roleGuard from '../../middleware/roleGuard.js';
import { validateBody } from '../../middleware/validate.js';
import { serializeDocument } from '../../lib/serialize.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

const verifyPaymentSchema = z.object({
  orderId: z.string().trim().min(5),
  status: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

// GET /temp/qpay/pending - Get all orders awaiting payment verification
router.get(
  '/pending',
  authGuard,
  roleGuard(['admin', 'owner']),
  asyncHandler(async (req, res) => {
    const snapshot = await adminDb().collection('orders')
      .where('statusKey', '==', 'pending_payment_verification')
      .limit(50)
      .get();

    const orders = snapshot.docs.map(serializeDocument);
    res.json({ orders });
  })
);

// POST /temp/qpay/verify - Approve or Reject a QR payment
router.post(
  '/verify',
  authGuard,
  roleGuard(['admin', 'owner']),
  validateBody(verifyPaymentSchema),
  asyncHandler(async (req, res) => {
    const { orderId, status, reason } = req.body;
    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = orderSnapshot.data();
    
    if (status === 'approved') {
      await orderRef.update({
        status: 'Created',
        orderStatus: 'Created',
        statusKey: 'created',
        paymentStatus: 'paid',
        paymentVerifiedAt: FieldValue.serverTimestamp(),
        paymentVerifiedBy: req.currentUser.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await orderRef.update({
        status: 'Cancelled (Payment Rejected)',
        statusKey: 'cancelled',
        paymentStatus: 'rejected',
        rejectionReason: reason || 'Invalid Transaction ID',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    res.json({ success: true, message: `Payment ${status} successfully.` });
  })
);

export default router;
