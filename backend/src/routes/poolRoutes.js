import { Router } from 'express';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authGuard } from '../middleware/authGuard.js';
import { isWorker } from '../lib/roles.js';

const router = Router();

/**
 * GET /pool/available
 * Get all unassigned orders available for workers to claim
 * Uses Firestore query with filters for performance
 */
router.get(
  '/available',
  authGuard,
  asyncHandler(async (req, res) => {
    const currentUser = req.currentUser;

    // Only workers and managers can view the order pool
    if (!isWorker(currentUser.role) && currentUser.role !== 'manager') {
      return res.status(403).json({
        error: 'Only workers can access the order pool',
      });
    }

    try {
      // Query for unassigned orders with claimable status
      const poolQuery = await adminDb()
        .collection('orders')
        .where('assignmentStatus', '==', 'unassigned')
        .where('statusKey', 'in', ['created', 'pending_assignment'])
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const orders = poolQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter out any orders that have assigned workers (double-check)
      const availableOrders = orders.filter((order) => {
        const hasNoWorkers =
          !order.assignedWorkers?.length &&
          !order.workerAssigned &&
          !order.assignedTo;
        return hasNoWorkers;
      });

      res.json({
        orders: availableOrders,
        count: availableOrders.length,
      });
    } catch (error) {
      console.error('Order pool query error:', error);
      res.status(500).json({
        error: 'Failed to fetch order pool',
        message: error.message,
      });
    }
  })
);

/**
 * POST /pool/claim/:orderId
 * Claim an order from the pool
 */
router.post(
  '/claim/:orderId',
  authGuard,
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const currentUser = req.currentUser;

    if (!isWorker(currentUser.role) && currentUser.role !== 'manager') {
      return res.status(403).json({
        error: 'Only workers can claim orders',
      });
    }

    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderSnap.data();

    // Verify order is still claimable
    if (
      orderData.assignmentStatus !== 'unassigned' ||
      orderData.assignedWorkers?.length > 0 ||
      orderData.workerAssigned
    ) {
      return res.status(409).json({
        error: 'Order has already been claimed',
      });
    }

    const workerName = currentUser.name || currentUser.email || 'Worker';
    const timestamp = new Date().toISOString();

    // Update order with worker assignment
    await orderRef.update({
      status: 'Assigned',
      statusKey: 'assigned',
      orderStatus: 'Assigned',
      assignmentStatus: 'approved',
      assignedWorkers: [currentUser.uid],
      workerAssigned: currentUser.uid,
      workerAssignedName: workerName,
      assignedTo: currentUser.uid,
      assignedToName: workerName,
      assignedAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Order claimed successfully',
      orderId,
    });
  })
);

export default router;
