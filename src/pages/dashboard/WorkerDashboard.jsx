import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  Box,
  Briefcase,
  CheckCircle,
  Clock,
  List,
  Wallet,
} from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { getWallet } from "../../services/backendWalletService";
import { fetchOrdersAssignedToUser } from "../../services/orderService";
import { formatCurrency, isCompletedOrder, isOpenOrder } from "../../utils/orderHelpers";
import EarningsView from "./views/EarningsView";
import MyOrdersView from "./views/MyOrdersView";
import OrderPoolView from "./views/OrderPoolView";
import ReviewsView from "./views/ReviewsView";
import WalletView from "./views/WalletView";

const WorkerDashboard = () => (
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
          {currentView === "overview" && <WorkerOverview />}
          {currentView === "orderpool" && <OrderPoolView />}
          {currentView === "myorders" && <MyOrdersView />}
          {currentView === "earnings" && <EarningsView />}
          {currentView === "reviews" && <ReviewsView />}
          {currentView === "wallet" && <WalletView />}
        </motion.div>
      </AnimatePresence>
    )}
  </DashboardLayout>
);

const WorkerOverview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;

    const fetchOverview = async () => {
      setLoading(true);

      try {
        const [assignedOrders, wallet] = await Promise.all([
          fetchOrdersAssignedToUser(user.uid),
          getWallet(user.uid),
        ]);

        if (!isMounted) return;

        setStats({
          activeOrders: assignedOrders.filter(isOpenOrder).length,
          completedOrders: assignedOrders.filter(isCompletedOrder).length,
          totalEarnings: Number(wallet?.lifetimeEarnings || wallet?.totalEarnings || 0),
          pendingAmount: Number(wallet?.pendingAmount || wallet?.pending || 0),
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
  }, [user]);

  const statCards = [
    { label: "Active Orders", value: stats.activeOrders, icon: Briefcase, color: "text-cyan-primary" },
    { label: "Completed", value: stats.completedOrders, icon: CheckCircle, color: "text-green-500" },
    { label: "Total Earnings", value: formatCurrency(stats.totalEarnings), icon: Wallet, color: "text-purple-500" },
    { label: "Pending Amount", value: formatCurrency(stats.pendingAmount), icon: Clock, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white italic">
            Worker Portal{" "}
            <span className="ml-2 text-sm font-mono uppercase tracking-[0.2em] text-cyan-primary not-italic">
              // Dashboard
            </span>
          </h1>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/20">
            Live view of your queue, delivery progress, and earnings pipeline
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
            <Bell size={16} /> Quick Actions
          </h3>
          <div className="space-y-4">
            <ActionCard
              icon={List}
              title="Browse Order Pool"
              description="Claim fresh unassigned work directly from the live pool."
              tone="text-cyan-primary"
              meta={`${stats.activeOrders} active in your queue`}
            />
            <ActionCard
              icon={Box}
              title="My Active Orders"
              description="Move assigned work through progress stages without losing status accuracy."
              tone="text-green-500"
              meta={`${stats.completedOrders} completed so far`}
            />
            <ActionCard
              icon={Wallet}
              title="Earnings & Wallet"
              description="Track pending releases, withdrawable balance, and completed payouts."
              tone="text-purple-500"
              meta={formatCurrency(stats.pendingAmount) + " pending release"}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/8 bg-[#121417] p-8 shadow-2xl">
          <h3 className="mb-6 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-cyan-primary">
            <AlertCircle size={16} /> Worker Guidelines
          </h3>
          <div className="space-y-4 text-sm text-white/60">
            <p>Priority jobs should move first whenever they land in your queue.</p>
            <p>Claimed pool orders are now routed directly into your assigned work timeline.</p>
            <p>Update order status only when the real project stage changes so clients stay synced.</p>
            <p>Pending wallet amounts release after the system hold period before withdrawal.</p>
            <p>Quality score and completed delivery volume both affect future project routing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ icon: Icon, title, description, tone, meta }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-black/30 p-4">
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${tone}`}>
      <Icon size={18} />
    </div>
    <div>
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="text-[10px] text-white/40">{description}</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/25">{meta}</div>
    </div>
  </div>
);

export default WorkerDashboard;
