import { Router } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';

const router = Router();

router.post(
  '/release-funds',
  asyncHandler(async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'];
    if (env.nodeEnv === 'production' && cronSecret !== process.env.CRON_SECRET) {
      throw new HttpError(401, 'Unauthorized cron trigger.');
    }

    res.json({
      success: true,
      retired: true,
      message: 'Automatic fund release is disabled because payouts are handled manually through payroll.',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
