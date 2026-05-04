import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import {
  buildOrderStatusPatch,
  getAllowedStatusUpdates,
  getAssignedWorkerIds,
} from '../lib/orderStatus.js';
import { isAdminLikeRole, normalizeValue } from '../lib/roles.js';
import { serializeDocument } from '../lib/serialize.js';
import { authGuard, optionalAuthGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';
import { processOrderCompletion } from '../services/earningsService.js';

const router = Router();

const numberField = z.preprocess((value) => Number(value), z.number().finite().nonnegative());

const requirementSchema = z.object({
  projectDescription: z.string().trim().min(10).max(5000),
  features: z.string().trim().min(5).max(3000),
  references: z.string().trim().max(3000).optional().default(''),
  referenceFiles: z
    .array(
      z.object({
        name: z.string().trim().max(240),
        url: z.string().trim().max(1000),
        path: z.string().trim().max(500).optional().default(''),
        size: z.preprocess((value) => Number(value || 0), z.number().nonnegative()).optional().default(0),
        type: z.string().trim().max(120).optional().default(''),
      })
    )
    .max(12)
    .optional()
    .default([]),
  deadline: z.string().trim().min(2).max(120),
});

const createOrderSchema = z.object({
  userId: z.string().trim().max(128).optional().default('guest'),
  customerId: z.string().trim().max(128).nullable().optional().default(null),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(5).max(32),
  category: z.string().trim().min(2).max(120),
  categoryId: z.string().trim().min(2).max(120),
  service: z.string().trim().min(2).max(160),
  serviceId: z.string().trim().min(2).max(160),
  plan: z.string().trim().min(2).max(120),
  planId: z.string().trim().min(2).max(120),
  package: z.string().trim().max(120).optional().default(''),
  price: numberField,
  basePrice: numberField,
  priorityFee: numberField.optional().default(0),
  subtotalPrice: numberField.optional().default(0),
  totalPrice: numberField,
  discountPercent: numberField.optional().default(0),
  discountAmount: numberField.optional().default(0),
  referralDiscountPercent: numberField.optional().default(0),
  referralDiscountAmount: numberField.optional().default(0),
  studentStartupDiscountPercent: numberField.optional().default(0),
  studentStartupDiscountAmount: numberField.optional().default(0),
  usedReferralCode: z.string().trim().max(120).nullable().optional().default(null),
  referredBy: z.string().trim().max(128).nullable().optional().default(null),
  advancePayment: numberField,
  advancePaid: numberField.optional().default(0),
  remainingPayment: numberField,
  remainingAmount: numberField,
  totalPaid: numberField.optional().default(0),
  advanceRate: numberField.optional().default(70),
  customerType: z.enum(['new', 'returning']).default('new'),
  isPriority: z.boolean().optional().default(false),
  priorityLabel: z.string().trim().max(40).optional().default('Normal'),
  isReorder: z.boolean().optional().default(false),
  parentOrderId: z.string().trim().max(120).nullable().optional().default(null),
  projectDescription: z.string().trim().min(10).max(5000),
  features: z.string().trim().min(5).max(3000),
  references: z.string().trim().max(3000).optional().default(''),
  referenceFiles: requirementSchema.shape.referenceFiles,
  referenceFileCount: z.preprocess((value) => Number(value || 0), z.number().int().nonnegative()).optional().default(0),
  deadline: z.string().trim().min(2).max(120),
  requirements: requirementSchema,
  paymentStatus: z.string().trim().max(40).optional().default('Pending'),
  paymentMethod: z.enum(['cashfree', 'qpay']).optional().default('cashfree'),
  paymentProvider: z.string().trim().max(40).optional().default('cashfree'),
  utrNumber: z.string().trim().max(80).optional().default(''),
  demoRequested: z.boolean().optional().default(false),
  isTestOrder: z.boolean().optional().default(false),
  status: z.string().trim().max(80).optional().default('Pending Assignment'),
  orderStatus: z.string().trim().max(80).optional().default('Pending Assignment'),
  statusKey: z.string().trim().max(80).optional().default('pending_assignment'),
  assignmentStatus: z.string().trim().max(80).optional().default('unassigned'),
  revisionLimit: z.preprocess((value) => Number(value ?? 1), z.number().int().min(0)).optional().default(1),
  revisionsUsed: z.preprocess((value) => Number(value ?? 0), z.number().int().min(0)).optional().default(0),
  paidRevisionCredits: z.preprocess((value) => Number(value ?? 0), z.number().int().min(0)).optional().default(0),
});

const updateStatusSchema = z.object({
  orderId: z.string().trim().min(4).max(128),
  status: z.string().trim().min(2).max(80),
});

const assignWorkerSchema = z.object({
  orderId: z.string().trim().min(4).max(128),
  workerId: z.string().trim().min(4).max(128),
  workerName: z.string().trim().min(2).max(120).optional(),
});

const sortByCreatedAtDesc = (records = []) =>
  [...records].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime() || 0;
    const rightTime = new Date(right.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  });

const canViewOrder = (currentUser, order) => {
  if (isAdminLikeRole(currentUser.role)) {
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

router.post(
  '/create',
  optionalAuthGuard,
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const payload = req.validatedBody;
    const currentUser = req.currentUser;

    const orderData = {
      ...payload,
      userId: currentUser?.uid || payload.userId || 'guest',
      customerId: currentUser?.uid || payload.customerId || null,
      email: currentUser?.email || payload.email,
      paymentStatus: payload.paymentStatus || 'Pending',
      status: payload.status || 'Pending Assignment',
      orderStatus: payload.orderStatus || 'Pending Assignment',
      statusKey: payload.statusKey || 'pending_assignment',
      assignmentStatus: payload.assignmentStatus || 'unassigned',
      revisionLimit: payload.revisionLimit ?? 1,
      revisionsUsed: payload.revisionsUsed ?? 0,
      paidRevisionCredits: payload.paidRevisionCredits ?? 0,
      earningsProcessed: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const orderRef = await adminDb().collection('orders').add(orderData);
    const createdSnapshot = await orderRef.get();

    res.status(201).json({
      order: serializeDocument(createdSnapshot),
    });
  })
);

router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req, res) => {
    const orderSnapshot = await adminDb().collection('orders').doc(req.params.id).get();

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnapshot.id, ...orderSnapshot.data() };

    if (!canViewOrder(req.currentUser, order)) {
      throw new HttpError(403, 'You do not have access to this order.');
    }

    res.json({
      order: serializeDocument(orderSnapshot),
    });
  })
);

router.get(
  '/user/:uid',
  authGuard,
  asyncHandler(async (req, res) => {
    const targetUid = req.params.uid;
    const currentUser = req.currentUser;

    if (currentUser.uid !== targetUid && !isAdminLikeRole(currentUser.role)) {
      throw new HttpError(403, 'You do not have access to this order list.');
    }

    const [userOrdersSnapshot, customerOrdersSnapshot] = await Promise.all([
      adminDb().collection('orders').where('userId', '==', targetUid).orderBy('createdAt', 'desc').limit(50).get(),
      adminDb().collection('orders').where('customerId', '==', targetUid).orderBy('createdAt', 'desc').limit(50).get(),
    ]);

    const merged = new Map();

    [userOrdersSnapshot, customerOrdersSnapshot].forEach((snapshot) => {
      snapshot.docs.forEach((docSnapshot) => {
        merged.set(docSnapshot.id, serializeDocument(docSnapshot));
      });
    });

    res.json({
      orders: sortByCreatedAtDesc(Array.from(merged.values())),
    });
  })
);

router.patch(
  '/update-status',
  authGuard,
  validateBody(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const { orderId, status } = req.validatedBody;
    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = orderSnapshot.data();
    const currentUser = req.currentUser;
    const nextStatus = normalizeValue(status);
    const allowedStatuses = getAllowedStatusUpdates(currentUser.role);

    if (!allowedStatuses.includes(nextStatus)) {
      throw new HttpError(403, 'You cannot move the order to that status.');
    }

    if (!canViewOrder(currentUser, { id: orderSnapshot.id, ...order })) {
      throw new HttpError(403, 'You do not have access to update this order.');
    }

    const patch = buildOrderStatusPatch(nextStatus);
    await orderRef.update(patch);

    const updatedSnapshot = await orderRef.get();

    if (nextStatus === 'completed') {
      try {
        await processOrderCompletion({ id: orderId });
      } catch (err) {
        console.error('Failed to write ledger entries for order completion:', err);
      }
    }

    res.json({
      order: serializeDocument(updatedSnapshot),
    });
  })
);

router.post(
  '/assign-worker',
  authGuard,
  validateBody(assignWorkerSchema),
  asyncHandler(async (req, res) => {
    const currentUser = req.currentUser;

    if (!isAdminLikeRole(currentUser.role)) {
      throw new HttpError(403, 'Only admin and owner users can assign workers.');
    }

    const { orderId, workerId, workerName } = req.validatedBody;
    const orderRef = adminDb().collection('orders').doc(orderId);
    const userRef = adminDb().collection('users').doc(workerId);

    const [orderSnapshot, workerSnapshot] = await Promise.all([orderRef.get(), userRef.get()]);

    if (!orderSnapshot.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    if (!workerSnapshot.exists) {
      throw new HttpError(404, 'Worker not found.');
    }

    const workerProfile = workerSnapshot.data();
    if (normalizeValue(workerProfile.role) !== 'worker') {
      throw new HttpError(400, 'Selected user is not a worker.');
    }

    const resolvedWorkerName = workerName || workerProfile.name || workerProfile.email || 'Worker';

    await orderRef.update({
      ...buildOrderStatusPatch('assigned'),
      assignedWorkers: [workerId],
      workerAssigned: workerId,
      workerAssignedName: resolvedWorkerName,
      assignedTo: workerId,
      assignedToName: resolvedWorkerName,
      assignmentStatus: 'approved',
      assignedAt: FieldValue.serverTimestamp(),
    });

    const updatedSnapshot = await orderRef.get();
    res.json({
      order: serializeDocument(updatedSnapshot),
      worker: {
        id: workerSnapshot.id,
        name: resolvedWorkerName,
      },
    });
  })
);

export default router;
