import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, ChevronRight, Circle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getThreads } from "../../services/chatService";
import ChatThread from "./ChatThread";

const ChatWidget = () => {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [activeThreadOrder, setActiveThreadOrder] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen to all threads for the user
    // `getThreads` should ideally be a real-time listener too for unread badges,
    // but we can start by fetching them or using a snapshot listener in service.
    const unsubscribe = getThreads(user.uid, userProfile?.role || 'client', (updatedThreads) => {
      setThreads(updatedThreads);
      
      // Calculate total unread
      const unread = updatedThreads.reduce((acc, thread) => {
        // Assume thread document tracks unread counts per user
        return acc + (thread.unreadCount?.[user.uid] || 0);
      }, 0);
      setUnreadCount(unread);
    });

    return () => unsubscribe && unsubscribe();
  }, [user, userProfile]);

  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail?.activeOrder) {
        setActiveThreadOrder(e.detail.activeOrder);
      }
    };
    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  }, []);

  if (!user) return null; // Only show if logged in

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-primary text-black shadow-2xl shadow-cyan-primary/20 transition-transform hover:scale-110"
          >
            <MessageSquare size={24} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm sm:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-[101] flex w-full flex-col overflow-hidden bg-[#151921] shadow-2xl sm:bottom-6 sm:right-6 sm:top-auto sm:h-[600px] sm:w-[400px] sm:rounded-2xl sm:border sm:border-white/10"
            >
              {activeThreadOrder ? (
                // Active Thread View
                <ChatThread
                  order={activeThreadOrder}
                  onClose={() => setActiveThreadOrder(null)}
                />
              ) : (
                // Threads List View
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-5 py-4 backdrop-blur-md">
                    <div>
                      <h2 className="text-lg font-bold text-white">Messages</h2>
                      <p className="text-xs text-light-gray/60">Your order conversations</p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-full p-2 text-light-gray/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    {threads.length === 0 ? (
                      <div className="mt-20 flex flex-col items-center justify-center text-center text-light-gray/40">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p>No active conversations.</p>
                        <p className="mt-1 text-xs">When you place an order, a chat thread will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {threads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => setActiveThreadOrder({ id: thread.id, serviceTitle: thread.serviceTitle })}
                            className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-white/5"
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-cyan-primary">
                              <MessageSquare size={20} />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="truncate font-semibold text-white">
                                  {thread.serviceTitle || "Order Chat"}
                                </h4>
                                <span className="text-[10px] text-light-gray/40 shrink-0 ml-2">
                                  {thread.lastMessage?.createdAt?.toDate ? 
                                    thread.lastMessage.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                                    : "New"}
                                </span>
                              </div>
                              <p className="truncate text-sm text-light-gray/60">
                                {thread.lastMessage?.text || "No messages yet"}
                              </p>
                            </div>
                            
                            {(thread.unreadCount?.[user.uid] > 0) ? (
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-primary text-[10px] font-bold text-black">
                                {thread.unreadCount[user.uid]}
                              </div>
                            ) : (
                              <ChevronRight size={16} className="text-light-gray/20" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
