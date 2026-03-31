import { FieldValue } from 'firebase-admin/firestore';
import { normalizeValue } from './roles.js';

export const ORDER_STATUS_ALIASES = {
  new: 'created',
  created: 'created',
  active: 'pending_assignment',
  pending: 'pending_assignment',
  pending_assignment: 'pending_assignment',
  accepted: 'assigned',
  assigned: 'assigned',
  in_progress: 'in_progress',
  progress: 'in_progress',
  working: 'in_progress',
  delivered_preview: 'delivered_preview',
  preview: 'delivered_preview',
  preview_delivered: 'delivered_preview',
  revision_requested: 'revision_requested',
  revision: 'revision_requested',
  awaiting_final_payment: 'awaiting_final_payment',
  awaiting_payment: 'awaiting_final_payment',
  payment_due: 'awaiting_final_payment',
  complete: 'completed',
  completed: 'completed',
  done: 'completed',
  closed: 'closed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
  created: 'Created',
  pending_assignment: 'Pending Assignment',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  delivered_preview: 'Preview Delivered',
  revision_requested: 'Revision Requested',
  awaiting_final_payment: 'Awaiting Final Payment',
  completed: 'Completed',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const normalizeOrderStatus = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return 'pending_assignment';
  return ORDER_STATUS_ALIASES[normalized] || 'pending_assignment';
};

export const getOrderStatusLabel = (value) =>
  ORDER_STATUS_LABELS[normalizeOrderStatus(value)] || ORDER_STATUS_LABELS.pending_assignment;

export const getAllowedStatusUpdates = (role = 'client') => {
  const normalizedRole = normalizeValue(role);

  if (normalizedRole === 'worker') {
    return ['assigned', 'in_progress', 'delivered_preview'];
  }

  if (normalizedRole === 'manager') {
    return [
      'pending_assignment',
      'assigned',
      'in_progress',
      'delivered_preview',
      'revision_requested',
      'awaiting_final_payment',
      'completed',
      'cancelled',
    ];
  }

  return Object.keys(ORDER_STATUS_LABELS);
};

export const buildOrderStatusPatch = (nextStatus) => {
  const normalized = normalizeOrderStatus(nextStatus);

  return {
    status: getOrderStatusLabel(normalized),
    orderStatus: getOrderStatusLabel(normalized),
    statusKey: normalized,
    updatedAt: FieldValue.serverTimestamp(),
    ...(normalized === 'assigned' ? { assignedAt: FieldValue.serverTimestamp() } : {}),
    ...(normalized === 'in_progress'
      ? { inProgressAt: FieldValue.serverTimestamp() }
      : {}),
    ...(normalized === 'delivered_preview'
      ? { previewDeliveredAt: FieldValue.serverTimestamp() }
      : {}),
    ...(normalized === 'revision_requested'
      ? { revisionRequestedAt: FieldValue.serverTimestamp() }
      : {}),
    ...(normalized === 'awaiting_final_payment'
      ? { awaitingFinalPaymentAt: FieldValue.serverTimestamp() }
      : {}),
    ...(normalized === 'completed'
      ? { completedAt: FieldValue.serverTimestamp() }
      : {}),
    ...(normalized === 'closed' ? { closedAt: FieldValue.serverTimestamp() } : {}),
    ...(normalized === 'cancelled'
      ? { cancelledAt: FieldValue.serverTimestamp() }
      : {}),
  };
};

export const getAssignedWorkerIds = (order = {}) =>
  Array.from(
    new Set(
      [
        ...(Array.isArray(order.assignedWorkers) ? order.assignedWorkers : []),
        order.workerAssigned,
        order.assignedTo,
      ].filter(Boolean)
    )
  );

export default {
  normalizeOrderStatus,
  getOrderStatusLabel,
  getAllowedStatusUpdates,
  buildOrderStatusPatch,
  getAssignedWorkerIds,
};
