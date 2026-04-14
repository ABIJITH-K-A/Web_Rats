import { processOrderCompletion } from '../services/earningsService.js';

export const onOrderCompleted = async (orderId) =>
  processOrderCompletion({ id: orderId });

export const onOrderCancelled = async () => ({
  success: false,
  message: 'Automatic refund distribution is not part of the simplified finance flow.',
});

export const scheduledReleasePendingFunds = async () => ({
  releasedCount: 0,
  retired: true,
});

export const handleOrderChange = async (change, context) => {
  const after = change.after?.data?.();
  const before = change.before?.data?.();
  const orderId = context?.params?.orderId;

  if (!after || !orderId) {
    return null;
  }

  const isNowCompleted = String(after.statusKey || after.status || '').toLowerCase() === 'completed';
  const wasCompleted = String(before?.statusKey || before?.status || '').toLowerCase() === 'completed';

  if (isNowCompleted && !wasCompleted) {
    return onOrderCompleted(orderId);
  }

  return null;
};

export const manualProcessOrder = async (req, res) => {
  const { orderId } = req.body || {};

  if (!orderId) {
    res.status(400).json({ error: 'orderId is required.' });
    return;
  }

  const result = await onOrderCompleted(orderId);
  res.json({ success: true, result });
};

export const initializeWalletTriggers = () => {
  console.log('[Order Triggers] Initialized with simplified ledger flow');
};

export default {
  onOrderCompleted,
  onOrderCancelled,
  scheduledReleasePendingFunds,
  handleOrderChange,
  manualProcessOrder,
  initializeWalletTriggers,
};
