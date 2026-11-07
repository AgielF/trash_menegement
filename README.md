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

## Database Setup (Untuk Tim)

Siapkan database dan isi data dummy tim (admin, petugas, rumah, dan tagihan) dengan menjalankan perintah berikut dari folder root repository:

```bash
cd backend
npx prisma migrate dev
npm run db:seed
```

Seeder dapat dijalankan berulang kali. Akun default: `admin@bersihku.com` (password `admin123`) dan `agiel@example.com` (password `password123`).

## Reset Database (⚠️ Hapus Data)

Untuk mengembalikan database ke kondisi awal setelah seeder, jalankan perintah berikut dari folder root repository:

```bash
cd backend
npm run db:reset
```

**⚠️ Perintah ini menghapus semua data transaksi yang ada (termasuk rumah baru dan pembayaran) dan mengembalikannya hanya ke data dummy dari seeder.**
