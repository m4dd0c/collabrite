# DevUnity - Real-time Collaborative Coding Platform

**Document Version:** 1.0 | **Date:** April 19, 2026 | **Author:** DevUnity Development Team  
**Repository:** h4rich/DevUnity | **License:** GNU GPL v3.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [Overall Description](#overall-description)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [System Architecture](#system-architecture)
6. [Database Design](#database-design)
7. [API Specifications](#api-specifications)
8. [WebSocket Events](#websocket-events)
9. [UI/UX Components](#uiux-components)
10. [Security Requirements](#security-requirements)
11. [Use Cases](#use-cases)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Requirements](#deployment-requirements)
14. [Future Enhancements](#future-enhancements)
15. [Appendix](#appendix)

---

## 1. Introduction

### 1.1 Purpose

DevUnity is a **real-time collaborative coding platform** enabling multiple developers to work together on coding projects. This document specifies functional and non-functional requirements for development, deployment, and maintenance.

### 1.2 Scope

**Features:**

- Real-time code editing with live synchronization
- Instant chat within coding rooms
- Multi-language support: JavaScript, TypeScript, Python, C++, C, PHP, Java
- User authentication, profile management, email verification
- Password-protected rooms with participant management
- Code execution via Judge0 API
- Rich text descriptions via TinyMCE
- User and room search with pagination
- Responsive UI with animations

**Stack:**

- **Frontend:** React.js (TypeScript) + Vite + Tailwind CSS + Framer Motion
- **Backend:** Node.js/Express (TypeScript) + Socket.io
- **Database:** MongoDB
- **External:** Cloudinary, TinyMCE, Judge0, Nodemailer

### 1.3 Definitions

| Term       | Definition                                     |
| ---------- | ---------------------------------------------- |
| JWT        | JSON Web Token                                 |
| UUID       | Universally Unique Identifier                  |
| Socket.io  | Real-time bidirectional communication library  |
| Cloudinary | Cloud-based image management service           |
| TinyMCE    | Rich text editor                               |
| Judge0     | Online code execution API                      |
| TTL        | Time To Live — auto-expiration of DB documents |

---

## 2. Overall Description

### 2.1 System Context

```
Users → Frontend (React/Netlify) → Backend (Express/Render)
                                         ↓
                              MongoDB | Cloudinary | Nodemailer | Judge0
```

### 2.2 User Classes

- **Developers/Teams** — collaborative coding
- **Students/Educators** — learning and classroom demos

### 2.3 Operating Environment

- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Backend:** Node.js 22.5.1+, MongoDB Atlas or self-hosted 5.0+
- **Hosting:** Netlify (frontend), Render (backend), MongoDB Atlas (DB), Cloudinary (CDN)

### 2.4 Constraints

| Category              | Constraint              |
| --------------------- | ----------------------- |
| Code sync latency     | < 200ms                 |
| Chat delivery         | < 500ms                 |
| Page load             | < 3 seconds             |
| Concurrent users/room | 100 minimum             |
| Passwords             | bcryptjs hashed         |
| JWT validity          | 7 days, httpOnly cookie |
| Avatar max size       | 5MB                     |
| Room code max         | 150,000 chars           |
| Chat message max      | 100 chars               |
| User bio max          | 125 chars               |
| Room description max  | 5000 chars              |

---

## 3. Functional Requirements

### 3.1 Authentication (FR-AUTH)

**FR-AUTH-001: Registration**

- Fields: email (unique, max 100), username (3–32 chars, lowercase, unique), password (8–100 chars, bcrypt hashed)
- Sends verification email; account inactive until verified
- Verification token valid 3 days; user auto-deleted on expiry

**FR-AUTH-002: Login**

- Login with email or username + password
- Generates JWT (7 days) stored in httpOnly cookie
- Invalid credentials → 401

**FR-AUTH-003: Logout**

- Clears auth cookie, disconnects WebSocket, saves room chat

**FR-AUTH-004: Password Recovery**

- Reset token sent via email, valid 15 minutes
- Demo account (`user@test.com`) cannot change password

**FR-AUTH-005: Auth Middleware**

- Validates JWT from cookies on all protected routes; returns 401 on failure

### 3.2 User Management (FR-USER)

**FR-USER-001: Profile Retrieval** — Public profile by user ID (username, name, bio, location, portfolio, avatar, rooms)

**FR-USER-002: Get Current User** — Complete profile including private fields; authenticated only

**FR-USER-003: Edit Profile** — Update username, name, location, portfolio, bio, avatar (Cloudinary); validates username uniqueness

**FR-USER-004: Username Availability** — Case-insensitive check; supports edit mode with current user exclusion

**FR-USER-005: Change Password** — Verifies current password; demo account blocked

**FR-USER-006: Search Users** — Regex match on username/name; paginated (page, size); sorted by newest

**FR-USER-007: Delete Account** — Removes user, owned rooms, discussions, participant entries; demo account blocked

**FR-USER-008: Contact Form** — Sends name/email/message to admin via SMTP

### 3.3 Room Management (FR-ROOM)

**FR-ROOM-001: Create Room** — UUID v4 ID; password (6–100 chars); title (3–32 chars, default "Untitled"); auto-creates Discussion; creator is admin and first participant

**FR-ROOM-002: Get Room** — Three access levels: `r` (limited), `rwx` (no password, no code if inactive), `admin` (full including password)

**FR-ROOM-003: Join Room** — Password required for non-admins; adds user to participants and active users

**FR-ROOM-004: Update Room** — Admin only; updateable: title, explanation, description

**FR-ROOM-005: Delete Room** — Admin only; cascades to discussion and participant lists

**FR-ROOM-006: List User Rooms** — Owned rooms with populated admin/participant data

**FR-ROOM-007: Search Rooms** — Regex on title/explanation/language; optional owner filter; paginated

**FR-ROOM-008: Update Settings** — Admin only; change password or language (js/java/py/cpp/c/php)

**FR-ROOM-009: Save Code** — Active users only; max 150,000 chars; persists across sessions

### 3.4 Code Execution (FR-CODE-EXEC)

**FR-CODE-EXEC-001: Submit** — Base64 encodes code + stdin; submits to Judge0 via RapidAPI; returns token

**FR-CODE-EXEC-002: Poll** — Polls every 2 seconds until status changes from "Processing"; timeout at 30 seconds

**FR-CODE-EXEC-003: Display** — Shows stdout, stderr, compilation output, execution time and memory usage

### 3.5 Discussion/Chat (FR-DISCUSSION)

**FR-DISCUSSION-001: Get History** — Full chat with sender info; active users only

**FR-DISCUSSION-002: Add Message** — 1–100 chars; sender must be room participant; auto-timestamped

**FR-DISCUSSION-003: Initial Message** — Welcome message from room creator on room creation

### 3.6 Real-time Features (FR-REALTIME)

**FR-REALTIME-001: Code Sync** — Broadcasts code changes to room except sender; < 200ms

**FR-REALTIME-002: Language Broadcast** — All users receive language change; updates ACE editor mode

**FR-REALTIME-003: Join Notification** — Notifies all room members when someone joins

**FR-REALTIME-004: Chat Broadcast** — Real-time messages to all room users; < 500ms

**FR-REALTIME-005: Code Load Sync** — New joiner requests code; existing user sends snapshot (targeted, not broadcast)

**FR-REALTIME-006: Chat History Sync** — Same pattern as code load; preserves message order

---

## 4. Non-Functional Requirements

| ID                | Category     | Requirement                                                                                     |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| NFR-PERF-001      | Performance  | API < 200ms (p95); WS latency < 50ms; page TTI < 3s; FCP < 1.5s                                 |
| NFR-PERF-002      | Concurrency  | 100+ concurrent users/room; 10,000+ platform-wide                                               |
| NFR-PERF-003      | Database     | Queries < 100ms (p99); indexed reads < 50ms; pool 10–50 connections                             |
| NFR-PERF-004      | Code Exec    | Judge0 timeout 30s; simple executions < 5s                                                      |
| NFR-SCALE-001     | Scaling      | Stateless backend; Socket.io Redis adapter for multi-instance                                   |
| NFR-SCALE-002     | DB Scale     | MongoDB replication; sharding-ready                                                             |
| NFR-REL-001       | Availability | 99.5% uptime monthly; auto-reconnect with exponential backoff                                   |
| NFR-REL-002       | Data         | Auto-save code every 30s; chat persisted immediately; daily backups (30-day retention)          |
| NFR-REL-003       | Errors       | No unhandled exceptions; all errors logged with context; user-friendly messages                 |
| NFR-SEC-001       | Security     | HTTPS/TLS 1.2+; CORS configured; Helmet.js headers; rate limiting (100 req/min, 5 req/min auth) |
| NFR-MAINT-001     | Quality      | ESLint + Prettier + TypeScript strict; test coverage > 70%                                      |
| NFR-USABILITY-001 | UX           | WCAG 2.1 AA; responsive 320px–4K; new users productive within 5 minutes                         |

---

## 5. System Architecture

### 5.1 Frontend Structure

```
src/
├── components/ (layout, forms, ui)
├── screens/ (Home, Auth, Room, User)
├── context/ (SocketContext, context.ts)
├── api/ (judge0.ts)
├── lib/ (actions/, utils.ts, logger.ts)
├── types/
├── constants/
├── App.tsx
└── main.tsx
```

**Key Libraries:** React Router DOM, React Query, Socket.io Client, Axios, React Hook Form, Zod, Framer Motion, Ace Editor, TinyMCE, Tailwind CSS, Three.js

### 5.2 Backend Structure

```
backend/src/
├── server.ts / app.ts
├── config/ (connectDB.ts)
├── routes/ (userRoute, roomRoute, discussionRoute)
├── controller/ (userController, roomController, discussionController)
├── model/ (User, Room, Discussion)
├── middleware/ (authenticated, error, multer)
├── SocketService/ (SocketService.ts, events.ts)
├── dto/ (UserDTO.ts)
└── utils/ (DevUnityError, DevUnityRes, mailer, catchAsync)
```

**Middleware stack (in order):** express.json → cors → cookieParser → helmet → Routes → Error Handler

### 5.3 Key Data Flows

**Registration:**

```
Input → Zod Validate → Username/Email Check → Hash Password
→ Create User (verified=false) → Send Email → Set JWT Cookie
```

**Code Collaboration:**

```
User A edits → emit f:code_change → Backend broadcasts to room (except A)
→ emit b:code_change → User B/C update editor
```

**New User Join:**

```
User C joins → emit f:code_req → Backend forwards to room
→ Existing user emits f:code_load to C's socket ID
```

---

## 6. Database Design

### 6.1 Schemas

**User**

```typescript
interface IUser {
  email: string; // unique, lowercase, max 100
  username: string; // unique, lowercase, 3-32
  password: string; // hashed
  name?: string;
  location: string; // max 50
  portfolio: string; // max 50
  bio: string; // max 125
  rooms: ObjectId[];
  avatar: { secure_url: string | null; public_id: string | null };
  resetPassword: { token: string | null; expiresAt: Date | null };
  verification: {
    verified: boolean;
    expiresAt: Date | null;
    token: string | null;
  };
  // Methods: comparePassword(), genJwt()
}
```

Indexes: `email` (unique), `username` (unique), `verification.expiresAt` (TTL)  
Hooks: pre-delete cascades rooms/discussions; pre-save hashes password

**Room**

```typescript
interface IRoom {
  roomId: string; // UUID v4, unique
  password: string; // 6-100 chars
  admin: ObjectId;
  participents: ObjectId[];
  activeUsers: ObjectId[];
  discussion: ObjectId;
  project: {
    title: string; // default "Untitled"
    explanation?: string; // max 150
    description?: string; // max 5000, rich HTML
    lang: "js" | "java" | "py" | "cpp" | "c" | "php";
    code?: string; // max 150,000
  };
}
```

Indexes: `roomId` (unique), `admin`, `createdAt` (desc), `participents`  
Hooks: pre-delete removes discussion, updates user room lists

**Discussion**

```typescript
interface IDiscussion {
  room: ObjectId;
  admin: ObjectId;
  chat: Array<{ message: string; sender: ObjectId }>; // message 1-100 chars
}
```

### 6.2 Relationships

```
User (1) → (Many) Room      [admin field, participents[]]
User (1) → (Many) Discussion [admin field]
Room (1) → (1) Discussion   [discussion field]
Room ↔ User (Many-to-Many)  [participents[]]
```

### 6.3 Validation

**DB Constraints Summary:**

| Collection | Field        | Constraints                |
| ---------- | ------------ | -------------------------- |
| User       | email        | unique, lowercase, max 100 |
| User       | username     | unique, lowercase, 3–32    |
| User       | password     | min 8, max 100, hashed     |
| Room       | roomId       | unique, UUID format        |
| Room       | password     | min 6, max 100             |
| Room       | project.code | max 150,000                |
| Room       | project.lang | enum: js/java/py/cpp/c/php |
| Discussion | chat.message | 1–100 chars                |

**Zod example:**

```typescript
RoomCreationSchema = z.object({
  roomId: z.string().uuid(),
  password: z.string().min(6).max(100),
  title: z.string().min(3).max(32),
});
```

---

## 7. API Specifications

All responses follow:

```typescript
{ success: boolean; message?: string; data?: T; statusCode?: number; error?: { code, message, details } }
```

### 7.1 User Endpoints

| Method | Endpoint                               | Auth | Description                |
| ------ | -------------------------------------- | ---- | -------------------------- |
| POST   | `/api/v1/user/signup`                  | No   | Register                   |
| POST   | `/api/v1/user/signin`                  | No   | Login                      |
| GET    | `/api/v1/user/verify/:token`           | No   | Verify email               |
| GET    | `/api/v1/user/logout`                  | No   | Logout                     |
| PUT    | `/api/v1/user/password/change`         | Yes  | Change password            |
| PUT    | `/api/v1/user/password/forget`         | No   | Request reset              |
| PUT    | `/api/v1/user/password/reset/:token`   | No   | Reset password             |
| GET    | `/api/v1/user/profile/:userId`         | No   | Public profile             |
| GET    | `/api/v1/user/me`                      | Yes  | Current user               |
| PUT    | `/api/v1/user/me`                      | Yes  | Update profile (multipart) |
| POST   | `/api/v1/user/username/available`      | No   | Check username             |
| DELETE | `/api/v1/user/me`                      | Yes  | Delete account             |
| GET    | `/api/v1/user/search/:query?page&size` | No   | Search users               |
| POST   | `/api/v1/user/contact`                 | No   | Contact form               |

**Notable request/response details:**

`POST /signup` body: `{ name, email, username, password }` → 201, sets httpOnly JWT cookie  
`POST /signin` body: `{ input, password }` (input = email or username) → 200  
`PUT /me` body: multipart/form-data with optional `avatar` file  
`GET /search/:query` params: `page` (default 1), `size` (default 10) → `{ isNext, users[] }`

### 7.2 Room Endpoints

| Method | Endpoint                                       | Auth | Description                  |
| ------ | ---------------------------------------------- | ---- | ---------------------------- |
| POST   | `/api/v1/room/:roomId`                         | Yes  | Create room                  |
| GET    | `/api/v1/room/single/:roomId?query=`           | Yes  | Get room (r/rwx/admin)       |
| GET    | `/api/v1/room/:roomId?password=`               | Yes  | Join room                    |
| PUT    | `/api/v1/room/:roomId`                         | Yes  | Update room (admin)          |
| DELETE | `/api/v1/room/:roomId`                         | Yes  | Delete room (admin)          |
| GET    | `/api/v1/room/all/:ownerId`                    | No   | List user's rooms            |
| GET    | `/api/v1/room/search/:query?page&size&ownerId` | No   | Search rooms                 |
| PUT    | `/api/v1/room/settings/:roomId`                | Yes  | Update password/lang (admin) |
| PUT    | `/api/v1/room/save/code/:roomId`               | Yes  | Save code                    |

**Notable request/response details:**

`POST /room/:roomId` body: `{ password, title }` → 201, returns roomId  
`GET /room/single/:roomId` query param `query` controls access level: `r` | `rwx` | `admin`  
`GET /room/search` → `{ isNext, rooms[] }`  
`PUT /room/settings` body: `{ password?, lang? }` (at least one required)  
`PUT /room/save/code` body: `{ code }` — user must be in activeUsers

### 7.3 Discussion Endpoints

| Method | Endpoint                     | Auth | Description      |
| ------ | ---------------------------- | ---- | ---------------- |
| GET    | `/api/v1/discussion/:roomId` | Yes  | Get chat history |
| PUT    | `/api/v1/discussion/:roomId` | Yes  | Add message      |

`PUT /discussion` body: `{ chat: [{ message, sender }] }`

### 7.4 Health Check

`GET /api/v1/check-health` → `"Server is working..."`

---

## 8. WebSocket Events

### 8.1 Connection

```javascript
{ cors: { origin: FRONTEND_URI, credentials: true } }
// Auto-reconnect: exponential backoff, 3 max attempts
```

### 8.2 Event Reference

```typescript
const ev = {
  // Backend emits
  "b:join": ...,        // User joined room (to room, except sender)
  "b:code_change": ..., // Code updated (to room, except sender)
  "b:code_load": ...,   // Code snapshot (to specific socket)
  "b:code_req": ...,    // Request code from others (to room)
  "b:lang_change": ..., // Language changed (to room)
  "b:message": ...,     // New chat message (to room)
  "b:chat_load": ...,   // Chat history (to specific socket)
  "b:chat_req": ...,    // Request chat from others (to room)
  "b:leave": ...,       // User left

  // Frontend emits
  "f:join": ...,        "f:leave": ...,
  "f:code_change": ..., "f:code_req": ...,   "f:code_load": ...,
  "f:lang_change": ...,
  "f:message": ...,     "f:chat_req": ...,   "f:chat_load": ...,
};
```

### 8.3 Event Payloads

**`f:join`** → `{ roomId, userId }` → backend joins socket to room, emits `b:join` to others with `{ socketId, message: "username Joined" }`

**`f:code_change`** → `{ roomId, code }` → backend broadcasts `b:code_change: { code }` to room excluding sender (NOT saved immediately)

**Code load (new joiner):**

1. New user emits `f:code_req: { roomId }`
2. Backend sends `b:code_req: { socketId }` to room
3. Existing user emits `f:code_load` targeting new socket → receives `b:code_load: { code }`

**`f:lang_change`** → `{ roomId, lang }` → backend broadcasts to entire room (including sender)

**`f:message`** → `{ roomId, message, sender }` → validated (1-100 chars), saved to DB, broadcast as `b:message: { sender: { _id, username, avatar }, message }`

**Chat history sync:** Same peer-to-peer pattern as code load (`f:chat_req` → `b:chat_req` → `f:chat_load` → `b:chat_load`)

### 8.4 Server-Side Store

```javascript
const roomSocketUser = {
  "room-uuid": {
    "socket-id-1": "user-id-1",
    "socket-id-2": "user-id-2",
  },
};
// Maps room → socket → user for active presence tracking
```

---

## 9. UI/UX Components

### 9.1 Routes

**Public:** `/`, `/about`, `/contact`, `/search`, `/terms-conditions`, `/privacy-policy`, `*` (404)

**Auth:** `/auth/signin`, `/auth/signup`, `/password/forget`, `/password/reset/:token`, `/user/verify`

**Protected:** `/room/create`, `/room/join`, `/room/:roomId`, `/room/:roomId/about`, `/user/:userId`, `/user/:userId/edit`, `/password/change`, `/user/:userId/danger`

### 9.2 Key Component: Playground Layout

```
┌──────────────────────────────────────┐
│         Room Header/Info              │
├─────────────┬──────────────┬─────────┤
│  Language  │  Settings     │  Users  │
│  Selector  │  Button       │ Online  │
├──────────────────────────────────────┤
│          Code Editor (Ace)            │
├─────────────────────┬────────────────┤
│  Run Code / Save    │  Output Panel  │
├─────────────────────┴────────────────┤
│  Chat Panel / Discussion Tab          │
└──────────────────────────────────────┘
```

### 9.3 Design Tokens

- **Colors:** Success #10b981, Error #ef4444, Warning #f59e0b, Info #3b82f6
- **Animations:** 300ms ease-in-out (Framer Motion for complex)
- **Breakpoints:** Mobile 320–640px, Tablet 641–1024px, Desktop 1025px+
- **Touch targets:** 48px minimum

---

## 10. Security Requirements

### 10.1 Auth & Session

- Passwords: bcryptjs, salt rounds 12, min 8 / max 100 chars
- JWT: 7 days validity, httpOnly + Secure + SameSite=Strict cookie
- Roles: Admin (modify settings), Participant (code + chat), Guest (read-only)

### 10.2 Data Protection

- HTTPS/TLS 1.2+ in production (Helmet.js headers)
- Avatar uploads: file type + size validation; Cloudinary storage; max 5MB
- Passwords hashed, never stored plaintext

### 10.3 Input Validation

- Frontend: Zod schema validation
- Backend: Zod runtime + Mongoose validators + regex for email/UUID
- XSS: HTML escaping + Content Security Policy
- NoSQL injection: Mongoose parameterized queries + Zod input checks

### 10.4 API Security

```javascript
corsOptions: { origin: true, credentials: true, methods: ["GET","POST","DELETE","PUT"] }
```

- Rate limit: 100 req/min general; 5 req/min auth endpoints
- Security headers via Helmet.js

### 10.5 Secrets Management

- All keys in `.env` (never logged or committed)
- Rotation: every 90 days recommended
- MongoDB Atlas: IP whitelisting + role-based DB permissions
- Backups: encrypted at rest, 30-day retention

---

## 11. Use Cases

### 11.1 Actors

| Actor       | Description                  |
| ----------- | ---------------------------- |
| Guest       | Non-authenticated visitor    |
| User        | Registered and authenticated |
| Admin       | Room owner                   |
| Participant | User in a room (non-admin)   |

### 11.2 UC-01: User Registration

**Precondition:** User not registered  
**Flow:** Fill form → System validates → Check uniqueness → Hash password → Create user (verified=false) → Send verification email → Issue JWT cookie  
**Alt:** Invalid input → error; duplicate email/username → error; email send failure → retry prompt

### 11.3 UC-02: Create and Join Room

**Precondition:** User authenticated  
**Create flow:** System generates UUID → User submits name/password/language → System creates room + discussion → Redirects to playground  
**Join flow:** User enters room ID → Views preview → Submits password → System validates → Adds to participants/activeUsers → Loads code + chat

### 11.4 UC-03: Real-time Code Editing

**Precondition:** Multiple users in same room  
**Flow:** User A types → `f:code_change` → backend broadcasts → User B/C update editors  
**New joiner flow:** User C joins → requests code via `f:code_req` → User A sends snapshot → C's editor loads current state

### 11.5 UC-04: Execute Code

**Flow:** Collect code + lang → Base64 encode → Submit to Judge0 → Get token → Poll every 2s (max 30s) → Display stdout/stderr/metrics  
**Errors:** API unavailable → retry; timeout → timeout message; compile error → show details

### 11.6 UC-05: Room Chat

**Flow:** User types (1–100 chars) → `f:message` → backend validates + saves to Discussion → broadcasts `b:message` to room → all users see message with sender info

---

## 12. Testing Strategy

### 12.1 Testing Levels

| Level       | Framework          | Scope                                                   |
| ----------- | ------------------ | ------------------------------------------------------- |
| Unit        | Vitest             | Utilities, custom hooks, data transforms; 70%+ coverage |
| Integration | Vitest + Supertest | API endpoints, DB operations                            |
| E2E         | Playwright/Cypress | Full user workflows (optional)                          |
| Performance | JMeter / K6        | 100+ concurrent users, < 200ms p95                      |

### 12.2 Key Test Cases

**User Registration:** valid → user created; duplicate email/username → rejected; invalid email → rejected; verification email sent  
**Room Creation:** valid → room + discussion created; invalid UUID → rejected; unauthenticated → rejected  
**Code Execution:** valid submission → Judge0 called; invalid language → rejected; timeout → handled gracefully  
**Frontend (Playground):** editor renders; code updates on receive; language change updates highlighting; run button submits; output displays  
**Frontend (Chat):** messages render in order; auto-scroll; sender info shows; input validates

### 12.3 CI/CD Pipeline

On push to `main`: Lint → Unit Tests → Integration Tests → Build Check → Deploy (on pass)

---

## 13. Deployment Requirements

### 13.1 Environments

**Development:** local servers, hot reload, debug logging  
**Staging:** production-like, load + security testing  
**Production:** Netlify (frontend) + Render (backend) + MongoDB Atlas + Cloudinary CDN

### 13.2 Frontend (Netlify)

```bash
Build command: cd frontend && npm install && npm run build
Publish dir:   frontend/dist
```

Env vars: `VITE_SERVER_URI`, `VITE_TINYMCE_API_SECRET`, `VITE_JUDGE_CE_API_KEY`, `VITE_JUDGE_CE_HOST`, `VITE_JUDGE_CE_BASE_URL`

Auto-deploy on `main` push; CDN included; auto-rollback on failure.

### 13.3 Backend (Render)

```bash
Build: cd backend && npm install && npm run build
Start: cd backend && npm run start
```

Env vars: `NODE_ENV`, `PORT`, `JWT_SECRET`, `MONGO_URI`, `CLOUDINARY_NAME/API_KEY/API_SECRET`, `FRONTEND_URI`, `SMTP_MAIL/PASS/HOST`

### 13.4 Database (MongoDB Atlas)

1. Create cluster (M0 free tier for dev)
2. Add user with read/write permissions
3. Whitelist IPs
4. Enable connection pooling + daily backups
5. Replica set (3-node) recommended for production

### 13.5 Monitoring

- Uptime: Uptimerobot / Pingdom
- Errors: Sentry / Bugsnag
- Performance: New Relic / DataDog
- Logs: LogRocket
- DB: MongoDB Atlas native tools

### 13.6 Backup Strategy

- Frequency: Daily | Retention: 30 days | Storage: MongoDB Atlas + S3
- Monthly backup restore test

---

## 14. Future Enhancements

**Features:** Multi-file projects, Git integration, AI code suggestions, team permissions, video conferencing, mobile app (React Native), collaborative debugging, code snippets library

**Infrastructure:** GraphQL support, WebRTC P2P, Kubernetes, Redis caching, database sharding, multi-region deployment

**Community:** Public snippets, leaderboards, achievement badges, code review system, live coding sessions

---

## Appendix

### A. Environment Templates

**Backend `.env`:**

```bash
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/devunity
JWT_SECRET=your-random-32-character-secret-key-here
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_MAIL=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
FRONTEND_URI=http://localhost:5173
```

**Frontend `.env`:**

```bash
VITE_SERVER_URI=http://localhost:4000
VITE_TINYMCE_API_SECRET=your-tinymce-api-key
VITE_JUDGE_CE_API_KEY=your-rapidapi-key
VITE_JUDGE_CE_HOST=judge0-ce.p.rapidapi.com
VITE_JUDGE_CE_BASE_URL=https://judge0-ce.p.rapidapi.com
```

### B. API Response Format

```typescript
interface DevUnityResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
  error?: { code: string; message: string; details?: Record<string, any> };
}
```

### C. Security Checklist

- [ ] HTTPS enabled in production
- [ ] JWT secrets configured
- [ ] bcryptjs password hashing
- [ ] Input validation on all endpoints
- [ ] NoSQL injection prevention (Mongoose + Zod)
- [ ] XSS protection (CSP)
- [ ] CORS configured
- [ ] Rate limiting implemented
- [ ] Helmet.js security headers
- [ ] Database credentials secured
- [ ] API keys in env, never logged
- [ ] Dependencies regularly updated
- [ ] Backup strategy in place
- [ ] Error logging without sensitive data
