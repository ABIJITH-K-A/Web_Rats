import { isManagerLikeRole, normalizeValue } from './roles.js';

/**
 * Get assigned worker IDs from an order
 */
export const getAssignedWorkerIds = (order) => {
  if (!order) return [];

  const ids = [];

  if (order.assignedWorkers && Array.isArray(order.assignedWorkers)) {
    ids.push(...order.assignedWorkers);
  }

  if (order.workerAssigned) {
    ids.push(order.workerAssigned);
  }

  if (order.assignedTo) {
    ids.push(order.assignedTo);
  }

  return [...new Set(ids)].filter(Boolean);
};

/**
 * Check if a user can view an order
 */
export const canViewOrder = (currentUser, order) => {
  if (isManagerLikeRole(currentUser.role)) {
    return true;
  }

  if (normalizeValue(currentUser.role) === 'client') {
    return [order.customerId, order.userId].filter(Boolean).includes(currentUser.uid);
  }

  if (normalizeValue(currentUser.role) === 'worker') {
    return getAssignedWorkerIds(order).includes(currentUser.uid);
  }

  return false;
};
