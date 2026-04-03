import { db } from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { logAuditEvent } from "./auditService";
import { createNotification } from "./notificationService";
import { FINANCIAL_RULES, getNextMonthlyPayoutDate } from "../utils/systemRules";

export const FINANCIAL_CONSTANTS = {
  BASE_WORKER_PERCENT: FINANCIAL_RULES.workerPercent,
  BASE_COMPANY_PERCENT: FINANCIAL_RULES.companyPercent,
  REFERRAL_WORKER_PERCENT: FINANCIAL_RULES.referralWorkerPercent,
  REFERRAL_COMPANY_PERCENT: FINANCIAL_RULES.referralCompanyPercent,
  MIN_WITHDRAWAL: FINANCIAL_RULES.minimumWithdrawal,
  MAX_WITHDRAWAL_DAYS_PER_WEEK: FINANCIAL_RULES.maxWithdrawalsPerWeek,
  PRIORITY_FEE_PERCENT: FINANCIAL_RULES.priorityPercent,
  PRIORITY_FEE_MIN: FINANCIAL_RULES.priorityMinimum,
};

export const buildWalletDocument = (userId) => {
  const nextPayDate = getNextMonthlyPayoutDate();

  return {
    userId,
    totalBalance: 0,
    pendingAmount: 0,
    withdrawableAmount: 0,
    onHoldAmount: 0,
    totalEarnings: 0,
    lifetimeEarnings: 0,
    lifetimeWithdrawn: 0,
    status: "active",
    nextPayDate,
    lastPayDate: null,
    lastUpdated: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // Compatibility fields used by current dashboard screens.
    total: 0,
    pending: 0,
    withdrawable: 0,
    onHold: 0,
    withdrawn: 0,
    available: 0,
    pendingApproval: 0,
    pendingPayout: 0,
    lifetimePaid: 0,
  };
};

export const normalizeWalletData = (wallet = {}, userId = null) => {
  const pendingAmount = Number(
    wallet.pendingAmount ?? wallet.pending ?? wallet.pendingApproval ?? 0
  );
  const withdrawableAmount = Number(
    wallet.withdrawableAmount ?? wallet.withdrawable ?? wallet.available ?? 0
  );
  const onHoldAmount = Number(wallet.onHoldAmount ?? wallet.onHold ?? 0);
  const totalEarnings = Number(
    wallet.totalEarnings ??
      wallet.totalBalance ??
      wallet.total ??
      pendingAmount + withdrawableAmount + onHoldAmount
  );
  const lifetimeEarnings = Number(
    wallet.lifetimeEarnings ?? wallet.lifetimePaid ?? totalEarnings
  );
  const lifetimeWithdrawn = Number(
    wallet.lifetimeWithdrawn ?? wallet.withdrawn ?? 0
  );

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

export const calculateRevenueSplit = (orderTotal, hasReferral = false) => {
  const workerPercent = hasReferral
    ? FINANCIAL_CONSTANTS.REFERRAL_WORKER_PERCENT
    : FINANCIAL_CONSTANTS.BASE_WORKER_PERCENT;
  const companyPercent = hasReferral
    ? FINANCIAL_CONSTANTS.REFERRAL_COMPANY_PERCENT
    : FINANCIAL_CONSTANTS.BASE_COMPANY_PERCENT;

  const workerEarnings = Math.round((orderTotal * workerPercent) / 100);
  const companyEarnings = orderTotal - workerEarnings;

  return {
    workerPercent,
    companyPercent,
    workerEarnings,
    companyEarnings,
    orderTotal,
    hasReferral,
  };
};

export const calculatePriorityFee = (basePrice) => {
  const fee = Math.round(
    (basePrice * FINANCIAL_CONSTANTS.PRIORITY_FEE_PERCENT) / 100
  );
  return Math.max(fee, FINANCIAL_CONSTANTS.PRIORITY_FEE_MIN);
};

export const getWallet = async (userId) => {
  const walletRef = doc(db, "wallets", userId);
  const walletSnap = await getDoc(walletRef);

  if (walletSnap.exists()) {
    const normalized = normalizeWalletData(walletSnap.data(), userId);
    await setDoc(walletRef, normalized, { merge: true });
    return normalized;
  }

  const walletData = buildWalletDocument(userId);
  await setDoc(walletRef, walletData);
  return normalizeWalletData(walletData, userId);
};

export const creditWallet = async (userId, amount, orderId) => {
  const walletRef = doc(db, "wallets", userId);
  await setDoc(walletRef, buildWalletDocument(userId), { merge: true });

  await updateDoc(walletRef, {
    totalBalance: increment(amount),
    pendingAmount: increment(amount),
    totalEarnings: increment(amount),
    lifetimeEarnings: increment(amount),
    total: increment(amount),
    pending: increment(amount),
    updatedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });

  await addDoc(collection(db, "transactions"), {
    userId,
    type: "income",
    category: "order",
    amount,
    referenceId: orderId,
    status: "pending",
    createdAt: serverTimestamp(),
  });
};

export const releaseToWithdrawable = async (userId, amount) => {
  const walletRef = doc(db, "wallets", userId);

  await updateDoc(walletRef, {
    pendingAmount: increment(-amount),
    withdrawableAmount: increment(amount),
    pending: increment(-amount),
    withdrawable: increment(amount),
    updatedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });

  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    where("amount", "==", amount),
    where("status", "==", "pending"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(doc(db, "transactions", snap.docs[0].id), {
      status: "available",
      releasedAt: serverTimestamp(),
    });
  }
};

const getRecentWithdrawals = async (userId, days) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const q = query(
    collection(db, "withdrawals"),
    where("userId", "==", userId),
    where("requestedAt", ">=", since),
    orderBy("requestedAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};

export const requestWithdrawal = async (
  userId,
  amount,
  method,
  details = {}
) => {
  const wallet = await getWallet(userId);

  if (amount < FINANCIAL_CONSTANTS.MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is ₹${FINANCIAL_CONSTANTS.MIN_WITHDRAWAL}`);
  }

  if (amount > wallet.withdrawableAmount) {
    throw new Error("Insufficient withdrawable balance");
  }

  const recentWithdrawals = await getRecentWithdrawals(userId, 7);
  if (
    recentWithdrawals.length >= FINANCIAL_CONSTANTS.MAX_WITHDRAWAL_DAYS_PER_WEEK
  ) {
    throw new Error(
      `Maximum ${FINANCIAL_CONSTANTS.MAX_WITHDRAWAL_DAYS_PER_WEEK} withdrawals per week allowed`
    );
  }

  const existingPending = recentWithdrawals.find((item) =>
    ["pending", "approved"].includes(String(item.status || "").toLowerCase())
  );
  if (existingPending) {
    throw new Error("You already have a withdrawal being processed.");
  }

  const withdrawalRef = await addDoc(collection(db, "withdrawals"), {
    userId,
    amount,
    method,
    details,
    status: "pending",
    requestedAt: serverTimestamp(),
  });

  const walletRef = doc(db, "wallets", userId);
  await updateDoc(walletRef, {
    withdrawableAmount: increment(-amount),
    onHoldAmount: increment(amount),
    withdrawable: increment(-amount),
    onHold: increment(amount),
    updatedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });

  await addDoc(collection(db, "transactions"), {
    userId,
    type: "expense",
    category: "withdrawal",
    amount: -amount,
    referenceId: withdrawalRef.id,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await createNotification({
    recipientId: "admin",
    recipientRole: "admin",
    title: "Withdrawal Request Submitted",
    message: `${details.userName || "A staff member"} requested ₹${amount.toLocaleString(
      "en-IN"
    )} by ${method}.`,
    category: "finance",
  });

  await logAuditEvent({
    actorId: userId,
    actorRole: details.role || "worker",
    action: "withdrawal_requested",
    targetType: "withdrawal",
    targetId: withdrawalRef.id,
    severity: "medium",
    metadata: { amount, method },
  });

  return withdrawalRef.id;
};

export const processRefund = async (
  orderId,
  amount,
  isReturningCustomer = false
) => {
  const orderSnap = await getDoc(doc(db, "orders", orderId));
  if (!orderSnap.exists()) throw new Error("Order not found");

  const order = orderSnap.data();
  const customerId = order.customerId || order.userId;

  if (!customerId || customerId === "guest") {
    throw new Error("Cannot refund guest orders");
  }

  const split = isReturningCustomer
    ? FINANCIAL_RULES.returningRefund
    : FINANCIAL_RULES.regularRefund;
  const customerRefund = Math.round((amount * split.client) / 100);
  const workerPortion = Math.round((amount * split.worker) / 100);
  const companyPortion = Math.round((amount * split.company) / 100);

  await addDoc(collection(db, "refunds"), {
    orderId,
    customerId,
    totalAmount: amount,
    customerRefund,
    workerPortion,
    companyPortion,
    split,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  const walletRef = doc(db, "wallets", customerId);
  await setDoc(walletRef, buildWalletDocument(customerId), { merge: true });
  await updateDoc(walletRef, {
    withdrawableAmount: increment(customerRefund),
    totalBalance: increment(customerRefund),
    totalEarnings: increment(customerRefund),
    withdrawable: increment(customerRefund),
    total: increment(customerRefund),
    updatedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });

  await addDoc(collection(db, "transactions"), {
    userId: customerId,
    type: "income",
    category: "refund",
    amount: customerRefund,
    referenceId: orderId,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return { customerRefund, workerPortion, companyPortion };
};

export const getTransactionHistory = async (userId, limitCount = 50) => {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};

export const applyPenaltyWithBatch = async (userId, amount, reason) => {
  const batch = writeBatch(db);
  const walletRef = doc(db, "wallets", userId);
  const penaltyRef = doc(collection(db, "penalties"));
  const transRef = doc(collection(db, "transactions"));

  batch.update(walletRef, {
    withdrawableAmount: increment(-amount),
    onHoldAmount: increment(amount),
    withdrawable: increment(-amount),
    onHold: increment(amount),
    updatedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });

  batch.set(penaltyRef, {
    userId,
    amount,
    reason,
    status: "applied",
    createdAt: serverTimestamp(),
  });

  batch.set(transRef, {
    userId,
    type: "expense",
    category: "salary",
    amount: -amount,
    reason,
    status: "applied",
    createdAt: serverTimestamp(),
  });

  await batch.commit(); // Atomic: all succeed or all fail
  return { penaltyId: penaltyRef.id, transactionId: transRef.id };
};

export const applyBonus = async (userId, amount, reason) => {
  const walletRef = doc(db, "wallets", userId);

  await updateDoc(walletRef, {
    withdrawableAmount: increment(amount),
    totalBalance: increment(amount),
    totalEarnings: increment(amount),
    lifetimeEarnings: increment(amount),
    withdrawable: increment(amount),
    total: increment(amount),
    updatedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });

  await addDoc(collection(db, "transactions"), {
    userId,
    type: "income",
    category: "salary",
    amount,
    reason,
    status: "credited",
    createdAt: serverTimestamp(),
  });
};

export default {
  FINANCIAL_CONSTANTS,
  buildWalletDocument,
  normalizeWalletData,
  calculateRevenueSplit,
  calculatePriorityFee,
  getWallet,
  creditWallet,
  releaseToWithdrawable,
  requestWithdrawal,
  processRefund,
  getTransactionHistory,
  applyPenalty: applyPenaltyWithBatch,
  applyBonus,
};
