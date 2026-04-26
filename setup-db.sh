#!/bin/bash
# NotifyHub — Database Setup Script
# Run this ONCE with your PostgreSQL password before starting the app.
#
# Usage:
#   bash setup-db.sh
#   bash setup-db.sh mypassword        (if postgres user password is known)

set -e

NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

PGBIN="/Library/PostgreSQL/18/bin"
PGUSER="postgres"
PGPASSWORD="${1:-postgres}"       # Pass your postgres password as first arg
export PGPASSWORD

echo "🗄️  Setting up NotifyHub database..."

# Create user
$PGBIN/psql -h 127.0.0.1 -U $PGUSER -d postgres -c \
  "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'notif_user') THEN CREATE USER notif_user WITH PASSWORD 'notif_pass'; END IF; END \$\$;" 2>&1

# Create database
$PGBIN/psql -h 127.0.0.1 -U $PGUSER -d postgres -c \
  "CREATE DATABASE notification_db OWNER notif_user;" 2>&1 || true

$PGBIN/psql -h 127.0.0.1 -U $PGUSER -d postgres -c \
  "GRANT ALL PRIVILEGES ON DATABASE notification_db TO notif_user;" 2>&1

echo "✅ Database ready: notification_db (user: notif_user / pass: notif_pass)"

# Run Prisma migrations + seed
cd "$(dirname "$0")/backend"
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js

echo ""
echo "✅ Database setup complete! You can now run:"
echo "   cd backend && npm run dev"
echo "   cd frontend && npm run dev"
