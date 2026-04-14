import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Shield, MessageSquare, Clock, 
  CheckCircle, X, ChevronDown, ChevronUp, Flag,
  FileText, User, DollarSign, Send
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, updateDoc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import {
  notifyDisputeRaised,
  notifyDisputeReply,
  notifyDisputeResolved,
} from '../../../services/notificationService';

const getAssignedParticipantIds = (record = {}) =>
  Array.from(
    new Set(
      [
        record.assignedTo,
        record.workerAssigned,
        ...(Array.isArray(record.assignedWorkers) ? record.assignedWorkers : []),
      ].filter(Boolean)
    )
  );

const DisputeResolutionView = () => {
  const { user, userProfile } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, resolved
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [raiseForm, setRaiseForm] = useState({
    orderId: '',
    type: 'quality', // quality, payment, deadline, other
    description: '',
    requestedAmount: '',
  });

  // Real-time disputes listener
  useEffect(() => {
    if (!user) return;

    const role = userProfile?.role;
    const unsubscribe = onSnapshot(
      query(collection(db, 'disputes'), orderBy('createdAt', 'desc')),
      (snap) => {
        const disputesData = snap.docs
          .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
          .filter((dispute) => {
            if (role === 'client') {
              return dispute.raisedBy === user.uid;
            }

            if (role === 'worker') {
              const assignedIds = [
                dispute.assignedTo,
                dispute.workerAssigned,
                ...(Array.isArray(dispute.assignedWorkers)
                  ? dispute.assignedWorkers
                  : []),
              ].filter(Boolean);

              return assignedIds.includes(user.uid);
            }

            return true;
          });

        setDisputes(disputesData);
        setLoading(false);
      },
      (err) => {
        console.error('Disputes error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userProfile]);

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!raiseForm.orderId || !raiseForm.description) return;

    try {
      // Verify order exists
      const orderSnap = await getDoc(doc(db, 'orders', raiseForm.orderId));
      if (!orderSnap.exists()) {
        alert('Order not found');
        return;
      }

      const order = orderSnap.data();
      const assignedWorkers = getAssignedParticipantIds(order);

      // Create dispute
      const disputeRef = await addDoc(collection(db, 'disputes'), {
        orderId: raiseForm.orderId,
        orderDisplayId: raiseForm.orderId.slice(-8).toUpperCase(),
        raisedBy: user.uid,
        raisedByName: userProfile?.name || user.email,
        raisedByRole: userProfile?.role || 'client',
        assignedTo: assignedWorkers[0] || null,
        workerAssigned: order.workerAssigned || order.assignedTo || assignedWorkers[0] || null,
        assignedWorkers,
        type: raiseForm.type,
        description: raiseForm.description,
        requestedAmount: Number(raiseForm.requestedAmount) || 0,
        status: 'pending', // pending -> under_review -> resolved -> closed
        resolution: null,
        refundAmount: 0,
        penaltyAmount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [
          {
            senderId: user.uid,
            senderName: userProfile?.name || user.email,
            message: raiseForm.description,
            timestamp: serverTimestamp(),
            type: 'initial',
          }
        ],
        timeline: [
          {
            action: 'dispute_raised',
            by: user.uid,
            at: serverTimestamp(),
          }
        ],
      });

      await notifyDisputeRaised({
        disputeId: disputeRef.id,
        orderId: raiseForm.orderId,
        orderDisplayId: raiseForm.orderId.slice(-8).toUpperCase(),
        raisedByName: userProfile?.name || user.email,
        disputeType: raiseForm.type,
        workerIds: assignedWorkers,
      });

      setShowRaiseModal(false);
      setRaiseForm({ orderId: '', type: 'quality', description: '', requestedAmount: '' });
      alert('Dispute raised successfully');
    } catch (err) {
      console.error('Raise dispute error:', err);
      alert('Failed to raise dispute');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return;

    const message = {
      senderId: user.uid,
      senderName: userProfile?.name || user.email,
      senderRole: userProfile?.role,
      message: newMessage.trim(),
      timestamp: serverTimestamp(),
      type: 'reply',
    };

    try {
      await updateDoc(doc(db, 'disputes', selectedDispute.id), {
        messages: [...(selectedDispute.messages || []), message],
        updatedAt: serverTimestamp(),
      });
      await notifyDisputeReply({
        disputeId: selectedDispute.id,
        orderId: selectedDispute.orderId,
        orderDisplayId: selectedDispute.orderDisplayId,
        senderId: user.uid,
        senderName: userProfile?.name || user.email,
        recipientIds: [
          selectedDispute.raisedBy,
          ...getAssignedParticipantIds(selectedDispute),
            ...(['owner', 'admin'].includes(userProfile?.role)
              ? []
              : ['admin']),
          ],
        });
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleResolve = async (resolution, refundAmount = 0, penaltyAmount = 0) => {
    if (!selectedDispute) return;

    try {
      await updateDoc(doc(db, 'disputes', selectedDispute.id), {
        status: 'resolved',
        resolution,
        refundAmount,
        penaltyAmount,
        resolvedBy: user.uid,
        resolvedByName: userProfile?.name,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timeline: [
          ...(selectedDispute.timeline || []),
          {
            action: 'dispute_resolved',
            resolution,
            refundAmount,
            penaltyAmount,
            by: user.uid,
            at: serverTimestamp(),
          }
        ],
      });

      await notifyDisputeResolved({
        disputeId: selectedDispute.id,
        orderId: selectedDispute.orderId,
        orderDisplayId: selectedDispute.orderDisplayId,
        resolution,
        raisedBy: selectedDispute.raisedBy,
        workerIds: getAssignedParticipantIds(selectedDispute),
      });

      setSelectedDispute(null);
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  const filteredDisputes = disputes.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-[#1f1f0f] text-yellow-500 border-yellow-500/20';
      case 'under_review': return 'bg-[#0f1f3f] text-blue-500 border-blue-500/20';
      case 'resolved': return 'bg-[#0f1f15] text-green-500 border-green-500/20';
      case 'closed': return 'bg-[#1a1f1a] text-white/60 border-white/20';
      default: return 'bg-[#121417] text-white/40';
    }
  };

  const isAdmin = ['owner', 'admin'].includes(userProfile?.role);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white italic">
            Dispute Resolution{' '}
            <span className="ml-2 text-sm font-mono uppercase tracking-[0.2em] text-cyan-primary not-italic">
              // Order Conflicts
            </span>
          </h2>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/40">
            Raise and resolve order quality, payment, or deadline disputes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#121417] px-4 py-2 text-xs outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>

          <button
            onClick={() => setShowRaiseModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0f1f0f] border border-cyan-primary/30 px-4 py-2 text-xs font-bold text-cyan-primary hover:bg-[#0f2f15] transition-colors"
          >
            <Flag size={14} /> Raise Dispute
          </button>
        </div>
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-cyan-primary animate-pulse text-sm font-mono">Loading disputes...</div>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="rounded-[2rem] border border-white/8 bg-[#121417] p-12 text-center">
          <Shield size={48} className="mx-auto mb-4 text-white/20" />
          <h3 className="text-lg font-bold text-white mb-2">No disputes found</h3>
          <p className="text-sm text-white/40">
            All orders are running smoothly. Disputes will appear here if issues arise.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDisputes.map((dispute) => (
            <motion.div
              key={dispute.id}
              layout
              onClick={() => setSelectedDispute(dispute)}
              className="cursor-pointer rounded-[1.5rem] border border-white/8 bg-[#121417] p-6 hover:border-cyan-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(dispute.status)}`}>
                      {dispute.status?.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      {dispute.type}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">
                    Order #{dispute.orderDisplayId}
                  </h3>

                  <p className="text-sm text-white/50 line-clamp-2 mb-3">
                    {dispute.description}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-white/30 font-mono uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {dispute.raisedByName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {dispute.createdAt?.toDate?.().toLocaleDateString?.() || 'Just now'}
                    </span>
                    {dispute.requestedAmount > 0 && (
                      <span className="flex items-center gap-1 text-cyan-primary">
                        <DollarSign size={12} /> ₹{dispute.requestedAmount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-cyan-primary">
                  <ChevronDown size={20} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dispute Detail Modal */}
      <AnimatePresence>
        {selectedDispute && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDispute(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#121417] p-6 shadow-2xl"
            >
              <button
                onClick={() => setSelectedDispute(null)}
                className="absolute right-5 top-5 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(selectedDispute.status)}`}>
                  {selectedDispute.status?.replace('_', ' ')}
                </span>
                <h3 className="mt-3 text-2xl font-black text-white">
                  Dispute #{selectedDispute.id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-sm text-white/40 mt-1">
                  Order #{selectedDispute.orderDisplayId} • {selectedDispute.type}
                </p>
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto">
                {(selectedDispute.messages || []).map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl ${
                      msg.senderId === user.uid
                        ? 'bg-cyan-primary/10 border border-cyan-primary/20 ml-8'
                        : 'bg-white/5 border border-white/8 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-white">{msg.senderName}</span>
                      <span className="text-[10px] text-white/30">
                        {msg.timestamp?.toDate?.().toLocaleTimeString?.() || 'Now'}
                      </span>
                    </div>
                    <p className="text-sm text-white/70">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-3 bg-cyan-primary/20 border border-cyan-primary/30 rounded-xl text-cyan-primary hover:bg-cyan-primary/30 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>

              {/* Admin Resolution Actions */}
              {isAdmin && selectedDispute.status !== 'resolved' && (
                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-4">
                    Resolution Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleResolve('refund_approved', selectedDispute.requestedAmount, 0)}
                      className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-bold hover:bg-green-500/20 transition-colors"
                    >
                      Approve Refund
                    </button>
                    <button
                      onClick={() => handleResolve('partial_refund', Math.floor(selectedDispute.requestedAmount / 2), 0)}
                      className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-bold hover:bg-yellow-500/20 transition-colors"
                    >
                      Partial Refund
                    </button>
                    <button
                      onClick={() => handleResolve('penalty_applied', 0, selectedDispute.requestedAmount)}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-colors"
                    >
                      Apply Penalty
                    </button>
                    <button
                      onClick={() => handleResolve('rejected', 0, 0)}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                      Reject Claim
                    </button>
                  </div>
                </div>
              )}

              {/* Resolution Display */}
              {selectedDispute.status === 'resolved' && (
                <div className="border-t border-white/10 pt-6">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm font-bold text-green-500">Resolved</span>
                    </div>
                    <p className="text-sm text-white/60">
                      Resolution: {selectedDispute.resolution?.replace('_', ' ')}
                    </p>
                    {selectedDispute.refundAmount > 0 && (
                      <p className="text-sm text-cyan-primary mt-1">
                        Refund: ₹{selectedDispute.refundAmount}
                      </p>
                    )}
                    {selectedDispute.penaltyAmount > 0 && (
                      <p className="text-sm text-red-400 mt-1">
                        Penalty: ₹{selectedDispute.penaltyAmount}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Raise Dispute Modal */}
      <AnimatePresence>
        {showRaiseModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRaiseModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#121417] p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowRaiseModal(false)}
                className="absolute right-5 top-5 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={20} className="text-yellow-500" />
                  <span className="text-xs font-mono uppercase tracking-widest text-yellow-500">
                    Raise New Dispute
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Report an Issue
                </h3>
              </div>

              <form onSubmit={handleRaiseDispute} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/40 block mb-2">
                    Order ID *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Paste the full Order ID from your orders"
                    value={raiseForm.orderId}
                    onChange={(e) => setRaiseForm({ ...raiseForm, orderId: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/40 block mb-2">
                    Dispute Type *
                  </label>
                  <select
                    value={raiseForm.type}
                    onChange={(e) => setRaiseForm({ ...raiseForm, type: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-primary"
                  >
                    <option value="quality">Quality Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="deadline">Deadline Missed</option>
                    <option value="communication">Communication Problem</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/40 block mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the issue in detail..."
                    value={raiseForm.description}
                    onChange={(e) => setRaiseForm({ ...raiseForm, description: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-primary resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/40 block mb-2">
                    Requested Refund Amount (optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 5000"
                    value={raiseForm.requestedAmount}
                    onChange={(e) => setRaiseForm({ ...raiseForm, requestedAmount: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-cyan-primary text-primary-dark font-black text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(103, 248, 29,0.2)]"
                >
                  Submit Dispute
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DisputeResolutionView;
