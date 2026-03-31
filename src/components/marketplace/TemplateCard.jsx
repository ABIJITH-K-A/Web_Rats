import { useState } from "react";
import { Link } from "react-router-dom";

export default function TemplateCard({ template }) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(template.likes || 0);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
        <img
          src={template.imageUrl}
          alt={template.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center gap-3 bg-black/50 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Link
            to={`/template/${template.id}`}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-transform hover:scale-105"
          >
            <Eye className="h-4 w-4" />
            View
          </Link>
          <Link
            to={`/checkout/${template.id}`}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            <ShoppingCart className="h-4 w-4" />
            {template.isFree ? "Get Free" : "Buy"}
          </Link>
        </div>

        {/* Price Badge */}
        <div className="absolute left-3 top-3">
          {template.isFree ? (
            <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
              Free
            </span>
          ) : (
            <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
              ${template.price}
            </span>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute right-3 top-3">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
            {template.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {template.title}
          </h3>
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-red-500"
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
            />
            <span>{likeCount}</span>
          </button>
        </div>
        <p className="line-clamp-2 text-sm text-gray-600">
          {template.description}
        </p>
      </div>
    </div>
  );
}
