# Rynix Platform Roadmap

This document tracks the implementation plan for the remaining high-priority features.

## 🟢 1. Attachment Sorter (Completed)
- [x] Create `FileUploader.jsx` with Firebase Storage integration.
- [x] Create unified `OrderDetailsModal.jsx` for all roles.
- [x] Implement real-time `onSnapshot` sync in `Profile.jsx`, `OrdersView.jsx`, and `MyOrdersView.jsx`.

---

## 🟡 2. Cursor-Based Pagination
**Goal:** Prevent performance lag and reduce Firestore costs by loading data in chunks.
- **Target Files:**
  - `src/pages/dashboard/views/OrdersView.jsx`: Implement "Load More" for the master order list.
  - `src/pages/dashboard/views/UsersView.jsx`: Paginate the global user registry.
  - `src/pages/dashboard/views/ReviewsView.jsx`: Paginate public/staff reviews.
  - `src/services/orderService.js`: Add support for `startAfter` queries.

---

## 🟡 4. Visual Analytics Hub
**Goal:** Provide owners with a visual breakdown of revenue, order growth, and worker performance.
- **Target Files:**
  - `src/pages/dashboard/views/AnalyticsView.jsx`: Integrate charting library (Recharts).
  - `src/components/dashboard/AnalyticsCharts.jsx`: (New) Components for Line/Bar charts.
  - `src/services/financialService.js`: Add aggregation logic for monthly revenue.

---

## 🟡 5. Automated Payroll Calculation
**Goal:** Automatically calculate base pay + referral bonuses (5%) during payroll generation.
- **Target Files:**
  - `src/pages/dashboard/views/PayrollView.jsx`: Add "Calculate Period" logic with referral scanning.
  - `src/services/financialService.js`: Core logic for `calculateWorkerPayout(workerId, month)`.
  - `backend/src/services/financialService.js`: Ensure backend ledger matches frontend calculations.

---

## 🟡 3. Per-Order Threaded Chat
**Goal:** Dedicated discussion area inside the `OrderDetailsModal` for specific project talk.
- **Target Files:**
  - `src/components/dashboard/OrderDetailsModal.jsx`: Enable the "Discussion" tab.
  - `src/components/chat/OrderChatThread.jsx`: (New) Component for filtered chat messages.
  - `src/services/chatService.js`: Logic to fetch/send messages with `orderId` filter.
  - `backend/src/routes/chatRoutes.js`: Update backend to support order-specific rooms.
