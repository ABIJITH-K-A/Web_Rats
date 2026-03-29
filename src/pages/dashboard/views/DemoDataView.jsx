import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Loader2,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { logAuditEvent } from '../../../services/auditService';
import {
  clearDemoDataset,
  getDemoDatasetSummary,
  seedDemoDataset,
} from '../../../services/demoDataService';

const COLLECTION_META = [
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'samples', label: 'Samples' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'assignmentRequests', label: 'Assignment Requests' },
  { id: 'users', label: 'Users' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'referralCodes', label: 'Referral Codes' },
];

const DEMO_ACTORS = [
  {
    name: 'Siddharth Varma',
    role: 'Owner',
    note: 'The system founder with full dashboard coverage and top-tier referral stats.',
  },
  {
    name: 'Priya Sharma',
    role: 'Admin',
    note: 'Oversees orders, approvals, and user management with assigned administrative tokens.',
  },
  {
    name: 'Ava Nair',
    role: 'Client',
    note: 'New customer with a pending presentation order in the queue.',
  },
  {
    name: 'Ryan Paul',
    role: 'Returning Client',
    note: 'Has an order awaiting final payment plus review/dispute history.',
  },
  {
    name: 'Maya Joseph',
    role: 'Worker',
    note: 'Covers active assignments, referrals, wallet balance, and payouts.',
  },
  {
    name: 'Kiran Mehta',
    role: 'Manager',
    note: 'Anchors assignment requests, payroll allocations, and samples.',
  },
];

const DEMO_SCENARIOS = [
  'Order pipeline coverage from pending assignment through completed delivery.',
  'Partial and full payment states for bookings, revenue charts, and wallet summaries.',
  'Open and resolved dispute threads so the admin resolution flow has realistic records.',
  'Payroll, transactions, notifications, and samples for non-empty staff dashboards.',
];

const EMPTY_SUMMARY = {
  tag: '',
  total: 0,
  collections: {},
};

const DemoDataView = () => {
  const { user, userProfile } = useAuth();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const nextSummary = await getDemoDatasetSummary();
        if (isMounted) {
          setSummary(nextSummary);
        }
      } catch (error) {
        console.error('Demo summary error:', error);
        if (isMounted) {
          setMessage({
            type: 'error',
            text: 'Could not load demo dataset status right now.',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!message.text) return undefined;

    const timeout = setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 4200);

    return () => clearTimeout(timeout);
  }, [message]);

  const seededCollections = useMemo(
    () => COLLECTION_META.filter((item) => Number(summary.collections?.[item.id] || 0) > 0).length,
    [summary.collections]
  );

  const refreshSummary = async (nextMessage = null) => {
    setLoading(true);
    try {
      const nextSummary = await getDemoDatasetSummary();
      setSummary(nextSummary);
      if (nextMessage) {
        setMessage(nextMessage);
      }
    } catch (error) {
      console.error('Demo refresh error:', error);
      setMessage({
        type: 'error',
        text: 'Refresh failed. Please try again.',
      });
    } finally {
      setLoading(false);
      setAction('');
    }
  };

  const handleSeed = async () => {
    setAction('seed');
    setMessage({ type: '', text: '' });

    try {
      const nextSummary = await seedDemoDataset({
        actorId: user?.uid || null,
        actorName: userProfile?.name || user?.email || 'Admin',
      });
      setSummary(nextSummary);

      await logAuditEvent({
        actorId: user?.uid || null,
        actorRole: userProfile?.role || 'admin',
        action: 'demo_dataset_seeded',
        targetType: 'system',
        targetId: 'demo_dataset',
        severity: 'medium',
        metadata: {
          totalRecords: nextSummary.total,
          tag: nextSummary.tag,
        },
      });

      setMessage({
        type: 'success',
        text: `Demo dataset seeded with ${nextSummary.total} tagged records.`,
      });
    } catch (error) {
      console.error('Demo seed error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to seed demo data.',
      });
    } finally {
      setAction('');
    }
  };

  const handleRefresh = async () => {
    setAction('refresh');
    setMessage({ type: '', text: '' });
    await refreshSummary({
      type: 'success',
      text: 'Demo dataset status refreshed.',
    });
  };

  const handleClear = async () => {
    const confirmed = window.confirm(
      'Clear all demoSeed-tagged records from the demo dataset?'
    );

    if (!confirmed) return;

    setAction('clear');
    setMessage({ type: '', text: '' });

    try {
      await clearDemoDataset();
      setSummary(EMPTY_SUMMARY);

      await logAuditEvent({
        actorId: user?.uid || null,
        actorRole: userProfile?.role || 'admin',
        action: 'demo_dataset_cleared',
        targetType: 'system',
        targetId: 'demo_dataset',
        severity: 'medium',
        metadata: {
          tag: summary.tag || null,
        },
      });

      setMessage({
        type: 'success',
        text: 'Demo dataset cleared. Only tagged demo records were removed.',
      });
    } catch (error) {
      console.error('Demo clear error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to clear demo data.',
      });
    } finally {
      setAction('');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white italic">
            Demo Data{' '}
            <span className="ml-2 text-sm font-mono uppercase tracking-[0.2em] text-cyan-primary not-italic">
              // Admin Utility
            </span>
          </h1>
          <p className="mt-2 max-w-3xl text-[10px] font-mono uppercase tracking-[0.16em] leading-relaxed text-white/28">
            Seed realistic walkthrough data for dashboards, disputes, samples, payroll,
            reviews, wallets, and notifications without touching non-demo records.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton
            label="Refresh Status"
            icon={RefreshCw}
            busy={action === 'refresh'}
            onClick={handleRefresh}
          />
          <ActionButton
            label="Seed Dataset"
            icon={Sparkles}
            busy={action === 'seed'}
            tone="primary"
            onClick={handleSeed}
          />
          <ActionButton
            label="Clear Demo"
            icon={Trash2}
            busy={action === 'clear'}
            tone="danger"
            onClick={handleClear}
          />
        </div>
      </div>

      <AnimatePresence>
        {message.text ? (
          <motion.div
            key={message.text}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 rounded-[24px] border px-5 py-4 text-sm ${
              message.type === 'error'
                ? 'border-red-500/20 bg-red-500/10 text-red-300'
                : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {message.text}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tagged Records"
          value={loading ? '...' : String(summary.total || 0)}
          note="Only docs marked with demoSeed are counted"
          icon={Database}
          accent="text-cyan-primary"
        />
        <StatCard
          label="Collections With Data"
          value={loading ? '...' : String(seededCollections)}
          note={`${COLLECTION_META.length} tracked collections`}
          icon={Package}
          accent="text-green-400"
        />
        <StatCard
          label="Dataset Tag"
          value={loading ? '...' : summary.tag || 'Not Seeded'}
          note="Useful when checking cleanup safety"
          icon={ShieldCheck}
          accent="text-amber-300"
          compact
        />
        <StatCard
          label="Demo Actors"
          value={String(DEMO_ACTORS.length)}
          note="Client, worker, and manager personas included"
          icon={Users}
          accent="text-purple-300"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[2.5rem] border border-white/8 bg-[#121417] p-8 shadow-2xl">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-primary">
                Seed Coverage
              </h2>
              <p className="mt-2 text-sm text-white/55">
                The demo dataset intentionally covers the main dashboard paths so empty
                states can be replaced with realistic sample activity.
              </p>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/25">
              Safe to rerun: seeding clears prior demoSeed docs first
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {COLLECTION_META.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-white/8 bg-black/20 p-5"
              >
                <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/28">
                  {item.id}
                </div>
                <div className="mt-2 text-lg font-black text-white">{item.label}</div>
                <div className="mt-4 text-3xl font-black text-cyan-primary">
                  {loading ? '...' : Number(summary.collections?.[item.id] || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2.5rem] border border-white/8 bg-[#121417] p-8 shadow-2xl">
            <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-primary">
              Safety Notes
            </h2>
            <div className="mt-6 space-y-5">
              {[
                'Clear only removes documents with the demoSeed flag.',
                'The seed covers Firestore records, not Firebase Auth sign-in accounts.',
                'Use this view to populate dashboards before live data exists.',
              ].map((line, index) => (
                <div key={line} className="flex gap-4">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-primary" />
                  <div>
                    <div className="text-sm font-semibold text-white/75">{line}</div>
                    <div className="mt-1 text-[9px] font-mono uppercase tracking-widest text-white/20">
                      note {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/8 bg-gradient-to-br from-[#121417] to-[#1a2128] p-8 shadow-2xl">
            <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-primary">
              Included Scenarios
            </h2>
            <div className="mt-6 space-y-4">
              {DEMO_SCENARIOS.map((scenario) => (
                <div
                  key={scenario}
                  className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-6 text-white/68"
                >
                  {scenario}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-white/8 bg-[#121417] p-8 shadow-2xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-primary">
              Demo Personas
            </h2>
            <p className="mt-2 text-sm text-white/55">
              These records drive the seeded dashboard examples and make the analytics,
              wallet, reviews, and dispute areas feel populated during demos.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {DEMO_ACTORS.map((actor) => (
            <div
              key={actor.name}
              className="rounded-[24px] border border-white/8 bg-black/20 p-6"
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-cyan-primary/80">
                {actor.role}
              </div>
              <div className="mt-2 text-xl font-black text-white">{actor.name}</div>
              <p className="mt-4 text-sm leading-6 text-white/62">{actor.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({
  label,
  icon: Icon,
  busy = false,
  tone = 'default',
  onClick,
}) => {
  const toneClass =
    tone === 'primary'
      ? 'border-cyan-primary/20 bg-cyan-primary/10 text-cyan-primary hover:bg-cyan-primary/16'
      : tone === 'danger'
      ? 'border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/16'
      : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-[10px] font-mono uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {busy ? 'Working...' : label}
    </button>
  );
};

const StatCard = ({
  label,
  value,
  note,
  icon: Icon,
  accent,
  compact = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-[2rem] border border-white/8 bg-[#121417] p-7 shadow-2xl"
  >
    <div className="flex items-start justify-between gap-4">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${accent}`}
      >
        <Icon size={18} />
      </div>
      <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/20">
        live summary
      </div>
    </div>
    <div
      className={`mt-6 font-black text-white ${compact ? 'text-lg break-all' : 'text-3xl'}`}
    >
      {value}
    </div>
    <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.16em] text-white/28">
      {label}
    </div>
    <div className="mt-4 text-sm leading-6 text-white/50">{note}</div>
  </motion.div>
);

export default DemoDataView;
