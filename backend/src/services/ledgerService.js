import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../config/firebaseAdmin.js';

const LEDGER_COLLECTION = 'ledgerEntries';
const LEDGER_TYPES = new Set(['earning', 'withdrawal']);

const parseAmount = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount === 0) {
    throw new Error('Ledger amount must be a non-zero number.');
  }

  return Number(numericAmount.toFixed(2));
};

export const createLedgerEntry = async ({ userId, type, amount, referenceId = null }) => {
  if (!userId) {
    throw new Error('userId is required to create a ledger entry.');
  }

  if (!LEDGER_TYPES.has(type)) {
    throw new Error('Ledger type must be either "earning" or "withdrawal".');
  }

  const entryRef = adminDb().collection(LEDGER_COLLECTION).doc();
  const entry = {
    userId,
    type,
    amount: parseAmount(amount),
    referenceId: referenceId || null,
    createdAt: FieldValue.serverTimestamp(),
  };

  await entryRef.set(entry);

  return {
    id: entryRef.id,
    ...entry,
  };
};

export const getUserLedger = async (userId) => {
  if (!userId) {
    throw new Error('userId is required to fetch ledger entries.');
  }

  const snapshot = await adminDb()
    .collection(LEDGER_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export default {
  createLedgerEntry,
  getUserLedger,
};
