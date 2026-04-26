# NotifyHub — Full-Stack Notification System

A production-ready notification platform built with **Node.js/Express**, **Next.js 14**, **PostgreSQL**, **BullMQ + Redis**, **Socket.IO**, **Nodemailer**, and **Twilio**.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Notification CRUD** | Create, list (with filters), mark as read, delete, unread count |
| **Email** | Nodemailer/SMTP integration — graceful simulation if unconfigured |
| **SMS** | Twilio integration — graceful simulation if unconfigured |
| **Async Queue** | BullMQ + Redis with retry logic (3 attempts, exponential backoff) |
| **Template Engine** | CRUD templates, `{{variable}}` substitution, preview API |
| **Real-time** | Socket.IO WebSocket push — bell icon updates instantly |
| **Frontend** | Next.js 14 with notification center, history, settings, templates UI |
| **Auth** | JWT-based user authentication |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Start PostgreSQL & Redis

```bash
cd notification-system
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js     # Creates demo users + sample data
npm run dev             # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

### 4. Open the App

Navigate to **http://localhost:3000**

Click **"Use Demo Credentials"** to log in as:
- **Alice:** `alice@example.com` / `demo1234`
- **Bob:** `bob@example.com` / `demo1234`

---

## 🔧 Environment Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://notif_user:notif_pass@localhost:5432/notification_db` | PostgreSQL connection |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | `change_this_...` | JWT signing secret |
| `PORT` | `5000` | API server port |
| `SMTP_HOST` | (empty) | SMTP host — leave blank for email simulation |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | (empty) | SMTP username |
| `SMTP_PASS` | (empty) | SMTP password |
| `TWILIO_ACCOUNT_SID` | (empty) | Twilio SID — leave blank for SMS simulation |
| `TWILIO_AUTH_TOKEN` | (empty) | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | (empty) | Twilio from number |

> **Simulation Mode:** If SMTP/Twilio credentials are not set, email/SMS notifications are logged to the console instead of being sent. The rest of the system works fully.

### Frontend (`frontend/.env.local`)

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:5000` |

---

## 📡 API Reference

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, phone? }` | Register |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns JWT |

### Notifications

| Method | Endpoint | Query / Body | Description |
|---|---|---|---|
| GET | `/api/notifications` | `?type=&unread=true&from=&to=&page=&limit=` | List with filters |
| POST | `/api/notifications` | `{ type, title, message, templateId?, variables?, targetUserId? }` | Create & queue |
| GET | `/api/notifications/:id` | — | Get single |
| PATCH | `/api/notifications/:id/read` | — | Mark as read |
| PATCH | `/api/notifications/read-all` | — | Mark all as read |
| DELETE | `/api/notifications/:id` | — | Delete |
| GET | `/api/notifications/unread-count` | — | Get unread count |

### Templates

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/templates` | `?type=EMAIL\|SMS\|IN_APP` | List |
| POST | `/api/templates` | `{ name, type, body, subject? }` | Create |
| GET | `/api/templates/:id` | — | Get |
| PUT | `/api/templates/:id` | `{ name, type, body, subject? }` | Update |
| DELETE | `/api/templates/:id` | — | Delete |
| POST | `/api/templates/:id/preview` | `{ variables: {...} }` | Render preview |

### Users

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/users/me` | — | Get current user |
| PATCH | `/api/users/me/preferences` | `{ email, sms, inApp, phone }` | Update prefs |
| GET | `/api/users` | — | List all users |

### Queue (Admin)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/queue/status` | Email & SMS queue job counts |
| POST | `/api/queue/retry/:queue/:jobId` | Retry a failed job |

---

## 🏗️ Architecture

```
notification-system/
├── docker-compose.yml        # PostgreSQL + Redis
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # DB schema (User, Notification, Template, NotificationJob)
│   │   └── seed.js           # Demo data seed
│   └── src/
│       ├── index.js          # Express + Socket.IO entry
│       ├── config/           # DB, Redis, Logger
│       ├── queues/           # BullMQ email & SMS queues + workers
│       ├── services/         # emailService, smsService, templateService, notificationService
│       ├── controllers/      # auth, notification, template, user, queue controllers
│       ├── routes/           # Express routers
│       ├── middleware/       # JWT auth, error handler
│       └── socket/           # Socket.IO setup with JWT auth
└── frontend/
    └── src/
        ├── app/              # Next.js App Router pages
        ├── components/       # AppLayout, NotificationBell, Center, SendForm, TemplateModal
        ├── context/          # AuthContext, NotificationContext (Socket.IO)
        ├── lib/              # Axios API client
        └── types/            # TypeScript interfaces
```

### Queue Flow

```
POST /api/notifications
       │
       ▼
Create DB record (PENDING)
       │
       ├─── [EMAIL] → emailQueue.add() → BullMQ → emailWorker
       │                                               │
       │                                    emailService.send() → SMTP
       │                                               │
       │                                    Update DB: SENT / FAILED
       │
       └─── [SMS]   → smsQueue.add()  → BullMQ → smsWorker
                                                       │
                                            smsService.send() → Twilio
                                                       │
                                            Update DB: SENT / FAILED

       [IN_APP] → No queue, status = UNREAD immediately

ALL TYPES → Socket.IO → io.to(userId).emit('notification:new', ...)
```

---

## 🔌 WebSocket Events

| Event | Direction | Payload |
|---|---|---|
| `notification:new` | Server → Client | Full notification object |
| `notification:updated` | Server → Client | Updated notification object |
| `unread_count` | Server → Client | `number` |

Connect with JWT:
```js
const socket = io('http://localhost:5000', { auth: { token: 'YOUR_JWT' } });
socket.on('notification:new', (n) => console.log('New notification!', n));
```

---

## 📝 Template Variable Syntax

Use `{{variableName}}` in subject and body:

```
Subject: Welcome to NotifyHub, {{name}}! 🎉
Body:    Hi {{name}}, your account is ready. Your plan: {{plan}}.
```

Preview endpoint renders with sample values:
```json
POST /api/templates/:id/preview
{ "variables": { "name": "Alice", "plan": "Pro" } }
```

---

## 🛠️ Useful Commands

```bash
# Backend
npm run db:studio     # Open Prisma Studio (DB browser at port 5555)
npm run db:seed       # Re-seed demo data

# Docker
docker-compose up -d           # Start services
docker-compose down            # Stop services
docker-compose down -v         # Stop and wipe volumes
```
