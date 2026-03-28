import { HttpError } from '../lib/httpError.js';
import { hasRoleAccess } from '../lib/roles.js';

export const roleGuard = (allowedRoles = []) => (req, res, next) => {
  if (!req.currentUser) {
    next(new HttpError(401, 'Authentication required.'));
    return;
  }

  if (!hasRoleAccess(req.currentUser.role, allowedRoles)) {
    next(new HttpError(403, 'You do not have access to this route.'));
    return;
  }

  next();
};

export default roleGuard;
