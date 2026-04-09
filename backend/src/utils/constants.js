// Financial and Wallet Constants
// ================================

// Worker Earning Percentages
export const WORKER_SHARE_NORMAL = 80;
export const WORKER_SHARE_REFERRAL = 82;
export const COMPANY_SHARE_NORMAL = 20;
export const COMPANY_SHARE_REFERRAL = 18;

// Withdrawal Rules
export const MIN_WITHDRAWAL = 100;
export const MAX_WITHDRAWALS_PER_WEEK = 4;

// Fund Release Cooldown (days)
export const RELEASE_COOLDOWN_DAYS = 3;

// Refund Splits (percentage)
export const REFUND_REGULAR = {
  client: 60,
  worker: 20,
  company: 20,
};

export const REFUND_PREMIUM = {
  client: 70,
  worker: 20,
  company: 10,
};

// Wallet Status Values
export const WALLET_STATUS = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  SUSPENDED: 'suspended',
};

// Transaction Status Values
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Transaction Types
export const TRANSACTION_TYPE = {
  EARNING: 'earning',
  EXPENSE: 'expense',
  REFUND: 'refund',
  BONUS: 'bonus',
};

// Transaction Categories
export const TRANSACTION_CATEGORY = {
  ORDER: 'order',
  WITHDRAWAL: 'withdrawal',
  BONUS: 'bonus',
  ADJUSTMENT: 'adjustment',
};

// Payout/Withdrawal Status
export const PAYOUT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  PAID: 'paid',
  REJECTED: 'rejected',
};

// Payment Methods
export const PAYMENT_METHOD = {
  UPI: 'upi',
  BANK: 'bank',
  CASH: 'cash',
};

// Default Wallet Structure
export const DEFAULT_WALLET = {
  totalBalance: 0,
  pendingAmount: 0,
  withdrawableAmount: 0,
  onHoldAmount: 0,
  totalEarnings: 0,
  lifetimeEarnings: 0,
  lifetimeWithdrawn: 0,
  status: WALLET_STATUS.ACTIVE,
  lastPayDate: null,
  nextPayDate: null,
  // Legacy field aliases for compatibility
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
