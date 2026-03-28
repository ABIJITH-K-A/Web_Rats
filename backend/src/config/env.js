import dotenv from 'dotenv';

dotenv.config();

const splitEnvList = (value, fallback = []) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean).length
    ? String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : fallback;

export const env = {
  port: Number(process.env.PORT || 8787),
  corsOrigins: splitEnvList(process.env.CORS_ORIGIN, ['http://localhost:5173']),
  firebaseProjectId: String(process.env.FIREBASE_PROJECT_ID || '').trim(),
  firebaseClientEmail: String(process.env.FIREBASE_CLIENT_EMAIL || '').trim(),
  firebasePrivateKey: String(process.env.FIREBASE_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n')
    .trim(),
  razorpayKeyId: String(process.env.RAZORPAY_KEY_ID || '').trim(),
  razorpayKeySecret: String(process.env.RAZORPAY_KEY_SECRET || '').trim(),
  razorpayWebhookSecret: String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
};

export default env;
