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
  // Cashfree
  cashfreeAppId: String(process.env.CASHFREE_APP_ID || '').trim(),
  cashfreeSecretKey: String(process.env.CASHFREE_SECRET_KEY || '').trim(),
  cashfreeWebhookSecret: String(process.env.CASHFREE_WEBHOOK_SECRET || '').trim(),
  backendUrl: String(process.env.BACKEND_URL || 'http://localhost:5000').trim(),
  nodeEnv: String(process.env.NODE_ENV || 'development').trim(),
  razorpayKeySecret: String(process.env.RAZORPAY_KEY_SECRET || '').trim(),
  razorpayWebhookSecret: String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
  // Email (Gmail SMTP)
  smtpUser: String(process.env.SMTP_USER || '').trim(),
  smtpPass: String(process.env.SMTP_PASS || '').trim(),
  // WhatsApp (Twilio)
  twilioAccountSid: String(process.env.TWILIO_ACCOUNT_SID || '').trim(),
  twilioAuthToken: String(process.env.TWILIO_AUTH_TOKEN || '').trim(),
  twilioWhatsAppFrom: String(process.env.TWILIO_WHATSAPP_FROM || '+14155238886').trim(),
  // Databases
  postgresUrl: String(process.env.POSTGRES_URL || '').trim(),
  redisUrl: String(process.env.REDIS_URL || 'redis://localhost:6379').trim(),
  // Frontend URL for links in notifications
  frontendUrl: String(process.env.FRONTEND_URL || 'http://localhost:5173').trim(),
};

export default env;
