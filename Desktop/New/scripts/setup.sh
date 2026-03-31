#!/bin/bash

echo "🚀 FaceVoice AI Bot - Setup Script"
echo "=================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js topilmadi. Iltimos o'rnating: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ NPM: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Paketlar o'rnatilmoqda..."
npm install

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 .env fayli yaratilmoqda..."
    cp .env.example .env
    echo "⚠️  Iltimos .env faylini to'ldiring!"
fi

echo ""
echo "✅ Setup tugadi!"
echo ""
echo "Keyingi qadamlar:"
echo "1. .env faylini to'ldiring"
echo "2. Database yarating (DEPLOYMENT.md)"
echo "3. npm run dev - Botni ishga tushiring"
echo ""
