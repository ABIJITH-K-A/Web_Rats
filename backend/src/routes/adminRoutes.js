import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { serializeDocument } from '../lib/serialize.js';
import { authGuard } from '../middleware/authGuard.js';
import roleGuard from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const approveWithdrawalSchema = z.object({
  withdrawalId: z.string().trim().min(4).max(128),
  action: z.enum(['approved', 'rejected', 'completed']),
});

const sortByCreatedAtDesc = (records = []) =>
  [...records].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime() || 0;
    const rightTime = new Date(right.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  });

router.get(
  '/orders',
  authGuard,
  roleGuard(['admin', 'superadmin', 'owner']),
  asyncHandler(async (req, res) => {
    const snapshot = await adminDb().collection('orders').limit(150).get();
    res.json({
      orders: sortByCreatedAtDesc(snapshot.docs.map(serializeDocument)),
    });
  })
);

router.post(
  '/approve-withdrawal',
  authGuard,
  roleGuard(['admin', 'superadmin', 'owner']),
  validateBody(approveWithdrawalSchema),
  asyncHandler(async (req, res) => {
    const { withdrawalId, action } = req.validatedBody;
    const withdrawalRef = adminDb().collection('withdrawals').doc(withdrawalId);
    const transactionsRef = adminDb().collection('transactions');

    const result = await adminDb().runTransaction(async (transaction) => {
      const withdrawalSnapshot = await transaction.get(withdrawalRef);

      if (!withdrawalSnapshot.exists) {
        throw new HttpError(404, 'Withdrawal not found.');
      }

      const withdrawal = withdrawalSnapshot.data();
      const walletRef = adminDb().collection('wallets').doc(withdrawal.userId);
      const walletSnapshot = await transaction.get(walletRef);

      if (!walletSnapshot.exists) {
        throw new HttpError(404, 'Wallet not found for withdrawal.');
      }

      const wallet = walletSnapshot.data();
      const amount = Number(withdrawal.amount || 0);
      const nextWalletPatch = {
        updatedAt: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp(),
      };

      if (action === 'rejected') {
        nextWalletPatch.onHoldAmount = Math.max(
          Number(wallet.onHoldAmount || wallet.onHold || 0) - amount,
          0
        );
        nextWalletPatch.withdrawableAmount =
          Number(wallet.withdrawableAmount || wallet.withdrawable || 0) + amount;
        nextWalletPatch.onHold = Math.max(
          Number(wallet.onHoldAmount || wallet.onHold || 0) - amount,
          0
        );
        nextWalletPatch.withdrawable =
          Number(wallet.withdrawableAmount || wallet.withdrawable || 0) + amount;
      }

      if (action === 'completed') {
        nextWalletPatch.onHoldAmount = Math.max(
          Number(wallet.onHoldAmount || wallet.onHold || 0) - amount,
          0
        );
        nextWalletPatch.onHold = Math.max(
          Number(wallet.onHoldAmount || wallet.onHold || 0) - amount,
          0
        );
        nextWalletPatch.lifetimeWithdrawn =
          Number(wallet.lifetimeWithdrawn || wallet.withdrawn || 0) + amount;
        nextWalletPatch.withdrawn =
          Number(wallet.lifetimeWithdrawn || wallet.withdrawn || 0) + amount;
        nextWalletPatch.lifetimePaid =
          Number(wallet.lifetimeWithdrawn || wallet.withdrawn || 0) + amount;
      }

      transaction.update(walletRef, nextWalletPatch);
      transaction.update(withdrawalRef, {
        status: action,
        processedBy: req.currentUser.uid,
        processedByName:
          req.currentUser.profile?.name || req.currentUser.email || 'Admin',
        processedAt: FieldValue.serverTimestamp(),
      });

      return {
        withdrawalId,
        status: action,
        userId: withdrawal.userId,
      };
    });

    const transactionSnapshot = await transactionsRef
      .where('referenceId', '==', withdrawalId)
      .limit(1)
      .get()
      .catch(() => null);

    if (transactionSnapshot && !transactionSnapshot.empty) {
      await transactionSnapshot.docs[0].ref.update({
        status: action,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const updatedWithdrawal = await withdrawalRef.get();
    res.json({
      result,
      withdrawal: serializeDocument(updatedWithdrawal),
    });
  })
);

export default router;
