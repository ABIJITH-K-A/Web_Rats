import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SERVICE_CATEGORIES, buildPaymentBreakdown } from '../data/siteData';

const DEMO_TAG = 'tnwr-react-demo-v1';
const DEMO_COLLECTIONS = [
  'users',
  'wallets',
  'referralCodes',
  'orders',
  'payments',
  'reviews',
  'disputes',
  'notifications',
  'samples',
  'payroll',
  'transactions',
  'assignmentRequests',
];

const STATUS_LABELS = {
  pending_assignment: 'Pending Assignment',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  delivered_preview: 'Preview Delivered',
  awaiting_final_payment: 'Awaiting Final Payment',
  completed: 'Completed',
  closed: 'Closed',
};

const msInDay = 24 * 60 * 60 * 1000;

const makeStamp = (baseDate, dayOffset = 0, hourOffset = 0) =>
  Timestamp.fromDate(
    new Date(baseDate.getTime() + dayOffset * msInDay + hourOffset * 60 * 60 * 1000)
  );

const withDemoMeta = (record, seededAt, actorId) => ({
  ...record,
  demoSeed: true,
  demoTag: DEMO_TAG,
  seededAt,
  seededBy: actorId || null,
});

const createWalletRecord = ({
  userId,
  createdAt,
  pendingAmount = 0,
  withdrawableAmount = 0,
  onHoldAmount = 0,
  lifetimeWithdrawn = 0,
}) => {
  const totalEarnings = pendingAmount + withdrawableAmount + onHoldAmount;

  return {
    userId,
    totalBalance: totalEarnings,
    pendingAmount,
    withdrawableAmount,
    onHoldAmount,
    totalEarnings,
    lifetimeEarnings: totalEarnings,
    lifetimeWithdrawn,
    status: 'active',
    nextPayDate: makeStamp(createdAt.toDate(), 14),
    lastPayDate: createdAt,
    lastUpdated: createdAt,
    createdAt,
    updatedAt: createdAt,
    total: totalEarnings,
    pending: pendingAmount,
    withdrawable: withdrawableAmount,
    onHold: onHoldAmount,
    withdrawn: lifetimeWithdrawn,
    available: withdrawableAmount,
    pendingApproval: pendingAmount,
    pendingPayout: onHoldAmount,
    lifetimePaid: lifetimeWithdrawn,
  };
};

const getSelection = (categoryIndex, serviceIndex, planIndex) => {
  const category = SERVICE_CATEGORIES[categoryIndex];
  const service = category.services[serviceIndex];
  const plan = service.plans[planIndex];

  return { category, service, plan };
};

const createOrderRecord = ({
  orderId,
  baseDate,
  dayOffset,
  categoryIndex,
  serviceIndex,
  planIndex,
  customer,
  worker = null,
  customerType = 'new',
  statusKey = 'pending_assignment',
  paymentState = 'partial',
  isPriority = false,
  deadlineLabel,
  summary,
  deliveryLink = null,
  reviewDone = false,
}) => {
  const { category, service, plan } = getSelection(categoryIndex, serviceIndex, planIndex);
  const payment = buildPaymentBreakdown({
    basePrice: plan.price,
    isPriority,
    customerType,
  });
  const createdAt = makeStamp(baseDate, dayOffset);
  const assignedAt = worker ? makeStamp(baseDate, dayOffset, 8) : null;
  const inProgressAt =
    ['in_progress', 'delivered_preview', 'awaiting_final_payment', 'completed', 'closed'].includes(
      statusKey
    ) && worker
      ? makeStamp(baseDate, dayOffset + 1, 10)
      : null;
  const previewDeliveredAt =
    ['delivered_preview', 'awaiting_final_payment', 'completed', 'closed'].includes(statusKey) &&
    worker
      ? makeStamp(baseDate, dayOffset + 2, 15)
      : null;
  const awaitingFinalPaymentAt =
    ['awaiting_final_payment', 'completed', 'closed'].includes(statusKey) && worker
      ? makeStamp(baseDate, dayOffset + 3, 12)
      : null;
  const completedAt =
    ['completed', 'closed'].includes(statusKey) && worker
      ? makeStamp(baseDate, dayOffset + 4, 16)
      : null;
  const totalPaid =
    paymentState === 'paid'
      ? payment.total
      : paymentState === 'partial'
      ? payment.advancePayment
      : 0;
  const advancePaid = paymentState === 'pending' ? 0 : payment.advancePayment;

  return {
    userId: customer.id,
    customerId: customer.id,
    customerName: customer.name,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    category: category.name,
    categoryId: category.id,
    service: service.name,
    serviceId: service.id,
    plan: plan.label,
    planId: plan.id,
    package: plan.label,
    price: payment.total,
    basePrice: payment.basePrice,
    priorityFee: payment.priorityFee,
    totalPrice: payment.total,
    advancePayment: payment.advancePayment,
    advancePaid,
    remainingPayment: Math.max(payment.total - totalPaid, 0),
    remainingAmount: Math.max(payment.total - totalPaid, 0),
    totalPaid,
    advanceRate: payment.advanceRate,
    customerType,
    isPriority,
    priorityLabel: isPriority ? 'High' : 'Normal',
    projectDescription: summary,
    features: service.deliverables.slice(0, 3).join(', '),
    references: 'https://www.figma.com/file/demo-board',
    deadline: deadlineLabel,
    requirements: {
      projectDescription: summary,
      features: service.deliverables.slice(0, 3).join(', '),
      references: 'https://www.figma.com/file/demo-board',
      deadline: deadlineLabel,
    },
    paymentStatus:
      paymentState === 'paid'
        ? 'Paid'
        : paymentState === 'partial'
        ? 'Advance Paid'
        : 'Pending',
    status: STATUS_LABELS[statusKey],
    orderStatus: STATUS_LABELS[statusKey],
    statusKey,
    assignmentStatus: worker ? 'approved' : 'unassigned',
    assignedWorkers: worker ? [worker.id] : [],
    workerAssigned: worker?.id || null,
    workerAssignedName: worker?.name || null,
    assignedTo: worker?.id || null,
    assignedToName: worker?.name || null,
    createdAt,
    updatedAt: completedAt || awaitingFinalPaymentAt || previewDeliveredAt || inProgressAt || assignedAt || createdAt,
    assignedAt,
    inProgressAt,
    previewDeliveredAt,
    awaitingFinalPaymentAt,
    completedAt,
    deliveryLink,
    reviewDone,
  };
};

const queryDemoDocs = (collectionName) =>
  getDocs(query(collection(db, collectionName), where('demoSeed', '==', true)));

export const getDemoDatasetSummary = async () => {
  const snapshots = await Promise.all(DEMO_COLLECTIONS.map((name) => queryDemoDocs(name)));

  const collections = snapshots.reduce((acc, snapshot, index) => {
    acc[DEMO_COLLECTIONS[index]] = snapshot.size;
    return acc;
  }, {});

  return {
    tag: DEMO_TAG,
    total: Object.values(collections).reduce((sum, value) => sum + value, 0),
    collections,
  };
};

export const clearDemoDataset = async () => {
  const snapshots = await Promise.all(DEMO_COLLECTIONS.map((name) => queryDemoDocs(name)));

  for (const snapshot of snapshots) {
    if (snapshot.empty) continue;

    let batch = writeBatch(db);
    let batchSize = 0;

    for (const docSnapshot of snapshot.docs) {
      batch.delete(docSnapshot.ref);
      batchSize += 1;

      if (batchSize >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchSize = 0;
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }
  }

  return { cleared: true };
};

export const seedDemoDataset = async ({ actorId = null, actorName = 'Admin' } = {}) => {
  await clearDemoDataset();

  const now = new Date();
  const seededAt = Timestamp.fromDate(now);
  const batch = writeBatch(db);

  const clientA = {
    id: 'demo-client-a',
    name: 'Ava Nair',
    email: 'ava.demo@tnwebrats.test',
    phone: '+91 98765 41001',
    role: 'client',
    customerType: 'new',
    referralCode: 'TNWR-CLI-DEMA',
    usedReferralCode: 'TNWR-MGR-DEMO',
    referredBy: 'demo-manager-a',
    status: 'active',
  };
  const clientB = {
    id: 'demo-client-b',
    name: 'Ryan Paul',
    email: 'ryan.demo@tnwebrats.test',
    phone: '+91 98765 41002',
    role: 'client',
    customerType: 'returning',
    referralCode: 'TNWR-CLI-DEMB',
    usedReferralCode: 'TNWR-WRK-DEM1',
    referredBy: 'demo-worker-a',
    status: 'active',
  };
  const workerA = {
    id: 'demo-worker-a',
    name: 'Maya Joseph',
    email: 'maya.demo@tnwebrats.test',
    phone: '+91 98765 42001',
    role: 'worker',
    customerType: 'returning',
    referralCode: 'TNWR-WRK-DEM1',
    discountPercent: 5,
    status: 'active',
  };
  const workerB = {
    id: 'demo-worker-b',
    name: 'Rohan Das',
    email: 'rohan.demo@tnwebrats.test',
    phone: '+91 98765 42002',
    role: 'worker',
    customerType: 'returning',
    referralCode: 'TNWR-WRK-DEM2',
    discountPercent: 5,
    status: 'active',
  };
  const managerA = {
    id: 'demo-manager-a',
    name: 'Kiran Mehta',
    email: 'kiran.demo@tnwebrats.test',
    phone: '+91 98765 43001',
    role: 'manager',
    customerType: 'returning',
    referralCode: 'TNWR-MGR-DEMO',
    discountPercent: 10,
    status: 'active',
  };

  const users = [clientA, clientB, workerA, workerB, managerA];
  users.forEach((user, index) => {
    batch.set(
      doc(db, 'users', user.id),
      withDemoMeta(
        {
          ...user,
          createdAt: makeStamp(now, -14 + index),
          updatedAt: makeStamp(now, -1),
        },
        seededAt,
        actorId
      )
    );
  });

  const referralCodes = [
    { code: clientA.referralCode, ownerUid: clientA.id, role: clientA.role, discountPercent: 0, timesUsed: 0 },
    { code: clientB.referralCode, ownerUid: clientB.id, role: clientB.role, discountPercent: 0, timesUsed: 0 },
    { code: workerA.referralCode, ownerUid: workerA.id, role: workerA.role, discountPercent: 5, timesUsed: 3 },
    { code: workerB.referralCode, ownerUid: workerB.id, role: workerB.role, discountPercent: 5, timesUsed: 1 },
    { code: managerA.referralCode, ownerUid: managerA.id, role: managerA.role, discountPercent: 10, timesUsed: 4 },
  ];
  referralCodes.forEach((item, index) => {
    batch.set(
      doc(db, 'referralCodes', item.code),
      withDemoMeta(
        {
          ...item,
          createdAt: makeStamp(now, -18 + index),
        },
        seededAt,
        actorId
      )
    );
  });

  const wallets = [
    createWalletRecord({ userId: clientA.id, createdAt: makeStamp(now, -10), withdrawableAmount: 1200 }),
    createWalletRecord({ userId: clientB.id, createdAt: makeStamp(now, -9), withdrawableAmount: 800 }),
    createWalletRecord({
      userId: workerA.id,
      createdAt: makeStamp(now, -8),
      pendingAmount: 5400,
      withdrawableAmount: 18200,
      lifetimeWithdrawn: 7600,
    }),
    createWalletRecord({
      userId: workerB.id,
      createdAt: makeStamp(now, -8),
      pendingAmount: 3200,
      withdrawableAmount: 14600,
      lifetimeWithdrawn: 5400,
    }),
    createWalletRecord({
      userId: managerA.id,
      createdAt: makeStamp(now, -8),
      pendingAmount: 4800,
      withdrawableAmount: 9800,
      lifetimeWithdrawn: 4200,
    }),
  ];
  wallets.forEach((wallet) => {
    batch.set(
      doc(db, 'wallets', wallet.userId),
      withDemoMeta(wallet, seededAt, actorId)
    );
  });

  const orders = [
    {
      id: 'demo-order-pending',
      record: createOrderRecord({
        orderId: 'demo-order-pending',
        baseDate: now,
        dayOffset: -7,
        categoryIndex: 0,
        serviceIndex: 0,
        planIndex: 1,
        customer: clientA,
        customerType: 'new',
        statusKey: 'pending_assignment',
        paymentState: 'partial',
        isPriority: false,
        deadlineLabel: 'Apr 04',
        summary: 'Investor-ready presentation deck for a climate-tech pitch.',
      }),
    },
    {
      id: 'demo-order-assigned',
      record: createOrderRecord({
        orderId: 'demo-order-assigned',
        baseDate: now,
        dayOffset: -6,
        categoryIndex: 1,
        serviceIndex: 0,
        planIndex: 2,
        customer: clientB,
        worker: workerA,
        customerType: 'returning',
        statusKey: 'assigned',
        paymentState: 'partial',
        isPriority: true,
        deadlineLabel: 'Apr 01',
        summary: 'Landing page build for a marketing campaign with fast turnaround.',
      }),
    },
    {
      id: 'demo-order-progress',
      record: createOrderRecord({
        orderId: 'demo-order-progress',
        baseDate: now,
        dayOffset: -5,
        categoryIndex: 2,
        serviceIndex: 0,
        planIndex: 1,
        customer: clientA,
        worker: workerB,
        customerType: 'new',
        statusKey: 'in_progress',
        paymentState: 'partial',
        isPriority: false,
        deadlineLabel: 'Apr 05',
        summary: 'Speed and mobile optimization sprint for a college club website.',
      }),
    },
    {
      id: 'demo-order-finalpay',
      record: createOrderRecord({
        orderId: 'demo-order-finalpay',
        baseDate: now,
        dayOffset: -4,
        categoryIndex: 3,
        serviceIndex: 0,
        planIndex: 2,
        customer: clientB,
        worker: workerA,
        customerType: 'returning',
        statusKey: 'awaiting_final_payment',
        paymentState: 'partial',
        isPriority: false,
        deadlineLabel: 'Apr 02',
        summary: 'Premium template asset pack with customization notes and exports.',
        deliveryLink: 'https://example.com/demo-preview-finalpay',
      }),
    },
    {
      id: 'demo-order-complete',
      record: createOrderRecord({
        orderId: 'demo-order-complete',
        baseDate: now,
        dayOffset: -10,
        categoryIndex: 0,
        serviceIndex: 1,
        planIndex: 2,
        customer: clientB,
        worker: workerB,
        customerType: 'returning',
        statusKey: 'completed',
        paymentState: 'paid',
        isPriority: true,
        deadlineLabel: 'Mar 29',
        summary: 'Event poster system with hero artwork, socials, and print exports.',
        deliveryLink: 'https://example.com/demo-complete-assets',
        reviewDone: true,
      }),
    },
  ];
  orders.forEach((order) => {
    batch.set(
      doc(db, 'orders', order.id),
      withDemoMeta(order.record, seededAt, actorId)
    );
  });

  const payments = [
    {
      id: 'demo-payment-1',
      orderId: 'demo-order-pending',
      userId: clientA.id,
      amount: orders[0].record.advancePaid,
      paymentType: 'advance',
      status: 'completed',
      method: 'demo',
      customerName: clientA.name,
      createdAt: makeStamp(now, -7, 1),
    },
    {
      id: 'demo-payment-2',
      orderId: 'demo-order-assigned',
      userId: clientB.id,
      amount: orders[1].record.advancePaid,
      paymentType: 'advance',
      status: 'completed',
      method: 'demo',
      customerName: clientB.name,
      createdAt: makeStamp(now, -6, 2),
    },
    {
      id: 'demo-payment-3',
      orderId: 'demo-order-complete',
      userId: clientB.id,
      amount: orders[4].record.totalPrice,
      paymentType: 'full',
      status: 'completed',
      method: 'demo',
      customerName: clientB.name,
      createdAt: makeStamp(now, -9, 4),
    },
  ];
  payments.forEach((payment) => {
    batch.set(
      doc(db, 'payments', payment.id),
      withDemoMeta(payment, seededAt, actorId)
    );
  });

  const reviews = [
    {
      id: 'demo-review-1',
      orderId: 'demo-order-complete',
      rating: 5,
      comment: 'Fast turnaround and polished files.',
      customerId: clientB.id,
      customerName: clientB.name,
      service: orders[4].record.service,
      workerAssigned: workerB.id,
      createdAt: makeStamp(now, -8, 5),
    },
    {
      id: 'demo-review-2',
      orderId: 'demo-order-finalpay',
      rating: 4,
      comment: 'Preview looks strong, waiting to close the payment.',
      customerId: clientB.id,
      customerName: clientB.name,
      service: orders[3].record.service,
      workerAssigned: workerA.id,
      createdAt: makeStamp(now, -3, 5),
    },
  ];
  reviews.forEach((review) => {
    batch.set(
      doc(db, 'reviews', review.id),
      withDemoMeta(review, seededAt, actorId)
    );
  });

  const disputes = [
    {
      id: 'demo-dispute-open',
      orderId: 'demo-order-finalpay',
      orderDisplayId: 'FINALPAY',
      raisedBy: clientB.id,
      raisedByName: clientB.name,
      raisedByRole: 'client',
      assignedTo: workerA.id,
      workerAssigned: workerA.id,
      assignedWorkers: [workerA.id],
      type: 'payment',
      description: 'Client wants clarification on the final payment before closing.',
      requestedAmount: 1200,
      status: 'under_review',
      resolution: null,
      refundAmount: 0,
      penaltyAmount: 0,
      createdAt: makeStamp(now, -2),
      updatedAt: makeStamp(now, -1),
      messages: [
        {
          senderId: clientB.id,
          senderName: clientB.name,
          senderRole: 'client',
          message: 'Please explain the final payment split before I clear it.',
          timestamp: makeStamp(now, -2, 2),
          type: 'initial',
        },
        {
          senderId: workerA.id,
          senderName: workerA.name,
          senderRole: 'worker',
          message: 'The preview is ready. Final amount unlocks the source files and exports.',
          timestamp: makeStamp(now, -1, 4),
          type: 'reply',
        },
      ],
      timeline: [
        { action: 'dispute_raised', by: clientB.id, at: makeStamp(now, -2, 2) },
        { action: 'admin_review_started', by: actorId || 'demo-admin', at: makeStamp(now, -1, 8) },
      ],
    },
    {
      id: 'demo-dispute-resolved',
      orderId: 'demo-order-complete',
      orderDisplayId: 'COMPLETE',
      raisedBy: clientB.id,
      raisedByName: clientB.name,
      raisedByRole: 'client',
      assignedTo: workerB.id,
      workerAssigned: workerB.id,
      assignedWorkers: [workerB.id],
      type: 'quality',
      description: 'Minor export issue was fixed and a goodwill bonus was approved.',
      requestedAmount: 800,
      status: 'resolved',
      resolution: 'partial_refund',
      refundAmount: 400,
      penaltyAmount: 0,
      createdAt: makeStamp(now, -8),
      updatedAt: makeStamp(now, -7),
      resolvedBy: actorId || 'demo-admin',
      resolvedByName: actorName,
      resolvedAt: makeStamp(now, -7, 4),
      messages: [
        {
          senderId: clientB.id,
          senderName: clientB.name,
          senderRole: 'client',
          message: 'One file export had a formatting issue.',
          timestamp: makeStamp(now, -8, 1),
          type: 'initial',
        },
      ],
      timeline: [
        { action: 'dispute_raised', by: clientB.id, at: makeStamp(now, -8, 1) },
        {
          action: 'dispute_resolved',
          by: actorId || 'demo-admin',
          resolution: 'partial_refund',
          at: makeStamp(now, -7, 4),
        },
      ],
    },
  ];
  disputes.forEach((dispute) => {
    batch.set(
      doc(db, 'disputes', dispute.id),
      withDemoMeta(dispute, seededAt, actorId)
    );
  });

  const notifications = [
    {
      id: 'demo-notification-1',
      recipientId: 'admin',
      recipientRole: 'admin',
      title: 'Priority order needs assignment',
      message: 'A high-priority landing page is waiting for staffing.',
      category: 'assignment',
      type: 'assignment',
      priority: 'medium',
      channels: ['in_app'],
      orderId: 'demo-order-assigned',
      read: false,
      createdAt: makeStamp(now, -6, 2),
    },
    {
      id: 'demo-notification-2',
      recipientId: 'admin',
      recipientRole: 'admin',
      title: 'Dispute escalated',
      message: 'Final payment dispute moved into review.',
      category: 'dispute',
      type: 'dispute',
      priority: 'high',
      channels: ['in_app'],
      orderId: 'demo-order-finalpay',
      disputeId: 'demo-dispute-open',
      read: false,
      createdAt: makeStamp(now, -1, 8),
    },
    {
      id: 'demo-notification-3',
      recipientId: 'staff',
      recipientRole: 'worker',
      title: 'Wallet release window',
      message: 'Pending wallet amounts are scheduled to move into withdrawable balance tomorrow.',
      category: 'finance',
      type: 'finance',
      priority: 'high',
      channels: ['in_app'],
      read: true,
      createdAt: makeStamp(now, -1, 9),
    },
  ];
  notifications.forEach((notification) => {
    batch.set(
      doc(db, 'notifications', notification.id),
      withDemoMeta(notification, seededAt, actorId)
    );
  });

  const samples = [
    {
      id: 'demo-sample-1',
      type: 'send',
      clientName: clientA.name,
      clientEmail: clientA.email,
      clientPhone: clientA.phone,
      orderId: 'demo-order-pending',
      expectedDate: '2026-04-03',
      notes: 'Deck printout and color samples ready for courier.',
      requestedBy: managerA.id,
      requestedByName: managerA.name,
      status: 'pending',
      createdAt: makeStamp(now, -3),
    },
    {
      id: 'demo-sample-2',
      type: 'receive',
      clientName: clientB.name,
      clientEmail: clientB.email,
      clientPhone: clientB.phone,
      orderId: 'demo-order-complete',
      expectedDate: '2026-03-29',
      notes: 'Received branding kit and print references from client.',
      requestedBy: managerA.id,
      requestedByName: managerA.name,
      status: 'delivered',
      createdAt: makeStamp(now, -9),
    },
  ];
  samples.forEach((sample) => {
    batch.set(
      doc(db, 'samples', sample.id),
      withDemoMeta(sample, seededAt, actorId)
    );
  });

  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = `${previousMonthDate.getFullYear()}-${String(
    previousMonthDate.getMonth() + 1
  ).padStart(2, '0')}`;

  const payrolls = [
    {
      id: 'demo-payroll-current',
      month: currentMonth,
      totalIncome: 78000,
      managerAllocations: {
        [managerA.id]: 48000,
      },
      workerAllocations: {
        [managerA.id]: {
          [workerA.id]: 26000,
          [workerB.id]: 22000,
        },
      },
      status: 'allocated',
      createdBy: actorId || 'demo-admin',
      createdAt: makeStamp(now, -2),
    },
    {
      id: 'demo-payroll-previous',
      month: previousMonth,
      totalIncome: 64200,
      managerAllocations: {
        [managerA.id]: 40000,
      },
      workerAllocations: {
        [managerA.id]: {
          [workerA.id]: 21000,
          [workerB.id]: 19000,
        },
      },
      status: 'distributed',
      createdBy: actorId || 'demo-admin',
      createdAt: makeStamp(now, -28),
    },
  ];
  payrolls.forEach((payroll) => {
    batch.set(
      doc(db, 'payroll', payroll.id),
      withDemoMeta(payroll, seededAt, actorId)
    );
  });

  const transactions = [
    {
      id: 'demo-transaction-1',
      userId: workerA.id,
      type: 'income',
      category: 'order',
      amount: 5400,
      referenceId: 'demo-order-finalpay',
      status: 'pending',
      createdAt: makeStamp(now, -2, 7),
    },
    {
      id: 'demo-transaction-2',
      userId: workerB.id,
      type: 'income',
      category: 'order',
      amount: 9200,
      referenceId: 'demo-order-complete',
      status: 'available',
      createdAt: makeStamp(now, -8, 6),
    },
  ];
  transactions.forEach((transaction) => {
    batch.set(
      doc(db, 'transactions', transaction.id),
      withDemoMeta(transaction, seededAt, actorId)
    );
  });

  const assignmentRequests = [
    {
      id: 'demo-assignment-request-1',
      orderId: 'demo-order-assigned',
      requestedBy: managerA.id,
      requestedByName: managerA.name,
      workerId: workerA.id,
      workerName: workerA.name,
      status: 'pending',
      createdAt: makeStamp(now, -6, 3),
      updatedAt: makeStamp(now, -6, 3),
    },
  ];
  assignmentRequests.forEach((request) => {
    batch.set(
      doc(db, 'assignmentRequests', request.id),
      withDemoMeta(request, seededAt, actorId)
    );
  });

  await batch.commit();
  return getDemoDatasetSummary();
};

export default {
  DEMO_TAG,
  DEMO_COLLECTIONS,
  getDemoDatasetSummary,
  clearDemoDataset,
  seedDemoDataset,
};
