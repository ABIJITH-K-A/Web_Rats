import { checkAnomaly } from '../services/anomalyService.js';
import { adminDb } from '../config/firebaseAdmin.js';

export const requestLogger = async (req, res, next) => {
  const start = Date.now();
  
  // Clean up user info if available from authGuard
  const userId = req.user?.uid || 'anonymous';
  const role = req.user?.role || 'unknown';
  
  // Let the request process
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const isSuspicious = res.statusCode >= 400 && res.statusCode !== 404;
    
    // Only log suspicious/failed requests or slow requests to save DB operations
    if (isSuspicious || duration > 2000) {
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
