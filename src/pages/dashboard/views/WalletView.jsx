import { useEffect, useState } from "react";
import { CalendarClock, Coins, Landmark, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getWalletOverview } from "../../../services/backendWalletService";

const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDateLabel = (value) => {
  if (!value) return "Manual schedule";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Manual schedule";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const WalletView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [finance, setFinance] = useState(null);
  const [error, setError] = useState("");

  const loadFinance = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const overview = await getWalletOverview(user.uid);
      setFinance(overview.wallet);
      setError("");
    } catch (loadError) {
      console.error(loadError);
      setError("Could not load finance summary right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance();
  }, [user?.uid]);

  const cards = [
    {
      label: "Total Earned",
      value: formatCurrency(finance?.totalEarned || finance?.totalEarnings || 0),
      icon: Coins,
      tone: "text-cyan-primary",
      bg: "bg-[#0f2024]",
    },
    {
      label: "Next Payout",
      value: formatDateLabel(finance?.nextPayoutDate),
      icon: CalendarClock,
      tone: "text-emerald-300",
      bg: "bg-[#102118]",
    },
    {
      label: "Payout Model",
      value: "Manual Payroll",
      icon: Landmark,
      tone: "text-white",
      bg: "bg-[#171a21]",
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white italic">
            Finance{" "}
            <span className="ml-2 text-sm font-mono uppercase tracking-[0.2em] text-cyan-primary not-italic">
              // Payroll Summary
            </span>
          </h2>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/20">
            Immutable ledger total plus the next manual payout date
          </p>
        </div>
        <button
          type="button"
          onClick={loadFinance}
          className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-cyan-primary/60 transition-colors hover:text-cyan-primary"
        >
          <RefreshCw size={14} /> Refresh Finance
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-[#1a0f0f] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-[2rem] border border-white/8 p-6 ${card.bg}`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 ${card.tone}`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-black text-white">
                {loading ? "..." : card.value}
              </div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/26">
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/8 bg-[#121417] p-8">
          <h3 className="text-sm font-black text-white">How payouts work now</h3>
          <div className="mt-5 space-y-4 text-sm leading-7 text-white/58">
            <p>Your earnings come from immutable ledger entries created only when an order is completed.</p>
            <p>There is no pending, withdrawable, or cooldown balance in the product anymore.</p>
            <p>Admin handles payroll manually, so this view shows what you earned and when the next payout cycle is expected.</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/8 bg-[#121417] p-8">
          <h3 className="text-sm font-black text-white">Why this is simpler</h3>
          <div className="mt-5 space-y-4 text-sm leading-7 text-white/58">
            <p>One source of truth: the ledger.</p>
            <p>One payout model: admin payroll.</p>
            <p>No fake banking states in the UI, which means fewer mismatches between finance data and real operations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
