import { SERVICE_CATEGORIES } from "../data/siteData";

export const ORDER_STATUS_META = {
  active: {
    label: "Active",
    progress: 24,
    badgeClass: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  },
  accepted: {
    label: "Accepted",
    progress: 45,
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  },
  in_progress: {
    label: "In Progress",
    progress: 72,
    badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },
  completed: {
    label: "Completed",
    progress: 100,
    badgeClass: "border-cyan-primary/20 bg-cyan-primary/10 text-cyan-primary",
  },
  cancelled: {
    label: "Cancelled",
    progress: 0,
    badgeClass: "border-red-500/20 bg-red-500/10 text-red-400",
  },
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
};

const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export const normalizeOrderStatus = (value) => {
  const normalized = normalizeValue(value);

  if (!normalized) return "active";

  const aliasMap = {
    pending: "active",
    new: "active",
    active: "active",
    accepted: "accepted",
    assigned: "accepted",
    in_progress: "in_progress",
    progress: "in_progress",
    working: "in_progress",
    complete: "completed",
    completed: "completed",
    done: "completed",
    cancelled: "cancelled",
    canceled: "cancelled",
  };

  return aliasMap[normalized] || "active";
};

export const toFirestoreOrderStatus = (value) =>
  ORDER_STATUS_META[normalizeOrderStatus(value)]?.label || "Active";

export const getOrderStatusLabel = (value) =>
  ORDER_STATUS_META[normalizeOrderStatus(value)]?.label || "Active";

export const getOrderStatusBadgeClass = (value) =>
  ORDER_STATUS_META[normalizeOrderStatus(value)]?.badgeClass ||
  ORDER_STATUS_META.active.badgeClass;

export const getOrderProgress = (value) =>
  ORDER_STATUS_META[normalizeOrderStatus(value)]?.progress ?? 0;

export const isCompletedOrder = (order) =>
  normalizeOrderStatus(order?.status || order?.orderStatus) === "completed";

export const isOpenOrder = (order) =>
  !["completed", "cancelled"].includes(
    normalizeOrderStatus(order?.status || order?.orderStatus)
  );

export const normalizePaymentStatus = (value) => {
  const normalized = normalizeValue(value);

  if (!normalized) return "pending";

  const aliasMap = {
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
  };

  return aliasMap[normalized] || "pending";
};

export const getPaymentStatusLabel = (value) =>
  PAYMENT_STATUS_META[normalizePaymentStatus(value)]?.label || "Pending";

export const getPaymentStatusBadgeClass = (value) =>
  PAYMENT_STATUS_META[normalizePaymentStatus(value)]?.badgeClass ||
  PAYMENT_STATUS_META.pending.badgeClass;

export const formatCurrency = (amount = 0) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const formatDate = (value, options) => {
  const date = toDateValue(value);
  if (!date) return "—";

  return date.toLocaleDateString(
    "en-IN",
    options || { day: "numeric", month: "short", year: "numeric" }
  );
};

export const formatDateTime = (value) => {
  const date = toDateValue(value);
  if (!date) return "—";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getOrderAmount = (order) =>
  Number(order?.totalPrice || order?.finalPrice || order?.price || 0);

export const getOrderDisplayId = (order) => {
  const rawId = order?.orderId || order?.id || "";
  if (!rawId) return "TNWR-NEW";
  if (String(rawId).startsWith("TNWR-")) return rawId;

  return `TNWR-${String(rawId).slice(-6).toUpperCase()}`;
};

export const getOrderPlanLabel = (order) =>
  order?.plan || order?.package || "Custom";

export const getOrderPriorityLabel = (order) =>
  order?.isPriority || normalizeValue(order?.priorityLabel) === "high"
    ? "High Priority"
    : "Normal";

export const getOrderPriorityBadgeClass = (order) =>
  order?.isPriority || normalizeValue(order?.priorityLabel) === "high"
    ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
    : "border-white/10 bg-white/5 text-white/55";

export const getCustomerTypeLabel = (order, fallback = "new") => {
  const value = normalizeValue(order?.customerType || fallback);
  return value === "returning" ? "Returning" : "New";
};

export const getPrimaryAssetLink = (order) =>
  order?.deliveryLink ||
  order?.downloadUrl ||
  order?.filesUrl ||
  order?.driveLink ||
  order?.references ||
  null;

export const getRequirementFields = (order) => ({
  name: order?.name || order?.customerName || "",
  email: order?.email || order?.customerEmail || "",
  phone: order?.phone || order?.customerPhone || "",
  projectDescription:
    order?.requirements?.projectDescription || order?.projectDescription || "",
  features: order?.requirements?.features || order?.features || "",
  references: order?.requirements?.references || order?.references || "",
  deadline: order?.requirements?.deadline || order?.deadline || "",
});

export const resolveServiceSelection = (order) => {
  const categoryById = SERVICE_CATEGORIES.find(
    (category) => category.id === order?.categoryId
  );
  const serviceById = categoryById?.services.find(
    (service) => service.id === order?.serviceId
  );

  if (categoryById && serviceById) {
    const plan =
      serviceById.plans.find((item) => item.id === order?.planId) ||
      serviceById.plans.find(
        (item) => normalizeValue(item.label) === normalizeValue(order?.plan)
      ) ||
      null;

    return {
      categoryId: categoryById.id,
      serviceId: serviceById.id,
      planId: plan?.id || null,
    };
  }

  for (const category of SERVICE_CATEGORIES) {
    const matchesCategory =
      normalizeValue(category.name) === normalizeValue(order?.category) ||
      normalizeValue(category.shortName) === normalizeValue(order?.category);

    for (const service of category.services) {
      const matchesService =
        service.id === order?.serviceId ||
        normalizeValue(service.name) === normalizeValue(order?.service) ||
        normalizeValue(service.shortName) === normalizeValue(order?.service);

      if (!matchesCategory && !matchesService) continue;

      const plan =
        service.plans.find((item) => item.id === order?.planId) ||
        service.plans.find(
          (item) => normalizeValue(item.label) === normalizeValue(order?.plan)
        ) ||
        null;

      return {
        categoryId: category.id,
        serviceId: service.id,
        planId: plan?.id || null,
      };
    }
  }

  return {
    categoryId: null,
    serviceId: null,
    planId: null,
  };
};

export const buildReorderDraft = (order) => {
  const selection = resolveServiceSelection(order);

  return {
    ...selection,
    isPriority: !!order?.isPriority,
    isReorder: true,
    parentOrderId: getOrderDisplayId(order),
    previousOrderId: order?.id || null,
    requirements: getRequirementFields(order),
  };
};

export const getOrderTimeline = (order) => {
  const current = normalizeOrderStatus(order?.status || order?.orderStatus);

  return [
    {
      key: "active",
      label: "Active",
      done: ["active", "accepted", "in_progress", "completed"].includes(current),
      date: toDateValue(order?.createdAt),
    },
    {
      key: "accepted",
      label: "Accepted",
      done: ["accepted", "in_progress", "completed"].includes(current),
      date: toDateValue(order?.acceptedAt),
    },
    {
      key: "in_progress",
      label: "In Progress",
      done: ["in_progress", "completed"].includes(current),
      date: toDateValue(order?.startedAt || order?.inProgressAt),
    },
    {
      key: "completed",
      label: "Completed",
      done: current === "completed",
      date: toDateValue(order?.completedAt),
    },
  ];
};

export const getOrderPaymentSummary = (order) => {
  const total = getOrderAmount(order);
  const advance = Number(order?.advancePayment || 0);
  const remaining = Number(
    order?.remainingPayment ?? Math.max(total - advance, 0)
  );
  const paymentStatus = normalizePaymentStatus(order?.paymentStatus);

  if (paymentStatus === "paid") {
    return {
      total,
      paid: total,
      pending: 0,
      dueNow: 0,
      status: paymentStatus,
    };
  }

  if (paymentStatus === "partial") {
    return {
      total,
      paid: advance,
      pending: remaining,
      dueNow: remaining,
      status: paymentStatus,
    };
  }

  return {
    total,
    paid: 0,
    pending: advance || total,
    dueNow: advance || total,
    status: paymentStatus,
  };
};

export const getPaymentSummary = getOrderPaymentSummary;
