export const ROLES = {
  CLIENT: 'client',
  WORKER: 'worker',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
};

export const ROLE_HIERARCHY = Object.values(ROLES);

export const normalizeValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

export const normalizeRole = (role) => {
  const normalized = normalizeValue(role);
  return ROLE_HIERARCHY.includes(normalized) ? normalized : ROLES.CLIENT;
};

export const hasRoleAccess = (role, allowedRoles = []) =>
  allowedRoles.map(normalizeRole).includes(normalizeRole(role));

export const isAdminLikeRole = (role) =>
  [ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.OWNER].includes(normalizeRole(role));

export const isManagerLikeRole = (role) =>
  [ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.OWNER].includes(normalizeRole(role));

export default {
  ROLES,
  ROLE_HIERARCHY,
  normalizeValue,
  normalizeRole,
  hasRoleAccess,
  isAdminLikeRole,
  isManagerLikeRole,
};
