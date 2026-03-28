import { Router } from 'express';
import { serializeValue } from '../lib/serialize.js';
import { authGuard } from '../middleware/authGuard.js';

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

router.post('/logout', authGuard, (req, res) => {
  res.status(204).end();
});

export default router;
