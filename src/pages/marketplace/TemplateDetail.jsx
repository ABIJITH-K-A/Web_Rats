import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTemplates } from "../../hooks/useTemplates";
import { Heart, Eye, ShoppingCart, ArrowLeft, Calendar, Tag } from "lucide-react";

export default function TemplateDetail() {
  const { id } = useParams();
  const { getTemplateById } = useTemplates();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        const data = await getTemplateById(id);
        if (data) {
          setTemplate(data);
        } else {
          setError("Template not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [id, getTemplateById]);

  const handleLike = () => {
    setLiked(!liked);
  };

  const handlePreview = () => {
    window.open(template.imageUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white">
        <p className="text-lg font-medium text-gray-900">{error || "Template not found"}</p>
        <Link
          to="/marketplace"
          className="mt-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link
            to="/marketplace"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={template.imageUrl}
              alt={template.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                {template.category}
              </span>
              {template.isFree ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Free
                </span>
              ) : (
                <span className="rounded-full bg-gray-900 px-3 py-1 text-sm font-medium text-white">
                  ${template.price}
                </span>
              )}
            </div>

            <h1 className="mb-4 text-3xl font-bold text-gray-900">
              {template.title}
            </h1>

            <p className="mb-6 text-gray-600 leading-relaxed">
              {template.description}
            </p>

            {/* Stats */}
            <div className="mb-6 flex items-center gap-6 text-sm text-gray-500">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 transition-colors hover:text-red-500"
              >
                <Heart
                  className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span>{template.likes + (liked ? 1 : 0)} likes</span>
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {template.createdAt?.toDate
                    ? template.createdAt.toDate().toLocaleDateString()
                    : "Recently added"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handlePreview}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Eye className="h-5 w-5" />
                Live Preview
              </button>
              <Link
                to={`/checkout/${template.id}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
              >
                <ShoppingCart className="h-5 w-5" />
                {template.isFree ? "Get Free" : `Buy Now $${template.price}`}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
