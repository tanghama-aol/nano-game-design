#!/bin/bash

# Exit on error
set -e

echo "=========================================="
echo "🚀 Nano Game Asset Generator Setup & Run "
echo "=========================================="

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm globally..."
    npm install -g pnpm
fi

echo "📦 1. Installing dependencies..."
pnpm install

echo "🛠️  2. Building shared types and configs..."
pnpm build

echo "🗄️  3. Syncing SQLite database via Prisma..."
pnpm db:push

echo "✨ 4. Starting development servers (Vite + Express)..."
echo "Frontend will be available at http://localhost:5173"
echo "Backend will be available at http://localhost:3001"
echo "=========================================="
pnpm dev
