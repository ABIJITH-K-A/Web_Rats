import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessage, subscribeToThread, markMessagesAsRead } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "../../utils/dateUtils";

const ChatMessage = ({ message, isOwn }) => {
  const isSystem = message.messageType === "system";
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-light-gray/60">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] ${
          isOwn
            ? "bg-cyan-primary/20 border border-cyan-primary/30"
            : "bg-primary-dark/60 border border-white/10"
        } rounded-2xl px-4 py-3`}
      >
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-cyan-primary">
              {message.senderName}
            </span>
            <span className="text-[10px] text-white/40 uppercase">
              {message.senderRole}
            </span>
          </div>
        )}
        <p className="text-sm text-light-gray/90 leading-relaxed">
          {message.text || message.content || ''}
        </p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-white/40">
            {message.createdAt?.toDate?.()
              ? formatDistanceToNow(message.createdAt.toDate())
              : "Just now"}
          </span>
          {isOwn && (
            <span className="text-[10px] text-cyan-primary/60">
              {message.readBy?.length > 1 ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ChatWindow = ({ orderId, threadInfo, onClose }) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Subscribe to messages
  useEffect(() => {
    if (!orderId) return;

    setIsLoading(true);
    const unsubscribe = subscribeToThread(orderId, (fetchedMessages) => {
      setMessages(fetchedMessages);
      setIsLoading(false);
    });

    // Mark messages as read
    if (user?.uid) {
      markMessagesAsRead(orderId, user.uid);
    }

    return () => unsubscribe();
  }, [orderId, user?.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(orderId, {
        text: newMessage.trim(),
        userId: user.uid,
        userName: userProfile?.name || user.displayName || "Anonymous",
        userRole: userProfile?.role || "client",
        participants: threadInfo?.participants || [],
        messageType: "text",
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-primary-dark/30 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-dark/60 border-b border-white/5">
        <div>
          <h3 className="text-sm font-medium text-white">
            {threadInfo?.serviceTitle || `Order #${orderId}`}
          </h3>
          <p className="text-xs text-white/40">
            {threadInfo?.status || "Active"}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <span className="text-white/60">✕</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-cyan-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-cyan-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm text-light-gray/60 mb-1">No messages yet</p>
            <p className="text-xs text-white/40">
              Start the conversation by sending a message below
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.userId === user?.uid}
                userRole={userProfile?.role}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-end gap-2 p-4 bg-primary-dark/60 border-t border-white/5"
      >
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-primary-dark/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-light-gray placeholder:text-white/30 focus:outline-none focus:border-cyan-primary/50 resize-none max-h-[120px] min-h-[48px]"
            rows={1}
            style={{ height: "auto" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
          />
          <div className="absolute right-3 bottom-3 text-xs text-white/30">
            {newMessage.length}/500
          </div>
        </div>
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="p-3 bg-cyan-primary/20 hover:bg-cyan-primary/30 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-primary/30 rounded-xl transition-colors"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 text-cyan-primary animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-cyan-primary" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
