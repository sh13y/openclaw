#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# OpenClaw Startup Script (Node.js)
# ─────────────────────────────────────────────────────────────────

echo ""
echo "  🦀 OpenClaw — AI Crypto Wallet Scanner"
echo "  ───────────────────────────────────────"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "  ❌ Node.js not found. Install from nodejs.org"
    exit 1
fi

# Check .env
if [ ! -f "backend/.env" ]; then
    echo "  ⚠  No .env found. Creating from template..."
    cp backend/.env.example backend/.env
    echo ""
    echo "  👉 IMPORTANT: Edit backend/.env and add your API keys"
    echo "     - GROQ_API_KEY: Free at https://console.groq.com"
    echo "     - BSCSCAN_API_KEY: Free at https://bscscan.com/apis"
    echo ""
fi

# Install dependencies
echo "  📦 Installing dependencies..."
cd backend
npm install --silent

PORT=${PORT:-3001}
echo "  🚀 Starting server on http://localhost:$PORT"
echo "  ✋ Press Ctrl+C to stop"
echo ""

# Start server
npm start
