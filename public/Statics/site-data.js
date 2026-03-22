export const CONTACT_INFO = {
  email: "unofficials113@gmail.com",
  whatsappNumber: "918300920680",
  whatsappDisplay: "+91 8300920680",
  instagramHandle: "@tn_web_rats",
  instagramUrl: "https://www.instagram.com/tn_web_rats"
};

export const SERVICE_MAP = {
  ppt: {
    name: "PowerPoint Presentations",
    shortName: "PPTs",
    summary: "Presentation design for seminars, project reviews, client meetings, and investor decks.",
    packages: [
      {
        id: "elite",
        label: "Elite",
        price: 499,
        delivery: "24 hrs",
        badge: "Best Value",
        features: [
          "20 custom-branded slides",
          "Full animations and transitions",
          "Coaching notes",
          "2 revisions",
          "Source file (PPTX)",
          "24-hour delivery"
        ]
      },
      {
        id: "pro",
        label: "Pro",
        price: 299,
        delivery: "48 hrs",
        badge: "Most Popular",
        features: [
          "12 slides with template",
          "Smooth animations",
          "1 revision",
          "Source file (PPTX)",
          "48-hour delivery"
        ]
      },
      {
        id: "starter",
        label: "Starter",
        price: 149,
        delivery: "72 hrs",
        badge: "Starter",
        features: [
          "6 slides clean template",
          "Professional layout",
          "72-hour delivery"
        ]
      }
    ]
  },
  poster: {
    name: "Posters and Graphics",
    shortName: "Posters",
    summary: "Poster systems for events, campaigns, social content, and branded print-ready graphics.",
    packages: [
      {
        id: "brand_kit",
        label: "Brand Kit",
        price: 799,
        delivery: "48 hrs",
        badge: "Best Value",
        features: [
          "5 custom poster designs",
          "Logo included",
          "Social media kit (8 sizes)",
          "Brand colour palette",
          "3 revisions",
          "Source files",
          "Commercial licence"
        ]
      },
      {
        id: "campaign",
        label: "Campaign",
        price: 399,
        delivery: "36 hrs",
        badge: "Most Popular",
        features: [
          "3 poster designs",
          "Social media sizes",
          "2 revisions",
          "PNG and PDF delivery"
        ]
      },
      {
        id: "single",
        label: "Single",
        price: 149,
        delivery: "72 hrs",
        badge: "Single",
        features: [
          "1 poster design",
          "1 revision",
          "PNG and PDF delivery"
        ]
      }
    ]
  },
  website: {
    name: "Website Development",
    shortName: "Websites",
    summary: "Landing pages and business websites with responsive layouts, forms, and launch support.",
    packages: [
      {
        id: "business_pro",
        label: "Business Pro",
        price: 4999,
        delivery: "7 days",
        badge: "Best Value",
        features: [
          "8-page custom design",
          "Fully responsive",
          "Contact forms",
          "Google Analytics",
          "On-page SEO",
          "3 revisions",
          "1-month support",
          "Domain guidance"
        ]
      },
      {
        id: "standard",
        label: "Standard",
        price: 2499,
        delivery: "5 days",
        badge: "Most Popular",
        features: [
          "4-page template",
          "Fully responsive",
          "Contact form",
          "2 revisions",
          "2-week support"
        ]
      },
      {
        id: "landing",
        label: "Landing Page",
        price: 999,
        delivery: "3 days",
        badge: "Landing",
        features: [
          "Single landing page",
          "Fully responsive",
          "Contact form",
          "1 revision"
        ]
      }
    ]
  }
};

export const SERVICE_LIST = Object.entries(SERVICE_MAP).map(([id, service]) => ({ id, ...service }));

export const CLIENT_FAQS = [
  {
    question: "How is pricing calculated?",
    answer:
      "The booking page is the source of truth. It shows original package price, any referral discount, GST, and the online gateway fee separately before checkout."
  },
  {
    question: "Do you still support WhatsApp or manual bookings?",
    answer:
      "Yes. You can create a manual booking through WhatsApp. The dashboard now stores that order in the database with the manual total so your booking does not get lost."
  },
  {
    question: "What are the current delivery windows?",
    answer:
      "PPT packages range from 24 to 72 hours, poster packages range from 36 to 72 hours, and websites range from 3 to 7 days depending on the package you choose."
  },
  {
    question: "How many revisions are included?",
    answer:
      "Revisions depend on the package. Starter and single-deliverable plans include fewer revisions, while premium packages include more revision cycles and source files where listed."
  },
  {
    question: "How do referrals work?",
    answer:
      "Referral discounts are tied to the staff member who referred you. The discount is stored on your user profile and automatically applied in checkout."
  },
  {
    question: "How do I track my project after payment?",
    answer:
      "After login you can use your profile page to review orders, billing totals, status, and delivery history. Staff users also get dashboard access based on role."
  },
  {
    question: "What payment methods are supported?",
    answer:
      "Razorpay online checkout is supported for cards, UPI, and compatible methods. Manual WhatsApp orders can still be coordinated for cash or direct transfer if needed."
  },
  {
    question: "Will my registration be saved?",
    answer:
      "Yes. Customer and staff registrations are written into the users collection in Firestore, including role, referral metadata, and timestamps."
  }
];

export const WORKER_FAQS = [
  {
    question: "How do workers receive assignments?",
    answer:
      "Managers can assign up to 2 workers directly. If an order needs more than 2 workers, admin, superadmin, or owner approval is required before the larger team is attached."
  },
  {
    question: "How is pay handled?",
    answer:
      "The dashboard keeps salary allotments and payout requests in the database. Workers, managers, admins, and superadmins can see their available balance and request redemption when allowed by role rules."
  },
  {
    question: "When do payouts happen?",
    answer:
      "Payroll is designed around monthly processing with redemption requests tracked separately. The dashboard already stores next-pay and payout request records, and backend hardening is being completed before launch."
  },
  {
    question: "How do I report a problem?",
    answer:
      "The role dashboards include reporting tabs so workers can raise issues to managers, admins, or superadmins. These reports are stored in Firestore for follow-up."
  },
  {
    question: "Can workers communicate with clients?",
    answer:
      "Yes. Workers can exchange samples with clients through the dashboard flow. Access still follows role-based controls so sensitive actions can be approved when needed."
  }
];

export const ABOUT_POINTS = [
  "Role-based dashboards for owner, superadmin, admin, manager, worker, and customer flows.",
  "Server-verified checkout with GST and billing breakdowns shown before payment.",
  "Shared project handling for PPTs, posters, graphics, and websites with tracked delivery windows.",
  "Referral-aware accounts, payout tracking, reporting tools, and cloud-ready Firestore rules."
<<<<<<< HEAD
];
=======
];
>>>>>>> b344e4367531f76f877c8b38de94eec732d42d27
