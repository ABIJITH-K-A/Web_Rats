import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
  Bell,
  Briefcase,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquareText,
  Package,
  Phone,
  ShieldCheck,
  Star,
  User,
  Wallet,
  X,
  Paperclip,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ChatWidget from "../../components/chat/ChatWidget";
import OrderDetailsModal from "../../components/dashboard/OrderDetailsModal";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Button, Card } from "../../components/ui/Primitives";
import { db } from "../../config/firebase";
import { apiRequest } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../context/DashboardContext";
import { CONTACT_INFO } from "../../data/siteData";
import { notifySupportRequest } from "../../services/notificationService";
import { STAFF_ROLES } from "../../utils/systemRules";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getCustomerTypeLabel,
  getOrderAmount,
  getOrderDisplayId,
  getOrderPaymentSummary,
  getOrderPlanLabel,
  getOrderPriorityBadgeClass,
  getOrderPriorityLabel,
  getOrderProgress,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  getOrderTimeline,
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
  getPrimaryAssetLink,
  getRequirementFields,
  isCompletedOrder,
  isOpenOrder,
  normalizePaymentStatus,
} from "../../utils/orderHelpers";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "support", label: "Support", icon: LifeBuoy },
];

const Profile = () => {
  const { user, userProfile, logout, fetchError, refreshProfile } = useAuth();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
  } = useDashboard();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [orderTab, setOrderTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: "", message: "" });
  const [supportState, setSupportState] = useState({
    sending: false,
    feedback: "",
    error: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    customerType: "new",
  });
  const [profileState, setProfileState] = useState({
    saving: false,
    feedback: "",
    error: "",
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    whatsapp: true,
    inApp: true,
  });
  const [notifState, setNotifState] = useState({ saving: false, error: "", feedback: "" });

  const [reviewState, setReviewState] = useState({
    open: false,
    order: null,
    rating: 0,
    comment: "",
    submitting: false,
    error: "",
  });

  const [qrPaymentModal, setQrPaymentModal] = useState({
    open: false,
    order: null,
    dueNow: 0,
    utr: "",
    submitting: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/join?login=1&return=/profile");
      return;
    }

    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const paymentResult = await getDocs(
          query(
            collection(db, "payments"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc")
          )
        ).catch(() => null);

        const nextPayments =
          paymentResult?.docs.map((paymentDoc) => ({
            id: paymentDoc.id,
            ...paymentDoc.data(),
          })) || [];

        // Fetch Notification Preferences
        try {
          const data = await apiRequest("/notification-settings", { authMode: "required" });
          if (data?.preferences) setNotificationPrefs(data.preferences);
        } catch (err) {
          console.error("Failed to fetch notification preferences", err);
        }

        if (isMounted) {
          setPayments(nextPayments);
        }
      } catch (error) {
        console.error("Profile dashboard error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Real-time Orders Listener
    const orderQueries = [
      query(collection(db, "orders"), where("userId", "==", user.uid)),
      query(collection(db, "orders"), where("customerId", "==", user.uid)),
    ];

    const unsubscribes = orderQueries.map((q) => 
      onSnapshot(q, (snapshot) => {
        setOrders(prev => {
          const merged = new Map(prev.map(o => [o.id, o]));
          snapshot.docs.forEach(doc => merged.set(doc.id, { id: doc.id, ...doc.data() }));
          return Array.from(merged.values()).sort((a,b) => 
            (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)
          );
        });
      })
    );

    fetchDashboardData();

    return () => {
      isMounted = false;
      unsubscribes.forEach(unsub => unsub());
    };
  }, [navigate, user]);

  useEffect(() => {
    if (!userProfile) return;

    setProfileForm({
      name: userProfile.name || user?.displayName || "",
      phone: userProfile.phone || "",
      customerType: userProfile.customerType || "new",
    });
  }, [user, userProfile]);

  useEffect(() => {
    if (!orders.length || userProfile?.customerType) return;

    setProfileForm((current) => ({
      ...current,
      customerType: orders.length > 0 ? "returning" : current.customerType,
    }));
  }, [orders, userProfile]);

  const isClient = !userProfile?.role || userProfile.role === "client";
  const isStaff = STAFF_ROLES.includes(userProfile?.role?.toLowerCase?.());
  const activeOrders = orders.filter(isOpenOrder);
  const completedOrders = orders.filter(isCompletedOrder);
  const recentOrders = orders.slice(0, 3);
  const pendingPaymentOrders = orders
    .map((order) => ({
      order,
      summary: getOrderPaymentSummary(order),
    }))
    .filter(({ summary }) => summary.pending > 0);

  const totalPaid = orders.reduce((sum, order) => {
    const summary = getOrderPaymentSummary(order);
    return sum + summary.paid;
  }, 0);
  const totalPending = pendingPaymentOrders.reduce(
    (sum, item) => sum + item.summary.pending,
    0
  );
  const effectiveCustomerType =
    profileForm.customerType ||
    userProfile?.customerType ||
    (orders.length > 0 ? "returning" : "new");
  const displayName =
    profileForm.name || userProfile?.name || user?.displayName || "Client";

  const paymentHistory =
    payments.length > 0
      ? payments.map((payment) => ({
          id: payment.id,
          orderId: payment.orderId || "Manual",
          amount: Number(payment.amount || 0),
          status: payment.status || "paid",
          timestamp: payment.timestamp || payment.createdAt || null,
          detail: payment.note || "Recorded payment",
        }))
      : orders.map((order) => {
          const summary = getOrderPaymentSummary(order);
          const paymentStatus = normalizePaymentStatus(order.paymentStatus);

          return {
            id: `order-${order.id}`,
            orderId: getOrderDisplayId(order),
            amount:
              paymentStatus === "paid"
                ? summary.total
                : paymentStatus === "partial"
                ? order.advancePayment || summary.paid
                : summary.pending,
            status: order.paymentStatus || "Pending",
            timestamp: order.createdAt || null,
            detail:
              paymentStatus === "paid"
                ? "Full payment recorded"
                : paymentStatus === "partial"
                ? "Advance payment recorded"
                : "Awaiting payment",
          };
        });

  const handleLogout = async () => {
    await logout();
    navigate("/join?login=1");
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
    setProfileState({ saving: false, feedback: "", error: "" });
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;

    setProfileState({ saving: true, feedback: "", error: "" });

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          customerType: profileForm.customerType,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setProfileState({
        saving: false,
        feedback: "Profile updated successfully.",
        error: "",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileState({
        saving: false,
        feedback: "",
        error: "Could not save your profile right now.",
      });
    }
  };

  const handleNotifToggle = async (key) => {
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs);
    setNotifState({ saving: true, error: "", feedback: "" });
    try {
      await apiRequest("/notification-settings", {
        method: "PATCH",
        authMode: "required",
        body: newPrefs,
      });

      setNotifState({ saving: false, error: "", feedback: "Preferences saved." });
      setTimeout(() => setNotifState((s) => ({ ...s, feedback: "" })), 3000);
    } catch (err) {
      setNotifState({
        saving: false,
        error: "Failed to save preferences.",
        feedback: "",
      });
      // revert on failure
      setNotificationPrefs(notificationPrefs);
    }
  };

  const handleSupportChange = (event) => {
    const { name, value } = event.target;

    setSupportForm((current) => ({
      ...current,
      [name]: value,
    }));
    setSupportState({ sending: false, feedback: "", error: "" });
  };

  const handleSupportSubmit = async (event) => {
    event.preventDefault();

    if (!supportForm.subject.trim() || !supportForm.message.trim()) return;

    setSupportState({ sending: true, feedback: "", error: "" });

    try {
      const supportRef = await addDoc(collection(db, "supportMessages"), {
        userId: user?.uid || 'anonymous',
        name: displayName,
        email: user?.email || "anonymous@tnwebrats.com",
        subject: supportForm.subject.trim(),
        message: supportForm.message.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });

      await notifySupportRequest({
        supportId: supportRef.id,
        senderId: user?.uid || 'anonymous',
        senderName: displayName,
        subject: supportForm.subject.trim(),
      });

      setSupportForm({ subject: "", message: "" });
      setSupportState({
        sending: false,
        feedback: "Support request sent. We will get back to you soon.",
        error: "",
      });
    } catch (error) {
      console.error("Support request error:", error);
      setSupportState({
        sending: false,
        feedback: "",
        error: "We could not send your support request right now.",
      });
    }
  };

  const handleReorder = (order) => {
    navigate("/book", {
      state: {
        reorderOrder: order,
      },
    });
  };

  const openContactThread = (order) => {
    window.dispatchEvent(
      new CustomEvent("open-chat", {
        detail: { activeOrder: { id: order.id, serviceTitle: order.service } }
      })
    );
  };

  const openPaymentThread = (order, dueNow) => {
    setQrPaymentModal({
      open: true,
      order,
      dueNow,
      utr: "",
      submitting: false,
    });
  };

  const handleQRPaySubmit = async () => {
    if (!qrPaymentModal.utr.trim()) return;

    setQrPaymentModal(prev => ({ ...prev, submitting: true }));
    try {
      if (!qrPaymentModal.order?.id) return;
      await updateDoc(doc(db, "orders", qrPaymentModal.order.id), {
        utrNumber: qrPaymentModal.utr.trim(),
        paymentStatus: "Pending Verification",
        statusKey: "pending_payment_verification",
      });

      alert("Payment submitted for verification. Thank you!");
      setQrPaymentModal({ open: false, order: null, dueNow: 0, utr: "", submitting: false });
      
      // Refresh orders
      setOrders(prev => prev.map(o => o.id === qrPaymentModal.order.id ? { ...o, paymentStatus: "Pending Verification" } : o));
    } catch (error) {
      console.error(error);
      alert("Failed to submit payment proof.");
      setQrPaymentModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const openReviewModal = (order) => {
    setReviewState({
      open: true,
      order,
      rating: 0,
      comment: "",
      submitting: false,
      error: "",
    });
  };

  const closeReviewModal = () => {
    setReviewState({
      open: false,
      order: null,
      rating: 0,
      comment: "",
      submitting: false,
      error: "",
    });
  };

  const handleReviewSubmit = async () => {
    if (!reviewState.order || reviewState.rating === 0) {
      setReviewState((current) => ({
        ...current,
        error: "Choose a star rating before submitting.",
      }));
      return;
    }

    setReviewState((current) => ({
      ...current,
      submitting: true,
      error: "",
    }));

    try {
      await updateDoc(doc(db, "orders", reviewState.order.id), {
        review: {
          rating: reviewState.rating,
          comment: reviewState.comment.trim(),
          createdAt: serverTimestamp(),
        },
        reviewDone: true,
      });

      await addDoc(collection(db, "reviews"), {
        orderId: reviewState.order.id,
        rating: reviewState.rating,
        comment: reviewState.comment.trim(),
        customerId: user?.uid || 'anonymous',
        customerName: displayName,
        service: reviewState.order.service || "Project",
        workerAssigned: reviewState.order.workerAssigned || null,
        createdAt: serverTimestamp(),
      });

      setOrders((current) =>
        current.map((order) =>
          order.id === reviewState.order.id
            ? {
                ...order,
                reviewDone: true,
                review: {
                  rating: reviewState.rating,
                  comment: reviewState.comment.trim(),
                },
              }
            : order
        )
      );

      closeReviewModal();
    } catch (error) {
      console.error("Review submit error:", error);
      setReviewState((current) => ({
        ...current,
        submitting: false,
        error: "We could not submit your review right now.",
      }));
    }
  };

  if (!user) return null;



  return (
    <div className="min-h-screen bg-[#121417] text-light-gray font-sans flex overflow-hidden relative">
      {/* Sidebar Overlay (mobile) */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f1217] border-r border-white/6 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
          <div className="border-b border-white/6 px-6 py-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-primary/72">
              Client Dashboard
            </div>
            <h1 className="mt-3 text-2xl font-black text-white">
              TNWebRats
            </h1>
            <p className="mt-2 text-sm leading-7 text-light-gray/50">
              Track orders, payments, profile details, and support in one
              place.
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border border-cyan-primary/20 bg-cyan-primary/10 text-cyan-primary"
                      : "border border-transparent text-light-gray/52 hover:border-white/8 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {isStaff && (
            <div className="border-t border-white/6 px-4 py-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex w-full items-center gap-3 rounded-2xl border border-cyan-primary/20 bg-cyan-primary/8 px-4 py-3 text-left transition-colors hover:bg-cyan-primary/14"
              >
                <Briefcase size={18} className="text-cyan-primary" />
                <div>
                  <div className="text-sm font-semibold text-cyan-primary">Switch to Work Mode</div>
                  <div className="text-[10px] text-light-gray/40">Open {userProfile?.role} dashboard</div>
                </div>
                <ArrowRightLeft size={14} className="ml-auto text-cyan-primary/50" />
              </button>
            </div>
          )}

          <div className="border-t border-white/6 px-6 py-6">
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                Customer Type
              </div>
              <div className="mt-3 text-xl font-black text-white">
                {getCustomerTypeLabel({ customerType: effectiveCustomerType })}
              </div>
              <div className="mt-2 text-sm leading-7 text-light-gray/56">
                {effectiveCustomerType === "returning"
                  ? "Your dashboard is showing the returning-customer payment split."
                  : "Your next booking will default to the new-customer upfront split."}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/6 bg-[#0f1217]/92 px-5 py-4 backdrop-blur md:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-primary/72">
                  Welcome Back
                </div>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {displayName}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen((current) => !current)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/5 text-light-gray/72 transition-colors hover:border-cyan-primary/18 hover:text-cyan-primary"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-primary" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        className="absolute right-0 mt-3 w-[22rem] overflow-hidden rounded-[24px] border border-white/8 bg-[#11141a] shadow-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            Notifications
                          </div>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={markAllAsRead}
                              className="text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-primary"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-light-gray/42">
                              No notifications yet.
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <button
                                key={notification.id}
                                type="button"
                                onClick={() => markAsRead(notification.id)}
                                className={`w-full border-b border-white/6 px-5 py-4 text-left transition-colors hover:bg-white/5 ${
                                  notification.read ? "" : "bg-cyan-primary/6"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-cyan-primary">
                                    <Bell size={14} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-white">
                                      {notification.title}
                                    </div>
                                    <div className="mt-1 text-sm leading-6 text-light-gray/54">
                                      {notification.message}
                                    </div>
                                    <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.14em] text-light-gray/38">
                                      {formatDateTime(notification.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button variant="outline" onClick={() => navigate("/")}>
                  Leave Profile
                </Button>

                <Button variant="outline" onClick={() => navigate("/book")}>
                  New Order
                </Button>

                <Button
                  variant="outline"
                  className="border-red-500/40 text-red-300 hover:border-red-400 hover:text-red-200"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Logout
                </Button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-cyan-primary/20 bg-cyan-primary/10 text-cyan-primary"
                        : "border-white/8 bg-white/5 text-light-gray/54"
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </header>

          <main className="px-5 py-6 md:px-6 lg:px-8 lg:py-8">
            {fetchError ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-500">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Connection Issue</h3>
                  <p className="mt-2 max-w-sm text-sm text-light-gray/60 px-4">
                    {fetchError.includes("INTERNAL ASSERTION") 
                      ? "A core engine synchronization error occurred. Please refresh the page to restore the connection." 
                      : "We had trouble syncing your latest profile data from the server."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                  <Button onClick={() => refreshProfile()}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-primary border-t-transparent" />
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-light-gray/42">
                    Loading your dashboard
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {activeSection === "dashboard" && (
                    <div className="space-y-8">
                      <div className="grid gap-4 md:grid-cols-3">
                        <StatsCard
                          label="Active Orders"
                          value={activeOrders.length}
                          accent="text-yellow-400"
                          icon={Package}
                        />
                        <StatsCard
                          label="Completed Orders"
                          value={completedOrders.length}
                          accent="text-cyan-primary"
                          icon={CheckCircle2}
                        />
                        <StatsCard
                          label="Pending Payments"
                          value={formatCurrency(totalPending)}
                          accent="text-amber-300"
                          icon={Wallet}
                        />
                      </div>

                      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                        <Card className="border-white/8 bg-[#10141a]">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                                Recent Orders
                              </div>
                              <h3 className="mt-3 text-2xl font-black text-white">
                                Last 3 bookings
                              </h3>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => setActiveSection("orders")}
                            >
                              View All
                            </Button>
                          </div>

                          <div className="mt-8 space-y-4">
                            {recentOrders.length === 0 ? (
                              <EmptyState
                                title="No orders yet"
                                description="Create your first order to start tracking it from here."
                              />
                            ) : (
                              recentOrders.map((order) => (
                                <button
                                  key={order.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setActiveSection("orders");
                                  }}
                                  className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-black/35 px-5 py-4 text-left transition-colors hover:border-cyan-primary/16 hover:bg-cyan-primary/6"
                                >
                                  <div>
                                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                                      {getOrderDisplayId(order)}
                                    </div>
                                    <div className="mt-2 text-lg font-bold text-white">
                                      {order.service}
                                    </div>
                                    <div className="mt-1 text-sm text-light-gray/50">
                                      {getOrderPlanLabel(order)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <StatusBadge value={order.status} />
                                    <div className="mt-2 text-sm text-light-gray/50">
                                      {getOrderProgress(order.status)}% progress
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </Card>

                        <div className="space-y-6">
                          <Card className="border-cyan-primary/12 bg-[#10141a]">
                            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                              Quick Actions
                            </div>
                            <div className="mt-6 grid gap-4">
                              <button
                                type="button"
                                onClick={() => navigate("/book")}
                                className="rounded-[22px] border border-cyan-primary/18 bg-cyan-primary/10 px-5 py-5 text-left transition-colors hover:bg-cyan-primary/14"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <div className="text-lg font-bold text-white">
                                      Create New Order
                                    </div>
                                    <div className="mt-2 text-sm leading-7 text-light-gray/58">
                                      Open the booking flow and send your next
                                      project brief.
                                    </div>
                                  </div>
                                  <ArrowRight
                                    size={18}
                                    className="shrink-0 text-cyan-primary"
                                  />
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveSection("support")}
                                className="rounded-[22px] border border-white/8 bg-black/35 px-5 py-5 text-left transition-colors hover:border-white/12 hover:bg-white/5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <div className="text-lg font-bold text-white">
                                      Contact Support
                                    </div>
                                    <div className="mt-2 text-sm leading-7 text-light-gray/58">
                                      Message the team if a deadline or payment
                                      needs clarification.
                                    </div>
                                  </div>
                                  <ArrowRight
                                    size={18}
                                    className="shrink-0 text-cyan-primary"
                                  />
                                </div>
                              </button>
                            </div>
                          </Card>

                          <Card className="border-white/8 bg-[#10141a]">
                            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                              Payment Snapshot
                            </div>
                            <div className="mt-6 space-y-4">
                              <SnapshotRow
                                label="Total paid"
                                value={formatCurrency(totalPaid)}
                              />
                              <SnapshotRow
                                label="Pending now"
                                value={formatCurrency(totalPending)}
                              />
                              <SnapshotRow
                                label="Customer type"
                                value={getCustomerTypeLabel({
                                  customerType: effectiveCustomerType,
                                })}
                              />
                            </div>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeSection === "orders" && (
                    <div className="space-y-8">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            My Orders
                          </div>
                          <h3 className="mt-3 text-3xl font-black text-white">
                            Track every project
                          </h3>
                        </div>
                        <div className="flex gap-2 rounded-full border border-white/8 bg-white/5 p-1">
                          {[
                            { id: "active", label: "Active Orders" },
                            { id: "completed", label: "Completed Orders" },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setOrderTab(tab.id)}
                              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                                orderTab === tab.id
                                  ? "bg-cyan-primary text-primary-dark"
                                  : "text-light-gray/52"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-5">
                        {(orderTab === "active" ? activeOrders : completedOrders)
                          .length === 0 ? (
                          <EmptyState
                            title={
                              orderTab === "active"
                                ? "No active orders"
                                : "No completed orders"
                            }
                            description={
                              orderTab === "active"
                                ? "Your ongoing projects will appear here with progress, deadlines, and contact actions."
                                : "Finished orders will appear here once the team marks them completed."
                            }
                          />
                        ) : (
                          (orderTab === "active" ? activeOrders : completedOrders).map(
                            (order) => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                onViewDetails={() => setSelectedOrder(order)}
                                onContact={() => openContactThread(order)}
                                onDownload={() => {
                                  const assetLink = getPrimaryAssetLink(order);
                                  if (assetLink) {
                                    window.open(assetLink, "_blank");
                                  }
                                }}
                                onReorder={() => handleReorder(order)}
                                onReview={() => openReviewModal(order)}
                              />
                            )
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {activeSection === "payments" && (
                    <div className="space-y-8">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                          Payments
                        </div>
                        <h3 className="mt-3 text-3xl font-black text-white">
                          Summary, history, and pending balances
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <StatsCard
                          label="Total Paid"
                          value={formatCurrency(totalPaid)}
                          accent="text-cyan-primary"
                          icon={Wallet}
                        />
                        <StatsCard
                          label="Pending Amount"
                          value={formatCurrency(totalPending)}
                          accent="text-amber-300"
                          icon={CreditCard}
                        />
                        <StatsCard
                          label="Ledger Entries"
                          value={paymentHistory.length}
                          accent="text-sky-400"
                          icon={FileText}
                        />
                      </div>

                      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <Card className="border-white/8 bg-[#10141a]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            Payment History
                          </div>
                          <div className="mt-6 overflow-hidden rounded-[24px] border border-white/8">
                            <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-4 border-b border-white/8 bg-white/5 px-5 py-4 text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                              <div>Order</div>
                              <div>Amount</div>
                              <div>Status</div>
                            </div>
                            {paymentHistory.length === 0 ? (
                              <div className="px-5 py-12 text-center text-sm text-light-gray/42">
                                No payment history yet.
                              </div>
                            ) : (
                              paymentHistory.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-4 border-b border-white/6 px-5 py-4 text-sm last:border-b-0"
                                >
                                  <div>
                                    <div className="font-semibold text-white">
                                      {entry.orderId}
                                    </div>
                                    <div className="mt-1 text-xs text-light-gray/46">
                                      {entry.detail}
                                    </div>
                                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-light-gray/34">
                                      {formatDate(entry.timestamp)}
                                    </div>
                                  </div>
                                  <div className="font-semibold text-cyan-primary">
                                    {formatCurrency(entry.amount)}
                                  </div>
                                  <div>
                                    <PaymentBadge value={entry.status} />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </Card>

                        <Card className="border-white/8 bg-[#10141a]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            Pending Payments
                          </div>
                          <div className="mt-6 space-y-4">
                            {pendingPaymentOrders.length === 0 ? (
                              <EmptyState
                                title="No pending payments"
                                description="Any advance or final balance due will appear here with a quick contact action."
                              />
                            ) : (
                              pendingPaymentOrders.map(({ order, summary }) => (
                                <div
                                  key={order.id}
                                  className="rounded-[22px] border border-white/8 bg-black/35 p-5"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                                        {getOrderDisplayId(order)}
                                      </div>
                                      <div className="mt-2 text-lg font-bold text-white">
                                        {order.service}
                                      </div>
                                      <div className="mt-1 text-sm text-light-gray/52">
                                        {normalizePaymentStatus(order.paymentStatus) ===
                                        "partial"
                                          ? "Final balance due"
                                          : "Advance payment due"}
                                      </div>
                                    </div>
                                    <PaymentBadge value={order.paymentStatus} />
                                  </div>
                                  <div className="mt-5 flex items-end justify-between gap-4">
                                    <div>
                                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/38">
                                        Amount due now
                                      </div>
                                      <div className="mt-2 text-2xl font-black text-cyan-primary">
                                        {formatCurrency(summary.dueNow)}
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() =>
                                        openPaymentThread(order, summary.dueNow)
                                      }
                                    >
                                      Pay Now
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}

                  {activeSection === "profile" && (
                    <div className="grid gap-6 xl:grid-cols-[1fr_0.86fr]">
                      <Card className="border-white/8 bg-[#10141a]">
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                          Profile
                        </div>
                        <h3 className="mt-3 text-3xl font-black text-white">
                          Update your contact details
                        </h3>
                        <div className="mt-8 grid gap-5">
                          <Field
                            label="Name"
                            icon={User}
                            name="name"
                            value={profileForm.name}
                            onChange={handleProfileChange}
                            placeholder="Your full name"
                          />
                          <Field
                            label="Email"
                            icon={Mail}
                            value={user.email || ""}
                            disabled={true}
                          />
                          <Field
                            label="Phone"
                            icon={Phone}
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            placeholder="+91 98765 43210"
                          />

                          <label className="space-y-2">
                            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                              Customer Type
                            </span>
                            <select
                              name="customerType"
                              value={profileForm.customerType}
                              onChange={handleProfileChange}
                              className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-primary"
                            >
                              <option value="new">New</option>
                              <option value="returning">Returning</option>
                            </select>
                          </label>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={profileState.saving}
                          >
                            {profileState.saving ? "Saving..." : "Save Changes"}
                          </Button>
                          <Link to="/forgot-password">
                            <Button variant="outline">
                              Change Password
                            </Button>
                          </Link>
                        </div>

                        {profileState.feedback && (
                          <div className="mt-4 rounded-2xl border border-cyan-primary/18 bg-cyan-primary/8 px-4 py-3 text-sm text-cyan-primary">
                            {profileState.feedback}
                          </div>
                        )}
                        {profileState.error && (
                          <div className="mt-4 rounded-2xl border border-red-500/18 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                            {profileState.error}
                          </div>
                        )}
                      </Card>

                      <div className="space-y-6">
                        <Card className="border-white/8 bg-[#10141a]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            Account Snapshot
                          </div>
                          <div className="mt-6 space-y-4">
                            <SnapshotRow
                              label="Orders placed"
                              value={orders.length}
                            />
                            <SnapshotRow
                              label="Customer type"
                              value={getCustomerTypeLabel({
                                customerType: effectiveCustomerType,
                              })}
                            />
                            <SnapshotRow
                              label="Member since"
                              value={formatDate(userProfile?.createdAt)}
                            />
                          </div>
                        </Card>

                        <Card className="border-white/8 bg-[#10141a]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            Security
                          </div>
                          <div className="mt-5 space-y-4 text-sm leading-7 text-light-gray/60">
                            <div>
                              Your account email is{" "}
                              <span className="font-semibold text-white">
                                {user.email}
                              </span>
                              .
                            </div>
                            <div>
                              Use password reset if you want to change your
                              credentials without leaving the dashboard.
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}

                  {activeSection === "notifications" && (
                    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            Activity Center
                          </div>
                          <h3 className="mt-3 text-3xl font-black text-white">
                            Notifications
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setShowNotifSettings(!showNotifSettings)}
                            className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                              showNotifSettings 
                                ? "border-cyan-primary bg-cyan-primary/10 text-cyan-primary" 
                                : "border-white/10 bg-white/5 text-light-gray/60 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            <ShieldCheck size={14} />
                            Settings
                          </button>
                          {notifications.length > 0 && !showNotifSettings && (
                            <button
                              onClick={markAllAsRead}
                              disabled={unreadCount === 0}
                              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-light-gray/60 transition-all hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 size={14} />
                              Mark All Read
                            </button>
                          )}
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {showNotifSettings ? (
                          <motion.div
                            key="settings-drawer"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="border-white/8 bg-[#10141a]/80 backdrop-blur-md p-1">
                              <div className="p-6 border-b border-white/5">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-white/80">Communication Preferences</h4>
                                <p className="mt-2 text-xs text-light-gray/40">Choose how we reach you for important updates on your projects.</p>
                              </div>
                              <div className="space-y-1 p-2">
                                {/* Email Toggle */}
                                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl transition-colors hover:bg-white/5">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-cyan-primary">
                                      <Mail size={20} />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-white">Email Notifications</div>
                                      <div className="text-sm text-light-gray/50">Receive project digests and payment receipts</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleNotifToggle("email")}
                                    className={`relative h-6 w-11 rounded-full transition-colors ${
                                      notificationPrefs.email ? "bg-cyan-primary shadow-[0_0_15px_rgba(103,248,19,0.3)]" : "bg-white/10"
                                    }`}
                                  >
                                    <div
                                      className={`absolute inset-y-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                                        notificationPrefs.email ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* WhatsApp Toggle */}
                                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl transition-colors hover:bg-white/5">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-emerald-400">
                                      <MessageSquareText size={20} />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-white">WhatsApp Updates</div>
                                      <div className="text-sm text-light-gray/50">Instant alerts for chat and status changes</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleNotifToggle("whatsapp")}
                                    className={`relative h-6 w-11 rounded-full transition-colors ${
                                      notificationPrefs.whatsapp ? "bg-cyan-primary shadow-[0_0_15px_rgba(103,248,19,0.3)]" : "bg-white/10"
                                    }`}
                                  >
                                    <div
                                      className={`absolute inset-y-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                                        notificationPrefs.whatsapp ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* In-App Toggle */}
                                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl transition-colors hover:bg-white/5">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-cyan-primary">
                                      <Bell size={20} />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-white">In-Portal Badge</div>
                                      <div className="text-sm text-light-gray/50">Real-time alerts while you are browsing</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleNotifToggle("inApp")}
                                    className={`relative h-6 w-11 rounded-full transition-colors ${
                                      notificationPrefs.inApp ? "bg-cyan-primary shadow-[0_0_15px_rgba(103,248,19,0.3)]" : "bg-white/10"
                                    }`}
                                  >
                                    <div
                                      className={`absolute inset-y-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                                        notificationPrefs.inApp ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              <AnimatePresence>
                                {(notifState.feedback || notifState.error) && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`mx-6 mb-6 rounded-2xl border p-4 text-xs font-bold uppercase tracking-widest text-center ${
                                      notifState.error ? "border-red-500/18 bg-red-500/8 text-red-300" : "border-cyan-primary/18 bg-cyan-primary/8 text-cyan-primary"
                                    }`}>
                                    {notifState.feedback || notifState.error}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Card>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="notification-list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            {notifications.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-20 text-center rounded-[3rem] border border-dashed border-white/10 bg-black/20">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-white/10 mb-6 group hover:text-cyan-primary/20 transition-colors">
                                  <Bell size={40} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <h4 className="text-xl font-black text-white/50">All Caught Up</h4>
                                <p className="mt-2 max-w-sm text-xs text-light-gray/30 uppercase tracking-[0.2em] font-mono">
                                  You don't have any notifications right now.
                                </p>
                              </div>
                            ) : (
                              <div className="grid gap-3">
                                {notifications.map((notif) => (
                                  <button
                                    key={notif.id}
                                    onClick={() => markAsRead(notif.id)}
                                    className={`group flex items-start gap-6 rounded-[2.5rem] border p-8 text-left transition-all ${
                                      notif.read 
                                        ? "border-white/5 bg-[#10141a]/40 opacity-50 hover:opacity-100 hover:bg-[#10141a]" 
                                        : "border-cyan-primary/20 bg-cyan-primary/[0.03] hover:bg-cyan-primary/[0.07] shadow-lg shadow-cyan-primary/[0.02]"
                                    }`}
                                  >
                                    <div className={`mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border transition-all duration-300 ${
                                      notif.read 
                                        ? "border-white/8 bg-white/5 text-white/20 group-hover:text-cyan-primary/50" 
                                        : "border-cyan-primary/30 bg-cyan-primary/10 text-cyan-primary shadow-[0_0_20px_rgba(103,248,19,0.1)] group-hover:scale-105"
                                    }`}>
                                      <Bell size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-4">
                                        <h4 className={`text-lg font-black transition-colors ${notif.read ? "text-white/60" : "text-white"}`}>
                                          {notif.title}
                                        </h4>
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-light-gray/20">
                                          {formatDateTime(notif.createdAt)}
                                        </span>
                                      </div>
                                      <p className={`mt-3 text-[13px] leading-relaxed ${notif.read ? "text-light-gray/30" : "text-light-gray/60"}`}>
                                        {notif.message}
                                      </p>
                                    </div>
                                    {!notif.read && (
                                      <div className="mt-2 h-2.5 w-2.5 rounded-full bg-cyan-primary shadow-[0_0_15px_rgba(103,248,19,0.8)] animate-pulse" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}


                  {activeSection === "support" && (
                    <div className="grid gap-6 xl:grid-cols-[1fr_0.86fr]">
                      <Card className="border-white/8 bg-[#10141a]">
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                          Support
                        </div>
                        <h3 className="mt-3 text-3xl font-black text-white">
                          Send a message to the team
                        </h3>

                        <form onSubmit={handleSupportSubmit} className="mt-8 space-y-5">
                          <label className="space-y-2">
                            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                              Subject
                            </span>
                            <input
                              type="text"
                              name="subject"
                              value={supportForm.subject}
                              onChange={handleSupportChange}
                              placeholder="Payment question, deadline update, files issue..."
                              className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-primary"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                              Message
                            </span>
                            <textarea
                              name="message"
                              value={supportForm.message}
                              onChange={handleSupportChange}
                              placeholder="Tell us what you need and include the order ID if this is about an existing project."
                              className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition-colors focus:border-cyan-primary"
                            />
                          </label>

                          <Button
                            type="submit"
                            disabled={supportState.sending}
                            className="w-full"
                          >
                            {supportState.sending ? "Sending..." : "Send Message"}
                          </Button>
                        </form>

                        {supportState.feedback && (
                          <div className="mt-4 rounded-2xl border border-cyan-primary/18 bg-cyan-primary/8 px-4 py-3 text-sm text-cyan-primary">
                            {supportState.feedback}
                          </div>
                        )}
                        {supportState.error && (
                          <div className="mt-4 rounded-2xl border border-red-500/18 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                            {supportState.error}
                          </div>
                        )}
                      </Card>

                      <div className="space-y-6">
                        <Card className="border-white/8 bg-[#10141a]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            Direct Contact
                          </div>
                          <div className="mt-6 space-y-4">
                            <ContactCard
                              icon={MessageSquareText}
                              title="WhatsApp"
                              value={CONTACT_INFO.whatsappDisplay}
                              actionLabel="Open Chat"
                              href={`https://wa.me/${CONTACT_INFO.whatsappNumber}`}
                            />
                            <ContactCard
                              icon={Mail}
                              title="Email"
                              value={CONTACT_INFO.email}
                              actionLabel="Send Email"
                              href={`mailto:${CONTACT_INFO.email}`}
                            />
                          </div>
                        </Card>

                        <Card className="border-white/8 bg-[#10141a]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                            Helpful Tip
                          </div>
                          <div className="mt-4 text-sm leading-7 text-light-gray/60">
                            Include the order ID, service name, and any revised
                            deadline in your message. That helps us jump
                            straight into the right project thread.
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onContact={() => openContactThread(selectedOrder)}
            onDownload={() => {
              const assetLink = getPrimaryAssetLink(selectedOrder);
              if (assetLink) {
                window.open(assetLink, "_blank");
              }
            }}
            onReorder={() => {
              handleReorder(selectedOrder);
              setSelectedOrder(null);
            }}
            onReview={() => {
              openReviewModal(selectedOrder);
              setSelectedOrder(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reviewState.open && (
          <ReviewModal
            state={reviewState}
            setState={setReviewState}
            onClose={closeReviewModal}
            onSubmit={handleReviewSubmit}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {qrPaymentModal.open && (
          <QRPaymentModal 
            state={qrPaymentModal}
            setState={setQrPaymentModal}
            onSubmit={handleQRPaySubmit}
          />
        )}
      </AnimatePresence>
      <ChatWidget />
    </div>
  );
};

const StatsCard = ({ label, value, icon: Icon, accent }) => (
  <Card className="border-white/8 bg-[#10141a] p-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
          {label}
        </div>
        <div className="mt-4 text-3xl font-black text-white">{value}</div>
      </div>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 ${accent}`}
      >
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

const SnapshotRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/30 px-4 py-3">
    <div className="text-sm text-light-gray/54">{label}</div>
    <div className="text-sm font-semibold text-white">{value}</div>
  </div>
);

const EmptyState = ({ title, description }) => (
  <Card
    hoverEffect={false}
    className="border-dashed border-white/10 bg-[#10141a] px-6 py-10 text-center"
  >
    <div className="text-xl font-black text-white">{title}</div>
    <div className="mx-auto mt-3 max-w-xl text-sm leading-7 text-light-gray/50">
      {description}
    </div>
  </Card>
);

const StatusBadge = ({ value }) => (
  <span
    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] ${getOrderStatusBadgeClass(
      value
    )}`}
  >
    {getOrderStatusLabel(value)}
  </span>
);

const PaymentBadge = ({ value }) => (
  <span
    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] ${getPaymentStatusBadgeClass(
      value
    )}`}
  >
    {getPaymentStatusLabel(value)}
  </span>
);

const OrderCard = ({
  order,
  onViewDetails,
  onContact,
  onDownload,
  onReorder,
  onReview,
}) => {
  const assetLink = getPrimaryAssetLink(order);
  const progress = getOrderProgress(order.status);
  const isCompleted = isCompletedOrder(order);
  const reviewDone = order.reviewDone || order.review?.rating;

  return (
    <Card className="border-white/8 bg-[#10141a] p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
              {getOrderDisplayId(order)}
            </span>
            <StatusBadge value={order.status} />
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] ${getOrderPriorityBadgeClass(
                order
              )}`}
            >
              {getOrderPriorityLabel(order)}
            </span>
          </div>

          <h4 className="mt-4 text-2xl font-black text-white">{order.service}</h4>
          <div className="mt-2 text-sm text-light-gray/54">
            {getOrderPlanLabel(order)} · Deadline {order.deadline || "Flexible"}
          </div>

          <div className="mt-5 flex flex-wrap gap-5 text-sm text-light-gray/54">
            <div>
              <span className="text-light-gray/36">Customer Type:</span>{" "}
              <span className="font-semibold text-white">
                {getCustomerTypeLabel(order)}
              </span>
            </div>
            <div>
              <span className="text-light-gray/36">Amount:</span>{" "}
              <span className="font-semibold text-cyan-primary">
                {formatCurrency(getOrderAmount(order))}
              </span>
            </div>
            <div>
              <span className="text-light-gray/36">Payment:</span>{" "}
              <span className="font-semibold text-white">
                {getPaymentStatusLabel(order.paymentStatus)}
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-[220px] space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-light-gray/40">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-cyan-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" onClick={onViewDetails}>
          View Details
        </Button>
        <Button variant="outline" onClick={onContact}>
          Contact Worker
        </Button>

        {isCompleted ? (
          <>
            <Button
              variant="outline"
              onClick={onDownload}
              disabled={!assetLink}
              className={!assetLink ? "opacity-50" : ""}
            >
              <Download size={16} /> Download Files
            </Button>
            <Button
              variant="outline"
              onClick={onReview}
              disabled={Boolean(reviewDone)}
              className={reviewDone ? "opacity-50" : ""}
            >
              <Star size={16} /> {reviewDone ? "Reviewed" : "Leave Review"}
            </Button>
            <Button onClick={onReorder}>Reorder</Button>
          </>
        ) : null}
      </div>
    </Card>
  );
};

// Shared OrderDetailsModal is imported from components/dashboard/OrderDetailsModal

const ReviewModal = ({ state, setState, onClose, onSubmit }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-130 flex items-center justify-center bg-black/70 p-5 backdrop-blur"
  >
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#10141a] p-6 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
            Leave Review
          </div>
          <h3 className="mt-2 text-2xl font-black text-white">
            {state.order?.service}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-light-gray/62 transition-colors hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() =>
              setState((current) => ({
                ...current,
                rating,
                error: "",
              }))
            }
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-light-gray/40 transition-colors hover:text-cyan-primary"
          >
            <Star
              size={20}
              className={
                rating <= state.rating
                  ? "fill-cyan-primary text-cyan-primary"
                  : ""
              }
            />
          </button>
        ))}
      </div>

      <label className="mt-6 block space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
          Comment
        </span>
        <textarea
          value={state.comment}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              comment: event.target.value,
              error: "",
            }))
          }
          placeholder="Tell us what worked well or what can be improved."
          className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition-colors focus:border-cyan-primary"
        />
      </label>

      {state.error && (
        <div className="mt-4 rounded-2xl border border-red-500/18 bg-red-500/8 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={state.submitting}>
          {state.submitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </motion.div>
  </motion.div>
);

const Field = ({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
}) => (
  <label className="space-y-2">
    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
      {label}
    </span>
    <div className="relative">
      <Icon
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/35"
      />
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-2xl border px-12 py-3 text-sm outline-none transition-colors ${
          disabled
            ? "cursor-not-allowed border-white/8 bg-white/5 text-light-gray/42"
            : "border-white/10 bg-black/35 text-white focus:border-cyan-primary"
        }`}
      />
    </div>
  </label>
);

const ContactCard = ({ icon: Icon, title, value, actionLabel, href }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-black/35 px-5 py-4 transition-colors hover:border-cyan-primary/16 hover:bg-cyan-primary/6"
  >
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-cyan-primary">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-sm text-light-gray/48">{title}</div>
        <div className="font-semibold text-white">{value}</div>
      </div>
    </div>
    <div className="text-sm font-semibold text-cyan-primary">{actionLabel}</div>
  </a>
);

const DetailBlock = ({ label, value }) => (
  <div>
    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/40">
      {label}
    </div>
    <div className="mt-2 text-sm leading-7 text-light-gray/66">
      {value || "—"}
    </div>
  </div>
);

const QRPaymentModal = ({ state, setState, onSubmit }) => {
  const upiId = CONTACT_INFO.upiId || "tnwebrats@okaxis";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=TNWebRats&am=${state.dueNow}&cu=INR&tn=Order_${state.order?.id?.slice(-8)}`
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-130 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#10141a] p-8 shadow-2xl text-center"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-primary">Secure Payment</div>
            <h3 className="text-xl font-black text-white mt-1">Settle Balance</h3>
          </div>
          <button onClick={() => setState({ ...state, open: false })} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X size={20} /></button>
        </div>

        <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-xl">
          <img src={qrUrl} alt="Payment QR" className="w-48 h-48" />
        </div>

        <div className="flex flex-col gap-3 mb-6 w-full max-w-sm mx-auto">
          <a 
            href={`upi://pay?pa=${upiId}&pn=TNWebRats&am=${state.dueNow}&cu=INR&tn=Order_${state.order?.id?.slice(-8)}`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-light-gray/90 transition-all shadow-lg md:hidden"
          >
            <ExternalLink size={18} /> Pay via UPI App
          </a>
        </div>

        <div className="space-y-4 mb-8">
          <div className="text-2xl font-black text-white">₹{state.dueNow?.toLocaleString()}</div>
          <p className="text-xs text-light-gray/40 leading-relaxed font-mono uppercase tracking-wider">
            Scan with any UPI App (GPay, PhonePe, Paytm)<br/>
            to pay the remaining balance.
          </p>
        </div>

        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Enter Transaction ID (UTR)"
            value={state.utr}
            onChange={(e) => setState({ ...state, utr: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-sm focus:border-cyan-primary outline-none transition-all text-center"
          />
          {state.utr.length > 5 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-primary animate-in zoom-in">
              <CheckCircle2 size={20} />
            </div>
          )}
        </div>

        <Button 
          onClick={onSubmit}
          disabled={!state.utr.trim() || state.submitting}
          className="w-full py-6 text-lg"
        >
          {state.submitting ? "Verifying..." : "Settle via QR Pay"}
        </Button>

        <p className="mt-6 text-[10px] text-light-gray/20 font-mono uppercase tracking-widest">
          Payments are verified by admin within 2-4 hours.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
