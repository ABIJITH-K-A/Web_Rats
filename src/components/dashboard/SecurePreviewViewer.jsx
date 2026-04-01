import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, File, FileText, Image as ImageIcon, 
  Archive, Lock, Eye, Loader2, AlertCircle
} from 'lucide-react';

/**
 * SecurePreviewViewer - View-only file preview with download prevention
 * Shows preview files but prevents saving/downloading
 */
const SecurePreviewViewer = ({
  fileUrl,
  fileName,
  fileType,
  onClose,
  isPaid = false,
  onRequestPayment,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWatermark, setShowWatermark] = useState(true);

  useEffect(() => {
    // Disable right-click on the preview area
    const handleContextMenu = (e) => {
      if (!isPaid) {
        e.preventDefault();
        return false;
      }
    };

    // Disable keyboard shortcuts for saving
    const handleKeyDown = (e) => {
      if (!isPaid) {
        // Block Ctrl+S, Ctrl+P, Ctrl+Shift+S
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
          e.preventDefault();
          return false;
        }
        // Block Print Screen (limited effectiveness)
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          return false;
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaid]);

  const getFileIcon = () => {
    const ext = fileName?.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return <ImageIcon size={48} />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText size={48} />;
    if (['zip', 'rar', '7z'].includes(ext)) return <Archive size={48} />;
    return <File size={48} />;
  };

  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileName?.split('.').pop().toLowerCase());
  const isPDF = fileName?.toLowerCase().endsWith('.pdf');

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[170] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      >
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-white/60">Failed to load preview</p>
          <button onClick={onClose} className="mt-4 text-cyan-primary hover:underline">
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[170] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary">
            {getFileIcon()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-[300px] md:max-w-[500px]">
              {fileName}
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              {isPaid ? 'Full Access' : 'Preview Only'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isPaid && (
            <button
              onClick={onRequestPayment}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-primary text-black text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform"
            >
              <Lock size={14} />
              Unlock Full Access
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="relative w-full h-full max-w-6xl max-h-[80vh] mt-16 mb-4 rounded-3xl overflow-hidden bg-black/50 border border-white/10">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="text-cyan-primary animate-spin" />
          </div>
        )}

        {/* Watermark Overlay */}
        {!isPaid && showWatermark && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.08] transform -rotate-45">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="text-4xl font-black text-white whitespace-nowrap absolute"
                  style={{
                    top: `${i * 15}%`,
                    left: '-20%',
                    right: '-20%',
                    transform: `translateY(${i % 2 === 0 ? 0 : 50}px)`,
                  }}
                >
                  TN WEB RATS • PREVIEW ONLY • CONFIDENTIAL • TN WEB RATS • PREVIEW ONLY • CONFIDENTIAL •
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restricted Access Overlay for non-images */}
        {!isPaid && !isImage && !isPDF && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="text-center p-8">
              <Lock size={48} className="mx-auto mb-4 text-cyan-primary/50" />
              <h4 className="text-lg font-bold text-white mb-2">Download Restricted</h4>
              <p className="text-sm text-white/50 mb-6 max-w-sm">
                This file type can only be downloaded after payment is complete.
              </p>
              <button
                onClick={onRequestPayment}
                className="px-6 py-3 rounded-xl bg-cyan-primary text-black font-black uppercase tracking-wider hover:scale-105 transition-transform"
              >
                Pay to Unlock
              </button>
            </div>
          </div>
        )}

        {/* File Content */}
        <div className="w-full h-full flex items-center justify-center p-8">
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain select-none"
              style={{ 
                pointerEvents: isPaid ? 'auto' : 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
              draggable={false}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          ) : isPDF ? (
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              title={fileName}
              onLoad={() => setLoading(false)}
              style={{ pointerEvents: isPaid ? 'auto' : 'auto' }}
            />
          ) : (
            <div className="text-center">
              {getFileIcon()}
              <p className="mt-4 text-white/60 text-sm">{fileName}</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        {!isPaid && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40">
              <Eye size={12} />
              View-only preview • Screenshots and downloads are monitored
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SecurePreviewViewer;
