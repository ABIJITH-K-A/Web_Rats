# TN WEB RATS - React Version Project Mindmap

## Project Overview
**TN WEB RATS** is a freelance service marketplace web application built with React, targeting students, creators, and small businesses. It provides digital solutions including presentation design, web development, bug fixing, and templates.

---

## 1. Project Configuration & Build Setup

### 1.1 Package Configuration (`package.json`)
- **Build Tool**: Vite 8.0.1
- **React Version**: 19.2.4
- **Type**: ES Module (`"type": "module"`)
- **Version**: 0.0.0 (private)

#### Scripts
```
├── dev       → vite (Development server)
├── build     → vite build (Production build)
├── lint      → eslint . (Code linting)
└── preview   → vite preview (Preview production build)
```

#### Core Dependencies
```
├── Firebase Ecosystem
│   ├── firebase ^12.11.0        (Auth, Firestore, Storage)
├── Animation & Effects
│   ├── framer-motion ^12.38.0   (Component animations)
│   ├── gsap ^3.14.2             (Advanced animations)
│   ├── lenis ^1.3.19            (Smooth scrolling)
├── UI & Icons
│   ├── lucide-react ^0.577.0    (Icon library)
├── Routing
│   ├── react-router-dom ^7.13.1 (SPA routing)
└── Charts
    └── recharts ^3.8.0          (Data visualization)
```

#### Dev Dependencies
```
├── @tailwindcss/vite ^4.2.2     (Tailwind CSS integration)
├── tailwindcss ^4.2.2           (Utility-first CSS)
├── autoprefixer ^10.4.27        (CSS vendor prefixes)
├── postcss ^8.5.8               (CSS processing)
├── eslint ^9.39.4               (Linting)
└── @vitejs/plugin-react ^6.0.1 (React Fast Refresh)
```

### 1.2 Vite Configuration (`vite.config.js`)
```
Plugins:
├── @vitejs/plugin-react    → React Fast Refresh
├── @tailwindcss/vite       → Tailwind CSS compilation

OptimizeDeps (Pre-bundled):
├── recharts
├── react-is
└── lenis/react
```

### 1.3 Environment Variables (`.env`)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

## 2. Application Architecture

### 2.1 Entry Points
```
index.html               → HTML entry with root div
src/main.jsx            → React app mounting point
src/App.jsx             → Root application component
```

### 2.2 Application Hierarchy (`App.jsx`)
```
AuthProvider
└── DashboardProvider
    └── BrowserRouter
        └── ScrollToTop
            └── RootLayout
                └── Routes (Conditional rendering)
                    ├── Public Routes
                    ├── Auth Routes
                    └── Protected Dashboard Route
```

### 2.3 Route Structure
```
PUBLIC ROUTES (7)
├── /                     → Home (Landing page)
├── /services             → Services (Category-based service listing)
├── /service/:serviceId   → ServiceDetail (Individual service page)
├── /about                → About (Company info, team)
├── /projects             → Projects (Portfolio showcase)
├── /help                 → Help (FAQ, support)
└── /book                 → BookService (Multi-step booking flow)

AUTH ROUTES (4)
├── /join                 → JoinHub (Login/Signup tabs)
├── /signup               → JoinHub (Alias)
├── /forgot-password      → ForgotPassword
└── /profile              → Profile (User profile management)

PROTECTED ROUTE (1)
└── /dashboard            → AdminDashboard
    └── ProtectedRoute (Role-based access)
        Allowed: owner, superadmin, admin, manager, worker

CATCH-ALL
└── *                     → 404 Page Under Construction
```

---

## 3. State Management & Context

### 3.1 Authentication Context (`AuthContext.jsx`)

#### State Variables
```
├── user                    → Firebase Auth user object
├── userProfile             → Firestore user document data
├── role                    → User role (lowercase)
└── loading                 → Auth initialization state
```

#### Authentication Methods
```
├── login(email, password)              → Email/password signin
├── signup(email, password, extraData)   → Customer registration
│   └── Creates: users, wallets, referralCodes docs
├── staffSignup(email, password, extraData) → Staff registration
│   └── Validates: inviteKeys, assigns staff role
├── resetPassword(email)                → Password reset email
└── logout()                            → Sign out
```

#### Helper Functions
```
makeReferralCode(role)    → Generate TNWR-{ROLE}-{XXXX} codes
userFriendlyError(code)   → Map Firebase errors to messages
```

#### Role Tiers (Referral System)
```
┌────────────┬────────┬─────┐
│ Role       │ Code   │ %   │
├────────────┼────────┼─────┤
│ worker     │ WRK    │ 5   │
│ manager    │ MGR    │ 10  │
│ admin      │ ADM    │ 15  │
│ superadmin │ SA     │ 20  │
│ owner      │ OWR    │ 25  │
└────────────┴────────┴─────┘
```

#### Exposed Values
```
user, userProfile, userData, role, loading,
login, signup, staffSignup, logout, resetPassword,
isAdmin, isManager, isWorker, isClient, isStaff
```

### 3.2 Dashboard Context (`DashboardContext.jsx`)

#### State Variables
```
├── searchQuery     → Global search term
├── notifications   → User notification list
└── unreadCount     → Unread notification count
```

#### Notification Query Logic
```
Admin/Owner/Superadmin:
└── Query: notifications (all) → orderBy createdAt desc → limit 20

Other Users:
└── Query: notifications
    └── where recipientId in [user.uid, 'all', userProfile.role]
    └── orderBy createdAt desc
    └── limit 20
```

#### Methods
```
├── markAsRead(notificationId)     → Update read status
└── markAllAsRead()                → Batch mark all unread
```

---

## 4. Component Architecture

### 4.1 Layout Components (`/components/layout/`)

#### RootLayout (`RootLayout.jsx`)
```
Purpose: Application shell with global effects
├── ReactLenis (root)        → Smooth scroll provider
├── NeuralBackground          → Animated grid background
├── Conditional Navbar      → Hidden on dashboard/profile
├── AnimatePresence (main)  → Route transition animations
│   ├── initial: { opacity: 0, y: 20 }
│   ├── animate: { opacity: 1, y: 0 }
│   ├── exit: { opacity: 0, y: -20 }
│   └── duration: 0.4s easeOut
└── Conditional Footer      → Hidden on dashboard/profile

Props: { children }
Logic: isDashboardRoute = pathname in ['/dashboard', '/profile']
```

#### Navbar (`Navbar.jsx`)
```
Features:
├── Logo/Brand link
├── Navigation links (responsive)
├── Mobile menu toggle
├── User auth state display
└── Notification indicator (if authenticated)
```

#### Footer (`Footer.jsx`)
```
Sections:
├── Brand & description
├── Quick links
├── Contact information
├── Social links
└── Copyright
```

#### NeuralBackground (`NeuralBackground.jsx`)
```
Visual Effect:
├── Fixed position backdrop
├── Animated grid lines
├── Green tint (#67F81D at 4% opacity)
├── 40px grid size
└── 30s infinite animation
```

### 4.2 UI Primitives (`/components/ui/`)

#### Primitives (`Primitives.jsx`)
```
Button Component:
├── Variants: primary | outline | ghost
├── primary: bg-primary-dark, border-cyan-primary/80
├── outline: bg-black/25, border-cyan-primary/55
├── ghost: text-light-gray hover:text-cyan-primary
├── Motion: whileHover={{ y: -3 }}, whileTap={{ scale: 0.98 }}
└── Styling: rounded-full, px-8 py-3, font-bold

Card Component:
├── Motion: whileHover={{ y: -10 }}
├── Base: bg-secondary-dark, rounded-2xl
├── Border: border-white/5
└── Shadow: shadow-xl

SectionHeading Component:
├── Motion animations (fade in + slide up)
├── Title: text-4xl md:text-5xl, font-black, text-cyan-primary
└── Optional subtitle with delay
```

#### ServiceCard (`ServiceCard.jsx`)
```
Visual Structure:
├── Motion wrapper (fade + slide up)
├── Image section (56px height)
│   ├── Service image with hover scale
│   ├── Gradient overlay
│   ├── Category badge (top-left)
│   └── Price badge (top-right)
├── Content section
│   ├── Service name (2xl font-black)
│   ├── Summary text
│   ├── Top 3 deliverables with checkmarks
│   └── Action buttons (View Details + Book Now)
└── Props: { service }
```

#### Stepper (`Stepper.jsx`)
```
Features:
├── Multi-step wizard UI
├── Step indicator with progress
├── Navigation controls
├── Validation hooks
└── Animation transitions
```

#### BorderGlow (`BorderGlow.jsx` + `.css`)
```
Purpose: Animated border glow effect
├── CSS-based glow animation
├── Configurable colors
└── Hover trigger support
```

#### WizardProgress (`WizardProgress.jsx`)
```
Purpose: Visual progress indicator
├── Step completion states
├── Percentage display
└── Animated transitions
```

### 4.3 Auth Components (`/components/auth/`)

#### ProtectedRoute (`ProtectedRoute.jsx`)
```
Props: { allowedRoles: string[], children }
Logic:
├── Check authentication
├── Check role authorization
├── Redirect unauthorized to /join
└── Render children if authorized
```

### 4.4 Dashboard Components (`/components/dashboard/`)

#### DashboardLayout (`DashboardLayout.jsx`)
```
Purpose: Dashboard shell with navigation
├── Sidebar navigation
├── Top header with search/notifications
├── View switching logic
└── Responsive layout
```

### 4.5 Utility Components (`/components/utils/`)

#### ScrollToTop (`ScrollToTop.jsx`)
```
Purpose: Scroll restoration on route change
├── useEffect on location change
└── window.scrollTo(0, 0)
```

---

## 5. Page Structure

### 5.1 Public Pages (`/pages/public/`)

#### Home (`Home.jsx`)
```
Sections:
├── Hero
│   ├── Animated headline
│   ├── Value proposition
│   ├── CTA buttons
│   └── Featured projects preview
├── Value Points (3 cards)
├── Service Categories Grid
├── Portfolio Gallery
├── Why Choose Us
└── Final CTA
```

#### Services (`Services.jsx`)
```
Layout: Category-based service display
├── Hero Header
│   ├── Page title & description
│   ├── CTA buttons
│   └── Category quick nav (pills)
├── Category Sections (4)
│   ├── Sticky info card (left)
│   │   ├── Category name & description
│   │   ├── Best-for points
│   │   └── Category CTA
│   └── Service cards grid (right)
│       └── 2-3 ServiceCards per category
└── Why Choose Us section
```

#### ServiceDetail (`ServiceDetail.jsx`)
```
Purpose: Individual service showcase
├── Service overview
├── Plan comparison table
├── Feature list
├── Delivery timeline
└── Booking CTA
```

#### BookService (`BookService.jsx`)
```
Type: Multi-step booking wizard (6 steps)
Steps:
├── Step 1: Category Selection
│   └── Visual category cards
├── Step 2: Service Selection  
│   └── Service cards within category
├── Step 3: Plan Selection
│   └── Plan comparison with pricing
├── Step 4: Project Details
│   ├── Name, email, phone
│   ├── Project description
│   ├── Features list
│   ├── References
│   └── Deadline picker
├── Step 5: Payment Setup
│   ├── Priority toggle
│   ├── Customer type (new/returning)
│   ├── Payment breakdown display
│   └── Razorpay integration prep
└── Step 6: Review & Confirm
    ├── Order summary
    ├── Terms acceptance
    └── WhatsApp confirmation

Key Features:
├── URL param support (?category=X&service=Y&plan=Z)
├── Reorder support (from order history)
├── Previous data reuse
├── Real-time price calculation
└── Form validation
```

#### About (`About.jsx`)
```
Sections:
├── Mission statement
├── Team members (2 founders)
├── Stats display
└── Company values
```

#### Projects (`Projects.jsx`)
```
Content:
├── Featured projects grid
├── Project cards with status
├── Gallery links
└── External drive links
```

#### Help (`Help.jsx`)
```
Sections:
├── Client FAQs (6 questions)
├── Worker FAQs (4 questions)
├── Help promises
└── Contact support CTA
```

### 5.2 Auth Pages (`/pages/auth/`)

#### JoinHub (`JoinHub.jsx`)
```
Type: Tabbed authentication interface
Tabs:
├── Login Tab
│   ├── Email input
│   ├── Password input
│   ├── Submit button
│   └── Forgot password link
└── Signup Tab
    ├── Customer signup form
    └── Staff signup (with invite key)

Features:
├── Tab switching with animation
├── Form validation
├── Error message display
└── Redirect on success
```

#### ForgotPassword (`ForgotPassword.jsx`)
```
Flow:
├── Email input
├── Submit request
├── Success message
└── Back to login link
```

#### Profile (`Profile.jsx`)
```
Features:
├── User info display
├── Edit profile form
├── Change password
├── View orders link
└── Wallet/earnings preview
```

### 5.3 Dashboard Pages (`/pages/dashboard/`)

#### AdminDashboard (`AdminDashboard.jsx`)
```
Type: View container with tab switching
Views (13):
├── overview      → Dashboard overview with stats
├── orders        → Order management
├── users         → User management
├── referrals     → Referral tracking
├── reviews       → Customer reviews
├── wallet        → Personal wallet
├── reports       → Issue reports
├── samples       → Work samples
├── payroll       → Payroll management
├── teampay       → Team payment view
├── approvals     → Approval requests
├── myorders      → Personal orders (workers)
├── invitekeys    → Invite key management
└── earnings      → Earnings dashboard
    └── analytics → Data visualization

Data Fetching:
├── Firestore orders collection
├── Firestore users collection
├── Stats calculation
└── Real-time updates
```

#### View Components (`/pages/dashboard/views/`)
```
OrdersView:      Order list with filtering/status
UsersView:       User management table
ReferralsView:   Referral code tracking
ReviewsView:     Customer feedback
WalletView:      Personal finance
ReportsView:     Issue logging
SamplesView:     Portfolio management
PayrollView:     Payment processing
TeamPayView:     Team payment status
ApprovalsView:   Request approvals
MyOrdersView:    Assigned orders
InviteKeysView:  Key generation/management
EarningsView:    Income tracking
AnalyticsView:   Charts & metrics
```

---

## 6. Data Layer

### 6.1 Site Data (`/data/siteData.js`)

#### Contact Information
```
CONTACT_INFO:
├── email: unofficials113@gmail.com
├── whatsappNumber: 918300920680
├── whatsappDisplay: +91 8300920680
├── instagramHandle: @tn_web_rats
└── instagramUrl: https://www.instagram.com/tn_web_rats
```

#### Service Categories (4)
```
1. presentation-design
   ├── PPT Creation
   ├── Poster Design
   └── Social Media Posts

2. web-development
   ├── Portfolio Websites
   ├── Landing Pages
   └── Business Websites

3. fix-optimization
   ├── Bug Fixing
   ├── UI Improvements
   └── Speed Optimization

4. templates-assets
   ├── Website Templates
   ├── Portfolio Templates
   └── PPT Templates
```

#### Plan Structure (Per Service)
```
Each service has 3 plans:
├── Basic     → Badge: "Starter",   Lowest price
├── Standard  → Badge: "Best Value", Mid price
└── Premium   → Badge: "Premium",    Highest price

Plan fields:
├── id, label, badge
├── price (INR)
├── delivery (time string)
└── features (string array)
```

#### Helper Functions
```
getCategoryById(categoryId)      → Category object
getServiceById(serviceId)        → Service object
getPlanById(serviceId, planId)   → Plan object
getPriorityFee(basePrice)        → Calculated priority fee
getAdvanceRate(customerType)     → 0.7 (new) or 0.5 (returning)
buildPaymentBreakdown({basePrice, isPriority, customerType})
                                 → Payment calculation object
```

#### Payment Rules
```
PAYMENT_RULES:
├── newCustomerAdvanceRate: 0.7 (70%)
├── returningCustomerAdvanceRate: 0.5 (50%)
├── priorityMultiplier: 0.2 (20% of base)
└── minimumPriorityFee: ₹99
```

#### Content Arrays
```
WHY_CHOOSE_US:        ["Affordable pricing", "Fast delivery", "Beginner-friendly", "Custom solutions"]
CLIENT_FAQS:          6 Q&A items
WORKER_FAQS:          4 Q&A items
HELP_PROMISES:        3 promise items
FEATURED_PROJECTS:    3 project showcases
PORTFOLIO_GALLERY:    4 gallery items
ABOUT_POINTS:         4 company points
TEAM_MEMBERS:         2 founder profiles
STATS:                4 company stats
TERMS_POINTS:         4 terms items
BOOKING_STEP_LABELS:  ["Category", "Service", "Plan", "Details", "Payment", "Review"]
```

### 6.2 Firebase Configuration (`/config/firebase.js`)
```
Initialization:
├── Firebase App (initializeApp)
├── Authentication (getAuth)
├── Firestore Database (getFirestore)
└── Storage (getStorage)

Environment-based Config:
├── apiKey, authDomain, projectId
├── storageBucket, messagingSenderId, appId
└── All from import.meta.env.VITE_* variables
```

---

## 7. Utility Functions (`/utils/orderHelpers.js`)

### 7.1 Order Status Management
```
ORDER_STATUS_META:
├── active      → 24% progress, yellow badge
├── accepted    → 45% progress, sky badge
├── in_progress → 72% progress, blue badge
├── completed   → 100% progress, cyan badge
└── cancelled   → 0% progress, red badge

Functions:
├── normalizeOrderStatus(value)    → Standardize status strings
├── getOrderStatusLabel(value)     → Display label
├── getOrderStatusBadgeClass(value) → CSS classes
├── getOrderProgress(value)         → Progress percentage
├── isCompletedOrder(order)          → Boolean check
├── isOpenOrder(order)               → Boolean check
└── toFirestoreOrderStatus(value)    → Firestore format
```

### 7.2 Payment Status Management
```
PAYMENT_STATUS_META:
├── pending  → Yellow badge
├── partial  → Blue badge
└── paid     → Green badge

Functions:
├── normalizePaymentStatus(value)
├── getPaymentStatusLabel(value)
└── getPaymentStatusBadgeClass(value)
```

### 7.3 Date & Currency Formatting
```
formatCurrency(amount)           → "₹X,XXX" format
formatDate(value, options)       → Localized date
formatDateTime(value)            → Localized datetime
toDateValue(value)               → Timestamp/date converter
```

### 7.4 Order Data Extraction
```
getOrderAmount(order)              → Total price extraction
getOrderDisplayId(order)           → TNWR-XXXXXX format
getOrderPlanLabel(order)           → Plan name
getOrderPriorityLabel(order)       → "High Priority" / "Normal"
getOrderPriorityBadgeClass(order)  → Badge CSS
getCustomerTypeLabel(order)        → "Returning" / "New"
getPrimaryAssetLink(order)         → Delivery URL
getRequirementFields(order)        → Requirements object
```

### 7.5 Service Resolution
```
resolveServiceSelection(order):
├── Match by categoryId + serviceId
├── Match by name/shortName (fuzzy)
└── Return: { categoryId, serviceId, planId }

buildReorderDraft(order):
├── Uses resolveServiceSelection()
├── Adds isPriority, isReorder flags
├── Preserves requirements
└── Links to parentOrderId
```

### 7.6 Order Timeline
```
getOrderTimeline(order):
├── active      → createdAt
├── accepted    → acceptedAt
├── in_progress → startedAt
└── completed   → completedAt
```

### 7.7 Payment Summary
```
getOrderPaymentSummary(order):
├── total      → Order amount
├── paid       → Amount paid
├── pending    → Remaining
├── dueNow     → Current due
└── status     → pending/partial/paid
```

---

## 8. Styling Architecture

### 8.1 CSS Structure
```
src/index.css           → Main entry + Tailwind + theme
src/styles/
├── theme.css          → CSS variables (colors)
├── global.css         → Global utility classes
├── styles.css         → Legacy/custom styles
├── ServiceCard.css    → ServiceCard specific
├── price-card.css     → Pricing card styles
└── admin-dashboard.css → Dashboard styles
```

### 8.2 Theme Variables (`theme.css`)
```
Color Palette:
├── primary-dark:   #262B25 (Dark green-gray)
├── secondary-dark: #000000 (Pure black)
├── light-gray:     #FFFFFF (White)
├── cyan-primary:   #67F81D (Bright green)
└── teal-primary:   #62CB2C (Medium green)

RGB Equivalents:
├── rgb-primary-dark:   38, 43, 37
├── rgb-secondary-dark: 0, 0, 0
├── rgb-light-gray:     255, 255, 255
├── rgb-cyan-primary:   103, 248, 29
└── rgb-teal-primary:   98, 203, 44
```

### 8.3 Typography
```
Font Families:
├── Mono: "Share Tech Mono", monospace
└── Sans: "Rajdhani", sans-serif

Usage:
├── Body text: font-sans
├── Code/mono: font-mono
├── Headings: font-sans font-bold
```

### 8.4 Tailwind Configuration (`index.css`)
```
@theme Custom Properties:
├── --color-primary-dark
├── --color-secondary-dark
├── --color-light-gray
├── --color-cyan-primary
├── --color-teal-primary
├── --font-mono
└── --font-sans
```

### 8.5 Custom Components (`index.css`)
```
.btn-primary:
├── Base: px-8 py-3, rounded-full, font-semibold
├── Colors: bg-cyan-primary, text-primary-dark
└── Hover: Green glow shadow effect

.service-card:
├── Base: bg-secondary-dark, p-8, rounded-2xl
├── Border: border-secondary-dark
├── Hover: -translate-y-4, shadow-2xl, gradient bg
└── Transition: duration-400
```

### 8.6 Background Effects
```
Grid Overlay (body::after):
├── Fixed position, full screen
├── Green lines (1px) at 4% opacity
├── 40px grid size
├── 30s linear infinite animation
└── z-index: -1 (behind content)

@keyframes gridMove:
└── background-position: 0 0 → 40px 40px
```

---

## 9. Animation System

### 9.1 Global Animations
```
Grid Movement:
├── Target: body::after pseudo-element
├── Animation: gridMove 30s linear infinite
├── Effect: Diagonal grid drift
```

### 9.2 Framer Motion Patterns
```
Route Transitions (RootLayout):
├── initial: { opacity: 0, y: 20 }
├── animate: { opacity: 1, y: 0 }
├── exit: { opacity: 0, y: -20 }
└── transition: { duration: 0.4, ease: "easeOut" }

Button Hover:
├── whileHover: { y: -3 }
├── whileTap: { scale: 0.98 }
└── transition: duration-300

Card Hover:
├── whileHover: { y: -10 }
└── transition: { duration: 0.3 }

Scroll Reveal (ServiceCard):
├── initial: { opacity: 0, y: 24 }
├── whileInView: { opacity: 1, y: 0 }
├── viewport: { once: true, margin: "-80px" }
└── transition: { duration: 0.45 }

Dashboard View Switch:
├── initial: { opacity: 0, y: 10 }
├── animate: { opacity: 1, y: 0 }
├── exit: { opacity: 0, y: -10 }
└── transition: { duration: 0.3 }
```

### 9.3 CSS Transitions
```
Standard Durations:
├── 200ms: Quick feedback (buttons)
├── 300ms: Standard hover effects
├── 400ms: Card/section transitions
├── 500ms: Scroll animations
├── 700ms: Page transitions
└── 30s: Background animation
```

---

## 10. Database Schema (Firestore)

### 10.1 Collections
```
users/{uid}:
├── name, email, phone
├── role (client/worker/manager/admin/superadmin/owner)
├── customerType (new/returning)
├── referralCode (unique)
├── discountPercent
├── usedReferralCode
├── referredBy (referrer UID)
└── createdAt (timestamp)

wallets/{uid}:
├── available
├── pendingApproval
├── pendingPayout
├── lifetimePaid
├── nextPayDate
├── lastPayDate
└── updatedAt (timestamp)

referralCodes/{code}:
├── ownerUid
├── role
├── discountPercent
├── timesUsed
└── createdAt (timestamp)

inviteKeys/{key}:
├── role
├── scope (staff)
├── multiUse (boolean)
├── maxUses
├── usedCount
├── usedBy (single) / usedByLast (multi)
├── expiresAt (timestamp)
└── createdAt (timestamp)

orders/{orderId}:
├── categoryId, serviceId, planId
├── category, service, plan, package
├── price, basePrice, priorityFee, totalPrice
├── advancePayment, remainingPayment, advanceRate
├── customerType, isPriority, priorityLabel
├── name, email, phone
├── requirements (object)
├── status, paymentStatus
├── assignedTo (worker UID)
├── deliveryLink
├── createdAt, acceptedAt, inProgressAt, completedAt
└── razorpayOrderId, razorpayPaymentId

notifications/{id}:
├── recipientId (user.uid, 'all', or role)
├── title, message
├── read (boolean)
├── readAt (timestamp)
├── createdAt (timestamp)
└── type, link (optional)
```

---

## 11. Key Features Summary

### 11.1 Booking Flow
```
1. Category Selection     → Visual category cards
2. Service Selection     → Service grid
3. Plan Selection        → Plan comparison
4. Project Details       → Multi-field form
5. Payment Setup        → Priority + customer type
6. Review & Confirm     → Summary + terms + WhatsApp
```

### 11.2 Role-Based Access
```
Public:     Home, Services, About, Projects, Help, Book
Client:     + Profile, MyOrders, Wallet
Worker:     + Dashboard, MyOrders, Earnings
Manager:    + Orders management, Team view
Admin:      + Full dashboard, User management
Superadmin: + All permissions
Owner:      + All permissions + Invite key management
```

### 11.3 Payment System
```
Pricing Calculation:
├── Base Price (from plan)
├── Priority Fee (+20% if selected, min ₹99)
├── Total = Base + Priority
├── Advance = Total × Rate (70% new, 50% returning)
└── Remaining = Total - Advance

Payment Methods:
├── Razorpay (online)
└── Manual/WhatsApp (offline)
```

### 11.4 Referral System
```
Code Format: TNWR-{ROLE}-{XXXX}
├── ROLE: WRK/MGR/ADM/SA/OWR
├── XXXX: Random alphanumeric
└── Discount: Role-based percentage

Usage:
├── New user enters code at signup
├── System validates and tracks
├── Referrer gets discount benefits
└── Usage count tracked in Firestore
```

---

## 12. File Structure Summary

```
TN_WEB_RATS_React/
├── Configuration
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│   └── eslint.config.js
├── Public Assets
│   ├── public/
│   │   ├── neural-bg.html
│   │   ├── /Images/
│   │   └── /assets/
│   └── index.html
├── Source Code
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── config/
│   │   │   └── firebase.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── DashboardContext.jsx
│   │   ├── data/
│   │   │   └── siteData.js
│   │   ├── utils/
│   │   │   └── orderHelpers.js
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardLayout.jsx
│   │   │   ├── layout/
│   │   │   │   ├── RootLayout.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── NeuralBackground.jsx
│   │   │   ├── ui/
│   │   │   │   ├── Primitives.jsx
│   │   │   │   ├── ServiceCard.jsx
│   │   │   │   ├── Stepper.jsx
│   │   │   │   ├── WizardProgress.jsx
│   │   │   │   ├── BorderGlow.jsx
│   │   │   │   └── BorderGlow.css
│   │   │   └── utils/
│   │   │       └── ScrollToTop.jsx
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── Services.jsx
│   │   │   │   ├── ServiceDetail.jsx
│   │   │   │   ├── BookService.jsx
│   │   │   │   ├── About.jsx
│   │   │   │   ├── Projects.jsx
│   │   │   │   └── Help.jsx
│   │   │   ├── auth/
│   │   │   │   ├── JoinHub.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   └── Profile.jsx
│   │   │   └── dashboard/
│   │   │       ├── AdminDashboard.jsx
│   │   │       └── views/
│   │   │           ├── OrdersView.jsx
│   │   │           ├── UsersView.jsx
│   │   │           ├── ReferralsView.jsx
│   │   │           ├── ReviewsView.jsx
│   │   │           ├── WalletView.jsx
│   │   │           ├── ReportsView.jsx
│   │   │           ├── SamplesView.jsx
│   │   │           ├── PayrollView.jsx
│   │   │           ├── TeamPayView.jsx
│   │   │           ├── ApprovalsView.jsx
│   │   │           ├── MyOrdersView.jsx
│   │   │           ├── InviteKeysView.jsx
│   │   │           ├── EarningsView.jsx
│   │   │           └── AnalyticsView.jsx
│   │   └── styles/
│   │       ├── theme.css
│   │       ├── global.css
│   │       ├── styles.css
│   │       ├── ServiceCard.css
│   │       ├── price-card.css
│   │       └── admin-dashboard.css
└── Build Output
    ├── dist/
    └── node_modules/

Total Files:
├── JSX Components: ~35
├── CSS Files: 6
├── Data/Config: 3
└── Utility Modules: 1
```

---

## 13. Development Workflow

### 13.1 Local Development
```bash
npm install      # Install dependencies
npm run dev      # Start Vite dev server
npm run lint     # Run ESLint
npm run build    # Production build
npm run preview  # Preview production build
```

### 13.2 Build Output
```
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── vendor chunks
└── Images/
    └── Project_Preview/
```

---

*Mindmap generated on March 26, 2026*
*Project: TN WEB RATS - React Version*
*Repository: https://github.com/ABIJITH-K-A/Web_Rats*
