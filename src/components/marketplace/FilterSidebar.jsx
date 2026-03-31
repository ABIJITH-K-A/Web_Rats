import { Search, Check } from "lucide-react";
import { categories } from "../../data/seedTemplates";

export default function FilterSidebar({
  search,
  setSearch,
  selectedCategories,
  setSelectedCategories,
  priceFilter,
  setPriceFilter,
  sortBy,
  setSortBy,
}) {
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="w-full space-y-6 p-4">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Categories</label>
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50"
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  selectedCategories.includes(category)
                    ? "border-gray-800 bg-gray-800"
                    : "border-gray-300"
                }`}
              >
                {selectedCategories.includes(category) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="sr-only"
              />
              <span className="text-sm text-gray-600">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Price</label>
        <div className="space-y-2">
          {[
            { value: "all", label: "All" },
            { value: "free", label: "Free" },
            { value: "paid", label: "Paid" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50"
            >
              <div
                className={`h-4 w-4 rounded-full border ${
                  priceFilter === option.value
                    ? "border-4 border-gray-800"
                    : "border-gray-300"
                }`}
              />
              <input
                type="radio"
                name="price"
                value={option.value}
                checked={priceFilter === option.value}
                onChange={() => setPriceFilter(option.value)}
                className="sr-only"
              />
              <span className="text-sm text-gray-600">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="popular">Popular</option>
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
        </select>
      </div>
    </div>
  );
}
