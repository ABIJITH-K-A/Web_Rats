import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { HttpError } from './lib/httpError.js';
import { apiLimiter } from './middleware/rateLimits.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes, { handlePaymentWebhook } from './routes/paymentRoutes.js';
import walletRoutes from './routes/walletRoutes.js';

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
  })
);

app.post(
  '/payment/webhook',
  express.raw({ type: 'application/json' }),
  handlePaymentWebhook
);

app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

app.use(healthRoutes);
app.use('/auth', authRoutes);
app.use('/payment', paymentRoutes);
app.use('/orders', orderRoutes);
app.use('/wallet', walletRoutes);
app.use('/notifications', notificationRoutes);
app.use('/dispute', disputeRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
