import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(32),
  customerType: z.enum(['new', 'returning']).optional().default('new'),
  organizationType: z.enum(['college', 'company', 'startup', 'other']).optional().default('college'),
  organizationName: z.string().trim().max(160).optional().default(''),
  organizationAddress: z.string().trim().max(500).optional().default(''),
  organizationEmail: z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Invalid college or company email.',
    })
    .default(''),
});

router.get(
  '/',
  authGuard,
  asyncHandler(async (req, res) => {
    const db = adminDb();
    const [userSnap, workerSnap, applicationSnap] = await Promise.all([
      db.collection('users').doc(req.currentUser.uid).get(),
      db.collection('workerProfiles').doc(req.currentUser.uid).get(),
      db.collection('workerApplications').doc(req.currentUser.uid).get(),
    ]);

    res.json({
      profile: userSnap.exists ? { id: userSnap.id, ...userSnap.data() } : null,
      workerProfile: workerSnap.exists ? { id: workerSnap.id, ...workerSnap.data() } : null,
      workerApplication: applicationSnap.exists ? { id: applicationSnap.id, ...applicationSnap.data() } : null,
    });
  })
);

router.patch(
  '/',
  authGuard,
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const nextProfile = {
      ...req.validatedBody,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb()
      .collection('users')
      .doc(req.currentUser.uid)
      .set(nextProfile, { merge: true });

    res.json({
      success: true,
      profile: {
        ...req.currentUser.profile,
        ...nextProfile,
      },
    });
  })
);

export default router;
