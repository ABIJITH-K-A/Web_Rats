import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTemplates } from "../../hooks/useTemplates";
import { ArrowLeft, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTemplateById } = useTemplates();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        const data = await getTemplateById(id);
        if (data) {
          setTemplate(data);
        }
      } catch (err) {
        console.error("Error loading template:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [id, getTemplateById]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setProcessing(false);
    toast.success(
      template?.isFree
        ? "Template downloaded successfully!"
        : "Payment successful! Template is now yours."
    );

    // Redirect to marketplace after success
    setTimeout(() => {
      navigate("/marketplace");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
        <p className="text-lg font-medium text-gray-900">Template not found</p>
        <Link
          to="/marketplace"
          className="mt-4 text-gray-600 hover:text-gray-900"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            to={`/template/${id}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Template
          </Link>
        </div>
      </nav>

      {/* Checkout Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Checkout</h1>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Order Summary */}
          <div className="h-fit rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Order Summary
            </h2>
            <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
              <img
                src={template.imageUrl}
                alt={template.title}
                className="h-40 w-full object-cover"
              />
            </div>
            <h3 className="font-medium text-gray-900">{template.title}</h3>
            <p className="mb-4 text-sm text-gray-600">{template.category}</p>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {template.isFree ? "Free" : `$${template.price}`}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Payment Details
            </h2>

            {template.isFree ? (
              <div className="mb-6 rounded-lg bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800">
                    This template is free! Click below to download.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Card Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      placeholder="123"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay ${template.price}</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  This is a mock payment. No real charges will be made.
                </p>
              </form>
            )}

            {template.isFree && (
              <button
                onClick={handleSubmit}
                disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Download Free
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
