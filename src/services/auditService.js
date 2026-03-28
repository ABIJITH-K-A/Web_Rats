import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { normalizeRole } from "../utils/systemRules";

export const logAuditEvent = async ({
  actorId = null,
  actorRole = "system",
  action,
  targetType,
  targetId = null,
  severity = "low",
  metadata = {},
}) => {
  if (!action || !targetType) return null;

  try {
    return await addDoc(collection(db, "auditLogs"), {
      actorId,
      actorRole: normalizeRole(actorRole),
      action,
      targetType,
      targetId,
      severity,
      metadata,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return null;
  }
};

export default {
  logAuditEvent,
};
