# Laporan Audit Keamanan — Bersihku Backend

> Audit *self* terhadap 3 area yang diminta (IDOR, soft-delete protection,
> race condition & transaksi), dilakukan sebelum masuk fase testing frontend.
> Setiap temuan mencantumkan: tingkat risiko, file yang diubah, dan bentuk perbaikan.
> Semua perbaikan diikuti regresi E2E (lihat `laporan-testing-e2e.md` bagian Regresi) dan
> verifikasi `tsc`/`eslint`/`jest` yang tetap hijau.

**Rekap: 6 temuan diperbaiki (2 IDOR, 2 soft-delete, 2 race condition) + 3 area ternyata sudah aman.**

---

## 1. IDOR (Insecure Direct Object Reference)

### 1.1 🟠 Temuan: `getOutstanding` bisa dibaca petugas lain — DIPERBAIKI
- **File:** `src/modules/payments/payments.service.ts`, `payments.controller.ts`
- **Kerentanan:** Endpoint `GET /payments/outstanding/:houseId` semula hanya menerima
  `houseId`. Petugas B bisa membuka rincian kasbon (jumlah tagihan, riwayat bayar,
  total uang) rumah yang diampu petugas A hanya dengan menambah id rumah ke URL —
  kebocoran data keuangan antarpetugas.
- **Perbaikan:**
  1. Signature berubah menjadi `getOutstanding(houseId, user: AuthenticatedUser)`.
  2. Cek `house.collectorId === user.id` (pemilik rumah) **atau** `user.roles.includes('admin')`.
  3. Selain itu → `ForbiddenException('Anda tidak berhak melihat kasbon rumah milik petugas lain')` (403).
- **Hasil regresi:** cross-owner → **403**, pemilik → 200, admin → 200.

### 1.2 🟡 Sudah aman (diverifikasi, tanpa perubahan)
- `pickups.recordPickup` & `skipRecord`: membandingkan `record.collectorId !== collectorId` → `ForbiddenException`. ✅
- `payments.addPayment`: `record.collectorId !== receivedBy` → `ForbiddenException`. ✅
- `payments.voidPayment`: `payment.receivedBy !== receivedBy` → `ForbiddenException`. ✅
- `houses.update` / `softDelete`: keduanya lewat `findOne()` yang memfilter
  `collectorId` (pebedaan status dibalas `404`, tidak membocorkan eksistensi rumah orang). ✅
- `admin.reassignHouse`: hanya boleh lewat route ber-`RolesGuard('admin')`. ✅

### 1.3 🟠 Temuan: Sync Push bisa menimpa/menyalahgunakan data petugas lain — DIPERBAIKI
- **File:** `src/modules/sync/sync.service.ts`
- **Kerentanan:** `pushOfflineData` semula menerima array bebas tanpa cek kepemilikan:
  1. Petugas B dapat mengirim perubahan untuk `houses` milik petugas A
     (mis. mengubah nama/alamat rumah A) karena update hanya dicek `updatedAt`.
  2. Petugas B dapat membuat `pickupRecord` pada `houseId` milik petugas A
     (record dianggap milik B tapi menodai rumah A).
  3. Petugas B dapat menambah `payment` pada `record` milik petugas A
     (mengubah `paymentStatus` kasbon orang lain).
- **Perbaikan (semua item bermasalah diarahkan ke `conflicts`, tidak 500):**
  1. `syncHouses`: `server.collectorId !== collectorId` → conflict.
  2. `syncPickups`: `server.collectorId !== collectorId` → conflict; **record baru** /
     divalidasi: rumah induk harus ada dan `house.collectorId === collectorId`, selain itu conflict.
  3. `syncPayments`: `record.collectorId !== collectorId` → conflict.
- **Hasil regresi:** petugas 2 push rumah milik petugas 1 → conflict, data tidak berubah (nama rumah tetap utuh).

---

## 2. Soft Delete Protection

### 2.1 🟡 Temuan: record rumah yang sudah dihapus masih muncul di daftar hari ini — DIPERBAIKI
- **File:** `src/modules/pickups/pickups.service.ts` (`getTodayHouses`)
- **Kerentanan:** query semula hanya filter `collectorId` + status; record milik rumah
  yang di-soft-delete masih mengacaukan daftar hari ini, hitung progres Beranda, dan
  masih bisa di-skip/diambil oleh petugas (padahal rumah sudah dihapus).
- **Perbaikan:** `where` ditambah relasi `house: { deletedAt: null }`.

### 2.2 🟡 Temuan: rumah yang sudah dihapus tetap ikut diajek `sync pull` — DIPERBAIKI
- **File:** `src/modules/sync/sync.service.ts` (`pullOfflineData`)
- **Kerentanan:** perangkat offline petugas akan terus menarik rumah yang sudah
  dihapus dan mereanimasinya secara lokal (rumah "hidup kembali" di perangkat,
  bahkan bisa di-push balik).
- **Perbaikan:** filter `deletedAt: null` pada query `houses`.

### 2.3 ✅ Sudah aman (diverifikasi, tanpa perubahan)
- `houses.findMyHouses` & `houses.findOne`: `deletedAt: null`. ✅
- `payments.getOutstanding`: rumah dicek `deletedAt: null` (rumah terhapus tidak bisa dikejar kasbonnya). ✅
- `admin.reassignHouse`: menolak rumah terhapus. ✅
- `sync push` (`syncHouses`): rumah terhapus tak masuk karea filter milik jaminan
  kepemilikan + `deletedAt` sudah dilakukan di pull. ✅
- `admin.getPendingUsers`: tabel `users` tidak memakai soft-delete (kolom `deletedAt`
  tidak ada di skema) — nilai ini aman; bila soft-delete user dibuat di masa depan,
  filter `deletedAt` harus ditambahkan di semua query user.

---

## 3. Race Condition & Transaksi

### 3.1 🔴 Temuan: double-click "Start Day" bisa 500 / duplikat — DIPERBAIKI
- **File:** `src/modules/pickups/pickups.service.ts` (`startDay`)
- **Kerentanan:** pola `findUnique` → `create` tidak atomik. Dua request paralel
  sama-sama melihat "belum ada" lalu sama-sama create → satu request gagal dengan
  `P2002` (error 500 karena uncatchable di dalam transaksi interaktif PostgreSQL yang
  langsung *aborted*), atau — bila di-catch di JavaScript — tidak menyelamatkan
  transaksi yang telah abort.
- **Perbaikan:** diganti **atomic upsert** (`INSERT ... ON CONFLICT`):
  ```ts
  await tx.pickupRecord.upsert({
    where: { houseId_dueDate: { houseId, dueDate } },
    create: { ... },
    update: {}, // record lama (mis. sudah_diambil) tidak ditimpa
  });
  ```
  Keunikan `@@unique([houseId, dueDate])` membuat upsert ini bebas duplikat tanpa
  P2002. Sesi `CollectionSession` memang sudah upsert atomik.
- **Hasil regresi:** 3 request `start-day` hampir simultan → 3× 201, record count tidak berubah, tanpa 500.

### 3.2 🔴 Temuan: pembayaran paralel bisa overpayment — DIPERBAIKI
- **File:** `src/modules/payments/payments.service.ts` (`addPayment`)
- **Kerentanan:** agregat "sisa tagihan" dibaca **di luar** transaksi. Dua request
  paralel keduanya membaca sisa 5000, keduanya mencatat 5000 → total bayar 10.000 untuk
  tagihan 5000 (*overpayment*) dan status pembayaran salah.
- **Perbaikan:** seluruh hitungan dipindah ke dalam `$transaction` dengan
  row-lock pessimistic:
  ```ts
  await tx.$queryRaw`SELECT id FROM "pickup_records" WHERE id = ${record.id} FOR UPDATE`;
  // baca ulang sisa, validasi, clamped create, recalc status — satu transaksi
  ```
  Transaksi kedua otomatis menunggu lock → sisa yang dilihat selalu segar.
- **Bonus:** `remaining`, `clamped`, dan `recalcPaymentStatus` kini dari satu snapshot yang konsisten.

### 3.3 🟡 Temuan: `voidPayment` berbarengan `addPayment` bisa recalc kacau — DIPERBAIKI
- **File yang sama**: transaksi void kini juga menguncinya `FOR UPDATE` baris record
  sebelum melakukan void + recalc, sehingga dua operasi yang bersaing bersambung dan
  `payment_status` akhir selalu hasil operasi terakhir yang valid.

### 3.4 ✅ Sudah aman (diverifikasi, tanpa perubahan)
- `startDay`: seluruh loop record berada di dalam `this.prisma.$transaction` (sejak awal). ✅
- `reassignHouse`: house update + `updateMany` record terbuka di dalam satu `$transaction`. ✅
- `houses.update` (fee change): 3 operasi (update fee, update record, insert history) dalam satu `$transaction`. ✅
- `import.confirmImport`: create rumah + `ImportBatch` dalam satu `$transaction`. ✅

---

## 4. Perbaikan Tambahan (tapak lingar audit)

- **`src/app.module.ts`**: `THROTTLE_LIMIT` kini dapat diatur via env (default tetap
  `10 req/menit/IP`) — diperlukan agar pengujian E2E tidak tertahan rate-limit,
  sekaligus mempermudah tuning di produksi tanpa ganti kode.

---

## 5. Verifikasi Akhir

| Pengecekan | Hasil |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` | ✅ 0 error |
| `npx eslint src/` | ✅ 0 error, 0 warning |
| `npm run build` | ✅ sukses |
| `npm run test` | ✅ 13/13 suite, 13/13 test |
| Regresi E2E (R1–R6) | ✅ 6/6 lulus |

## 6. Rekomendasi Lanjutan (belum perlu, di luar ruang lingkup)

1. **Audit trail** untuk operasi sensitif (`voidPayment`, `reassign`) agar bisa diforensik.
2. `helmet` + CORS: batasi origin setelah domain frontend ditetapkan.
3. Soft-delete individu `PickupRecord`/`Payment` (bila kebijakan berubah) perlu
   filter menyeluruh yang sama antar-pola di atas.
4. Pembatasan **persistensi secret**: pastikan `.env` tidak ikut ke VCS
   (tambahkan `.env` ke `.gitignore` sebelum repo di-push).
