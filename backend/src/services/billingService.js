import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

export const generateMonthlyBills = async (monthStr) => {
  const db = adminDb();
  const [year, month] = monthStr.split('-').map(Number);
  
  // Get all transactions for the month that are 'earning' type
  // (In a real app, you'd use a Firestore query with where(createdAt >= startOfMonth && createdAt <= endOfMonth))
  
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const txSnap = await db.collection('transactions')
    .where('type', '==', 'earning')
    .where('createdAt', '>=', startOfMonth)
    .where('createdAt', '<=', endOfMonth)
    .get();

  const userEarnings = {};

  txSnap.docs.forEach(doc => {
    const data = doc.data();
    const userId = data.userId;
    const amount = Number(data.amount || 0);
    
    if (!userEarnings[userId]) {
      userEarnings[userId] = 0;
    }
    userEarnings[userId] += amount;
  });

  const batch = db.batch();

  for (const [userId, totalEarned] of Object.entries(userEarnings)) {
    const billRef = db.collection('monthlyEarnings').doc(`${monthStr}_${userId}`);
    batch.set(billRef, {
      userId,
      month: monthStr,
      totalEarned,
      status: 'pending',
      generatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }

  await batch.commit();
  return Object.keys(userEarnings).length;
};

export const payMonthlyBill = async (billId, adminUid) => {
  const db = adminDb();
  const billRef = db.collection('monthlyEarnings').doc(billId);
  
  await db.runTransaction(async (transaction) => {
    const billSnap = await transaction.get(billRef);
    if (!billSnap.exists) throw new Error('Bill not found');
    
    const bill = billSnap.data();
    if (bill.status === 'paid') return;

    transaction.update(billRef, {
      status: 'paid',
      paidAt: FieldValue.serverTimestamp(),
      paidBy: adminUid,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Optionally record a 'payout' transaction
    const txRef = db.collection('transactions').doc();
    transaction.set(txRef, {
      userId: bill.userId,
      type: 'payout',
      amount: -bill.totalEarned,
      status: 'completed',
      month: bill.month,
      createdAt: FieldValue.serverTimestamp()
    });
  });
};

export default {
  generateMonthlyBills,
  payMonthlyBill
};
