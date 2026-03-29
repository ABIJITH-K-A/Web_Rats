import { adminDb } from '../config/firebaseAdmin.js';
import { dispatchNotification } from './notificationDispatcher.js';

const ANOMALY_THRESHOLD = 5; // failures in 5 minutes
const ALERT_WINDOW_MS = 5 * 60 * 1000;

export const checkAnomaly = async (auditData) => {
  const { userId, ip, statusCode, path } = auditData;

  // Only check if it's a security-related failure
  if (statusCode === 401 || statusCode === 403) {
    try {
      const db = adminDb();
      const now = new Date();
      const windowStart = new Date(now.getTime() - ALERT_WINDOW_MS).toISOString();

      // Check recent failures for this IP/User
      const recentFailures = await db.collection('auditLogs')
        .where('ip', '==', ip)
        .where('statusCode', 'in', [401, 403])
        .where('timestamp', '>=', windowStart)
        .limit(ANOMALY_THRESHOLD + 1)
        .get();

      if (recentFailures.size >= ANOMALY_THRESHOLD) {
        // Trigger Critical Alert
        await dispatchNotification({
          userId: 'system-admin', // Logic in dispatcher handles admin broadcast
          title: '🚨 SECURITY ANOMALY DETECTED',
          message: `Multiple access failures (${recentFailures.size}) detected from IP ${ip}. Target path: ${path}. Possible brute force or unauthorized probe.`,
          category: 'security',
          metadata: {
            ip,
            userId,
            failures: recentFailures.size,
            severity: 'critical'
          }
        });
        
        console.warn(`[ANOMALY] Alert dispatched for IP ${ip}`);
      }
    } catch (err) {
      console.error('Failed to process anomaly check:', err);
    }
  }
};
