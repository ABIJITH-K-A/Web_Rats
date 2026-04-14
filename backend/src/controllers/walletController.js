import { HttpError } from '../lib/httpError.js';
import { isAdminLikeRole } from '../lib/roles.js';
import { serializeDocument } from '../lib/serialize.js';
import { getWallet, normalizeWallet } from '../services/balanceService.js';
import { getWithdrawalHistory, getTransactionHistory } from '../services/ledgerService.js';
import { adminDb } from '../config/firebaseAdmin.js';

/**
 * Check if current user can access target wallet
 */
const canAccessWallet = (currentUser, targetUid) =>
  currentUser.uid === targetUid || isAdminLikeRole(currentUser.role);

/**
 * Get wallet overview (balance + withdrawal history)
 * GET /wallet/:uid
 */
export const getWalletOverview = async (req, res) => {
  const targetUid = req.params.uid;

  if (!canAccessWallet(req.currentUser, targetUid)) {
    throw new HttpError(403, 'You do not have access to this wallet.');
  }

  // Get wallet data
  const wallet = await getWallet(targetUid);

  // Get withdrawal history
  const withdrawals = await getWithdrawalHistory(targetUid, 20);

  // Sort by requestedAt desc
  const sortedWithdrawals = [...withdrawals].sort((a, b) => {
    const aTime = new Date(a.requestedAt || 0).getTime();
    const bTime = new Date(b.requestedAt || 0).getTime();
    return bTime - aTime;
  });

  res.json({
    wallet: {
      userId: wallet.userId,
      totalBalance: wallet.totalBalance,
      pendingAmount: wallet.pendingAmount,
      withdrawableAmount: wallet.withdrawableAmount,
      onHoldAmount: wallet.onHoldAmount,
      totalEarnings: wallet.totalEarnings,
      lifetimeEarnings: wallet.lifetimeEarnings,
      lifetimeWithdrawn: wallet.lifetimeWithdrawn,
      status: wallet.status,
      updatedAt: wallet.updatedAt,
      // Legacy aliases
      total: wallet.total,
      pending: wallet.pending,
      withdrawable: wallet.withdrawable,
      onHold: wallet.onHold,
    },
    withdrawals: sortedWithdrawals,
  });
};

/**
 * Get transaction history
 * GET /wallet/:uid/transactions
 */
export const getTransactions = async (req, res) => {
  const targetUid = req.params.uid;
  const { category, limit = 20 } = req.query;

  if (!canAccessWallet(req.currentUser, targetUid)) {
    throw new HttpError(403, 'You do not have access to this wallet.');
  }

  const transactions = await getTransactionHistory(targetUid, {
    category,
    limit: parseInt(limit, 10),
  });

  res.json({ transactions });
};

/**
 * Admin: Get any wallet by ID
 * GET /admin/wallet/:uid
 */
export const getWalletAdmin = async (req, res) => {
  const targetUid = req.params.uid;
  const wallet = await getWallet(targetUid);
  const withdrawals = await getWithdrawalHistory(targetUid, 50);

  res.json({
    wallet,
    withdrawals,
  });
};

/**
 * Admin: List all wallets with pagination
 * GET /admin/wallets
 */
export const listWallets = async (req, res) => {
  const { limit = 50, cursor } = req.query;
  const db = adminDb();

  let query = db.collection('wallets').orderBy('updatedAt', 'desc').limit(parseInt(limit, 10));
  if (cursor) {
    const cursorDoc = await db.collection('wallets').doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const wallets = snapshot.docs.map(doc => ({
    id: doc.id,
    ...serializeDocument(doc),
  }));

  res.json({
    wallets,
    nextCursor: snapshot.docs[snapshot.docs.length - 1]?.id,
  });
};

/**
 * Get wallet stats for dashboard
 * GET /wallet/stats/overview
 */
export const getWalletStats = async (req, res) => {
  const db = adminDb();

  // Aggregate stats from all wallets
  const walletsSnapshot = await db.collection('wallets').get();

  let stats = {
    totalWallets: walletsSnapshot.size,
    totalPendingAmount: 0,
    totalWithdrawableAmount: 0,
    totalOnHoldAmount: 0,
    totalLifetimeEarnings: 0,
    totalLifetimeWithdrawn: 0,
  };

  walletsSnapshot.docs.forEach(doc => {
    const wallet = normalizeWallet(doc.data(), doc.id);
    stats.totalPendingAmount += wallet.pendingAmount;
    stats.totalWithdrawableAmount += wallet.withdrawableAmount;
    stats.totalOnHoldAmount += wallet.onHoldAmount;
    stats.totalLifetimeEarnings += wallet.lifetimeEarnings;
    stats.totalLifetimeWithdrawn += wallet.lifetimeWithdrawn;
  });

  res.json({ stats });
};

export default {
  getWalletOverview,
  getTransactions,
  getWalletAdmin,
  listWallets,
  getWalletStats,
};
