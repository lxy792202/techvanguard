#!/bin/bash
# TechVanguard — Quick Start Script
# Usage: bash start.sh

set -e

echo "🚀 TechVanguard — 前沿瞭望"
echo "=========================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Need Node.js (v18+)"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Need Python 3.10+"; exit 1; }

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt

# Copy .env if not exists
if [ ! -f ".env" ]; then
    cp ../.env.example .env
    echo "⚠️  Created .env from template — please set your DEEPSEEK_API_KEY"
fi

# Start backend
echo ""
echo "🔌 Starting backend on http://localhost:8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Start frontend
echo ""
echo "🌐 Starting frontend on http://localhost:3000..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ TechVanguard is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "   Press Ctrl+C to stop both servers"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
