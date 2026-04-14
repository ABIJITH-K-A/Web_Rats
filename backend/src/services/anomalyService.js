import { adminDb } from '../config/firebaseAdmin.js';
import { dispatchNotification } from './notificationDispatcher.js';

const ANOMALY_THRESHOLD = 5; // failures in 5 minutes
const ALERT_WINDOW_MS = 5 * 60 * 1000;
const SECURITY_FAILURE_CODES = new Set([401, 403]);
const ANOMALY_SCAN_LIMIT = 250;

// Skip localhost IPs during development
const isLocalhost = (ip) =>
  !ip || ip === '::1' || ip === '127.0.0.1' || ip?.startsWith('192.168.') || ip?.startsWith('10.');

export const checkAnomaly = async (auditData) => {
  const { userId, ip, statusCode, path } = auditData;

  // Skip localhost in development to prevent spam
  if (isLocalhost(ip)) return;

  // Only check if it's a security-related failure
  if (SECURITY_FAILURE_CODES.has(statusCode)) {
    try {
      const db = adminDb();
      const now = new Date();
      const windowStart = new Date(now.getTime() - ALERT_WINDOW_MS).toISOString();

      // Query only on timestamp so anomaly detection keeps working
      // even when the composite auditLogs index has not been deployed yet.
      const recentAuditWindow = await db
        .collection('auditLogs')
        .where('timestamp', '>=', windowStart)
        .orderBy('timestamp', 'desc')
        .limit(ANOMALY_SCAN_LIMIT)
        .get();

      const recentFailures = recentAuditWindow.docs.filter((doc) => {
        const data = doc.data();
        return data?.ip === ip && SECURITY_FAILURE_CODES.has(data?.statusCode);
      });

      if (recentFailures.length >= ANOMALY_THRESHOLD) {
        // Trigger Critical Alert - use correct function signature (userId, eventType, data)
        await dispatchNotification(
          'system-admin', // userId
          'securityAnomaly', // eventType
          {
            title: '🚨 SECURITY ANOMALY DETECTED',
            message: `Multiple access failures (${recentFailures.length}) detected from IP ${ip}. Target path: ${path}. Possible brute force or unauthorized probe.`,
            category: 'security',
            metadata: {
              ip,
              userId,
              failures: recentFailures.length,
              severity: 'critical'
            }
          }
        );

        console.warn(`[ANOMALY] Alert dispatched for IP ${ip}`);
      }
    } catch (err) {
      console.error('Failed to process anomaly check:', err);
    }
  }
};
