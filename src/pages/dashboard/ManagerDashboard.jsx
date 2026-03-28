import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { db } from "../../config/firebase";
import { formatCurrency, isCompletedOrder, isOpenOrder, toDateValue } from "../../utils/orderHelpers";
import InviteKeysView from "./views/InviteKeysView";
import MyOrdersView from "./views/MyOrdersView";
import OrdersView from "./views/OrdersView";
import ReviewsView from "./views/ReviewsView";
import TeamPayView from "./views/TeamPayView";
import WalletView from "./views/WalletView";

const ManagerDashboard = () => (
  <DashboardLayout>
    {({ currentView }) => (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full"
        >
          {currentView === "overview" && <ManagerOverview />}
          {currentView === "orders" && <OrdersView />}
          {currentView === "myorders" && <MyOrdersView />}
          {currentView === "teampay" && <TeamPayView />}
          {currentView === "wallet" && <WalletView />}
          {currentView === "reviews" && <ReviewsView />}
          {currentView === "invitekeys" && <InviteKeysView />}
        </motion.div>
      </AnimatePresence>
    )}
  </DashboardLayout>
);

const ManagerOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    teamMembers: 0,
    teamEarnings: 0,
    ordersThisWeek: 0,
    completedThisMonth: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchOverview = async () => {
      setLoading(true);

      try {
        const [orderSnapshot, userSnapshot, walletSnapshot, requestSnapshot] =
          await Promise.all([
            getDocs(collection(db, "orders")),
            getDocs(collection(db, "users")),
            getDocs(collection(db, "wallets")),
            getDocs(collection(db, "assignmentRequests")),
          ]);

        if (!isMounted) return;

        const orders = orderSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        const users = userSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        const wallets = walletSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        const requests = requestSnapshot.docs.map((docSnapshot) => docSnapshot.data());

        const workers = users.filter((account) => account.role === "worker");
        const workerIds = new Set(workers.map((worker) => worker.id));
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const teamEarnings = wallets.reduce((sum, wallet) => {
          if (!workerIds.has(wallet.id) && !workerIds.has(wallet.userId)) {
            return sum;
          }

          return (
            sum +
            Number(wallet.totalEarnings || wallet.lifetimeEarnings || wallet.totalBalance || 0)
          );
        }, 0);

        const ordersThisWeek = orders.filter((order) => {
          const createdAt = toDateValue(order.createdAt);
          return createdAt && createdAt >= weekStart;
        }).length;

        const completedThisMonth = orders.filter((order) => {
          if (!isCompletedOrder(order)) return false;
          const completedAt = toDateValue(
            order.completedAt || order.closedAt || order.updatedAt || order.createdAt
          );
          return completedAt && completedAt >= monthStart;
        }).length;

        const pendingApprovals = requests.filter(
          (request) => String(request.status || "").toLowerCase() === "pending"
        ).length;

        setStats({
          totalOrders: orders.length,
          activeOrders: orders.filter(isOpenOrder).length,
          teamMembers: workers.length,
          teamEarnings,
          ordersThisWeek,
          completedThisMonth,
          pendingApprovals,
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, icon: Briefcase, color: "text-cyan-primary" },
    { label: "Active Orders", value: stats.activeOrders, icon: Clock, color: "text-yellow-500" },
    { label: "Team Members", value: stats.teamMembers, icon: Users, color: "text-purple-500" },
    { label: "Team Earnings", value: formatCurrency(stats.teamEarnings), icon: DollarSign, color: "text-green-500" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white italic">
            Manager Portal{" "}
            <span className="ml-2 text-sm font-mono uppercase tracking-[0.2em] text-cyan-primary not-italic">
              // Dashboard
            </span>
          </h1>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/20">
            Assignment oversight, team capacity, and approval load in one place
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#121417] p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ${stat.color}`}>
                  <Icon size={22} />
                </div>
                {loading && <div className="text-[9px] font-mono uppercase tracking-widest text-white/20">syncing</div>}
              </div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/28">
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/8 bg-[#121417] p-8 shadow-2xl">
          <h3 className="mb-6 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-cyan-primary">
            <Briefcase size={16} /> Manager Responsibilities
          </h3>
          <div className="space-y-4 text-sm text-white/60">
            <p>Assign orders directly or route bigger staffing decisions into approvals.</p>
            <p>Keep the worker queue balanced so priority jobs do not stall.</p>
            <p>Monitor delivery progress and intervene before deadlines slip.</p>
            <p>Coordinate invite keys for worker onboarding when team load rises.</p>
            <p>Use payment and review signals to spot quality or staffing risk early.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/8 bg-[#121417] p-8 shadow-2xl">
          <h3 className="mb-6 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-cyan-primary">
            <TrendingUp size={16} /> Quick Stats
          </h3>
          <div className="space-y-4">
            <QuickStat label="Orders This Week" value={stats.ordersThisWeek} tone="text-cyan-primary" />
            <QuickStat label="Completed This Month" value={stats.completedThisMonth} tone="text-green-500" />
            <QuickStat label="Pending Approvals" value={stats.pendingApprovals} tone="text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, tone }) => (
  <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/30 p-4">
    <span className="text-sm text-white/60">{label}</span>
    <span className={`text-lg font-bold ${tone}`}>{value}</span>
  </div>
);

export default ManagerDashboard;
