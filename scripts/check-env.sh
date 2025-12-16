#!/bin/bash

# Script para verificar se o ambiente está configurado corretamente

echo "🔍 Verificando ambiente..."
echo ""

# Verifica Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js instalado: $NODE_VERSION"

    # Verifica se é versão 18+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "⚠️  Node.js 18+ recomendado. Versão atual: $NODE_VERSION"
    fi
else
    echo "❌ Node.js não encontrado. Instale Node.js 18+"
    exit 1
fi

# Verifica npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm instalado: $NPM_VERSION"
else
    echo "❌ npm não encontrado"
    exit 1
fi

# Verifica Docker (opcional)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker -v)
    echo "✅ Docker instalado: $DOCKER_VERSION"
else
    echo "⚠️  Docker não encontrado (opcional, mas recomendado)"
fi

# Verifica Docker Compose (opcional)
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose -v)
    echo "✅ Docker Compose instalado: $COMPOSE_VERSION"
else
    echo "⚠️  Docker Compose não encontrado (opcional, mas recomendado)"
fi

echo ""
echo "🔍 Verificando dependências..."

# Verifica dependências do backend
if [ -d "backend/node_modules" ]; then
    echo "✅ Dependências do backend instaladas"
else
    echo "⚠️  Dependências do backend não instaladas. Execute: cd backend && npm install"
fi

# Verifica dependências do frontend
if [ -d "frontend/node_modules" ]; then
    echo "✅ Dependências do frontend instaladas"
else
    echo "⚠️  Dependências do frontend não instaladas. Execute: cd frontend && npm install"
fi

# Verifica arquivos .env
echo ""
echo "🔍 Verificando arquivos de configuração..."

if [ -f "backend/.env" ]; then
    echo "✅ backend/.env configurado"
else
    echo "⚠️  backend/.env não encontrado (opcional). Copie de backend/.env.example"
fi

if [ -f "frontend/.env" ]; then
    echo "✅ frontend/.env configurado"
else
    echo "⚠️  frontend/.env não encontrado (opcional). Copie de frontend/.env.example"
fi

if [ -f ".env" ]; then
    echo "✅ .env (root) configurado"
else
    echo "⚠️  .env (root) não encontrado (opcional para Docker). Copie de .env.example"
fi

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "Para iniciar a aplicação:"
echo "  Desenvolvimento: make dev (ou npm run dev em backend/ e frontend/)"
echo "  Docker:          docker-compose up"
