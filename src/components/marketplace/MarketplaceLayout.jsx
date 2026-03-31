import FilterSidebar from "./FilterSidebar";

export default function MarketplaceLayout({
  children,
  filters,
  setFilters,
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-64 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <FilterSidebar
          search={filters.search}
          setSearch={(search) => setFilters((f) => ({ ...f, search }))}
          selectedCategories={filters.categories}
          setSelectedCategories={(categories) =>
            setFilters((f) => ({ ...f, categories }))
          }
          priceFilter={filters.price}
          setPriceFilter={(price) => setFilters((f) => ({ ...f, price }))}
          sortBy={filters.sort}
          setSortBy={(sort) => setFilters((f) => ({ ...f, sort }))}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
