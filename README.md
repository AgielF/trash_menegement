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

## Database Seeding

Setelah database dan migrasi siap, jalankan perintah berikut dari folder root repository untuk mengisi data dummy tim (admin, petugas, rumah, dan tagihan):

```bash
cd backend
npx prisma migrate reset --force  # (Opsional) Hapus DB lama dan buat baru
npx prisma db seed                # Isi dengan data dummy tim
```

Seeder dapat dijalankan berulang kali. Akun default: `admin@bersihku.com` (password `admin123`) dan `agiel@example.com` (password `password123`).
