import { useState, useEffect } from "react";
import { MessageSquare, Loader2, Circle } from "lucide-react";
import { getThreads } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "../../utils/dateUtils";

const ChatSidebar = ({ onSelectThread, selectedThreadId }) => {
  const { user, userProfile } = useAuth();
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !userProfile?.role) return;

    setIsLoading(true);
    const unsubscribe = getThreads(
      user.uid,
      userProfile.role,
      (fetchedThreads) => {
        setThreads(fetchedThreads);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, userProfile?.role]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader2 className="w-6 h-6 text-cyan-primary animate-spin" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <MessageSquare className="w-12 h-12 text-white/20 mb-3" />
        <p className="text-sm text-light-gray/60">No conversations yet</p>
        <p className="text-xs text-white/40 mt-1">
          Chat will appear when you have orders
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-primary-dark/30 border-r border-white/5">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">Messages</h2>
        <p className="text-xs text-white/40 mt-1">
          {threads.length} conversation{threads.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onSelectThread(thread)}
            className={`w-full text-left p-4 border-b border-white/5 transition-colors ${
              selectedThreadId === thread.id
                ? "bg-cyan-primary/10 border-cyan-primary/20"
                : "hover:bg-white/5"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-dark/60 rounded-full flex items-center justify-center border border-white/10">
                <MessageSquare className="w-5 h-5 text-cyan-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white truncate">
                    {thread.serviceTitle}
                  </h3>
                  {thread.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-cyan-primary rounded-full flex items-center justify-center text-[10px] font-medium text-primary-dark">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-1 truncate">
                  {thread.lastMessage?.senderName}: {thread.lastMessage?.text}
                </p>
                <p className="text-[10px] text-white/30 mt-1">
                  {thread.lastMessage?.createdAt?.toDate?.()
                    ? formatDistanceToNow(thread.lastMessage.createdAt.toDate())
                    : "Recently"}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
