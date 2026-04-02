import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';
import { FieldValue } from 'firebase-admin/firestore';
import { getCategoriesForSkills } from '../lib/skillMapping.js';

const router = Router();

const profileSchema = z.object({
  skills: z.array(z.string().trim().min(2)).min(1).max(15),
  availableHours: z.object({
    start: z.string(),
    end: z.string(),
    timezone: z.string().default('Asia/Kolkata'),
  }).optional(),
  unavailableDays: z.array(z.number().min(0).max(6)).optional().default([]),
  unavailableDates: z.array(z.string()).optional().default([]),
  maxActiveOrders: z.number().min(1).max(20).optional().default(3),
  chatSettings: z.object({
    notifications: z.boolean().default(true),
    sound: z.boolean().default(true),
    readReceipts: z.boolean().default(true),
  }).optional(),
});

const availabilitySchema = z.object({
  status: z.enum(['available', 'busy', 'unavailable']),
});

// GET /api/worker-profile/:uid
router.get('/:uid', authGuard, asyncHandler(async (req, res) => {
  const snap = await adminDb().collection('workerProfiles').doc(req.params.uid).get();
  res.json({ profile: snap.exists ? snap.data() : null });
}));

// PUT /api/worker-profile — update own profile
router.put('/', authGuard, validateBody(profileSchema), asyncHandler(async (req, res) => {
  const { uid } = req.currentUser;
  const data = req.validatedBody;

  await adminDb().collection('workerProfiles').doc(uid).set({
    uid,
    ...data,
    allowedCategories: getCategoriesForSkills(data.skills),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  res.json({ success: true });
}));

// PATCH /api/worker-profile/availability — quick toggle
router.patch('/availability', authGuard, validateBody(availabilitySchema), asyncHandler(async (req, res) => {
  const { status } = req.validatedBody;
  const { uid } = req.currentUser;

  await adminDb().collection('workerProfiles').doc(uid).update({
    availabilityStatus: status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  res.json({ success: true });
}));

export default router;
