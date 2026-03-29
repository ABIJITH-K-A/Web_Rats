import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const WORKER_SHARE_PERCENT = 70; // 70% to worker, 30% to platform/manager

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

  const totalAmount = Number(order.totalPrice || 0);
  const workerPoolShare = (totalAmount * WORKER_SHARE_PERCENT) / 100;
  const sharePerWorker = workerPoolShare / workerIds.length;

  const batch = db.batch();

  for (const workerId of workerIds) {
    const walletRef = db.collection('wallets').doc(workerId);
    batch.set(walletRef, {
      pendingAmount: FieldValue.increment(sharePerWorker),
      pending: FieldValue.increment(sharePerWorker),
      totalBalance: FieldValue.increment(sharePerWorker),
      total: FieldValue.increment(sharePerWorker),
      lastUpdated: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Create a record for the release worker to pick up
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

  batch.update(orderRef, { fundsCreditedToPending: true });
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
    const { userId, amount } = data;

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
    });

    releasedCount++;
  }

  return releasedCount;
};
