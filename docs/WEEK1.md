# Week 1 Documentation — Setup & Core Backend Foundations

## Milestone 1: Environment Setup & Codebase Familiarization

### What was done

- Cloned the Nexus frontend repo (React 18 + Vite + TypeScript + Tailwind).
- Created the backend in `server/` — Node.js + Express + MongoDB (Mongoose 8).
- Connected the frontend to the backend through a typed axios service layer
  (`src/services/`) with a JWT request interceptor and normalized error handling.
- Development convenience: when `MONGODB_URI` is unset, the server boots an
  in-memory MongoDB (`mongodb-memory-server`) and auto-seeds demo data, so the
  whole stack runs with zero local database setup. Production requires a real
  `MONGODB_URI` (MongoDB Atlas).

### Audit: existing frontend features that required backend APIs

| Frontend feature (was mock) | Mock source (removed) | Backend API now used |
|---|---|---|
| Login / Register / Forgot / Reset password | `AuthContext` against `data/users.ts`, localStorage "tokens" | `POST /api/auth/*` (JWT, bcrypt, hashed reset tokens) |
| Investor & Entrepreneur dashboards | `data/collaborationRequests.ts` | `GET /api/collaborations`, `GET /api/users?role=` |
| Find Investors / Entrepreneurs pages | `data/users.ts` arrays | `GET /api/users?role=investor\|entrepreneur` |
| Profile pages (investor/entrepreneur) | `findUserById()` | `GET /api/users/:id` |
| Collaboration request send/accept/reject | in-memory array mutation | `POST/GET/PUT /api/collaborations` |
| Chat & Messages | `data/messages.ts` | `GET/POST /api/messages*` + Socket.IO `chat:message` push |
| Documents page | hardcoded list | `GET/POST /api/documents` (wired in Week 2) |
| Deals page | hardcoded list | candidate for Week 2/3 enhancement |
| Notifications page | hardcoded list | candidate for Week 2/3 enhancement |
| Settings page | local state only | `PUT /api/users/:id` (incl. `twoFactorEnabled`) |

Routing gaps fixed along the way: `/forgot-password` and `/reset-password`
pages existed but were never registered in `App.tsx`; the login page's
"Forgot your password?" link was a dead `href="#"`.

## Milestone 2: User Authentication & Profiles

- **JWT authentication**: `POST /api/auth/register|login` issue 7-day HS256
  tokens; `protect` middleware verifies them and loads the user; passwords
  hashed with bcrypt (12 rounds), never returned by the API (`select: false`
  + `toJSON` transform).
- **Role-based access**: single `User` model with an
  `entrepreneur | investor` role and role-specific profile sections; the
  `authorize(...roles)` middleware guards role-restricted routes (e.g. only
  investors create collaboration requests, only entrepreneurs respond).
- **Profile management**: `GET/PUT /api/users/:id` with a whitelist of
  editable fields — bio, avatar, startup info (name, pitch, funding, industry,
  location, founded year, team size), investment info (interests, stages,
  portfolio, min/max ticket).
- **Extras pulled forward from Week 3 (security)**: helmet, CORS allowlist,
  rate limiting (50 req/15 min on auth), express-validator on every write
  endpoint with sanitization, mongo-sanitize against NoSQL injection,
  account-enumeration-safe forgot-password, optional email 2FA (OTP hashed,
  10-minute expiry) with a dev fallback when SMTP is unconfigured.

## How to run locally

```bash
# backend (terminal 1) - no DB install needed in dev
cd server && npm install && npm start

# frontend (terminal 2)
npm install && npm run dev
```

Demo accounts (auto-seeded): all use password `password123`
- Entrepreneur: `sarah@techwave.io` (also david@greenlife.co, maya@healthpulse.com, james@urbanfarm.io)
- Investor: `michael@vcinnovate.com` (also jennifer@impactvc.org, robert@healthventures.com)

## Status of later-week milestones

The backend for Weeks 2–3 was scaffolded in the same pass; all milestones
(backend **and** frontend) are now complete — see [WEEK2.md](WEEK2.md) and
[WEEK3.md](WEEK3.md).
