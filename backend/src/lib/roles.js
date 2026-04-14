export const ROLE_HIERARCHY = [
  'client',
  'worker',
  'admin',
  'owner',
];

export const normalizeValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

export const normalizeRole = (role) => {
  const normalized = normalizeValue(role);
  return ROLE_HIERARCHY.includes(normalized) ? normalized : 'client';
};

export const hasRoleAccess = (role, allowedRoles = []) =>
  allowedRoles.map(normalizeRole).includes(normalizeRole(role));

export const isAdminLikeRole = (role) =>
  ['admin', 'owner'].includes(normalizeRole(role));

export const isAdminOrOwner = (role) =>
  ['admin', 'owner'].includes(normalizeRole(role));

export default {
  ROLE_HIERARCHY,
  normalizeValue,
  normalizeRole,
  hasRoleAccess,
  isAdminLikeRole,
  isAdminOrOwner,
};
