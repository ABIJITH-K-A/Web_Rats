import express from "express";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const router = express.Router();

// A simple middleware to ensure the user is authenticated 
const requireAuth = async (req, res, next) => {
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

/**
 * POST /api/chat/send
 * Validates and writes chat messages to Firestore, updating thread metadata.
 */
router.post("/send", requireAuth, async (req, res) => {
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
