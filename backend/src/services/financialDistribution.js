// Replace/extend existing financialService.js logic
import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

export const distributeOrderRevenue = async (orderId) => {
  const db = adminDb();

  // Get order
  const orderSnap = await db.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) return;
  const order = orderSnap.data();

  // Prevent double distribution
  if (order.revenueDistributed) return;

  const revenue = Number(order.totalPrice || order.finalPrice || 0);
  if (revenue <= 0) return;

  // Get finance settings
  const settingsSnap = await db.collection('financeSettings').doc('global').get();
  const settings = settingsSnap.data() || {
    workerPayoutPercentage: 70,
    reinvestmentPercentage: 15,
    reservePercentage: 5,
    owner1Share: 50,
    owner2Share: 50,
  };

  // Calculate splits
  const workerAmount = (revenue * settings.workerPayoutPercentage) / 100;
  const reinvestment = (revenue * settings.reinvestmentPercentage) / 100;
  const reserve = (revenue * settings.reservePercentage) / 100;
  const remaining = revenue - workerAmount - reinvestment - reserve;
  const totalOwnerShares = settings.owner1Share + settings.owner2Share;
  const owner1Amount = (remaining * settings.owner1Share) / totalOwnerShares;
  const owner2Amount = (remaining * settings.owner2Share) / totalOwnerShares;

  const batch = db.batch();
  const txRef = () => db.collection('transactions').doc();

  // 1. Worker transaction (handled by creditWorkerForOrder separately)
  batch.set(txRef(), {
    type: 'expense',
    category: 'worker_payment',
    amount: workerAmount,
    referenceId: orderId,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp(),
  });

  // 2. Reinvestment fund
  batch.update(db.collection('funds').doc('reinvestment'), {
    totalAmount: FieldValue.increment(reinvestment),
    availableAmount: FieldValue.increment(reinvestment),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(txRef(), {
    type: 'split',
    category: 'reinvestment',
    amount: reinvestment,
    referenceId: orderId,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp(),
  });

  // 3. Reserve fund
  batch.update(db.collection('funds').doc('reserve'), {
    totalAmount: FieldValue.increment(reserve),
    availableAmount: FieldValue.increment(reserve),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(txRef(), {
    type: 'split',
    category: 'reserve',
    amount: reserve,
    referenceId: orderId,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp(),
  });

  // 4. Owner 1 profit
  batch.set(db.collection('ownerEarnings').doc(settings.owner1Uid), {
    totalEarnings: FieldValue.increment(owner1Amount),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  batch.set(txRef(), {
    type: 'income',
    category: 'owner_profit',
    amount: owner1Amount,
    receivedBy: settings.owner1Uid,
    referenceId: orderId,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp(),
  });

  // 5. Owner 2 profit
  batch.set(db.collection('ownerEarnings').doc(settings.owner2Uid), {
    totalEarnings: FieldValue.increment(owner2Amount),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  batch.set(txRef(), {
    type: 'income',
    category: 'owner_profit',
    amount: owner2Amount,
    receivedBy: settings.owner2Uid,
    referenceId: orderId,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp(),
  });

  // 6. Mark order as distributed
  batch.update(db.collection('orders').doc(orderId), {
    revenueDistributed: true,
    distributionSnapshot: {
      revenue, workerAmount, reinvestment,
      reserve, owner1Amount, owner2Amount,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
};
