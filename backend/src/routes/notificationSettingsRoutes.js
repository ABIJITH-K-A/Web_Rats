import { Router } from "express";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../config/firebaseAdmin.js";
import { authGuard } from "../middleware/authGuard.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();
const getDb = () => adminDb();

const updateSettingsSchema = z.object({
  email: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  inApp: z.boolean().optional(),
});

// GET /api/notification-settings
router.get("/", authGuard, asyncHandler(async (req, res) => {
  const userSnap = await getDb().collection("users").doc(req.currentUser.uid).get();
  const data = userSnap.exists ? userSnap.data() : {};

  const prefs = data.notificationPreferences || {
    email: true,
    whatsapp: true,
    inApp: true,
  };

  res.json({ preferences: prefs });
}));

// PATCH /api/notification-settings
router.patch("/", authGuard, validateBody(updateSettingsSchema), asyncHandler(async (req, res) => {
  const { email, whatsapp, inApp } = req.validatedBody;

  const update = {};
  if (typeof email === "boolean") update["notificationPreferences.email"] = email;
  if (typeof whatsapp === "boolean") update["notificationPreferences.whatsapp"] = whatsapp;
  if (typeof inApp === "boolean") update["notificationPreferences.inApp"] = inApp;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No valid preferences provided." });
  }

  update["updatedAt"] = FieldValue.serverTimestamp();

  await getDb().collection("users").doc(req.currentUser.uid).update(update);

  res.json({ message: "Notification preferences updated." });
}));

export default router;
