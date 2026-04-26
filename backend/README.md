# Backend Service

This folder contains the first server-side MVP slice for RYNIX.

## Current Scope

- `POST /payment/create-order`
- `POST /payment/verify`
- `POST /payment/webhook`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /orders/create`
- `GET /orders/:id`
- `GET /orders/user/:uid`
- `PATCH /orders/update-status`
- `POST /orders/assign-worker`
- `GET /wallet/:uid`
- `POST /wallet/withdraw`
- `GET /notifications/:uid`
- `PATCH /notifications/read`
- `POST /dispute/create`
- `PATCH /dispute/resolve`
- `GET /admin/orders`
- `POST /admin/approve-withdrawal`
- `GET /health`

## Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Add your Firebase Admin service-account env values
3. Add your Razorpay server credentials
4. Install dependencies inside `backend/`
5. Run `npm run dev`

`FIREBASE_PRIVATE_KEY` should keep newline characters escaped as `\n` inside `.env`.

## Frontend Wiring

Use these values in the root frontend `.env` file for local development:

```env
VITE_API_BASE_URL=http://localhost:8787
VITE_RAZORPAY_ORDER_URL=http://localhost:8787/payment/create-order
VITE_RAZORPAY_VERIFY_URL=http://localhost:8787/payment/verify
```

The frontend can still stay in demo mode when backend URLs are not configured.
