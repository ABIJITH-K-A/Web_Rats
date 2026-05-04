import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminAuth, adminDb } from '../config/firebaseAdmin.js';
import {
  getReferralDiscountForRole,
  makeReferralCode,
} from '../lib/referrals.js';
import { normalizeRole } from '../lib/roles.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { serializeValue } from '../lib/serialize.js';
import { authGuard } from '../middleware/authGuard.js';
import roleGuard from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const ROLE_HIERARCHY = ['client', 'worker', 'admin', 'owner'];

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

const approveWorkerSchema = z.object({
  applicationUid: z.string().trim().min(10).max(128),
  decision: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(500).optional().default(''),
});

const setRoleClaim = async (uid, role) => {
  const userRecord = await adminAuth().getUser(uid);
  await adminAuth().setCustomUserClaims(uid, {
    ...(userRecord.customClaims || {}),
    role,
  });
};

const ensureReferralCode = async ({ uid, role, existingCode }) => {
  if (existingCode) {
    await adminDb()
      .collection('referralCodes')
      .doc(existingCode)
      .set(
        {
          ownerUid: uid,
          role,
          discountPercent: getReferralDiscountForRole(role),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    return existingCode;
  }

  const referralCode = makeReferralCode(role);
  await adminDb()
    .collection('referralCodes')
    .doc(referralCode)
    .set(
      {
        ownerUid: uid,
        role,
        discountPercent: getReferralDiscountForRole(role),
        timesUsed: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return referralCode;
};

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

    const referralCode = ['client', 'worker', 'admin'].includes(newRole)
      ? await ensureReferralCode({
          uid: targetUid,
          role: newRole,
          existingCode: targetData.referralCode,
        })
      : null;

    const updates = {
      role: newRole,
      ...(referralCode ? { referralCode } : {}),
      discountPercent: getReferralDiscountForRole(newRole),
      roleUpdatedAt: FieldValue.serverTimestamp(),
      roleUpdatedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await targetRef.update(updates);
    await setRoleClaim(targetUid, newRole);

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

router.get(
  '/worker-applications',
  authGuard,
  roleGuard(['admin', 'owner']),
  asyncHandler(async (req, res) => {
    const snapshot = await adminDb()
      .collection('workerApplications')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    res.json({
      applications: snapshot.docs.map((doc) => ({
        id: doc.id,
        ...serializeValue(doc.data()),
      })),
    });
  })
);

router.post(
  '/approve-worker',
  authGuard,
  roleGuard(['admin', 'owner']),
  validateBody(approveWorkerSchema),
  asyncHandler(async (req, res) => {
    const { applicationUid, decision, note } = req.validatedBody;
    const actor = req.currentUser;
    const db = adminDb();
    const applicationRef = db.collection('workerApplications').doc(applicationUid);
    const userRef = db.collection('users').doc(applicationUid);
    const workerRef = db.collection('workerProfiles').doc(applicationUid);

    const [applicationSnap, userSnap, workerSnap] = await Promise.all([
      applicationRef.get(),
      userRef.get(),
      workerRef.get(),
    ]);

    if (!applicationSnap.exists) {
      throw new HttpError(404, 'Worker application not found.');
    }
    if (!userSnap.exists) {
      throw new HttpError(404, 'Applicant user profile not found.');
    }

    const user = userSnap.data() || {};
    const workerProfile = workerSnap.exists ? workerSnap.data() || {} : {};
    const batch = db.batch();

    if (decision === 'approved') {
      const referralCode = await ensureReferralCode({
        uid: applicationUid,
        role: 'worker',
        existingCode: user.referralCode,
      });

      batch.set(
        userRef,
        {
          role: 'worker',
          status: 'active',
          workerApprovalStatus: 'approved',
          referralCode,
          discountPercent: getReferralDiscountForRole('worker'),
          approvedBy: actor.uid,
          approvedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      batch.set(
        workerRef,
        {
          ...workerProfile,
          uid: applicationUid,
          approvalStatus: 'approved',
          availabilityStatus: workerProfile.availabilityStatus || 'available',
          approvedBy: actor.uid,
          approvedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await setRoleClaim(applicationUid, 'worker');
    } else {
      batch.set(
        userRef,
        {
          role: 'client',
          status: 'active',
          workerApprovalStatus: 'rejected',
          rejectionNote: note || null,
          rejectedBy: actor.uid,
          rejectedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      batch.set(
        workerRef,
        {
          approvalStatus: 'rejected',
          availabilityStatus: 'unavailable',
          rejectionNote: note || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await setRoleClaim(applicationUid, 'client');
    }

    batch.set(
      applicationRef,
      {
        status: decision,
        reviewedBy: actor.uid,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewNote: note || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(db.collection('auditLogs').doc(), {
      actorId: actor.uid,
      actorRole: actor.role,
      action: `worker_application_${decision}`,
      targetType: 'workerApplication',
      targetId: applicationUid,
      severity: decision === 'approved' ? 'medium' : 'low',
      metadata: {
        applicantEmail: user.email || null,
        note: note || null,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    res.json({
      success: true,
      applicationUid,
      decision,
      role: decision === 'approved' ? 'worker' : 'client',
    });
  })
);

export default router;
