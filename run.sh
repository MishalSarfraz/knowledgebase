#!/bin/bash
set -e

echo "=========================================================="
echo "          INTERNAL KNOWLEDGE BASE BOOTSTRAPPER"
echo "=========================================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js was not found."
    echo "Please install Node.js (v18 or higher) from: https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
    echo "[SUCCESS] Dependencies installed."
fi

echo "[INFO] Applying database migrations..."
npx prisma migrate deploy 2>/dev/null || {
    echo "[INFO] No migrations found. Running db push..."
    npx prisma db push
}
echo "[SUCCESS] Database ready."
echo ""

echo "=========================================================="
echo "  Starting development server..."
echo "  URL: http://localhost:3000"
echo "  Press Ctrl+C to stop."
echo "=========================================================="
npm run dev
