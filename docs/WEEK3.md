# Week 3 Documentation — Payments, Security & Deployment

## Milestone 6: Payment Section (Mock Integration)

**Backend** (`server/src/controllers/paymentController.js`, `models/Transaction.js`):
- Sandbox wallet on every account (starts at $10,000, mock USD).
- `POST /api/payments/deposit` — simulates a successful card charge.
- `POST /api/payments/withdraw` — fails cleanly on insufficient funds: the
  attempt is still recorded as a **Failed** transaction with a reason.
- `POST /api/payments/transfer` — atomic two-sided transfer; the sender gets
  an `out` record and the recipient an `in` record.
- `GET /api/payments/transactions` — full history with status
  (**Pending / Completed / Failed**) and Stripe-style `txn_…` references.

**Frontend** (`src/pages/payments/PaymentsPage.tsx` at `/payments`):
- Wallet card with live balance and Deposit / Withdraw / Transfer actions
  (modal forms with amount, optional note, recipient picker for transfers).
- Total In / Total Out summary cards.
- Transaction history table: description, reference, date, status badge,
  signed amounts (failed amounts struck through with the failure reason).

## Milestone 7: Security Enhancements

All implemented in the backend and exercised by the frontend:

- **Validation & sanitization**: express-validator chains on every write
  endpoint (`.escape()` against XSS — script tags come back HTML-encoded),
  `express-mongo-sanitize` against NoSQL injection, Mongoose schema
  validation as a second layer.
- **Password hashing**: bcrypt with 12 rounds; password never serialized.
- **Secure JWT**: 7-day HS256 tokens; `protect` middleware verifies and
  re-loads the user on every request; socket connections authenticate with
  the same token.
- **2FA mockup**: toggle in Settings → next login requires a 6-digit OTP
  (hashed server-side, 10-minute expiry) delivered via Nodemailer when SMTP
  is configured, otherwise surfaced as a dev toast/console log.
- **Role-based authorization**: `authorize(...roles)` guards (only investors
  send collaboration requests, only the targeted entrepreneur responds, only
  owners share/delete documents, only invitees accept meetings).
- Also: helmet headers, CORS origin allowlist, rate limits (50/15min auth,
  500/15min API), enumeration-safe forgot-password, hashed reset tokens.

## Milestone 8: Final Integration & Deployment

- All modules integrated behind one dashboard shell with role-aware sidebar:
  Calendar/Meetings, Video, Documents, Payments, Chat, Profiles, Settings.
- `npx tsc` passes with zero errors; `npm run build` produces a clean
  production bundle.
- **API documentation**: [API.md](API.md) + importable
  [Postman collection](Nexus.postman_collection.json).
- **Deployment runbook** (see [README](../README.md#deployment)):
  - Backend → Render: root dir `server`, `npm install` / `npm start`, env:
    `MONGODB_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`.
  - Frontend → Vercel: Vite preset, `VITE_API_URL` pointing at Render;
    `vercel.json` already handles SPA rewrites.
  - Seed production data once with `npm run seed` (or register fresh users).

## Demo flow (suggested presentation script)

1. Register a new investor → lands on investor dashboard (JWT + role routing).
2. Browse startups → open Sarah's profile → send collaboration request.
3. Log in as Sarah (entrepreneur demo) → accept the request → open chat →
   messages arrive in real time.
4. Schedule a meeting with Michael → try double-booking the slot (409 toast)
   → log in as Michael → accept → **Join Call** → toggle mic/camera → end call.
5. Documents: upload a PDF → preview inline → share with Michael → Michael
   draws an e-signature → status flips to **signed**.
6. Payments: deposit, transfer to Michael, attempt an oversized withdrawal
   (failed transaction recorded) → walk the history table.
7. Settings: enable 2FA → log out → log in → enter the OTP.
