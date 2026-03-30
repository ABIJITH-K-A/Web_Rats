import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { paymentLimiter } from '../middleware/rateLimits.js';
import { validateBody } from '../middleware/validate.js';
import {
  createGatewayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/razorpayGateway.js';
import { distributeOrderRevenue } from '../services/financialDistribution.js';
import { creditWorkerForOrder } from '../services/financialService.js';

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

const verifySchema = z.object({
  paymentId: z.string().trim().min(4).max(120),
  orderId: z.string().trim().min(4).max(120),
  signature: z.string().trim().min(8).max(256),
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

router.post(
  '/verify',
  paymentLimiter,
  validateBody(verifySchema),
  asyncHandler(async (req, res) => {
    const verified = verifyPaymentSignature(req.validatedBody);

    if (!verified) {
      throw new HttpError(400, 'Invalid payment signature.');
    }

    res.json({
      verified: true,
    });
  })
);

export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  const signature = String(req.headers['x-razorpay-signature'] || '').trim();

  if (!signature) {
    throw new HttpError(400, 'Missing webhook signature.');
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {})); // eslint-disable-line no-undef
  const isValid = verifyWebhookSignature({
    rawBody,
    signature,
  });

  if (!isValid) {
    throw new HttpError(400, 'Invalid webhook signature.');
  }

  let payload = null;

  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid webhook payload.');
  }

  // Process payment captured event
  if (payload?.event === 'payment.captured') {
    const payment = payload?.payload?.payment?.entity;
    const orderId = payment?.notes?.orderId;
    
    if (orderId) {
      // Credit worker and distribute revenue
      await creditWorkerForOrder(orderId);
      await distributeOrderRevenue(orderId);
    }
  }

  res.json({
    received: true,
    event: payload?.event || 'unknown',
  });
});

export default router;
