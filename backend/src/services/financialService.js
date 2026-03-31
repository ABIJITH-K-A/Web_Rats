import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

// Core Business Rules (Ultra 20x)
const WORKER_SHARE_NORMAL = 80;
const WORKER_SHARE_REFERRAL = 82;
const COMPANY_SHARE_NORMAL = 20;
const COMPANY_SHARE_REFERRAL = 18;

// Refund Rules
const REFUND_REGULAR = { client: 60, worker: 20, company: 20 };
const REFUND_PREMIUM = { client: 70, worker: 20, company: 10 };

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

  const batch = db.batch();

  for (const workerId of workerIds) {
    const walletRef = db.collection('wallets').doc(workerId);
    batch.set(walletRef, {
      pendingAmount: FieldValue.increment(sharePerWorker),
      pending: FieldValue.increment(sharePerWorker),
      totalBalance: FieldValue.increment(sharePerWorker),
      total: FieldValue.increment(sharePerWorker),
      totalEarned: FieldValue.increment(sharePerWorker), // Track total earned
      lastUpdated: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Transaction Log
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

    // Pending Release Record
    const releaseRecordRef = db.collection('pendingReleases').doc();
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 3); // 3 day cooldown

    batch.set(releaseRecordRef, {
      userId: workerId,
      orderId,
      amount: sharePerWorker,
      status: 'pending',
      availableAt: availableAt.toISOString(),
      createdAt: FieldValue.serverTimestamp()
    });
  }

  // Also distribute Company Share logic (consolidated from financialDistribution.js)
  const companyPercent = hasReferral ? COMPANY_SHARE_REFERRAL : COMPANY_SHARE_NORMAL;
  const companyAmount = totalAmount - workerPoolShare;

  // Track in company wallet/ledger
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

export const creditStaffBonuses = async (orderId) => {
  const db = adminDb();
  const orderSnap = await db.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) return;
  const order = orderSnap.data();

  // Get salary config
  const configSnap = await db.collection('salaryConfig').get();
  const configs = {};
  configSnap.docs.forEach(d => { configs[d.id] = d.data(); });

  // Find involved staff (e.g., the one who assigned the worker, or managers in general)
  // For now, let's say we credit the person who moved it to 'assigned' or 'completed'
  // Or simply any manager/admin linked to the order.

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

export const releasePendingFunds = async () => {
  const db = adminDb();
  const now = new Date().toISOString();

  const snapshots = await db.collection('pendingReleases')
    .where('status', '==', 'pending')
    .where('availableAt', '<=', now)
    .limit(100)
    .get();

  if (snapshots.empty) return 0;

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

      // Update transaction status
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

  return releasedCount;
};

export const processRefund = async (orderId, isPremiumCustomer = false) => {
  const db = adminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  
  if (!orderSnap.exists) throw new Error('Order not found');
  const order = orderSnap.data();
  const totalAmount = Number(order.totalPrice || 0);

  const split = isPremiumCustomer ? REFUND_PREMIUM : REFUND_REGULAR;
  
  const clientRefund = Math.round((totalAmount * split.client) / 100);
  const workerDeduction = Math.round((totalAmount * split.worker) / 100);
  const companyPortion = Math.round((totalAmount * split.company) / 100);

  const batch = db.batch();

  // 1. Record refund
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

  // 2. Update order
  batch.update(orderRef, {
    status: 'cancelled',
    paymentStatus: 'refunded',
    refundId: refundRef.id,
    updatedAt: FieldValue.serverTimestamp()
  });

  // 3. Transaction for client
  const txRef = db.collection('transactions').doc();
  batch.set(txRef, {
    userId: order.userId,
    orderId,
    type: 'refund',
    amount: clientRefund,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp()
  });

  // Note: Usually we don't automatically deduct from worker wallet unless it was already released.
  // If it was pending, we should probably cancel the pending release.

  await batch.commit();
  return { clientRefund, workerDeduction, companyPortion };
};

export default {
  creditWorkerForOrder,
  releasePendingFunds,
  processRefund
};
