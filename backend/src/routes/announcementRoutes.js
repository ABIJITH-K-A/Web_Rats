import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import roleGuard from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

const announcementSchema = z.object({
  title: z.string().trim().min(5).max(120),
  content: z.string().trim().min(10).max(5000),
  target: z.enum(['all', 'workers', 'admins', 'clients']).default('all'),
  priority: z.enum(['normal', 'important', 'critical']).default('normal'),
});

// POST /api/announcements — create announcement
router.post(
  '/',
  authGuard,
  roleGuard(['owner', 'admin']),
  validateBody(announcementSchema),
  asyncHandler(async (req, res) => {
    const { title, content, target, priority } = req.validatedBody;
    const { uid } = req.currentUser;

    const db = adminDb();
    const announcementRef = db.collection('announcements').doc();
    
    await announcementRef.set({
      title,
      content,
      target,
      priority,
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ announcementId: announcementRef.id, success: true });
  })
);

// GET /api/announcements — get announcements for user
router.get(
  '/',
  authGuard,
  asyncHandler(async (req, res) => {
    const { role } = req.currentUser;
    const db = adminDb();
    
    // Simple approach: get 'all' and those matching user role
    const targets = ['all'];
    if (role === 'worker') targets.push('workers');
    if (['admin', 'owner'].includes(role)) targets.push('admins');
    if (role === 'client') targets.push('clients');

    const snap = await db.collection('announcements')
      .where('target', 'in', targets)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const announcements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ announcements });
  })
);

export default router;
