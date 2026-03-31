import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logAuditEvent } from './auditService';
import { createNotification, notifyAdmin } from './notificationService';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
const RAZORPAY_ORDER_URL = import.meta.env.VITE_RAZORPAY_ORDER_URL || '';
const RAZORPAY_VERIFY_URL = import.meta.env.VITE_RAZORPAY_VERIFY_URL || '';
const RAZORPAY_DEMO_MODE =
  import.meta.env.VITE_RAZORPAY_DEMO_MODE === 'true' ||
  (!RAZORPAY_KEY_ID && !RAZORPAY_ORDER_URL);

const DEMO_DELAY_MS = 900;

const createPaymentError = (message, metadata = {}) => {
  const error = new Error(message);
  Object.assign(error, metadata);
  return error;
};

const sleep = (delay) => new Promise((resolve) => window.setTimeout(resolve, delay));

const createDemoOrderResponse = (amount, orderId) => ({
  id: `demo_order_${Date.now()}`,
  amount: Math.round(Number(amount || 0) * 100),
  currency: 'INR',
  orderDisplayId: orderId,
  demoMode: true,
});

const fetchJson = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw createPaymentError('Payment gateway request failed.', {
      code: 'gateway_request_failed',
      statusCode: response.status,
    });
  }

  return response.json();
};

export const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(createPaymentError('Failed to load Razorpay.'));
    document.body.appendChild(script);
  });

export const createRazorpayOrder = async (amount, orderId, userDetails = {}) => {
  if (!RAZORPAY_ORDER_URL) {
    return createDemoOrderResponse(amount, orderId);
  }

  const response = await fetchJson(RAZORPAY_ORDER_URL, {
    amount,
    orderId,
    userDetails,
  });

  if (!response?.id || !response?.amount) {
    throw createPaymentError('Invalid order response from payment gateway.', {
      code: 'invalid_gateway_response',
    });
  }

  return {
    ...response,
    demoMode: false,
  };
};

const buildOrderPaymentPatch = ({
  order,
  amount,
  paymentId,
  paymentType,
}) => {
  const totalPrice = Number(order?.totalPrice || order?.finalPrice || order?.price || 0);
  const previousAdvance = Number(order?.advancePaid || 0);
  const previousTotalPaid = Number(order?.totalPaid || 0);

  if (paymentType === 'advance') {
    const nextAdvance = amount;
    const nextTotalPaid = Math.max(previousTotalPaid, nextAdvance);

    return {
      paymentStatus: 'Advance Paid',
      advancePaymentId: paymentId,
      advancePaid: nextAdvance,
      advancePaidAt: serverTimestamp(),
      totalPaid: nextTotalPaid,
      remainingAmount: Math.max(totalPrice - nextTotalPaid, 0),
      remainingPayment: Math.max(totalPrice - nextTotalPaid, 0),
      updatedAt: serverTimestamp(),
    };
  }

  const nextTotalPaid = previousAdvance + amount;

  return {
    paymentStatus: 'Paid',
    paymentId,
    totalPaid: nextTotalPaid,
    paidAt: serverTimestamp(),
    remainingAmount: 0,
    remainingPayment: 0,
    updatedAt: serverTimestamp(),
  };
};

const assertPaymentNotDuplicated = ({ order, paymentId, paymentType }) => {
  if (paymentType === 'advance') {
    if (order?.advancePaymentId === paymentId) {
      throw createPaymentError('This advance payment is already recorded.', {
        code: 'duplicate_payment',
        preserveOrder: true,
      });
    }

    if (Number(order?.advancePaid || 0) > 0) {
      throw createPaymentError('Advance payment is already completed for this order.', {
        code: 'advance_already_paid',
        preserveOrder: true,
      });
    }
  }

  if (paymentType === 'full') {
    if (order?.paymentId === paymentId || String(order?.paymentStatus || '').toLowerCase() === 'paid') {
      throw createPaymentError('Full payment is already completed for this order.', {
        code: 'payment_already_paid',
        preserveOrder: true,
      });
    }
  }
};

const recordPaymentSuccess = async ({
  razorpayResponse,
  orderDocId,
  amount,
  paymentType,
  orderId,
  userDetails,
  demoMode = false,
}) => {
  const orderRef = doc(db, 'orders', orderDocId);
  const orderSnapshot = await getDoc(orderRef);

  if (!orderSnapshot.exists()) {
    throw createPaymentError('Order record missing during payment confirmation.', {
      code: 'missing_order',
      preserveOrder: true,
    });
  }

  const order = orderSnapshot.data();
  const paymentId = razorpayResponse.razorpay_payment_id;
  const razorpayOrderId = razorpayResponse.razorpay_order_id;
  const signature = razorpayResponse.razorpay_signature;

  assertPaymentNotDuplicated({ order, paymentId, paymentType });

  const paymentData = {
    orderId: orderDocId,
    orderDisplayId: orderId,
    amount,
    paymentType,
    paymentId,
    razorpayOrderId,
    signature,
    status: 'completed',
    customerEmail: userDetails.email,
    customerName: userDetails.name,
    customerPhone: userDetails.phone,
    method: demoMode ? 'demo' : 'razorpay',
    demoMode,
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, 'payments'), paymentData);
  await updateDoc(
    orderRef,
    buildOrderPaymentPatch({
      order,
      amount,
      paymentId,
      paymentType,
    })
  );

  await notifyAdmin({
    title: `Payment Received${demoMode ? ' (Demo)' : ''}`,
    message: `${userDetails.name} completed a ${paymentType} payment for order ${orderId}.`,
    category: 'payment',
    orderId: orderDocId,
    paymentId,
  });

  if (order?.customerId && order.customerId !== 'guest') {
    await createNotification({
      recipientId: order.customerId,
      title: demoMode ? 'Demo Payment Recorded' : 'Payment Recorded',
      message: `${paymentType === 'advance' ? 'Advance' : 'Full'} payment was recorded for your order ${orderId}.`,
      category: 'payment',
      orderId: orderDocId,
      paymentId,
      metadata: { demoMode, paymentType },
    });
  }

  await logAuditEvent({
    actorId: order?.customerId || null,
    actorRole: 'client',
    action: demoMode ? 'demo_payment_recorded' : 'payment_recorded',
    targetType: 'payment',
    targetId: paymentId,
    severity: 'medium',
    metadata: {
      orderDocId,
      orderDisplayId: orderId,
      paymentType,
      amount,
      demoMode,
    },
  });

  return paymentData;
};

export const initializeRazorpayCheckout = async ({
  amount,
  orderId,
  orderDocId,
  userDetails,
  onSuccess,
  onError,
  paymentType = 'advance',
}) => {
  const reportError = (error) => {
    const normalized =
      error instanceof Error
        ? error
        : createPaymentError(String(error || 'Payment failed.'));
    onError?.(normalized);
  };

  try {
    const razorpayOrder = await createRazorpayOrder(amount, orderId, userDetails);

    if (razorpayOrder.demoMode || RAZORPAY_DEMO_MODE) {
      await sleep(DEMO_DELAY_MS);

      const demoResponse = {
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_order_id: razorpayOrder.id,
        razorpay_signature: `sig_demo_${Date.now()}`,
      };

      await recordPaymentSuccess({
        razorpayResponse: demoResponse,
        orderDocId,
        amount,
        paymentType,
        orderId,
        userDetails,
        demoMode: true,
      });

      onSuccess?.(demoResponse);
      return demoResponse;
    }

    if (!RAZORPAY_KEY_ID) {
      throw createPaymentError(
        'Razorpay key is missing. Configure payment keys or enable demo mode.',
        { code: 'missing_razorpay_key' }
      );
    }

    const Razorpay = await loadRazorpayScript();
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      name: 'TN Web Rats',
      description: `${paymentType === 'advance' ? 'Advance' : 'Full'} Payment for Order ${orderId}`,
      order_id: razorpayOrder.id,
      handler: async (response) => {
        try {
          await recordPaymentSuccess({
            razorpayResponse: response,
            orderDocId,
            amount,
            paymentType,
            orderId,
            userDetails,
            demoMode: false,
          });
          onSuccess?.(response);
        } catch (error) {
          reportError(
            createPaymentError(
              error?.message || 'Payment completed but confirmation failed.',
              {
                code: 'post_payment_sync_failed',
                preserveOrder: true,
              }
            )
          );
        }
      },
      prefill: {
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.phone,
      },
      notes: {
        order_id: orderDocId,
        payment_type: paymentType,
        customer_email: userDetails.email,
      },
      theme: {
        color: '#67F81D',
      },
      modal: {
        ondismiss: () => {
          reportError(
            createPaymentError('Payment cancelled by user.', {
              code: 'payment_cancelled',
            })
          );
        },
      },
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
    return razorpayOrder;
  } catch (error) {
    reportError(error);
    return null;
  }
};

export const verifyPayment = async (paymentId, orderId, signature) => {
  if (!RAZORPAY_VERIFY_URL) {
    return true;
  }

  const response = await fetchJson(RAZORPAY_VERIFY_URL, {
    paymentId,
    orderId,
    signature,
  });

  return Boolean(response?.verified);
};

export const getOrderPaymentStatus = async (orderDocId) => {
  const orderSnapshot = await getDoc(doc(db, 'orders', orderDocId));
  if (!orderSnapshot.exists()) return null;

  const orderData = orderSnapshot.data();
  return {
    status: orderData.paymentStatus || 'Pending',
    advancePaid: orderData.advancePaid || 0,
    totalPaid: orderData.totalPaid || 0,
    totalPrice: orderData.totalPrice || 0,
    remainingPayment: orderData.remainingPayment || 0,
  };
};

export default {
  loadRazorpayScript,
  createRazorpayOrder,
  initializeRazorpayCheckout,
  verifyPayment,
  getOrderPaymentStatus,
};
