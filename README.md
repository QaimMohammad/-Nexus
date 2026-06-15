# Nexus — Investor & Entrepreneur Collaboration Platform

Full-stack platform connecting investors and entrepreneurs: role-based
dashboards, real-time chat, meeting scheduling with conflict detection,
WebRTC video calls, a document chamber with e-signatures, and a mock
payment wallet.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router 6, axios, socket.io-client |
| Backend | Node.js, Express 4, Socket.IO 4 |
| Database | MongoDB (Mongoose 8) — in-memory MongoDB auto-used in dev when `MONGODB_URI` is unset |
| Auth | JWT (7-day), bcrypt password hashing, optional email OTP 2FA |
| Uploads | Multer (local disk driver; swappable for S3) |

## Project structure

```
├── src/                  # React frontend
│   ├── services/         # API layer (axios + socket.io client)
│   ├── context/          # AuthContext (JWT session)
│   ├── pages/            # Route pages
│   └── components/       # UI components
├── server/               # Express backend
│   └── src/
│       ├── models/       # User, Meeting, Message, CollaborationRequest, Document, Transaction
│       ├── controllers/  # Route handlers
│       ├── routes/       # Routers + express-validator chains
│       ├── middleware/   # auth (protect/authorize), validation, error handler
│       ├── socket/       # Socket.IO: presence, chat, WebRTC signaling
│       └── seedData.js   # Demo data seeding
└── nexus-docs/           # API reference, Postman collection, demo deck
```

## Getting started (local)

Prerequisites: Node.js 18+. No local MongoDB needed for development.

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # optional in dev; required values for production
npm start                 # http://localhost:5000 (auto-seeds demo data in dev)

# 2. Frontend (repo root, second terminal)
npm install
npm run dev               # http://localhost:5173
```

### Demo accounts

All seeded accounts use password `password123`:

- **Entrepreneur:** sarah@techwave.io, david@greenlife.co, maya@healthpulse.com, james@urbanfarm.io
- **Investor:** michael@vcinnovate.com, jennifer@impactvc.org, robert@healthventures.com

## Environment variables

Frontend (`.env`): see [.env.example](.env.example)

- `VITE_API_URL` — backend base URL (default `http://localhost:5000`)

Backend (`server/.env`): see [server/.env.example](server/.env.example)

- `MONGODB_URI` — MongoDB connection string (required in production)
- `JWT_SECRET` — long random string (required in production)
- `JWT_EXPIRES_IN` — default `7d`
- `CLIENT_URL` — comma-separated allowed frontend origins (CORS)
- `PORT` — default 5000
- `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM` — optional; OTP/reset emails are
  logged to the console (and surfaced as dev tokens) when unset

## Deployment

**Backend → Render**

1. New Web Service from this repo, root directory `server`.
2. Build command `npm install`, start command `npm start`.
3. Set env vars: `MONGODB_URI` (MongoDB Atlas), `JWT_SECRET`,
   `CLIENT_URL=https://<your-vercel-app>.vercel.app`, `NODE_ENV=production`.
4. Note: uploaded files use local disk, which is ephemeral on Render's free
   tier — fine for demos; swap `server/src/config/upload.js` for S3 for
   durable storage.

**Frontend → Vercel**

1. Import the repo (framework: Vite). `vercel.json` already handles SPA rewrites.
2. Set `VITE_API_URL=https://<your-render-app>.onrender.com`.

## Documentation

See [nexus-docs/API.md](nexus-docs/API.md) for every endpoint, the Socket.IO
event reference, and error-code conventions. The
[Postman collection](nexus-docs/Nexus.postman_collection.json) and the demo
deck also live in [nexus-docs/](nexus-docs/).
