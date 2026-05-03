export const ROLE_HIERARCHY = [
  "client",
  "worker",
  "admin",
];

export const STAFF_ROLES = ROLE_HIERARCHY.filter((role) => role !== "client");

export const ROLE_PERMISSIONS = {
  client: ["create_order", "request_revision", "pay"],
  worker: ["accept_work", "receive_revision"],
  admin: [
    "view_all_orders",
    "assign_work",
    "manage_users",
    "view_full_system_analytics",
  ],
};

export const DASHBOARD_VIEW_RULES = {
  overview: STAFF_ROLES,
  analytics: ["admin"],
  orders: ["admin"],
  orderpool: ["worker"],
  users: ["admin"],
  referrals: ["admin"],
  reviews: STAFF_ROLES,
  samples: STAFF_ROLES,
  myorders: ["worker"],
};

export const ORDER_STATUS_META = {
  new: {
    label: "New",
    progress: 0,
    badgeClass: "border-white/15 bg-white/5 text-white/60",
  },
  in_progress: {
    label: "In Progress",
    progress: 50,
    badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  review: {
    label: "Review",
    progress: 75,
    badgeClass: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  },
  complete: {
    label: "Complete",
    progress: 100,
    badgeClass: "border-cyan-primary/20 bg-cyan-primary/10 text-cyan-primary",
  },
  cancelled: {
    label: "Cancelled",
    progress: 0,
    badgeClass: "border-red-500/20 bg-red-500/10 text-red-400",
  },
};

export const ORDER_STATUS_FLOW = ["new", "in_progress", "review", "complete"];

export const ORDER_STATUS_ALIASES = {
  new: "new",
  created: "new",
  pending: "new",
  assigned: "in_progress",
  in_progress: "in_progress",
  working: "in_progress",
  progress: "in_progress",
  delivered: "review",
  review: "review",
  preview: "review",
  complete: "complete",
  completed: "complete",
  done: "complete",
  closed: "complete",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export const PAYMENT_STATUS_META = {
  pending: {
    label: "Pending",
    badgeClass: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  },
  paid: {
    label: "Paid",
    badgeClass: "border-green-500/20 bg-green-500/10 text-green-400",
  },
};

export const PAYMENT_STATUS_ALIASES = {
  pending: "pending",
  unpaid: "pending",
  due: "pending",
  partial: "pending",
  paid: "paid",
  completed: "paid",
};

export const FINANCIAL_RULES = {
  workerPercent: 90,
  companyPercent: 10,
};

const randomSegment = () =>
  Math.random().toString(36).toUpperCase().slice(2, 6).padEnd(4, "X");

export const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export const normalizeRole = (role) => {
  const normalized = normalizeValue(role);
  return ROLE_HIERARCHY.includes(normalized) ? normalized : "client";
};

export const getRoleRank = (role) =>
  ROLE_HIERARCHY.indexOf(normalizeRole(role));

export const hasRoleAccess = (role, allowedRoles = []) =>
  allowedRoles.map(normalizeRole).includes(normalizeRole(role));

export const canManageRole = (actorRole, targetRole) =>
  getRoleRank(actorRole) > getRoleRank(targetRole);

export const canGenerateInviteForRole = (actorRole, targetRole) => {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);

  if (target === "client") return false;
  if (actor === "admin") {
    return ["admin", "worker"].includes(target);
  }

  return false;
};

export const getAllowedDashboardViews = (role) =>
  Object.entries(DASHBOARD_VIEW_RULES)
    .filter(([, allowedRoles]) => hasRoleAccess(role, allowedRoles))
    .map(([viewId]) => viewId);

export const canAccessDashboardView = (role, viewId) =>
  hasRoleAccess(role, DASHBOARD_VIEW_RULES[viewId] || []);

export const makeReferralCode = () => {
  return `TNWR-${randomSegment()}`;
};
