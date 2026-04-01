import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, RotateCcw, AlertCircle, CheckCircle, MessageSquare,
  Send, Loader2
} from 'lucide-react';
import { Button } from '../ui/Primitives';

/**
 * RevisionRequestModal - Client interface for requesting revisions
 * Max 3 revisions, tracks revision count, sends feedback to worker
 */
const RevisionRequestModal = ({
  order,
  onClose,
  onSubmit,
  maxRevisions = 3,
}) => {
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentRevisionCount = order?.revisionCount || 0;
  const remainingRevisions = maxRevisions - currentRevisionCount;
  const hasRevisionsLeft = remainingRevisions > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!revisionNotes.trim()) {
      setError('Please describe the changes you need.');
      return;
    }
    if (revisionNotes.length < 30) {
      setError('Please provide more detail (at least 30 characters).');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit({
        revisionNotes: revisionNotes.trim(),
        revisionCount: currentRevisionCount + 1,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to request revision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[#0B0F13] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <RotateCcw size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic">Request Revision</h2>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-1">
                Order #{order?.id?.slice(-8)?.toUpperCase()}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Revision Status */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                  Revisions Used
                </span>
                <span className={`text-[10px] font-mono uppercase ${hasRevisionsLeft ? 'text-emerald-400' : 'text-red-400'}`}>
                  {currentRevisionCount} / {maxRevisions}
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${hasRevisionsLeft ? 'bg-emerald-400' : 'bg-red-400'}`}
                  style={{ width: `${(currentRevisionCount / maxRevisions) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {!hasRevisionsLeft ? (
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
              <h3 className="text-lg font-bold text-white mb-2">No Revisions Remaining</h3>
              <p className="text-sm text-white/50 mb-4">
                You have used all {maxRevisions} allowed revisions for this order.
                Please contact support if you need additional changes.
              </p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">
                  Revision Details ({remainingRevisions} remaining)
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Describe what needs to be changed, added, or fixed. Be specific so the worker can understand exactly what you need."
                  className="w-full min-h-[140px] bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:border-cyan-primary focus:outline-none resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-mono text-white/20">
                    {revisionNotes.length} / 1000
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/60">
                    Min 30 characters
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-[2]"
                  disabled={isSubmitting || !revisionNotes.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Request Revision
                    </>
                  )}
                </Button>
              </div>

              <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 text-center">
                This will notify the worker and change order status to "Revision Requested"
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RevisionRequestModal;
