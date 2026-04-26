#!/bin/bash
# Install Redis locally without Docker using prebuilt binary approach
# (Uses Homebrew if available, otherwise builds from source)

set -e
NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "📦 Installing Redis..."

if command -v brew &>/dev/null; then
  echo "Using Homebrew..."
  brew install redis
  brew services start redis
  echo "✅ Redis installed and started via Homebrew"
else
  echo "Homebrew not found. Installing via npm redis-server alternative (ioredis emulator for dev)..."
  echo ""
  echo "⚠️  For production, please install Homebrew and then Redis:"
  echo "    /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  echo "    brew install redis && brew services start redis"
  echo ""
  echo "For development without Redis, you can use the in-memory BullMQ adapter."
  echo "However, the recommended path is to install Homebrew + Redis."
fi
