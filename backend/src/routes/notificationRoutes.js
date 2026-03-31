import { FieldValue } from 'firebase-admin/firestore';
import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { isAdminLikeRole, normalizeRole } from '../lib/roles.js';
import { serializeDocument } from '../lib/serialize.js';
import { authGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const markReadSchema = z.object({
  notificationId: z.string().trim().min(4).max(128),
  read: z.boolean().optional().default(true),
});

const buildRecipientIds = (uid, role) => {
  const recipientIds = [uid, 'all'];
  const normalizedRole = normalizeRole(role);

  if (normalizedRole) {
    recipientIds.push(normalizedRole);
  }

  if (normalizedRole !== 'client') {
    recipientIds.push('staff');
  }

  return Array.from(new Set(recipientIds));
};

const sortByCreatedAtDesc = (records = []) =>
  [...records].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime() || 0;
    const rightTime = new Date(right.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  });

router.get(
  '/:uid',
  authGuard,
  asyncHandler(async (req, res) => {
    const targetUid = req.params.uid;
    const currentUser = req.currentUser;

    if (currentUser.uid !== targetUid && !isAdminLikeRole(currentUser.role)) {
      throw new HttpError(403, 'You do not have access to these notifications.');
    }

    const targetProfileSnapshot =
      currentUser.uid === targetUid
        ? null
        : await adminDb().collection('users').doc(targetUid).get();

    const targetRole =
      currentUser.uid === targetUid
        ? currentUser.role
        : normalizeRole(targetProfileSnapshot?.data()?.role);

    if (currentUser.uid !== targetUid && !targetProfileSnapshot?.exists) {
      throw new HttpError(404, 'Target user not found.');
    }

    const recipientIds = buildRecipientIds(targetUid, targetRole);
    const snapshots = await Promise.all(
      recipientIds.map((recipientId) =>
        adminDb().collection('notifications').where('recipientId', '==', recipientId).limit(40).get()
      )
    );

    const merged = new Map();
    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((docSnapshot) => {
        merged.set(docSnapshot.id, serializeDocument(docSnapshot));
      });
    });

    res.json({
      notifications: sortByCreatedAtDesc(Array.from(merged.values())).slice(0, 50),
    });
  })
);

router.patch(
  '/read',
  authGuard,
  validateBody(markReadSchema),
  asyncHandler(async (req, res) => {
    const { notificationId, read } = req.validatedBody;
    const notificationRef = adminDb().collection('notifications').doc(notificationId);
    const notificationSnapshot = await notificationRef.get();

    if (!notificationSnapshot.exists) {
      throw new HttpError(404, 'Notification not found.');
    }

    const notification = notificationSnapshot.data();
    const visibleRecipients = buildRecipientIds(req.currentUser.uid, req.currentUser.role);

    if (
      !isAdminLikeRole(req.currentUser.role) &&
      !visibleRecipients.includes(notification.recipientId)
    ) {
      throw new HttpError(403, 'You do not have access to this notification.');
    }

    await notificationRef.update({
      read,
      readAt: read ? FieldValue.serverTimestamp() : null,
    });

    const updatedSnapshot = await notificationRef.get();
    res.json({
      notification: serializeDocument(updatedSnapshot),
    });
  })
);

export default router;
