import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { HttpError } from './lib/httpError.js';
import { apiLimiter, authLimiter, chatLimiter } from './middleware/rateLimits.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { sanitizeRequest } from './middleware/sanitize.js';
import { requestLogger } from './middleware/requestLogger.js';
import { generateCsrfToken } from './middleware/csrfProtection.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import notificationSettingsRoutes from './routes/notificationSettingsRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes, { handlePaymentWebhook } from './routes/paymentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import cronRoutes from './routes/cronRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import usersRouter from './routes/users.js';
import ticketRoutes from './routes/ticketRoutes.js';
import workerProfileRoutes from './routes/workerProfileRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import revisionRoutes from './routes/revisionRoutes.js';
import qpayRoutes from './routes/temp/qpayRoutes.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new HttpError(403, 'Origin not allowed by CORS.'));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false, // React handles its own CSP usually or we can configure it separately
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
);

app.post(
  '/payment/webhook',
  express.raw({ type: 'application/json' }),
  handlePaymentWebhook
);

app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);
app.use(sanitizeRequest);
app.use(requestLogger);
app.use(generateCsrfToken);

app.use(healthRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/payment', paymentRoutes);
app.use('/orders', orderRoutes);
app.use('/notifications', notificationRoutes);
app.use('/notification-settings', notificationSettingsRoutes);
app.use('/dispute', disputeRoutes);
app.use('/admin', adminRoutes);
app.use('/chat', chatLimiter, chatRoutes);
app.use('/revision', revisionRoutes);
app.use('/templates', templateRoutes);
app.use('/upload', uploadRoutes);
app.use('/users', usersRouter);
app.use('/tickets', ticketRoutes);
app.use('/worker-profile', workerProfileRoutes);
app.use('/finance', financeRoutes);
app.use('/announcements', announcementRoutes);
app.use('/cron', cronRoutes);
app.use('/temp/qpay', qpayRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
