import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  BarChart3,
  ChevronRight,
  Package,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useAuth } from "../../../context/AuthContext";
import { fetchOrdersAssignedToUser } from "../../../services/orderService";
import { isCompletedOrder } from "../../../utils/orderHelpers";

const getRank = (completedCount, averageRating) => {
  if (completedCount >= 20 && averageRating >= 4.7) return "Elite";
  if (completedCount >= 12 && averageRating >= 4.4) return "Veteran";
  if (completedCount >= 6) return "Specialist";
  return "Initiate";
};

const EarningsView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    avgRating: 0,
    referralConversions: 0,
    rank: "Initiate",
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [weeklyThroughput, setWeeklyThroughput] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchPerformance = async () => {
      setLoading(true);

      try {
        const [orders, reviewSnapshot, referralSnapshot] = await Promise.all([
          fetchOrdersAssignedToUser(user.uid),
          getDocs(
            query(
              collection(db, "reviews"),
              where("workerAssigned", "==", user.uid),
              orderBy("createdAt", "desc"),
              limit(5)
            )
          ).catch(() => null),
          getDocs(
            query(collection(db, "referralCodes"), where("ownerUid", "==", user.uid))
          ).catch(() => null),
        ]);

        const completedOrders = orders.filter(isCompletedOrder);
        const reviews =
          reviewSnapshot?.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          })) || [];
        const referralConversions =
          referralSnapshot?.docs.reduce(
            (sum, docSnapshot) => sum + Number(docSnapshot.data()?.timesUsed || 0),
            0
          ) || 0;
        const totalRating = reviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0
        );
        const avgRating =
          reviews.length > 0 ? Number((totalRating / reviews.length).toFixed(1)) : 0;

        const throughputMap = {};
        completedOrders.forEach((order) => {
          const dateValue = order.completedAt || order.closedAt || order.updatedAt || order.createdAt;
          const date = typeof dateValue?.toDate === "function" ? dateValue.toDate() : new Date(dateValue);
          if (Number.isNaN(date.getTime())) return;

          const label = date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          });
          throughputMap[label] = (throughputMap[label] || 0) + 1;
        });

        const throughputData = Object.entries(throughputMap)
          .slice(-7)
          .map(([label, value]) => ({ label, value }));

        setRecentReviews(reviews);
        setWeeklyThroughput(throughputData);
        setStats({
          totalOrders: completedOrders.length,
          avgRating,
          referralConversions,
          rank: getRank(completedOrders.length, avgRating),
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [user]);

  const throughputBars =
    weeklyThroughput.length > 0
      ? weeklyThroughput
      : [
          { label: "01 Mar", value: 0 },
          { label: "02 Mar", value: 0 },
          { label: "03 Mar", value: 0 },
          { label: "04 Mar", value: 0 },
          { label: "05 Mar", value: 0 },
          { label: "06 Mar", value: 0 },
          { label: "07 Mar", value: 0 },
        ];
  const maxThroughput = Math.max(...throughputBars.map((item) => item.value), 1);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white italic">
            Performance{" "}
            <span className="ml-2 text-sm font-mono uppercase tracking-[0.2em] text-cyan-primary not-italic">
              // Metrics
            </span>
          </h2>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/20">
            Live tracking of your completed work, feedback score, and referral pull
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Completed Jobs", value: stats.totalOrders, icon: <Package />, color: "text-cyan-primary" },
          { label: "Quality Score", value: stats.avgRating, icon: <Star />, color: "text-yellow-500" },
          { label: "Ref Conversions", value: stats.referralConversions, icon: <Target />, color: "text-purple-500" },
          { label: "System Rank", value: stats.rank, icon: <Award />, color: "text-teal-primary" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[2rem] border border-white/5 bg-[#121417] p-8 text-center shadow-xl transition-colors hover:border-cyan-primary/18"
          >
            <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ${item.color}`}>
              {item.icon}
            </div>
            <div className="mb-2 text-3xl font-black italic text-white">{item.value}</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/20">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[3rem] border border-white/5 bg-[#121417] p-10 shadow-2xl">
          <div className="mb-10 flex items-center justify-between">
            <h3 className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-cyan-primary">
              <BarChart3 size={16} /> Weekly Throughput
            </h3>
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/20">
              Last 7 completed-delivery points
            </div>
          </div>

          <div className="flex h-64 items-end justify-between gap-4">
            {throughputBars.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-4">
                <div className="w-full rounded-t-xl bg-white/5">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-cyan-primary/80 to-cyan-primary/20"
                    style={{ height: `${Math.max((item.value / maxThroughput) * 180, item.value > 0 ? 28 : 12)}px` }}
                  />
                </div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[3rem] border border-white/5 bg-[#121417] p-10 shadow-2xl">
          <h3 className="mb-10 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-cyan-primary">
            <Activity size={16} /> Quality Feed
          </h3>

          <div className="space-y-8">
            {loading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-2xl bg-white/5" />
              ))
            ) : recentReviews.length === 0 ? (
              <div className="py-20 text-center text-[10px] font-mono uppercase tracking-widest text-white/20">
                No review data yet
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="flex gap-4">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-primary shadow-[0_0_10px_rgba(103,248,29,0.5)]" />
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-black italic text-white/55">
                        {Number(review.rating || 0).toFixed(1)}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={8}
                            className={
                              index < Number(review.rating || 0)
                                ? "fill-cyan-primary text-cyan-primary"
                                : "text-white/10"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="max-w-[220px] text-[10px] font-mono italic text-white/30">
                      "{review.comment || "Performance verified"}"
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="mt-10 flex w-full items-center justify-between border-t border-white/5 pt-6 text-[9px] font-mono uppercase tracking-[0.2em] text-white/20 transition-colors hover:text-white/50">
            Full Quality Report <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-6 rounded-[2.5rem] border border-cyan-primary/10 bg-cyan-primary/5 p-8 shadow-xl">
        <Zap size={24} className="mt-0.5 shrink-0 text-cyan-primary" />
        <div>
          <h4 className="mb-2 text-[11px] font-black uppercase tracking-widest text-white/60">
            Reward Algorithm Alpha
          </h4>
          <p className="text-xs font-mono uppercase tracking-[0.1em] leading-relaxed text-white/30">
            Rank now reacts to real completed orders, review quality, and referral pull. As your completed queue and client feedback improve, higher-tier projects can be routed to you faster.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EarningsView;
