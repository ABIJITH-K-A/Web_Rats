import { Router } from 'express';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard } from '../middleware/authGuard.js';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { isAdminLikeRole } from '../lib/roles.js';
import { getAuth } from 'firebase-admin/auth';

const router = Router();

// Checks if user can access this chat
const canAccessChat = (order, uid, role, escalated) => {
  const isClient = order.userId === uid;
  const isWorker = [
    order.assignedTo,
    order.workerAssigned,
    ...(order.assignedWorkers || [])
  ].includes(uid);
  const isHigherRole = isAdminLikeRole(role);

  if (isClient || isWorker) return true;
  if (isHigherRole && escalated) return true;
  return false;
};

// Legacy middleware for backward compatibility
const legacyRequireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized. Missing token." });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth error in chat:", error);
    return res.status(401).json({ message: "Unauthorized. Invalid token." });
  }
};

// GET /api/chat/:orderId — get chat metadata + recent messages
router.get(
  '/:orderId',
  authGuard,
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { uid, role } = req.currentUser;

    const orderSnap = await adminDb().collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');

    const order = orderSnap.data();
    const chatRef = adminDb().collection('chats').doc(orderId);
    const chatSnap = await chatRef.get();

    if (!canAccessChat(order, uid, role, chatSnap.data()?.escalated)) {
      throw new HttpError(403, 'You do not have access to this chat.');
    }

    res.json({
      chat: chatSnap.exists ? chatSnap.data() : null,
      orderId,
    });
  })
);

// POST /api/chat/:orderId/init — initialize chat when order is assigned
router.post(
  '/:orderId/init',
  authGuard,
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const orderSnap = await adminDb().collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');

    const order = orderSnap.data();
    const chatRef = adminDb().collection('chats').doc(orderId);
    const chatSnap = await chatRef.get();

    if (chatSnap.exists) return res.json({ exists: true });

    await chatRef.set({
      orderId,
      clientId: order.userId,
      workerId: order.assignedTo || order.workerAssigned || null,
      escalated: false,
      escalationReason: null,
      escalatedAt: null,
      resolvedAt: null,
      messageCount: 0,
      lastMessageAt: FieldValue.serverTimestamp(),
      deletionScheduledAt: null,
      deletedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ created: true });
  })
);

/**
 * POST /api/chat/send
 * Validates and writes chat messages to Firestore, updating thread metadata.
 */
router.post("/send", legacyRequireAuth, async (req, res) => {
  try {
    const { orderId, text, userName, userRole } = req.body;
    
    if (!orderId || !text) {
      return res.status(400).json({ message: "orderId and text are required" });
    }

    const db = getFirestore();

    // 1. Verify access
    const orderDoc = await db.collection("orders").doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderDoc.data();
    const isOwner = order.userId === req.user.uid;
    const isStaff = ["admin", "manager", "worker", "owner", "superadmin"].includes(userRole);
    
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: "Forbidden to chat in this order" });
    }

    // 2. Write message to Firestore 
    const newMsg = {
      orderId,
      text, // Sanitization should be applied globally/middleware
      userId: req.user.uid,
      userName,
      userRole,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("chatMessages").add(newMsg);

    // 3. Update thread metadata
    const threadRef = db.collection("chatThreads").doc(orderId);
    
    const updateData = {
      orderId,
      lastMessage: {
        text,
        userId: req.user.uid,
        createdAt: FieldValue.serverTimestamp()
      },
      updatedAt: FieldValue.serverTimestamp()
    };

    await threadRef.set(updateData, { merge: true });

    res.status(201).json({ message: "Sent", id: docRef.id });
  } catch (error) {
    console.error("Error sending chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
