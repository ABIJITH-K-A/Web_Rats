import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Coins,
  HandCoins,
  History,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  getWalletOverview,
  requestWalletWithdrawal,
} from '../../../services/backendWalletService';
import { FINANCIAL_CONSTANTS } from '../../../services/financialService';
import { formatDateTime } from '../../../utils/orderHelpers';

const WalletView = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    method: 'upi',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadWallet = async ({ silent = false } = {}) => {
    if (!user?.uid) return;

    if (!silent) {
      setLoading(true);
    }

    try {
      const overview = await getWalletOverview(user.uid);
      setWallet(overview.wallet);
      setPayouts(overview.withdrawals || []);
      setError('');
    } catch (loadError) {
      console.error(loadError);
      setError('Could not load wallet details right now.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user?.uid) return undefined;

    loadWallet();
    return undefined;
  }, [user]);

  const handleSubmitPayout = async (event) => {
    event.preventDefault();
    if (!user?.uid) return;
    setError('');

    const amount = Number(payoutForm.amount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < FINANCIAL_CONSTANTS.MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ₹${FINANCIAL_CONSTANTS.MIN_WITHDRAWAL}`);
      return;
    }

    if (!payoutForm.note || payoutForm.note.length < 5) {
      setError('Please provide valid payment details (UPI ID or Bank Info) in the notes.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestWalletWithdrawal(amount, payoutForm.method, {
        userId: user.uid,
        note: payoutForm.note,
        userName: userProfile?.name || user?.email,
        role: userProfile?.role || 'worker',
      });

      setPayoutForm({ amount: '', method: 'upi', note: '' });
      await loadWallet({ silent: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
      case 'paid':
        return 'bg-cyan-primary/10 text-cyan-primary border-cyan-primary/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    return `₹${Number(value).toLocaleString('en-IN')}`;
  };

  const stats = wallet
    ? [
        {
          label: 'Total Earnings',
          val: formatCurrency(wallet.lifetimeEarnings || wallet.totalEarnings),
          icon: <Coins size={20} />,
          color: 'text-cyan-primary',
          bg: 'bg-[#0f1f1f]',
        },
        {
          label: 'Withdrawable',
          val: formatCurrency(wallet.withdrawableAmount ?? wallet.withdrawable),
          icon: <Wallet size={20} />,
          color: 'text-green-500',
          bg: 'bg-[#0f1f15]',
        },
        {
          label: 'Pending',
          val: formatCurrency(wallet.pendingAmount ?? wallet.pending),
          icon: <Clock size={20} />,
          color: 'text-yellow-500',
          bg: 'bg-[#1f1f0f]',
        },
        {
          label: 'On Hold',
          val: formatCurrency(wallet.onHoldAmount ?? wallet.onHold),
          icon: <AlertCircle size={20} />,
          color: 'text-red-500',
          bg: 'bg-[#1f0f0f]',
        },
      ]
    : [
        {
          label: 'Total Earnings',
          val: '₹0',
          icon: <Coins size={20} />,
          color: 'text-cyan-primary',
          bg: 'bg-[#0f1f1f]',
        },
        {
          label: 'Withdrawable',
          val: '₹0',
          icon: <Wallet size={20} />,
          color: 'text-green-500',
          bg: 'bg-[#0f1f15]',
        },
        {
          label: 'Pending',
          val: '₹0',
          icon: <Clock size={20} />,
          color: 'text-yellow-500',
          bg: 'bg-[#1f1f0f]',
        },
        {
          label: 'On Hold',
          val: '₹0',
          icon: <AlertCircle size={20} />,
          color: 'text-red-500',
          bg: 'bg-[#1f0f0f]',
        },
      ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white italic">
            Wallet{' '}
            <span className="ml-2 text-sm font-mono uppercase tracking-[0.2em] text-cyan-primary not-italic">
              // Earnings & Payouts
            </span>
          </h2>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/20">
            Salary balance, requested withdrawals, and payment timeline
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadWallet()}
          className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-cyan-primary/60 transition-colors hover:text-cyan-primary"
        >
          <RefreshCw size={14} /> Refresh Ledger
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-[#1a0f0f] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-3xl border border-white/5 p-6 transition-all hover:border-white/20 ${stat.bg}`}
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1f1a] ${stat.color}`}
            >
              {stat.icon}
            </div>
            <div className="mb-1 font-mono text-2xl font-black text-white">{stat.val}</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-[#121417] p-8">
          <h3 className="mb-8 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-primary">
            <HandCoins size={14} /> Request Payout
          </h3>
          <form onSubmit={handleSubmitPayout} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/20">
                  Amount (INR) *
                </label>
                <input
                  required
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-[#262B25] px-4 py-3 text-sm outline-none transition-all focus:border-cyan-primary"
                  placeholder="e.g. 5000"
                  value={payoutForm.amount}
                  onChange={(event) =>
                    setPayoutForm({
                      ...payoutForm,
                      amount: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/20">
                  Method *
                </label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#262B25] px-4 py-3 text-[10px] font-mono uppercase tracking-widest outline-none transition-all focus:border-cyan-primary"
                  value={payoutForm.method}
                  onChange={(event) =>
                    setPayoutForm({
                      ...payoutForm,
                      method: event.target.value,
                    })
                  }
                >
                  <option value="upi">UPI Transfer</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash Collection</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/20">
                Payment Details / Notes *
              </label>
              <textarea
                required
                className="min-h-[100px] w-full resize-none rounded-xl border border-white/10 bg-[#262B25] px-4 py-3 text-sm outline-none transition-all focus:border-cyan-primary"
                placeholder="Enter UPI ID or Bank details (A/C Name, Number, IFSC)"
                value={payoutForm.note}
                onChange={(event) =>
                  setPayoutForm({
                    ...payoutForm,
                    note: event.target.value,
                  })
                }
              />
            </div>
            <button
              disabled={isSubmitting}
              className="w-full rounded-xl bg-cyan-primary py-4 text-sm font-black uppercase tracking-widest text-primary-dark shadow-[0_0_20px_rgba(103,248,29,0.2)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing Transaction...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>

        <div className="flex flex-col self-start overflow-hidden rounded-3xl border border-white/5 bg-[#121417]">
          <div className="flex items-center justify-between border-b border-white/5 bg-[#0d0f0d] p-6">
            <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-primary">
              <History size={14} /> Payout Logs
            </h3>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              Recent 20 cycles
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#262B25] text-[9px] font-mono uppercase tracking-widest text-white/20">
                <tr>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-white/10">
                      Loading Records...
                    </td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <div className="mb-2 text-xs font-mono italic uppercase tracking-widest text-white/20">
                        No transaction history
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-white/10">
                        Withdrawals will appear here after submission
                      </p>
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="transition-colors hover:bg-[#1a1f1a]">
                      <td className="px-6 py-4 font-mono text-[10px] text-white/40">
                        #{payout.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-black italic text-cyan-primary">
                        ₹ {payout.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-mono uppercase text-white/40">
                        <div>{payout.method}</div>
                        <div className="mt-1 text-[9px] normal-case tracking-normal text-white/20">
                          {payout.requestedAt
                            ? formatDateTime(payout.requestedAt)
                            : 'Pending timestamp'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${getStatusColor(
                            payout.status
                          )}`}
                        >
                          {payout.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4 rounded-3xl border border-cyan-primary/10 bg-[#0f1f15] p-6">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-cyan-primary" />
        <div>
          <h4 className="mb-2 text-sm font-bold text-white underline decoration-cyan-primary/30 underline-offset-4">
            Payment Protocol
          </h4>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] leading-relaxed text-white/40">
            Standard payouts are processed on the 1st of every month. Emergency
            withdrawals (Min ₹{FINANCIAL_CONSTANTS.MIN_WITHDRAWAL}) can be requested anytime but require 48h approval
            from the Finance team. Ensure your UPI details are accurate in the notes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
