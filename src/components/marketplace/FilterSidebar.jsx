import { Search } from "lucide-react";
import { TEMPLATE_CATEGORIES, TEMPLATE_ITEMS } from "../../data/templateData";

const keywordOptions = Array.from(
  new Set(
    TEMPLATE_ITEMS.flatMap((template) => template.tags || [])
      .map((tag) => String(tag).toLowerCase())
      .slice(0, 8)
  )
);

export default function FilterSidebar({
  filters,
  setFilters,
  onRequestClose,
}) {
  const selectedCategory = filters.categories?.[0] || "all";
  const updateFilters = (updater, shouldClose = false) => {
    setFilters(updater);
    if (shouldClose) {
      onRequestClose?.();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-white/28">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) =>
              updateFilters(
                (current) => ({ ...current, search: event.target.value }),
                false
              )
            }
            placeholder="react, landing, portfolio"
            className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-primary/50"
          />
        </div>
      </div>

      <div>
        <label className="mb-3 block text-[10px] font-mono uppercase tracking-[0.18em] text-white/28">
          Collection
        </label>
        <div className="space-y-2">
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                updateFilters(
                  (current) => ({
                    ...current,
                    categories: category.id === "all" ? [] : [category.id],
                  }),
                  true
                )
              }
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                selectedCategory === category.id
                  ? "border-cyan-primary/30 bg-cyan-primary/10 text-cyan-primary"
                  : "border-white/8 bg-white/[0.03] text-white/58 hover:border-white/16 hover:text-white"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-[10px] font-mono uppercase tracking-[0.18em] text-white/28">
          Keyword
        </label>
        <div className="flex flex-wrap gap-2">
          {keywordOptions.map((keyword) => {
            const active = filters.tag === keyword;
            return (
              <button
                key={keyword}
                type="button"
                onClick={() =>
                  updateFilters(
                    (current) => ({
                      ...current,
                      tag: active ? "" : keyword,
                    }),
                    true
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "border-cyan-primary/30 bg-cyan-primary/10 text-cyan-primary"
                    : "border-white/8 bg-white/[0.03] text-white/50 hover:border-white/14 hover:text-white"
                }`}
              >
                {keyword}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-[10px] font-mono uppercase tracking-[0.18em] text-white/28">
          Price
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "all", label: "All" },
            { value: "free", label: "Free" },
            { value: "paid", label: "Paid" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateFilters(
                  (current) => ({ ...current, price: option.value }),
                  true
                )
              }
              className={`rounded-2xl border px-3 py-3 text-[11px] font-semibold transition ${
                filters.price === option.value
                  ? "border-cyan-primary/30 bg-cyan-primary/10 text-cyan-primary"
                  : "border-white/8 bg-white/[0.03] text-white/50 hover:border-white/14 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
