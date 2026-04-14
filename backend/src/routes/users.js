import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const ROLE_HIERARCHY = ['client', 'worker', 'admin', 'owner'];

const normalizeRole = (role) =>
  ROLE_HIERARCHY.includes(String(role || '').trim().toLowerCase())
    ? String(role || '').trim().toLowerCase()
    : 'client';

const getRoleRank = (role) => ROLE_HIERARCHY.indexOf(normalizeRole(role));

const canActorChangeRole = (actorRole, targetCurrentRole, newRole) => {
  const actorRank = getRoleRank(actorRole);
  const targetCurrentRank = getRoleRank(targetCurrentRole);
  const newRoleRank = getRoleRank(newRole);

  if (actorRank <= targetCurrentRank) return false;
  if (actorRank <= newRoleRank) return false;
  if (newRole === 'owner') return false;

  return true;
};

const setRoleSchema = z.object({
  targetUid: z.string().trim().min(10).max(128),
  newRole: z.enum(['client', 'worker', 'admin']),
});

router.post(
  '/set-role',
  authGuard,
  validateBody(setRoleSchema),
  asyncHandler(async (req, res) => {
    const { targetUid, newRole } = req.validatedBody;
    const actor = req.currentUser;

    if (actor.uid === targetUid) {
      throw new HttpError(403, 'You cannot change your own role.');
    }

    const targetRef = adminDb().collection('users').doc(targetUid);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      throw new HttpError(404, 'Target user not found.');
    }

    const targetData = targetSnap.data() || {};
    const targetCurrentRole = normalizeRole(targetData.role);

    if (!canActorChangeRole(actor.role, targetCurrentRole, newRole)) {
      throw new HttpError(
        403,
        `You do not have permission to change a ${targetCurrentRole} to ${newRole}.`
      );
    }

    const updates = {
      role: newRole,
      roleUpdatedAt: FieldValue.serverTimestamp(),
      roleUpdatedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
    };

    const isStaffRole = ['worker', 'admin'].includes(newRole);
    if (isStaffRole && !targetData.referralCode) {
      const ROLE_CODES = {
        worker: { code: 'WRK', pct: 5 },
        admin: { code: 'ADM', pct: 15 },
      };
      const tier = ROLE_CODES[newRole];
      const referralCode = `TNWR-${tier.code}-${Math.random().toString(36).toUpperCase().slice(-4)}`;

      updates.referralCode = referralCode;
      updates.discountPercent = tier.pct;

      await adminDb().collection('referralCodes').doc(referralCode).set({
        ownerUid: targetUid,
        role: newRole,
        discountPercent: tier.pct,
        timesUsed: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await targetRef.update(updates);

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
