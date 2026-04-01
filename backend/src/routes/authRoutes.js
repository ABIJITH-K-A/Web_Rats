import { Router } from 'express';
import { serializeValue } from '../lib/serialize.js';
import { authGuard } from '../middleware/authGuard.js';
import { adminAuth, adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.get('/me', authGuard, (req, res) => {
  res.json({
    user: {
      uid: req.currentUser.uid,
      email: req.currentUser.email,
      role: req.currentUser.role,
      profile: serializeValue(req.currentUser.profile || {}),
    },
  });
});

router.post(
  '/sync-claims',
  authGuard,
  asyncHandler(async (req, res) => {
    const { uid } = req.currentUser;
    const userSnap = await adminDb().collection('users').doc(uid).get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { role } = userSnap.data();
    await adminAuth().setCustomUserClaims(uid, { role: role || 'client' });

    res.json({ success: true, role: role || 'client' });
  })
);

router.post('/logout', authGuard, (req, res) => {
  res.status(204).end();
});

export default router;
