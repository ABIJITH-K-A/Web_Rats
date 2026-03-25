import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Clock3,
  FileText,
  ListChecks,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { Button, Card, SectionHeading } from "../../components/ui/Primitives";
import Stepper, { Step } from "../../components/ui/Stepper";
import {
  BOOKING_STEP_LABELS,
  buildPaymentBreakdown,
  CONTACT_INFO,
  getCategoryById,
  getServiceById,
  SERVICE_CATEGORIES,
  TERMS_POINTS,
} from "../../data/siteData";
import { buildReorderDraft } from "../../utils/orderHelpers";

const formatPrice = (price) => `Rs ${price.toLocaleString("en-IN")}`;

const categoryGradients = {
  "presentation-design": "from-cyan-primary/15 to-teal-primary/10",
  "web-development": "from-white/10 to-cyan-primary/10",
  "fix-optimization": "from-teal-primary/15 to-white/5",
  "templates-assets": "from-cyan-primary/12 to-white/5",
};

const BookingStepperIndicator = ({ step, currentStep }) => {
  const isComplete = currentStep > step;
  const isActive = currentStep === step;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
          isComplete || isActive
            ? "border-cyan-primary bg-cyan-primary text-primary-dark"
            : "border-white/10 bg-white/5 text-white/35"
        }`}
      >
        {isComplete ? <Check size={16} /> : step}
      </div>
      <div
        className={`text-[10px] font-mono uppercase tracking-[0.14em] ${
          isActive || isComplete ? "text-cyan-primary" : "text-white/28"
        }`}
      >
        {BOOKING_STEP_LABELS[step - 1]}
      </div>
    </div>
  );
};

const BookService = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [reorderDraft] = useState(() =>
    location.state?.reorderOrder
      ? buildReorderDraft(location.state.reorderOrder)
      : null
  );
  const previousRequirements = reorderDraft?.requirements || null;

  const requestedServiceId = searchParams.get("service");
  const requestedCategoryId = searchParams.get("category");
  const requestedPlanId = searchParams.get("plan");

  const requestedService = requestedServiceId
    ? getServiceById(requestedServiceId)
    : null;
  const initialCategoryId =
    reorderDraft?.categoryId || requestedCategoryId || requestedService?.categoryId || null;
  const initialServiceId = reorderDraft?.serviceId || requestedService?.id || null;
  const initialPlanId =
    reorderDraft?.planId ||
    (initialServiceId && requestedPlanId
      ? requestedService?.plans.find((plan) => plan.id === requestedPlanId)?.id ||
        null
      : null);

  const getInitialStep = () => {
    if (initialPlanId) return 4;
    if (initialServiceId) return 3;
    if (initialCategoryId) return 2;
    return 1;
  };

  const [step, setStep] = useState(getInitialStep());
  const [direction, setDirection] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [isPriority, setIsPriority] = useState(Boolean(reorderDraft?.isPriority));
  const [customerType, setCustomerType] = useState(
    reorderDraft ? "returning" : userProfile?.customerType || "new"
  );
  const [reusePreviousData, setReusePreviousData] = useState(Boolean(reorderDraft));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [formData, setFormData] = useState({
    name:
      userProfile?.name ||
      user?.displayName ||
      previousRequirements?.name ||
      "",
    email: user?.email || previousRequirements?.email || "",
    phone: userProfile?.phone || previousRequirements?.phone || "",
    projectDescription: previousRequirements?.projectDescription || "",
    features: previousRequirements?.features || "",
    references: previousRequirements?.references || "",
    deadline: previousRequirements?.deadline || "",
  });

  useEffect(() => {
    if (!previousRequirements) return;

    setFormData((current) => ({
      ...current,
      projectDescription: reusePreviousData
        ? previousRequirements.projectDescription || ""
        : "",
      features: reusePreviousData ? previousRequirements.features || "" : "",
      references: reusePreviousData
        ? previousRequirements.references || ""
        : "",
      deadline: reusePreviousData ? previousRequirements.deadline || "" : "",
    }));
  }, [previousRequirements, reusePreviousData]);

  const selectedCategory = selectedCategoryId
    ? getCategoryById(selectedCategoryId)
    : null;
  const selectedService = selectedServiceId
    ? getServiceById(selectedServiceId)
    : null;
  const selectedPlan =
    selectedService?.plans.find((plan) => plan.id === selectedPlanId) || null;
  const resolvedCustomerType = reorderDraft ? "returning" : customerType;
  const payment = buildPaymentBreakdown({
    basePrice: selectedPlan?.price ?? 0,
    isPriority: Boolean(selectedPlan && isPriority),
    customerType: resolvedCustomerType,
  });

  const goToStep = (nextStep) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setSelectedServiceId(null);
    setSelectedPlanId(null);
    setIsPriority(false);
    goToStep(2);
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
    setSelectedPlanId(null);
    setIsPriority(false);
    goToStep(3);
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlanId(planId);
  };

  const handleBack = (targetStep) => {
    goToStep(targetStep);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const detailsValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    formData.projectDescription.trim().length >= 20 &&
    formData.features.trim().length >= 10 &&
    formData.deadline;

  const createWhatsAppMessage = (newOrderId) => {
    if (!selectedCategory || !selectedService || !selectedPlan) {
      return "";
    }

    return [
      "Hi TNWebRats, a new booking was created.",
      "",
      `Order ID: ${newOrderId}`,
      `Category: ${selectedCategory.name}`,
      `Service: ${selectedService.name}`,
      `Plan: ${selectedPlan.label}`,
      `Priority: ${isPriority ? "High" : "Normal"}`,
      `Customer Type: ${resolvedCustomerType}`,
      `Total: ${formatPrice(payment.total)}`,
      `Advance: ${formatPrice(payment.advancePayment)}`,
      "",
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Phone: ${formData.phone}`,
      `Deadline: ${formData.deadline}`,
      "",
      `Project: ${formData.projectDescription}`,
      `Features: ${formData.features}`,
      formData.references ? `References: ${formData.references}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleSubmit = async () => {
    if (!payment || !selectedCategory || !selectedService || !selectedPlan) {
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const orderPayload = {
        userId: user?.uid || "guest",
        customerId: user?.uid || null,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        category: selectedCategory.name,
        categoryId: selectedCategory.id,
        service: selectedService.name,
        serviceId: selectedService.id,
        plan: selectedPlan.label,
        planId: selectedPlan.id,
        package: selectedPlan.label,
        price: payment.total,
        basePrice: payment.basePrice,
        priorityFee: payment.priorityFee,
        totalPrice: payment.total,
        advancePayment: payment.advancePayment,
        remainingPayment: payment.remainingPayment,
        advanceRate: payment.advanceRate,
        customerType: resolvedCustomerType,
        isPriority,
        priorityLabel: isPriority ? "High" : "Normal",
        isReorder: Boolean(reorderDraft),
        parentOrderId: reorderDraft?.parentOrderId || null,
        projectDescription: formData.projectDescription.trim(),
        features: formData.features.trim(),
        references: formData.references.trim(),
        deadline: formData.deadline,
        requirements: {
          projectDescription: formData.projectDescription.trim(),
          features: formData.features.trim(),
          references: formData.references.trim(),
          deadline: formData.deadline,
        },
        paymentStatus: "Pending",
        status: "Active",
        orderStatus: "Active",
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderPayload);

      if (user?.uid) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            customerType: resolvedCustomerType,
          },
          { merge: true }
        );
      }

      await addDoc(collection(db, "notifications"), {
        recipientId: "admin",
        title: "New booking received",
        type: "order",
        read: false,
        orderId: orderRef.id,
        message: `${formData.name.trim()} booked ${selectedService.name} (${selectedPlan.label})${
          reorderDraft ? ` as a reorder of ${reorderDraft.parentOrderId}.` : "."
        }`,
        createdAt: serverTimestamp(),
      });

      const whatsappMessage = createWhatsAppMessage(orderRef.id);
      if (whatsappMessage) {
        window.open(
          `https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(
            whatsappMessage
          )}`,
          "_blank"
        );
      }

      setOrderId(orderRef.id);
      setOrderConfirmed(true);
    } catch (error) {
      console.error("Booking error:", error);
      setSubmitError(
        "We could not save the booking right now. Please try again in a moment."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <Card className="border-cyan-primary/15 bg-black/75 p-12 text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-primary bg-cyan-primary/10 text-cyan-primary">
              <Check size={34} />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-primary/72">
              Order Confirmed
            </div>
            <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
              Your project request is locked in.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-light-gray/68">
              We saved the booking, opened the WhatsApp summary, and generated a
              new order reference for follow-up.
            </p>
            <div className="mx-auto mt-8 w-fit rounded-2xl border border-cyan-primary/18 bg-cyan-primary/8 px-6 py-4 font-mono text-lg tracking-[0.18em] text-cyan-primary">
              {orderId.toUpperCase()}
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {user ? (
                <Button onClick={() => navigate("/profile")}>
                  Go To Dashboard
                </Button>
              ) : (
                <Link to="/join">
                  <Button>Create Account To Track It</Button>
                </Link>
              )}
              <Link to="/">
                <Button variant="outline">Back To Home</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pb-28 pt-10">
      <SectionHeading subtitle="Choose a category, pick a service, select a plan, and confirm the order step by step.">
        Book Your <span className="text-white">Project</span>
      </SectionHeading>

      <Stepper
        currentStep={step}
        direction={direction}
        showButtons={false}
        disableStepIndicators={true}
        renderStepIndicator={({ step: current, currentStep }) => (
          <BookingStepperIndicator step={current} currentStep={currentStep} />
        )}
        className="p-0"
        contentClassName="relative min-h-[520px]"
      >
        <Step>
          <div className="space-y-8">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Step 1 - Choose a service category
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {SERVICE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  className={`rounded-[28px] border border-white/8 bg-gradient-to-br ${
                    categoryGradients[category.id]
                  } p-7 text-left transition-transform duration-300 hover:-translate-y-1 hover:border-cyan-primary/20`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                    {category.pricingHint}
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-white">
                    {category.name}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-light-gray/68">
                    {category.description}
                  </p>
                  <div className="mt-6 grid gap-3">
                    {category.services.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-2xl border border-white/8 bg-black/45 px-4 py-3 text-sm text-light-gray/72"
                      >
                        {service.name}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-8">
            <button
              type="button"
              onClick={() => handleBack(1)}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-light-gray/42 transition-colors hover:text-cyan-primary"
            >
              <ArrowLeft size={14} /> Back to categories
            </button>

            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Step 2 - Choose a service
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {selectedCategory?.services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceSelect(service.id)}
                  className="rounded-[26px] border border-white/8 bg-black/65 p-6 text-left transition-transform duration-300 hover:-translate-y-1 hover:border-cyan-primary/20"
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                    From {formatPrice(Math.min(...service.plans.map((plan) => plan.price)))}
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-white">
                    {service.name}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-light-gray/68">
                    {service.summary}
                  </p>
                  <div className="mt-6 text-sm text-light-gray/56">
                    Best for: {service.bestFor}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-8">
            <button
              type="button"
              onClick={() => handleBack(2)}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-light-gray/42 transition-colors hover:text-cyan-primary"
            >
              <ArrowLeft size={14} /> Back to services
            </button>

            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Step 3 - Choose your plan
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="grid gap-5 lg:grid-cols-3">
                {selectedService?.plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`rounded-[28px] border p-6 text-left transition-all duration-300 ${
                        isSelected
                          ? "border-cyan-primary bg-cyan-primary/10 shadow-[0_0_24px_rgba(103,248,29,0.12)]"
                          : "border-white/8 bg-black/65 hover:border-cyan-primary/18"
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-primary/72">
                        {plan.badge}
                      </div>
                      <h2 className="mt-4 text-3xl font-black text-white">
                        {plan.label}
                      </h2>
                      <div className="mt-4 text-4xl font-black text-cyan-primary">
                        {formatPrice(plan.price)}
                      </div>
                      <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                        Delivery {plan.delivery}
                      </div>
                      <div className="mt-6 space-y-3">
                        {plan.features.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-start gap-3 text-sm leading-6 text-light-gray/68"
                          >
                            {isSelected ? (
                              <Check
                                size={16}
                                className="mt-1 shrink-0 text-cyan-primary"
                              />
                            ) : (
                              <Circle
                                size={16}
                                className="mt-1 shrink-0 text-white/30"
                              />
                            )}
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Card className="border-white/8 bg-secondary-dark/70">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
                  Optional Add-on
                </div>
                <h2 className="mt-4 text-3xl font-black text-white">
                  Priority delivery
                </h2>
                <p className="mt-4 text-sm leading-7 text-light-gray/68">
                  Get your project handled faster. The extra fee is added to the
                  total before review and the order is tagged as high priority.
                </p>

                <button
                  type="button"
                  onClick={() => setIsPriority((current) => !current)}
                  className={`mt-8 flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors ${
                    isPriority
                      ? "border-cyan-primary bg-cyan-primary/10"
                      : "border-white/8 bg-black/50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                      isPriority
                        ? "border-cyan-primary bg-cyan-primary text-primary-dark"
                        : "border-white/20 bg-transparent text-transparent"
                    }`}
                  >
                    <Check size={13} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      Add priority delivery
                    </div>
                    <div className="mt-1 text-sm text-light-gray/58">
                      {selectedPlan
                        ? `Fee: ${formatPrice(payment.priorityFee)}`
                        : "Select a plan to see the fee."}
                    </div>
                  </div>
                </button>

                <div className="mt-8">
                  <Button
                    onClick={() => goToStep(4)}
                    disabled={!selectedPlanId}
                    className="w-full"
                  >
                    Next <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-8">
            <button
              type="button"
              onClick={() => handleBack(3)}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-light-gray/42 transition-colors hover:text-cyan-primary"
            >
              <ArrowLeft size={14} /> Back to plan
            </button>

            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Step 4 - Your details and requirements
            </div>

            {reorderDraft && (
              <Card className="border-amber-400/15 bg-amber-400/5">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-300/80">
                      Reorder Mode
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-white">
                      Reordering {reorderDraft.parentOrderId}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-light-gray/66">
                      We prefilled the previous requirements so you can update
                      only what changed before confirming the new order.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReusePreviousData((current) => !current)}
                    className={`flex items-start gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${
                      reusePreviousData
                        ? "border-cyan-primary bg-cyan-primary/10"
                        : "border-white/10 bg-black/35"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                        reusePreviousData
                          ? "border-cyan-primary bg-cyan-primary text-primary-dark"
                          : "border-white/20 bg-transparent text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        Reuse previous data
                      </div>
                      <div className="mt-1 text-sm text-light-gray/58">
                        Turn this off if you want to write the requirements from
                        scratch.
                      </div>
                    </div>
                  </button>
                </div>
              </Card>
            )}

            <Card className="border-white/8 bg-black/72">
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    name: "name",
                    label: "Name",
                    icon: User,
                    placeholder: "Your full name",
                  },
                  {
                    name: "email",
                    label: "Email",
                    icon: Mail,
                    placeholder: "you@example.com",
                    type: "email",
                  },
                  {
                    name: "phone",
                    label: "Phone",
                    icon: Phone,
                    placeholder: "+91 98765 43210",
                  },
                  {
                    name: "deadline",
                    label: "Deadline",
                    icon: Clock3,
                    type: "date",
                  },
                ].map((field) => {
                  const Icon = field.icon;
                  return (
                    <label key={field.name} className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                        {field.label}
                      </span>
                      <div className="relative">
                        <Icon
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/35"
                        />
                        <input
                          type={field.type || "text"}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          className="w-full rounded-2xl border border-white/10 bg-secondary-dark/70 px-12 py-3.5 text-sm text-white outline-none transition-colors focus:border-cyan-primary"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-6">
                <label className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                    Project Description
                  </span>
                  <div className="relative">
                    <FileText
                      size={16}
                      className="absolute left-4 top-4 text-cyan-primary/35"
                    />
                    <textarea
                      name="projectDescription"
                      value={formData.projectDescription}
                      onChange={handleChange}
                      placeholder="What are you trying to build and who is it for?"
                      className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-secondary-dark/70 px-12 py-4 text-sm text-white outline-none transition-colors focus:border-cyan-primary"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                    Features / Scope
                  </span>
                  <div className="relative">
                    <ListChecks
                      size={16}
                      className="absolute left-4 top-4 text-cyan-primary/35"
                    />
                    <textarea
                      name="features"
                      value={formData.features}
                      onChange={handleChange}
                      placeholder="List the sections, pages, assets, or expectations you already know."
                      className="min-h-[130px] w-full rounded-2xl border border-white/10 bg-secondary-dark/70 px-12 py-4 text-sm text-white outline-none transition-colors focus:border-cyan-primary"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-light-gray/42">
                    References
                  </span>
                  <div className="relative">
                    <Sparkles
                      size={16}
                      className="absolute left-4 top-4 text-cyan-primary/35"
                    />
                    <textarea
                      name="references"
                      value={formData.references}
                      onChange={handleChange}
                      placeholder="Drop inspiration links, style references, or supporting notes."
                      className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-secondary-dark/70 px-12 py-4 text-sm text-white outline-none transition-colors focus:border-cyan-primary"
                    />
                  </div>
                </label>
              </div>
            </Card>

            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={() => handleBack(3)}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button onClick={() => goToStep(5)} disabled={!detailsValid}>
                Next <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-8">
            <button
              type="button"
              onClick={() => handleBack(4)}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-light-gray/42 transition-colors hover:text-cyan-primary"
            >
              <ArrowLeft size={14} /> Back to details
            </button>

            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Step 5 - Secure your order
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <Card className="border-white/8 bg-black/72">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/72">
                  Customer Type
                </div>
                <h2 className="mt-4 text-3xl font-black text-white">
                  Upfront amount depends on whether you are new or returning.
                </h2>

                {reorderDraft ? (
                  <div className="mt-8 rounded-2xl border border-cyan-primary/15 bg-cyan-primary/10 p-5">
                    <div className="text-lg font-bold text-white">
                      Returning Customer Discount Applied
                    </div>
                    <div className="mt-2 text-sm leading-7 text-light-gray/64">
                      This booking is linked to{" "}
                      <span className="font-semibold text-cyan-primary">
                        {reorderDraft.parentOrderId}
                      </span>
                      , so only 50 percent is shown as the upfront amount.
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-4">
                    {[
                      {
                        id: "new",
                        title: "New Customer",
                        detail: "70 percent upfront before work begins.",
                      },
                      {
                        id: "returning",
                        title: "Returning Customer",
                        detail: "50 percent upfront if you have worked with us before.",
                      },
                    ].map((option) => {
                      const active = customerType === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setCustomerType(option.id)}
                          className={`rounded-2xl border p-5 text-left transition-colors ${
                            active
                              ? "border-cyan-primary bg-cyan-primary/10"
                              : "border-white/8 bg-secondary-dark/70"
                          }`}
                        >
                          <div className="font-semibold text-white">
                            {option.title}
                          </div>
                          <div className="mt-2 text-sm text-light-gray/60">
                            {option.detail}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="border-cyan-primary/10 bg-secondary-dark/75">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/72">
                  Payment Summary
                </div>
                <div className="mt-8 space-y-5">
                  <div className="flex items-center justify-between text-sm text-light-gray/66">
                    <span>Base price</span>
                    <span className="font-semibold text-white">
                      {formatPrice(payment.basePrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-light-gray/66">
                    <span>Priority fee</span>
                    <span className="font-semibold text-white">
                      {payment.priorityFee > 0
                        ? formatPrice(payment.priorityFee)
                        : "Not added"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/8 pt-5 text-sm text-light-gray/66">
                    <span>Total price</span>
                    <span className="text-2xl font-black text-cyan-primary">
                      {formatPrice(payment.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-light-gray/66">
                    <span>Advance payment</span>
                    <span className="font-semibold text-white">
                      {formatPrice(payment.advancePayment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-light-gray/66">
                    <span>Remaining payment</span>
                    <span className="font-semibold text-white">
                      {formatPrice(payment.remainingPayment)}
                    </span>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-cyan-primary/12 bg-black/45 p-5 text-sm leading-7 text-light-gray/64">
                  Payment collection is reflected here so you can review the
                  base price, optional priority fee, and the exact split before
                  confirmation.
                </div>
              </Card>
            </div>

            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={() => handleBack(4)}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button onClick={() => goToStep(6)}>
                Proceed To Review <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-8">
            <button
              type="button"
              onClick={() => handleBack(5)}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-light-gray/42 transition-colors hover:text-cyan-primary"
            >
              <ArrowLeft size={14} /> Back to payment
            </button>

            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-primary/72">
              Step 6 - Review and confirm
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-white/8 bg-black/72">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/72">
                  Order Review
                </div>
                <div className="mt-8 space-y-4">
                  {[
                    ...(reorderDraft
                      ? [["Reorder Of", reorderDraft.parentOrderId]]
                      : []),
                    ["Category", selectedCategory?.name],
                    ["Service", selectedService?.name],
                    ["Plan", selectedPlan?.label],
                    ["Priority", isPriority ? "High" : "Normal"],
                    [
                      "Customer Type",
                      resolvedCustomerType === "returning"
                        ? "Returning customer"
                        : "New customer",
                    ],
                    ["Advance", formatPrice(payment.advancePayment)],
                    ["Remaining", formatPrice(payment.remainingPayment)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-white/8 pb-4 text-sm"
                    >
                      <span className="text-light-gray/54">{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-white/8 bg-black/72">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/72">
                  Requirements
                </div>
                <div className="mt-6 space-y-5 text-sm leading-7 text-light-gray/68">
                  <div>
                    <div className="font-semibold text-white">Name</div>
                    <div>{formData.name}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Email</div>
                    <div>{formData.email}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Phone</div>
                    <div>{formData.phone}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      Project description
                    </div>
                    <div>{formData.projectDescription}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Features</div>
                    <div>{formData.features}</div>
                  </div>
                  {formData.references && (
                    <div>
                      <div className="font-semibold text-white">References</div>
                      <div>{formData.references}</div>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-white">Deadline</div>
                    <div>{formData.deadline}</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="border-cyan-primary/10 bg-secondary-dark/75">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary/72">
                Terms & Conditions
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {TERMS_POINTS.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-black/45 px-5 py-4 text-sm leading-7 text-light-gray/68"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setTermsAccepted((current) => !current)}
                className={`mt-8 flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors ${
                  termsAccepted
                    ? "border-cyan-primary bg-cyan-primary/10"
                    : "border-white/8 bg-black/50"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                    termsAccepted
                      ? "border-cyan-primary bg-cyan-primary text-primary-dark"
                      : "border-white/20 bg-transparent text-transparent"
                  }`}
                >
                  <Check size={13} />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <ShieldCheck size={16} className="text-cyan-primary" />
                    I agree to the Terms & Conditions
                  </div>
                  <div className="mt-2 text-sm text-light-gray/58">
                    The booking will only be confirmed once this is accepted.
                  </div>
                </div>
              </button>
            </Card>

            {submitError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {submitError}
              </div>
            )}

            <div className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-black/65 p-6 md:flex-row md:items-center md:justify-between">
              <div className="text-sm leading-7 text-light-gray/64">
                Confirming now will save the booking, mark its priority state,
                and open the WhatsApp summary for quick follow-up.
              </div>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" onClick={() => handleBack(5)}>
                  <ArrowLeft size={16} /> Edit Review
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!termsAccepted || isSubmitting}
                >
                  {isSubmitting ? "Confirming..." : "Confirm Order"}
                </Button>
              </div>
            </div>
          </div>
        </Step>
      </Stepper>

      <div className="mt-12 rounded-[28px] border border-white/8 bg-black/55 px-6 py-5 text-sm leading-7 text-light-gray/64">
        Need help before confirming? Message us on{" "}
        <a
          href={`https://wa.me/${CONTACT_INFO.whatsappNumber}`}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-cyan-primary"
        >
          WhatsApp
        </a>{" "}
        or go back and adjust the scope.
      </div>
    </div>
  );
};

export default BookService;
