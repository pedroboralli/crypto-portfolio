.PHONY: help install dev build start stop clean logs

help: ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instala dependências (backend + frontend)
	@echo "Instalando dependências do backend..."
	cd backend && npm install
	@echo "Instalando dependências do frontend..."
	cd frontend && npm install
	@echo "✅ Dependências instaladas!"

dev: ## Inicia em modo desenvolvimento (requer 2 terminais)
	@echo "⚠️  Execute os comandos abaixo em terminais separados:"
	@echo "Terminal 1: make dev-backend"
	@echo "Terminal 2: make dev-frontend"

dev-backend: ## Inicia apenas o backend em dev
	cd backend && npm run dev

dev-frontend: ## Inicia apenas o frontend em dev
	cd frontend && npm run dev

build: ## Build com Docker Compose
	docker-compose build

start: ## Inicia aplicação com Docker Compose
	docker-compose up -d
	@echo "✅ Aplicação iniciada!"
	@echo "Frontend: http://localhost"
	@echo "Backend: http://localhost:3001"

stop: ## Para os containers
	docker-compose down

restart: stop start ## Reinicia os containers

logs: ## Mostra logs dos containers
	docker-compose logs -f

logs-backend: ## Mostra logs do backend
	docker-compose logs -f backend

logs-frontend: ## Mostra logs do frontend
	docker-compose logs -f frontend

clean: ## Remove containers, volumes e imagens
	docker-compose down -v
	docker-compose rm -f

health: ## Verifica status dos serviços
	@echo "Verificando backend..."
	@curl -s http://localhost:3001/health | jq . || echo "❌ Backend offline"
	@echo ""
	@echo "Verificando frontend..."
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost || echo "❌ Frontend offline"

ps: ## Lista containers em execução
	docker-compose ps

test-backend: ## Roda testes do backend (se houver)
	cd backend && npm test

test-frontend: ## Roda testes do frontend (se houver)
	cd frontend && npm test

format: ## Formata código (requer prettier)
	cd backend && npx prettier --write "src/**/*.js"
	cd frontend && npx prettier --write "src/**/*.{js,jsx}"
