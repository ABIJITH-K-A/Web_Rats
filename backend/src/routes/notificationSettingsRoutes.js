import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const preferencesSchema = z.object({
  email: z.boolean().optional().default(true),
  whatsapp: z.boolean().optional().default(true),
  inApp: z.boolean().optional().default(true),
});

const DEFAULT_PREFERENCES = {
  email: true,
  whatsapp: true,
  inApp: true,
};

router.get(
  '/',
  authGuard,
  asyncHandler(async (req, res) => {
    const snap = await adminDb().collection('users').doc(req.currentUser.uid).get();
    const profile = snap.exists ? snap.data() || {} : {};

    res.json({
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...(profile.notificationPrefs || {}),
      },
    });
  })
);

router.patch(
  '/',
  authGuard,
  validateBody(preferencesSchema),
  asyncHandler(async (req, res) => {
    const preferences = {
      ...DEFAULT_PREFERENCES,
      ...req.validatedBody,
    };

    await adminDb().collection('users').doc(req.currentUser.uid).set(
      {
        notificationPrefs: preferences,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ success: true, preferences });
  })
);

export default router;
