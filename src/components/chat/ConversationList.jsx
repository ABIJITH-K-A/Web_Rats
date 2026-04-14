import React, { useState, useEffect } from 'react';
import { getThreads } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { Clock, User as UserIcon, Shield } from 'lucide-react';
import { formatDateTime } from '../../utils/orderHelpers';

const ConversationList = ({ selectedId, onSelect }) => {
    const { user, userProfile } = useAuth();
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const handleUpdate = (updatedThreads) => {
            setThreads(updatedThreads);
            setLoading(false);
        };

        const unsubscribe = getThreads(user.uid, userProfile?.role, handleUpdate);
        return () => unsubscribe();
    }, [user, userProfile]);



    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-xl bg-white/5" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-3 w-2/3 bg-white/5 rounded" />
                            <div className="h-2 w-1/2 bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (threads.length === 0) {
        return (
            <div className="p-8 text-center text-white/20">
                <div className="mb-4 flex justify-center">
                    <UserIcon size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-semibold">No conversations found</p>
                <p className="text-[10px] mt-1 uppercase tracking-widest leading-loose">
                    Your project threads will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-white/5">
            {threads.map((thread) => {
                const isActive = selectedId === thread.id;
                const lastMsg = thread.lastMessage;
                const unread = thread.unreadCount > 0;

                return (
                    <button
                        key={thread.id}
                        onClick={() => onSelect(thread)}
                        className={`
                            relative w-full p-4 flex items-start gap-4 transition-all text-left
                            ${isActive ? 'bg-cyan-primary/3 border-l-2 border-cyan-primary' : 'hover:bg-white/2'}
                        `}
                    >
                        {/* Avatar */}
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border
                            ${unread ? 'bg-cyan-primary/10 border-cyan-primary/20 text-cyan-primary' : 'bg-white/5 border-white/5 text-white/20'}
                        `}>
                            <UserIcon size={20} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
                                    {thread.serviceTitle}
                                </h3>
                                <span className="text-[9px] font-mono text-white/20 uppercase whitespace-nowrap">
                                    {formatDateTime(thread.updatedAt)}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-1.5">
                                {thread.displayId && (
                                    <span className="text-[9px] font-mono text-cyan-primary/60">
                                        ID: {thread.displayId}
                                    </span>
                                )}
                                {thread.status && (
                                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">
                                        • {thread.status}
                                    </span>
                                )}
                            </div>

                            <p className={`
                                text-xs truncate
                                ${unread ? 'text-white/90 font-semibold' : 'text-white/40 font-medium'}
                            `}>
                                {(lastMsg?.userName || lastMsg?.senderName) && <span className="text-white/60">{lastMsg.userName || lastMsg.senderName}: </span>}
                                {lastMsg?.text || "No messages yet"}
                            </p>
                        </div>

                        {/* Unread Indicator */}
                        {unread && (
                            <div className="absolute right-4 bottom-4 flex items-center justify-center h-5 w-5 rounded-full bg-cyan-primary text-black text-[10px] font-black shadow-[0_0_15px_rgba(103,248,29,0.3)]">
                                {thread.unreadCount}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ConversationList;
