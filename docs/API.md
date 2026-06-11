# Nexus API Documentation

Base URL (local): `http://localhost:5000/api`
Base URL (production): `https://<your-render-app>.onrender.com/api`

All responses share the envelope:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "message": "Human-readable error" }
```

## Authentication

Authenticated endpoints require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued by register/login/verify-otp and expire after 7 days (configurable via `JWT_EXPIRES_IN`).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Create account. Body: `name, email, password (min 8 chars + number), role (entrepreneur\|investor)`. Returns `{ token, user }`. |
| POST | `/auth/login` | – | Body: `email, password, role?`. Returns `{ token, user }`, or `{ requiresOtp: true, userId }` when 2FA is enabled (plus `devOtp` in dev when SMTP is unset). |
| POST | `/auth/verify-otp` | – | Body: `userId, otp` (6 digits). Completes a 2FA login; returns `{ token, user }`. |
| POST | `/auth/forgot-password` | – | Body: `email`. Always 200 (no account enumeration). Emails a 30-minute reset link; returns `devResetToken` in dev when SMTP is unset. |
| POST | `/auth/reset-password` | – | Body: `token, password`. |
| GET | `/auth/me` | ✓ | Returns the authenticated user. |

Rate limit: 50 requests / 15 min on `/auth/*`, 500 / 15 min on the rest of the API.

## Users & Profiles

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users?role=investor&search=fintech` | ✓ | List users, optionally filtered by role and free-text search (name, startup, industry, bio). |
| GET | `/users/:id` | ✓ | Get a single profile. |
| PUT | `/users/:id` | ✓ self | Update own profile. Editable: `name, avatarUrl, bio, twoFactorEnabled`, entrepreneur fields (`startupName, pitchSummary, fundingNeeded, industry, location, foundedYear, teamSize`), investor fields (`investmentInterests[], investmentStage[], portfolioCompanies[], totalInvestments, minimumInvestment, maximumInvestment`). |

## Collaboration Requests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/collaborations` | investor | Body: `entrepreneurId, message`. 409 if a pending request already exists. |
| GET | `/collaborations` | ✓ | Investor sees sent requests; entrepreneur sees received. Users are populated. |
| PUT | `/collaborations/:id` | entrepreneur | Body: `status: accepted\|rejected`. Only the targeted entrepreneur may respond. |

## Messages (Chat)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/messages/conversations` | ✓ | Conversation list: counterparty user, last message, unread count. |
| GET | `/messages/:userId` | ✓ | Full history with a user (marks incoming as read). |
| POST | `/messages` | ✓ | Body: `receiverId, content`. Also pushed to the recipient via Socket.IO (`chat:message`). |

## Meetings (Scheduling)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/meetings` | ✓ | Body: `participantId, title, description?, startTime, endTime` (ISO). 409 on double-booking for either party (conflict detection). Returns the meeting incl. `roomId` for video calls. |
| GET | `/meetings?from=&to=&status=` | ✓ | All meetings where you are organizer or participant. |
| PUT | `/meetings/:id/respond` | invitee | Body: `status: accepted\|rejected`. Conflicts re-checked on accept. |
| PUT | `/meetings/:id/cancel` | organizer | Cancel a meeting. |

## Documents (Document Chamber)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/documents` | ✓ | `multipart/form-data`, file field `file`, optional `name`. Max 10 MB. Allowed: PDF, Office docs, text, images. |
| GET | `/documents` | ✓ | Documents you own or that are shared with you. |
| GET | `/documents/:id/download?inline=true` | ✓ | Stream the file (inline=true for preview, otherwise attachment). |
| PUT | `/documents/:id/share` | owner | Body: `userId`. |
| POST | `/documents/:id/sign` | ✓ | Body: `signature` (base64 image data URL). Sets status to `signed`. One signature per user. |
| PUT | `/documents/:id` | owner | Body: `name?, status? (draft\|in_review\|final)`. |
| DELETE | `/documents/:id` | owner | Delete document + file. |

## Payments (Mock Wallet)

Every account starts with a mock balance of $10,000.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/payments/wallet` | ✓ | `{ balance, currency }`. |
| POST | `/payments/deposit` | ✓ | Body: `amount, note?`. Mock card charge, always completes. |
| POST | `/payments/withdraw` | ✓ | Body: `amount, note?`. 422 + `failed` transaction when insufficient funds. |
| POST | `/payments/transfer` | ✓ | Body: `recipientId, amount, note?`. Creates an `out` transaction for the sender and an `in` transaction for the recipient. |
| GET | `/payments/transactions` | ✓ | Transaction history (type, direction, status `pending\|completed\|failed`, Stripe-style `reference`). |

## Socket.IO Events

Connect with the JWT: `io(API_URL, { auth: { token } })`.

| Direction | Event | Payload |
|---|---|---|
| receive | `user:online` / `user:offline` | `{ userId }` presence updates |
| send | `chat:send` | `{ receiverId, content }` + ack `{ success, message }` |
| receive | `chat:message` | message object (also emitted for REST-sent messages) |
| send | `video:join-room` | `{ roomId }` (use the meeting's `roomId`) |
| receive | `video:user-joined` | `{ socketId, userId, userName }` — existing peers should send an offer |
| send/receive | `video:offer` / `video:answer` / `video:ice-candidate` | WebRTC SDP/ICE relay, targeted via `targetSocketId` |
| send | `video:toggle` | `{ roomId, kind: 'audio'\|'video', enabled }` |
| receive | `video:peer-toggled` | `{ socketId, kind, enabled }` |
| send | `video:leave-room` | `{ roomId }` |
| receive | `video:user-left` | `{ socketId, userId }` |

## Error Codes

| Status | Meaning |
|---|---|
| 401 | Missing/invalid token, bad credentials, expired OTP |
| 403 | Authenticated but wrong role / not the resource owner |
| 404 | Resource not found (also returned for invalid ObjectIds) |
| 409 | Conflict: duplicate email, double-booked meeting, already-responded request |
| 410 | Document file no longer on storage |
| 422 | Validation failure (first failing field in `message`, all in `errors[]`) |
| 429 | Rate limit exceeded |
