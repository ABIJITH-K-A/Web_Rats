import { checkAnomaly } from '../services/anomalyService.js';
import { adminDb } from '../config/firebaseAdmin.js';

export const requestLogger = async (req, res, next) => {
  const start = Date.now();
  
  // Clean up user info if available from authGuard
  const userId = req.currentUser?.uid || 'anonymous';
  const role = req.currentUser?.role || 'unknown';
  
  // Let the request process
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const isSuspicious = res.statusCode >= 400 && res.statusCode !== 404;
    
    // Add sampling for successful, fast requests to save DB operations
    // Log ALL suspicious requests, but only 10% of normal ones
    const shouldLog = isSuspicious || duration > 2000 || Math.random() < 0.1;

    if (shouldLog) {
      try {
        const db = adminDb();
        const auditData = {
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: duration,
          ip: req.ip,
          userId,
          role,
          userAgent: req.get('user-agent') || 'unknown',
          suspicious: isSuspicious,
          errorMessage: res.locals?.errorMessage || null
        };

        await db.collection('auditLogs').add(auditData);

        // Process anomaly detection (Alerts)
        if (isSuspicious) {
          await checkAnomaly(auditData);
        }
      } catch (err) {
        console.error('Failed to write audit log:', err);
      }
    }
  });

  next();
};
