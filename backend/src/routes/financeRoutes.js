import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import roleGuard from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

const financeSettingsSchema = z.object({
  workerPayoutPercentage: z.number().min(0).max(100).optional(),
  reinvestmentPercentage: z.number().min(0).max(100).optional(),
  reservePercentage: z.number().min(0).max(100).optional(),
  owner1Uid: z.string().optional(),
  owner1Share: z.number().min(0).max(100).optional(),
  owner2Uid: z.string().optional(),
  owner2Share: z.number().min(0).max(100).optional(),
});

// GET /api/finance/settings — get current settings
router.get(
  '/settings',
  authGuard,
  roleGuard(['owner']),
  asyncHandler(async (req, res) => {
    const settingsSnap = await adminDb().collection('financeSettings').doc('global').get();
    res.json({ settings: settingsSnap.exists ? settingsSnap.data() : null });
  })
);

// PUT /api/finance/settings — update settings (owner only)
router.put(
  '/settings',
  authGuard,
  roleGuard(['owner']),
  validateBody(financeSettingsSchema),
  asyncHandler(async (req, res) => {
    const { uid } = req.currentUser;
    const data = req.validatedBody;

    const ref = adminDb().collection('financeSettings').doc('global');
    const current = await ref.get();
    const previous = current.exists ? current.data() : null;

    await ref.set({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
      history: FieldValue.arrayUnion({
        changedBy: uid,
        changedAt: new Date().toISOString(),
        previous,
      }),
    }, { merge: true });

    res.json({ success: true });
  })
);

// GET /api/finance/overview — revenue, expenses, profit
router.get(
  '/overview',
  authGuard,
  roleGuard(['owner']),
  asyncHandler(async (req, res) => {
    const txSnap = await adminDb().collection('transactions').get();
    const transactions = txSnap.docs.map((d) => d.data());

    const revenue = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const profit = revenue - expenses;

    res.json({ revenue, expenses, profit, transactionCount: transactions.length });
  })
);

// GET /api/finance/funds — reinvestment + reserve balances
router.get(
  '/funds',
  authGuard,
  roleGuard(['owner']),
  asyncHandler(async (req, res) => {
    const reinvestmentSnap = await adminDb().collection('funds').doc('reinvestment').get();
    const reserveSnap = await adminDb().collection('funds').doc('reserve').get();

    res.json({
      reinvestment: reinvestmentSnap.exists ? reinvestmentSnap.data() : { totalAmount: 0, availableAmount: 0 },
      reserve: reserveSnap.exists ? reserveSnap.data() : { totalAmount: 0, availableAmount: 0 },
    });
  })
);

// GET /api/finance/owner-earnings — get owner earnings
router.get(
  '/owner-earnings',
  authGuard,
  roleGuard(['owner']),
  asyncHandler(async (req, res) => {
    const { uid } = req.currentUser;
    const earningsSnap = await adminDb().collection('ownerEarnings').doc(uid).get();
    res.json({ earnings: earningsSnap.exists ? earningsSnap.data() : { totalEarnings: 0 } });
  })
);

export default router;
