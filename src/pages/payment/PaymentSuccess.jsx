import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Home, ShoppingBag, Sparkles, ArrowRight, Receipt } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      navigate("/marketplace");
    }
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Main Card */}
        <div className="rounded-[30px] border border-white/10 bg-[#121417] p-8 shadow-2xl">
          {/* Animated Success Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              <CheckCircle className="h-12 w-12 text-green-400" strokeWidth={1.5} />
            </motion.div>
          </motion.div>

          {/* Sparkles Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center gap-2 mb-4"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
              >
                <Sparkles className="h-4 w-4 text-cyan-primary" />
              </motion.div>
            ))}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-2 text-center text-3xl font-black text-white tracking-tight"
          >
            Payment Successful!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 text-center text-sm text-white/50"
          >
            Thank you for your purchase. Your order has been confirmed and is being processed.
          </motion.p>

          {/* Order Details Card */}
          {orderId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 rounded-2xl border border-white/8 bg-white/[0.02] p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-primary/10">
                  <Receipt className="h-5 w-5 text-cyan-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/30">Order ID</p>
                  <p className="font-mono text-sm font-medium text-white">{orderId}</p>
                </div>
              </div>
              
              <div className="h-px bg-white/10 mb-4" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Status</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 border border-green-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Confirmed
                </span>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <Link
              to="/my-orders"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-primary px-6 py-4 text-sm font-black uppercase tracking-[0.1em] text-primary-dark transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-primary/20"
            >
              <ShoppingBag className="h-5 w-5" />
              View My Orders
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link
              to="/marketplace"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-transparent px-6 py-4 text-sm font-medium text-white transition-all hover:bg-white/5"
            >
              <Home className="h-5 w-5" />
              Continue Shopping
            </Link>
          </motion.div>

          {/* Auto-redirect notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center text-xs text-white/30"
          >
            Redirecting to marketplace in{" "}
            <span className="text-cyan-primary font-mono">{countdown}s</span>
          </motion.p>
        </div>

        {/* Support Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-center text-xs text-white/30"
        >
          Need help?{" "}
          <Link to="/contact" className="text-cyan-primary hover:underline">
            Contact Support
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
