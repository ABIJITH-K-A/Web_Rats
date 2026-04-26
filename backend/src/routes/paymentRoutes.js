import { Buffer } from 'buffer';
import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import { apiLimiter } from '../middleware/rateLimits.js';
import { validateBody } from '../middleware/validate.js';
import {
  createGatewayOrder,
  verifyWebhookSignature,
} from '../services/cashfreeGateway.js';

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

const createIntentSchema = z.object({
  kind: z.enum(['template', 'revision']),
  referenceId: z.string().trim().min(1).max(128),
});

const PAYMENT_REQUESTS_COLLECTION = 'paymentRequests';
const MAX_STUDENT_REFERRAL_DISCOUNT = 40;

const buildPurchaseId = (userId, templateId) => `${userId}_${templateId}`;
const clampReferralDiscountPercent = (discountPercent) =>
  Math.min(
    MAX_STUDENT_REFERRAL_DISCOUNT,
    Math.max(0, Math.round(Number(discountPercent || 0)))
  );

const getUserReferralDiscount = (profile = {}) => {
  if (!profile?.usedReferralCode) {
    return 0;
  }

  return clampReferralDiscountPercent(profile.discountPercent);
};

const handleOrderPaymentSuccess = async ({ referenceId, amount }) => {
  const orderRef = adminDb().collection('orders').doc(referenceId);
  const orderSnapshot = await orderRef.get();

  if (!orderSnapshot.exists) {
    return;
  }

  const order = orderSnapshot.data() || {};
  const nextTotalPaid = Number(order.totalPaid || 0) + Number(amount || 0);
  const orderTotal = Number(order.totalPrice || order.price || 0);
  const nextRemaining = Math.max(orderTotal - nextTotalPaid, 0);

  await orderRef.set(
    {
      paymentStatus: nextRemaining === 0 ? 'paid' : 'partial',
      advancePaid: Number(order.advancePaid || 0) + Number(amount || 0),
      totalPaid: nextTotalPaid,
      remainingPayment: nextRemaining,
      remainingAmount: nextRemaining,
      paymentVerifiedAt: FieldValue.serverTimestamp(),
      paymentVerifiedBy: 'cashfree-webhook',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

const handleTemplatePaymentSuccess = async ({ referenceId, userId, amount }) => {
  if (!userId) {
    return;
  }

  const templateRef = adminDb().collection('templates').doc(referenceId);
  const templateSnapshot = await templateRef.get();

  if (!templateSnapshot.exists) {
    return;
  }

  const template = templateSnapshot.data() || {};

  await adminDb()
    .collection('templatePurchases')
    .doc(buildPurchaseId(userId, referenceId))
    .set(
      {
        userId,
        templateId: referenceId,
        paid: true,
        price: Number(amount || template.price || 0),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
};

const handleRevisionPaymentSuccess = async ({ referenceId }) => {
  const orderRef = adminDb().collection('orders').doc(referenceId);
  const orderSnapshot = await orderRef.get();

  if (!orderSnapshot.exists) {
    return;
  }

  await orderRef.set(
    {
      paidRevisionCredits: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

const markPaymentRequest = async ({
  requestId,
  kind,
  referenceId,
  userId,
  amount,
  paymentStatus,
  cashfreeOrderId,
  cashfreePaymentId,
  eventType,
}) => {
  const payload = {
    requestId,
    kind,
    referenceId,
    userId: userId || null,
    amount: Number(amount || 0),
    paymentStatus,
    cashfreeOrderId: cashfreeOrderId || null,
    cashfreePaymentId: cashfreePaymentId || null,
    lastEventType: eventType,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await Promise.all([
    adminDb()
      .collection(PAYMENT_REQUESTS_COLLECTION)
      .doc(requestId)
      .set(
        {
          ...payload,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
    adminDb()
      .collection('payments')
      .doc(requestId)
      .set(
        {
          ...payload,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
  ]);
};

router.post(
  '/create-order',
  apiLimiter,
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const { amount, orderId, userDetails } = req.validatedBody;

    await adminDb()
      .collection(PAYMENT_REQUESTS_COLLECTION)
      .doc(orderId)
      .set(
        {
          requestId: orderId,
          kind: 'order',
          referenceId: orderId,
          amount,
          paymentStatus: 'pending',
          userId: null,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    const gatewayOrder = await createGatewayOrder({
      amount,
      orderId,
      userDetails,
      orderTags: {
        requestId: orderId,
        kind: 'order',
        referenceId: orderId,
      },
    });

    res.status(201).json({
      ...gatewayOrder,
      requestId: orderId,
    });
  })
);

router.post(
  '/create-intent',
  apiLimiter,
  authGuard,
  validateBody(createIntentSchema),
  asyncHandler(async (req, res) => {
    const { kind, referenceId } = req.validatedBody;
    const { uid, email, profile } = req.currentUser;
    const db = adminDb();
    let amount = 0;
    let originalAmount = 0;
    let referralDiscountPercent = 0;
    let referralDiscountAmount = 0;
    let title = '';

    if (kind === 'template') {
      const templateSnapshot = await db.collection('templates').doc(referenceId).get();
      if (!templateSnapshot.exists) {
        throw new HttpError(404, 'Template not found.');
      }

      const template = templateSnapshot.data() || {};
      if (template.isFree || Number(template.price || 0) <= 0) {
        throw new HttpError(400, 'Free templates do not need payment.');
      }

      originalAmount = Number(template.price || 0);
      referralDiscountPercent = getUserReferralDiscount(profile);
      referralDiscountAmount = Math.min(
        originalAmount,
        Math.round(originalAmount * (referralDiscountPercent / 100))
      );
      amount = originalAmount - referralDiscountAmount;
      title = template.title || 'Template purchase';
    }

    if (kind === 'revision') {
      const orderSnapshot = await db.collection('orders').doc(referenceId).get();
      if (!orderSnapshot.exists) {
        throw new HttpError(404, 'Order not found.');
      }

      const order = orderSnapshot.data() || {};
      const ownerIds = [order.userId, order.customerId].filter(Boolean);
      if (!ownerIds.includes(uid)) {
        throw new HttpError(403, 'Only the client can pay for an extra revision.');
      }

      amount = 20;
      originalAmount = amount;
      title = `Extra revision for ${order.service || `order ${referenceId}`}`;
    }

    const paymentRequestRef = db.collection(PAYMENT_REQUESTS_COLLECTION).doc();

    await paymentRequestRef.set({
      requestId: paymentRequestRef.id,
      kind,
      referenceId,
      userId: uid,
      title,
      amount,
      originalAmount: originalAmount || amount,
      referralDiscountPercent,
      referralDiscountAmount,
      paymentStatus: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const gatewayOrder = await createGatewayOrder({
      amount,
      orderId: paymentRequestRef.id,
      userDetails: {
        name: profile?.name || email || 'Customer',
        email: email || profile?.email || '',
        phone: profile?.phone || '',
      },
      orderTags: {
        requestId: paymentRequestRef.id,
        kind,
        referenceId,
        userId: uid,
      },
    });

    res.status(201).json({
      ...gatewayOrder,
      requestId: paymentRequestRef.id,
      kind,
      referenceId,
      amount,
      originalAmount: originalAmount || amount,
      referralDiscountPercent,
      referralDiscountAmount,
    });
  })
);

export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  const signature = String(req.headers['x-webhook-signature'] || '').trim();
  const timestamp = String(req.headers['x-webhook-timestamp'] || '').trim();

  if (!signature || !timestamp) {
    throw new HttpError(400, 'Missing webhook signature or timestamp.');
  }

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

  let payload = null;
  try {
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : req.body;
  } catch {
    throw new HttpError(400, 'Invalid webhook payload.');
  }

  const eventType = payload?.type || 'unknown';
  res.json({ received: true, event: eventType });

  const orderData = payload?.data?.order || {};
  const paymentData = payload?.data?.payment || {};
  const tags = orderData?.order_tags || {};
  const requestId = String(tags.requestId || tags.orderId || '').trim();
  const kind = String(tags.kind || 'order').trim();
  const referenceId = String(tags.referenceId || tags.orderId || requestId).trim();
  const userId = String(tags.userId || '').trim();
  const cashfreeOrderId = orderData?.order_id || null;
  const cashfreePaymentId = paymentData?.cf_payment_id || null;
  const amount = Number(paymentData?.payment_amount || orderData?.order_amount || 0);

  if (!requestId) {
    return;
  }

  try {
    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      await markPaymentRequest({
        requestId,
        kind,
        referenceId,
        userId,
        amount,
        paymentStatus: 'success',
        cashfreeOrderId,
        cashfreePaymentId,
        eventType,
      });

      if (kind === 'order') {
        await handleOrderPaymentSuccess({ referenceId, amount });
      }

      if (kind === 'template') {
        await handleTemplatePaymentSuccess({ referenceId, userId, amount });
      }

      if (kind === 'revision') {
        await handleRevisionPaymentSuccess({ referenceId });
      }
    }

    if (eventType === 'PAYMENT_FAILED_WEBHOOK') {
      await markPaymentRequest({
        requestId,
        kind,
        referenceId,
        userId,
        amount,
        paymentStatus: 'failed',
        cashfreeOrderId,
        cashfreePaymentId,
        eventType,
      });
    }
  } catch (error) {
    console.error('Payment webhook processing failed:', error);
  }
});

router.get(
  '/status/:requestId',
  authGuard,
  asyncHandler(async (req, res) => {
    const paymentDoc = await adminDb()
      .collection(PAYMENT_REQUESTS_COLLECTION)
      .doc(req.params.requestId)
      .get();

    if (!paymentDoc.exists) {
      throw new HttpError(404, 'Payment not found.');
    }

    res.json({
      payment: {
        id: paymentDoc.id,
        ...paymentDoc.data(),
      },
    });
  })
);

export default router;
