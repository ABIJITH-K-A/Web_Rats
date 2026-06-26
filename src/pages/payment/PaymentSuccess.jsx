import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import PaymentReceiptModal from "../../components/payment/PaymentReceiptModal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function PaymentSuccess() {
  const { orderId: paramOrderId } = useParams();
  const [searchParams] = useSearchParams();

  // Cashfree returns order_id as a query param too
  const orderId =
    paramOrderId ||
    searchParams.get("order_id") ||
    searchParams.get("orderId") ||
    "";

  const [orderData, setOrderData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (orderId) {
          // Try orders collection first
          const orderSnap = await getDoc(doc(db, "orders", orderId));
          if (!cancelled && orderSnap.exists()) {
            setOrderData({ id: orderSnap.id, ...orderSnap.data() });
          }

          // Also try payments collection
          const paymentSnap = await getDoc(doc(db, "payments", orderId));
          if (!cancelled && paymentSnap.exists()) {
            setPaymentData({ id: paymentSnap.id, ...paymentSnap.data() });
          }
        }
      } catch (err) {
        console.error("PaymentSuccess: failed to fetch order/payment:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setShowModal(true);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-dark">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {/* Background so the page isn't blank behind the modal */}
      <div className="min-h-screen bg-primary-dark" />

      {showModal && (
        <PaymentReceiptModal
          orderId={orderId}
          orderData={orderData || {}}
          paymentData={paymentData || {}}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
