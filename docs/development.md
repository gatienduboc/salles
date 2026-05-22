# Développement local

## Prérequis

- Node.js 22+
- MariaDB 10.11+ (ou `docker compose up -d db`)

## Configuration

Copier `.env.example` vers `.env`. Pour le backend en local :

```env
DB_HOST=localhost
MYSQL_DATABASE=salles
MYSQL_DATABASE_TEST=salles_test
```

Créer les bases :

```sql
CREATE DATABASE salles CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE salles_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL ON salles.* TO 'salles'@'%';
GRANT ALL ON salles_test.* TO 'salles'@'%';
```

## Backend

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev        # port 3000
npm test
```

## Frontend

```bash
cd frontend
npm install
npm run dev        # port 5173, proxy /api → :3000
npm test
```

## Compte démo (seed)

- Email : `demo@salles.local`
- Mot de passe : `password123`
