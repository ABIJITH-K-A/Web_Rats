import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// Role hierarchy — must match frontend systemRules.js EXACTLY
const ROLE_HIERARCHY = [
  'client', 'worker', 'manager', 'admin', 'superadmin', 'owner'
];

const getRoleRank = (role) => ROLE_HIERARCHY.indexOf(String(role || '').trim().toLowerCase());

// Validate rank: actor must strictly outrank target's CURRENT role AND new role
const canActorChangeRole = (actorRole, targetCurrentRole, newRole) => {
  const actorRank = getRoleRank(actorRole);
  const targetCurrentRank = getRoleRank(targetCurrentRole);
  const newRoleRank = getRoleRank(newRole);

  // Actor must outrank the target's CURRENT role
  if (actorRank <= targetCurrentRank) return false;

  // Actor must outrank the NEW role being assigned
  // (prevents superadmin from promoting someone to owner)
  if (actorRank <= newRoleRank) return false;

  // Cannot assign owner role at all — only done manually
  if (newRole === 'owner') return false;

  return true;
};

const setRoleSchema = z.object({
  targetUid: z.string().trim().min(10).max(128),
  newRole: z.enum(['client', 'worker', 'manager', 'admin', 'superadmin']),
  // Note: 'owner' is intentionally excluded from enum — cannot be assigned via API
});

// POST /api/users/set-role
router.post(
  '/set-role',
  authGuard,
  validateBody(setRoleSchema),
  asyncHandler(async (req, res) => {
    const { targetUid, newRole } = req.validatedBody;
    const actor = req.currentUser;

    // Rule 1: Cannot change your own role
    if (actor.uid === targetUid) {
      throw new HttpError(403, 'You cannot change your own role.');
    }

    // Rule 2: Fetch target user's current role from Firestore
    const targetSnap = await adminDb().collection('users').doc(targetUid).get();
    if (!targetSnap.exists) {
      throw new HttpError(404, 'Target user not found.');
    }

    const targetCurrentRole = String(targetSnap.data()?.role || 'client').toLowerCase();

    // Rule 3: Validate rank — actor must outrank both current AND new role
    if (!canActorChangeRole(actor.role, targetCurrentRole, newRole)) {
      throw new HttpError(
        403,
        `You do not have permission to change a ${targetCurrentRole} to ${newRole}.`
      );
    }

    // Build update payload
    const updates = {
      role: newRole,
      roleUpdatedAt: FieldValue.serverTimestamp(),
      roleUpdatedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Generate referral code if promoting to staff role without one
    const isStaff = ['worker', 'manager', 'admin', 'superadmin'].includes(newRole);
    const targetData = targetSnap.data();

    if (isStaff && !targetData.referralCode) {
      const ROLE_CODES = {
        worker: { code: 'WRK', pct: 5 },
        manager: { code: 'MGR', pct: 10 },
        admin: { code: 'ADM', pct: 15 },
        superadmin: { code: 'SAD', pct: 20 },
      };
      const tier = ROLE_CODES[newRole] || ROLE_CODES.worker;
      const referralCode = `TNWR-${tier.code}-${Math.random().toString(36).toUpperCase().slice(-4)}`;

      updates.referralCode = referralCode;
      updates.discountPercent = tier.pct;

      // Create referral document
      await adminDb().collection('referralCodes').doc(referralCode).set({
        ownerUid: targetUid,
        role: newRole,
        discountPercent: tier.pct,
        timesUsed: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Apply role update
    await adminDb().collection('users').doc(targetUid).update(updates);

    // Audit log
    await adminDb().collection('auditLogs').add({
      actorId: actor.uid,
      actorRole: actor.role,
      action: 'role_changed',
      targetType: 'user',
      targetId: targetUid,
      severity: 'high',
      metadata: {
        previousRole: targetCurrentRole,
        newRole,
        targetEmail: targetData.email || null,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      targetUid,
      previousRole: targetCurrentRole,
      newRole,
    });
  })
);

export default router;
