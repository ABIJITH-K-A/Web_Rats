import { useCallback, useEffect, useState } from "react";
import { apiRequest, isBackendConfigured } from "../services/apiClient";
import { TEMPLATE_ITEMS } from "../data/templateData";

const normalizeTerm = (value) =>
  String(value || "").trim().toLowerCase();

const normalizeTemplate = (template) => {
  const images =
    Array.isArray(template.images) && template.images.length
      ? template.images
      : [template.image, template.imageUrl].filter(Boolean);
  const tags = Array.isArray(template.tags)
    ? template.tags.map((tag) => String(tag).toLowerCase())
    : [];
  const keywords = Array.isArray(template.keywords) && template.keywords.length
    ? template.keywords.map((keyword) => String(keyword).toLowerCase())
    : tags;
  const price = Number(template.price || 0);

  return {
    id: template.id,
    title: template.title || "Untitled Template",
    images,
    description: template.description || "",
    category: template.category || "",
    tags,
    keywords,
    price,
    isFree: Boolean(template.isFree || price <= 0),
    fileUrl: template.fileUrl || template.downloadUrl || null,
    isUnlocked: Boolean(template.isUnlocked || template.isFree || price <= 0),
  };
};

const filterTemplates = (templates, filters = {}) => {
  const search = normalizeTerm(filters.search);
  const tag = normalizeTerm(filters.tag);
  const categories = Array.isArray(filters.categories) ? filters.categories : [];

  let results = templates;

  if (categories.length > 0) {
    const categorySet = new Set(categories.map((category) => normalizeTerm(category)));
    results = results.filter((template) =>
      categorySet.has(normalizeTerm(template.category || template.tags?.[0] || ""))
    );
  }

  if (search) {
    results = results.filter(
      (template) =>
        template.title.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search) ||
        template.keywords.some((keyword) => keyword.includes(search)) ||
        template.tags.some((keyword) => keyword.includes(search))
    );
  }

  if (tag) {
    results = results.filter((template) => template.tags.includes(tag));
  }

  if (filters.price === "free") {
    results = results.filter((template) => template.isFree);
  }

  if (filters.price === "paid") {
    results = results.filter((template) => !template.isFree);
  }

  if (filters.sort === "price-low") {
    results = [...results].sort((left, right) => left.price - right.price);
  } else if (filters.sort === "price-high") {
    results = [...results].sort((left, right) => right.price - left.price);
  } else {
    results = [...results].sort((left, right) => left.title.localeCompare(right.title));
  }

  return results;
};

const getLocalTemplates = () =>
  TEMPLATE_ITEMS.map((template) =>
    normalizeTemplate({
      ...template,
      images: [template.image].filter(Boolean),
      keywords: template.tags || [],
      fileUrl: template.fileUrl || template.image,
      category: template.category,
    })
  );

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      if (isBackendConfigured()) {
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.tag) params.set("tag", filters.tag);
        if (filters.price && filters.price !== "all") params.set("price", filters.price);
        if (filters.sort) params.set("sort", filters.sort);

        const response = await apiRequest(`/templates${params.toString() ? `?${params}` : ""}`);
        setTemplates(
          filterTemplates((response?.templates || []).map(normalizeTemplate), filters)
        );
      } else {
        setTemplates(filterTemplates(getLocalTemplates(), filters));
      }
    } catch (fetchError) {
      console.error("Error fetching templates:", fetchError);
      setError(fetchError.message || "Could not load templates.");
      setTemplates(filterTemplates(getLocalTemplates(), filters));
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplateById = useCallback(async (id) => {
    if (!id) return null;

    if (isBackendConfigured()) {
      const response = await apiRequest(`/templates/${id}`);
      return response?.template ? normalizeTemplate(response.template) : null;
    }

    return getLocalTemplates().find((template) => template.id === id) || null;
  }, []);

  const getTemplateDownload = useCallback(async (id) => {
    if (isBackendConfigured()) {
      const response = await apiRequest(`/templates/${id}/download`);
      return response?.fileUrl || null;
    }

    const template = getLocalTemplates().find((item) => item.id === id);
    return template?.fileUrl || null;
  }, []);

  const unlockFreeTemplate = useCallback(async (id) => {
    if (!isBackendConfigured()) {
      return { success: true, templateId: id };
    }

    return apiRequest("/templates/unlock", {
      method: "POST",
      authMode: "required",
      body: { templateId: id },
    });
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    getTemplateById,
    getTemplateDownload,
    unlockFreeTemplate,
    refetch: fetchTemplates,
  };
}
