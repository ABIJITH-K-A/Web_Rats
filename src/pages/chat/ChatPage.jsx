import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import { getConversationById } from "../../services/chatService";

const ChatPage = () => {
  const { conversationId } = useParams();
  const [selectedThread, setSelectedThread] = useState(null);

  useEffect(() => {
    if (conversationId) {
      getConversationById(conversationId).then((thread) => {
        if (thread) {
          setSelectedThread({
            id: thread.id,
            serviceTitle: thread.subject,
            orderId: thread.orderId,
            status: "active",
          });
        }
      });
    }
  }, [conversationId]);

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
  };

  return (
    <div className="h-[calc(100vh-72px)] flex">
      {/* Sidebar - hidden on mobile when thread is selected */}
      <div
        className={`${
          selectedThread ? "hidden md:block" : "block"
        } w-full md:w-80 border-r border-white/10`}
      >
        <ChatSidebar
          onSelectThread={handleSelectThread}
          selectedThreadId={selectedThread?.id}
        />
      </div>

      {/* Chat Window */}
      <div
        className={`${
          selectedThread ? "block" : "hidden md:block"
        } flex-1 bg-primary-dark/20`}
      >
        {selectedThread ? (
          <ChatWindow
            orderId={selectedThread.orderId || selectedThread.id}
            threadInfo={{
              serviceTitle: selectedThread.serviceTitle,
              status: selectedThread.status,
            }}
            onClose={() => setSelectedThread(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-cyan-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Select a conversation
            </h2>
            <p className="text-sm text-light-gray/60 max-w-md">
              Choose a chat from the sidebar to start messaging with clients,
              workers, or team members
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
