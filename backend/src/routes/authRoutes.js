import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminAuth, adminDb } from '../config/firebaseAdmin.js';
import {
  clampReferralDiscountPercent,
  getReferralDiscountForRole,
  makeReferralCode,
} from '../lib/referrals.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { serializeValue } from '../lib/serialize.js';
import { normalizeRole } from '../lib/roles.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const organizationSchema = z.object({
  organizationType: z.enum(['college', 'company', 'startup', 'other']).default('college'),
  organizationName: z.string().trim().min(2).max(160),
  organizationAddress: z.string().trim().min(4).max(500),
  organizationEmail: z.string().trim().email().max(160),
});

const clientSignupSchema = organizationSchema.extend({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(32),
  customerType: z.enum(['new', 'returning']).optional().default('new'),
  usedReferralCode: z.string().trim().max(80).nullable().optional().default(null),
});

const staffSignupSchema = organizationSchema.extend({
  inviteKey: z.string().trim().max(80).optional().default(''),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().default(''),
  phone: z.string().trim().min(5).max(32),
  skills: z.array(z.string().trim().min(2).max(80)).max(20).optional().default([]),
  workingDays: z.array(z.number().int().min(0).max(6)).max(7).optional().default([1, 2, 3, 4, 5]),
  availableHours: z
    .object({
      start: z.string().trim().max(12).default('09:00'),
      end: z.string().trim().max(12).default('18:00'),
      timezone: z.string().trim().max(80).default('Asia/Kolkata'),
    })
    .optional()
    .default({ start: '09:00', end: '18:00', timezone: 'Asia/Kolkata' }),
  contactMethods: z
    .array(z.enum(['chat', 'voice', 'video']))
    .min(1)
    .max(3)
    .optional()
    .default(['chat']),
  portfolioLinks: z.array(z.string().trim().max(300)).max(10).optional().default([]),
});

const sanitizeString = (value) => String(value || '').trim();

const getReferralData = async (code) => {
  const normalizedCode = sanitizeString(code).toUpperCase();
  if (!normalizedCode) return null;

  const snap = await adminDb().collection('referralCodes').doc(normalizedCode).get();
  if (!snap.exists) {
    throw new HttpError(400, 'Referral code is invalid.');
  }

  const data = snap.data() || {};
  return {
    code: normalizedCode,
    ownerUid: data.ownerUid || null,
    role: normalizeRole(data.role),
    discountPercent: clampReferralDiscountPercent(
      data.discountPercent || getReferralDiscountForRole(data.role)
    ),
  };
};

const getInviteData = async (key) => {
  const normalizedKey = sanitizeString(key).toUpperCase();
  if (!normalizedKey) return null;

  const snap = await adminDb().collection('inviteKeys').doc(normalizedKey).get();
  if (!snap.exists) {
    throw new HttpError(400, 'Invite key is invalid.');
  }

  const data = snap.data() || {};
  const role = normalizeRole(data.role);
  const expiresAt = data.expiresAt?.toDate?.() || null;
  const usedCount = Number(data.usedCount || 0);
  const maxUses = Number(data.maxUses || 1);
  const multiUse = Boolean(data.multiUse || maxUses > 1);

  if (!['worker', 'admin'].includes(role)) {
    throw new HttpError(400, 'Invite key is not valid for staff registration.');
  }
  if (data.scope && data.scope !== 'staff') {
    throw new HttpError(400, 'Invite key scope is invalid.');
  }
  if (sanitizeString(data.status || 'active').toLowerCase() !== 'active') {
    throw new HttpError(400, 'Invite key is no longer active.');
  }
  if (expiresAt && expiresAt < new Date()) {
    throw new HttpError(400, 'Invite key has expired.');
  }
  if (!multiUse && (data.usedBy || data.used)) {
    throw new HttpError(400, 'Invite key has already been used.');
  }
  if (multiUse && usedCount >= maxUses) {
    throw new HttpError(400, 'Invite key has reached its usage limit.');
  }

  return {
    key: normalizedKey,
    role,
    multiUse,
    maxUses,
    usedCount,
  };
};

const setRoleClaim = async (uid, role) => {
  const userRecord = await adminAuth().getUser(uid);
  await adminAuth().setCustomUserClaims(uid, {
    ...(userRecord.customClaims || {}),
    role,
  });
};

const buildReferralRecord = (uid, role) => {
  const referralCode = makeReferralCode(role);
  const discountPercent = getReferralDiscountForRole(role);

  return {
    referralCode,
    discountPercent,
    referralDoc: {
      ownerUid: uid,
      role,
      discountPercent,
      timesUsed: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  };
};

const buildBaseProfile = ({ uid, email, role, name, phone, organization, referral }) => ({
  uid,
  name,
  email,
  phone,
  role,
  status: 'active',
  customerType: 'new',
  organizationType: organization.organizationType,
  organizationName: organization.organizationName,
  organizationAddress: organization.organizationAddress,
  organizationEmail: organization.organizationEmail,
  referralCode: referral.referralCode,
  discountPercent: referral.discountPercent,
  usedReferralCode: null,
  referredBy: null,
  referralDiscountPercent: 0,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

router.get('/me', authGuard, (req, res) => {
  res.json({
    user: {
      uid: req.currentUser.uid,
      email: req.currentUser.email,
      role: req.currentUser.role,
      profile: serializeValue(req.currentUser.profile || {}),
    },
  });
});

router.get(
  '/validate-referral/:code',
  asyncHandler(async (req, res) => {
    const referral = await getReferralData(req.params.code);

    res.json({
      valid: true,
      code: referral.code,
      role: referral.role,
      ownerUid: referral.ownerUid,
      discountPercent: referral.discountPercent,
    });
  })
);

router.get(
  '/validate-invite/:key',
  asyncHandler(async (req, res) => {
    const invite = await getInviteData(req.params.key);

    res.json({
      valid: true,
      key: invite.key,
      role: invite.role,
      maxUses: invite.maxUses,
      usedCount: invite.usedCount,
    });
  })
);

router.post(
  '/complete-client-signup',
  authGuard,
  validateBody(clientSignupSchema),
  asyncHandler(async (req, res) => {
    const { uid, email } = req.currentUser;
    const data = req.validatedBody;
    const referralData = await getReferralData(data.usedReferralCode);
    const ownReferral = buildReferralRecord(uid, 'client');
    const userRef = adminDb().collection('users').doc(uid);
    const existing = await userRef.get();

    if (existing.exists && existing.data()?.role) {
      throw new HttpError(409, 'Profile already exists for this account.');
    }

    const profile = {
      ...buildBaseProfile({
        uid,
        email: email || '',
        role: 'client',
        name: data.name,
        phone: data.phone,
        organization: data,
        referral: ownReferral,
      }),
      customerType: data.customerType,
      usedReferralCode: referralData?.code || null,
      referredBy: referralData?.ownerUid || null,
      referralDiscountPercent: referralData?.discountPercent || 0,
    };

    const batch = adminDb().batch();
    batch.set(userRef, profile, { merge: true });
    batch.set(
      adminDb().collection('referralCodes').doc(ownReferral.referralCode),
      ownReferral.referralDoc,
      { merge: true }
    );
    if (referralData?.code) {
      batch.set(
        adminDb().collection('referralCodes').doc(referralData.code),
        {
          timesUsed: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
    await setRoleClaim(uid, 'client');

    res.status(201).json({
      success: true,
      role: 'client',
      profile: serializeValue(profile),
    });
  })
);

router.post(
  '/complete-staff-signup',
  authGuard,
  validateBody(staffSignupSchema),
  asyncHandler(async (req, res) => {
    const { uid, email } = req.currentUser;
    const data = req.validatedBody;
    const invite = await getInviteData(data.inviteKey);
    const role = invite?.role || 'client';
    const approvalPending = !invite;
    const ownReferral = buildReferralRecord(uid, role);
    const name = `${data.firstName} ${data.lastName}`.trim();
    const userRef = adminDb().collection('users').doc(uid);
    const existing = await userRef.get();

    if (existing.exists && existing.data()?.role) {
      throw new HttpError(409, 'Profile already exists for this account.');
    }

    const profile = {
      ...buildBaseProfile({
        uid,
        email: email || '',
        role,
        name,
        phone: data.phone,
        organization: data,
        referral: ownReferral,
      }),
      status: approvalPending ? 'pending_worker_approval' : 'active',
      workerApprovalStatus: approvalPending ? 'pending' : 'approved',
      inviteKeyUsed: invite?.key || null,
    };

    const workerProfile = {
      uid,
      name,
      email: email || '',
      phone: data.phone,
      skills: data.skills,
      workingDays: data.workingDays,
      availableHours: data.availableHours,
      contactMethods: data.contactMethods,
      portfolioLinks: data.portfolioLinks,
      maxActiveOrders: 3,
      availabilityStatus: approvalPending ? 'unavailable' : 'available',
      approvalStatus: approvalPending ? 'pending' : 'approved',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const batch = adminDb().batch();
    batch.set(userRef, profile, { merge: true });
    batch.set(
      adminDb().collection('workerProfiles').doc(uid),
      workerProfile,
      { merge: true }
    );
    batch.set(
      adminDb().collection('referralCodes').doc(ownReferral.referralCode),
      ownReferral.referralDoc,
      { merge: true }
    );

    if (!approvalPending) {
      if (invite?.key) {
        const inviteRef = adminDb().collection('inviteKeys').doc(invite.key);
        batch.set(
          inviteRef,
          {
            used: !invite.multiUse,
            status: invite.multiUse ? 'active' : 'used',
            usedBy: uid,
            usedByName: name,
            usedAt: FieldValue.serverTimestamp(),
            usedCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } else {
      batch.set(
        adminDb().collection('workerApplications').doc(uid),
        {
          uid,
          name,
          email: email || '',
          phone: data.phone,
          organizationType: data.organizationType,
          organizationName: data.organizationName,
          organizationAddress: data.organizationAddress,
          organizationEmail: data.organizationEmail,
          skills: data.skills,
          workingDays: data.workingDays,
          availableHours: data.availableHours,
          contactMethods: data.contactMethods,
          portfolioLinks: data.portfolioLinks,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    await setRoleClaim(uid, role);

    res.status(201).json({
      success: true,
      role,
      approvalPending,
      profile: serializeValue(profile),
    });
  })
);

router.post('/logout', authGuard, (req, res) => {
  res.status(204).end();
});

export default router;
