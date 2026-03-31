import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { env } from '../config/env.js';
import { releasePendingFunds } from '../services/financialService.js';

const router = Router();

// POST /cron/release-funds - Triggered by external cron or admin
router.post(
  '/release-funds',
  asyncHandler(async (req, res) => {
    // Basic security check: Require a secret key in header or env
    const cronSecret = req.headers['x-cron-secret'];
    if (env.nodeEnv === 'production' && cronSecret !== process.env.CRON_SECRET) {
      throw new HttpError(401, 'Unauthorized cron trigger.');
    }

    const releasedCount = await releasePendingFunds();
    
    res.json({
      success: true,
      releasedCount,
      timestamp: new Date().toISOString()
    });
  })
);

export default router;
