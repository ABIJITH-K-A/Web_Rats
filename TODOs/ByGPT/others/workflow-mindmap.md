# TN WEB RATS - Application Workflow Mindmap

## Overview
This document maps all workflows, user journeys, data flows, and backend processes in the TN WEB RATS application.

---

## 1. Application Entry & Routing Flow

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER REQUEST                                              │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  index.html                                                   │
│  └── root div "root"                                          │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  main.jsx                                                     │
│  ├── React.StrictMode                                         │
│  ├── createRoot(root)                                         │
│  └── render(<App />)                                          │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  App.jsx                                                      │
│  └── AuthProvider                                             │
│      └── DashboardProvider                                    │
│          └── BrowserRouter                                    │
│              └── ScrollToTop                                  │
│                  └── RootLayout                               │
│                      └── Routes (Conditional)                 │
└──────────────────┬────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                 ▼
    Public Route     Protected Route
         │                 │
         ▼                 ▼
   Render Page        Check Role
         │                 │
         │                 ▼
         │          Allow? → Yes → Render Dashboard
         │                 │
         │                 No → Redirect /join
         ▼                 ▼
   Page Component    Dashboard Page
```

---

## 2. Authentication Workflow

### 2.1 User Registration (Customer)

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTIONS                                                 │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Visit /join                                               │
│  2. Switch to "Sign Up" tab                                   │
│  3. Fill Form:                                                │
│     ├── Name                                                  │
│     ├── Email                                                 │
│     ├── Phone                                                 │
│     ├── Password                                              │
│     └── Referral Code (optional)                              │
│  4. Submit                                                    │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: JoinHub.jsx → signup()                             │
│  └── Validation Check                                         │
│      ├── All fields present?                                  │
│      ├── Valid email format?                                  │
│      ├── Phone valid?                                         │
│      └── Password length?                                     │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthContext.jsx → signup()                                   │
│  ├── Firebase: createUserWithEmailAndPassword()             │
│  ├── If referralCode provided:                              │
│  │   └── Firestore: getDoc(referralCodes/{code})            │
│  │       ├── Valid? → Get discountPercent                   │
│  │       └── Invalid? → Error                               │
│  └── Firestore Transactions:                                  │
│      ├── users/{uid} CREATE                                   │
│      │   ├── name, email, phone, role="client"                │
│      │   ├── customerType="new"                               │
│      │   ├── referralCode: TNWR-CLI-XXXX (generated)          │
│      │   ├── discountPercent (from referrer or 0)           │
│      │   ├── usedReferralCode (if used)                     │
│      │   └── referredBy (referrer UID if used)              │
│      ├── wallets/{uid} CREATE                               │
│      │   ├── available: 0                                    │
│      │   ├── pendingApproval: 0                              │
│      │   ├── pendingPayout: 0                                │
│      │   ├── lifetimePaid: 0                                 │
│      │   └── nextPayDate: now + 14 days                      │
│      └── referralCodes/{newCode} CREATE                       │
│          ├── ownerUid: user.uid                               │
│          ├── role: "client"                                   │
│          └── discountPercent: 0                               │
└──────────────────┬────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                 ▼
    Success              Error
         │                 │
         ▼                 ▼
   Navigate Home    Show Error Message
         │            (userFriendlyError)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Firebase Auth State Change                                   │
│  └── onAuthStateChanged triggers                              │
│      ├── setUser(currentUser)                                 │
│      ├── Firestore: getDoc(users/{uid})                       │
│      ├── setUserProfile(data)                                 │
│      └── setRole(data.role.toLowerCase())                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Staff Registration (with Invite Key)

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTIONS                                                 │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Admin/Manager generates invite key                        │
│  2. Key shared with new staff member                          │
│  3. Staff visits /join                                        │
│  4. Switch to Sign Up → Select "Staff" type                     │
│  5. Fill: Name, Email, Phone, Password, Invite Key              │
│  6. Submit                                                    │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: JoinHub.jsx → staffSignup()                        │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthContext.jsx → staffSignup()                              │
│  ├── Firebase: createUserWithEmailAndPassword()             │
│  └── Firestore: getDoc(inviteKeys/{key})                      │
│      ├── Check:                                              │
│      │   ├── Key exists?                                      │
│      │   ├── Not expired?                                     │
│      │   ├── Not exceeded maxUses?                            │
│      │   └── Scope = "staff"                                  │
│      └── If multiUse: increment usedCount                     │
│          └── Update usedByLast                                │
│      └── If singleUse: mark used                              │
│          └── Update usedBy                                    │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Create User Records                                           │
│  ├── users/{uid}                                              │
│  │   ├── role = inviteKey.role (worker/manager/admin)        │
│  │   ├── referralCode: TNWR-{ROLE}-XXXX                     │
│  │   ├── discountPercent based on role                       │
│  │   └── other standard fields                               │
│  ├── wallets/{uid}                                            │
│  └── referralCodes/{code}                                     │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Role-Based Access Initialized                                │
│  └── Role determines:                                        │
│      ├── Dashboard access                                     │
│      ├── Views available                                      │
│      └── Permissions                                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTIONS                                                 │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Visit /join                                               │
│  2. Fill: Email, Password                                     │
│  3. Submit or Press Enter                                     │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthContext.jsx → login()                                    │
│  └── Firebase: signInWithEmailAndPassword(auth, email, pass) │
└──────────────────┬────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                 ▼
    Success              Error
         │                 │
         ▼                 ▼
   onAuthStateChanged  Show Error
   triggers             (Invalid credentials,
         │              user not found, etc.)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Auth State Initialization                                    │
│  ├── setUser(currentUser)                                     │
│  ├── Firestore: getDoc(users/{uid})                           │
│  ├── setUserProfile(profileData)                              │
│  ├── setRole(profileData.role)                                │
│  ├── setLoading(false)                                        │
│  └── Navigate to appropriate page                             │
│      ├── No role? → /join                                     │
│      ├── Role exists? → Previous page or Home               │
│      └── Admin role? → /dashboard                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Password Reset Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTIONS                                                 │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Visit /join                                               │
│  2. Click "Forgot Password"                                   │
│  3. Enter email address                                       │
│  4. Submit                                                    │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthContext.jsx → resetPassword()                            │
│  └── Firebase: sendPasswordResetEmail(auth, email)           │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  USER EMAIL INBOX                                             │
│  └── Receives Firebase reset email                            │
│      └── Link: https://tnwebrats.firebaseapp.com/__/auth/... │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  USER clicks link → Firebase Auth Action Handler             │
│  └── New password form displayed                             │
│      └── User sets new password                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 Logout Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTIONS                                                 │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Click logout button (in Navbar/Profile)                   │
│  2. Confirm (optional)                                        │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthContext.jsx → logout()                                   │
│  └── Firebase: signOut(auth)                                    │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Auth State Reset                                             │
│  ├── onAuthStateChanged(null)                                 │
│  ├── setUser(null)                                            │
│  ├── setUserProfile(null)                                     │
│  ├── setRole(null)                                            │
│  └── Navigate to /                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Booking Workflow

### 3.1 Booking Entry Points

```
Entry Path 1: Direct Navigation
┌─────────┐    ┌─────────┐
│  User   │───▶│ /book   │
└─────────┘    └────┬────┘
                    │
                    ▼
            ┌─────────────┐
            │ Category    │
            │ Selection   │
            └─────────────┘

Entry Path 2: From Services Page
┌─────────┐    ┌─────────┐    ┌───────────────┐
│ Services│───▶│ Click   │───▶│ /book?cat=X   │
│  Page   │    │ "Book"  │    │ &svc=Y        │
└─────────┘    └─────────┘    └───────┬───────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ Skip Category │
                              │ & Service     │
                              │ Selection     │
                              └───────────────┘

Entry Path 3: Reorder from Dashboard
┌─────────┐    ┌─────────┐    ┌───────────────┐
│ MyOrders│───▶│ Click   │───▶│ /book?cat=X   │
│  View   │    │"Reorder"│    │ &svc=Y&plan=Z │
└─────────┘    └─────────┘    │ &reorder=ID   │
                              └───────┬───────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ Pre-fill from │
                              │ Previous Order│
                              └───────────────┘
```

### 3.2 Six-Step Booking Wizard

```
┌────────────────────────────────────────────────────────────────┐
│  STEP 1: CATEGORY SELECTION                                     │
├────────────────────────────────────────────────────────────────┤
│  Component: BookService.jsx                                   │
│                                                                 │
│  UI:                                                           │
│  ├── 4 Category Cards (Visual)                                  │
│  │   ├── Icon                                                 │
│  │   ├── Category Name                                         │
│  │   ├── Short Description                                     │
│  │   └── "Starting at ₹X,XXX"                                  │
│  └── Click selects category                                     │
│                                                                 │
│  State Update:                                                 │
│  ├── selectedCategory = categoryId                              │
│  └── navigate to Step 2                                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 2: SERVICE SELECTION                                      │
├────────────────────────────────────────────────────────────────┤
│  Data Source: siteData.js → SERVICE_CATEGORIES                  │
│                                                                 │
│  UI:                                                           │
│  ├── "Showing services in [Category Name]"                     │
│  ├── Back button (to Step 1)                                    │
│  └── Service Cards Grid (2-3 per row)                          │
│      ├── Service Image                                          │
│      ├── Service Name                                           │
│      ├── Deliverables list                                      │
│      ├── "From ₹X,XXX"                                          │
│      └── "Select" button                                        │
│                                                                 │
│  State Update:                                                 │
│  ├── selectedService = serviceId                              │
│  └── navigate to Step 3                                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 3: PLAN SELECTION                                         │
├────────────────────────────────────────────────────────────────┤
│  Data: Service.plans (Basic, Standard, Premium)                   │
│                                                                 │
│  UI:                                                           │
│  ├── "Choose your plan for [Service Name]"                      │
│  ├── 3 Plan Cards (side by side comparison)                      │
│  │   ├── Plan Name + Badge (Starter/Best Value/Premium)         │
│  │   ├── Price (₹X,XXX)                                        │
│  │   ├── Delivery Time                                          │
│  │   ├── Feature list (checkmarks)                              │
│  │   └── "Select Plan" button                                   │
│  └── "Not sure? Contact us on WhatsApp"                        │
│                                                                 │
│  State Update:                                                 │
│  ├── selectedPlan = planId                                      │
│  ├── basePrice = plan.price                                     │
│  └── navigate to Step 4                                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 4: PROJECT DETAILS                                        │
├────────────────────────────────────────────────────────────────┤
│  Form Fields:                                                  │
│  ├── Personal Info                                             │
│  │   ├── Name (required)                                        │
│  │   ├── Email (required)                                      │
│  │   └── Phone (required)                                       │
│  ├── Project Info                                              │
│  │   ├── Project Name                                           │
│  │   └── Description (textarea)                                 │
│  ├── Features Checklist                                        │
│  │   └── Multi-select from service features                     │
│  ├── References                                                │
│  │   └── Links or file uploads                                 │
│  └── Deadline                                                  │
│      └── Date picker                                           │
│                                                                 │
│  Validation:                                                   │
│  ├── Email format                                              │
│  ├── Phone number format                                       │
│  ├── Required fields                                           │
│  └── Deadline in future                                        │
│                                                                 │
│  State Update:                                                 │
│  ├── formData = { ...field values }                            │
│  └── navigate to Step 5                                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 5: PAYMENT SETUP                                          │
├────────────────────────────────────────────────────────────────┤
│  Controls:                                                     │
│  ├── Priority Toggle                                           │
│  │   ├── Off: Normal delivery                                  │
│  │   └── On: Rush delivery (+20% fee, min ₹99)                  │
│  └── Customer Type                                             │
│      ├── New Customer (70% advance)                            │
│      └── Returning Customer (50% advance)                      │
│                                                                 │
│  Real-time Calculation:                                        │
│  ├── basePrice (from plan)                                     │
│  ├── priorityFee = isPriority ? max(basePrice*0.2, 99) : 0    │
│  ├── totalPrice = basePrice + priorityFee                       │
│  ├── advanceRate = isNew ? 0.7 : 0.5                          │
│  ├── advancePayment = totalPrice * advanceRate                  │
│  └── remainingPayment = totalPrice - advancePayment            │
│                                                                 │
│  Payment Breakdown Display:                                    │
│  ├── Total Project Cost                                        │
│  ├── Priority Fee (if applicable)                              │
│  ├── Pay Now (Advance)                                         │
│  └── Pay on Delivery (Remaining)                               │
│                                                                 │
│  State Update:                                                 │
│  ├── paymentConfig = { isPriority, customerType, ...calcs }    │
│  └── navigate to Step 6                                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 6: REVIEW & CONFIRM                                       │
├────────────────────────────────────────────────────────────────┤
│  Summary Display:                                              │
│  ├── Order Summary                                             │
│  │   ├── Category: [Name]                                       │
│  │   ├── Service: [Name]                                        │
│  │   ├── Plan: [Name] + Price                                   │
│  │   └── Priority: [Yes/No]                                     │
│  ├── Customer Details                                          │
│  │   ├── Name, Email, Phone                                     │
│  │   └── Project: [Name]                                        │
│  └── Payment Summary                                           │
│      ├── Total: ₹X,XXX                                          │
│      ├── Advance Due: ₹X,XXX                                    │
│      └── Remaining: ₹X,XXX                                      │
│                                                                 │
│  Terms Checkbox:                                               │
│  └── "I agree to the terms and conditions"                     │
│                                                                 │
│  Actions:                                                      │
│  ├── "Edit" buttons (navigate to previous steps)               │
│  └── "Confirm & Pay" button                                     │
│      ├── If checked: Proceed to Razorpay                      │
│      └── If unchecked: Show error                              │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
```

### 3.3 Payment Processing Flow (Razorpay)

```
┌────────────────────────────────────────────────────────────────┐
│  STEP 6 COMPLETE                                                │
│  └── User clicks "Confirm & Pay"                               │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  FRONTEND: BookService.jsx                                      │
│  ├── Generate order draft                                       │
│  ├── Prepare Razorpay options                                   │
│  └── Open Razorpay Checkout                                     │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  RAZORPAY CHECKOUT                                              │
│  ├── User selects payment method                                │
│  │   ├── UPI                                                   │
│  │   ├── Cards                                                 │
│  │   ├── Net Banking                                           │
│  │   └── Wallets                                               │
│  ├── User completes payment                                     │
│  └── Razorpay returns:                                          │
│      ├── razorpay_order_id                                      │
│      ├── razorpay_payment_id                                    │
│      └── razorpay_signature                                     │
└──────────────────┬─────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                 ▼
    Payment Success     Payment Failed
         │                 │
         ▼                 ▼
┌─────────────────┐   ┌─────────────────┐
│ Verify Signature │   │ Show Error      │
│ with Backend    │   │ Message         │
│ (Firebase       │   │                 │
│ Function)       │   │ User can retry  │
└────────┬────────┘   └─────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  FIRESTORE: CREATE ORDER DOCUMENT                               │
├────────────────────────────────────────────────────────────────┤
│  Collection: orders                                             │
│  Document ID: Auto-generated                                     │
│                                                                 │
│  Fields:                                                       │
│  ├── Order Info                                                │
│  │   ├── categoryId, serviceId, planId                         │
│  │   ├── category, service, plan, package                       │
│  │   └── status: "active"                                       │
│  ├── Pricing                                                   │
│  │   ├── price: totalPrice                                      │
│  │   ├── basePrice                                              │
│  │   ├── priorityFee                                            │
│  │   ├── totalPrice                                             │
│  │   ├── advancePayment                                         │
│  │   ├── remainingPayment                                       │
│  │   └── advanceRate                                            │
│  ├── Customer                                                  │
│  │   ├── customerId (user.uid or null)                        │
│  │   ├── customerType                                           │
│  │   ├── name, email, phone                                     │
│  │   └── isPriority                                             │
│  ├── Requirements                                              │
│  │   ├── projectName                                            │
│  │   ├── description                                            │
│  │   ├── features                                               │
│  │   ├── references                                             │
│  │   └── deadline                                               │
│  ├── Payment                                                   │
│  │   ├── paymentStatus: "partial" or "paid"                    │
│  │   ├── razorpayOrderId                                        │
│  │   └── razorpayPaymentId                                      │
│  ├── Assignment                                                │
│  │   ├── assignedTo: null                                      │
│  │   └── workerName: null                                       │
│  ├── Timestamps                                                │
│  │   ├── createdAt: serverTimestamp()                          │
│  │   ├── acceptedAt: null                                      │
│  │   ├── inProgressAt: null                                     │
│  │   └── completedAt: null                                      │
│  └── Tracking                                                  │
│      ├── displayId: TNWR-XXXXXX (generated)                    │
│      └── parentOrderId: null (or reorder source)               │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  CREATE NOTIFICATION                                            │
│  ├── Admin/Owner notification                                  │
│  │   ├── recipientId: "admin" or specific UIDs                │
│  │   ├── title: "New Order Received"                           │
│  │   ├── message: "Order #XXXXX from [Name]"                   │
│  │   └── link: "/dashboard?view=orders"                        │
│  └── Customer notification (if logged in)                      │
│      ├── recipientId: user.uid                                 │
│      ├── title: "Order Confirmed"                              │
│      └── message: "Your order #XXXXX is active"              │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  WHATSAPP CONFIRMATION                                          │
│  ├── Generate message using createWhatsAppMessage()             │
│  ├── Include order details                                      │
│  ├── Include payment info                                       │
│  └── Open WhatsApp with pre-filled message                      │
│      └── wa.me/{number}?text={encodedMessage}                   │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  FRONTEND REDIRECT                                              │
│  ├── Show success message                                       │
│  ├── Provide WhatsApp link                                      │
│  └── Navigate to order confirmation or dashboard                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Order Lifecycle Workflow

### 4.1 Order Status Flow

```
┌────────────────────────────────────────────────────────────────┐
│  ORDER STATUS STATE MACHINE                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐                                                  │
│   │  CREATED │◄── Order placed                                  │
│   │ (active) │    Payment confirmed                             │
│   └────┬─────┘                                                  │
│        │                                                        │
│        ▼ Admin/Manager assigns                                   │
│   ┌──────────┐                                                  │
│   │ ACCEPTED │◄── Worker assigned                               │
│   │          │    Worker notified                               │
│   └────┬─────┘                                                  │
│        │                                                        │
│        ▼ Worker starts work                                      │
│   ┌──────────┐                                                  │
│   │ IN       │◄── Work in progress                               │
│   │ PROGRESS │    Regular updates                               │
│   └────┬─────┘                                                  │
│        │                                                        │
│        ▼ Work completed                                          │
│   ┌──────────┐                                                  │
│   │COMPLETED │◄── Delivery link provided                         │
│   │          │    Final payment requested                        │
│   └────┬─────┘                                                  │
│        │                                                        │
│        ▼ Cancelled at any point                                  │
│   ┌──────────┐                                                  │
│   │CANCELLED │◄── Refund process initiated                      │
│   └──────────┘                                                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

Progress Percentages:
├── active      → 24%
├── accepted    → 45%
├── in_progress → 72%
├── completed   → 100%
└── cancelled   → 0%
```

### 4.2 Order Assignment Flow

```
┌────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD: Orders View                                   │
│  └── Admin/Manager sees "active" orders                          │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  ASSIGNMENT ACTION                                              │
│  ├── Admin selects "Assign Worker"                               │
│  ├── Dropdown shows available workers                            │
│  └── Admin selects worker                                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  FIRESTORE UPDATE                                               │
│  ├── orders/{orderId}                                           │
│  │   ├── assignedTo: workerUid                                  │
│  │   ├── workerName: workerName                                 │
│  │   ├── status: "accepted"                                     │
│  │   └── acceptedAt: serverTimestamp()                         │
│  └── CREATE NOTIFICATION                                        │
│      ├── recipientId: workerUid                                 │
│      ├── title: "New Order Assigned"                             │
│      └── message: "Order #XXXXX assigned to you"               │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  WORKER DASHBOARD: MyOrders View                                │
│  └── Worker sees assigned order                                  │
│      ├── Order details                                           │
│      ├── Customer info                                           │
│      └── Requirements                                            │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  WORKER ACTIONS                                                 │
│  ├── "Start Work" → status: "in_progress"                       │
│  │   └── inProgressAt: timestamp                                  │
│  ├── "Update Progress" (optional)                                │
│  └── "Complete Order" → status: "completed"                       │
│      ├── completedAt: timestamp                                  │
│      └── deliveryLink: provided by worker                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Notification System Workflow

### 5.1 Notification Creation Triggers

```
┌────────────────────────────────────────────────────────────────┐
│  NOTIFICATION TRIGGERS                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. NEW ORDER PLACED                                             │
│    ├── Admin: "New order received"                               │
│    └── Customer: "Order confirmed"                               │
│                                                                 │
│ 2. ORDER ASSIGNED                                               │
│    └── Worker: "New order assigned"                              │
│                                                                 │
│ 3. STATUS CHANGE                                                │
│    └── Customer: "Order status updated to [Status]"              │
│                                                                 │
│ 4. PAYMENT RECEIVED                                             │
│    └── Customer: "Payment confirmed"                             │
│        Admin: "Payment received for order #XXX"                 │
│                                                                 │
│ 5. DELIVERY READY                                               │
│    └── Customer: "Your order is ready for delivery"              │
│                                                                 │
│ 6. NEW SIGNUP (with referral)                                   │
│    └── Referrer: "New user signed up with your code"           │
│                                                                 │
│ 7. EARNINGS UPDATED                                             │
│    └── Worker: "₹XXX added to your wallet"                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Notification Query & Display Flow

```
┌────────────────────────────────────────────────────────────────┐
│  DashboardContext.jsx Initialization                            │
│  └── useEffect runs when user/userProfile changes              │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  FIRESTORE QUERY                                                │
│                                                                 │
│  IF Admin/Owner/Superadmin:                                     │
│  └── query:                                                     │
│      ├── collection: notifications                              │
│      ├── orderBy: createdAt desc                                │
│      └── limit: 20                                              │
│                                                                 │
│  ELSE (Worker/Manager/Client):                                  │
│  └── query:                                                     │
│      ├── collection: notifications                            │
│      ├── where: recipientId in [user.uid, 'all', role]         │
│      ├── orderBy: createdAt desc                                │
│      └── limit: 20                                              │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  REAL-TIME LISTENER                                             │
│  └── onSnapshot()                                               │
│      ├── Snapshot received                                      │
│      ├── Map docs to notification objects                        │
│      ├── setNotifications(list)                                 │
│      └── setUnreadCount(count where !read)                     │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  UI DISPLAY                                                     │
│  ├── Notification bell icon (Navbar/Dashboard)                  │
│  ├── Badge with unreadCount                                     │
│  └── Dropdown/Panel shows list                                   │
│      ├── Title, message, timestamp                              │
│      ├── Unread highlight                                        │
│      └── Click to navigate (if link provided)                   │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  MARK AS READ                                                   │
│  ├── User clicks notification                                    │
│  └── markAsRead(notificationId)                                 │
│      └── Firestore: updateDoc(notifications/{id}, {read: true})│
│                                                                 │
│  MARK ALL READ                                                  │
│  ├── User clicks "Mark all read"                                 │
│  └── markAllAsRead()                                            │
│      └── Batch update all unread notifications                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Referral System Workflow

### 6.1 Referral Code Generation

```
┌────────────────────────────────────────────────────────────────┐
│  USER REGISTRATION / ROLE CHANGE                                │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  makeReferralCode(role)                                          │
│  ├── Input: role string                                        │
│  ├── Map role to code prefix:                                  │
│  │   ├── client     → "CLI"                                     │
│  │   ├── worker     → "WRK"                                     │
│  │   ├── manager    → "MGR"                                     │
│  │   ├── admin      → "ADM"                                     │
│  │   ├── superadmin → "SA"                                      │
│  │   └── owner      → "OWR"                                     │
│  ├── Generate 4-char random: XXXX                              │
│  └── Return: "TNWR-{PREFIX}-{XXXX}"                              │
│                                                                 │
│  Example: TNWR-WRK-A7B3, TNWR-MGR-K9P2                          │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  FIRESTORE CREATE                                               │
│  └── referralCodes/{code}                                       │
│      ├── ownerUid: user.uid                                     │
│      ├── role: userRole                                         │
│      ├── discountPercent: based on role                        │
│      ├── timesUsed: 0                                           │
│      └── createdAt: serverTimestamp()                           │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  USER PROFILE UPDATE                                            │
│  └── users/{uid}                                                │
│      └── referralCode: generated code                           │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Referral Code Usage Flow

```
┌────────────────────────────────────────────────────────────────┐
│  NEW USER REGISTRATION                                          │
│  └── Enters referral code in signup form                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  VALIDATION                                                     │
│  └── Firestore: getDoc(referralCodes/{code})                    │
│      ├── Code exists?                                           │
│      ├── Not expired?                                             │
│      └── Owner active?                                            │
└──────────────────┬─────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                 ▼
    Valid Code          Invalid Code
         │                 │
         ▼                 ▼
┌───────────────┐     ┌───────────────┐
│ Get Referrer  │     │ Show Error    │
│ Info          │     │ "Invalid code"│
└───────┬───────┘     └───────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│  UPDATE USER RECORD                                             │
│  └── users/{newUserUid}                                         │
│      ├── usedReferralCode: enteredCode                          │
│      ├── referredBy: referrerUid                                │
│      └── discountPercent: from referrerCode                     │
│          ├── WRK → 5%                                           │
│          ├── MGR → 10%                                          │
│          ├── ADM → 15%                                          │
│          ├── SA  → 20%                                          │
│          └── OWR → 25%                                          │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  UPDATE REFERRAL CODE                                           │
│  └── referralCodes/{code}                                       │
│      └── timesUsed: increment(+1)                                 │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  CREATE NOTIFICATION                                            │
│  └── To Referrer                                                │
│      ├── recipientId: referrerUid                               │
│      ├── title: "Referral Bonus"                                 │
│      └── message: "[Name] signed up using your code"           │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Dashboard Workflows by Role

### 7.1 Dashboard Access Control

```
┌────────────────────────────────────────────────────────────────┐
│  /dashboard ROUTE                                               │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  ProtectedRoute Component                                       │
│  ├── Check: user exists?                                        │
│  ├── Check: role in allowedRoles?                               │
│  │   └── allowedRoles:                                          │
│  │       ├── owner, superadmin, admin                          │
│  │       ├── manager                                           │
│  │       └── worker                                              │
│  └── If not authorized:                                         │
│      └── Navigate to /join                                       │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  AdminDashboard.jsx                                             │
│  └── Get role from AuthContext                                   │
│      └── Determine available views                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Role-Based View Access

```
┌────────────────────────────────────────────────────────────────┐
│  VIEW ACCESS MATRIX                                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ROLE        │ Views Available                                  │
│  ────────────┼─────────────────────────────────────────────────│
│  owner       │ ALL views + Invite Key Management                │
│  superadmin  │ ALL views + Invite Key Management                │
│  admin       │ overview, orders, users, referrals, reviews,    │
│              │ reports, samples, payroll, teampay, approvals    │
│  manager     │ orders, users, referrals, reviews, reports,      │
│              │ samples, payroll, teampay, myorders               │
│  worker      │ myorders, earnings, analytics, wallet             │
│                                                                 │
│  VIEW          │ Description                                      │
│  ──────────────┼─────────────────────────────────────────────────│
│  overview      │ Dashboard stats, charts, recent activity       │
│  orders        │ All orders management, assignment                │
│  myorders      │ Personal assigned orders                         │
│  users         │ User management, role changes                    │
│  referrals     │ Referral code tracking                           │
│  reviews       │ Customer reviews management                      │
│  wallet        │ Personal wallet balance                          │
│  earnings      │ Personal earnings tracking                       │
│  analytics     │ Charts and metrics                               │
│  reports       │ Issue reports from workers                       │
│  samples       │ Portfolio/sample management                      │
│  payroll       │ Payment processing                               │
│  teampay       │ Team payment status                              │
│  approvals     │ Pending approval requests                        │
│  invitekeys    │ Invite key generation (owner/superadmin only)   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 7.3 Admin: Order Management Flow

```
┌────────────────────────────────────────────────────────────────┐
│  OrdersView.jsx                                                   │
│  └── Admin/Manager lands here                                     │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  DATA FETCHING                                                  │
│  └── Firestore: query(orders, orderBy(createdAt, desc))          │
│      └── Real-time listener with onSnapshot()                   │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  ORDER TABLE DISPLAY                                            │
│  ├── Columns:                                                   │
│  │   ├── Order ID (TNWR-XXXXXX)                                 │
│  │   ├── Customer (name, email)                                  │
│  │   ├── Service (category + service name)                       │
│  │   ├── Status (with progress bar)                              │
│  │   ├── Payment Status                                          │
│  │   ├── Price                                                   │
│  │   ├── Assigned Worker                                         │
│  │   └── Actions                                                 │
│  └── Filters:                                                   │
│      ├── By Status (active, accepted, in_progress, etc.)        │
│      ├── By Date Range                                            │
│      └── By Worker                                                │
└──────────────────┬─────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┬─────────────────┐
         ▼                 ▼                 ▼
    Assign Worker    View Details      Update Status
         │                 │                 │
         ▼                 ▼                 ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Dropdown      │   │ Modal/Panel   │   │ Status        │
│ Select Worker │   │ Full Order    │   │ Dropdown      │
│ Confirm       │   │ Info          │   │ Select New    │
│ Update DB     │   │ Requirements  │   │ Status        │
│ Notify Worker │   │ Payment Info  │   │ Update DB     │
└───────────────┘   │ Customer Chat │   │ Notify User   │
                    └───────────────┘   └───────────────┘
```

### 7.4 Worker: My Orders Flow

```
┌────────────────────────────────────────────────────────────────┐
│  MyOrdersView.jsx                                                 │
│  └── Worker lands here                                            │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  DATA FETCHING                                                  │
│  └── Firestore:                                                 │
│      └── query(orders, where(assignedTo, ==, user.uid))          │
│          └── Real-time listener                                   │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  ASSIGNED ORDERS LIST                                           │
│  ├── Order Cards                                                │
│  │   ├── Order ID                                               │
│  │   ├── Service Name                                           │
│  │   ├── Status + Progress                                      │
│  │   ├── Deadline                                               │
│  │   └── Price                                                  │
│  └── Action Buttons (per status)                                │
│      ├── active → "View Details", "Contact Admin"                 │
│      ├── accepted → "Start Work"                                  │
│      ├── in_progress → "Update", "Complete"                      │
│      └── completed → "View Details"                               │
└──────────────────┬─────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                 ▼
    Start Work         Complete Order
         │                 │
         ▼                 ▼
┌─────────────────┐   ┌─────────────────┐
│ Update Status   │   │ Enter Delivery  │
│ to "in_progress"│   │ Link            │
│ Set timestamp   │   │ Upload Files    │
└─────────────────┘   │ Update Status   │
                       │ to "completed"  │
                       │ Set timestamp   │
                       └─────────────────┘
```

### 7.5 Owner/Superadmin: Invite Key Management

```
┌────────────────────────────────────────────────────────────────┐
│  InviteKeysView.jsx                                               │
│  └── Only accessible to owner/superadmin                         │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  GENERATE NEW KEY                                               │
│  ├── Form:                                                      │
│  │   ├── Role (worker/manager/admin)                             │
│  │   ├── Multi-use? (yes/no)                                     │
│  │   ├── Max uses (if multi-use)                                 │
│  │   └── Expiry date (optional)                                  │
│  └── Generate Button                                             │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  KEY GENERATION                                                 │
│  ├── Generate random key: XXXXXXXX                               │
│  └── Firestore: create(inviteKeys/{key})                         │
│      ├── key: generated string                                  │
│      ├── role: selected role                                      │
│      ├── scope: "staff"                                           │
│      ├── multiUse: boolean                                        │
│      ├── maxUses: number (if multi)                             │
│      ├── usedCount: 0                                             │
│      ├── expiresAt: timestamp (if set)                            │
│      └── createdAt: serverTimestamp()                             │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  KEY LIST                                                       │
│  ├── Display all keys                                            │
│  │   ├── Key value (click to copy)                               │
│  │   ├── Role                                                     │
│  │   ├── Usage: usedCount/maxUses                                  │
│  │   ├── Expiry status                                             │
│  │   ├── Created date                                              │
│  │   └── Actions (revoke/delete)                                 │
│  └── Copy/Share functionality                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Financial System & Wallet Workflow

### 8.1 Core Revenue Split Model

```
┌────────────────────────────────────────────────────────────────┐
│  REVENUE DISTRIBUTION STRUCTURE                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  STANDARD SPLIT (No Referral)                                  │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Worker  →  80% of order value                       │     │
│  │  Company →  20% of order value                       │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                │
│  REFERRAL SPLIT (When order comes via referral)              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Worker  →  82% of order value (extra 2%)         │     │
│  │  Company →  18% of order value (reduced 2%)         │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                │
│  CALCULATION FLOW:                                             │
│  ├── Order Total: ₹10,000                                     │
│  ├── Platform Fee: ₹500 (if applicable)                       │
│  ├── Net Amount: ₹9,500                                       │
│  ├── Worker Share: ₹9,500 × 0.80 = ₹7,600                    │
│  └── Company Share: ₹9,500 × 0.20 = ₹1,900                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 Wallet System Structure

```
┌────────────────────────────────────────────────────────────────┐
│  WALLET COLLECTION (Firestore: wallets/{userId})              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  WALLET BALANCE TYPES:                                         │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  totalBalance                                      │        │
│  │  └── Sum of all wallet amounts                     │        │
│  │                                                    │        │
│  │  pendingAmount                                     │        │
│  │  └── Earnings awaiting admin approval              │        │
│  │      • From completed orders pending review        │        │
│  │      • Held until quality verification             │        │
│  │                                                    │        │
│  │  withdrawableAmount                                │        │
│  │  └── Available for immediate withdrawal            │        │
│  │      • Already approved by admin/manager           │
│  │      • Ready for payout processing                 │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                │
│  ADDITIONAL WALLET FIELDS:                                     │
│  ├── lifetimeEarned: Total earnings across all time           │
│  ├── lifetimeWithdrawn: Total amount withdrawn                │
│  ├── lastPayDate: Timestamp of last successful withdrawal     │
│  ├── nextPayDate: Scheduled next payout date                   │
│  ├── pendingWithdrawals: Amount in pending withdrawal state │
│  └── updatedAt: Last wallet update timestamp                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.3 Worker Earnings Flow

```
┌────────────────────────────────────────────────────────────────┐
│  ORDER COMPLETION                                               │
│  └── Worker marks order as "completed"                        │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  EARNINGS CALCULATION                                           │
│  ├── Order total: ₹X,XXX                                         │
│  ├── Check: Referral applied?                                   │
│  │   ├── Yes → Use 82% split                                   │
│  │   └── No  → Use 80% split                                   │
│  ├── Calculate worker share:                                   │
│  │   earnings = orderTotal × splitRate                         │
│  └── Calculate company share:                                  │
│      companyShare = orderTotal - workerShare                   │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  UPDATE WORKER WALLET                                           │
│  └── wallets/{workerUid}                                        │
│      ├── pendingAmount: increment(workerShare)                │
│      ├── totalBalance: increment(workerShare)                 │
│      └── lifetimeEarned: increment(workerShare)               │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  CREATE TRANSACTION RECORD                                      │
│  └── transactions/{transactionId}                               │
│      ├── type: "income"                                         │
│      ├── category: "order_earning"                              │
│      ├── amount: workerShare                                     │
│      ├── orderId: orderId                                       │
│      ├── userId: workerUid                                      │
│      ├── status: "pending_approval"                             │
│      └── createdAt: serverTimestamp()                           │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  ADMIN/MANAGER REVIEW                                           │
│  ├── Admin reviews delivered work                               │
│  ├── Verifies delivery link is valid                            │
│  ├── Checks quality requirements met                            │
│  └── Approves or rejects earnings                               │
└──────────────────┬─────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    Approved               Rejected
         │                   │
         ▼                   ▼
┌──────────────┐      ┌──────────────┐
│ Move to      │      │ Create       │
│ withdrawable │      │ Penalty      │
│ Move from    │      │ Notify       │
│ pending      │      │ Worker       │
└──────────────┘      └──────────────┘
```

### 8.4 Withdrawal System

```
┌────────────────────────────────────────────────────────────────┐
│  WITHDRAWAL RULES                                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ELIGIBILITY CRITERIA:                                         │
│  ├── Minimum withdrawal: ₹100                                  │
│  ├── Maximum withdrawal: Based on withdrawableAmount          │
│  └── Withdrawal frequency: 4 days per week (configurable)     │
│                                                                │
│  WITHDRAWAL STATUS STATES:                                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  pending   → Request received, awaiting review       │       │
│  │  approved  → Approved by admin, processing payment │       │
│  │  rejected  → Rejected by admin (reason provided)     │       │
│  │  completed → Payment successfully sent               │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  WITHDRAWAL REQUEST FLOW                                        │
│                                                                │
│  1. WORKER INITIATES WITHDRAWAL                                │
│     ├── Visits Wallet/Earnings page                            │
│     ├── Clicks "Withdraw" button                               │
│     └── Enters withdrawal amount                               │
│                                                                │
│  2. VALIDATION CHECKS                                          │
│     ├── Amount ≥ ₹100?                                         │
│     ├── Amount ≤ withdrawableAmount?                           │
│     ├── Last withdrawal ≥ 4 days ago?                          │
│     └── Bank/UPI details present?                              │
│                                                                │
│  3. CREATE WITHDRAWAL REQUEST                                  │
│     └── withdrawals/{withdrawalId}                             │
│         ├── userId: workerUid                                  │
│         ├── amount: requestedAmount                            │
│         ├── status: "pending"                                  │
│         ├── paymentMethod: bank/upi                          │
│         ├── paymentDetails: { account/upi info }               │
│         └── createdAt: serverTimestamp()                       │
│                                                                │
│  4. UPDATE WALLET                                              │
│     └── wallets/{workerUid}                                    │
│         ├── withdrawableAmount: decrement(amount)            │
│         └── pendingWithdrawals: increment(amount)            │
│                                                                │
│  5. ADMIN REVIEW & PROCESS                                     │
│     ├── Admin reviews withdrawal request                       │
│     ├── Verifies payment details                                 │
│     ├── Initiates bank transfer/UPI payment                      │
│     └── Updates withdrawal status                              │
│                                                                │
│  6. COMPLETION                                                 │
│     └── withdrawals/{withdrawalId}                             │
│         ├── status: "completed"                                  │
│         ├── processedAt: timestamp                               │
│         ├── processedBy: adminUid                                │
│         └── transactionRef: bankReferenceNumber                  │
│                                                                │
│  7. FINAL WALLET UPDATE                                        │
│     └── wallets/{workerUid}                                      │
│         ├── pendingWithdrawals: decrement(amount)              │
│         ├── lifetimeWithdrawn: increment(amount)               │
│         └── lastPayDate: serverTimestamp()                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.5 Refund System

```
┌────────────────────────────────────────────────────────────────┐
│  REFUND POLICIES                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  REGULAR CUSTOMER (First-time or occasional)                   │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Refund: 60% of amount paid                         │       │
│  │  Worker: 20% (compensation for time spent)           │       │
│  │  Company: 20% (platform fee retained)               │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                │
│  RETURNING CUSTOMER (Repeat client)                          │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Refund: 70% of amount paid (higher for loyalty)    │       │
│  │  Worker: 20% (compensation for time spent)           │       │
│  │  Company: 10% (reduced platform fee)                │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                │
│  REFUND ELIGIBILITY:                                           │
│  ├── Order status: active, accepted, or in_progress            │
│  ├── Work not yet delivered                                    │
│  ├── Within refund window (configurable, typically 7 days)   │
│  └── Valid reason provided                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  REFUND PROCESS FLOW                                            │
│                                                                │
│  1. CUSTOMER REQUESTS REFUND                                     │
│     ├── Customer contacts support or uses refund option          │
│     ├── Provides order ID and reason                             │
│     └── Request logged in system                                 │
│                                                                │
│  2. ADMIN REVIEW                                                 │
│     ├── Review order status                                      │
│     ├── Check work progress with assigned worker               │
│     ├── Determine customer type (regular/returning)            │
│     └── Approve or reject refund                                 │
│                                                                │
│  3. REFUND CALCULATION                                           │
│     ├── Get totalAmountPaid from order                         │
│     ├── Determine customerType                                   │
│     ├── Apply refund percentage:                                 │
│     │   ├── Regular → 60% refund                               │
│     │   └── Returning → 70% refund                             │
│     └── Calculate distribution:                                  │
│         ├── refundAmount = totalPaid × refundRate                │
│         ├── workerCompensation = totalPaid × 0.20              │
│         └── companyShare = remainder                           │
│                                                                │
│  4. PROCESS REFUND                                               │
│     ├── Initiate refund to customer's original payment method  │
│     ├── Update worker wallet (if applicable):                  │
│     │   └── Add worker compensation to withdrawableAmount      │
│     └── Create transaction records                               │
│                                                                │
│  5. ORDER STATUS UPDATE                                          │
│     └── orders/{orderId}                                         │
│         ├── status: "cancelled"                                  │
│         ├── cancelledAt: timestamp                               │
│         ├── cancelledBy: "customer" or "admin"                   │
│         ├── refundAmount: calculated amount                      │
│         └── refundStatus: "completed"                            │
│                                                                │
│  6. CREATE TRANSACTIONS                                          │
│     ├── Customer refund:                                         │
│     │   └── transactions/{id}                                    │
│     │       ├── type: "expense"                                  │
│     │       ├── category: "refund"                               │
│     │       ├── amount: refundAmount                             │
│     │       └── status: "completed"                              │
│     └── Worker compensation (if work started):                 │
│         └── transactions/{id}                                    │
│             ├── type: "income"                                   │
│             ├── category: "cancellation_compensation"          │
│             ├── amount: workerCompensation                       │
│             └── status: "completed"                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.6 Dispute System

```
┌────────────────────────────────────────────────────────────────┐
│  DISPUTE HIERARCHY & ESCALATION                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  RESOLUTION AUTHORITY LEVELS:                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Level 1: Worker                                     │       │
│  │  └── First point of contact for order issues         │       │
│  │                                                      │       │
│  │  Level 2: Manager                                    │       │
│  │  └── Handles disputes escalated from worker          │       │
│  │      • Order quality issues                          │       │
│  │      • Timeline disputes                             │       │
│  │      • Communication problems                        │       │
│  │                                                      │       │
│  │  Level 3: Admin                                      │       │
│  │  └── Handles complex disputes                        │       │
│  │      • Refund approvals                              │       │
│  │      • Worker-customer conflicts                     │       │
│  │      • Policy violations                             │       │
│  │                                                      │       │
│  │  Level 4: Super Admin                                │       │
│  │  └── Handles escalated admin decisions               │       │
│  │      • Admin dispute overrides                       │       │
│  │      • High-value order disputes                     │       │
│  │      • Suspension decisions                          │       │
│  │                                                      │       │
│  │  Level 5: Owner                                      │       │
│  │  └── Final authority on all disputes                 │       │
│  │      • Override any decision                         │       │
│  │      • Policy changes                                │       │
│  │      • Permanent bans                                │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                │
│  HIERARCHY: Owner > Super Admin > Admin > Manager > Worker     │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  DISPUTE RESOLUTION FLOW                                        │
│                                                                │
│  1. DISPUTE CREATION                                             │
│     ├── Customer or Worker reports issue                       │
│     ├── Select dispute category:                               │
│     │   ├── quality_issue (delivered work not satisfactory)    │
│     │   ├── timeline_issue (missed deadline)                   │
│     │   ├── communication_issue (unresponsive)                 │
│     │   ├── payment_issue (earnings/refund dispute)            │
│     │   └── policy_violation (terms of service breach)         │
│     └── Provide description and evidence                         │
│                                                                │
│  2. DISPUTE ASSIGNMENT                                          │
│     ├── disputes/{disputeId}                                     │
│     │   ├── orderId: relatedOrderId                            │
│     │   ├── raisedBy: userId                                     │
│     │   ├── against: userId or "platform"                      │
│     │   ├── category: disputeCategory                          │
│     │   ├── description: text                                    │
│     │   ├── evidence: [fileUrls]                                 │
│     │   ├── status: "open"                                       │
│     │   ├── assignedTo: managerId (auto or manual)             │
│     │   ├── priority: "low" | "medium" | "high" | "critical"    │
│     │   └── createdAt: serverTimestamp()                         │
│     └── Notifications sent to assigned resolver                │
│                                                                │
│  3. RESOLUTION PROCESS                                          │
│     ├── Assigned resolver reviews case                         │
│     ├── Communicates with both parties                         │
│     ├── Gathers additional evidence if needed                    │
│     └── Makes resolution decision                              │
│                                                                │
│  4. RESOLUTION ACTIONS                                          │
│     ├── Resolution Types:                                        │
│     │   ├── in_favor_of_customer → Full/partial refund         │
│     │   ├── in_favor_of_worker → Release payment to worker     │
│     │   ├── compromise → Split resolution                      │
│     │   ├── requires_revision → Work must be redone            │
│     │   └── no_action → Dispute rejected                       │
│     └── Apply penalties/bonuses if applicable                    │
│                                                                │
│  5. ESCALATION                                                  │
│     ├── If party disagrees with resolution                       │
│     └── Escalate to next hierarchy level                       │
│         ├── Worker → Manager                                     │
│         ├── Manager → Admin                                      │
│         ├── Admin → Super Admin                                  │
│         └── Super Admin → Owner                                  │
│                                                                │
│  6. CLOSURE                                                     │
│     └── disputes/{disputeId}                                     │
│         ├── status: "resolved" or "escalated"                    │
│         ├── resolution: resolutionDetails                        │
│         ├── resolvedBy: resolverUserId                           │
│         ├── resolvedAt: timestamp                                │
│         └── escalationLevel: finalHierarchyLevel                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.7 Penalty & Bonus System

```
┌────────────────────────────────────────────────────────────────┐
│  PENALTY & BONUS STRUCTURE                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  PENALTY RATES (Deducted from worker earnings):                │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Violation Type              │  Penalty %             │       │
│  ├─────────────────────────────────────────────────────┤       │
│  │  Missed deadline (minor)     │  5%                  │       │
│  │  Missed deadline (major)     │  10%                 │       │
│  │  Quality issues (minor)      │  5%                  │       │
│  │  Quality issues (major)      │  15%                 │       │
│  │  Communication violations    │  5%                  │       │
│  │  Policy violations           │  10-20%              │       │
│  │  No-show / Abandonment       │  20%                 │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                │
│  BONUS RATES (Added to worker earnings):                       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Achievement                 │  Bonus %             │       │
│  ├─────────────────────────────────────────────────────┤       │
│  │  Early delivery              │  +5%                 │       │
│  │  Exceptional quality         │  +5%                 │       │
│  │  Customer praise             │  +5%                 │       │
│  │  High rating (5-star)        │  +5%                 │       │
│  │  Consistent performance      │  +5% (periodic)      │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                │
│  PENALTY/BONUS APPLICATION FLOW:                               │
│  ├── Trigger: Admin applies adjustment                         │
│  ├── Create penalty/bonus transaction                          │
│  ├── Update worker wallet (debit for penalty, credit for bonus)│
│  └── Notify worker of adjustment                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.8 Transaction System

```
┌────────────────────────────────────────────────────────────────┐
│  TRANSACTION RECORDS (Firestore: transactions/{transactionId})│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  TRANSACTION TYPES:                                            │
│  ├── INCOME (Credits to wallet)                                  │
│  │   ├── order_earning          → From completed order          │
│  │   ├── referral_bonus         → From referral program         │
│  │   ├── cancellation_compensation → Order cancelled payment  │
│  │   ├── bonus                  → Performance bonus             │
│  │   ├── refund_received        → Refund credited to customer   │
│  │   └── adjustment_credit      → Manual adjustment             │
│  │                                                              │
│  └── EXPENSE (Debits from wallet)                              │
│      ├── withdrawal            → Withdrawal to bank/UPI        │
│      ├── refund                → Refund processed              │
│      ├── penalty               → Violation penalty             │
│      ├── fee                   → Platform/service fees         │
│      └── adjustment_debit      → Manual adjustment             │
│                                                                │
│  TRANSACTION STRUCTURE:                                          │
│  ├── transactionId: unique identifier                            │
│  ├── userId: wallet owner                                        │
│  ├── type: "income" | "expense"                                  │
│  ├── category: specific category (see above)                     │
│  ├── amount: transaction amount                                  │
│  ├── currency: "INR"                                             │
│  ├── status:                                                     │
│  │   ├── pending_approval         → Awaiting admin review       │
│  │   ├── approved                 → Approved, not yet applied   │
│  │   ├── completed                → Successfully processed        │
│  │   ├── rejected                 → Rejected/declined           │
│  │   └── cancelled                → Cancelled before completion │
│  ├── relatedOrderId: (optional) linked order                     │
│  ├── relatedUserId: (optional) other party                       │
│  ├── description: human-readable details                           │
│  ├── metadata: additional context object                           │
│  ├── processedBy: (for manual actions) admin ID                    │
│  ├── createdAt: serverTimestamp()                                │
│  └── processedAt: (when completed) timestamp                     │
│                                                                │
│  TRANSACTION HISTORY FLOW:                                       │
│  ├── Every financial action creates transaction record         │
│  ├── Workers can view full transaction history                   │
│  ├── Admins can query all transactions                           │
│  └── Used for accounting, audits, and reporting                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.9 Complete Financial Flow Summary

```
┌────────────────────────────────────────────────────────────────┐
│  CLIENT PAYMENT → WORKER PAYOUT FLOW                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. CLIENT BOOKS SERVICE                                        │
│     └── Pays advance (50-70% depending on customer type)       │
│                                                                │
│  2. ORDER COMPLETED & APPROVED                                  │
│     ├── Final payment collected from client                    │
│     ├── Total order amount finalized                           │
│     └── Platform fee deducted (if applicable)                  │
│                                                                │
│  3. REVENUE SPLIT APPLIED                                       │
│     ├── Check for referral code usage                          │
│     ├── Apply 80/20 or 82/18 split                             │
│     └── Worker earnings calculated                             │
│                                                                │
│  4. WORKER WALLET UPDATED                                       │
│     ├── pendingAmount increased                                │
│     └── Transaction record created (pending_approval)          │
│                                                                │
│  5. ADMIN APPROVES EARNINGS                                     │
│     ├── Work quality verified                                  │
│     ├── Delivery confirmed                                     │
│     └── Earnings moved to withdrawableAmount                   │
│                                                                │
│  6. WORKER REQUESTS WITHDRAWAL                                  │
│     ├── Minimum ₹100 check                                     │
│     ├── 4-day frequency check                                  │
│     └── Withdrawal request created (pending)                   │
│                                                                │
│  7. ADMIN PROCESSES WITHDRAWAL                                  │
│     ├── Bank transfer or UPI initiated                         │
│     ├── Withdrawal marked completed                            │
│     └── Worker receives payment                                │
│                                                                │
│  ALTERNATE FLOWS:                                              │
│  ├── REFUND: Split between client, worker, company             │
│  ├── DISPUTE: Resolution may adjust earnings                   │
│  ├── PENALTY: Deducted from pending/withdrawable amount        │
│  └── BONUS: Added to withdrawable amount                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 9. Data Synchronization Flows

### 9.1 Real-Time Listeners Pattern

```
┌────────────────────────────────────────────────────────────────┐
│  FIRESTORE REAL-TIME SYNC PATTERN                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. MOUNT COMPONENT                                             │
│     └── useEffect(() => { ... }, [dependencies])               │
│                                                                 │
│  2. CREATE QUERY                                                │
│     └── const q = query(                                        │
│           collection(db, 'collectionName'),                       │
│           where('field', '==', value),                           │
│           orderBy('field'),                                      │
│           limit(n)                                               │
│         )                                                        │
│                                                                 │
│  3. SETUP LISTENER                                              │
│     └── const unsubscribe = onSnapshot(q, (snapshot) => {        │
│           const data = snapshot.docs.map(doc => ({               │
│             id: doc.id,                                          │
│             ...doc.data()                                         │
│           }))                                                     │
│           setState(data)                                          │
│         }, (error) => {                                           │
│           handleError(error)                                       │
│         })                                                        │
│                                                                 │
│  4. CLEANUP                                                     │
│     └── return () => unsubscribe()                               │
│                                                                 │
│  Used in:                                                       │
│  ├── DashboardContext (notifications)                             │
│  ├── OrdersView (orders list)                                     │
│  ├── MyOrdersView (assigned orders)                               │
│  └── Any component needing real-time updates                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 One-Time Fetch Pattern

```
┌────────────────────────────────────────────────────────────────┐
│  ONE-TIME DATA FETCH                                            │
│  └── Used for: User profiles, static data, configuration         │
│                                                                 │
│  Pattern:                                                       │
│  ├── async function fetchData() {                                │
│  │   setLoading(true)                                            │
│  │   try {                                                        │
│  │     const docRef = doc(db, 'collection', 'id')                  │
│  │     const snapshot = await getDoc(docRef)                     │
│  │     if (snapshot.exists()) {                                   │
│  │       setData(snapshot.data())                                 │
│  │     }                                                           │
│  │   } catch (error) {                                             │
│  │     handleError(error)                                         │
│  │   } finally {                                                   │
│  │     setLoading(false)                                          │
│  │   }                                                             │
│  │ }                                                              │
│  └── useEffect(() => { fetchData() }, [])                        │
│                                                                 │
│  Used in:                                                       │
│  ├── AuthContext (user profile on auth state change)              │
│  ├── ServiceDetail page (service data)                           │
│  └── Profile page (user data)                                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 10. Error Handling & Recovery Flows

### 10.1 Firebase Error Handling

```
┌────────────────────────────────────────────────────────────────┐
│  FIREBASE ERROR CATEGORIES                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUTH ERRORS                                                    │
│  ├── auth/invalid-email          → "Invalid email format"         │
│  ├── auth/user-disabled          → "Account disabled"             │
│  ├── auth/user-not-found         → "No account with this email" │
│  ├── auth/wrong-password         → "Incorrect password"           │
│  ├── auth/email-already-in-use   → "Email already registered"   │
│  ├── auth/weak-password          → "Password too weak"            │
│  ├── auth/invalid-credential     → "Invalid credentials"          │
│  └── auth/too-many-requests      → "Too many attempts, try later" │
│                                                                 │
│  FIRESTORE ERRORS                                               │
│  ├── permission-denied           → "Access denied"                │
│  ├── not-found                   → "Data not found"             │
│  ├── already-exists              → "Already exists"             │
│  ├── resource-exhausted          → "Quota exceeded"               │
│  └── unavailable                 → "Service temporarily unavailable"│
│                                                                 │
│  HANDLING FLOW                                                  │
│  ├── try { firebaseOperation() }                                 │
│  ├── catch (error) {                                             │
│  │   const message = userFriendlyError(error.code)               │
│  │   setError(message)                                           │
│  │   showToast(message, 'error')                                 │
│  │   logToAnalytics(error)                                       │
│  │ }                                                             │
│  └── finally { setLoading(false) }                               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 10.2 Network Error Recovery

```
┌────────────────────────────────────────────────────────────────┐
│  OFFLINE / NETWORK ERROR                                        │
│                                                                 │
│  Detection:                                                      │
│  ├── Navigator.onLine API                                         │
│  └── Firebase connection state listener                         │
│                                                                 │
│  UI Feedback:                                                    │
│  ├── "You are offline" banner                                     │
│  ├── Disable forms/actions                                       │
│  └── Show cached data if available                               │
│                                                                 │
│  Auto-Retry:                                                     │
│  ├── Exponential backoff                                         │
│  ├── Max 3 retries                                               │
│  └── Queue actions for later sync                                │
│                                                                 │
│  Recovery:                                                       │
│  └── Connection restored:                                        │
│      ├── Hide offline banner                                     │
│      ├── Sync queued operations                                  │
│      └── Refresh data                                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 11. Complete User Journey Maps

### 11.1 First-Time Customer Journey

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Visit   │──▶│  Browse  │──▶│  Select  │──▶│   Book   │
│  Home    │   │ Services │   │ Service  │   │  Service │
└──────────┘   └──────────┘   └──────────┘   └────┬─────┘
                                                   │
                          ┌────────────────────────┼────────────────────────┐
                          ▼                        ▼                        ▼
                   ┌────────────┐          ┌────────────┐          ┌────────────┐
                   │  Register  │          │   Login    │          │Guest Check-│
                   │  Account   │          │ (Existing) │          │   out      │
                   └─────┬──────┘          └─────┬──────┘          └─────┬──────┘
                         │                       │                       │
                         ▼                       ▼                       ▼
                   ┌────────────┐          ┌────────────┐          ┌────────────┐
                   │  Booking   │          │  Booking   │          │  Booking   │
                   │   Wizard   │          │   Wizard   │          │   Wizard   │
                   └─────┬──────┘          └─────┬──────┘          └─────┬──────┘
                         │                       │                       │
                         └───────────────────────┼───────────────────────┘
                                                 │
                                                 ▼
                                          ┌────────────┐
                                          │  Payment   │
                                          │ Razorpay   │
                                          └─────┬──────┘
                                                │
                                                ▼
                                          ┌────────────┐
                                          │ Confirmation│
                                          │ WhatsApp   │
                                          └─────┬──────┘
                                                │
                                                ▼
                                          ┌────────────┐
                                          │  Track     │
                                          │  Order     │
                                          └────────────┘
```

### 11.2 Worker Journey

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Receive │──▶│  Accept  │──▶│   View   │──▶│  Start   │
│  Invite  │   │  Invite  │   │ Assigned │   │   Work   │
│   Key    │   │  (Join)  │   │  Orders  │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                   │
                                                   ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Receive │◀──│  Approve │◀──│  Mark    │◀──│ Complete │
│ Payment  │   │  Earning │   │  Done    │   │  Order   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### 11.3 Admin Daily Workflow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Login   │──▶│ Dashboard│──▶│  Review  │──▶│  Assign  │
│          │   │ Overview │   │ New Orders│   │  Workers │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                   │
                                                   ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Approve │◀──│  Review  │◀──│  Check   │◀──│ Monitor  │
│ Earnings │   │  Samples │   │ Progress │   │  Status  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

*Workflow Mindmap generated on March 26, 2026*
*Project: TN WEB RATS - Complete Application Workflow*
*Covers: Frontend flows, Backend processes, User journeys, Data synchronization*
