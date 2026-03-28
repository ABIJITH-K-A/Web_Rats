import { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Calendar,
  Info,
  Package,
  Star,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import {
  formatCurrency,
  getOrderAmount,
  isCompletedOrder,
  isOrderAssignedToWorker,
  toDateValue,
} from '../../../utils/orderHelpers';

const getMonthRange = (monthValue) => {
  const [year, month] = String(monthValue || '')
    .split('-')
    .map((value) => Number(value));

  if (!year || !month) {
    return { start: null, end: null };
  }

  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
};

const isWithinRange = (dateValue, start, end) => {
  const date = toDateValue(dateValue);
  if (!date) return false;
  if (!start || !end) return true;
  return date >= start && date < end;
};

const getOrderActivityDate = (order) =>
  toDateValue(
    order.completedAt ||
      order.closedAt ||
      order.updatedAt ||
      order.previewDeliveredAt ||
      order.inProgressAt ||
      order.assignedAt ||
      order.createdAt
  );

const getAverageRating = (reviews = []) => {
  if (reviews.length === 0) return 0;

  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return Number((total / reviews.length).toFixed(1));
};

const buildSuggestedAllocations = (statsMap, budget) => {
  const workerIds = Object.keys(statsMap);
  const suggestions = Object.fromEntries(workerIds.map((workerId) => [workerId, 0]));
  const scores = Object.fromEntries(workerIds.map((workerId) => [workerId, 0]));

  if (workerIds.length === 0) {
    return { suggestions, scores };
  }

  const maxOrders = Math.max(...workerIds.map((workerId) => statsMap[workerId].orders), 1);
  const maxValue = Math.max(
    ...workerIds.map((workerId) => statsMap[workerId].completedValue),
    1
  );
  const maxRefs = Math.max(...workerIds.map((workerId) => statsMap[workerId].refs), 1);
  const maxActive = Math.max(
    ...workerIds.map((workerId) => statsMap[workerId].inProgress),
    1
  );

  const scoredWorkers = workerIds
    .map((workerId) => {
      const stats = statsMap[workerId];
      const score =
        (stats.orders / maxOrders) * 0.35 +
        (stats.completedValue / maxValue) * 0.3 +
        (stats.rating / 5) * 0.2 +
        (stats.refs / maxRefs) * 0.1 +
        (stats.inProgress / maxActive) * 0.05;

      return {
        workerId,
        score: Number(score.toFixed(4)),
      };
    })
    .filter((entry) => entry.score > 0);

  scoredWorkers.forEach((entry) => {
    scores[entry.workerId] = entry.score;
  });

  const roundedBudget = Math.max(Math.round(Number(budget || 0)), 0);
  if (roundedBudget === 0 || scoredWorkers.length === 0) {
    return { suggestions, scores };
  }

  const totalScore = scoredWorkers.reduce((sum, entry) => sum + entry.score, 0);
  const distributions = scoredWorkers
    .map((entry) => {
      const raw = (roundedBudget * entry.score) / totalScore;
      const base = Math.floor(raw);

      return {
        workerId: entry.workerId,
        base,
        remainder: raw - base,
      };
    })
    .sort((left, right) => right.remainder - left.remainder);

  let used = 0;
  distributions.forEach((entry) => {
    suggestions[entry.workerId] = entry.base;
    used += entry.base;
  });

  let remaining = roundedBudget - used;
  let cursor = 0;
  while (remaining > 0 && distributions.length > 0) {
    const target = distributions[cursor % distributions.length];
    suggestions[target.workerId] += 1;
    remaining -= 1;
    cursor += 1;
  }

  return { suggestions, scores };
};

const TeamPayView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [workerStats, setWorkerStats] = useState({});
  const [allocations, setAllocations] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    fetchData();
  }, [user?.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payrollSnapshot, workerSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'payroll'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'worker'))),
      ]);

      const payrollData = payrollSnapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
        .filter((payroll) => payroll.managerAllocations?.[user.uid]);

      setPayrolls(payrollData);
      setWorkers(
        workerSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (payroll) => {
    setSelectedPayroll(payroll);
    setLoading(true);

    try {
      const [orderSnapshot, reviewSnapshot, referralSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))).catch(
          () => null
        ),
        getDocs(collection(db, 'referralCodes')).catch(() => null),
      ]);

      const orders = orderSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      const reviews =
        reviewSnapshot?.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })) || [];
      const referralTotals =
        referralSnapshot?.docs.reduce((acc, docSnapshot) => {
          const referral = docSnapshot.data();
          if (!referral.ownerUid) return acc;

          acc[referral.ownerUid] =
            Number(acc[referral.ownerUid] || 0) + Number(referral.timesUsed || 0);
          return acc;
        }, {}) || {};

      const { start, end } = getMonthRange(payroll.month);
      const stats = {};

      workers.forEach((worker) => {
        const workerOrders = orders.filter((order) => {
          const activityDate = getOrderActivityDate(order);
          return (
            isOrderAssignedToWorker(order, worker.id) &&
            isWithinRange(activityDate, start, end)
          );
        });

        const completedOrders = workerOrders.filter(isCompletedOrder);
        const monthlyReviews = reviews.filter(
          (review) =>
            review.workerAssigned === worker.id &&
            isWithinRange(review.createdAt, start, end)
        );
        const fallbackReviews = reviews.filter(
          (review) => review.workerAssigned === worker.id
        );

        stats[worker.id] = {
          orders: workerOrders.length,
          completed: completedOrders.length,
          inProgress: Math.max(workerOrders.length - completedOrders.length, 0),
          completedValue: completedOrders.reduce(
            (sum, order) => sum + getOrderAmount(order),
            0
          ),
          rating: getAverageRating(
            monthlyReviews.length > 0 ? monthlyReviews : fallbackReviews
          ),
          refs: Number(referralTotals[worker.id] || 0),
          suggested: 0,
          score: 0,
        };
      });

      const budget = Number(payroll.managerAllocations?.[user.uid] || 0);
      const { suggestions, scores } = buildSuggestedAllocations(stats, budget);
      const enrichedStats = Object.fromEntries(
        Object.entries(stats).map(([workerId, statsEntry]) => [
          workerId,
          {
            ...statsEntry,
            suggested: suggestions[workerId] || 0,
            score: scores[workerId] || 0,
          },
        ])
      );

      setWorkerStats(enrichedStats);
      setAllocations(payroll.workerAllocations?.[user.uid] || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayments = async () => {
    if (!selectedPayroll) return;

    const totalAllocated = Object.values(allocations).reduce(
      (acc, value) => acc + Number(value || 0),
      0
    );
    const maxAllocation = selectedPayroll.managerAllocations[user.uid] || 0;

    if (totalAllocated > maxAllocation) {
      alert('Error: Total distributed exceeds your allocated budget!');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedWorkerAllocations = {
        ...(selectedPayroll.workerAllocations || {}),
        [user.uid]: allocations,
      };

      await updateDoc(doc(db, 'payroll', selectedPayroll.id), {
        workerAllocations: updatedWorkerAllocations,
      });

      alert('Team payroll distribution committed.');
      setSelectedPayroll(null);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const myAllocation = selectedPayroll
    ? Number(selectedPayroll.managerAllocations[user.uid] || 0)
    : 0;
  const currentTotal = Object.values(allocations).reduce(
    (acc, value) => acc + Number(value || 0),
    0
  );
  const remaining = myAllocation - currentTotal;
  const totalAllocated = payrolls.reduce(
    (acc, payroll) => acc + Number(payroll.managerAllocations[user.uid] || 0),
    0
  );
  const totalDistributed = payrolls.reduce(
    (acc, payroll) =>
      acc +
      Object.values(payroll.workerAllocations?.[user.uid] || {}).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      ),
    0
  );
  const rankedWorkers = [...workers].sort((left, right) => {
    const rightScore = workerStats[right.id]?.score || 0;
    const leftScore = workerStats[left.id]?.score || 0;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return String(left.name || '').localeCompare(String(right.name || ''));
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">
            Team{' '}
            <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">
              // Payments
            </span>
          </h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">
            Distribute your allocated payroll budget to contributing workers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: 'Budget Allocated',
            val: formatCurrency(totalAllocated),
            icon: <DollarSign />,
            color: 'text-cyan-primary',
          },
          {
            label: 'Distributed',
            val: formatCurrency(totalDistributed),
            icon: <CheckCircle />,
            color: 'text-teal-primary',
          },
          {
            label: 'Worker Strength',
            val: workers.length,
            icon: <Users />,
            color: 'text-purple-500',
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-[#121417] border border-white/5 p-6 rounded-3xl flex items-center gap-6 group hover:border-cyan-primary/20 transition-all"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}
            >
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">{stat.val}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!selectedPayroll ? (
        <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
              <Calendar size={14} /> Active Payroll Periods
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#262B25] text-[9px] font-mono uppercase tracking-widest text-white/20">
                <tr>
                  <th className="px-6 py-5">Period</th>
                  <th className="px-6 py-5">Your Budget</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-white/10 uppercase font-mono text-[10px]"
                    >
                      Scanning Ledger...
                    </td>
                  </tr>
                ) : payrolls.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-24 text-center text-white/10 opacity-20 font-mono text-sm uppercase tracking-widest"
                    >
                      No allocations found for your account
                    </td>
                  </tr>
                ) : (
                  payrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold uppercase tracking-widest text-white group-hover:text-cyan-primary transition-colors">
                        {payroll.month}
                      </td>
                      <td className="px-6 py-4 font-black italic text-cyan-primary">
                        {formatCurrency(payroll.managerAllocations[user.uid] || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                            payroll.status === 'distributed'
                              ? 'bg-teal-primary/10 text-teal-primary border-teal-primary/20'
                              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}
                        >
                          {payroll.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => loadStats(payroll)}
                          className="text-[10px] font-mono text-cyan-primary hover:underline underline-offset-4 uppercase tracking-widest"
                        >
                          Distribute Funds →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#121417] border border-cyan-primary/20 rounded-3xl p-8 animate-in slide-in-from-bottom-4 duration-300 shadow-[0_0_40px_rgba(103, 248, 29,0.05)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8">
            <div>
              <h3 className="text-sm font-black text-cyan-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <Users size={16} /> Team Distribution — {selectedPayroll.month}
              </h3>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest font-bold flex items-center gap-2">
                <TrendingUp size={12} /> My Allocation:{' '}
                <span className="text-white">{formatCurrency(myAllocation)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div
                className={`text-2xl font-black font-mono transition-colors ${
                  remaining < 0 ? 'text-red-500' : 'text-teal-primary'
                }`}
              >
                {formatCurrency(remaining)}
              </div>
              <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 font-bold italic">
                Available Funds
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar mb-10">
            {rankedWorkers.map((worker) => {
              const stats = workerStats[worker.id] || {
                orders: 0,
                completed: 0,
                inProgress: 0,
                completedValue: 0,
                rating: 0,
                refs: 0,
                suggested: 0,
              };

              return (
                <div
                  key={worker.id}
                  className="bg-[#262B25] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4 flex-grow w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs border border-white/5 group-hover:bg-cyan-primary group-hover:text-white transition-all">
                      {worker.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white group-hover:text-cyan-primary transition-colors">
                        {worker.name}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1">
                          <Package size={10} /> {stats.orders} Projects
                        </span>
                        <span className="text-[9px] font-mono text-yellow-500/60 uppercase tracking-widest flex items-center gap-1 italic">
                          <Star size={10} /> {stats.rating.toFixed(1)} Rating
                        </span>
                        <span className="text-[9px] font-mono text-purple-500/60 uppercase tracking-widest flex items-center gap-1 italic">
                          Ref: {stats.refs}
                        </span>
                        <span className="text-[9px] font-mono text-teal-primary/60 uppercase tracking-widest">
                          {formatCurrency(stats.completedValue)} Value
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
                    <div className="text-right flex flex-col items-end">
                      <div className="text-[9px] font-mono text-teal-primary/40 uppercase tracking-widest">
                        {formatCurrency(stats.suggested)} hinted
                      </div>
                      <button
                        onClick={() =>
                          setAllocations({ ...allocations, [worker.id]: stats.suggested })
                        }
                        className="text-[8px] font-mono text-white/10 hover:text-white uppercase tracking-widest underline decoration-white/5"
                      >
                        Apply Hint
                      </button>
                    </div>
                    <input
                      type="number"
                      className="bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-cyan-primary focus:border-cyan-primary outline-none transition-all w-32"
                      placeholder="0"
                      value={allocations[worker.id] || ''}
                      onChange={(event) =>
                        setAllocations({
                          ...allocations,
                          [worker.id]: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setSelectedPayroll(null)}
              className="px-8 py-4 bg-white/5 border border-white/5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleSavePayments}
              className="flex-grow py-4 bg-cyan-primary text-primary-dark font-black font-mono text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-[1.01] shadow-[0_0_20px_rgba(103, 248, 29,0.1)] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? 'Syncing Team Data...' : 'Commit Team Payroll'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#121417]/50 border border-white/5 p-6 rounded-3xl flex items-start gap-4 italic shadow-lg">
        <Info size={20} className="text-cyan-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">
            Manager Protocol
          </h4>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.15em] leading-relaxed">
            Suggestions now use live order volume, completed project value, review quality,
            and referral pull for the selected payroll month. Referral influence is inferred
            from current code totals because the schema does not yet store per-month referral
            events.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamPayView;
