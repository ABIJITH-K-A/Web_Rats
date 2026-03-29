import { Router } from "express";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { authGuard } from "../middleware/authGuard.js";

const router = Router();
const db = getFirestore();

// GET /api/notification-settings
router.get("/", authGuard, async (req, res) => {
  try {
    const userSnap = await db.collection("users").doc(req.uid).get();
    const data = userSnap.exists ? userSnap.data() : {};

    const prefs = data.notificationPreferences || {
      email: true,
      whatsapp: true,
      inApp: true,
    };

    res.json({ preferences: prefs });
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.status(500).json({ message: "Could not fetch notification settings." });
  }
});

// PATCH /api/notification-settings
router.patch("/", authGuard, async (req, res) => {
  try {
    const { email, whatsapp, inApp } = req.body;

    const update = {};
    if (typeof email === "boolean") update["notificationPreferences.email"] = email;
    if (typeof whatsapp === "boolean") update["notificationPreferences.whatsapp"] = whatsapp;
    if (typeof inApp === "boolean") update["notificationPreferences.inApp"] = inApp;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid preferences provided." });
    }

    update["updatedAt"] = FieldValue.serverTimestamp();

    await db.collection("users").doc(req.uid).update(update);

    res.json({ message: "Notification preferences updated." });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ message: "Could not update notification settings." });
  }
});

export default router;
