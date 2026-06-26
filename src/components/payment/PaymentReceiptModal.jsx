import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Download,
  Share2,
  X,
  Receipt,
  Copy,
  Check,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';

const formatCurrencyReceipt = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN')}`;

const formatDateFull = (date = new Date()) =>
  date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * PaymentReceiptModal
 *
 * Props:
 *  - orderId      {string}
 *  - orderData    {object}  — order fields (service, plan, totalPrice, etc.)
 *  - paymentData  {object}  — payment fields (amount, paymentStatus, method)
 *  - onClose      {function}
 */
export default function PaymentReceiptModal({
  orderId,
  orderData = {},
  paymentData = {},
  onClose,
}) {
  const navigate = useNavigate();
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const amount =
    paymentData?.amount ||
    orderData?.totalPaid ||
    orderData?.totalPrice ||
    orderData?.price ||
    0;
  const service = orderData?.service || 'Service';
  const plan = orderData?.plan || orderData?.package || 'Custom';
  const displayId = orderId
    ? String(orderId).startsWith('TNWR-')
      ? orderId
      : `TNWR-${String(orderId).slice(-6).toUpperCase()}`
    : 'TNWR-RECEIPT';
  const paymentDate = new Date();
  const receiptText = `Payment Receipt\nOrder: ${displayId}\nService: ${service}\nPlan: ${plan}\nAmount Paid: ${formatCurrencyReceipt(amount)}\nDate: ${formatDateFull(paymentDate)}\nStatus: Confirmed`;

  const handleClose = () => {
    onClose?.();
    navigate(`/profile?section=orders${orderId ? `&highlight=${orderId}` : ''}`);
  };

  const handleDownload = async () => {
    if (!receiptRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0B0F13',
      });
      saveAs(dataUrl, `receipt-${displayId}.png`);
      // Brief delay then redirect
      setTimeout(() => {
        onClose?.();
        navigate(`/profile?section=orders${orderId ? `&highlight=${orderId}` : ''}`);
      }, 1200);
    } catch (err) {
      console.error('Receipt download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Payment Receipt — ${displayId}`,
          text: receiptText,
        });
      } else {
        await navigator.clipboard.writeText(receiptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // user cancelled share — ignore
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-cyan-primary/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close receipt"
          className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#0B0F13] text-white/40 shadow-2xl transition-colors hover:text-white"
        >
          <X size={18} />
        </button>

        {/* ── Printable / capturable receipt card ── */}
        <div
          ref={receiptRef}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0B0F13] shadow-2xl"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {/* Top gradient strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-primary via-cyan-primary/60 to-transparent" />

          {/* Receipt header */}
          <div className="flex flex-col items-center gap-4 px-8 pb-6 pt-8">
            {/* Animated check */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-cyan-primary/20 bg-cyan-primary/10">
              <CheckCircle className="h-10 w-10 text-cyan-primary" strokeWidth={1.5} />
              <span className="absolute inset-0 animate-ping rounded-full border border-cyan-primary/20 opacity-30" />
            </div>

            <div className="text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
                Payment Confirmed
              </p>
              <p className="mt-2 text-4xl font-black text-white">
                {formatCurrencyReceipt(amount)}
              </p>
              <p className="mt-1 text-sm text-white/40">{formatDateFull(paymentDate)}</p>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="mx-8 my-2 border-t border-dashed border-white/10" />

          {/* Line items */}
          <div className="space-y-3 px-8 py-5">
            <ReceiptRow label="Order ID" value={displayId} mono />
            <ReceiptRow label="Service" value={service} />
            <ReceiptRow label="Plan" value={plan} />
            <ReceiptRow
              label="Amount Paid"
              value={formatCurrencyReceipt(amount)}
              highlight
            />
            <ReceiptRow label="Status" value="Confirmed ✓" highlight />
          </div>

          {/* Dashed divider */}
          <div className="mx-8 my-2 border-t border-dashed border-white/10" />

          {/* Footer branding */}
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <p className="text-xs font-black text-white">RyNix</p>
              <p className="text-[10px] text-white/25">Web Rats — Official Receipt</p>
            </div>
            <Receipt className="h-6 w-6 text-white/10" />
          </div>
        </div>

        {/* ── Action buttons (NOT included in capture) ── */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 disabled:opacity-50"
          >
            {copied ? <Check size={16} className="text-cyan-primary" /> : <Share2 size={16} />}
            {copied ? 'Copied!' : sharing ? 'Sharing...' : 'Share'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-primary px-5 py-3.5 text-sm font-black text-primary-dark transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-primary/25 disabled:opacity-60"
          >
            <Download size={16} />
            {downloading ? 'Saving...' : 'Download'}
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-white/25">
          Close or download to go to your orders
        </p>
      </div>
    </div>
  );
}

const ReceiptRow = ({ label, value, mono = false, highlight = false }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xs text-white/35">{label}</span>
    <span
      className={`text-right text-sm font-bold ${
        highlight ? 'text-cyan-primary' : 'text-white'
      } ${mono ? 'font-mono text-xs' : ''}`}
    >
      {value}
    </span>
  </div>
);
