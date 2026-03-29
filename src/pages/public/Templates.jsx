import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  Download,
  Eye,
  Gift,
  Search,
  ShoppingCart,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button, Card } from "../../components/ui/Primitives";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_ITEMS,
  formatTemplatePrice,
} from "../../data/templateData";
import { apiRequest, isBackendConfigured } from "../../services/apiClient";

const Templates = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [purchaseTemplate, setPurchaseTemplate] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const filtered = useMemo(() => {
    let results = TEMPLATE_ITEMS;
    if (activeCategory !== "all") {
      results = results.filter((t) => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q))
      );
    }
    return results;
  }, [activeCategory, searchQuery]);

  const handleGetTemplate = async (template) => {
    if (!user) {
      setPurchaseTemplate(template);
      return;
    }

    if (template.isFree) {
      // Free template — record and "download" via backend
      try {
        if (isBackendConfigured()) {
          const response = await apiRequest("/templates/unlock", {
            method: "POST",
            body: {
              templateId: template.id,
              templateTitle: template.title,
              isFree: true,
              price: 0,
            },
          });

          if (response?.success) {
            setPurchaseSuccess(true);
            setPurchaseTemplate(template);
          }
        } else {
          // Fallback to direct Firestore (for local dev without backend)
          await addDoc(collection(db, "templatePurchases"), {
            userId: user.uid,
            templateId: template.id,
            templateTitle: template.title,
            price: 0,
            type: "free",
            createdAt: serverTimestamp(),
          });
          setPurchaseSuccess(true);
          setPurchaseTemplate(template);
        }
      } catch (error) {
        console.error("Template record error:", error);
        if (error.status === 429) {
          alert(error.message || "Daily free template limit reached (3/day).");
        }
      }
    } else {
      setPurchaseTemplate(template);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseTemplate || !user) return;
    setPurchasing(true);
    try {
      if (isBackendConfigured()) {
        const response = await apiRequest("/templates/unlock", {
          method: "POST",
          body: {
            templateId: purchaseTemplate.id,
            templateTitle: purchaseTemplate.title,
            isFree: false,
            price: purchaseTemplate.price,
          },
        });
        if (response?.success) {
          setPurchaseSuccess(true);
        }
      } else {
        await addDoc(collection(db, "templatePurchases"), {
          userId: user.uid,
          templateId: purchaseTemplate.id,
          templateTitle: purchaseTemplate.title,
          price: purchaseTemplate.price,
          type: "paid",
          status: "completed",
          createdAt: serverTimestamp(),
        });
        setPurchaseSuccess(true);
      }
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setPurchasing(false);
    }
  };

  const closePurchaseModal = () => {
    setPurchaseTemplate(null);
    setPurchaseSuccess(false);
    setPurchasing(false);
  };

  return (
    <div className="min-h-screen bg-primary-dark text-light-gray">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-primary/5 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-primary/20 bg-cyan-primary/5 px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary">
            <Sparkles size={12} /> Templates & Assets
          </div>
          <h1 className="text-4xl font-black text-white md:text-5xl lg:text-6xl">
            Ready-Made{" "}
            <span className="text-cyan-primary">Templates</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-light-gray/50">
            Browse our curated collection of website, portfolio, presentation,
            and graphic templates. Free & premium — all built by the TNWebRats
            studio.
          </p>
        </motion.div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-20 border-b border-white/6 bg-primary-dark/92 px-6 py-4 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? "border border-cyan-primary/20 bg-cyan-primary/10 text-cyan-primary"
                    : "border border-white/8 text-light-gray/50 hover:border-white/14 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-light-gray/30"
            />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/35 py-2.5 pl-9 pr-4 text-sm text-white outline-none transition-colors placeholder:text-light-gray/30 focus:border-cyan-primary"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-xl font-black text-white">No templates found</div>
            <p className="mt-3 text-sm text-light-gray/40">
              Try adjusting your filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <TemplateCard
                  template={template}
                  onPreview={() => setPreviewTemplate(template)}
                  onGet={() => handleGetTemplate(template)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <PreviewModal
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onGet={() => {
              setPreviewTemplate(null);
              handleGetTemplate(previewTemplate);
            }}
          />
        )}
      </AnimatePresence>

      {/* Purchase Modal */}
      <AnimatePresence>
        {purchaseTemplate && (
          <PurchaseModal
            template={purchaseTemplate}
            user={user}
            purchasing={purchasing}
            success={purchaseSuccess}
            onConfirm={handleConfirmPurchase}
            onClose={closePurchaseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Template Card ─────────────────────────────────────── */
const TemplateCard = ({ template, onPreview, onGet }) => (
  <Card
    className="group relative overflow-hidden border-white/8 bg-[#10141a] transition-all hover:border-cyan-primary/18"
  >
    {/* Image */}
    <div className="relative aspect-[16/10] overflow-hidden bg-black/50">
      <img
        src={template.image}
        alt={template.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      {/* Badges */}
      <div className="absolute left-3 top-3 flex gap-2">
        {template.isFree && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            <Gift size={10} /> Free
          </span>
        )}
        {template.isPro && (
          <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/15 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300">
            <Crown size={10} /> Pro
          </span>
        )}
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <Eye size={14} /> Preview
        </button>
        <button
          onClick={onGet}
          className="flex items-center gap-1.5 rounded-full border border-cyan-primary/30 bg-cyan-primary/15 px-4 py-2 text-xs font-semibold text-cyan-primary backdrop-blur transition-colors hover:bg-cyan-primary/25"
        >
          <ShoppingCart size={14} /> Get
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-light-gray/40">
          {template.category}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-white">{template.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-light-gray/45">
        {template.description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div
          className={`text-lg font-black ${
            template.isFree ? "text-emerald-400" : "text-cyan-primary"
          }`}
        >
          {formatTemplatePrice(template.price)}
        </div>
        <div className="flex gap-1.5">
          {template.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-white/6 bg-white/3 px-2 py-0.5 text-[9px] text-light-gray/30"
            >
              <Tag size={8} /> {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  </Card>
);

/* ─── Preview Modal ─────────────────────────────────────── */
const PreviewModal = ({ template, onClose, onGet }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur"
  >
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#10141a] shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
              Template Preview
            </div>
            {template.isFree && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                <Gift size={9} /> Free
              </span>
            )}
            {template.isPro && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono text-amber-300">
                <Crown size={9} /> Pro
              </span>
            )}
          </div>
          <h3 className="mt-2 text-2xl font-black text-white">
            {template.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-light-gray/62 transition-colors hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="overflow-y-auto p-6">
        <div className="overflow-hidden rounded-2xl border border-white/6">
          <img
            src={template.image}
            alt={template.title}
            className="w-full object-cover"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm leading-7 text-light-gray/60">
              {template.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-mono text-light-gray/40"
                >
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div
              className={`text-3xl font-black ${
                template.isFree ? "text-emerald-400" : "text-cyan-primary"
              }`}
            >
              {formatTemplatePrice(template.price)}
            </div>
            <Button onClick={onGet}>
              {template.isFree ? (
                <>
                  <Download size={16} /> Get Free Template
                </>
              ) : (
                <>
                  <ShoppingCart size={16} /> Purchase Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

/* ─── Purchase Modal ─────────────────────────────────────── */
const PurchaseModal = ({
  template,
  user,
  purchasing,
  success,
  onConfirm,
  onClose,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur"
  >
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#10141a] p-6 shadow-2xl"
    >
      {!user ? (
        <>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-primary/20 bg-cyan-primary/10">
              <ShoppingCart size={24} className="text-cyan-primary" />
            </div>
            <h3 className="mt-4 text-xl font-black text-white">
              Sign in Required
            </h3>
            <p className="mt-2 text-sm text-light-gray/50">
              Create an account or sign in to get this template.
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <a href="/join?login=1" className="flex-1">
              <Button className="w-full">Sign In</Button>
            </a>
          </div>
        </>
      ) : success ? (
        <>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
              <Download size={24} className="text-emerald-400" />
            </div>
            <h3 className="mt-4 text-xl font-black text-white">
              {template.isFree ? "Template Unlocked!" : "Purchase Complete!"}
            </h3>
            <p className="mt-2 text-sm text-light-gray/50">
              {template.isFree
                ? "This free template has been added to your account."
                : "Your purchase is confirmed. The template is now available."}
            </p>
          </div>
          <div className="mt-6">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                Confirm Purchase
              </div>
              <h3 className="mt-2 text-xl font-black text-white">
                {template.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-light-gray/62 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-6 rounded-2xl border border-white/8 bg-black/30 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-light-gray/50">Template</span>
              <span className="font-semibold text-white">{template.title}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3">
              <span className="text-sm text-light-gray/50">Price</span>
              <span className="text-xl font-black text-cyan-primary">
                {formatTemplatePrice(template.price)}
              </span>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={purchasing}
              className="flex-1"
            >
              {purchasing ? "Processing..." : "Confirm Purchase"}
            </Button>
          </div>
        </>
      )}
    </motion.div>
  </motion.div>
);

export default Templates;
