# Week 2 Documentation — Collaboration & Document Handling

## Milestone 3: Meeting Scheduling System

**Backend** (`server/src/controllers/meetingController.js`, `models/Meeting.js`):
- `POST /api/meetings` — schedule with participant, title, description, start/end.
- `PUT /api/meetings/:id/respond` — invitee accepts/rejects (conflicts re-checked on accept).
- `PUT /api/meetings/:id/cancel` — organizer cancels.
- **Conflict detection**: `Meeting.findConflicts()` finds any overlapping
  pending/accepted meeting for either party (`startTime < end && endTime > start`);
  double-bookings are rejected with HTTP 409 and a human-readable message.
- Every meeting is created with a `roomId` used by the video-call module.

**Frontend** (`src/pages/meetings/MeetingsPage.tsx`):
- Upcoming and Past/Declined views with status badges.
- "Schedule Meeting" modal: pick a contact (opposite role), title, agenda,
  date, start/end times — conflict errors from the API surface as toasts.
- Invitee sees Accept/Decline; organizer sees Cancel; accepted meetings show
  a **Join Call** button that opens the meeting's video room.
- Added to both sidebars at `/meetings`.

## Milestone 4: Video Calling Integration

**Backend** (`server/src/socket/index.js`):
- Socket.IO signaling relay authenticated by JWT: `video:join-room`,
  `video:offer`, `video:answer`, `video:ice-candidate`, `video:toggle`,
  `video:leave-room`, plus `video:user-joined`/`user-left` notifications.

**Frontend** (`src/pages/call/VideoCallPage.tsx` at `/call/:roomId`):
- Mesh WebRTC: existing peers offer to each newcomer; answers and ICE
  candidates relayed through the backend; STUN via Google's public server.
- Features: join room, camera preview, **toggle audio/video** (state also
  broadcast to peers), participant name overlays, copy-invite-link, **end call**.
- Entry points: "Join Call" on accepted meetings, and the camera button in
  any chat (both participants derive the same deterministic room id, and a
  chat message invites the other side).

## Milestone 5: Document Processing Chamber

**Backend** (`server/src/controllers/documentController.js`):
- Multer disk-storage upload (10 MB cap, MIME whitelist), metadata in MongoDB
  (owner, version, status: draft/in_review/final/signed), share with users,
  authenticated download/inline-preview streaming, e-signature storage
  (base64 image + signer + timestamp), delete.

**Frontend** (`src/pages/documents/DocumentsPage.tsx`):
- Upload via button or drag-and-drop anywhere on the page (react-dropzone).
- "My Documents" and "Shared with Me" lists with size/version/owner/status.
- **Preview** modal: PDFs render inline in an iframe, images as `<img>`,
  streamed from the authenticated download endpoint as blob URLs.
- **E-signature**: canvas signature pad (`SignaturePad.tsx`) exports a PNG
  data URL; signed documents show who signed and when.
- Share modal (any platform user), download, owner-only delete.
- Storage summary card with live usage.

## Deliverables status

- Functional APIs for meetings, video signaling, documents — **done** (see [API.md](API.md)).
- Frontend connected to backend for all 3 modules — **done**.
