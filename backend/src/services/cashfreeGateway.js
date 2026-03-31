import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';
import {Buffer} from 'buffer';

// ── Cashfree API base URLs ─────────────────────────────────────
const BASE_URL = env.nodeEnv === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// ── Sanitizers (same pattern as razorpayGateway) ──────────────
const sanitizeOrderId = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 50);

// ── Retry for network failures ──────────────────────────────────────
export const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i === retries - 1) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

// ── Create Cashfree Order ──────────────────────────────────────
export const createGatewayOrder = async ({ amount, orderId, userDetails = {} }) => {
  if (!env.cashfreeAppId || !env.cashfreeSecretKey) {
    throw new HttpError(500, 'Cashfree credentials are not configured.');
  }

  const sanitizedOrderId = sanitizeOrderId(`tnwr_${orderId}`);
  const numericAmount = Number(amount || 0);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new HttpError(400, 'Amount must be greater than zero.');
  }

  const body = {
    order_id: sanitizedOrderId,
    order_amount: numericAmount,
    order_currency: 'INR',
    customer_details: {
      customer_id: sanitizedOrderId,
      customer_name: userDetails.name || 'Customer',
      customer_email: userDetails.email || 'customer@example.com',
      customer_phone: userDetails.phone || '9999999999',
    },
    order_meta: {
      notify_url: `${env.backendUrl}/api/payments/webhook`,
    },
    order_tags: {
      orderId,
    },
  };

  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id': env.cashfreeAppId,
      'x-client-secret': env.cashfreeSecretKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new HttpError(500, `Cashfree order creation failed: ${error.message}`);
  }

  const data = await response.json();

  return {
    id: data.cf_order_id,
    orderId: sanitizedOrderId,
    amount: data.order_amount,
    currency: data.order_currency,
    paymentSessionId: data.payment_session_id,
    status: data.order_status,
  };
};

// ── Verify Webhook Signature ───────────────────────────────────
// Cashfree signs with base64 (NOT hex like Razorpay)
export const verifyWebhookSignature = ({ rawBody, signature, timestamp }) => {
  if (!env.cashfreeWebhookSecret) {
    throw new HttpError(500, 'Cashfree webhook secret is not configured.');
  }

  // Cashfree signature = base64(HMAC-SHA256(timestamp + rawBody))
  const signedPayload = `${timestamp}${rawBody}`;

  const expectedSignature = crypto
    .createHmac('sha256', env.cashfreeWebhookSecret)
    .update(signedPayload)
    .digest('base64');

  const leftBuffer = Buffer.from(String(expectedSignature || ''));
  const rightBuffer = Buffer.from(String(signature || ''));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export default {
  createGatewayOrder,
  verifyWebhookSignature,
};
