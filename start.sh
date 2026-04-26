#!/bin/bash
# NotifyHub — Full Setup & Start Script
# 
# OPTION A (Recommended): Docker for PostgreSQL + Redis
#   1. Open Docker Desktop
#   2. Run this script
#
# OPTION B: Use existing PostgreSQL + install Redis separately
#   - PostgreSQL 18 detected on this machine
#   - Replace POSTGRES_PASSWORD below with your postgres superuser password
#   - Install Redis: brew install redis && brew services start redis

set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo ""
echo "🔔 NotifyHub — Starting Services"
echo "================================="
echo ""

# ── Detect stack availability ──────────────────────────────────
DOCKER_CMD=""
for p in "docker" "/Applications/Docker.app/Contents/Resources/bin/docker" "$HOME/.docker/bin/docker"; do
  if command -v "$p" &>/dev/null || [ -x "$p" ]; then
    DOCKER_CMD="$p"
    break
  fi
done

PGBIN="/Library/PostgreSQL/18/bin"
HAS_PG18=$( [ -x "$PGBIN/psql" ] && echo "yes" || echo "no" )

if [ -n "$DOCKER_CMD" ]; then
  echo "🐳 Docker found — starting PostgreSQL + Redis via Docker Compose..."
  cd "$ROOT"
  "$DOCKER_CMD" compose up -d
  echo "⏳ Waiting 6s for containers to be healthy..."
  sleep 6
elif [ "$HAS_PG18" = "yes" ]; then
  echo "🐘 PostgreSQL 18 found (native install)"
  echo "⚠️  Redis is required for BullMQ. Install with: brew install redis && brew services start redis"
  echo ""
  echo "🗄️  Setting up database (needs your postgres password)..."
  read -r -s -p "Enter your PostgreSQL 'postgres' user password: " POSTGRES_PASS
  echo ""
  export PGPASSWORD="$POSTGRES_PASS"
  "$PGBIN/psql" -h 127.0.0.1 -U postgres -d postgres \
    -c "CREATE USER notif_user WITH PASSWORD 'notif_pass';" 2>&1 | grep -v "already exists" || true
  "$PGBIN/psql" -h 127.0.0.1 -U postgres -d postgres \
    -c "CREATE DATABASE notification_db OWNER notif_user;" 2>&1 | grep -v "already exists" || true
  echo "✅ Database ready"
else
  echo "❌ Neither Docker nor PostgreSQL 18 found."
  echo "   Please install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

# ── Backend: Prisma migrate + seed + start ──────────────────────
echo ""
echo "🗄️  Running Prisma migrations..."
cd "$BACKEND"
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npx prisma migrate dev --name init --skip-generate 2>&1 | tail -5
npx prisma generate 2>&1 | tail -3
echo "🌱 Seeding demo data..."
node prisma/seed.js

echo ""
echo "🚀 Starting backend (port 4000) and frontend (port 3000)..."

cd "$BACKEND" && npm run dev &
BACKEND_PID=$!

cd "$FRONTEND" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ NotifyHub is running!"
echo "  Frontend → http://localhost:3000"
echo "  Backend  → http://localhost:4000/api/health"
echo ""
echo "  Demo login:"
echo "    alice@example.com / demo1234"
echo "    bob@example.com   / demo1234"
echo "═══════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop all services."

cleanup() {
  echo ""
  echo "Stopping services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  if [ -n "$DOCKER_CMD" ]; then
    "$DOCKER_CMD" compose stop
  fi
  echo "Done."
}
trap cleanup INT TERM
wait
