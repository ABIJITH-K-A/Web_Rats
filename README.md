# Rynix - Professional Design & Development Services

A modern MVP platform for Rynix (formerly TN_WEB_RATS) — a studio providing professional design, web development, and creative services for students, startups, and businesses.

## About Rynix

Rynix is a student-friendly creative studio offering:
- **Design Services**: PPT, poster, and social media design
- **Web Development**: Portfolios, landing pages, and business websites
- **Fix & Optimization**: Bug fixes, UI improvements, and performance tuning
- **Templates & Assets**: Ready-to-use templates for quick launches

With direct founder access, fast delivery, and affordable pricing, Rynix is built for students and early-career professionals who need high-quality creative work without breaking the bank.

## Features

- **Booking System**: Complete order management with client requirements, milestones, and revision tracking
- **Payment Integration**: Secure Cashfree payment gateway with webhook verification
- **Template Marketplace**: Browse, purchase, and download website templates instantly
- **Payment Receipts**: Download/share payment confirmation as a PNG receipt
- **2-Payment Flow**: Advance deposit + final payment for custom orders via Cashfree
- **QR/UPI Payments**: Manual QR payment option with UTR verification (temporary fallback)
- **Student Referral Discount**: Discount system with referral codes for students
- **Worker Management**: Assign workers to orders, track progress, view team member profiles
- **Firebase Authentication**: Secure email/password and Google OAuth sign-in
- **Role-Based Dashboards**: Admin, owner, worker, and client views with distinct controls
- **Cookie Consent**: GDPR-compliant cookie consent banner with localStorage persistence
- **Responsive Design**: Mobile-first approach for all pages
- **Fast Performance**: Optimized with lazy loading, code splitting, and persistent Firestore cache
- **SEO Ready**: Built-in meta tags and structured data via react-helmet
- **Security**: Helmet headers, CORS, rate limiting, XSS sanitization, CSRF tokens

## Tech Stack

### Frontend
- React 19 with Vite 8
- Tailwind CSS v4
- React Router v7 (lazy-loaded routes)
- Firebase Authentication v12 & Firestore (persistent local cache)
- Lucide React icons
- Framer Motion animations
- Recharts for analytics
- html-to-image + file-saver for receipt downloads
- @vercel/analytics for usage tracking

### Backend
- Node.js with Express 4
- Firebase Admin SDK 14
- Cashfree Payment Gateway (API + Webhooks)
- Zod for request validation
- Helmet for security headers
- express-rate-limit for rate limiting
- xss for input sanitization
- Redis (optional, for auth caching)

### Infrastructure
- Frontend: Vercel (free)
- Backend: Render (free tier)
- Database: Firebase Firestore
- Auth: Firebase Authentication
- File Storage: Firebase Storage
- Cache: Redis (Render free tier, optional)

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Authentication, Firestore, and Storage enabled
- Cashfree merchant account (for live payments) or sandbox account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install          # Frontend dependencies
cd backend && npm install   # Backend dependencies
cd ..
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env.local with your credentials
# Edit backend/.env with your backend credentials
```

4. Start the development servers:
```bash
npm run dev
```

This starts both frontend (Vite on port 5173) and backend (Express on port 8787) via concurrently.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
TN_WEB_RATS MVP/
├── backend/
│   ├── src/
│   │   ├── config/       # Firebase Admin, DB, env config
│   │   ├── controllers/  # Finance, payout, wallet controllers (unused)
│   │   ├── jobs/         # Scheduled jobs (chat cleanup)
│   │   ├── lib/          # Utilities (async handler, errors, roles, status, referrals)
│   │   ├── middleware/    # Auth, CORS, error handler, rate limits, sanitize
│   │   ├── routes/       # API route handlers (auth, orders, payment, templates, etc.)
│   │   ├── services/     # Business logic (billing, cashfree, email, earnings)
│   │   ├── triggers/     # Firestore triggers
│   │   └── index.js      # Entry point
│   ├── scripts/          # DB migration & seed scripts
│   ├── render.yaml       # Render deployment config
│   └── package.json
├── src/
│   ├── components/       # React components (auth, dashboard, layout, marketplace, payment, ui)
│   ├── pages/            # Page components (public, auth, dashboard, marketplace, payment)
│   ├── context/          # AuthContext, DashboardContext
│   ├── hooks/            # Custom hooks (useTemplates, useFileUpload)
│   ├── services/         # API client, order service
│   ├── config/           # Firebase client config
│   ├── utils/            # Helpers (date, order, error, sanitize, system rules)
│   ├── data/             # Static data (site info, templates, seed data)
│   ├── styles/           # CSS files
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── public/               # Static assets (images, icons)
├── .env.example          # Frontend env template
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json
├── firebase-storage.rules
├── vite.config.js
└── package.json
```

## Environment Variables

### Frontend (`./.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | ❌ | Firebase analytics ID |
| `VITE_API_BASE_URL` | ✅ | Backend API URL (`http://localhost:8787` for dev) |
| `VITE_UPI_ID` | ❌ | UPI ID for QR payments |
| `VITE_APP_NAME` | ❌ | Default: "Rynix" |
| `VITE_APP_URL` | ❌ | Default: "https://rynix.studio" |

### Backend (`./backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ❌ | Server port (default: 8787) |
| `NODE_ENV` | ❌ | `development` or `production` |
| `CORS_ORIGIN` | ✅ | Comma-separated allowed origins |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | ✅ | Firebase service account private key |
| `CASHFREE_APP_ID` | ✅ | Cashfree API app ID |
| `CASHFREE_SECRET_KEY` | ✅ | Cashfree API secret key |
| `CASHFREE_WEBHOOK_SECRET` | ✅ | Cashfree webhook secret |
| `BACKEND_URL` | ✅ | Public backend URL (for webhook callbacks) |
| `FRONTEND_URL` | ✅ | Frontend URL (for notification links) |
| `SMTP_USER` | ❌ | Gmail SMTP user (email notifications) |
| `SMTP_PASS` | ❌ | Gmail app password |
| `TWILIO_ACCOUNT_SID` | ❌ | Twilio account SID (WhatsApp) |
| `TWILIO_AUTH_TOKEN` | ❌ | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | ❌ | Twilio WhatsApp number |
| `POSTGRES_URL` | ❌ | PostgreSQL URL (financial features) |
| `REDIS_URL` | ❌ | Redis URL (auth caching) |

## API Documentation

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login user |
| POST | `/auth/logout` | Required | Logout user |
| GET | `/auth/me` | Required | Get authenticated user profile |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders/create` | Optional | Create a new service order |
| GET | `/orders/:id` | Required | Get order details |
| GET | `/orders/user/:uid` | Required | Get user's orders |
| PATCH | `/orders/update-status` | Required | Update order status |
| POST | `/orders/assign-worker` | Admin | Assign worker to order |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payment/create-order` | Optional | Create payment for an existing order |
| POST | `/payment/create-intent` | Required | Create payment intent (template or revision) |
| POST | `/payment/webhook` | No | Cashfree payment webhook (raw body) |
| GET | `/payment/status/:requestId` | Required | Check payment status |

### Templates
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/templates` | Optional | List templates (search, filter, sort) |
| GET | `/templates/:id` | Optional | Get template details |
| GET | `/templates/:id/download` | Optional | Get template download URL (checks purchase) |
| POST | `/templates/unlock` | Required | Unlock a paid or free template |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | Admin | Dashboard statistics |
| GET | `/admin/orders` | Admin | All orders |
| GET | `/admin/users` | Admin | All users |
| PATCH | `/admin/user/:uid/role` | Admin | Update user role |

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |

### Additional Routes
- `/profile` — User profile management
- `/worker-profile` — Worker profile CRUD
- `/tickets` — Support ticket system
- `/announcements` — Platform announcements
- `/notification-settings` — Email/push notification preferences
- `/cron` — Scheduled task triggers
- `/temp/qpay` — Temporary QR payment routes

## Payment Flow

### Template Purchase Flow
1. User browses templates → clicks "Checkout"
2. Frontend calls `POST /payment/create-intent` with `{ kind: "template", referenceId: templateId }`
3. Backend creates a Cashfree order and returns a `paymentSessionId`
4. User is redirected to `https://payments.cashfree.com/checkout?session_id=...`
5. After payment, Cashfree redirects to `/payment-success/:requestId`
6. Cashfree sends webhook to `POST /payment/webhook`
7. Webhook verifies signature → records payment → writes to `templatePurchases`
8. User can now download the template via `GET /templates/:id/download`

### Custom Order 2-Payment Flow
1. User books a service → order created with `advancePayment` and `remainingPayment`
2. First payment (advance) via Cashfree → webhook updates `totalPaid` → status: `partial`
3. After work is done, admin moves status to `awaiting_final_payment`
4. Client pays remaining amount via Cashfree → webhook updates `totalPaid` to full
5. **Note**: The automatic transition to `completed` on full payment requires a small code fix (see Issues section below)

## Security Features

- **Helmet**: HTTP security headers with strict CSP and HSTS
- **CORS**: Origin validation against whitelist
- **Rate Limiting**: API-wide and auth-specific limits (express-rate-limit)
- **XSS Protection**: Input sanitization via `xss` library
- **CSRF**: Token generation per session
- **Request Logging**: Structured request logging
- **Input Validation**: Zod schemas for all API bodies
- **Auth**: Firebase ID token verification with Redis caching
- **RBAC**: Role-based access control (admin, owner, worker, client)
- **Account Suspension**: Checked on every authenticated request

## Deployment

### Frontend → Vercel (Free)

1. Push your code to a GitHub/GitLab repository
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Configure:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node Version | 20.x |

4. Add Environment Variables (in Vercel dashboard):
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### Backend → Render (Free, Always-On)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **New +** → **Web Service** → Connect your repo
3. Configure:

| Setting | Value |
|---------|-------|
| Name | `rynix-backend` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | **Free** |
| Health Check Path | `/health` |

4. Add Environment Variables (Render dashboard → Environment):
```
PORT=10000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret
BACKEND_URL=https://rynix-backend.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
```

5. (Optional) Add Redis: Render Dashboard → **New +** → **Redis** (free 25MB)

6. Update Cashfree Dashboard:
   - Webhook URL → `https://rynix-backend.onrender.com/payment/webhook`

### Alternative Backend Hosting Options

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Render** | ✅ 512MB RAM, always-on | Best option — has Redis + PostgreSQL |
| **Cyclic.sh** | ✅ 256MB RAM, always-on | No cold starts, simpler config |
| **Railway.app** | ✅ $5 credit | Hourly billing, $5 lasts ~1 month |
| **Fly.io** | ✅ 3 shared VMs | Requires credit card |
| **Koyeb** | ✅ 1 micro VM | Limited regions |

## Known Issues & Fixes

### 1. Backend `.env.example` References Razorpay (Outdated)
The `.env.example` still lists `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` but the code has been migrated to Cashfree. **Fix**: Update to:
```
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret
```

### 2. 2nd Payment Auto-Complete Missing
When the remaining balance is fully paid, the webhook updates `paymentStatus` to `'paid'` but does **not** auto-transition the order status to `completed`. **Fix**: In `backend/src/routes/paymentRoutes.js`, inside `handleOrderPaymentSuccess`, add after `nextRemaining === 0` check:
```javascript
if (nextRemaining === 0) {
  await orderRef.update({
    status: 'Completed',
    orderStatus: 'Completed',
    statusKey: 'completed',
    completedAt: FieldValue.serverTimestamp(),
  });
}
```

### 3. Wallet/Finance Controllers Not Mounted
`walletController.js`, `payoutController.js`, and `financeController.js` exist in `backend/src/controllers/` but are **not imported** in `app.js`. Either mount them or remove the unused files.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test locally with `npm run dev`
4. Submit a pull request with a clear description

## License

MIT License — see [LICENSE](LICENSE) file for details.

## Contact

- Email: hello@rynix.studio
- WhatsApp: +91 8300920680
- Instagram: @rynix.studio
- UPI: rynix@okaxis

## Acknowledgments

Built with purpose by **Mr_Ratty** and **WaveWalker**.