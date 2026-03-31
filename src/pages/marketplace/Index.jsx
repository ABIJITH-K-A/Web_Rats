import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceLayout from "../../components/marketplace/MarketplaceLayout";
import TemplateCard from "../../components/marketplace/TemplateCard";
import { useTemplates } from "../../hooks/useTemplates";
import { Sparkles } from "lucide-react";

export default function Index() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get("q") || "",
    categories: [],
    price: "all",
    sort: "popular",
  });

  const { templates, loading, error, fetchTemplates } = useTemplates();

  useEffect(() => {
    fetchTemplates(filters);
  }, [filters, fetchTemplates]);

  return (
    <MarketplaceLayout filters={filters} setFilters={setFilters}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Template Marketplace
            </h1>
            <p className="text-gray-600">
              Premium templates for your next project
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span>{templates.length} templates</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">Error loading templates: {error}</p>
          </div>
        )}

        {/* Template Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && templates.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="text-lg font-medium text-gray-900">
              No templates found
            </p>
            <p className="text-gray-600">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
