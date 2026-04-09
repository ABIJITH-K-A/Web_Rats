import { HttpError } from '../lib/httpError.js';
import { MIN_WITHDRAWAL, MAX_WITHDRAWALS_PER_WEEK, TRANSACTION_STATUS } from '../utils/constants.js';
import { hasSufficientBalance, finalizePayout, returnFundsToWithdrawable, normalizeWallet, buildWallet } from '../services/balanceService.js';
import { serializeValue } from '../lib/serialize.js';
import { pgPool } from '../config/db.js';
import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Request a withdrawal/payout
 * POST /payout/withdraw
 */
export const requestWithdrawal = async (req, res) => {
  const currentUser = req.currentUser;
  const { amount, method, details = {} } = req.validatedBody;

  // Validate minimum withdrawal
  if (amount < MIN_WITHDRAWAL) {
    throw new HttpError(400, `Minimum withdrawal is Rs ${MIN_WITHDRAWAL}.`);
  }

  // Check for sufficient balance
  const hasBalance = await hasSufficientBalance(currentUser.uid, amount);
  if (!hasBalance) {
    throw new HttpError(400, 'Insufficient withdrawable balance.');
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  // --- POSTGRESQL TRANSACTION (Source of Truth) ---
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // Lock wallet and check balance
      const walletRes = await client.query(
        'SELECT withdrawable FROM wallets WHERE user_id = $1 FOR UPDATE',
        [currentUser.uid]
      );

      if (!walletRes.rows[0] || Number(walletRes.rows[0].withdrawable) < amount) {
        throw new HttpError(400, 'Insufficient withdrawable balance.');
      }

      // Check weekly withdrawal limit
      const recentRes = await client.query(
        'SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND category = $2 AND created_at >= $3',
        [currentUser.uid, 'withdrawal', since.toISOString()]
      );

      if (Number(recentRes.rows[0].count) >= MAX_WITHDRAWALS_PER_WEEK) {
        throw new HttpError(400, `Max ${MAX_WITHDRAWALS_PER_WEEK} withdrawals per week.`);
      }

      // Check for pending withdrawal
      const pendingRes = await client.query(
        "SELECT id FROM transactions WHERE user_id = $1 AND category = 'withdrawal' AND status = 'pending' LIMIT 1",
        [currentUser.uid]
      );

      if (pendingRes.rows.length > 0) {
        throw new HttpError(400, 'You already have a pending withdrawal.');
      }

      // Deduct from wallet
      await client.query(
        'UPDATE wallets SET withdrawable = withdrawable - $1, on_hold = on_hold + $1, updated_at = NOW() WHERE user_id = $2',
        [amount, currentUser.uid]
      );

      // Record withdrawal transaction
      const txRes = await client.query(
        'INSERT INTO transactions (user_id, type, category, amount, status, meta) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [currentUser.uid, 'expense', 'withdrawal', -amount, 'pending', JSON.stringify({ method, details })]
      );

      // Create withdrawal record
      const withdrawalRes = await client.query(
        'INSERT INTO withdrawals (user_id, amount, method, details, status, requested_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
        [currentUser.uid, amount, method, JSON.stringify(details), 'pending']
      );

      await client.query('COMMIT');

      // Sync to Firestore for real-time updates
      try {
        const db = adminDb();
        const walletRef = db.collection('wallets').doc(currentUser.uid);
        await walletRef.update({
          withdrawableAmount: FieldValue.increment(-amount),
          withdrawable: FieldValue.increment(-amount),
          available: FieldValue.increment(-amount),
          onHoldAmount: FieldValue.increment(amount),
          onHold: FieldValue.increment(amount),
          updatedAt: FieldValue.serverTimestamp(),
        });

        const withdrawalRef = db.collection('withdrawals').doc();
        await withdrawalRef.set({
          userId: currentUser.uid,
          amount,
          method,
          details,
          status: 'pending',
          requestedAt: FieldValue.serverTimestamp(),
        });
      } catch (syncErr) {
        console.error('Firestore sync error (non-critical):', syncErr);
      }

      res.status(201).json({
        withdrawalId: withdrawalRes.rows[0].id,
        sqlTransactionId: txRes.rows[0].id,
        success: true,
      });
      return;
    } catch (err) {
      await client.query('ROLLBACK');
      if (err instanceof HttpError) throw err;
      console.error('SQL Withdrawal failed, falling back to Firestore:', err);
    } finally {
      client.release();
    }
  }

  // --- FIRESTORE FALLBACK ---
  const db = adminDb();
  const result = await db.runTransaction(async (transaction) => {
    const walletRef = db.collection('wallets').doc(currentUser.uid);
    const withdrawalsRef = db.collection('withdrawals');

    const [walletSnapshot, withdrawalsSnapshot] = await Promise.all([
      transaction.get(walletRef),
      transaction.get(withdrawalsRef.where('userId', '==', currentUser.uid).limit(25)),
    ]);

    const wallet = normalizeWallet(
      walletSnapshot.exists ? walletSnapshot.data() : buildWallet(currentUser.uid),
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
      throw new HttpError(400, `Maximum ${MAX_WITHDRAWALS_PER_WEEK} withdrawals per week allowed.`);
    }

    const existingPending = recentWithdrawals.find((item) =>
      ['pending', 'approved'].includes(item.status)
    );

    if (existingPending) {
      throw new HttpError(400, 'You already have a withdrawal being processed.');
    }

    const withdrawalRef = withdrawalsRef.doc();

    transaction.set(
      walletRef,
      {
        ...(walletSnapshot.exists ? {} : buildWallet(currentUser.uid)),
        withdrawableAmount: Number(wallet.withdrawableAmount) - amount,
        onHoldAmount: Number(wallet.onHoldAmount) + amount,
        withdrawable: Number(wallet.withdrawableAmount) - amount,
        onHold: Number(wallet.onHoldAmount) + amount,
        updatedAt: FieldValue.serverTimestamp(),
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

    return { withdrawalId: withdrawalRef.id };
  });

  res.status(201).json(result);
};

/**
 * Approve a withdrawal (Admin only)
 * POST /payout/:withdrawalId/approve
 */
export const approveWithdrawal = async (req, res) => {
  const { withdrawalId } = req.params;

  // Update in PostgreSQL
  if (pgPool) {
    await pgPool.query(
      "UPDATE withdrawals SET status = 'approved', approved_at = NOW(), approved_by = $1 WHERE id = $2",
      [req.currentUser.uid, withdrawalId]
    );
  }

  // Update in Firestore
  const db = adminDb();
  const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
  await withdrawalRef.update({
    status: 'approved',
    approvedAt: FieldValue.serverTimestamp(),
    approvedBy: req.currentUser.uid,
  });

  res.json({ success: true, message: 'Withdrawal approved' });
};

/**
 * Complete/process a withdrawal payout (Admin only)
 * POST /payout/:withdrawalId/complete
 */
export const completeWithdrawal = async (req, res) => {
  const { withdrawalId } = req.params;
  const { notes = '' } = req.body;

  // Get withdrawal details first
  let withdrawal;
  if (pgPool) {
    const result = await pgPool.query('SELECT * FROM withdrawals WHERE id = $1', [withdrawalId]);
    if (result.rows[0]) {
      withdrawal = {
        userId: result.rows[0].user_id,
        amount: Number(result.rows[0].amount),
        status: result.rows[0].status,
      };
    }
  }

  if (!withdrawal) {
    const db = adminDb();
    const doc = await db.collection('withdrawals').doc(withdrawalId).get();
    if (!doc.exists) throw new HttpError(404, 'Withdrawal not found');
    withdrawal = { userId: doc.data().userId, amount: doc.data().amount, status: doc.data().status };
  }

  // Move from onHold to lifetimeWithdrawn
  await finalizePayout(withdrawal.userId, withdrawal.amount);

  // Update withdrawal record
  if (pgPool) {
    await pgPool.query(
      "UPDATE withdrawals SET status = 'completed', completed_at = NOW(), completed_by = $1, notes = $2 WHERE id = $3",
      [req.currentUser.uid, notes, withdrawalId]
    );
  }

  const db = adminDb();
  await db.collection('withdrawals').doc(withdrawalId).update({
    status: 'completed',
    completedAt: FieldValue.serverTimestamp(),
    completedBy: req.currentUser.uid,
    notes,
  });

  res.json({ success: true, message: 'Payout completed' });
};

/**
 * Reject a withdrawal (Admin only)
 * POST /payout/:withdrawalId/reject
 */
export const rejectWithdrawal = async (req, res) => {
  const { withdrawalId } = req.params;
  const { reason = '' } = req.body;

  // Get withdrawal details
  let withdrawal;
  if (pgPool) {
    const result = await pgPool.query('SELECT * FROM withdrawals WHERE id = $1', [withdrawalId]);
    if (result.rows[0]) {
      withdrawal = {
        userId: result.rows[0].user_id,
        amount: Number(result.rows[0].amount),
      };
    }
  }

  if (!withdrawal) {
    const db = adminDb();
    const doc = await db.collection('withdrawals').doc(withdrawalId).get();
    if (!doc.exists) throw new HttpError(404, 'Withdrawal not found');
    withdrawal = { userId: doc.data().userId, amount: doc.data().amount };
  }

  // Return funds to withdrawable balance
  await returnFundsToWithdrawable(withdrawal.userId, withdrawal.amount);

  // Update withdrawal record
  if (pgPool) {
    await pgPool.query(
      "UPDATE withdrawals SET status = 'rejected', rejected_at = NOW(), rejected_by = $1, rejection_reason = $2 WHERE id = $3",
      [req.currentUser.uid, reason, withdrawalId]
    );
  }

  const db = adminDb();
  await db.collection('withdrawals').doc(withdrawalId).update({
    status: 'rejected',
    rejectedAt: FieldValue.serverTimestamp(),
    rejectedBy: req.currentUser.uid,
    rejectionReason: reason,
  });

  res.json({ success: true, message: 'Withdrawal rejected, funds returned to wallet' });
};

/**
 * Get pending withdrawals (Admin only)
 * GET /payout/pending
 */
export const getPendingWithdrawals = async (req, res) => {
  let withdrawals = [];

  if (pgPool) {
    const result = await pgPool.query(
      `SELECT w.*, u.name as user_name, u.email as user_email 
       FROM withdrawals w 
       LEFT JOIN users u ON w.user_id = u.id 
       WHERE w.status = 'pending' 
       ORDER BY w.requested_at DESC 
       LIMIT 100`
    );
    if (result?.rows) {
      withdrawals = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        amount: Number(row.amount),
        method: row.method,
        details: row.details,
        status: row.status,
        requestedAt: row.requested_at,
      }));
    }
  }

  // Fallback to Firestore if no SQL results
  if (withdrawals.length === 0) {
    const db = adminDb();
    const snapshot = await db.collection('withdrawals')
      .where('status', '==', 'pending')
      .orderBy('requestedAt', 'desc')
      .limit(100)
      .get();

    withdrawals = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      let userName = '';
      let userEmail = '';
      try {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          userName = userDoc.data().name;
          userEmail = userDoc.data().email;
        }
      } catch { /* ignore */ }

      return {
        id: doc.id,
        userId: data.userId,
        userName,
        userEmail,
        amount: data.amount,
        method: data.method,
        details: data.details,
        status: data.status,
        requestedAt: data.requestedAt?.toDate?.() || data.requestedAt,
      };
    }));
  }

  res.json({ withdrawals, count: withdrawals.length });
};

export default {
  requestWithdrawal,
  approveWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  getPendingWithdrawals,
};
