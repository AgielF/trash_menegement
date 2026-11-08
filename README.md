# Bersihku — Sistem Informasi & Operasional Pemungutan Sampah

> **Status:** MVP Selesai (Fase Pengembangan Lanjutan)  
> **Pendekatan Arsitektur:** Local-First PWA (Offline-Capable) & Modular Monolith

**Bersihku** adalah aplikasi web progresif (*Progressive Web App* / PWA) terintegrasi yang dirancang untuk mendigitalkan, mempermudah, dan mencatat operasional harian pemungutan sampah serta penarikan iuran warga. 

Aplikasi ini mengusung pendekatan **Local-First**, memungkinkan petugas di lapangan tetap bekerja lancar mencatat penarikan karung dan pembayaran iuran tanpa hambatan meski berada di lokasi dengan sinyal internet lemah atau tanpa koneksi sama sekali (*zero-signal*). Data tersimpan aman di perangkat lokal dan secara otomatis disinkronisasikan ke peladen pusat saat kembali terhubung secara online.

---

## Daftar Isi

1. [Fitur Utama (F1 – F16)](#1-fitur-utama-f1--f16)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Prasyarat Sistem](#4-prasyarat-sistem)
5. [Instalasi & Menjalankan Aplikasi](#5-instalasi--menjalankan-aplikasi)
   - [Opsi A: Menjalankan Otomatis (Rekomendasi)](#opsi-a-menjalankan-secara-otomatis-rekomendasi)
   - [Opsi B: Menjalankan Manual per Service](#opsi-b-menjalankan-secara-manual)
   - [Cara Mematikan Service](#cara-mematikan-service)
6. [Database Setup & Kolaborasi Tim](#6-database-setup--kolaborasi-tim)
7. [Akun Default untuk Pengujian](#7-akun-default-untuk-pengujian)
8. [Dokumentasi Teknis Pendukung](#8-dokumentasi-teknis-pendukung)
9. [Status & Lisensi](#9-status--lisensi)

---

## 1. Fitur Utama (F1 – F16)

Aplikasi Bersihku dirancang berdasarkan analisis proses bisnis komprehensif yang mencakup 16 modul fitur inti:

| Kode | Nama Fitur | Kategori | Deskripsi Ringkas |
| :--- | :--- | :--- | :--- |
| **F1** | Registrasi Akun | Autentikasi | Pendaftaran akun petugas baru dengan status verifikasi `pending`. |
| **F2** | Login & Sesi | Autentikasi | Autentikasi aman berbasis JWT dengan otorisasi berbasis peran (*RBAC*). |
| **F3** | Lupa Password | Autentikasi | Mekanisme pemulihan akses akun *(direncanakan untuk fase berikutnya)*. |
| **F4** | Beranda & Ringkasan | Operasional | Dashboard ringkasan progres rumah, total karung, dan rekap penerimaan uang harian. |
| **F5** | Mulai Ambil Sampah | Operasional | Inisiasi sesi harian yang otomatis menghitung jadwal jatuh tempo dan akumulasi hari sebelumnya. |
| **F6** | Daftar Rumah & Pencarian | Operasional | Pencarian cepat, filter rute, dan katalog rumah binaan per wilayah tugas. |
| **F7** | Catat Pengambilan & Bayar | Finansial | Pencatatan status ambil/karung serta opsi bayar penuh, sebagian, atau kasbon. |
| **F8** | Lewati Rumah (Skip) | Operasional | Pencatatan alasan lewati pengambilan secara wajib (mis. rumah kosong/gerbang digembok). |
| **F9** | Manajemen Data Rumah | Master Data | Penambahan, pembaruan identitas warga, nomor rumah, RT/RW, dan nominal default. |
| **F10** | Import Data Rumah & Jadwal | Administrasi | Unggah massal data rumah warga dan jadwal penarikan via lembar kerja Excel (.xlsx). |
| **F11** | Persetujuan Admin (Approval)| Administrasi | Panel persetujuan (*approve*) atau penolakan (*reject*) pendaftaran akun petugas baru. |
| **F12** | Sinkronisasi Offline | Local-First | Penyimpanan offline via Dexie.js (IndexedDB) dan sinkronisasi otomatis via background sync. |
| **F13** | Pelunasan Kasbon | Finansial | Pelunasan fleksibel atau cicilan sisa kasbon tunggakan rumah tangga. |
| **F14** | Rekap Uang & Kas | Finansial | Rekapitulasi perputaran kas, setoran penarikan, dan pencocokan nominal harian. |
| **F15** | Pemindahan Rumah | Administrasi | Realokasi penugasan rumah tangga binaan antar petugas pengambil sampah. |
| **F16** | Pengaturan Batas Kasbon | Administrasi | Konfigurasi batas toleransi plafon kasbon/tunggakan per rumah tangga oleh Admin. |

---

## 2. Tech Stack

Proyek ini dibangun menggunakan teknologi modern dengan penekanan pada stabilitas, performa, dan interoperabilitas offline:

### Frontend
- **Framework & Core:** React 19, TypeScript, Vite
- **PWA & Local Storage:** Service Worker, Workbox, Dexie.js (IndexedDB wrapper)
- **State Management & Routing:** Zustand, React Router DOM v7
- **Styling & Komponen:** Tailwind CSS v4, Lucide React Icons
- **Validasi & HTTP Client:** Zod, Axios

### Backend
- **Framework:** NestJS (Node.js)
- **Database ORM:** Prisma ORM
- **Database Server:** PostgreSQL 15
- **Keamanan & Validasi:** Passport.js, JWT, Bcrypt, Helmet, NestJS Throttler, Class-Validator
- **Pengolah Berkas:** Multer, XLSX (Excel Parser)

### DevOps & Pengujian
- **Containerization:** Docker & Docker Compose
- **Testing:** Vitest, Playwright (E2E), Jest, Testing Library
- **Quality Assurance:** ESLint, Prettier, Husky, Commitlint

---

## 3. Arsitektur Sistem

Sistem Bersihku menerapkan perpaduan pola arsitektur **Local-First** pada sisi antarmuka dan **Modular Monolith** pada sisi server:

1. **Client Layer (Feature-First Architecture):**  
   Struktur kode frontend diorganisir berdasarkan domain fitur (`features/pickups`, `features/payment`, `features/admin`, `features/auth`). Komponen membaca dan menulis status terlebih dahulu ke IndexedDB lokal melalui Dexie.js, sehingga UI bersifat instan (*zero-latency*).
2. **Server Layer (Modular Monolith):**  
   Backend terisolasi ke dalam modul domain mandiri (`AuthModule`, `HousesModule`, `PickupsModule`, `PaymentsModule`, `AdminModule`, `SyncModule`) yang berkomunikasi melalui *service interface* terstandarisasi.
3. **Data Integrity & Conflict Resolution:**  
   Pencatatan pembayaran bersifat *append-only* dengan penandaan audit. Transaksi offline dilengkapi *idempotency key* berbasis UUIDv4 untuk mencegah duplikasi data saat proses sinkronisasi ganda.

> 📖 **Pelajari Lebih Lanjut:** Baca spesifikasi lengkap dan diagram makro arsitektur pada berkas [architecture.md](architecture.md).

---

## 4. Prasyarat Sistem

Sebelum memulai instalasi, pastikan perangkat pengembangan Anda telah terpasang perangkat lunak berikut:

- **Node.js:** Versi `>= 20.19.0` (disarankan versi LTS)
- **NPM:** Versi `>= 10.x`
- **Docker Engine & Docker Compose:** Versi terbaru untuk menjalankan PostgreSQL lokal
- **Git:** Versi terbaru

---

## 5. Instalasi & Menjalankan Aplikasi

### Langkah Awal: Clone Repository & Dependensi

1. Clone repositori ke mesin lokal Anda:
   ```bash
   git clone <URL_REPOSITORY_BERSIHKU>
   cd bersihku-app
   ```

2. Pasang dependensi pada backend dan frontend:
   ```bash
   # Pasang dependensi Backend
   cd backend
   npm install

   # Pasang dependensi Frontend
   cd ../frontend
   npm install

   # Kembali ke root folder
   cd ..
   ```

3. Konfigurasi Environment Variable:
   - **Backend:** Pastikan berkas `backend/.env` tersedia dan terisi:
     ```env
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bersihku_db?schema=public"
     JWT_SECRET="super-secret-key-bersihku-2026"
     ```
   - **Frontend:** Salin contoh template environment di folder `frontend`:
     ```bash
     cp frontend/.env.example frontend/.env
     ```

---

### Opsi A: Menjalankan Secara Otomatis (Rekomendasi)

Proyek ini telah menyediakan shell script terpadu untuk menyalakan database, backend, dan frontend sekaligus:

```bash
# Pastikan skrip memiliki izin eksekusi (jika di Linux/macOS)
chmod +x start-all.sh stop-all.sh

# Jalankan seluruh service
./start-all.sh
```

Skrip ini akan:
1. Menyalakan container PostgreSQL via Docker Compose.
2. Menjalankan NestJS di latar belakang (Port `3000`).
3. Menjalankan Vite Dev Server di latar belakang (Port `5173`).

Akses aplikasi melalui peramban:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **Log Service:** Output tercatat di `backend.log` dan `frontend.log`.

---

### Opsi B: Menjalankan Secara Manual

Bila Anda ingin memantau log terminal secara langsung pada jendela terpisah:

1. **Jalankan Database Docker:**
   ```bash
   docker compose up -d
   ```

2. **Jalankan Backend (Terminal 1):**
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Jalankan Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

---

### Cara Mematikan Service

Untuk menghentikan seluruh layanan (backend, frontend, dan database Docker) secara bersih, jalankan:

```bash
./stop-all.sh
```

---

## 6. Database Setup & Kolaborasi Tim

Gunakan perintah-perintah berikut di dalam direktori `backend` untuk mengelola skema basis data dan pengisian data contoh:

### 1. Migrasi Skema Basis Data
Menerapkan skema Prisma ke database PostgreSQL:
```bash
cd backend
npx prisma migrate dev
```

### 2. Mengisi Data Dummy (Seeder)
Mengisi database dengan akun admin, petugas, puluhan rumah warga, jadwal, serta riwayat tagihan:
```bash
cd backend
npm run db:seed
```
> [!NOTE]
> Perintah seeder bersifat *idempotent* dan aman dijalankan berulang kali tanpa memicu duplikasi data identik.

### 3. Reset Database (⚠️ Perhatian)
Jika Anda ingin mengembalikan kondisi database ke posisi awal yang bersih:
```bash
cd backend
npm run db:reset
```
> [!CAUTION]
> Perintah ini akan menghapus seluruh data transaksi yang telah dibuat di database lokal dan mengisinya kembali dengan data standar seeder.

---

## 7. Akun Default untuk Pengujian

Gunakan kredensial berikut untuk melakukan pengujian alur kerja aplikasi di lingkungan lokal:

| Peran (Role) | Email | Password | Akses & Wewenang |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@bersihku.com` | `admin123` | Akses panel `/admin`, persetujuan petugas, manajemen rumah, impor Excel, pengaturan plafon kasbon. |
| **Petugas Lapangan** | `agiel@example.com` | `password123` | Akses beranda penarikan sampah, pencatatan karung, pembayaran iuran, pelunasan kasbon, mode offline. |

---

## 8. Dokumentasi Teknis Pendukung

Proyek ini dilengkapi dokumentasi arsitektural dan laporan audit teknis yang komprehensif:

- 📐 [architecture.md](architecture.md) — Dokumen arsitektur makro, pembagian layer, dan alur sinkronisasi data.
- 🗄️ [erd-final.md](erd-final.md) — Rancangan *Entity Relationship Diagram* (ERD) dan struktur tabel basis data lengkap.
- 📋 [planning-aplikasi-sampah.md](planning-aplikasi-sampah.md) — Dokumen spesifikasi bisnis proses, wireflow, dan aturan domain (F1–F16).
- 🧪 [laporan-testing-e2e.md](laporan-testing-e2e.md) — Laporan pengujian integrasi End-to-End API backend (31/31 skenario lulus).
- 🛡️ [laporan-audit-keamanan.md](laporan-audit-keamanan.md) — Hasil audit pengerasan keamanan (Role-Based Access Control, Sanitasi Input, dan Throttling).

---

## 9. Status & Lisensi

- **Status Pengembangan:** `MVP Selesai (Fase Pengembangan Lanjutan)`
- **Hak Cipta:** Tim PKM Bersihku. Seluruh hak cipta dilindungi undang-undang.
