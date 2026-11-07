# Laporan Pengembangan Backend — Bersihku

> Proyek: PPGKM (Pengelolaan Pengolahan Garbage & Kebersihan Mitra) — Ciwidey
> Basis teknologi: NestJS + Prisma ORM + PostgreSQL
> Referensi: `planning-aplikasi-sampah.md` (DRAFT v7) dan `erd-final.md`
> Tanggal laporan: 5 November 2026

---

## 1. Ringkasan Status

| Fase | Fitur | Modul | Status |
|------|-------|-------|--------|
| F2 | Auth (Register/Login/JWT) + Persetujuan Admin | `auth`, `admin` | ✅ Selesai (sebelumnya)¹ |
| F4 | Beranda: progres, karung, uang + filter | `pickups` | ✅ Selesai (stats, sesi akhir) |
| F5 | Start Day (Mulai Ambil Sampah) | `pickups` | ✅ Selesai (sesi sebelumnya) |
| F6 | List Houses Today | `pickups` | ✅ Selesai (sesi sebelumnya) |
| F7 | Catat Pengambilan & Pembayaran | `pickups` (F11²) + `payments` | ✅ Selesai (F11: sesi laporan; F7: sesi ini) |
| F8 | Skip dengan Alasan | `pickups` | ✅ Selesai (sesi laporan) |
| F9 | Rumah: Tambah/Edit/Hapus + Jadwal & Nominal | `houses` | ✅ Selesai (tambah: sebelumnya; edit/hapus: sesi ini) |
| F10 | Import Rumah (Preview + Confirm) | `import` | ✅ Selesai (jadwal/schedule: belum) |
| F12 | Sinkronisasi Offline (push + pull) | `sync` | ✅ Selesai (sesi ini + sesi akhir) |
| F13 | Pelunasan Kasbon | `payments` | ✅ Selesai (sesi ini) |
| F15 | Reassign Rumah Antarpetugas | `admin` | ✅ Selesai (sesi ini) |
| F16 | Batas Kasbon Global | `admin` | ✅ Selesai (sesi ini) |
| F3 | Lupa Password | — | ⬜ Belum (layar belum ada) |
| F14 | Rekap Uang (Tab Ikon 4) | — | ⬜ Ditunda (layar belum didesain) |

¹ Penomoran mengikuti tabel fitur di `planning-aplikasi-sampah.md`; F2 mencakup
  lupa password (link login) — layar belum didesain di UI, backend auth sudah ada.
² Sesuai tabel planning, F11 adalah persetujuan pendaftaran oleh admin (modul
  `admin` selesai sejak awal); "record pickup" adalah bagian awal alur F7
  catat pengambilan & pembayaran.

---

## 2. Sesi Sebelumnya — Fase 5: Modul Pickups (F5 & F6)

### 2.1 Helper Tanggal WIB (baru)

`backend/src/common/utils/wib-date.util.ts`

Konvensi sesuai `erd-final.md` §8: `datetime` disimpan UTC; `date` bisnis
(`due_date`, `skip_date`, `session_date`) memakai zona waktu lokal petugas (WIB, UTC+7).
Tanggal bisnis direpresentasikan sebagai `Date` pukul 00:00 UTC yang bertepatan
dengan hari tersebut sehingga aman disimpan ke kolom Prisma `@db.Date`.

- `getTodayWib()` — hari bisnis sekarang.
- `toWibDateString()` — ambil `YYYY-MM-DD` dalam WIB.
- `addDaysWib()` — geser hari kalender.
- `isSameWibDate()` — bandingkan hari kalender WIB.

### 2.2 `pickups.service.ts`

- **`startDay(collectorId)`**
  1. Upsert `CollectionSession` hari ini (`sessionDate` = hari WIB), status `in_progress`.
  2. Ambil semua `House` milik petugas dengan `isActive: true` dan `nextDueDate <= hari ini`.
  3. Dalam `$transaction`: untuk setiap rumah, buat `PickupRecord` per tanggal
     jatuh tempo yang terlewat (multi-tagihan terpisah, dua pembayaran), lalu
     `nextDueDate += intervalDays` diulang sampai melewati hari ini.
  4. Idempoten — ditekan dua kali tidak membuat duplikat (unique `@@unique([houseId, dueDate])`).

- **`getTodayHouses(collectorId)`**
  - Record `belum_diambil` (otomatis termasuk yang *terbawa*) ATAU record
    `sudah_diambil` pada hari WIB (rentang 17:00 UTC kemarin → 00:00 UTC hari ini).
  - Sertakan relasi `house` (ownerName, rt, gang, addressNote) dan `skips` hari ini.
  - Urut `dueDate` ascending — catatan terlama di atas.

### 2.3 `pickups.controller.ts`

- `POST /pickups/start-day`
- `GET /pickups/today`
- Keduanya dilindungi `JwtAuthGuard`, `collectorId` dari `@CurrentUser('id')`.

---

## 3. Sesi Ini — Penyelesaian Sisa Backend

### 3.1 TASK 1 — Modul Payments (F7 & F13)

**Berkas:**

- `src/modules/payments/dto/create-payment.dto.ts` (baru)
- `src/modules/payments/payments.service.ts` (implementasi penuh)
- `src/modules/payments/payments.controller.ts` (implementasi penuh)

**Alur `addPayment(dto, receivedBy)`:**

1. Cari `PickupRecord`; wajib status `sudah_diambil`, dan milik petugas yang login.
2. Hitung total pembayaran aktif (`voidedAt = null`) → `sisa = feeAmount − total`.
3. Nominal dibatasi: `amount = min(dto.amount, sisa)` (aturan #9).
4. Simpan `Payment` (append-only) lalu hitung ulang `payment_status` record
   dalam satu transaksi:
   - `0` → `belum_bayar`
   - `> 0` dan `< feeAmount` → `sebagian`
   - `>= feeAmount` → `lunas`
5. Response memuat `requestedAmount` + `clamped` untuk transparansi petugas,
   plus nilai `kasbonLimit` global untuk peringatan F7.

**`voidPayment(paymentId, receivedBy)`:** set `voidedAt = new Date()`,
tolak bila bukan milik petugas atau sudah di-void, lalu recalc status.

**`getOutstanding(houseId)`:** daftar record `sudah_diambil` dengan
sisa > 0 (rincian: `feeAmount`, `paid`, `sisa` per catatan) — basis layar F13.

**Endpoint:**

| Method | Route | Fungsi |
|--------|-------|--------|
| POST | `/payments` | Catat pembayaran |
| PATCH | `/payments/:id/void` | Batalkan pembayaran |
| GET | `/payments/outstanding/:houseId` | Rincian kasbon rumah |

### 3.2 TASK 2 — Ekstensi Houses (F9)

**Berkas:**

- `src/modules/houses/dto/update-house.dto.ts` (baru)
- `src/modules/houses/houses.service.ts` (tambahan `update`, `softDelete`)
- `src/modules/houses/houses.controller.ts` (endpoint baru)

**`update(houseId, dto, userId)` — dalam `$transaction`:**

- Jika `defaultFee` berubah:
  1. Perbarui `feeAmount` seluruh `PickupRecord` `belum_diambil` milik rumah.
  2. Tulis baris baru `HouseFeeHistory` (oldFee, newFee, changedBy, changedAt).
- Field lain (ownerName, rt, gang, addressNote, intervalDays, nextDueDate) diperbarui biasa.
- Petugas *tidak bisa* mengubah `collectorId` — hanya admin via F15.

**`softDelete(houseId, userId)`:** set `deletedAt` + `isActive = false`
(histories tetap tersimpan).

**Endpoint:** `PATCH /houses/:id`, `DELETE /houses/:id` (cek kepemilikan rumah).

### 3.3 TASK 3 — Admin Lanjutan (F15 & F16)

**Berkas:**

- `src/modules/admin/dto/reassign-house.dto.ts` (baru)
- `src/modules/admin/dto/set-kasbon-limit.dto.ts` (baru)
- `src/modules/admin/admin.service.ts` (tambahan 3 method)
- `src/modules/admin/admin.controller.ts` (tambahan 3 endpoint)

**`reassignHouse(houseId, newCollectorId)`:**

- Validasi: rumah ada & belum dihapus; petugas tujuan `approved` dan ber-role `collector`.
- Dalam `$transaction`: `House.collectorId` diganti, dan seluruh `PickupRecord`
  `belum_diambil` dipindah ke petugas tujuan. Record `sudah_diambil` tetap
  atas nama petugas saat itu (sesuai catatan F15).

**`getSettings()` / `setKasbonLimit(value, adminId)`:**

- Global, key `kasbon_limit_amount` pada tabel `Setting`, `updated_by` = admin.
- `getSettings()` mengembalikan `kasbonLimit` (number|null) + seluruh item.

**Endpoint:**

| Method | Route | Fungsi |
|--------|-------|--------|
| PATCH | `/admin/houses/:id/reassign` | Pindahkan rumah antarpetugas |
| GET | `/admin/settings` | Baca pengaturan global |
| PATCH | `/admin/settings/kasbon-limit` | Ubah batas kasbon |

### 3.4 TASK 4 — Modul Sync (F12)

**Berkas:**

- `src/modules/sync/dto/push-sync.dto.ts` (baru)
- `src/modules/sync/sync.service.ts` (implementasi penuh)
- `src/modules/sync/sync.controller.ts` (implementasi penuh)

**`pushOfflineData(payload, collectorId)` — payload `{ houses, pickups, payments }`:**

| Koleksi | Strategi |
|---------|----------|
| `payments` | **Append-only**: ditambah apa adanya (idempoten by id); recalc `payment_status` record terkait. Bila record induk tidak ada → konflik. |
| `houses` | Upsert dibandingkan `updatedAt`. Server lebih baru (mis. rumah di-reassign admin) → **konflik**; server tidak ada → create baru milik petugas. |
| `pickups` | Upsert perbandingan `updatedAt`; record baru tanpa `due_date` atau relasi invalid → konflik. |

- Benturan digusah dengan graceful catch `P2002` (duplikat) / `P2003` (relasi) → masuk `conflicts`.
- Response: jumlah synced + daftar id konflik per koleksi + `syncedAt`.

**Endpoint:** `POST /sync/push` (dengan `JwtAuthGuard`).

### 3.5 TASK 5 — Modul Import (F10, Placeholder)

**Dependensi baru:** `multer@^2.5.0`, `xlsx@^0.18.5`, `@types/multer` (dev).
Catatan: override `multer` di `package.json` konflik dengan dependensi langsung
(error `EOVERRIDE`) dan dihapus; sekarang `multer` menjadi dependensi sejati.

**Berkas baru:** `src/modules/import/import.module.ts`, `import.service.ts`,
`import.controller.ts` (+ didaftarkan ke `AppModule`).

**`previewImport(file)`:**

1. Validasi ekstensi `xlsx|xls|csv` (max 5 MB).
2. Baca workbook via `xlsx`, ambil sheet pertama, konversi ke JSON baris.
3. Normalisasi header (huruf kecil, spasi → underscore); terima alias
   (`owner/nama`, `tanggal`, `interval`, `iuran/nominal`).
4. Dukungan tanggal: string ISO, string bebas, dan **nomor serial Excel**
   (melalui `XLSX.SSF.parse_date_code`).
5. Validasi tiap baris: `owner_name`, `rt`, `gang`, `next_due_date` wajib;
   default `intervalDays = 7`, `defaultFee = 5000` bila kosong.
6. Return **pratinjau tanpa simpan DB**: `{ fileName, sheetName, summary: { totalRows, validRows, errorRows }, rows[] }`.

**Endpoint:** `POST /import/preview` dengan `@UseInterceptors(FileInterceptor('file'))`.

Tahap berikutnya (belum): `confirm(batchId)` untuk benar-benar menyimpan ke
DB dan mencatat `ImportBatch`.

### 3.6 — Pelengkap Pickups (F8 & F11, tambahan sesi laporan)

**Berkas baru:** `src/modules/pickups/dto/record-pickup.dto.ts`,
`src/modules/pickups/dto/skip-record.dto.ts`.
**Berkas diubah:** `pickups.service.ts`, `pickups.controller.ts`.

**F11 `recordPickup(recordId, collectorId, dto)`:**

- Record wajib milik petugas (`ForbiddenException` bila bukan), wajib belum
  diambil (`BadRequestException` bila sudah).
- Update: `pickupStatus = 'sudah_diambil'`, `pickedAt = new Date()`,
  `bagsCount` dari DTO. Rumah yang hari ini di-skip tetap bisa langsung
  diambil lewat sini (aturan F8: "rumah boleh diubah jadi diambil").

**F8 `skipRecord(recordId, collectorId, dto)`:**

- Record wajib milik petugas dan belum diambil.
- Upsert pada tabel `PickupSkip` dengan unique `@@unique([recordId, skipDate])`:
  hari WIB ini sudah ada skip baru untuk record ini → alasan lama diperbarui;
  belum ada → dibuat baris baru.
- Skip tidak menggeser `due_date` — esok hari rumah muncul kembali sebagai
  terbawa; alasan hari itu juga bisa diubah ulang tanpa batas modifikasi.

**Endpoint:**

| Method | Route | Fungsi |
|--------|-------|--------|
| PATCH | `/pickups/:id/pickup` | Catat pengambilan (F11) |
| POST | `/pickups/:id/skip` | Skip rumah dengan alasan (F8) |

---

## 3A. Sesi Akhir — Penataan Sebelum Testing Frontend

### TASK 1 — RolesGuard (Keamanan Admin)

**Berkas baru:** `src/common/decorators/roles.decorator.ts`,
`src/common/guards/roles.guard.ts`.
**Berkas diubah:** `admin.controller.ts`.

- `@Roles(...roles)` menyimpan metadata `roles`; `RolesGuard` membacanya lewat
  `Reflector` (`getAllAndOverride` handler/kelas) dan membandingkan dengan
  `user.roles` dari payload JWT — tanpa query DB per request.
- Endpoint tanpa `@Roles` tetap hanya butuh `JwtAuthGuard`.
- Seluruh `AdminController` kini dilindungi `@Roles('admin')` +
  `@UseGuards(JwtAuthGuard, RolesGuard)` — petugas biasa yang menembus
  `/admin/*` mendapat `403 Forbidden`.

### TASK 2 — Sync Pull (F12 lanjutan)

**Berkas diubah:** `sync.service.ts`, `sync.controller.ts`.

- `pullOfflineData(collectorId, lastSyncedAt?)`:
  - `houses` + `pickups` milik petugas itu saja (`skips` ikut per record),
    `settings` global — semuanya yang `updatedAt > lastSyncedAt`.
  - `lastSyncedAt` kosong/tidak valid → semua data / `BadRequestException`.
  - Response memuat `serverTime` agar perangkat menyimpan waktu sinkron baru.
- **Endpoint:** `GET /sync/pull?lastSyncedAt=YYYY-MM-DDTHH:mm:ssZ`.

### TASK 3 — Import Confirm (F10 lanjutan)

**Berkas baru:** `src/modules/import/dto/confirm-import.dto.ts`
(`houses[]` dengan `ValidateNested` per baris; `importType/fileName/fileType` opsional).
**Berkas diubah:** `import.service.ts` (kini injeksi `PrismaService`),
`import.controller.ts`.

- `confirmImport(dto, uploadedBy)` — dalam `$transaction`: setiap baris rumah
  dibuat milik petugas (`collectorId = uploadedBy`, defaults `intervalDays=7`,
  `defaultFee=5000`), lalu satu baris `ImportBatch` dicatat
  (`status: success`, `totalRows/successRows/failedRows`).
- Baris sudah divalidasi di tahap pratinjau, jadi penyimpanan bersifat
  all-or-nothing; jenis `schedule` ditolak sementara (`BadRequestException`).
- **Endpoint:** `POST /import/confirm`.

### TASK 4 — Stats / Beranda (F4 ringkasan)

**Berkas baru:** `src/modules/pickups/dto/stats-query.dto.ts` (`range` opsional `today|week|month`).
**Berkas diubah:** `pickups.service.ts` (method `getStats`), `pickups.controller.ts`.

- **Progres hari ini** (WIB, selatan-per-sesi): `(sudah_diambil hari ini) ÷
  (sudah_diambil + belum_diambil milik petugas) × 100`; 0/0 → 0.
- **Total karung**: `SUM(bagsCount)` per `pickedAt` pada rentang.
- **Total uang**: `SUM(amount)` pembayaran aktif (`voidedAt = null`)
  per `paidAt` pada rentang, milik petugas (`receivedBy`).
- Rentang WIB: `today` = hari berjalan; `week` = Senin–Minggu berjalan
  (`(getUTCDay()+6) % 7` hari mundur); `month` = bulan kalender berjalan
  (`Date.UTC(y, m, 1)` → `Date.UTC(y, m+1, 1)`).
- **Endpoint:** `GET /pickups/stats?range=today|week|month`
  (default `today`).

---

## 4. Endpoint Backend Saat Ini

```
POST   /auth/register                     (publik)
POST   /auth/login                        (publik)
GET    /admin/pending                     (admin — RolesGuard)
PATCH  /admin/approve/:userId             (admin — RolesGuard)
PATCH  /admin/reject/:userId              (admin — RolesGuard)
PATCH  /admin/houses/:id/reassign         (admin — RolesGuard, F15)
GET    /admin/settings                    (admin — RolesGuard, F16)
PATCH  /admin/settings/kasbon-limit       (admin — RolesGuard, F16)
POST   /houses                            (F4)
GET    /houses                            (F4)
PATCH  /houses/:id                        (F9)
DELETE /houses/:id                        (F9, soft delete)
POST   /pickups/start-day                 (F5)
GET    /pickups/today                     (F6)
GET    /pickups/stats?range=today|week|month (F4 Beranda)
PATCH  /pickups/:id/pickup                (F11)
POST   /pickups/:id/skip                  (F8)
POST   /payments                          (F7/F13)
PATCH  /payments/:id/void                 (F7)
GET    /payments/outstanding/:houseId     (F13)
POST   /sync/push                         (F12)
GET    /sync/pull?lastSyncedAt=ISO        (F12 lanjutan)
POST   /import/preview                    (F10, multipart "file")
POST   /import/confirm                    (F10 lanjutan)
```

---

## 5. Verifikasi

| Pengecekan | Perintah | Hasil |
|------------|----------|-------|
| TypeScript | `npx tsc --noEmit -p tsconfig.json` | ✅ 0 error |
| Build | `npm run build` | ✅ sukses |
| Lint (modul baru) | `npx eslint src/modules/... src/common/...` | ✅ clean |
| Unit test | `npm run test` | ✅ 13/13 suite, 13/13 test |

Perbaikan lingkungan yang dilakukan agar test/lint hijau:

- Jest `transformIgnorePatterns` → `node_modules/(?!@nestjs/passport|@nestjs/jwt)`
  (kedua paket ber-ESM dan gagal di-`require` oleh Jest di Node v22.23.2).
- Semua `*.spec.ts` scaffold Nest CLI diberi mock DI (`PrismaService`/service mock).

---

## 6. Catatan Desain Penting

1. **Append-only payment + void** — pembayaran tidak pernah dihapus; pembatalan
   hanya menandai `voidedAt`, sehingga `payment_status` selalu bisa dihitung ulang.
2. **Uang dibatasi sisa** — jika nominal melebihi sisa catatan, yang tercatat
   hanya sebesar sisa; petugas diberi tahu lewat field `clamped`.
3. **WIB sebagai tanggal bisnis** — semua perbandingan "hari ini" memakai
   helper `wib-date.util.ts`; rentang "diambil hari ini" =
   17:00 UTC (kemarin) → 00:00 UTC (hari ini).
4. **Reassign hanya memindahkan record terbuka** — catatan yang sudah diambil
   tetap milik petugas lama (protokol F15); sinkronisasi petugas lama akan
   melihat konflik bila ada perubahan lokal yang lebih tua.
5. **Baris data tersaring dulu di pratinjau** — confirm memakai pendekatan
   all-or-nothing dalam satu transaksi (baris dianggap valid, sehingga
   per-row catch di dalam transaksi PostgreSQL tidak diperlukan).
6. **Peringatan kasbon** — respons `addPayment` menyertakan nilai batas kasbon
   global agar UI dapat menampilkan peringatan tanpa memblokir (aturan #10).
7. **RolesGuard tanpa query DB** — role dicek dari payload JWT; perubahan role
   baru berlaku setelah petugas login ulang (umur token 1 hari).
8. **Pull sync hanya global-edit** — `settings` dikirim ke semua petugas
   (batas kasbon berlaku global), sedangkan `houses`/`pickups` terbatas
   milik petugas masing-masing.

---

## 7. Rencana / Next Steps

Backend untuk alur inti **sudah selesai seluruhnya**. Sisa item lanjutan
(bersifat opsional / penyempurnaan):

1. **Import jadwal (F10 lanjutan)**: jenis `schedule` masih ditolak —
   tinggal menambahkan alur perbarui `next_due_date`/`intervalDays`
   rumah yang cocok milik pengunggah.
2. **Uji pull sync dengan kasus reassign**: rumah yang dipindahkan admin
   harus muncul sebagai data baru di petugas tujuan dan tidak ikut terkirim
   ke petugas lama (logical deletion untuk petugas asal perlu dibahas).
3. **Hardening opsional**:
   - Peringatan batas kasbon pada UI memakai `kasbonLimit` dari respons
     `addPayment` + `GET /admin/settings` (server sudah menyediakan nilainya).
   - Refresh token / revoke, rate-limit `auth/login`.
   - Migrasi `changed_at` default `now()` agar tidak perlu diisi manual.

**Status akhir: backend siap untuk testing frontend.**
