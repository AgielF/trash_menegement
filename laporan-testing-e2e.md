# Laporan Testing E2E — Bersihku Backend

> Metode: HTTP request nyata via `curl` terhadap server NestJS + PostgreSQL lokal
> (port 3100, rate-limit dinaikkan sementara via `THROTTLE_LIMIT` agar tidak
> terblokir guard throttling; nilai produksi tetap default 10 req/menit/IP).
> Data uji: admin seed `admin@bersihku.com`, 2 petugas baru, 2 rumah, 1 rumah offline.
> Tanggal uji: 5 November 2026 (tanggal bisnis 2026-11-05, WIB).

**Rekap: 31/31 kasus lulus (0 gagal, 0 500-error).**

---

## Fase A — Auth & Admin (F1–F2)

| # | Fitur | Endpoint | HTTP | Ekspektasi vs Realita | Status |
|---|-------|----------|------|------------------------|--------|
| A1 | Register petugas 1 | `POST /auth/register` | 201 | ✅ 201, pesan menunggu persetujuan | ✅ Lulus |
| A2 | Register petugas 2 | `POST /auth/register` | 201 | ✅ 201 | ✅ Lulus |
| A3 | Login admin | `POST /auth/login` | 201 | ✅ 201, `access_token` + objek `user` **tanpa `password_hash`** | ✅ Lulus |
| A4 | Login user masih `pending` | `POST /auth/login` | 401 | ✅ 401 "Akun menunggu persetujuan admin" | ✅ Lulus |
| A5 | Daftar pending | `GET /admin/pending` | 200 | ✅ 200, 2 user (petugas 1 & 2) | ✅ Lulus |
| A6 | Approve petugas 1 | `PATCH /admin/approve/:id` | 200 | ✅ 200, status `approved` | ✅ Lulus |
| A7 | Approve petugas 2 | `PATCH /admin/approve/:id` | 200 | ✅ 200 | ✅ Lulus |
| A8 | **Collector** coba `GET /admin/settings` | `GET /admin/settings` | 403 | ✅ 403 Forbidden (RolesGuard aktif) | ✅ Lulus |

---

## Fase B — Houses & Pickups (F9, F5, F8, F11)

| # | Fitur | Endpoint | HTTP | Ekspektasi vs Realita | Status |
|---|-------|----------|------|------------------------|--------|
| B1 | Buat rumah 1 (fee 5000, interval 7, due hari ini) | `POST /houses` | 201 | ✅ 201 + uuid res | ✅ Lulus |
| B2 | Daftar rumah petugas | `GET /houses` | 200 | ✅ 200, hanya milik petugas 1 | ✅ Lulus |
| B3 | Start Day | `POST /pickups/start-day` | 201 | ✅ Sesi `in_progress`; 1 record `belum_diambil` fee 5000 due 2026-11-05 | ✅ Lulus |
| B4 | Skip record (alasan wajib) | `POST /pickups/:id/skip` | 201 | ✅ `skip_date` = 2026-11-05 (WIB), alasan tersimpan | ✅ Lulus |
| B5 | Ubah jadi `sudah_diambil` (bagsCount 2) | `PATCH /pickups/:id/pickup` | 200 | ✅ `sudah_diambil`, `picked_at` terisi, bags 2 | ✅ Lulus |
| B6 | Daftar rumah hari ini | `GET /pickups/today` | 200 | ✅ 1 record (skip tetap terbawa + sudah_diambil, 2 buah status diurut due terlama) | ✅ Lulus |
| B7b | Bonus Beranda (stats) | `GET /pickups/stats?range=week` | 200 | ✅ `collected 1, pending 0, progress 100%, bags 2, money 5000` | ✅ Lulus |

---

## Fase C — Payments (F7 & F13)

| # | Fitur | Endpoint | HTTP | Ekspektasi vs Realita | Status |
|---|-------|----------|------|------------------------|--------|
| C1 | Bayar sebagian Rp2.000 | `POST /payments` | 201 | ✅ 201, `paymentStatus` → `sebagian`, sisa 3000, `clamped: false` | ✅ Lulus |
| C2 | Cek outstanding kasbon | `GET /payments/outstanding/:houseId` | 200 | ✅ sisa 3.000, paid 2.000, status `sebagian` | ✅ Lulus |
| C3 | Void pembayaran | `PATCH /payments/:id/void` | 200 | ✅ `voidedAt` terisi, status kembali `belum_bayar` | ✅ Lulus |
| C4 | Outstanding setelah void | `GET /payments/outstanding/:houseId` | 200 | ✅ sisa kembali 5.000 (pembayaran aktif = 0) | ✅ Lulus |
| C5 | Bayar penuh Rp5.000 | `POST /payments` | 201 | ✅ status → `lunas`, sisa 0 | ✅ Lulus |

---

## Fase D — Houses Edit & Reassign (F9 & F15)

| # | Fitur | Endpoint | HTTP | Ekspektasi vs Realita | Status |
|---|-------|----------|------|------------------------|--------|
| D1 | Buat rumah 2 (fee 6.000) | `POST /houses` | 201 | ✅ 201 | ✅ Lulus |
| D2 | Start Day kedua | `POST /pickups/start-day` | 201 | ✅ record 2 `belum_diambil` fee 6.000 (record terbuka untuk uji) | ✅ Lulus |
| D3 | Edit nominal rumah 2 → 8.500 | `PATCH /houses/:id` | 200 | ✅ 200, `defaultFee` 8.500 | ✅ Lulus |
| D4 | **Tagihan terbuka ikut berubah?** | `GET /pickups/today` | 200 | ✅ record `belum_diambil` fee → 8.500; record `sudah_diambil` rumah 1 tetap 5.000 (tidak dipangkas) — sesuai aturan F9 | ✅ Lulus |
| D5 | Admin reassign rumah 2 → petugas 2 | `PATCH /admin/houses/:id/reassign` | 200 | ✅ 200, `collector.fullName` = Petugas Dua | ✅ Lulus |
| D6 | Petugas 1 tak lagi melihat rumah 2 | `GET /houses` | 200 | ✅ hanya "Bapak E2E" | ✅ Lulus |
| D7 | Record terbuka pindah ke petugas 2 | `GET /pickups/today` (petugas 2) | 200 | ✅ record muncul di petugas 2 (`collectorId` = petugas 2, fee 8.500) | ✅ Lulus |

---

## Fase E — Sync (F12)

| # | Fitur | Endpoint | HTTP | Ekspektasi vs Realita | Status |
|---|-------|----------|------|------------------------|--------|
| E1 | Push data offline (1 rumah + 1 record + 1 payment baru) | `POST /sync/push` | 201 | ✅ `houseSynced 1, pickupSynced 1, paymentSynced 1`, 0 konflik | ✅ Lulus |
| E2 | Push ulangsame payload (`updatedAt` lama) | `POST /sync/push` | 201 | ✅ 0 synced + 1 konflik — **server lebih baru, tidak ditimpa, tidak duplikat** | ✅ Lulus |
| E3 | Push "stale" mengubah nama rumah 1 (`updatedAt` 4 hari lalu) | `POST /sync/push` | 201 | ✅ masuk konflik; nama rumah utuh "Bapak E2E" (E4/E6 verifikasi) | ✅ Lulus |
| E4 | Pull semua (tanpa `lastSyncedAt`) | `GET /sync/pull` | 200 | ✅ 2 rumah milik petugas + 2 record + `serverTime`; milik petugas lain tidak ikut | ✅ Lulus |
| E5 | Pull sejak `lastSyncedAt=15:00Z` (tidak ada perubahan setelahnya) | `GET /sync/pull` | 200 | ✅ hasil kosong (differential sync benar) | ✅ Lulus |

---

## Regresi Pasca-Audit Keamanan (Tugas 2)

| # | Kasus | Endpoint | HTTP | Ekspektasi vs Realita | Status |
|---|-------|----------|------|------------------------|--------|
| R1 | **Double-click Start Day** (3 request hampir simultan) | `POST /pickups/start-day` ×3 | 3×201 | ✅ semua 201, **0 duplikat record, 0 error 500** (atomic upsert) | ✅ Lulus |
| R2 | Outstanding oleh petugas lain (IDOR) | `GET /payments/outstanding/:houseId` | 403 | ✅ 403 "tidak berhak melihat kasbon rumah milik petugas lain" | ✅ Lulus |
| R3 | Outstanding oleh pemilik | `GET /payments/outstanding/:houseId` | 200 | ✅ 200 | ✅ Lulus |
| R4 | Outstanding oleh admin | `GET /payments/outstanding/:houseId` | 200 | ✅ 200 (admin diizinkan) | ✅ Lulus |
| R5 | Petugas 2 mencoba menimpa rumah milik petugas 1 via push | `POST /sync/push` | 201 | ✅ masuk konflik, data tidak berubah | ✅ Lulus |
| R6 | Data petugas 1 utuh setelah R5 | `GET /sync/pull` | 200 | ✅ nama rumah tetap "Bapak E2E" | ✅ Lulus |

---

## Catatan

1. Nilai `process` yang diuji dijalankan dengan build produksi (`nest build` →
   `node dist/src/main.js`), bukan dev server — sama dengan kondisi deploy.
2. Limit throttling dinaikkan **hanya untuk sesi uji** lewat env
   `THROTTLE_LIMIT=10000`; konfigurasi default di kode tetap 10 req/menit.
3. DB yang dipakai adalah DB pengembangan lokal; data uji (`petugas1/2@e2e.test`)
   tetap tersisa dan bisa dihapus bila diperlukan.
