import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  X, 
  Send, 
  Paperclip,
  User,
  Shield,
  Clock
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { subscribeToThread, sendMessage } from "../../services/chatService";

const ChatThread = ({ order, onClose }) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!order?.id) return;

    const unsubscribe = subscribeToThread(order.id, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [order?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !order?.id) return;

    const msgText = newMessage.trim();
    setNewMessage(""); 
    setIsSending(true);

    try {
      await sendMessage(order.id, {
        text: msgText,
        userId: user.uid,
        userName: userProfile?.name || userProfile?.displayName || user.email || "Unknown User",
        userRole: userProfile?.role || "client"
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optional: Add toast notification for failure
    } finally {
      setIsSending(false);
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      client: { bg: "bg-white/10", text: "text-white/70", icon: User },
      worker: { bg: "bg-cyan-primary/20", text: "text-cyan-primary", icon: Shield },
      manager: { bg: "bg-purple-500/20", text: "text-purple-400", icon: Shield },
      admin: { bg: "bg-red-500/20", text: "text-red-400", icon: Shield },
      owner: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Shield },
    };
    const style = roles[role] || roles.client;
    const Icon = style.icon;

    return (
      <div className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
        <Icon size={10} />
        {role}
      </div>
    );
  };

  if (!order) return null;

  return (
    <div className="flex h-full flex-col bg-[#10141a]">
      {/* Thread Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
        <div>
          <h3 className="font-bold text-white">Order: {order.serviceTitle || "Custom Service"}</h3>
          <p className="text-xs text-light-gray/60">ID: {order.id.slice(0, 8)}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-light-gray/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-light-gray/40">
            <MessageSquare size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.userId === user?.uid;
            const showHeader = idx === 0 || messages[idx - 1].userId !== msg.userId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {showHeader && (
                  <div className={`mb-1 flex items-center gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className="text-xs font-semibold text-light-gray/80">
                      {isMe ? "You" : msg.userName}
                    </span>
                    {!isMe && getRoleBadge(msg.userRole)}
                  </div>
                )}
                
                <div
                  className={`relative max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    isMe
                      ? "rounded-tr-sm bg-cyan-primary text-black"
                      : "rounded-tl-sm bg-white/10 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  
                  <div
                    className={`mt-1 flex items-center gap-1 text-[10px] ${
                      isMe ? "text-black/60" : "text-white/40"
                    }`}
                  >
                    <Clock size={10} />
                    {msg.createdAt?.toDate ? (
                      msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : "Just now"}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-black/40 p-4 backdrop-blur-md">
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#151921] p-2"
        >
          <button
            type="button"
            className="rounded-full p-2 text-light-gray/40 transition-colors hover:bg-white/10 hover:text-white"
            title="Attach file (coming soon)"
          >
            <Paperclip size={18} />
          </button>
          
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-light-gray/40"
            rows={1}
          />
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-primary text-black transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={16} className={isSending ? "animate-pulse" : ""} />
          </button>
        </form>
        <div className="mt-2 text-center text-[10px] text-light-gray/40">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
