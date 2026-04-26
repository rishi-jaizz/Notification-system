# NotifyHub — Quick Start Guide for This Machine

## Your environment
- ✅ PostgreSQL 18 — **Already installed and running**
- ❌ Redis — Not installed  
- ❌ Docker Desktop — Not installed

## Option A: Docker Compose (Cleanest, recommended)

Install Docker Desktop from https://www.docker.com/products/docker-desktop/

```bash
cd notification-system

# Start DB + Redis containers
docker compose up -d

# Install deps
cd backend && npm install
cd ../frontend && npm install

# Setup database
cd ../backend
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js

# Start both servers (2 terminals)
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

## Option B: Use existing PostgreSQL 18 + install Redis via Homebrew

```bash
# 1. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install and start Redis
brew install redis
brew services start redis

# 3. Set up database (replace YOUR_PG_PASSWORD with your postgres superuser password)
PGPASSWORD=YOUR_PG_PASSWORD /Library/PostgreSQL/18/bin/psql -h 127.0.0.1 -U postgres -d postgres <<SQL
CREATE USER notif_user WITH PASSWORD 'notif_pass';
CREATE DATABASE notification_db OWNER notif_user;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO notif_user;
SQL

# 4. Run migrations + seed
cd notification-system/backend
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js

# 5. Start servers (2 terminals)
npm run dev            # Terminal 1 (backend, port 4000)
cd ../frontend && npm run dev   # Terminal 2 (frontend, port 3000)
```

## Option C: Just run the backend+frontend without queue/email/SMS

If you just want to demo the IN_APP notification flow without Redis:

```bash
# The backend will crash trying to connect to Redis.
# You need Redis. Install via brew or Docker.
```

## Demo Credentials (after seeding)
- **Alice:** alice@example.com / demo1234 (8 sample notifications)
- **Bob:** bob@example.com / demo1234 (2 sample notifications)

## Ports
| Service | Port |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express) | http://localhost:4000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
