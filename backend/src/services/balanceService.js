import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../config/firebaseAdmin.js';
import { pgPool } from '../config/db.js';
import { DEFAULT_WALLET, WALLET_STATUS, RELEASE_COOLDOWN_DAYS } from '../utils/constants.js';

// Helper to handle PostgreSQL queries safely
const executeSQL = async (query, params) => {
  if (!pgPool) return null;
  try {
    return await pgPool.query(query, params);
  } catch (err) {
    console.error('SQL Execution Error:', err);
    return null;
  }
};

/**
 * Normalize wallet data - handles legacy field naming
 * @param {Object} wallet - Raw wallet data
 * @param {string} userId - User ID
 * @returns {Object} Normalized wallet
 */
export const normalizeWallet = (wallet = {}, userId = null) => {
  const pendingAmount = Number(wallet.pendingAmount ?? wallet.pending ?? wallet.pendingApproval ?? 0);
  const withdrawableAmount = Number(wallet.withdrawableAmount ?? wallet.withdrawable ?? wallet.available ?? 0);
  const onHoldAmount = Number(wallet.onHoldAmount ?? wallet.onHold ?? 0);
  const totalEarnings = Number(
    wallet.totalEarnings ?? wallet.totalBalance ?? wallet.total ?? pendingAmount + withdrawableAmount + onHoldAmount
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
    // Legacy aliases
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

/**
 * Build a new wallet document with default values
 * @param {string} userId
 * @returns {Object}
 */
export const buildWallet = (userId) => ({
  ...DEFAULT_WALLET,
  userId,
  lastUpdated: FieldValue.serverTimestamp(),
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

/**
 * Get or create wallet for a user
 * @param {string} userId
 * @returns {Promise<Object>} Wallet data
 */
export const getWallet = async (userId) => {
  // Try PostgreSQL first
  if (pgPool) {
    const result = await executeSQL(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    );
    if (result?.rows?.[0]) {
      const row = result.rows[0];
      return normalizeWallet({
        userId: row.user_id,
        pendingAmount: Number(row.pending),
        withdrawableAmount: Number(row.withdrawable),
        totalBalance: Number(row.balance),
        totalEarnings: Number(row.total_earned),
        updatedAt: row.updated_at,
      }, userId);
    }
  }

  // Fallback to Firestore
  const db = adminDb();
  const walletRef = db.collection('wallets').doc(userId);
  const snapshot = await walletRef.get();

  if (!snapshot.exists) {
    const newWallet = buildWallet(userId);
    await walletRef.set(newWallet, { merge: true });
    return normalizeWallet(newWallet, userId);
  }

  return normalizeWallet(snapshot.data(), userId);
};

/**
 * Check if user has sufficient withdrawable balance
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<boolean>}
 */
export const hasSufficientBalance = async (userId, amount) => {
  const wallet = await getWallet(userId);
  return wallet.withdrawableAmount >= amount;
};

/**
 * Get pending releases for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getPendingReleases = async (userId) => {
  if (pgPool) {
    const result = await executeSQL(
      `SELECT * FROM pending_releases WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    if (result?.rows) {
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        orderId: row.order_id,
        amount: Number(row.amount),
        availableAt: row.available_at,
        status: row.status,
      }));
    }
  }

  const db = adminDb();
  const snapshot = await db.collection('pendingReleases')
    .where('userId', '==', userId)
    .where('status', '==', 'pending')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Release pending funds that have passed the cooldown period
 * Moves funds from pending -> withdrawable
 * @returns {Promise<number>} Number of releases processed
 */
export const releasePendingFunds = async () => {
  const now = new Date();
  let releasedCount = 0;

  // PostgreSQL Release
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const releases = await client.query(`
        SELECT id, user_id, amount, order_id FROM pending_releases
        WHERE status = 'pending' AND available_at <= NOW()
        FOR UPDATE SKIP LOCKED
        LIMIT 100;
      `);

      for (const release of releases.rows) {
        // Update wallet: move from pending to withdrawable
        await client.query(`
          UPDATE wallets SET
          pending = pending - $1,
          withdrawable = withdrawable + $1,
          updated_at = NOW()
          WHERE user_id = $2;
        `, [release.amount, release.user_id]);

        // Update release status
        await client.query(`
          UPDATE pending_releases SET
          status = 'released',
          released_at = NOW()
          WHERE id = $1;
        `, [release.id]);

        // Update transaction status
        await client.query(`
          UPDATE transactions SET
          status = 'completed'
          WHERE user_id = $1 AND order_id = $2 AND type = 'earning';
        `, [release.user_id, release.order_id]);

        releasedCount++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('SQL release funds failed:', err);
    } finally {
      client.release();
    }
  }

  // Firestore Release (for sync and real-time updates)
  const db = adminDb();
  const snapshots = await db.collection('pendingReleases')
    .where('status', '==', 'pending')
    .where('availableAt', '<=', now.toISOString())
    .limit(100)
    .get();

  if (!snapshots.empty) {
    for (const doc of snapshots.docs) {
      const data = doc.data();
      const { userId, amount, orderId } = data;

      const walletRef = db.collection('wallets').doc(userId);
      
      await db.runTransaction(async (transaction) => {
        transaction.update(walletRef, {
          pendingAmount: FieldValue.increment(-amount),
          pending: FieldValue.increment(-amount),
          withdrawableAmount: FieldValue.increment(amount),
          withdrawable: FieldValue.increment(amount),
          available: FieldValue.increment(amount),
          lastUpdated: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        transaction.update(doc.ref, {
          status: 'released',
          releasedAt: FieldValue.serverTimestamp()
        });

        // Update related transaction
        const txQuery = db.collection('transactions')
          .where('userId', '==', userId)
          .where('orderId', '==', orderId)
          .where('type', '==', 'earning')
          .limit(1);
        
        const txSnap = await transaction.get(txQuery);
        if (!txSnap.empty) {
          transaction.update(txSnap.docs[0].ref, { status: 'completed' });
        }
      });

      releasedCount++;
    }
  }

  return releasedCount;
};

/**
 * Deduct from withdrawable balance (for withdrawals)
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<boolean>}
 */
export const deductFromWithdrawable = async (userId, amount) => {
  // PostgreSQL
  if (pgPool) {
    const result = await executeSQL(
      `UPDATE wallets SET
       withdrawable = withdrawable - $1,
       on_hold = on_hold + $1,
       updated_at = NOW()
       WHERE user_id = $2 AND withdrawable >= $1
       RETURNING id;`,
      [amount, userId]
    );
    if (result?.rowCount > 0) return true;
  }

  // Firestore
  const db = adminDb();
  const walletRef = db.collection('wallets').doc(userId);
  
  try {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(walletRef);
      const wallet = normalizeWallet(snapshot.data(), userId);
      
      if (wallet.withdrawableAmount < amount) {
        throw new Error('Insufficient withdrawable balance');
      }

      transaction.update(walletRef, {
        withdrawableAmount: FieldValue.increment(-amount),
        withdrawable: FieldValue.increment(-amount),
        available: FieldValue.increment(-amount),
        onHoldAmount: FieldValue.increment(amount),
        onHold: FieldValue.increment(amount),
        updatedAt: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp(),
      });
    });
    return true;
  } catch (err) {
    console.error('Failed to deduct from withdrawable:', err);
    return false;
  }
};

/**
 * Update wallet after completed payout
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<void>}
 */
export const finalizePayout = async (userId, amount) => {
  // PostgreSQL
  if (pgPool) {
    await executeSQL(
      `UPDATE wallets SET
       on_hold = on_hold - $1,
       lifetime_withdrawn = lifetime_withdrawn + $1,
       updated_at = NOW()
       WHERE user_id = $2;`,
      [amount, userId]
    );
  }

  // Firestore
  const db = adminDb();
  const walletRef = db.collection('wallets').doc(userId);
  await walletRef.update({
    onHoldAmount: FieldValue.increment(-amount),
    onHold: FieldValue.increment(-amount),
    lifetimeWithdrawn: FieldValue.increment(amount),
    withdrawn: FieldValue.increment(amount),
    lifetimePaid: FieldValue.increment(amount),
    updatedAt: FieldValue.serverTimestamp(),
    lastUpdated: FieldValue.serverTimestamp(),
  });
};

/**
 * Cancel/reject payout - return funds to withdrawable
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<void>}
 */
export const returnFundsToWithdrawable = async (userId, amount) => {
  // PostgreSQL
  if (pgPool) {
    await executeSQL(
      `UPDATE wallets SET
       on_hold = on_hold - $1,
       withdrawable = withdrawable + $1,
       updated_at = NOW()
       WHERE user_id = $2;`,
      [amount, userId]
    );
  }

  // Firestore
  const db = adminDb();
  const walletRef = db.collection('wallets').doc(userId);
  await walletRef.update({
    onHoldAmount: FieldValue.increment(-amount),
    onHold: FieldValue.increment(-amount),
    withdrawableAmount: FieldValue.increment(amount),
    withdrawable: FieldValue.increment(amount),
    available: FieldValue.increment(amount),
    updatedAt: FieldValue.serverTimestamp(),
    lastUpdated: FieldValue.serverTimestamp(),
  });
};

export default {
  normalizeWallet,
  buildWallet,
  getWallet,
  hasSufficientBalance,
  getPendingReleases,
  releasePendingFunds,
  deductFromWithdrawable,
  finalizePayout,
  returnFundsToWithdrawable,
};
