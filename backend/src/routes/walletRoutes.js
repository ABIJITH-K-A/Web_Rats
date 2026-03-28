import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { isAdminLikeRole, isManagerLikeRole, normalizeValue } from '../lib/roles.js';
import { serializeDocument, serializeValue } from '../lib/serialize.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWALS_PER_WEEK = 4;

const withdrawSchema = z.object({
  amount: z.preprocess((value) => Number(value), z.number().finite().positive()),
  method: z.string().trim().min(2).max(40),
  details: z.record(z.any()).optional().default({}),
});

const buildWalletDocument = (userId) => ({
  userId,
  totalBalance: 0,
  pendingAmount: 0,
  withdrawableAmount: 0,
  onHoldAmount: 0,
  totalEarnings: 0,
  lifetimeEarnings: 0,
  lifetimeWithdrawn: 0,
  status: 'active',
  lastPayDate: null,
  nextPayDate: null,
  lastUpdated: FieldValue.serverTimestamp(),
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  total: 0,
  pending: 0,
  withdrawable: 0,
  onHold: 0,
  withdrawn: 0,
  available: 0,
  pendingApproval: 0,
  pendingPayout: 0,
  lifetimePaid: 0,
});

const normalizeWalletData = (wallet = {}, userId = null) => {
  const pendingAmount = Number(wallet.pendingAmount ?? wallet.pending ?? wallet.pendingApproval ?? 0);
  const withdrawableAmount = Number(
    wallet.withdrawableAmount ?? wallet.withdrawable ?? wallet.available ?? 0
  );
  const onHoldAmount = Number(wallet.onHoldAmount ?? wallet.onHold ?? 0);
  const totalEarnings = Number(
    wallet.totalEarnings ??
      wallet.totalBalance ??
      wallet.total ??
      pendingAmount + withdrawableAmount + onHoldAmount
  );
  const lifetimeEarnings = Number(wallet.lifetimeEarnings ?? wallet.lifetimePaid ?? totalEarnings);
  const lifetimeWithdrawn = Number(wallet.lifetimeWithdrawn ?? wallet.withdrawn ?? 0);

  return {
    ...wallet,
    userId: wallet.userId || userId,
    totalBalance: totalEarnings,
    pendingAmount,
    withdrawableAmount,
    onHoldAmount,
    totalEarnings,
    lifetimeEarnings,
    lifetimeWithdrawn,
    total: totalEarnings,
    pending: pendingAmount,
    withdrawable: withdrawableAmount,
    onHold: onHoldAmount,
    withdrawn: lifetimeWithdrawn,
    available: withdrawableAmount,
    pendingApproval: pendingAmount,
    pendingPayout: onHoldAmount,
    lifetimePaid: lifetimeWithdrawn,
  };
};

const canAccessWallet = (currentUser, targetUid) =>
  currentUser.uid === targetUid || isAdminLikeRole(currentUser.role) || isManagerLikeRole(currentUser.role);

const sortByRequestedAtDesc = (records = []) =>
  [...records].sort((left, right) => {
    const leftTime = new Date(left.requestedAt || 0).getTime() || 0;
    const rightTime = new Date(right.requestedAt || 0).getTime() || 0;
    return rightTime - leftTime;
  });

router.get(
  '/:uid',
  authGuard,
  asyncHandler(async (req, res) => {
    const targetUid = req.params.uid;

    if (!canAccessWallet(req.currentUser, targetUid)) {
      throw new HttpError(403, 'You do not have access to this wallet.');
    }

    const walletRef = adminDb().collection('wallets').doc(targetUid);
    const [walletSnapshot, withdrawalsSnapshot] = await Promise.all([
      walletRef.get(),
      adminDb().collection('withdrawals').where('userId', '==', targetUid).limit(40).get(),
    ]);

    if (!walletSnapshot.exists) {
      const initialWallet = buildWalletDocument(targetUid);
      await walletRef.set(initialWallet, { merge: true });
      const createdSnapshot = await walletRef.get();
      res.json({
        wallet: serializeDocument(createdSnapshot),
        withdrawals: [],
      });
      return;
    }

    const normalized = normalizeWalletData(walletSnapshot.data(), targetUid);
    await walletRef.set(normalized, { merge: true });
    const freshSnapshot = await walletRef.get();

    res.json({
      wallet: serializeDocument(freshSnapshot),
      withdrawals: sortByRequestedAtDesc(
        withdrawalsSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...serializeValue(docSnapshot.data()),
        }))
      ).slice(0, 20),
    });
  })
);

router.post(
  '/withdraw',
  authGuard,
  validateBody(withdrawSchema),
  asyncHandler(async (req, res) => {
    const currentUser = req.currentUser;
    const { amount, method, details } = req.validatedBody;
    const walletRef = adminDb().collection('wallets').doc(currentUser.uid);
    const withdrawalsRef = adminDb().collection('withdrawals');
    const transactionsRef = adminDb().collection('transactions');
    const since = new Date();

    since.setDate(since.getDate() - 7);

    if (amount < MIN_WITHDRAWAL) {
      throw new HttpError(400, `Minimum withdrawal is Rs ${MIN_WITHDRAWAL}.`);
    }

    const result = await adminDb().runTransaction(async (transaction) => {
      const [walletSnapshot, withdrawalsSnapshot] = await Promise.all([
        transaction.get(walletRef),
        transaction.get(withdrawalsRef.where('userId', '==', currentUser.uid).limit(25)),
      ]);

      const wallet = normalizeWalletData(
        walletSnapshot.exists ? walletSnapshot.data() : buildWalletDocument(currentUser.uid),
        currentUser.uid
      );

      const recentWithdrawals = withdrawalsSnapshot.docs
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          ...serializeValue(docSnapshot.data()),
        }))
        .filter((item) => {
          const requestedAt = item.requestedAt ? new Date(item.requestedAt) : null;
          return requestedAt && requestedAt >= since;
        });

      if (amount > wallet.withdrawableAmount) {
        throw new HttpError(400, 'Insufficient withdrawable balance.');
      }

      if (recentWithdrawals.length >= MAX_WITHDRAWALS_PER_WEEK) {
        throw new HttpError(
          400,
          `Maximum ${MAX_WITHDRAWALS_PER_WEEK} withdrawals per week allowed.`
        );
      }

      const existingPending = recentWithdrawals.find((item) =>
        ['pending', 'approved'].includes(normalizeValue(item.status))
      );

      if (existingPending) {
        throw new HttpError(400, 'You already have a withdrawal being processed.');
      }

      const withdrawalRef = withdrawalsRef.doc();
      const transactionRef = transactionsRef.doc();

      transaction.set(
        walletRef,
        {
          ...(walletSnapshot.exists ? {} : buildWalletDocument(currentUser.uid)),
          withdrawableAmount: Number(wallet.withdrawableAmount) - amount,
          onHoldAmount: Number(wallet.onHoldAmount) + amount,
          withdrawable: Number(wallet.withdrawableAmount) - amount,
          onHold: Number(wallet.onHoldAmount) + amount,
          updatedAt: FieldValue.serverTimestamp(),
          lastUpdated: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      transaction.set(withdrawalRef, {
        userId: currentUser.uid,
        amount,
        method,
        details,
        status: 'pending',
        requestedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(transactionRef, {
        userId: currentUser.uid,
        type: 'expense',
        category: 'withdrawal',
        amount: -amount,
        referenceId: withdrawalRef.id,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        withdrawalId: withdrawalRef.id,
      };
    });

    res.status(201).json(result);
  })
);

export default router;
