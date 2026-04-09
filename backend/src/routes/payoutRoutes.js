import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';
import {
  requestWithdrawal,
  approveWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  getPendingWithdrawals,
} from '../controllers/payoutController.js';

const router = Router();

// Validation schemas
const withdrawSchema = z.object({
  amount: z.preprocess((value) => Number(value), z.number().finite().positive()),
  method: z.string().trim().min(2).max(40),
  details: z.record(z.any()).optional().default({}),
});

const rejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

const completeSchema = z.object({
  notes: z.string().max(500).optional(),
});

// User Routes

/**
 * POST /payout/withdraw
 * Request a withdrawal/payout
 */
router.post(
  '/withdraw',
  authGuard,
  validateBody(withdrawSchema),
  asyncHandler(requestWithdrawal)
);

// Admin Routes

/**
 * GET /payout/pending
 * Get all pending withdrawals (admin/owner only)
 */
router.get(
  '/pending',
  authGuard,
  roleGuard(['admin', 'owner']),
  asyncHandler(getPendingWithdrawals)
);

/**
 * POST /payout/:withdrawalId/approve
 * Approve a withdrawal request
 */
router.post(
  '/:withdrawalId/approve',
  authGuard,
  roleGuard(['admin', 'owner']),
  asyncHandler(approveWithdrawal)
);

/**
 * POST /payout/:withdrawalId/complete
 * Complete/process a withdrawal payout
 */
router.post(
  '/:withdrawalId/complete',
  authGuard,
  roleGuard(['admin', 'owner']),
  validateBody(completeSchema),
  asyncHandler(completeWithdrawal)
);

/**
 * POST /payout/:withdrawalId/reject
 * Reject a withdrawal request
 */
router.post(
  '/:withdrawalId/reject',
  authGuard,
  roleGuard(['admin', 'owner']),
  validateBody(rejectSchema),
  asyncHandler(rejectWithdrawal)
);

export default router;
