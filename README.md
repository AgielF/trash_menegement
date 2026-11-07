# Kontz / Bersihku

Aplikasi pemungutan sampah — Local-First + Modular Monolith.

## Struktur

```
kontz-app/
├── docker-compose.yml   # PostgreSQL 15 untuk development
├── frontend/            # React TS + PWA + Dexie (menyusul)
└── backend/             # NestJS + Prisma + PostgreSQL
```

## Menjalankan Database

```bash
docker compose up -d
```

## Menjalankan Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```
