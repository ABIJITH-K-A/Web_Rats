import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import axios from 'axios';

export default function QRPaymentPage({ orderId, amount, userDetails = {} }) {
  const [_paymentSessionId, setPaymentSessionId] = useState(null);
  const [upiLink, setUpiLink] = useState(null);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe;

    const init = async () => {
      try {
        // Create Cashfree order and get payment session
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/payment/create-order`,
          { amount, orderId, userDetails }
        );
        
        setPaymentSessionId(data.paymentSessionId);

        // For UPI QR, still generate the link
        const upiId = import.meta.env.VITE_UPI_ID;
        const link = [
          `upi://pay?pa=${upiId}`,
          `&pn=${encodeURIComponent('Web Rats')}`,
          `&am=${amount}`,
          `&cu=INR`,
          `&tn=${encodeURIComponent(`Order-${orderId}`)}`,
        ].join('');
        setUpiLink(link);

        // Listen to payments/{orderId}
        unsubscribe = onSnapshot(
          doc(db, 'payments', orderId),
          (snapshot) => {
            if (!snapshot.exists()) return;
            const { paymentStatus } = snapshot.data();
            if (paymentStatus === 'success') {
              setStatus('success');
              navigate('/order-confirmed');
            }
            if (paymentStatus === 'failed') setStatus('failed');
          }
        );
      } catch (err) {
        console.error(err);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    init();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [orderId, amount, userDetails, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-6 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-gray-800">Scan to Pay</h2>
        <p className="text-3xl font-semibold text-green-600">₹{amount}</p>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {!error && upiLink ? (
          <QRCodeSVG value={upiLink} size={220} />
        ) : !error && (
          <div className="w-[220px] h-[220px] bg-gray-100 animate-pulse rounded-xl" />
        )}

        <div className="text-sm text-gray-500 flex items-center gap-2">
          {status === 'pending' && !error && (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping inline-block" />
              Waiting for payment...
            </>
          )}
          {status === 'failed' && (
            <span className="text-red-500 font-medium">
              Payment failed. Please try again.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
