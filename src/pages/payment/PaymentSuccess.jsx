import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Download, Home, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
          >
            <CheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>

          {/* Title */}
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Payment Successful!
          </h1>
          <p className="mb-6 text-gray-600">
            Thank you for your purchase. Your order has been confirmed and is being processed.
          </p>

          {/* Order Details */}
          {orderId && (
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-mono text-sm font-medium text-gray-900">{orderId}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/my-orders"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
            >
              <ShoppingBag className="h-5 w-5" />
              View My Orders
            </Link>
            <Link
              to="/marketplace"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Home className="h-5 w-5" />
              Continue Shopping
            </Link>
          </div>

          {/* Auto-redirect notice */}
          <p className="mt-6 text-sm text-gray-500">
            Redirecting to marketplace in {countdown} seconds...
          </p>
        </div>

        {/* Support Info */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Need help?{" "}
          <Link to="/contact" className="text-gray-900 hover:underline">
            Contact Support
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
