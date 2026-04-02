import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

const unlockSchema = z.object({
  templateId: z.string().trim().min(1).max(128),
  templateTitle: z.string().trim().min(1).max(255),
  isFree: z.boolean(),
  price: z.number().nonnegative(),
});

// GET /templates/stats - Get user's unlock stats
router.get(
  '/stats',
  authGuard,
  asyncHandler(async (req, res) => {
    const db = adminDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshots = await db.collection('templatePurchases')
      .where('userId', '==', req.currentUser.uid)
      .where('createdAt', '>=', today.toISOString())
      .where('type', '==', 'free')
      .get();

    res.json({
      dailyUnlocksUsed: snapshots.size,
      dailyLimit: 3, // Configurable
    });
  })
);

// POST /templates/unlock - Securely unlock a template
router.post(
  '/unlock',
  authGuard,
  validateBody(unlockSchema),
  asyncHandler(async (req, res) => {
    const { templateId, templateTitle, isFree, price } = req.body;
    const db = adminDb();
    const userId = req.currentUser.uid;

    // Check if already unlocked
    const existing = await db.collection('templatePurchases')
      .where('userId', '==', userId)
      .where('templateId', '==', templateId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.json({ success: true, message: 'Already unlocked', alreadyUnlocked: true });
    }

    if (isFree) {
      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayUnlocks = await db.collection('templatePurchases')
        .where('userId', '==', userId)
        .where('createdAt', '>=', today.toISOString())
        .where('type', '==', 'free')
        .get();

      if (todayUnlocks.size >= 3) {
        throw new HttpError(429, 'Daily free template limit reached (3/day). Come back tomorrow!');
      }

      await db.collection('templatePurchases').add({
        userId,
        templateId,
        templateTitle,
        price: 0,
        type: 'free',
        createdAt: new Date().toISOString(),
      });
    } else {
      // For paid templates, in a real scenario we'd check payment status
      // For now, we record it (assuming frontend handled payment or user is pro)
      await db.collection('templatePurchases').add({
        userId,
        templateId,
        templateTitle,
        price,
        type: 'paid',
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ success: true, message: 'Template unlocked successfully' });
  })
);

export default router;
