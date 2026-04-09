import { useEffect, useRef, useState } from "react";
import {
  Download,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { uploadOrderFile } from "../../services/chatService";

const resolveUploadType = (type) => (type === "deliverable" ? "delivery" : "reference");

const getFileIcon = (fileName = "", mimeType = "") => {
  if (/image/i.test(mimeType) || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)) {
    return <ImageIcon size={18} />;
  }

  if (/pdf|text/i.test(mimeType) || /\.(pdf|doc|docx|txt)$/i.test(fileName)) {
    return <FileText size={18} />;
  }

  return <File size={18} />;
};

const FileUploader = ({ orderId, type = "reference", canUpload = true }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const uploadType = resolveUploadType(type);

  useEffect(() => {
    if (!orderId) return undefined;

    const uploadsQuery = query(
      collection(db, "uploads"),
      where("orderId", "==", orderId),
      where("uploadType", "==", uploadType)
    );

    const unsubscribe = onSnapshot(uploadsQuery, (snapshot) => {
      const nextFiles = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));

      nextFiles.sort((left, right) => {
        const leftTime =
          left.createdAt?.toMillis?.() || new Date(left.createdAt || 0).getTime() || 0;
        const rightTime =
          right.createdAt?.toMillis?.() || new Date(right.createdAt || 0).getTime() || 0;
        return rightTime - leftTime;
      });

      setFiles(nextFiles);
    });

    return () => unsubscribe();
  }, [orderId, uploadType]);

  const handleUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !orderId) return;

    setUploading(true);
    try {
      await uploadOrderFile({
        orderId,
        file: selectedFile,
        uploadType,
        message:
          uploadType === "delivery"
            ? "Work uploaded for review"
            : `Reference shared: ${selectedFile.name}`,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {files.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-black/20 px-6 py-10 text-center text-[11px] font-mono uppercase tracking-[0.2em] text-white/24">
            No {uploadType === "delivery" ? "delivery previews" : "reference files"} yet
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04] text-cyan-primary">
                  {getFileIcon(file.fileName, file.mimeType)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white/84">
                    {file.fileName || "Uploaded file"}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/22">
                    v{file.version || 1} {file.previewOnly ? "preview-only" : "download-ready"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {file.downloadable ? (
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-primary/20 bg-cyan-primary/10 px-3 py-2 text-sm font-semibold text-cyan-primary"
                  >
                    <Download size={14} />
                    Download
                  </a>
                ) : (
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/70"
                  >
                    Preview
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {canUpload && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] border border-cyan-primary/20 bg-cyan-primary/10 px-4 py-4 text-sm font-black text-cyan-primary transition hover:border-cyan-primary/40 disabled:opacity-60"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploadType === "delivery" ? "Upload Delivery Preview" : "Upload Reference"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
