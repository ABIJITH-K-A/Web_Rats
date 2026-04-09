import { useEffect, useState } from "react";
import { CalendarClock, Landmark, RefreshCw } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../config/firebase";

const getNextPayoutDate = () => {
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 1);
  next.setHours(0, 0, 0, 0);
  return next.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const PayrollView = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const [workerSnapshot, ledgerSnapshot] = await Promise.all([
        getDocs(query(collection(db, "users"), where("role", "==", "worker"))).catch(() => null),
        getDocs(collection(db, "ledgerEntries")).catch(() => null),
      ]);

      const totals = new Map();
      ledgerSnapshot?.docs.forEach((docSnapshot) => {
        const entry = docSnapshot.data();
        if (entry.userId && entry.userId !== "company") {
          totals.set(
            entry.userId,
            Number(totals.get(entry.userId) || 0) + Number(entry.amount || 0)
          );
        }
      });

      const nextRows =
        workerSnapshot?.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          name: docSnapshot.data()?.name || docSnapshot.data()?.email || "Worker",
          email: docSnapshot.data()?.email || "-",
          totalEarned: totals.get(docSnapshot.id) || 0,
        })) || [];

      nextRows.sort((left, right) => right.totalEarned - left.totalEarned);
      setRows(nextRows);
    } catch (error) {
      console.error("Failed to load payroll summary:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white italic">
            Payroll{" "}
            <span className="ml-2 text-sm font-mono uppercase tracking-[0.2em] text-cyan-primary not-italic">
              // Manual Payout
            </span>
          </h2>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/20">
            Admin pays workers manually based on completed-order ledger totals
          </p>
        </div>
        <button
          type="button"
          onClick={loadPayroll}
          className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-cyan-primary/60 transition-colors hover:text-cyan-primary"
        >
          <RefreshCw size={14} /> Refresh Payroll
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/8 bg-[#121417] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-primary/10 text-cyan-primary">
            <Landmark size={20} />
          </div>
          <div className="text-2xl font-black text-white">{rows.length}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/24">
            Workers in payroll
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/8 bg-[#121417] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-primary/10 text-cyan-primary">
            <CalendarClock size={20} />
          </div>
          <div className="text-2xl font-black text-white">{getNextPayoutDate()}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/24">
            Next manual payout
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/8 bg-[#121417] p-6">
          <div className="text-2xl font-black text-white">
            {formatCurrency(rows.reduce((sum, row) => sum + row.totalEarned, 0))}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/24">
            Total earned in ledger
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/8 bg-[#121417] p-8">
        <h3 className="text-sm font-black text-white">Worker payout summary</h3>
        <p className="mt-2 text-sm leading-7 text-white/52">
          This stays intentionally simple. Earnings come from the immutable ledger, and actual salary transfer happens manually outside the app.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-white/8 text-[10px] font-mono uppercase tracking-[0.18em] text-white/26">
                <th className="pb-4">Worker</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Total Earned</th>
                <th className="pb-4">Next Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-sm text-white/26">
                    Loading payroll summary...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-sm text-white/26">
                    No worker earnings found yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="text-sm text-white/70">
                    <td className="py-4 font-semibold text-white">{row.name}</td>
                    <td className="py-4 text-white/48">{row.email}</td>
                    <td className="py-4 font-black text-cyan-primary">
                      {formatCurrency(row.totalEarned)}
                    </td>
                    <td className="py-4 text-white/48">{getNextPayoutDate()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollView;
