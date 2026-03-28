# Demo Data Guide

This project now includes an admin-facing demo dataset utility for quickly populating empty dashboards with realistic walkthrough data.

## Where To Use It

- Open the staff dashboard as an `admin`, `superadmin`, or `owner`
- Navigate to the `Demo Data` view
- Use `Seed Dataset` to create demo-tagged records
- Use `Clear Demo` to remove only demo-tagged records

## What Gets Seeded

- Users, wallets, and referral codes
- Orders covering pending, assigned, in-progress, awaiting-final-payment, and completed states
- Payments, reviews, disputes, notifications, samples, payroll records, transactions, and assignment requests

## Safety Rules

- Seeded documents are tagged with `demoSeed: true`
- Clear only deletes documents carrying that tag
- Re-seeding clears the previous demo dataset first, then writes a fresh one
- The utility seeds Firestore documents only; it does not create Firebase Auth sign-in accounts

## Demo Coverage

- Client dashboard examples
- Worker and manager order queues
- Admin analytics, disputes, referrals, wallet, payroll, and samples views
- Payment, review, and notification history for non-empty states
