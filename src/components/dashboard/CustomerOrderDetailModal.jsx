import { useEffect, useState } from 'react';
import {
  X,
  Info,
  Users,
  Mail,
  Phone,
  Briefcase,
  Clock3,
  Star,
  ExternalLink,
  Copy,
  Check,
  LayoutDashboard,
  CreditCard,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card, Button } from '../ui/Primitives';
import {
  getOrderDisplayId,
  getOrderProgress,
  getOrderStatusBadgeClass,
  getOrderPriorityLabel,
  getOrderPriorityBadgeClass,
  getOrderTimeline,
  formatCurrency,
  formatDate,
  formatDateTime,
  getOrderAmount,
  getOrderPaymentSummary,
  getAssignedWorkerIds,
} from '../../utils/orderHelpers';

/**
 * CustomerOrderDetailModal
 *
 * Shown when a customer clicks on their order in the Profile > Orders section.
 * Tabs: Details | Workers
 */
const CustomerOrderDetailModal = ({
  order,
  onClose,
  onContact,
  onReorder,
  onReview,
  onPay,
  paying = false,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [workerProfiles, setWorkerProfiles] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const progress = getOrderProgress(order.status);
  const isCompleted = ['completed', 'closed'].includes(order.status);
  const reviewDone = order.reviewDone || order.review?.rating;
  const summary = getOrderPaymentSummary(order);
  const timeline = getOrderTimeline(order);
  const workerIds = getAssignedWorkerIds(order);

  // Fetch worker profiles when Workers tab is opened
  useEffect(() => {
    if (activeTab !== 'workers' || workerIds.length === 0) return;
    if (workerProfiles.length > 0) return; // already fetched

    let cancelled = false;
    setWorkersLoading(true);

    const fetchWorkers = async () => {
      try {
        const snapshots = await Promise.all(
          workerIds.map((uid) => getDoc(doc(db, 'users', uid)))
        );
        if (!cancelled) {
          setWorkerProfiles(
            snapshots
              .filter((snap) => snap.exists())
              .map((snap) => ({ id: snap.id, ...snap.data() }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch worker profiles:', err);
      } finally {
        if (!cancelled) setWorkersLoading(false);
      }
    };

    fetchWorkers();
    return () => { cancelled = true; };
  }, [activeTab, workerIds, workerProfiles.length]);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback — ignore
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: Info },
    { id: 'workers', label: 'Worker Info', icon: Users },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 md:p-10 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-full max-h-[90vh] bg-[#0B0F13] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-cyan-primary/60">
                {getOrderDisplayId(order)}
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getOrderStatusBadgeClass(order.status)}`}>
                {order.status}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white italic leading-tight">
              {order.service}
            </h2>
            <p className="mt-1 text-sm text-white/35">
              {order.plan || order.package || 'Custom'} plan
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-black/40 p-1 rounded-2xl border border-white/5 flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-primary text-black font-black shadow-lg shadow-cyan-primary/20'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <tab.icon size={13} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left column */}
              <div className="lg:col-span-4 space-y-6">
                {/* Progress */}
                <Card hoverEffect={false} className="bg-white/[0.02] border-white/5 p-6 rounded-[32px]">
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
                    <LayoutDashboard size={14} /> Project Pulse
                  </h4>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-3">
                        <span className="text-white/40">Completion</span>
                        <span className="text-cyan-primary font-black">{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-primary shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-[width] duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                        <div className="text-[8px] font-mono uppercase text-white/20 mb-1">Priority</div>
                        <div className={`text-[10px] font-black uppercase ${getOrderPriorityBadgeClass(order)} border-none p-0 bg-transparent`}>
                          {getOrderPriorityLabel(order)}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                        <div className="text-[8px] font-mono uppercase text-white/20 mb-1">Deadline</div>
                        <div className="text-[10px] font-black text-white uppercase">{order.deadline || 'Flexible'}</div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2 pt-2">
                      {timeline.map((step) => (
                        <div key={step.key} className="flex items-start gap-3">
                          <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full border ${step.done ? 'border-cyan-primary bg-cyan-primary' : 'border-white/15 bg-transparent'}`} />
                          <div className="flex-1">
                            <div className={`text-[10px] font-mono uppercase tracking-wide ${step.done ? 'text-white' : 'text-white/25'}`}>
                              {step.label}
                            </div>
                            {step.done && step.date && (
                              <div className="text-[9px] text-white/25">{formatDate(step.date)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Financial */}
                <Card hoverEffect={false} className="bg-white/[0.02] border-white/5 p-6 rounded-[32px]">
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
                    <CreditCard size={14} /> Payment Summary
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Total Value</span>
                      <span className="text-sm font-black text-white">{formatCurrency(getOrderAmount(order))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Paid</span>
                      <span className="text-sm font-black text-cyan-primary">{formatCurrency(summary.paid)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs font-bold text-white/60">Balance Due</span>
                      <span className={`text-lg font-black ${summary.dueNow > 0 ? 'text-amber-400' : 'text-cyan-primary'}`}>
                        {formatCurrency(summary.dueNow)}
                      </span>
                    </div>
                    {summary.dueNow > 0 && onPay && (
                      <Button
                        className="w-full mt-2"
                        disabled={paying}
                        onClick={() => onPay(summary.dueNow)}
                      >
                        {paying ? 'Starting...' : `Pay ${formatCurrency(summary.dueNow)}`}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right column */}
              <div className="lg:col-span-8 space-y-6">
                <Card hoverEffect={false} className="bg-white/[0.02] border-white/5 p-8 rounded-[32px]">
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 mb-8 flex items-center gap-2">
                    <Info size={14} /> Order Brief
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="text-[8px] font-mono uppercase text-white/20 mb-2 tracking-widest">Project Summary</div>
                      <p className="text-sm leading-relaxed text-white/70 italic">
                        "{order.projectDescription || order.requirements?.projectDescription || 'No description provided.'}"
                      </p>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <div className="text-[8px] font-mono uppercase text-white/20 mb-2 tracking-widest">Key Deliverables</div>
                        <p className="text-xs text-white/60">{order.features || order.requirements?.features || 'Standard project features.'}</p>
                      </div>
                      <div>
                        <div className="text-[8px] font-mono uppercase text-white/20 mb-2 tracking-widest">Reference Links</div>
                        {order.references || order.requirements?.references ? (
                          <a href={order.references || order.requirements?.references} target="_blank" rel="noreferrer" className="text-xs text-cyan-primary underline underline-offset-4 flex items-center gap-2">
                            <ExternalLink size={12} /> Open Reference
                          </a>
                        ) : (
                          <span className="text-xs text-white/20">None provided.</span>
                        )}
                      </div>
                      <div>
                        <div className="text-[8px] font-mono uppercase text-white/20 mb-2 tracking-widest">Order Date</div>
                        <p className="text-xs text-white/60">{formatDateTime(order.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-8 mt-6 border-t border-white/5 flex flex-wrap gap-3">
                    {onContact && <Button variant="outline" onClick={onContact}>Contact Support</Button>}
                    {isCompleted && onReorder && <Button onClick={onReorder}>Reorder Service</Button>}
                    {isCompleted && onReview && (
                      <Button variant="outline" onClick={onReview} disabled={Boolean(reviewDone)}>
                        {reviewDone ? 'Review Saved' : 'Leave Review'}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ── WORKERS TAB ── */}
          {activeTab === 'workers' && (
            <div className="space-y-6">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                <Users size={14} /> Assigned Team Members
              </div>

              {workersLoading && (
                <div className="py-24 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-white/20 animate-pulse">
                  Loading worker info...
                </div>
              )}

              {!workersLoading && workerIds.length === 0 && (
                <div className="rounded-[32px] border border-dashed border-white/10 bg-white/2 px-8 py-20 text-center">
                  <Users size={48} className="mx-auto mb-5 text-white/10" />
                  <p className="text-lg font-black text-white/30">No workers assigned yet</p>
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/15">
                    Our team will be assigned shortly after order review.
                  </p>
                </div>
              )}

              {!workersLoading && workerProfiles.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2">
                  {workerProfiles.map((worker) => (
                    <WorkerContactCard
                      key={worker.id}
                      worker={worker}
                      onCopy={copyToClipboard}
                      copiedField={copiedField}
                    />
                  ))}
                </div>
              )}

              {/* Fallback: workerAssignedName if profile not fetched */}
              {!workersLoading && workerProfiles.length === 0 && workerIds.length > 0 && (
                <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-6">
                  <div className="text-sm font-bold text-white">
                    {order.workerAssignedName || order.assignedToName || 'Your assigned worker'}
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    Contact details are being loaded. Please check back shortly or use the support ticket system.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Worker Contact Card ──────────────────────────────────────────────────────

const WorkerContactCard = ({ worker, onCopy, copiedField }) => {
  const contactMethods = Array.isArray(worker.contactMethods)
    ? worker.contactMethods
    : [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const workingDays = Array.isArray(worker.workingDays)
    ? worker.workingDays.map((d) => dayNames[d]).join(', ')
    : null;

  return (
    <div className="rounded-[28px] border border-white/8 bg-[#111820] p-7 space-y-5 hover:border-cyan-primary/15 transition-colors">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-primary/10 text-cyan-primary text-2xl font-black border border-cyan-primary/15">
          {(worker.name || worker.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <div className="text-lg font-black text-white">{worker.name || 'Team Member'}</div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-0.5">
            {worker.role || 'Worker'}
          </div>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Contact details */}
      <div className="space-y-3">
        {worker.email && (
          <ContactRow
            icon={Mail}
            label="Email"
            value={worker.email}
            fieldKey={`email-${worker.id}`}
            onCopy={onCopy}
            copiedField={copiedField}
            href={`mailto:${worker.email}`}
          />
        )}
        {worker.phone && (
          <ContactRow
            icon={Phone}
            label="Phone"
            value={worker.phone}
            fieldKey={`phone-${worker.id}`}
            onCopy={onCopy}
            copiedField={copiedField}
            href={`tel:${worker.phone}`}
          />
        )}

        {/* Skills */}
        {Array.isArray(worker.skills) && worker.skills.length > 0 && (
          <div className="flex items-start gap-3 pt-1">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/35">
              <Briefcase size={14} />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1">Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {worker.skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-[10px] text-white/55"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact methods */}
        {contactMethods.length > 0 && (
          <div className="flex items-center gap-3 pt-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/35">
              <Star size={14} />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1">Preferred Contact</div>
              <div className="text-xs text-white/60 capitalize">{contactMethods.join(', ')}</div>
            </div>
          </div>
        )}

        {/* Working hours */}
        {(worker.availableHours?.start || workingDays) && (
          <div className="flex items-center gap-3 pt-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/35">
              <Clock3 size={14} />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1">Availability</div>
              <div className="text-xs text-white/60">
                {worker.availableHours?.start && `${worker.availableHours.start} – ${worker.availableHours.end}`}
                {workingDays && ` · ${workingDays}`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Availability badge */}
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${
        worker.availabilityStatus === 'available'
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400'
          : 'border-amber-400/20 bg-amber-400/10 text-amber-400'
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
          worker.availabilityStatus === 'available' ? 'bg-emerald-400' : 'bg-amber-400'
        }`} />
        {worker.availabilityStatus || 'Available'}
      </div>
    </div>
  );
};

const ContactRow = ({ icon: Icon, label, value, fieldKey, onCopy, copiedField, href }) => { // eslint-disable-line no-unused-vars
  const isCopied = copiedField === fieldKey;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/35">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-widest text-white/25">{label}</div>
        <a
          href={href}
          className="block text-xs font-semibold text-cyan-primary truncate hover:underline"
        >
          {value}
        </a>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, fieldKey)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/30 transition-colors hover:border-cyan-primary/20 hover:text-cyan-primary"
        aria-label={`Copy ${label}`}
      >
        {isCopied ? <Check size={12} className="text-cyan-primary" /> : <Copy size={12} />}
      </button>
    </div>
  );
};

export default CustomerOrderDetailModal;
