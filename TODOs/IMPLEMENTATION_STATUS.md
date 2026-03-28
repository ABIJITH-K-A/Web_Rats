# TN WEB RATS React TODO Tracker

This file consolidates the current TODO set from `TODOs/ByGPT` into a working project tracker.

## Done

- [x] Public marketing pages rebuilt around shared service data
- [x] Six-step booking flow with category, service, plan, requirements, payment summary, and confirmation
- [x] Auth and role-aware dashboard routing
- [x] Client dashboard with orders, payments, support, reviews, and reorder flow
- [x] Staff dashboards for admin, manager, and worker roles
- [x] Order assignment lifecycle aligned to the documented flow
- [x] Wallet, withdrawals, payroll, team-pay, disputes, and reviews basic flows
- [x] Analytics and team-pay screens switched from placeholder math to live Firestore data

## In Progress

- [ ] Payment flow hardening
  - [x] Demo-vs-backend Razorpay split
  - [x] Duplicate payment guards
  - [x] Failed checkout cleanup so unpaid draft orders do not remain
  - [x] Backend payment order creation endpoint
  - [x] Signature verification endpoint / webhook validation
  - [ ] Auto-refund/manual-review path when payment is captured but order sync fails

## Completion Check

- [ ] Frontend complete
  - [x] Public site, booking flow, auth flow, and role-based dashboards exist in the React app
  - [x] Admin demo-data tooling exists for walkthroughs and empty-state demos
  - [x] Booking order creation can now go through the backend API
  - [x] Wallet fetch/withdraw flow can now go through the backend API
  - [x] Notification fetch/mark-read flow can now go through the backend API
  - [ ] Connect/chat UI is not implemented yet
  - [ ] Template-system UI and creator flow are not implemented yet
  - [ ] AI tools / expansion UI is not implemented yet
  - [ ] Notification UX still needs throttling, batching, and cross-device read-sync behavior
  - [ ] Delivery/download protection UX is still pending
  - [ ] Some MVP hardening states are still incomplete on the frontend side for payment/error edge cases
- [ ] Backend complete
  - [x] Dedicated `backend/` service now exists in the repo
  - [x] Root `package.json` now includes backend helper scripts
  - [x] Firebase Admin backend config and auth middleware scaffold now exist
  - [x] Backend payment endpoints exist:
    - [x] `POST /payment/create-order`
    - [x] `POST /payment/verify`
    - [x] `POST /payment/webhook`
  - [ ] Full API/backend layer is still pending:
    - [x] auth (initial `/auth/me` and logout scaffold)
    - [x] orders (initial create/read/update/assign routes)
    - [x] wallet (initial read/withdraw routes)
    - [x] dispute (initial create/resolve routes)
    - [x] admin (initial orders/withdrawal approval routes)
    - [x] notifications (initial read/mark-read routes)
  - [ ] Middleware is still pending:
    - [x] auth guard
    - [x] role guard helper
    - [x] rate limit
    - [x] request validation
    - [ ] broader route coverage across every planned module
  - [ ] Firestore production backend work is still pending:
    - [ ] schema alignment audit
    - [ ] indexes
    - [ ] security rules
    - [ ] anomaly/audit alerting
  - [ ] Automation workers/jobs are still pending:
    - [ ] wallet release
    - [ ] payment reminders
    - [ ] worker-delay escalation
    - [ ] inactive-order auto-cancel
    - [ ] dispute auto-escalation

## Next Core Work

- [ ] Notification system completion
  - [x] Replace remaining direct notification writes with service helpers
  - [ ] Throttling and batching behavior
  - [x] Basic retry/failsafe behavior in notification creation
  - [ ] Cross-device read sync checks
- [ ] Automation rules
  - [ ] Wallet pending-to-withdrawable release worker
  - [ ] Payment reminders
  - [ ] Worker-delay escalation
  - [ ] Auto-cancel for inactive drafts/orders
  - [ ] Dispute auto-escalation
- [ ] Error and edge-case enforcement
  - [ ] Double order submission guard
  - [ ] Duplicate payment mismatch handling
  - [ ] Worker abandon -> reassignment flow
  - [ ] Deadline exceeded -> admin escalation
  - [ ] Wallet mismatch lock + audit alert
  - [ ] Multiple disputes on same order -> merge rule

## Backend / Data

- [ ] API/backend layer hardening for auth, orders, wallet, dispute, admin, notifications
- [x] Payment backend service scaffold with Razorpay order/verify/webhook routes
- [x] Firestore Admin backend scaffold with initial auth/orders/wallet/dispute/admin/notifications APIs
- [ ] Firestore schema alignment review and missing fields audit
- [ ] Firestore indexes and security rules pass
- [ ] Request validation / role guard / rate limit middleware
- [ ] Audit alerting and anomaly checks

## Product Modules Still Pending

- [ ] Connect/chat system for order-based communication
- [ ] Template system
  - [ ] Free/pro unlock logic
  - [ ] Tracking downloads and unlock type
  - [ ] Creator upload/earn-share flow
- [ ] AI tools / expansion system
  - [ ] Controller/frontend/backend/db/testing AI architecture planning
  - [ ] Free tools area like PPT/resume/analyzer

## Security / Delivery

- [ ] Expiring delivery links and watermark strategy
- [ ] Anti-download hardening
- [ ] Fraud detection hooks
- [ ] Token/session expiry validation
- [ ] Code-splitting pass for the current large Vite bundle

## Demo / Seed Tasks

- [x] Demo dataset / seeding guide for orders, payroll, disputes, samples, and notifications
- [x] Demo payment mode so booking can be exercised without a backend order API
- [x] Demo admin walkthrough data for empty dashboards
- [ ] Demo template/sample assets for public showcase

## Phase 2 Roadmap

- [ ] Connect / communication module
  - [ ] Order-based chat between client, worker, and admin
  - [ ] Text plus file exchange
  - [ ] Input sanitization for shared messages/files
- [ ] Template platform
  - [ ] Free and pro template catalog
  - [ ] Unlock methods: subscription, ad watch, referral, cooldown timer
  - [ ] Daily free unlock limit
  - [ ] Download and unlock-type tracking
  - [ ] Creator upload flow
  - [ ] Creator earn-share flow
  - [ ] Demo template/sample assets for public showcase
- [ ] AI expansion system
  - [ ] Controller AI orchestration layer
  - [ ] Frontend AI worker
  - [ ] Backend AI worker
  - [ ] Database/schema AI worker
  - [ ] Testing/validation AI worker
  - [ ] Shared memory plus task queue design
  - [ ] Free AI tools area: PPT generator, resume builder, website analyzer
- [ ] Growth and monetization
  - [ ] Subscription system
  - [ ] Ads-based unlock flow
- [ ] Advanced notification channels
  - [ ] Email delivery channel
  - [ ] WhatsApp delivery channel
- [ ] Delivery protection and advanced security
  - [ ] Expiring delivery links
  - [ ] Watermark strategy
  - [ ] Anti-download hardening
  - [ ] Protected/tokenized delivery URLs
  - [ ] Fraud-detection hooks for payment/account anomalies
- [ ] Performance and platform optimization
  - [ ] Code-splitting pass for the large Vite bundle
  - [ ] Deeper build/runtime optimization pass

## Notes

- The TODO bundle includes future backend and AI systems that are larger than the current React-only layer. Those remain pending until we add backend/cloud-function support.
- The `Phase 2 Roadmap` section above groups the post-MVP growth features that are not required for the first real launch.
- This tracker should be updated as each TODO slice is completed so the repo has a practical status view instead of only the source briefs.
