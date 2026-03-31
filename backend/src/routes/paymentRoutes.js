import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { paymentLimiter } from '../middleware/rateLimits.js';
import { validateBody } from '../middleware/validate.js';
import { authGuard } from '../middleware/authGuard.js';
import { Buffer } from 'buffer';
import {
  createGatewayOrder,
  verifyWebhookSignature,
}
from '../services/cashfreeGateway.js';
import { creditWorkerForOrder } from '../services/financialService.js';
import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { buildOrderStatusPatch } from '../lib/orderStatus.js';

const router = Router();

const numericAmount = z.preprocess((value) => Number(value), z.number().finite().positive());

const createOrderSchema = z.object({
  amount: numericAmount,
  orderId: z.string().trim().min(2).max(80),
  userDetails: z
    .object({
      name: z.string().trim().max(120).optional().default(''),
      email: z
        .string()
        .trim()
        .max(120)
        .optional()
        .refine((value) => !value || z.string().email().safeParse(value).success, {
          message: 'Invalid email address.',
        })
        .default(''),
      phone: z.string().trim().max(32).optional().default(''),
    })
    .optional()
    .default({}),
});

router.post(
  '/create-order',
  paymentLimiter,
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const gatewayOrder = await createGatewayOrder(req.validatedBody);
    res.status(201).json(gatewayOrder);
  })
);

export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  // Get signature headers
  const signature = String(req.headers['x-webhook-signature'] || '').trim();
  const timestamp = String(req.headers['x-webhook-timestamp'] || '').trim();

  if (!signature || !timestamp) {
    throw new HttpError(400, 'Missing webhook signature or timestamp.');
  }

  // Verify signature
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : JSON.stringify(req.body || {});

  const isValid = verifyWebhookSignature({
    rawBody,
    signature,
    timestamp,
  });

  if (!isValid) {
    throw new HttpError(400, 'Invalid webhook signature.');
  }

  // Parse payload
  let payload = null;
  try {
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : req.body;
  } catch {
    throw new HttpError(400, 'Invalid webhook payload.');
  }

  // Always respond to Cashfree FIRST
  const eventType = payload?.type || 'unknown';
  res.json({ received: true, event: eventType });

  // Extract order data
  const orderData = payload?.data?.order;
  const paymentData = payload?.data?.payment;

  const orderId = orderData?.order_tags?.orderId;
  const cashfreeOrderId = orderData?.order_id;
  const cashfreePaymentId = paymentData?.cf_payment_id;
  const amount = Number(paymentData?.payment_amount || 0);

  if (!orderId) return;

  const db = adminDb();
  const paymentRef = db.collection('payments').doc(orderId);
  const orderRef = db.collection('orders').doc(orderId);

  // PAYMENT_SUCCESS_WEBHOOK
  if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
    const batch = db.batch();

    batch.set(paymentRef, {
      orderId,
      cashfreeOrderId,
      cashfreePaymentId: String(cashfreePaymentId || ''),
      amount,
      paymentStatus: 'success',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    batch.update(orderRef, {
      ...buildOrderStatusPatch('created'),
      paymentStatus: 'paid',
      paymentVerifiedAt: FieldValue.serverTimestamp(),
      paymentVerifiedBy: 'cashfree-webhook',
    });

    await batch.commit();

    await creditWorkerForOrder(orderId);
  }

  // PAYMENT_FAILED_WEBHOOK
  if (eventType === 'PAYMENT_FAILED_WEBHOOK') {
    const batch = db.batch();

    batch.set(paymentRef, {
      orderId,
      cashfreeOrderId,
      cashfreePaymentId: String(cashfreePaymentId || ''),
      amount,
      paymentStatus: 'failed',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    batch.update(orderRef, {
      paymentStatus: 'rejected',
      rejectionReason: 'Payment failed via Cashfree',
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }
  
});

router.get('/status/:orderId', authGuard, asyncHandler(async (req, res) => {
  const db = adminDb();
  const paymentDoc = await db.collection('payments').doc(req.params.orderId).get();
  if (!paymentDoc.exists) {
    throw new HttpError(404, 'Payment not found');
  }
  res.json(paymentDoc.data());
}));



export default router;
