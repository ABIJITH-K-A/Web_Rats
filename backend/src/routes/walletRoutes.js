import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';
import {
  getWalletOverview,
  getTransactions,
  getWalletAdmin,
  listWallets,
  getWalletStats,
} from '../controllers/walletController.js';

const router = Router();

// Validation schemas
const transactionQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.preprocess((val) => Number(val), z.number().min(1).max(100).optional()),
});

// User Routes

/**
 * GET /wallet/:uid
 * Get wallet overview with withdrawal history
 */
router.get(
  '/:uid',
  authGuard,
  asyncHandler(getWalletOverview)
);

/**
 * GET /wallet/:uid/transactions
 * Get transaction history for a wallet
 */
router.get(
  '/:uid/transactions',
  authGuard,
  validateBody(transactionQuerySchema),
  asyncHandler(getTransactions)
);

// Admin Routes

/**
 * GET /wallet/admin/stats
 * Get wallet system statistics
 */
router.get(
  '/admin/stats',
  authGuard,
  roleGuard(['admin', 'owner']),
  asyncHandler(getWalletStats)
);

/**
 * GET /wallet/admin/list
 * List all wallets with pagination
 */
router.get(
  '/admin/list',
  authGuard,
  roleGuard(['admin', 'owner']),
  asyncHandler(listWallets)
);

/**
 * GET /wallet/admin/:uid
 * Get any wallet by user ID (admin override)
 */
router.get(
  '/admin/:uid',
  authGuard,
  roleGuard(['admin', 'owner']),
  asyncHandler(getWalletAdmin)
);

export default router;

