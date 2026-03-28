import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';

let razorpayClient = null;

const sanitizeReceipt = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);

const sanitizeNote = (value, maxLength = 120) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const getGatewayClient = () => {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new HttpError(
      500,
      'Razorpay server credentials are not configured.'
    );
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }

  return razorpayClient;
};

const createDigest = (secret, value) =>
  crypto.createHmac('sha256', secret).update(value).digest('hex');

const constantTimeEquals = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const createGatewayOrder = async ({ amount, orderId, userDetails = {} }) => {
  const client = getGatewayClient();
  const receipt = sanitizeReceipt(`tnwr_${orderId}`) || `tnwr_${Date.now()}`;
  const subunitAmount = Math.round(Number(amount || 0) * 100);

  if (!Number.isFinite(subunitAmount) || subunitAmount <= 0) {
    throw new HttpError(400, 'Amount must be greater than zero.');
  }

  const gatewayOrder = await client.orders.create({
    amount: subunitAmount,
    currency: 'INR',
    receipt,
    notes: {
      orderId: sanitizeNote(orderId, 80),
      customerName: sanitizeNote(userDetails.name, 80),
      customerEmail: sanitizeNote(userDetails.email, 120),
      customerPhone: sanitizeNote(userDetails.phone, 32),
    },
  });

  return {
    id: gatewayOrder.id,
    amount: gatewayOrder.amount,
    currency: gatewayOrder.currency,
    receipt: gatewayOrder.receipt,
    notes: gatewayOrder.notes || {},
  };
};

export const verifyPaymentSignature = ({ paymentId, orderId, signature }) => {
  if (!env.razorpayKeySecret) {
    throw new HttpError(500, 'Razorpay signature secret is not configured.');
  }

  const expectedSignature = createDigest(
    env.razorpayKeySecret,
    `${orderId}|${paymentId}`
  );

  return constantTimeEquals(expectedSignature, signature);
};

export const verifyWebhookSignature = ({ rawBody, signature }) => {
  if (!env.razorpayWebhookSecret) {
    throw new HttpError(500, 'Razorpay webhook secret is not configured.');
  }

  const expectedSignature = createDigest(env.razorpayWebhookSecret, rawBody);
  return constantTimeEquals(expectedSignature, signature);
};

export default {
  createGatewayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
