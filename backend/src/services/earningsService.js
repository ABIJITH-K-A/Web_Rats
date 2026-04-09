import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../config/firebaseAdmin.js';

const WORKER_SHARE_PERCENT = 0.9;
const COMPANY_USER_ID = 'company';

const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const getAssignedWorkerIds = (order = {}) =>
  Array.from(
    new Set(
      [
        ...(Array.isArray(order.assignedWorkers) ? order.assignedWorkers : []),
        order.workerAssigned,
        order.assignedTo,
      ].filter(Boolean)
    )
  );

const splitWorkerPool = (totalAmount, workerCount) => {
  if (workerCount <= 0) {
    return [];
  }

  const safeTotal = roundCurrency(totalAmount);
  const baseShare = roundCurrency(safeTotal / workerCount);

  return Array.from({ length: workerCount }, (_, index) => {
    if (index === workerCount - 1) {
      const distributedSoFar = roundCurrency(baseShare * (workerCount - 1));
      return roundCurrency(safeTotal - distributedSoFar);
    }

    return baseShare;
  });
};

const isCompletedOrder = (order = {}) =>
  normalizeStatus(order.statusKey || order.status || order.orderStatus) === 'completed';

export const processOrderCompletion = async (orderInput) => {
  const orderId = orderInput?.id || orderInput?.orderId;

  if (!orderId) {
    throw new Error('Order id is required to process earnings.');
  }

  const db = adminDb();
  const orderRef = db.collection('orders').doc(orderId);

  return db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists) {
      throw new Error('Order not found.');
    }

    const order = {
      id: orderSnapshot.id,
      ...orderSnapshot.data(),
    };

    if (!isCompletedOrder(order)) {
      return {
        processed: false,
        reason: 'order_not_completed',
      };
    }

    if (order.earningsProcessed === true) {
      return {
        processed: false,
        reason: 'already_processed',
      };
    }

    const workerIds = getAssignedWorkerIds(order);
    if (workerIds.length === 0) {
      throw new Error('Completed order has no assigned worker.');
    }

    const totalAmount = roundCurrency(order.totalPrice || order.finalPrice || order.price || 0);
    if (totalAmount <= 0) {
      throw new Error('Completed order has no payable amount.');
    }

    const workerPool = roundCurrency(totalAmount * WORKER_SHARE_PERCENT);
    const workerShares = splitWorkerPool(workerPool, workerIds.length);
    const workerShareTotal = roundCurrency(
      workerShares.reduce((sum, amount) => sum + amount, 0)
    );
    const companyShare = roundCurrency(totalAmount - workerShareTotal);

    const workerEntryIds = workerIds.map(() => db.collection('ledgerEntries').doc().id);
    const companyEntryId = db.collection('ledgerEntries').doc().id;

    workerIds.forEach((workerId, index) => {
      transaction.set(db.collection('ledgerEntries').doc(workerEntryIds[index]), {
        userId: workerId,
        type: 'earning',
        amount: workerShares[index],
        referenceId: orderId,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    transaction.set(db.collection('ledgerEntries').doc(companyEntryId), {
      userId: COMPANY_USER_ID,
      type: 'earning',
      amount: companyShare,
      referenceId: orderId,
      createdAt: FieldValue.serverTimestamp(),
    });

    transaction.update(orderRef, {
      earningsProcessed: true,
      earningsProcessedAt: FieldValue.serverTimestamp(),
      earningsSummary: {
        totalAmount,
        workerShareTotal,
        companyShare,
        workerIds,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      processed: true,
      orderId,
      totalAmount,
      workerIds,
      workerShares,
      companyShare,
      workerEntryIds,
      companyEntryId,
    };
  });
};

export default {
  processOrderCompletion,
};
