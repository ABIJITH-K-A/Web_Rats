import { Router } from 'express';
import { getWorkerFinance } from '../controllers/financeController.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authGuard } from '../middleware/authGuard.js';

const router = Router();

router.get('/worker', authGuard, asyncHandler(getWorkerFinance));

export default router;
