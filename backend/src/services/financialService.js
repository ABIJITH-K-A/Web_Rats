import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { pgPool } from '../config/db.js';

// Core Business Rules (Ultra 20x)
const WORKER_SHARE_NORMAL = 80;
const WORKER_SHARE_REFERRAL = 82;
const COMPANY_SHARE_NORMAL = 20;
const COMPANY_SHARE_REFERRAL = 18;

// Cooldown for fund release (3 days)
const RELEASE_COOLDOWN_DAYS = 3;

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

export const creditWorkerForOrder = async (orderId) => {
  const db = adminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnapshot = await orderRef.get();

  if (!orderSnapshot.exists) return;
  const order = orderSnapshot.data();

  if (order.fundsCreditedToPending) return; // Prevent double credit

  const workerIds = [
    ...(Array.isArray(order.assignedWorkers) ? order.assignedWorkers : []),
    order.workerAssigned,
    order.assignedTo
  ].filter(Boolean);

  if (workerIds.length === 0) return;

  const totalAmount = Number(order.totalPrice || order.finalPrice || 0);
  const hasReferral = Boolean(order.usedReferralCode || order.referredBy);
  const workerPercent = hasReferral ? WORKER_SHARE_REFERRAL : WORKER_SHARE_NORMAL;
  
  const workerPoolShare = (totalAmount * workerPercent) / 100;
  const sharePerWorker = Math.round(workerPoolShare / workerIds.length);

  // --- 1. POSTGRESQL (CRITICAL FINANCIAL SYSTEM) ---
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      for (const workerId of workerIds) {
        // Update or Create Wallet
        await client.query(`
          INSERT INTO wallets (user_id, pending, total_earned)
          VALUES ($1, $2, $2)
          ON CONFLICT (user_id) DO UPDATE SET
          pending = wallets.pending + $2,
          total_earned = wallets.total_earned + $2,
          updated_at = NOW();
        `, [workerId, sharePerWorker]);

        // Transaction Log
        await client.query(`
          INSERT INTO transactions (user_id, order_id, type, category, amount, status, meta)
          VALUES ($1, $2, 'earning', 'order', $3, 'pending', $4);
        `, [workerId, orderId, sharePerWorker, JSON.stringify({ workerPercent, hasReferral })]);

        // Pending Release
        const availableAt = new Date();
        availableAt.setDate(availableAt.getDate() + RELEASE_COOLDOWN_DAYS);
        
        await client.query(`
          INSERT INTO pending_releases (user_id, order_id, amount, status, available_at)
          VALUES ($1, $2, $3, 'pending', $4);
        `, [workerId, orderId, sharePerWorker, availableAt.toISOString()]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL financial credit failed:', err);
      // Fallback to Firestore only if PG fails and it's allowed
    } finally {
      client.release();
    }
  }

  // --- 2. FIRESTORE (REAL-TIME FALLBACK / SYNC) ---
  const batch = db.batch();
  for (const workerId of workerIds) {
    const walletRef = db.collection('wallets').doc(workerId);
    batch.set(walletRef, {
      pendingAmount: FieldValue.increment(sharePerWorker),
      pending: FieldValue.increment(sharePerWorker),
      totalBalance: FieldValue.increment(sharePerWorker),
      total: FieldValue.increment(sharePerWorker),
      totalEarned: FieldValue.increment(sharePerWorker),
      lastUpdated: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Sync transaction and release to Firestore for frontend compatibility
    const txRef = db.collection('transactions').doc();
    batch.set(txRef, {
      userId: workerId,
      orderId,
      type: 'earning',
      category: 'order',
      amount: sharePerWorker,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      meta: { workerPercent, hasReferral }
    });

    const releaseRecordRef = db.collection('pendingReleases').doc();
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + RELEASE_COOLDOWN_DAYS);

    batch.set(releaseRecordRef, {
      userId: workerId,
      orderId,
      amount: sharePerWorker,
      status: 'pending',
      availableAt: availableAt.toISOString(),
      createdAt: FieldValue.serverTimestamp()
    });
  }

  // Distribution logic
  const companyPercent = hasReferral ? COMPANY_SHARE_REFERRAL : COMPANY_SHARE_NORMAL;
  const companyAmount = totalAmount - workerPoolShare;

  const companyLedgerRef = db.collection('finance').doc('company');
  batch.set(companyLedgerRef, {
    totalRevenue: FieldValue.increment(totalAmount),
    totalCompanyShare: FieldValue.increment(companyAmount),
    totalWorkerShare: FieldValue.increment(workerPoolShare),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  batch.update(orderRef, { 
    fundsCreditedToPending: true,
    revenueDistributed: true,
    distributionSnapshot: {
      totalAmount,
      workerPoolShare,
      companyAmount,
      workerPercent,
      companyPercent,
      hasReferral
    }
  });

  await batch.commit();
};

export const releasePendingFunds = async () => {
  const db = adminDb();
  const now = new Date();

  // --- 1. POSTGRESQL RELEASE ---
  let sqlReleasedCount = 0;
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
        // Update Wallet
        await client.query(`
          UPDATE wallets SET
          pending = pending - $1,
          withdrawable = withdrawable + $1,
          updated_at = NOW()
          WHERE user_id = $2;
        `, [release.amount, release.user_id]);

        // Update Release Status
        await client.query(`
          UPDATE pending_releases SET
          status = 'released',
          released_at = NOW()
          WHERE id = $1;
        `, [release.id]);

        // Update Transaction
        await client.query(`
          UPDATE transactions SET
          status = 'completed'
          WHERE user_id = $1 AND order_id = $2 AND type = 'earning';
        `, [release.user_id, release.order_id]);

        sqlReleasedCount++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('SQL release funds failed:', err);
    } finally {
      client.release();
    }
  }

  // --- 2. FIRESTORE RELEASE (Maintain Sync) ---
  const snapshots = await db.collection('pendingReleases')
    .where('status', '==', 'pending')
    .where('availableAt', '<=', now.toISOString())
    .limit(100)
    .get();

  if (snapshots.empty) return sqlReleasedCount;

  let releasedCount = 0;
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

  return Math.max(releasedCount, sqlReleasedCount);
};

export const processRefund = async (orderId, isPremiumCustomer = false) => {
  const db = adminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  
  if (!orderSnap.exists) throw new Error('Order not found');
  const order = orderSnap.data();
  const totalAmount = Number(order.totalPrice || 0);

  const REFUND_REGULAR = { client: 60, worker: 20, company: 20 };
  const REFUND_PREMIUM = { client: 70, worker: 20, company: 10 };
  const split = isPremiumCustomer ? REFUND_PREMIUM : REFUND_REGULAR;
  
  const clientRefund = Math.round((totalAmount * split.client) / 100);
  const workerDeduction = Math.round((totalAmount * split.worker) / 100);
  const companyPortion = Math.round((totalAmount * split.company) / 100);

  // --- 1. POSTGRESQL REFUND ---
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // Record transaction for client
      await client.query(`
        INSERT INTO transactions (user_id, order_id, type, amount, status)
        VALUES ($1, $2, 'refund', $3, 'completed');
      `, [order.userId, orderId, clientRefund]);

      // Logic for worker deduction could be added here if needed

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('SQL refund failed:', err);
    } finally {
      client.release();
    }
  }

  // --- 2. FIRESTORE REFUND ---
  const batch = db.batch();
  const refundRef = db.collection('refunds').doc();
  batch.set(refundRef, {
    orderId,
    customerId: order.userId,
    totalAmount,
    clientRefund,
    workerDeduction,
    companyPortion,
    isPremiumCustomer,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp()
  });

  batch.update(orderRef, {
    status: 'cancelled',
    paymentStatus: 'refunded',
    refundId: refundRef.id,
    updatedAt: FieldValue.serverTimestamp()
  });

  const txRef = db.collection('transactions').doc();
  batch.set(txRef, {
    userId: order.userId,
    orderId,
    type: 'refund',
    amount: clientRefund,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp()
  });

  await batch.commit();
  return { clientRefund, workerDeduction, companyPortion };
};

export const creditStaffBonuses = async (orderId) => {
  const db = adminDb();
  const orderSnap = await db.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) return;
  const order = orderSnap.data();

  const configSnap = await db.collection('salaryConfig').get();
  const configs = {};
  configSnap.docs.forEach(d => { configs[d.id] = d.data(); });

  const staffIds = [order.assignedBy, order.managedBy].filter(Boolean);
  if (staffIds.length === 0) return;

  const batch = db.batch();
  for (const staffId of staffIds) {
    const staffSnap = await db.collection('users').doc(staffId).get();
    if (!staffSnap.exists) continue;
    const staff = staffSnap.data();
    const roleConfig = configs[staff.role];

    if (roleConfig && roleConfig.bonusPerOrder > 0) {
      const bonus = roleConfig.bonusPerOrder;

      // PG Credit
      if (pgPool) {
        await executeSQL(`
          INSERT INTO wallets (user_id, withdrawable, total_earned)
          VALUES ($1, $2, $2)
          ON CONFLICT (user_id) DO UPDATE SET
          withdrawable = wallets.withdrawable + $2,
          total_earned = wallets.total_earned + $2,
          updated_at = NOW();
        `, [staffId, bonus]);

        await executeSQL(`
          INSERT INTO transactions (user_id, order_id, type, category, amount, status)
          VALUES ($1, $2, 'earning', 'bonus', $3, 'completed');
        `, [staffId, orderId, bonus]);
      }

      // Firestore Credit
      const walletRef = db.collection('wallets').doc(staffId);
      batch.set(walletRef, {
        withdrawableAmount: FieldValue.increment(bonus),
        withdrawable: FieldValue.increment(bonus),
        totalBalance: FieldValue.increment(bonus),
        total: FieldValue.increment(bonus),
        totalEarned: FieldValue.increment(bonus),
        lastUpdated: FieldValue.serverTimestamp()
      }, { merge: true });

      const txRef = db.collection('transactions').doc();
      batch.set(txRef, {
        userId: staffId,
        orderId,
        type: 'earning',
        category: 'bonus',
        amount: bonus,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp()
      });
    }
  }
  await batch.commit();
};

export default {
  creditWorkerForOrder,
  releasePendingFunds,
  processRefund,
  creditStaffBonuses
};
