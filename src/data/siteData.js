export const CONTACT_INFO = {
  email: "rynix@gmail.com",
  whatsappNumber: "918300920680",
  whatsappDisplay: "+91 8300920680",
  instagramHandle: "@tn_web_rats",
  instagramUrl: "https://www.instagram.com/tn_web_rats",
  upiId: "abijithka2007@oksbi", // Placeholder: please update with real VPA
};

export const VALUE_POINTS = [
  {
    id: "purpose",
    title: "Built With Purpose",
    summary:
      "No lazy templates. No copy-paste work. Every project is shaped around the idea you are trying to put into the world.",
  },
  {
    id: "speed",
    title: "Fast And Reliable",
    summary:
      "Deadlines are real. We keep communication direct, move quickly, and still keep the output polished.",
  },
  {
    id: "direct",
    title: "You Work With Us Directly",
    summary:
      "No middle layers. No getting passed around. You talk to the two people actually building the work.",
  },
];

const buildPlans = (basic, standard, premium) => [
  {
    id: "basic",
    label: "Basic",
    badge: "Starter",
    price: basic.price,
    delivery: basic.delivery,
    features: basic.features,
  },
  {
    id: "standard",
    label: "Standard",
    badge: "Best Value",
    price: standard.price,
    delivery: standard.delivery,
    features: standard.features,
  },
  {
    id: "premium",
    label: "Premium",
    badge: "Premium",
    price: premium.price,
    delivery: premium.delivery,
    features: premium.features,
  },
];

export const SERVICE_CATEGORIES = [
  {
    id: "presentation-design",
    name: "Presentation & Design",
    shortName: "Design",
    navLabel: "Design",
    pricingHint: "Starting from Rs 99",
    cta: "Get Design Service",
    description:
      "Professional designs for academic, business, and social media needs.",
    heroDescription:
      "Slides, posters, and social assets that help your message land cleanly and look intentional.",
    bestFor: [
      "Students, founders, event teams, and personal brands.",
      "Fast-turnaround work that still needs a sharp visual finish.",
    ],
    services: [
      {
        id: "ppt-creation",
        name: "PPT Creation",
        shortName: "PPT",
        summary:
          "Clean, modern slide decks for academic reviews, pitches, proposals, and presentations that need a stronger visual voice.",
        bestFor:
          "Students, entrepreneurs, college projects, business pitches",
        deliverables: [
          "Structured slides with modern layouts",
          "Business, academic, and competition deck support",
          "Custom design direction for your message",
          "Fast delivery with revision room",
        ],
        image: "/Images/Project_Preview/Project_Preview_1.png",
        plans: buildPlans(
          {
            price: 99,
            delivery: "3 days",
            features: [
              "Up to 8 polished slides",
              "Clean academic or business layout",
              "One revision round",
            ],
          },
          {
            price: 249,
            delivery: "48 hrs",
            features: [
              "Up to 15 custom slides",
              "Stronger visual hierarchy",
              "Animations and speaker notes support",
            ],
          },
          {
            price: 499,
            delivery: "24 hrs",
            features: [
              "Premium pitch deck finish",
              "Brand-aware slide styling",
              "Priority revision support",
            ],
          }
        ),
      },
      {
        id: "poster-design",
        name: "Poster Design",
        shortName: "Poster",
        summary:
          "Posters, flyers, and promo visuals that feel bold, readable, and built to stop the scroll.",
        bestFor: "Events, college fests, businesses, personal branding",
        deliverables: [
          "Event posters and promotional flyers",
          "Digital and print-ready output",
          "Bold composition with readable hierarchy",
          "Custom visual direction for your audience",
        ],
        image: "/Images/Project_Preview/Project_Preview_7.png",
        plans: buildPlans(
          {
            price: 149,
            delivery: "72 hrs",
            features: [
              "One poster concept",
              "Digital export set",
              "One revision round",
            ],
          },
          {
            price: 299,
            delivery: "48 hrs",
            features: [
              "Two visual directions",
              "Social and print sizes",
              "Two revision rounds",
            ],
          },
          {
            price: 549,
            delivery: "24 hrs",
            features: [
              "Campaign-ready hero poster",
              "Multiple export sizes",
              "Priority turnaround and updates",
            ],
          },
        ),
      },
      {
        id: "social-media-posts",
        name: "Social Media Posts",
        shortName: "Social",
        summary:
          "Post packs and branded content systems that keep your feed consistent without looking repetitive.",
        bestFor: "Creators, clubs, launch campaigns, small businesses",
        deliverables: [
          "Instagram post packs and promos",
          "Consistent brand styling",
          "Feed-ready and story-ready exports",
          "Monthly content pack options",
        ],
        image: "/Images/Project_Preview/Project_Preview_3.png",
        plans: buildPlans(
          {
            price: 199,
            delivery: "4 days",
            features: [
              "Three-post mini pack",
              "Reusable visual direction",
              "Exported for standard social sizes",
            ],
          },
          {
            price: 399,
            delivery: "72 hrs",
            features: [
              "Seven-post campaign pack",
              "Caption cue support",
              "Story variants included",
            ],
          },
          {
            price: 799,
            delivery: "48 hrs",
            features: [
              "Monthly social starter pack",
              "Brand system consistency",
              "Priority design queue",
            ],
          },
        ),
      },
    ],
  },
  {
    id: "web-development",
    name: "Web Development",
    shortName: "Web",
    navLabel: "Web Development",
    pricingHint: "Starting from Rs 999",
    cta: "Build My Website",
    description: "Modern, responsive websites tailored to your needs.",
    heroDescription:
      "Responsive web builds that look sharp, load fast, and feel clear on both desktop and mobile.",
    bestFor: [
      "Startups, small businesses, freelancers, student portfolios",
      "Landing pages, portfolios, and multi-page company sites",
    ],
    services: [
      {
        id: "portfolio-website",
        name: "Portfolio Websites",
        shortName: "Portfolio",
        summary:
          "Personal and student portfolio websites with clean UI, responsive layouts, and enough character to stand out.",
        bestFor: "Students, developers, freelancers, creatives",
        deliverables: [
          "Responsive portfolio structure",
          "Project showcase sections",
          "Contact and call-to-action blocks",
          "Clean UI tuned for mobile first",
        ],
        image: "/Images/Project_Preview/Project_Preview_5.jpg",
        plans: buildPlans(
          {
            price: 999,
            delivery: "5 days",
            features: [
              "Single-page portfolio",
              "Responsive layout",
              "Basic contact section",
            ],
          },
          {
            price: 2499,
            delivery: "7 days",
            features: [
              "Multi-section portfolio",
              "Custom visual direction",
              "Project filtering or highlight cards",
            ],
          },
          {
            price: 4999,
            delivery: "10 days",
            features: [
              "Multi-page personal brand site",
              "Case-study ready layout",
              "Priority launch support",
            ],
          },
        ),
      },
      {
        id: "landing-pages",
        name: "Landing Pages",
        shortName: "Landing",
        summary:
          "Focused pages for launches, products, or events with strong hierarchy and conversion-minded structure.",
        bestFor: "Startups, products, campaigns, event launches",
        deliverables: [
          "Conversion-focused one-page build",
          "Responsive hero and CTA sections",
          "Fast-loading structure",
          "Clear copy hierarchy",
        ],
        image: "/Images/Project_Preview/Project_Preview_2.jpg",
        plans: buildPlans(
          {
            price: 999,
            delivery: "4 days",
            features: [
              "Single launch page",
              "Responsive sections",
              "Basic form integration",
            ],
          },
          {
            price: 1799,
            delivery: "6 days",
            features: [
              "Custom section flow",
              "More detailed CTA and proof blocks",
              "Animation polish",
            ],
          },
          {
            price: 3499,
            delivery: "8 days",
            features: [
              "Launch-ready premium landing page",
              "Stronger storytelling layout",
              "Priority revisions before go-live",
            ],
          },
        ),
      },
      {
        id: "business-websites",
        name: "Business Websites",
        shortName: "Business",
        summary:
          "Professional company websites with multiple pages, trust-building sections, and a clearer online presence.",
        bestFor: "Small businesses, agencies, local brands, service teams",
        deliverables: [
          "Multi-page company site structure",
          "Service pages and business sections",
          "SEO-aware layout decisions",
          "Professional visual consistency",
        ],
        image: "/Images/Project_Preview/Project_Preview_4.jpg",
        plans: buildPlans(
          {
            price: 1999,
            delivery: "7 days",
            features: [
              "Basic company website",
              "Up to 4 key sections or pages",
              "Responsive navigation and contact form",
            ],
          },
          {
            price: 4999,
            delivery: "10 days",
            features: [
              "Expanded service architecture",
              "Brand-matched layouts",
              "Conversion and content guidance",
            ],
          },
          {
            price: 8999,
            delivery: "14 days",
            features: [
              "Premium multi-page build",
              "Advanced component polish",
              "Priority delivery workflow",
            ],
          },
        ),
      },
    ],
  },
  {
    id: "fix-optimization",
    name: "Fix & Optimization",
    shortName: "Fix",
    navLabel: "Fix & Optimization",
    pricingHint: "Starting from Rs 199",
    cta: "Fix My Website",
    description:
      "Improve and fix your existing website quickly and efficiently.",
    heroDescription:
      "Quick-turn support for websites that need cleanup, better UX, or faster performance without a full rebuild.",
    bestFor: [
      "Existing sites that need specific fixes instead of a full redesign",
      "Teams that need quick support before launch or review",
    ],
    services: [
      {
        id: "bug-fixing",
        name: "Bug Fixing",
        shortName: "Bug Fix",
        summary:
          "Targeted debugging for broken interactions, layout issues, routing problems, and obvious frontend regressions.",
        bestFor: "Launch prep, broken UI states, small urgent fixes",
        deliverables: [
          "Issue diagnosis and cleanup",
          "Cross-device behavior checks",
          "Focused fixes with a clear handoff",
          "Short turnaround support",
        ],
        image: "/Images/Project_Preview/Project_Preview_6.png",
        plans: buildPlans(
          {
            price: 199,
            delivery: "48 hrs",
            features: [
              "One focused issue fix",
              "Basic regression check",
              "Short notes on the change",
            ],
          },
          {
            price: 499,
            delivery: "36 hrs",
            features: [
              "Up to three related fixes",
              "Responsive check across breakpoints",
              "Implementation cleanup",
            ],
          },
          {
            price: 999,
            delivery: "24 hrs",
            features: [
              "Urgent bug-fix batch",
              "Priority queue handling",
              "Polish pass after repair",
            ],
          },
        ),
      },
      {
        id: "ui-improvements",
        name: "UI Improvements",
        shortName: "UI Upgrade",
        summary:
          "Sharper layout, spacing, readability, and interaction polish for pages that feel unfinished or dated.",
        bestFor: "Student sites, portfolio refreshes, pre-demo cleanup",
        deliverables: [
          "Visual cleanup and spacing polish",
          "Stronger hierarchy and readability",
          "Mobile-first improvement pass",
          "Focused component refinements",
        ],
        image: "/Images/Project_Preview/Project_Preview_3.png",
        plans: buildPlans(
          {
            price: 299,
            delivery: "3 days",
            features: [
              "One page visual cleanup",
              "Spacing and type polish",
              "Basic responsive pass",
            ],
          },
          {
            price: 699,
            delivery: "48 hrs",
            features: [
              "Multi-section UI refresh",
              "Component styling updates",
              "Motion and interaction polish",
            ],
          },
          {
            price: 1299,
            delivery: "36 hrs",
            features: [
              "High-priority interface overhaul",
              "Layout consistency review",
              "Priority turnaround",
            ],
          },
        ),
      },
      {
        id: "speed-optimization",
        name: "Speed Optimization",
        shortName: "Performance",
        summary:
          "Frontend performance tuning for heavy pages that feel slower than they should during actual use.",
        bestFor: "Pages with sluggish load, animation lag, or oversized assets",
        deliverables: [
          "Asset and rendering review",
          "Performance-focused cleanup",
          "Perceived speed improvements",
          "Before-and-after recommendations",
        ],
        image: "/Images/Project_Preview/Project_Preview_5.jpg",
        plans: buildPlans(
          {
            price: 399,
            delivery: "3 days",
            features: [
              "Single-page optimization pass",
              "Image and asset cleanup",
              "Quick performance notes",
            ],
          },
          {
            price: 899,
            delivery: "48 hrs",
            features: [
              "Multi-section optimization sweep",
              "Render and asset tuning",
              "Priority issue list",
            ],
          },
          {
            price: 1599,
            delivery: "36 hrs",
            features: [
              "Priority performance sprint",
              "Heavier frontend cleanup",
              "Follow-up guidance after delivery",
            ],
          },
        ),
      },
    ],
  },
  {
    id: "templates-assets",
    name: "Templates & Assets",
    shortName: "Templates",
    navLabel: "Templates",
    pricingHint: "Starting from Rs 49",
    cta: "Browse Templates",
    description: "Ready-to-use templates for quick and professional results.",
    heroDescription:
      "Useful starting points when you need something quick, clean, and adaptable without a full custom build.",
    bestFor: [
      "Quick launches, reusable kits, student-ready deliverables",
      "People who need a strong base before adding their own content",
    ],
    services: [
      {
        id: "website-templates",
        name: "Website Templates",
        shortName: "Web Template",
        summary:
          "Pre-built website foundations for faster launches with a cleaner starting point than generic freebies.",
        bestFor: "Student brands, early startups, internal mockups",
        deliverables: [
          "Responsive starter templates",
          "Editable sections and reusable blocks",
          "Cleaner launch-ready structure",
          "Faster setup time",
        ],
        image: "/Images/Project_Preview/Project_Preview_2.jpg",
        plans: buildPlans(
          {
            price: 149,
            delivery: "48 hrs",
            features: [
              "Single starter template",
              "Editable hero and content blocks",
              "Basic setup notes",
            ],
          },
          {
            price: 399,
            delivery: "36 hrs",
            features: [
              "Polished template pack",
              "Multiple reusable sections",
              "Minor customization pass",
            ],
          },
          {
            price: 799,
            delivery: "24 hrs",
            features: [
              "Premium template system",
              "Priority delivery",
              "Launch-oriented structure review",
            ],
          },
        ),
      },
      {
        id: "portfolio-templates",
        name: "Portfolio Templates",
        shortName: "Portfolio Kit",
        summary:
          "Portfolio starter kits for students and creators who need structure fast without starting from a blank file.",
        bestFor: "Students, designers, developers, creators",
        deliverables: [
          "Reusable portfolio sections",
          "Clean project presentation layout",
          "Easy-to-edit content blocks",
          "Responsive base structure",
        ],
        image: "/Images/Project_Preview/Project_Preview_1.png",
        plans: buildPlans(
          {
            price: 99,
            delivery: "48 hrs",
            features: [
              "Starter portfolio template",
              "Single-page structure",
              "Simple customization notes",
            ],
          },
          {
            price: 249,
            delivery: "36 hrs",
            features: [
              "Expanded portfolio layout",
              "Project showcase variants",
              "Contact section included",
            ],
          },
          {
            price: 499,
            delivery: "24 hrs",
            features: [
              "Premium creator kit",
              "Priority template delivery",
              "Multi-section polish",
            ],
          },
        ),
      },
      {
        id: "ppt-templates",
        name: "PPT Templates",
        shortName: "Slide Kit",
        summary:
          "Ready-to-edit presentation templates that give you a cleaner base than default slide decks.",
        bestFor: "Academic reviews, college events, startup decks",
        deliverables: [
          "Presentation templates with structure",
          "Slide master consistency",
          "Quick-start brand-ready layouts",
          "Editable content placeholders",
        ],
        image: "/Images/Project_Preview/Project_Preview_4.jpg",
        plans: buildPlans(
          {
            price: 49,
            delivery: "24 hrs",
            features: [
              "Simple slide starter pack",
              "Core title and content slides",
              "Quick-use editable file",
            ],
          },
          {
            price: 149,
            delivery: "24 hrs",
            features: [
              "Expanded slide system",
              "Visual consistency kit",
              "Academic or pitch style options",
            ],
          },
          {
            price: 299,
            delivery: "24 hrs",
            features: [
              "Premium template bundle",
              "Priority support",
              "Multiple theme variants",
            ],
          },
        ),
      },
    ],
  },
];

export const SERVICE_CATEGORY_MAP = Object.fromEntries(
  SERVICE_CATEGORIES.map((category) => [category.id, category])
);

export const SERVICE_LIST = SERVICE_CATEGORIES.flatMap((category) =>
  category.services.map((service) => ({
    ...service,
    categoryId: category.id,
    categoryName: category.name,
    categoryShortName: category.shortName,
    categoryDescription: category.description,
    pricingHint: category.pricingHint,
    cta: category.cta,
    startingPrice: Math.min(...service.plans.map((plan) => plan.price)),
  }))
);

export const SERVICE_MAP = Object.fromEntries(
  SERVICE_LIST.map((service) => [service.id, service])
);

export const BOOKING_STEP_LABELS = [
  "Category",
  "Service",
  "Plan",
  "Details",
  "Payment",
  "Review",
];

export const WHY_CHOOSE_US = [
  "Affordable pricing",
  "Fast delivery",
  "Beginner-friendly service",
  "Custom solutions",
];

export const CLIENT_FAQS = [
  {
    question: "How do I know which service to pick?",
    answer:
      "Start with the category that matches the outcome you need. If you are still unsure, book the closest option and use the requirements box - we can refine the scope from there.",
  },
  {
    question: "What does priority delivery do?",
    answer:
      "Priority delivery moves your project higher in the queue and increases the quoted total. The exact fee is shown before you confirm the order.",
  },
  {
    question: "How does the upfront payment work?",
    answer:
      "New customers are shown a 70 percent advance. Returning customers are shown a 50 percent advance. The remaining amount is due on completion.",
  },
  {
    question: "Can I send references and detailed requirements?",
    answer:
      "Yes. The booking flow includes fields for your project description, feature list, references, and deadline so we can work from your exact brief.",
  },
  {
    question: "Do you handle both digital and print-ready output?",
    answer:
      "Yes. Design deliverables can be prepared for digital posting, presentations, or print depending on the service you choose.",
  },
  {
    question: "What if I need something custom?",
    answer:
      "Use the closest service and explain the custom scope in your requirements. We can adjust the plan after reviewing the request.",
  },
];

export const WORKER_FAQS = [
  {
    question: "How are orders marked for urgency?",
    answer:
      "Priority bookings are stored with a high-priority flag so the delivery team can identify them quickly.",
  },
  {
    question: "What details are saved with a booking?",
    answer:
      "Orders store the category, service, plan, priority state, customer inputs, payment summary, status, and timestamp so the internal team has a complete handoff.",
  },
  {
    question: "Can staff see deadlines and customer type?",
    answer:
      "Yes. The booking data includes the customer deadline and whether the order was treated as a new or returning-customer payment flow.",
  },
  {
    question: "How should incomplete briefs be handled?",
    answer:
      "If requirements are thin, use the stored reference links, feature notes, and project description first, then follow up with the client for anything blocking delivery.",
  },
];

export const HELP_PROMISES = [
  {
    title: "Clear pricing",
    text:
      "You see the base price, priority fee when selected, upfront amount, and remaining payment before confirming.",
  },
  {
    title: "Direct communication",
    text:
      "You are speaking to the people building the work, not a relay chain that keeps losing your brief.",
  },
  {
    title: "Practical support",
    text:
      "If you are stuck, message support with your order details and we will help shape the right service path.",
  },
];

export const FEATURED_PROJECTS = [
  {
    id: "autobit",
    title: "AutoBit",
    category: "Web Development / Software",
    status: "Ongoing",
    description:
      "A co-built product by WaveWalker and Mr_Ratty. The public case study is still being written, but the build is active and moving.",
    builtBy: "WaveWalker & Mr_Ratty",
    image: "/Images/gears/gear_1.webp",
  },
  {
    id: "studio-slot",
    title: "Upcoming Client Launch",
    category: "Website / Poster / PPT",
    status: "Ongoing",
    description:
      "A second ongoing client slot is currently under wraps. Details will be published once the project is ready to go public.",
    builtBy: "WaveWalker & Mr_Ratty",
    image: "/Images/gears/gear_2.webp",
  },
  {
    id: "design-vault",
    title: "Design Vault",
    category: "Mixed Deliverables",
    status: "Expanding",
    description:
      "A growing collection of presentation, poster, and web work that shows the range of what Rynix ships.",
    builtBy: "Rynix",
    image: "/Images/gears/gear_3.webp",
  },
  {
    id: "PlaceHolder1",
    title: "PlaceHolder1",
    category: "PlaceHolder1",
    status: "PlaceHolder1",
    description: "PlaceHolder1",
    builtBy: "PlaceHolder1",
    image: "ImageDir",
  },
  {
    id: "PlaceHolder2",
    title: "PlaceHolder2",
    category: "PlaceHolder2",
    status: "PlaceHolder2",
    description: "PlaceHolder2",
    builtBy: "PlaceHolder2",
    image: "ImageDir",
  },
  {
    id: "PlaceHolder3",
    title: "PlaceHolder3",
    category: "PlaceHolder3",
    status: "PlaceHolder3",
    description: "PlaceHolder3",
    builtBy: "PlaceHolder3",
    image: "ImageDir",
  }
];

export const PORTFOLIO_GALLERY = [
  {
    id: "gallery-1",
    title: "Presentation Work",
    image: "/Images/Project_Preview/ppt_2.jpg",
  },
  {
    id: "gallery-2",
    title: "Brand And Web Visuals",
    image: "/Images/Project_Preview/website_1.png",
  },
  {
    id: "gallery-3",
    title: "Creative Posters",
    image: "/Images/Project_Preview/poster_1.png",
  },
  {
    id: "gallery-4",
    title: "Website Snapshots",
    image: "/Images/Project_Preview/website_2.png",
  },
  {
    id: "gallery-5",
    title: "Academic & Pitch Decks",
    image: "/Images/Project_Preview/ppt_1.jpg",
  },
];
 export const HORIZONTAL_PROJECTS = [
  {
    id: "PlaceHolder1",
    title: "PlaceHolder1",
    category: "PlaceHolder1",
    status: "PlaceHolder1",
    description: "PlaceHolder1",
    builtBy: "PlaceHolder1",
    image: "ImageDir",
  },
  {
    id: "PlaceHolder2",
    title: "PlaceHolder2",
    category: "PlaceHolder2",
    status: "PlaceHolder2",
    description: "PlaceHolder2",
    builtBy: "PlaceHolder2",
    image: "public/Images/for_templates/res_1.png",
  },
  {
    id: "PlaceHolder3",
    title: "PlaceHolder3",
    category: "PlaceHolder3",
    status: "PlaceHolder3",
    description: "PlaceHolder3",
    builtBy: "PlaceHolder3",
    image: "ImageDir",
  }
 ]

export const ABOUT_POINTS = [
  "Two founders working directly with the people they build for.",
  "A service mix that covers design, web builds, template kits, and quick-fix support.",
  "A booking flow built to capture project scope cleanly before delivery starts.",
  "A growing studio system designed to support clearer order handling and faster handoffs.",
];

export const TEAM_MEMBERS = [
  {
    id: "ratty",
    name: "Mr_Ratty",
    role: "Founder & Creative Director",
    image: "/Images/Icons/logo.jpg",
    intro:
      "Mr_Ratty leads the visual side of the studio - posters, graphics, presentations, and the look-and-feel decisions that make the work feel bold instead of generic.",
    skills: [
      "Graphic & poster design",
      "Presentation design",
      "UI and visual direction",
      "Creative concept development",
    ],
  },
  {
    id: "wavewalker",
    name: "WaveWalker",
    role: "Co-Founder & Lead Developer",
    image: "/Images/Icons/logo.jpg",
    intro:
      "WaveWalker drives the web side of Rynix - translating ideas into responsive interfaces, cleaner structures, and builds that feel deliberate on both mobile and desktop.",
    skills: [
      "React and frontend development",
      "UI and interaction structure",
      "Problem solving and technical design",
      "Portfolio and business site builds",
    ],
  },
];

export const STATS = [
  { label: "Founders", value: "2" },
  { label: "Service Lanes", value: "4" },
  { label: "Core Offers", value: "12" },
  { label: "Direct Contact", value: "Always" },
];

export const TERMS_POINTS = [
  "Projects move step by step and begin after the advance amount is confirmed.",
  "Priority delivery increases the total and flags the order as high priority for the internal team.",
  "Deadlines should be realistic and based on complete, usable requirements from the client side.",
  "The remaining balance is due once the project reaches the delivery stage.",
];

export const PAYMENT_RULES = {
  newCustomerAdvanceRate: 0.7,
  returningCustomerAdvanceRate: 0.5,
  priorityMultiplier: 0.2,
  minimumPriorityFee: 99,
};

export const getCategoryById = (categoryId) => SERVICE_CATEGORY_MAP[categoryId];

export const getServiceById = (serviceId) => SERVICE_MAP[serviceId];

export const getPlanById = (serviceId, planId) =>
  SERVICE_MAP[serviceId]?.plans.find((plan) => plan.id === planId);

export const getPriorityFee = (basePrice) =>
  Math.max(
    PAYMENT_RULES.minimumPriorityFee,
    Math.round(basePrice * PAYMENT_RULES.priorityMultiplier)
  );

export const getAdvanceRate = (customerType) =>
  customerType === "returning"
    ? PAYMENT_RULES.returningCustomerAdvanceRate
    : PAYMENT_RULES.newCustomerAdvanceRate;

export const buildPaymentBreakdown = ({
  basePrice,
  isPriority = false,
  customerType = "new",
  referralDiscountPercent = 0,
}) => {
  const priorityFee = isPriority ? getPriorityFee(basePrice) : 0;
  const subtotal = basePrice + priorityFee;
  const advanceRate = getAdvanceRate(customerType);
  const discountPercent = Math.max(0, Number(referralDiscountPercent || 0));
  const discountAmount = Math.min(
    subtotal,
    Math.round(subtotal * (discountPercent / 100))
  );
  const total = subtotal - discountAmount;
  const advancePayment = Math.round(total * advanceRate);
  const remainingPayment = total - advancePayment;

  return {
    basePrice,
    priorityFee,
    subtotal,
    discountPercent,
    discountAmount,
    total,
    advanceRate,
    advancePayment,
    remainingPayment,
  };
};
