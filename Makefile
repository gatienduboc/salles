.PHONY: dev dev-up dev-down dev-logs prod prod-up prod-down db test migrate seed

# --- Développement (volumes + hot reload) ---
dev-up:
	docker compose -f docker-compose.dev.yml up -d

dev:
	docker compose -f docker-compose.dev.yml up

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

# MariaDB seul (si vous lancez backend/frontend en npm local)
db:
	docker compose -f docker-compose.dev.yml up -d db

# --- Production (images buildées + Traefik) ---
prod-up:
	docker compose up -d --build

prod:
	docker compose up -d --build

prod-down:
	docker compose down

prod-logs:
	docker compose logs -f

# --- BDD / tests ---
migrate:
	cd backend && npm run migrate

seed:
	cd backend && npm run seed

seed-est:
	cd backend && npm run seed:est

geocode-est:
	cd backend && npm run geocode:est

test:
	cd backend && npm test
	cd frontend && npm test
