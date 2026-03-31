export const ROLE_HIERARCHY = [
  "client",
  "worker",
  "manager",
  "admin",
  "superadmin",
  "owner",
];

export const STAFF_ROLES = ROLE_HIERARCHY.filter((role) => role !== "client");

export const ROLE_REFERRAL_CONFIG = {
  client: { code: "CLI", pct: 0 },
  worker: { code: "WRK", pct: 5 },
  manager: { code: "MGR", pct: 10 },
  admin: { code: "ADM", pct: 15 },
  superadmin: { code: "SA", pct: 20 },
  owner: { code: "OWR", pct: 25 },
};

export const ROLE_PERMISSIONS = {
  owner: ["full_access"],
  superadmin: ["all_except_owner_controls"],
  admin: ["manage_orders", "assign_workers", "approve_withdrawals"],
  manager: ["assign_tasks", "monitor_workers"],
  worker: ["accept_orders", "update_status", "view_wallet"],
  client: ["create_order", "pay", "request_revision"],
};

export const DASHBOARD_VIEW_RULES = {
  overview: STAFF_ROLES,
  analytics: ["owner", "superadmin", "admin"],
  orders: ["owner", "superadmin", "admin", "manager"],
  orderpool: ["worker", "manager"],
  users: ["owner", "superadmin", "admin"],
  referrals: ["owner", "superadmin", "admin"],
  reviews: STAFF_ROLES,
  wallet: STAFF_ROLES,
  reports: STAFF_ROLES,
  samples: STAFF_ROLES,
  demodata: ["owner", "superadmin", "admin"],
  payroll: ["owner", "superadmin", "admin"],
  teampay: ["manager"],
  approvals: ["owner", "superadmin", "admin"],
  myorders: ["worker", "manager"],
  invitekeys: ["owner", "superadmin", "admin", "manager"],
  earnings: ["worker", "manager"],
  disputes: STAFF_ROLES,
};

export const ORDER_STATUS_META = {
  created: {
    label: "Created",
    progress: 6,
    badgeClass: "border-white/15 bg-white/5 text-white/60",
  },
  pending_assignment: {
    label: "Pending Assignment",
    progress: 14,
    badgeClass: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
  assigned: {
    label: "Assigned",
    progress: 28,
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },
  in_progress: {
    label: "In Progress",
    progress: 48,
    badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  delivered_preview: {
    label: "Preview Delivered",
    progress: 68,
    badgeClass: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  },
  revision_requested: {
    label: "Revision Requested",
    progress: 62,
    badgeClass: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  },
  awaiting_final_payment: {
    label: "Awaiting Final Payment",
    progress: 82,
    badgeClass: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300",
  },
  completed: {
    label: "Completed",
    progress: 100,
    badgeClass: "border-cyan-primary/20 bg-cyan-primary/10 text-cyan-primary",
  },
  closed: {
    label: "Closed",
    progress: 100,
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  cancelled: {
    label: "Cancelled",
    progress: 0,
    badgeClass: "border-red-500/20 bg-red-500/10 text-red-400",
  },
};

export const ORDER_STATUS_FLOW = Object.keys(ORDER_STATUS_META);

export const ORDER_STATUS_ALIASES = {
  new: "created",
  created: "created",
  active: "pending_assignment",
  pending: "pending_assignment",
  pending_assignment: "pending_assignment",
  accepted: "assigned",
  assigned: "assigned",
  in_progress: "in_progress",
  progress: "in_progress",
  working: "in_progress",
  delivered_preview: "delivered_preview",
  preview: "delivered_preview",
  preview_delivered: "delivered_preview",
  revision_requested: "revision_requested",
  revision: "revision_requested",
  awaiting_final_payment: "awaiting_final_payment",
  awaiting_payment: "awaiting_final_payment",
  payment_due: "awaiting_final_payment",
  complete: "completed",
  completed: "completed",
  done: "completed",
  closed: "closed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export const PAYMENT_STATUS_META = {
  pending: {
    label: "Pending",
    badgeClass: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  },
  partial: {
    label: "Partial",
    badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },
  paid: {
    label: "Paid",
    badgeClass: "border-green-500/20 bg-green-500/10 text-green-400",
  },
  refunded: {
    label: "Refunded",
    badgeClass: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  },
};

export const PAYMENT_STATUS_ALIASES = {
  pending: "pending",
  unpaid: "pending",
  due: "pending",
  advance_due: "pending",
  partial: "partial",
  partly_paid: "partial",
  partial_paid: "partial",
  advance_paid: "partial",
  paid: "paid",
  completed: "paid",
  refunded: "refunded",
  refund: "refunded",
};

export const FINANCIAL_RULES = {
  workerPercent: 80,
  companyPercent: 20,
  referralWorkerPercent: 82,
  referralCompanyPercent: 18,
  minimumWithdrawal: 100,
  maxWithdrawalsPerWeek: 4,
  priorityPercent: 20,
  priorityMinimum: 99,
  pendingReleaseDays: 3,
  penaltyMinPercent: 5,
  penaltyMaxPercent: 20,
  bonusPercent: 5,
  regularRefund: { client: 60, worker: 20, company: 20 },
  returningRefund: { client: 70, worker: 20, company: 10 },
};

export const NOTIFICATION_PRIORITY_BY_CATEGORY = {
  payment: "high",
  dispute: "high",
  finance: "high",
  order: "medium",
  assignment: "medium",
  earnings: "medium",
  support: "medium",
  system: "low",
};

export const NOTIFICATION_MAX_PER_MINUTE = 5;
export const NOTIFICATION_DEFAULT_CHANNELS = ["in_app"];

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
  if (actor === "owner" || actor === "superadmin") {
    return ["superadmin", "admin", "manager", "worker"].includes(target);
  }
  if (actor === "admin") {
    return ["manager", "worker"].includes(target);
  }
  if (actor === "manager") {
    return target === "worker";
  }

  return false;
};

export const getAllowedDashboardViews = (role) =>
  Object.entries(DASHBOARD_VIEW_RULES)
    .filter(([, allowedRoles]) => hasRoleAccess(role, allowedRoles))
    .map(([viewId]) => viewId);

export const canAccessDashboardView = (role, viewId) =>
  hasRoleAccess(role, DASHBOARD_VIEW_RULES[viewId] || []);

export const getReferralTier = (role) =>
  ROLE_REFERRAL_CONFIG[normalizeRole(role)] || ROLE_REFERRAL_CONFIG.client;

export const makeReferralCode = (role) => {
  const tier = getReferralTier(role);
  return `TNWR-${tier.code}-${randomSegment()}`;
};

export const getNotificationPriority = (category) =>
  NOTIFICATION_PRIORITY_BY_CATEGORY[normalizeValue(category)] || "low";

export const getNotificationRecipientsForUser = (user, role) => {
  const recipients = [user?.uid, "all"].filter(Boolean);
  const normalizedRole = normalizeRole(role);

  if (normalizedRole) {
    recipients.push(normalizedRole);
  }

  if (normalizedRole !== "client") {
    recipients.push("staff");
  }

  return Array.from(new Set(recipients)).slice(0, 10);
};

export const getNextMonthlyPayoutDate = (baseDate = new Date()) => {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + 1, 1);
  next.setHours(0, 0, 0, 0);
  return next;
};
