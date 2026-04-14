import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ConversationList from './ConversationList';
import ActiveChat from './ActiveChat';
import { MessageSquare } from 'lucide-react';
import BackButton from '../ui/BackButton';
import { useAuth } from '../../context/AuthContext';

const MessagingCenter = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedThreadId, setSelectedThreadId] = useState(searchParams.get('id') || null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Responsive handling
    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync state with URL
    useEffect(() => {
        const id = searchParams.get('id');
        if (id !== selectedThreadId) {
            // Defer update to avoid cascading render warning
            setTimeout(() => setSelectedThreadId(id), 0);
        }
    }, [searchParams, selectedThreadId]);

    const handleSelectThread = (thread) => {
        setSearchParams({ id: thread.id });
        setSelectedThreadId(thread.id);
    };

    const handleBackToList = () => {
        setSearchParams({});
        setSelectedThreadId(null);
    };

    if (!user) return null;

    return (
        <div className="flex h-screen w-full bg-[#0D0F0D] text-white overflow-hidden">
            {/* Sidebar / Conversation List */}
            <div className={`
                ${isMobileView && selectedThreadId ? 'hidden' : 'flex'} 
                w-full lg:w-[400px] flex-col border-r border-white/5 bg-[#121417]
            `}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton onClick={() => navigate(-1)} label="Back" compact />
                        <h1 className="text-xl font-black tracking-tight">Messages</h1>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <ConversationList 
                        selectedId={selectedThreadId} 
                        onSelect={handleSelectThread} 
                    />
                </div>
            </div>

            {/* Chat Area */}
            <div className={`
                ${isMobileView && !selectedThreadId ? 'hidden' : 'flex'} 
                flex-1 flex-col relative
            `}>
                {selectedThreadId ? (
                    <ActiveChat 
                        threadId={selectedThreadId} 
                        onBack={handleBackToList}
                        isMobile={isMobileView}
                    />
                ) : (
                    <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-12 bg-black/20">
                        <div className="w-20 h-20 rounded-3xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary mb-6 animate-pulse">
                            <MessageSquare size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Your Inbox</h2>
                        <p className="text-light-gray/40 max-w-sm">
                            Select a conversation from the left to view project details, send files, and chat with team members.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagingCenter;
