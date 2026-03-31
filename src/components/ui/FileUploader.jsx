import { useState, useRef } from 'react';
import { 
  Upload, X, File, FileText, Image as ImageIcon, 
  Archive, CheckCircle2, Loader2, AlertCircle,
  Download, ExternalLink, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage, db } from '../../config/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';

/**
 * FileUploader - A unified attachment sorter for references and deliverables.
 * @param {string} orderId - The ID of the order.
 * @param {string} type - 'reference' | 'deliverable'
 * @param {Array} existingFiles - List of existing file metadata.
 * @param {boolean} canUpload - Whether the current user can upload.
 * @param {boolean} canDelete - Whether the current user can delete.
 */
const FileUploader = ({ 
  orderId, 
  type = 'reference', 
  existingFiles = [], 
  canUpload = true, 
  canDelete = false 
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return <ImageIcon size={18} />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText size={18} />;
    if (['zip', 'rar', '7z'].includes(ext)) return <Archive size={18} />;
    return <File size={18} />;
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    setError(null);
  };

  const removeSelectedFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    const uploadPromises = files.map(async (file) => {
      const storagePath = `orders/${orderId}/${type}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(prev => ({ ...prev, [file.name]: p }));
          },
          (err) => {
            console.error("Upload error:", err);
            reject(err);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const fileMeta = {
              name: file.name,
              url: downloadURL,
              path: storagePath,
              type,
              uploadedAt: new Date().toISOString(),
              size: file.size
            };

            // Update Firestore
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
              attachments: arrayUnion(fileMeta),
              updatedAt: serverTimestamp()
            });

            resolve(fileMeta);
          }
        );
      });
    });

    try {
      await Promise.all(uploadPromises);
      setFiles([]);
      setProgress({});
    } catch (err) {
      setError("Some files failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileMeta) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, fileMeta.path);
      await deleteObject(storageRef);

      // 2. Remove from Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        attachments: arrayRemove(fileMeta),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete file.");
    }
  };

  const filteredExisting = existingFiles.filter(f => f.type === type);

  return (
    <div className="space-y-6">
      {/* Existing Files List */}
      <div className="space-y-3">
        {filteredExisting.length > 0 ? (
          filteredExisting.map((file, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 group hover:border-cyan-primary/20 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-cyan-primary">
                  {getFileIcon(file.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white/90 truncate">{file.name}</div>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-cyan-primary transition-colors"
                  title="View/Download"
                >
                  <ExternalLink size={16} />
                </a>
                {canDelete && (
                  <button 
                    onClick={() => handleDelete(file)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 italic">
              No {type}s uploaded yet
            </p>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      {canUpload && (
        <div className="space-y-4">
          <input 
            type="file" 
            multiple 
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
          
          {files.length === 0 ? (
            <button 
              onClick={() => fileInputRef.current.click()}
              className="w-full py-10 rounded-[32px] border-2 border-dashed border-cyan-primary/10 bg-cyan-primary/2 hover:bg-cyan-primary/5 hover:border-cyan-primary/30 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-white/80">Upload {type === 'reference' ? 'References' : 'Deliverables'}</div>
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Select or drag & drop files</div>
              </div>
            </button>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-[32px] p-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-cyan-primary">{getFileIcon(file.name)}</div>
                      <div className="text-xs text-white/70 truncate">{file.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {progress[file.name] !== undefined && (
                        <div className="text-[10px] font-mono text-cyan-primary">{Math.round(progress[file.name])}%</div>
                      )}
                      <button 
                        onClick={() => removeSelectedFile(i)}
                        disabled={uploading}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-colors disabled:opacity-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setFiles([])}
                  disabled={uploading}
                  className="flex-1 py-3 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  Clear
                </button>
                <button 
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="flex-[2] py-3 rounded-2xl bg-cyan-primary text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Confirm Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;