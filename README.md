# PeerConnect API — Backend

REST API for a campus-based student skill-sharing and peer-learning platform.

- **Phase 1 — Backend Foundation**: architecture, security, validation, docs, error handling. ✅
- **Phase 2 — Authentication & User Management**: registration, login, JWT access/refresh tokens, password reset, change password, current-user/profile endpoints, soft-delete. ✅
- **Phase 3 — Student Profile Management** (this phase): department/level/skills/learning interests/bio/availability, Cloudinary profile photo upload, public profile view. ✅
- **Phase 4**: next.

## Stack

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT (`jsonwebtoken`) + `bcrypt`
- Cloudinary (profile photo + chat image storage) + Multer (multipart upload handling)
- Socket.IO (real-time chat, typing indicators, presence, read receipts, live notifications)
- Nodemailer (session-request/session-accepted emails)
- Zod (env validation + request validation)
- Helmet, CORS, express-rate-limit
- Winston (logging) + Morgan (HTTP access logs)
- Swagger / OpenAPI (swagger-jsdoc + swagger-ui-express)
- Jest + Supertest (tests)

## Project structure

```
src/
├── config/          # env loading/validation, logger, Prisma client, Swagger spec
├── constants/         # shared constants (password policy, token settings)
├── controllers/         # thin request handlers — delegate to services
├── dtos/                   # response shaping (e.g. stripping password before it reaches JSON)
├── repositories/             # all Prisma queries — services never import `prisma` directly
├── routes/v1/                  # versioned REST routes + Swagger JSDoc annotations
├── services/                     # business logic — shared by REST controllers AND Socket.IO handlers
├── sockets/                        # Socket.IO server setup, JWT handshake auth, presence, chat + notification event handlers, the socketEmitter singleton
├── middlewares/                     # auth, upload (Multer), error handler, 404, validation, rate limiter, request logger
├── utils/                             # ApiError, ApiResponse, asyncHandler, password/jwt/token/Cloudinary helpers
├── validators/                          # Zod schemas per feature (REST bodies/queries AND socket payloads)
├── prisma/                              # schema.prisma
├── types/                                # shared types + Express Request augmentation
├── app.ts                                 # Express app assembly
└── server.ts                               # bootstrap: DB connect, listen, graceful shutdown
tests/
├── unit/            # services, utils, middleware — repositories mocked, no DB needed
└── integration/       # full app via supertest — repositories mocked, no DB needed
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to a real PostgreSQL instance, and generate real secrets for the JWT variables:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run that twice — once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`. They must be different from each other and at least 32 characters.

Also set the `CLOUDINARY_*` variables from your [Cloudinary console](https://cloudinary.com/console) (a free account is enough). These are required — the app won't start without them, same as the JWT secrets.

### 3. Generate the Prisma client & run migrations

```bash
npm run prisma:generate
npm run prisma:migrate
# prompted for a migration name, e.g. "add-auth-and-users"
```

### 4. Run the dev server

```bash
npm run dev
```

```
✅ Database connected
🚀 PeerConnect API running on http://localhost:4000 [development]
📚 API docs available at http://localhost:4000/api-docs
💬 Socket.IO chat server attached to the same port
```

### 5. Run the tests

```bash
npm test
```

All 66 tests run against mocked repositories — **no database required** to run the test suite. See "Testing" below.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (`tsx watch`) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled server (production) |
| `npm run typecheck` | Type-check without emitting files |
| `npm test` | Run the Jest test suite |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage report |
| `npm run prisma:generate` | Regenerate the Prisma client after schema changes |
| `npm run prisma:migrate` | Create + apply a new migration (dev) |
| `npm run prisma:migrate:deploy` | Apply pending migrations (prod/CI) |
| `npm run prisma:studio` | Browse the database with Prisma Studio |

## Endpoints (Phase 2)

All responses use the same envelope:

```json
// success
{ "success": true, "message": "Login successful.", "data": { ... } }

// error
{ "success": false, "message": "Invalid email or password.", "errors": ["optional per-field details"] }
```

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | – | Register a student. Returns user + access/refresh tokens. |
| POST | `/api/v1/auth/login` | – | Log in. Returns user + access/refresh tokens. |
| POST | `/api/v1/auth/refresh` | – | Exchange a refresh token for a new pair (rotation — the old one is invalidated). |
| POST | `/api/v1/auth/logout` | – | Revokes the given refresh token, if any. Always succeeds. |
| POST | `/api/v1/auth/forgot-password` | – | Generates a reset token. **Dev-only:** returned directly in the response (see below). |
| POST | `/api/v1/auth/reset-password` | – | Resets the password using a token from forgot-password. |
| PATCH | `/api/v1/auth/change-password` | ✅ | Change password (requires current password). |
| GET | `/api/v1/auth/me` | ✅ | Get the authenticated user. |
| PATCH | `/api/v1/users/me` | ✅ | Update `firstName` / `lastName` / `profileImage`. Email is not editable here. |
| DELETE | `/api/v1/users/me` | ✅ | Soft-delete the account (sets `deletedAt`, blocks future logins). |
| GET | `/api/v1/profile/me` | ✅ | Get the current user's account info + student profile. Auto-creates an empty profile on first access. |
| PATCH | `/api/v1/profile/me` | ✅ | Update `department` / `level` / `skills` / `learningInterests` / `bio` / `availability`. |
| POST | `/api/v1/profile/photo` | ✅ | Upload/replace the profile photo (multipart, field name `photo`) — stored on Cloudinary. |
| GET | `/api/v1/profile/:id` | – | Public view of another student's profile (name + profile fields; no email/role/account status). |
| GET | `/api/v1/students` | ✅ | Search + filter students by name/department/skills, paginated. |
| GET | `/api/v1/students/recommendations` | ✅ | Students recommended to the caller based on shared skills/learning interests. |
| POST | `/api/v1/sessions` | ✅ | Request a learning session with another student. Starts as `PENDING`. |
| GET | `/api/v1/sessions/requests` | ✅ | Incoming session requests still awaiting your decision (receiver + `PENDING` only). |
| GET | `/api/v1/sessions/history` | ✅ | Full session history — sent and received, every status, paginated. |
| PATCH | `/api/v1/sessions/:id/accept` | ✅ | Receiver accepts a `PENDING` request. Requires the receiver to be marked available. |
| PATCH | `/api/v1/sessions/:id/reject` | ✅ | Receiver rejects a `PENDING` request. |
| PATCH | `/api/v1/sessions/:id/cancel` | ✅ | Either participant cancels a `PENDING` or `ACCEPTED` session. |
| PATCH | `/api/v1/sessions/:id/complete` | ✅ | Either participant marks an `ACCEPTED` session `COMPLETED`. |
| GET | `/api/v1/chat/conversations` | ✅ | The caller's conversations — other participant, last message preview, unread count. |
| GET | `/api/v1/chat/:conversationId/messages` | ✅ | A conversation's message history, paginated. Participants only. |
| POST | `/api/v1/chat/upload-image` | ✅ | Upload an image to Cloudinary for use in a chat message. Doesn't send anything by itself. |
| POST | `/api/v1/reviews` | ✅ | Review the other participant of a `COMPLETED` session you took part in. One review per session. |
| GET | `/api/v1/reviews/:userId` | – | A student's received reviews, paginated, plus their average rating (computed over all reviews). |
| GET | `/api/v1/notifications` | ✅ | The caller's notifications, paginated, plus an unread count (independent of pagination). |
| PATCH | `/api/v1/notifications/:id/read` | ✅ | Mark a notification read. Idempotent. |

Session requests/acceptances and new chat messages also create notifications automatically — see "Real-time chat" below for the `notification:new` Socket.IO event, and "Design decisions" for how this is wired in.

Real-time messaging itself (sending/receiving messages, typing indicators, read receipts, presence) happens over **Socket.IO**, not REST — see the dedicated section below.

Full request/response schemas and examples: `http://localhost:4000/api-docs`.

For protected routes, send `Authorization: Bearer <accessToken>`.

## Real-time chat (Socket.IO)

Swagger/OpenAPI only documents REST, so the WebSocket event contract lives here instead.

### Connecting

Connect to the same host/port as the REST API, authenticating with the same access token used for REST requests — there's no separate socket token:

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: { token: accessToken },
});

socket.on("connect_error", (err) => {
  // err.message is one of: "Authentication required: no token provided.",
  // "Access token has expired.", or "Invalid access token."
});
```

A successful connection automatically joins the socket to a personal room (`user:<yourUserId>`) — every one of your devices/tabs lands in that same room, so messages and notifications reach all of them without any extra setup.

### Events you emit

| Event | Payload | What it does |
|---|---|---|
| `conversation:join` | `{ conversationId }` | Joins the room for a specific conversation. Optional — message delivery works without it (see below) — but useful if you later want conversation-scoped features. Rejects with an `error` event if you're not a participant. |
| `conversation:leave` | `{ conversationId }` | Leaves that room. |
| `message:send` | `{ conversationId?, receiverId?, content?, imageUrl? }` | Sends a message. Provide **either** `conversationId` (existing conversation) **or** `receiverId` (starts a new one on the fly). Provide **at least one** of `content` / `imageUrl`. For an image message, first `POST /chat/upload-image`, then pass the returned URL as `imageUrl` here. |
| `typing:start` | `{ conversationId }` | Tells the other participant you're typing. |
| `typing:stop` | `{ conversationId }` | Tells them you've stopped. |
| `message:read` | `{ conversationId }` | Marks every unread message in that conversation *not sent by you* as read, and notifies whoever sent them. |

### Events you receive

| Event | Payload | When |
|---|---|---|
| `message:receive` | `{ message, conversationId, isNewConversation }` | A new message in one of your conversations — sent to **both** participants (including your own other devices), so your own sent messages also arrive here as confirmation. |
| `message:delivered` | `{ conversationId, messageId }` | Sent back to you (the sender) only, only if the recipient had an active connection at send time. There's no persisted "delivered" state — the `Message` model only tracks `isRead` — so this is a live signal, not something you can fetch later via REST. |
| `message:read` | `{ conversationId, readByUserId, updatedCount }` | Sent to you when the *other* participant reads your messages. |
| `typing:start` / `typing:stop` | `{ conversationId, userId }` | Relayed from the other participant in that conversation. |
| `presence:update` | `{ userId, isOnline }` | Broadcast to *all* connected clients whenever any user's online status changes (their first device connects, or their last one disconnects). |
| `notification:new` | `{ id, title, message, type, isRead, createdAt }` | Pushed to your personal room the moment any notification is created for you — a session request, a session acceptance, or a new chat message. Same shape as a `GET /notifications` list item. |
| `error` | `{ message }` | Sent back to you only, for a validation failure or an authorization problem (e.g. sending into a conversation you're not part of) on any event you emitted. Never a crash, never a stack trace. |

### A minimal example

```js
socket.on("message:receive", ({ message, conversationId }) => {
  console.log(`New message in ${conversationId}:`, message.content);
});

socket.on("presence:update", ({ userId, isOnline }) => {
  // update an online/offline dot next to that user in your UI
});

socket.emit("message:send", { receiverId: otherUserId, content: "Hey!" });
```

## Design decisions worth knowing about

**Password policy.** Enforced by Zod (`src/constants/auth.constants.ts`): 8+ characters, at least one uppercase, one lowercase, one digit, one special character. Both `register` and `reset-password`/`change-password` require a matching confirmation field.

**Refresh tokens are rotated and revocable, not just stateless JWTs.** Each refresh token is a signed JWT *and* has a corresponding row in the `refresh_tokens` table (storing only its SHA-256 hash). On `/auth/refresh`, the old row is revoked and a new pair is issued — so a stolen-then-reused refresh token is detectable, and password changes / resets / account deletion can revoke *all* of a user's sessions at once (`revokeAllForUser`). Access tokens stay short-lived (15 min) and fully stateless (no DB check on every request) for performance; only the far more sensitive refresh token is tracked server-side.

**Login error messages.** Wrong email and wrong password both return the same generic `"Invalid email or password."` (401) to avoid confirming which emails are registered. Account-state problems (suspended/inactive/deleted) are only reported *after* the password has already been verified, and get their own 403 message — so a wrong password against a suspended account still just says "invalid credentials," rather than confirming the account exists and is suspended.

**Forgot-password returns the token directly — on purpose, for now.** Per the spec for this phase, there's no email provider wired up yet. `POST /auth/forgot-password` returns `data.resetToken` directly in the JSON response so the whole flow (request → reset) is testable end-to-end today. This is called out explicitly in the Swagger docs and in code comments at the one line that will need to change (`authService.forgotPassword`) — swap the return value for an email send, and the rest of the flow (hashing, expiry, single-use invalidation) doesn't change.

**Designed for Email OTP later without a schema rewrite.** `User.isEmailVerified` already exists but nothing enforces it yet. Adding OTP verification later means: set `isEmailVerified: false` explicitly on register, add an `EmailVerificationToken` model (mirrors `PasswordResetToken` almost exactly), and add one check in `authService.login`. No changes to the existing tables or auth flow.

**Repository pattern.** Services never call `prisma` directly — only `src/repositories/*.ts` do. This is what makes the whole test suite runnable without a database: `jest.mock` swaps out the repository layer, so `auth.service.ts` and the full Express app can be tested with real business logic but zero real I/O.

**Soft delete.** `DELETE /users/me` sets `deletedAt` and flips `accountStatus` to `INACTIVE` — the row is never removed. `findActiveById`/`findActiveByEmail` (used everywhere in the auth flow) filter out soft-deleted rows, so a deleted account can no longer log in, refresh, or be found by `/auth/me`, without losing any historical data other tables might later reference.

### Phase 3 additions

**`User.profileImage` vs `StudentProfile.profilePhoto` — these are intentionally two different fields, not a bug.** Phase 2's spec asked for a `profileImage` field on `User`, editable via `PATCH /users/me`. Phase 3's spec separately asked for a `profilePhoto` field on `StudentProfile`, populated only via `POST /profile/photo` (Cloudinary upload). Both exist because each phase asked for its own field, and I didn't want to quietly drop or merge something either spec explicitly listed. **Recommendation for the frontend:** treat `StudentProfile.profilePhoto` as the canonical, user-facing avatar going forward (it's what shows up in `GET /profile/me` and the public `GET /profile/:id`), and leave `User.profileImage` alone unless there's a separate reason to use it. If you'd rather collapse these into one field, that's a one-migration change — say the word for Phase 4 and I'll do it.

**Profile auto-creation only happens on your own profile, never as a side effect of viewing someone else's.** `GET /profile/me` and `PATCH /profile/me` use `upsert` (get-or-create) so a brand-new user never hits a 404 just for not having filled in a profile yet. `GET /profile/:id`, by contrast, never writes anything — if the target user has no profile row, the response just renders every profile field as empty/null rather than creating a row on their behalf triggered by someone else's read.

**Public profile fields are an explicit allow-list, not "everything minus password."** `toPublicStudentProfile` only ever includes `firstName`, `lastName`, and the `StudentProfile` fields. `email`, `role`, `accountStatus`, and `isEmailVerified` never reach `GET /profile/:id`, even though they're on the `User` row being read — those stay behind `/auth/me`, which only the account owner can call.

**Photo uploads never touch disk.** `multer.memoryStorage()` keeps the file as an in-memory buffer; `uploadImageBuffer` streams that buffer straight to Cloudinary via `upload_stream`. Each user has a stable Cloudinary `public_id` (`user_<id>`) with `overwrite: true`, so re-uploading replaces the old photo instead of accumulating orphaned images in the Cloudinary account.

### Phase 4 additions

**The paginated response shape is nested one level deeper than the spec's literal example, on purpose.** The spec shows `GET /students` returning `{ data, pagination }` directly. Every other endpoint in this API returns `{ success, message, data }` (an envelope your Phase 2 spec defined). Rather than pick one convention and silently break the other, `GET /students` returns:
```json
{
  "success": true,
  "message": "Students retrieved successfully.",
  "data": {
    "data": [ /* the actual list */ ],
    "pagination": { "page": 1, "limit": 10, "totalPages": 4, "totalItems": 37 }
  }
}
```
So `response.data.data` is the array and `response.data.pagination` is the pagination block — both names from the spec are honored, just nested under the standard envelope. If you'd rather flatten this (drop the envelope for list endpoints, or rename the inner key to something less repetitive like `students`), that's a quick change — let me know for Phase 5.

**`/students` and `/students/recommendations` require authentication.** The spec didn't say either way. `GET /profile/:id` (Phase 3) is intentionally public — but that only works if you already have a specific user's id. A *search/listing* endpoint is different: left open, it lets anyone enumerate the entire student directory without an account. Requiring auth here means only logged-in students can browse/search, which then lets them discover ids to look up via the public single-profile endpoint. Easy to relax later if open discovery turns out to be desired.

**Search matches array fields (skills, learning interests) via exact-value comparison with a few casing variants, not true substring search.** Postgres array columns don't support case-insensitive substring matching on individual elements through Prisma's typed query API — only exact-value filters (`has`/`hasSome`). So `search=React` will match a skill stored as exactly `"React"`, `"react"`, `"REACT"`, or `"React"` (capitalized), but won't match `"React Native"` as a substring. Name and department fields *do* get real substring matching (`contains`, case-insensitive) since those are plain string columns. This is a deliberate simplicity trade-off — the honest upgrade path if full substring search across array elements is needed later is a raw SQL query using `unnest()` + `ILIKE`, or a Postgres trigram index; deliberately not done here to keep queries inside Prisma's standard typed API. See the comment on `buildCaseVariants` in `src/utils/array.util.ts`.

**Recommendation scoring is intentionally dumb, on purpose.** `score = number of shared skills + number of shared learning interests`, via case-insensitive exact-value set intersection — no weighting, no ML, no "students who viewed X also viewed Y." The spec explicitly ruled out an AI recommendation engine, and this is about as simple as "recommend based on shared skills/interests" can get while still being genuinely useful and fully explainable (the response includes exactly *which* skills/interests matched, and the score, so nothing is a black box).

**Recommendations are still DB-filtered first, not computed by scanning every student.** `findCandidatesBySharedTags` uses Prisma's `hasSome` to pull only students who share *at least one* tag with the caller (capped at a bounded pool size — see `DISCOVERY_CONSTANTS.RECOMMENDATION_CANDIDATE_POOL_SIZE`), and only that already-narrowed set gets the more precise in-memory overlap-counting/ranking pass. This keeps the expensive part (scoring) cheap and bounded regardless of how many total students exist, while staying within Prisma's standard query API (no raw SQL).

**A student with an empty profile gets an empty recommendation list, not an error or a random fallback.** If `skills` and `learningInterests` are both empty, there's nothing to compute a meaningful overlap against — the service returns `[]` immediately without even querying candidates.

### Phase 5 additions

**Added `StudentProfile.isAvailable` (boolean) — a real, minimal schema change, made because the spec explicitly required an availability check that the existing schema couldn't support.** Phase 3 only gave `StudentProfile` a free-text `availability` field (e.g. `"weekdays after 5pm"`) — there was no boolean to actually gate anything on. Phase 5 explicitly requires "check receiver availability" before accepting a session, which needs a real yes/no signal, not a string to parse. So `isAvailable` (default `true`) was added alongside the existing `availability` field — same pattern as `User.profileImage` vs `StudentProfile.profilePhoto` from Phase 3: two fields that sound similar but serve different purposes, both kept because each was needed for a concrete, spec-driven reason. `isAvailable` is toggleable via the existing `PATCH /profile/me` (Phase 3) — no new endpoint needed.

**The availability check gates *accepting*, not requesting.** You can send a session request to anyone regardless of their availability flag — the check only blocks the receiver from accepting while `isAvailable` is `false`. This matches the spec's literal placement ("Before accepting: Check receiver availability") and means marking yourself unavailable doesn't hide you from other students, it just stops you from committing to new sessions until you flip it back.

**Authorization is enforced per action, not just "must be logged in."** Every state-changing endpoint checks *who* is calling, not just *that* someone is: only the receiver can accept/reject; either participant (requester or receiver) can cancel or complete; a third party gets a 403 even with a valid token. These checks live in the service layer (not the controller or a generic middleware), because each one depends on the specific session's `requesterId`/`receiverId`, not on the caller's role.

**Status transitions are a strict, one-way state machine — no resurrecting a closed session.** `PENDING → ACCEPTED/REJECTED/CANCELLED`, then `ACCEPTED → CANCELLED/COMPLETED`. Every transition checks the session's *current* status before allowing a change (e.g. accepting an already-`REJECTED` session returns `409`, not a silent no-op), so the status field can't be pushed into an inconsistent history.

**`/sessions/history` intentionally has no status filter.** The spec asked for "sent sessions" + "received sessions," not a filtered view — so it returns everything (any status, both directions), paginated and sorted newest-first. `/sessions/requests` is the narrower, purpose-built view (receiver + `PENDING` only) for "what's waiting on me right now."

**Same paginated-envelope shape as `GET /students` (Phase 4), for consistency.** `GET /sessions/requests` and `GET /sessions/history` both return `data: { data: [...], pagination: {...} }` — nested the same way and for the same reason (see the Phase 4 note above). Once you decide how you want that shape for Phase 4, the same change applies here.

### Phase 6 additions

**Business logic lives in `chat.service.ts`, called by both the REST controller and the Socket.IO handlers — neither owns the rules.** `sendMessage`, `markConversationRead`, participant authorization, conversation lookup — all of it is one shared service. The REST layer (`GET /chat/conversations`, `GET /chat/:id/messages`) and the socket layer (`message:send`, `message:read`, `typing:*`) are just two different transports calling the same functions. This is also why the socket test suite could reuse the exact same mock-the-repository-layer approach as every REST integration test in this project — the service underneath doesn't know or care which transport called it.

**Conversations are created lazily, on first message — there's no `POST /chat/conversations` endpoint.** `message:send` accepts either an existing `conversationId` or a `receiverId`; if you pass `receiverId` and no conversation exists yet, one is created as a side effect of sending the first message. `userOneId`/`userTwoId` are always stored in a canonical (lower-id-first) order with a unique constraint on the pair, so the same two users can never end up with two separate conversation rows depending on who messaged first.

**Message delivery uses personal rooms (`user:<id>`), not conversation rooms — on purpose.** Every device/tab a user has open joins their personal room automatically on connect. `message:send` broadcasts to both participants' personal rooms directly, so delivery doesn't depend on either side having called `conversation:join` first (e.g. the recipient might be sitting on a conversations-list screen, not inside this specific chat). `conversation:join`/`conversation:leave` still exist and work, kept as a lightweight opt-in room for anything conversation-scoped added later — they're just not on the critical path for messages to arrive.

**"Delivered" is a live signal, not a persisted state — because the spec's `Message` model only has `isRead`, not a delivery-status field.** When a message is sent, the server checks whether the recipient currently has an active connection (via the same in-memory presence registry used for online indicators) and, if so, emits `message:delivered` back to the sender. If the recipient is offline, no delivered event fires — the message just sits unread in the database, exactly as `isRead: false` already represents, and they'll see it via `GET /chat/:conversationId/messages` next time they're online. This keeps the schema exactly as specified rather than adding an implied `isDelivered` column the spec didn't ask for.

**Read receipts are conversation-level, not per-message.** `message:read` marks *every* currently-unread message in a conversation (that you didn't send) as read in one call, and notifies the original sender(s) once with an `updatedCount` — this matches how chat UIs actually work ("mark everything in this thread as seen when I open it") rather than requiring the client to track and acknowledge individual message ids.

**The online-presence registry is deliberately in-memory, not Redis-backed.** A `Map<userId, Set<socketId>>` living in the Node process is enough for a single-instance deployment (a final-year project won't be running a multi-node cluster) and keeps this phase's architecture genuinely simple, as asked. If this ever needs to scale horizontally, the registry is the one file (`sockets/onlineUsers.registry.ts`) that would need to become a shared store — nothing else in the socket layer would need to change, since everything else already goes through its small interface (`addConnection`/`removeConnection`/`isOnline`/`getOnlineUserIds`).

**Two separate Cloudinary upload functions, not one shared one.** `uploadImageBuffer` (Phase 3, profile photos) uses a stable per-user public id with `overwrite: true` and a face-crop transformation — correct for a replaceable avatar, meaningless for a chat photo. `uploadChatImageBuffer` (this phase) uses its own folder, a random Cloudinary-generated id, no overwrite, and no cropping — each chat image is distinct content, not a slot being replaced. Kept as two small purpose-built functions rather than one over-parameterized one, in the same spirit as the "keep architecture simple" instruction for this phase.

**Socket event names follow this phase's spec exactly (`message:send`/`message:receive`, `typing:start`/`typing:stop`), plus a few additions the spec implied but didn't name.** `conversation:join`/`conversation:leave` (needed for any future conversation-scoped feature), `message:delivered` and `message:read` (the two behaviors "Read Receipts" asked for — "message delivered" and "message read" — needed *some* event name each), and `presence:update` (needed to actually broadcast the "Online Indicator" the spec asked for). None of these conflict with the spec's named events; they fill in the gaps around them.

### Phase 7 additions

**One review per session is a real database constraint, not just an application-level check.** `Review.sessionId` is `@unique`, not just looked up before inserting. The service still checks first (so a duplicate attempt gets a clean `409` with a clear message instead of a raw database error), but the constraint is the actual guarantee — even a race condition where two requests to review the same session land at nearly the same instant can't produce two rows; the second insert fails at the database level regardless of application-layer timing.

**`receiverId` is never a request parameter — it's derived server-side from the session.** The client sends `sessionId` and `rating` (+ optional `comment`); the service looks up the session and sets the receiver to "whichever of the two participants isn't the caller." There's no way to name an arbitrary receiver, and no way to submit a review for a session you weren't part of — both are checked before the review is created, not just implied by the schema.

**"User cannot review themselves" is enforced twice, redundantly, on purpose.** A session's two participants (`requesterId`/`receiverId`) are already guaranteed distinct by Phase 5's request-a-session rule, so deriving the receiver as "the other participant" should make self-review structurally impossible. The service still asserts it explicitly as a defense-in-depth check, because the spec states the rule directly and a data model invariant from three phases ago isn't something a future change should be able to silently violate.

**Average rating is computed on read via a single Prisma `aggregate` query — nothing is cached on `User` or `StudentProfile`.** `GET /reviews/:userId` runs `prisma.review.aggregate({ where: { receiverId }, _avg, _count })`, which the database computes directly rather than the API fetching every review row and averaging in application code. This was a deliberate choice not to add a denormalized `averageRating` column anywhere: one source of truth (the actual review rows), no risk of a cached number drifting out of sync after an edit or deletion feature gets added later, and aggregate queries scale fine at the size this project expects. The displayed value is rounded to 1 decimal place (`4.7`, not `4.666666...`) without touching the underlying stored precision.

**The rating summary reflects *all* reviews, independent of pagination.** `GET /reviews/:userId?page=2&limit=5` still returns the true average and total count across every review that user has ever received — only the `data` array (the actual review list) is paginated. Otherwise the number on screen would silently change depending on which page happened to be loaded, which would be actively misleading.

### Phase 8 additions

**`createNotification()` is the one reusable entry point — Session and Chat both call it rather than writing to the `Notification` table themselves.** `session.service.ts` (on request and on accept) and `chat.service.ts` (on every new message) all call `notificationService.createNotification({ userId, title, message, type })`. That function does exactly two things: persist the row, and push it in real time over Socket.IO to the recipient's personal room. Nothing else — see the next point for why email isn't a third thing it does.

**Email is deliberately *not* inside `createNotification()` — it's a second, explicit call made by whichever service needs it.** Only two notification types need an email per spec (`SESSION_REQUEST`, `SESSION_ACCEPTED`); `CHAT_MESSAGE` explicitly shouldn't send one (imagine an email per chat message). If email were baked into the generic function with type-based branching, every future notification type would need a developer to remember to add a `case` for "should this email or not" inside a function that's supposed to be transport-agnostic. Instead, `session.service.ts`'s `requestSession`/`acceptSession` call `notificationService.createNotification(...)` *and* `emailService.sendSessionRequestEmail(...)` / `sendSessionAcceptedEmail(...)` as two separate, visible calls right next to each other. `chat.service.ts`'s `sendMessage` only calls the first one. The "should this email" decision lives at the call site, in plain sight, not hidden inside a shared function.

**REST-triggered code can push real-time events too, via one small singleton (`sockets/socketEmitter.ts`), rather than threading `io` through every function.** A `SESSION_REQUEST` notification is created from `POST /sessions` — an ordinary HTTP request with no socket in scope at all — but still needs to reach the recipient instantly if they're online. Every previous real-time feature (Phase 6 chat) only ever needed `io` from inside a socket event handler, where it's already available as a parameter. Notifications broke that assumption, so `socketEmitter.ts` holds one shared reference to the `io` instance (set once at startup) and exposes `emitToUser(userId, event, payload)` for any service to call. It's a safe no-op if the socket server hasn't started yet (e.g. in tests, where nothing calls `setSocketServer` at all) — never an error.

**Email failures can never fail the request that triggered them.** `emailService.sendEmail` wraps the actual `transporter.sendMail` call in try/catch and only logs on failure — a slow or misconfigured SMTP server can't turn a successful `POST /sessions` into a 500. This mirrors how Cloudinary upload failures are handled as a hard `400` (a photo upload's *entire point* is the upload succeeding) versus how a notification email is a side effect of an otherwise-already-successful operation — different failure semantics for genuinely different situations, not the same "wrap everything in try/catch" rule applied uniformly.

**`CHAT_MESSAGE` creates a notification for every message, with no debouncing, no "only if offline" logic, and no digest/batching.** The spec listed `CHAT_MESSAGE` as a notification type and explicitly ruled out a notification queue — building any kind of "don't notify if they're already looking at this conversation" logic would mean tracking additional state (which conversation is each user currently viewing) that nothing else in this phase needs, purely to avoid a redundant notification row. Kept simple, exactly as instructed; the cost is a notification row per message, which is an acceptable, easily-prunable trade-off for how small this generates.

**Push notifications are structure-only, as the spec explicitly allowed.** `pushNotificationService.sendPushNotification()` exists, has the right signature, and is where a real Expo/FCM/APNs call would go — but its body just logs. No `DeviceToken` model, no token-registration endpoint, and it isn't called from `createNotification()` yet, because wiring it up for real needs both of those first. The file itself documents exactly the three steps to finish it later. This is a deliberate "don't over-build an explicitly optional piece" choice, not an oversight — the socket + email channels are the two the spec actually required, and both are fully real.

**One existing model gained a field it didn't have before, for a concrete reason: session participant emails.** `session.repository.ts`'s `participantSelect` now includes `email` (previously just id/firstName/lastName/profileImage), because `session.service.ts` needs it to send the two notification emails. This does **not** change what any API response exposes — `session.dto.ts`'s `toParticipant()` mapping function was deliberately left untouched, so `email` is available to the service layer internally but still never serialized into a `GET /sessions/...` response. The repository is allowed to know more than the public contract exposes; the DTO is what keeps that boundary real.

**The personal-room helper moved out of `chat.constants.ts` into a new `socket.constants.ts`.** `user:<id>` rooms were introduced in Phase 6 for chat, but notifications are the second, unrelated feature that now needs the exact same "one room per user" concept. Leaving it named and homed under "chat" once a second consumer existed would have been misleading, so it's now `SOCKET_CONSTANTS.userRoom` — a small, mechanical refactor, not a behavior change.

## Testing

```bash
npm test
```

**235 tests, 24 suites, all passing, no database, no real Cloudinary account, and no real SMTP server required.** The repository layer (`src/repositories/*`), the Cloudinary upload wrapper, and the Nodemailer transporter are all mocked with `jest.mock(...)`, so:

- `tests/unit/*.test.ts` — password hashing, JWT signing/verification, token generation, the auth middleware, the online-presence registry, the socket-emitter singleton, the push-notification stub, and the full `auth.service` / `user.service` / `studentProfile.service` / `studentDiscovery.service` / `session.service` / `chat.service` / `review.service` / `notification.service` / `email.service` business logic — all against mocked repositories, a mocked Cloudinary uploader, and a mocked mail transporter.
- `tests/integration/*.routes.test.ts` — the *real* Express app (`createApp()`) driven with Supertest: real routing, real Zod query/body/param validation, real auth middleware, real Multer file handling, real error handler — only the repository, Cloudinary, and email layers underneath are mocked.
- `tests/integration/chatSocket.test.ts` — a genuinely real Socket.IO server (an actual `http.Server` + `createSocketServer()`, listening on a real local port) driven by real `socket.io-client` connections. Only the repository layer underneath is mocked.

One detail worth knowing if you add a Phase 9 router later: `app.ts` mounts every router together, so **every integration test file that imports `createApp` needs to mock every repository module**, even ones it doesn't directly exercise — otherwise requiring `app.ts` pulls in an unmocked repository, which pulls in `config/database.ts`, which tries to construct a real `PrismaClient` and throws. Every integration test file here mocks every repository for exactly this reason; the comment in each file explains it inline. (This also means a real, unmocked `PrismaClient` genuinely cannot be constructed at all until `prisma generate` has run for real — confirmed directly during Phase 4's verification.) Phase 8 adds one more wrinkle to the same rule: since `session.service.ts` now also calls `email.service.ts` as a real side effect, `session.routes.test.ts` (and `notification.routes.test.ts`, which shares the same app) mock `email.service` too, to guarantee zero real network calls during tests.

**A related gotcha this phase surfaced, worth knowing if you extend the mocks yourself:** don't reach for `jest.requireActual(...)` to pull one real helper function (like `conversationRepository.canonicalPair`) out of an otherwise-mocked module — `requireActual` really does execute that module's top-level code, which for a repository means constructing a real `PrismaClient` and throwing, exactly as if it weren't mocked at all. Every place this project needs a small pure helper from a mocked repository, it's reimplemented inline in the mock factory instead (see `canonicalPair` in any of the chat/review/notification test files for the pattern).

This means the whole suite runs in a few seconds with no PostgreSQL, Cloudinary, or SMTP credentials needed, while still exercising real bcrypt hashing, real JWT signing/verification, and a real WebSocket connection (none of it mocked) — the parts of the system where getting the actual behavior right matters most.

## A note on this environment

Same as Phase 1–7: this sandbox's network access doesn't reach Prisma's binary CDN, so `npx prisma generate` can't fully complete here — a normal environment won't have this problem. Everything that *can* be verified without it, was:

- **TypeScript**: the entire codebase (Phases 1–8) was confirmed to compile with zero errors using a temporary type shim standing in for the generated Prisma client (extended this round to cover `Notification`), then re-confirmed to show only the expected "missing export" errors (all pointing at Prisma-generated types) once the shim was removed. The shim itself is not part of this delivery.
- **Runtime — REST**: all REST integration tests pass, including full HTTP round-trips through the real Express app, and specifically confirmed that `POST /sessions` and `PATCH /sessions/:id/accept` still succeed even with email mocked out — i.e. the request path never depends on email delivery succeeding.
- **Runtime — Socket.IO**: unchanged from Phase 6, still verified against a real running server and real `socket.io-client` connections.
- **Runtime — email**: `emailService` was verified against a mocked Nodemailer transporter to confirm both the happy path (correct `to`/`subject`/`html` content, including both parties' names and the skill) and the failure path (a rejected `sendMail()` call is caught and logged, never thrown) — no real SMTP server was reachable in this sandbox, so an actual email was never sent as part of this verification, same limitation as Cloudinary in earlier phases.
- **Swagger**: the generated OpenAPI spec was confirmed to include all 29 documented REST paths with their methods.

## Next phase

**Phase 9**, building on the `User` + `StudentProfile` + `Session` + `Conversation`/`Message` + `Review` + `Notification` models, auth middleware, and the established REST + Socket.IO dual-transport pattern already in place here.
