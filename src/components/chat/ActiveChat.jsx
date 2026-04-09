import React, { useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AnimatedPaymentButton from "../ui/AnimatedPaymentButton";
import BackButton from "../ui/BackButton";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/apiClient";
import {
  getConversationById,
  requestRevision,
  sendMessage,
  subscribeToThread,
  uploadOrderFile,
} from "../../services/chatService";

const isImageFile = (fileUrl = "", fileName = "") =>
  /\.(jpg|jpeg|png|webp|gif)$/i.test(fileUrl) ||
  /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);

const isPdfFile = (fileUrl = "", fileName = "") =>
  /\.pdf$/i.test(fileUrl) || /\.pdf$/i.test(fileName);

const formatTime = (value) => {
  if (value?.toDate) {
    return value.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const date = new Date(value || Date.now());
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessagePreview = ({ message }) => {
  if (!message.fileUrl) return null;

  if (isImageFile(message.fileUrl, message.fileName)) {
    return (
      <img
        src={message.fileUrl}
        alt={message.fileName || "Uploaded preview"}
        className="mt-3 max-h-64 w-full rounded-2xl object-cover"
      />
    );
  }

  if (isPdfFile(message.fileUrl, message.fileName)) {
    return (
      <iframe
        src={message.fileUrl}
        title={message.fileName || "PDF preview"}
        className="mt-3 h-64 w-full rounded-2xl border border-white/8 bg-white"
      />
    );
  }

  return (
    <a
      href={message.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-cyan-primary transition hover:border-cyan-primary/30"
    >
      Open preview
    </a>
  );
};

const RevisionModal = ({
  isOpen,
  value,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  requiresPayment,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#121417] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Request Revision
            </div>
            <h3 className="mt-2 text-2xl font-black text-white">Tell the worker what to change</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Explain the edits clearly so the next delivery is faster and cleaner."
          className="mt-6 min-h-[160px] w-full rounded-[1.5rem] border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-primary/40"
        />

        {requiresPayment && (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Included revisions are finished. Submitting now will open the Rs 20 payment flow for an extra revision.
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/72 transition hover:text-white"
          >
            Cancel
          </button>
          <AnimatedPaymentButton
            onClick={onSubmit}
            disabled={value.trim().length < 5}
            processing={isSubmitting}
            idleIcon={Send}
            idleLabel={requiresPayment ? "Pay and Request" : "Confirm Revision"}
            processingLabel={requiresPayment ? "Opening payment..." : "Submitting revision..."}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};

const ActiveChat = ({ threadId, onBack, isMobile }) => {
  const { user, userProfile } = useAuth();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const isClient = userProfile?.role === "client";
  const extraRevisionRequired =
    Number(thread?.revisionsUsed || 0) >= Number(thread?.revisionLimit || 1) &&
    Number(thread?.paidRevisionCredits || 0) <= 0;

  useEffect(() => {
    if (!threadId) return;

    const loadThread = async () => {
      setIsLoading(true);
      try {
        const data = await getConversationById(threadId);
        setThread(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadThread();
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;

    const unsubscribe = subscribeToThread(threadId, setMessages);
    return () => unsubscribe();
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event) => {
    event?.preventDefault();
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    try {
      await sendMessage(threadId, {
        text: newMessage.trim(),
        userId: user.uid,
        userName: userProfile?.name || user.email || "User",
        userRole: userProfile?.role || "client",
        type: "text",
      });
      setNewMessage("");
    } catch (error) {
      toast.error(error.message || "Could not send the message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadOrderFile({
        orderId: threadId,
        file,
        uploadType: isClient ? "reference" : "delivery",
        message: isClient ? `Reference shared: ${file.name}` : "Work uploaded for review",
      });
      toast.success(isClient ? "Reference uploaded" : "Delivery preview uploaded");
    } catch (error) {
      toast.error(error.message || "File upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmitRevision = async () => {
    if (!revisionMessage.trim()) return;

    setIsSubmittingRevision(true);
    try {
      await requestRevision(threadId, revisionMessage.trim());
      toast.success("Revision request sent");
      setRevisionMessage("");
      setIsRevisionModalOpen(false);
      setThread((current) =>
        current
          ? {
              ...current,
              revisionsUsed: Number(current.revisionsUsed || 0) + 1,
            }
          : current
      );
    } catch (error) {
      if (error.requiresPayment || error.statusCode === 402) {
        const response = await apiRequest("/payment/create-intent", {
          method: "POST",
          authMode: "required",
          body: {
            kind: "revision",
            referenceId: threadId,
          },
        });

        if (response?.paymentSessionId) {
          window.location.href = `https://payments.cashfree.com/checkout?session_id=${response.paymentSessionId}`;
          return;
        }
      }

      toast.error(error.message || "Could not request revision.");
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0D0F0D]">
        <Loader2 size={28} className="animate-spin text-cyan-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#0D0F0D]">
      <header className="flex h-20 items-center justify-between border-b border-white/5 bg-[#121417]/90 px-6 backdrop-blur">
        <div className="flex items-center gap-4">
          {isMobile && (
            <BackButton onClick={onBack} label="Back" compact />
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-primary/10 text-cyan-primary">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">
              {thread?.serviceTitle || thread?.subject || "Order Chat"}
            </h2>
            <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/24">
              Real-time order chat and delivery
            </div>
          </div>
        </div>

        <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
          {thread?.status || "active"}
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-white/24">
            <MessageSquare size={38} className="mb-4 opacity-30" />
            <div className="text-lg font-black text-white/48">No messages yet</div>
            <p className="mt-2 max-w-sm text-sm leading-6">
              Use this thread to share references, deliver work, and coordinate revisions for the order.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === user?.uid;
            const isDelivery = message.type === "delivery";
            const showRevisionButton = isClient && isDelivery;

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-[1.75rem] border px-4 py-4 ${
                    isMine
                      ? "border-cyan-primary/20 bg-cyan-primary/10 text-white"
                      : "border-white/8 bg-[#121417] text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
                    <span>{message.senderName || message.senderRole || "Team"}</span>
                    <span>{formatTime(message.createdAt)}</span>
                  </div>

                  {message.message && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/82">
                      {message.message}
                    </p>
                  )}

                  <MessagePreview message={message} />

                  {message.fileUrl && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!message.previewOnly && (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-cyan-primary/20 bg-cyan-primary/10 px-4 py-2 text-sm font-semibold text-cyan-primary transition hover:border-cyan-primary/40"
                        >
                          Download
                        </a>
                      )}
                      {message.previewOnly && (
                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
                          Preview only. Download unlocks after approval or payment.
                        </div>
                      )}
                    </div>
                  )}

                  {showRevisionButton && (
                    <button
                      type="button"
                      onClick={() => setIsRevisionModalOpen(true)}
                      className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/78 transition hover:border-cyan-primary/30 hover:text-cyan-primary"
                    >
                      Request Revision
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      <footer className="border-t border-white/5 bg-[#121417]/90 p-6 backdrop-blur">
        <form
          onSubmit={handleSend}
          className="flex items-end gap-3 rounded-[2rem] border border-white/10 bg-[#0D0F0D] p-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-white/48 transition hover:text-white disabled:opacity-60"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>

          <textarea
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                handleSend(event);
              }
            }}
            placeholder={isClient ? "Message the worker or share more context..." : "Send project update..."}
            rows={1}
            className="max-h-40 min-h-[48px] flex-1 resize-none bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
          />

          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-primary text-black transition hover:scale-[1.02] disabled:opacity-60"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-white/18">
          <span>{isClient ? "Upload references from here" : "Delivery uploads stay preview-only"}</span>
          <span>{extraRevisionRequired ? "Extra revision requires payment" : "Included revision available"}</span>
        </div>
      </footer>

      <RevisionModal
        isOpen={isRevisionModalOpen}
        value={revisionMessage}
        onChange={setRevisionMessage}
        onClose={() => setIsRevisionModalOpen(false)}
        onSubmit={handleSubmitRevision}
        isSubmitting={isSubmittingRevision}
        requiresPayment={extraRevisionRequired}
      />
    </div>
  );
};

export default ActiveChat;
