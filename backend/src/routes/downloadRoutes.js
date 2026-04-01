import { Router } from 'express';
import { z } from 'zod';
import { adminStorage, adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import { canViewOrder } from '../lib/orderHelpers.js';

const router = Router();

const downloadRequestSchema = z.object({
  orderId: z.string().trim().min(4).max(128),
  filePath: z.string().trim().min(1).max(512),
});

/**
 * GET /api/download/signed-url
 * Generate a signed URL for downloading a file (expires in 5 minutes)
 * Only allows download if:
 * 1. User is authorized to view the order
 * 2. Order is paid (isPaid === true) OR user is staff
 */
router.get(
  '/signed-url',
  authGuard,
  asyncHandler(async (req, res) => {
    const { orderId, filePath } = req.query;

    if (!orderId || !filePath) {
      throw new HttpError(400, 'Order ID and file path are required.');
    }

    const currentUser = req.currentUser;

    // 1. Verify order exists and user has access
    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnap.id, ...orderSnap.data() };

    if (!canViewOrder(currentUser, order)) {
      throw new HttpError(403, 'You do not have access to this order.');
    }

    // 2. Check if payment is complete (or user is staff)
    const isStaff = ['owner', 'superadmin', 'admin', 'manager', 'worker'].includes(
      currentUser.role
    );
    const isPaid = order.isPaid === true || order.paymentStatus === 'completed' || order.status === 'completed';

    if (!isStaff && !isPaid) {
      throw new HttpError(403, 'Payment required to download files. Please complete payment first.');
    }

    // 3. Verify file path belongs to this order (security check)
    const allowedPrefixes = [
      `orders/${orderId}/final/`,
      `orders/${orderId}/preview/`,
      `orders/${orderId}/deliverable/`,
    ];

    const isValidPath = allowedPrefixes.some((prefix) => filePath.startsWith(prefix));
    if (!isValidPath) {
      throw new HttpError(403, 'Invalid file path.');
    }

    // 4. Generate signed URL (expires in 5 minutes)
    const bucket = adminStorage().bucket();
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new HttpError(404, 'File not found.');
    }

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // 5. Log access for audit
    await adminDb().collection('auditLogs').add({
      actorId: currentUser.uid,
      actorRole: currentUser.role,
      action: 'file_download_requested',
      targetType: 'file',
      targetId: filePath,
      orderId: orderId,
      severity: 'low',
      metadata: {
        fileName: filePath.split('/').pop(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
      createdAt: new Date(),
    });

    res.json({
      signedUrl,
      expiresIn: 300, // 5 minutes in seconds
      fileName: filePath.split('/').pop(),
    });
  })
);

/**
 * POST /api/download/bulk
 * Generate signed URLs for all final files in an order
 */
router.post(
  '/bulk',
  authGuard,
  asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
      throw new HttpError(400, 'Order ID is required.');
    }

    const currentUser = req.currentUser;

    // Verify order access
    const orderRef = adminDb().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new HttpError(404, 'Order not found.');
    }

    const order = { id: orderSnap.id, ...orderSnap.data() };

    if (!canViewOrder(currentUser, order)) {
      throw new HttpError(403, 'You do not have access to this order.');
    }

    // Check payment status
    const isStaff = ['owner', 'superadmin', 'admin', 'manager', 'worker'].includes(
      currentUser.role
    );
    const isPaid = order.isPaid === true || order.paymentStatus === 'completed' || order.status === 'completed';

    if (!isStaff && !isPaid) {
      throw new HttpError(403, 'Payment required to download files.');
    }

    // Get all files in the final directory
    const bucket = adminStorage().bucket();
    const prefix = `orders/${orderId}/final/`;
    const [files] = await bucket.getFiles({ prefix });

    // Generate signed URLs for all files
    const signedUrls = await Promise.all(
      files.map(async (file) => {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 5 * 60 * 1000,
        });
        return {
          fileName: file.name.split('/').pop(),
          filePath: file.name,
          signedUrl: url,
        };
      })
    );

    res.json({
      orderId,
      files: signedUrls,
      expiresIn: 300,
    });
  })
);

export default router;
