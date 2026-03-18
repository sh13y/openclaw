#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# OpenClaw Startup Script
# ─────────────────────────────────────────────────────────────────

echo ""
echo "  🦾 OpenClaw — Crypto AI Educator"
echo "  ─────────────────────────────────"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "  ❌ Python 3 not found. Install from python.org"
    exit 1
fi

# Check .env
if [ ! -f "backend/.env" ]; then
    echo "  ⚠  No .env found. Creating from template..."
    cp backend/.env.example backend/.env
    echo ""
    echo "  👉 IMPORTANT: Edit backend/.env and add your free Groq API key"
    echo "     Get one free at: https://console.groq.com"
    echo ""
fi

# Install dependencies
echo "  📦 Installing Python dependencies..."
cd backend
pip install -r requirements.txt -q 2>/dev/null || pip3 install -r requirements.txt -q

# Load .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs) 2>/dev/null
fi

PORT=${PORT:-8000}
echo "  🚀 Starting backend on http://localhost:$PORT"
echo "  📖 Open http://localhost:$PORT in your browser"
echo "  ✋ Press Ctrl+C to stop"
echo ""

# Start server
python3 -m uvicorn main:app --host 0.0.0.0 --port $PORT --reload
