# Recon Backend — Kontrak API Nyata (Fase 0)

> Hasil recon read-only dari kode `/backend`, 7 Nov 2026.
> Aturan: DILARANG menebak path/field. Dokumen ini adalah sumber saat menulis skema zod dan MSW handler.

## Ringkasan penting

- **Base URL:** `http://localhost:3000` (PORT dari env). **Tidak ada global prefix** dan **tidak ada Swagger**.
- **Auth:** JWT bearer, header `Authorization: Bearer <token>`, masa berlaku **1 hari**, TIDAK ada refresh token. Payload: `{ sub, email, roles }`.
- **CORS:** `enableCors()` tanpa opsi (permissive). ValidationPipe `{ whitelist: true, transform: true }`. Helmet aktif. Throttler global **10 req/menit per IP** — semua polling frontend harus memperhitungkan ini.
- **Galat global:** `{ statusCode, message, error, timestamp }` (PrismaExceptionFilter; P2002→409, P2025→404, P2003→400).

## Endpoint

| Method                      | Path                                                                                                                                     | Akses                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| POST                        | /auth/register                                                                                                                           | publik                                     |
| POST                        | /auth/login                                                                                                                              | publik                                     |
| POST                        | /sync/push                                                                                                                               | JWT                                        |
| GET                         | /sync/pull?lastSyncedAt                                                                                                                  | JWT                                        |
| POST / GET / PATCH / DELETE | /houses, /houses/:id                                                                                                                     | JWT (soft delete)                          |
| POST                        | /pickups/start-day                                                                                                                       | JWT                                        |
| GET                         | /pickups/today                                                                                                                           | JWT                                        |
| GET                         | /pickups/stats?range=today\|week\|month                                                                                                  | JWT                                        |
| PATCH                       | /pickups/:id/pickup                                                                                                                      | JWT — body `bagsCount` int ≥0              |
| POST                        | /pickups/:id/skip                                                                                                                        | JWT — body `reason` wajib                  |
| POST                        | /payments                                                                                                                                | JWT — body `{ recordId, amount≥1, note? }` |
| PATCH                       | /payments/:id/void                                                                                                                       | JWT                                        |
| GET                         | /payments/outstanding/:houseId                                                                                                           | JWT (owner atau admin)                     |
| GET / PATCH                 | /admin/pending, /admin/approve/:userId, /admin/reject/:userId, /admin/houses/:id/reassign, /admin/settings, /admin/settings/kasbon-limit | JWT + role admin                           |
| POST                        | /import/preview (multipart `file`, ≤5MB, xlsx                                                                                            | xls                                        | csv), /import/confirm | JWT |

## DTO utama (persis)

- `LoginDto`: `{ email, password }`. `RegisterDto`: `{ fullName, email, password (min 6) }`.
- `CreateHouseDto`: `{ ownerName, rt, gang, addressNote?, defaultFee? (int ≥0), intervalDays? (int ≥1), nextDueDate (ISO date wajib) }`. `UpdateHouseDto`: semua opsional.
- `RecordPickupDto`: `{ bagsCount }`. `SkipRecordDto`: `{ reason }`. `CreatePaymentDto`: `{ recordId, amount, note? }`.
- `ReassignHouseDto`: `{ newCollectorId }`. `SetKasbonLimitDto`: `{ value }` (int ≥0).
- `PushSyncPayloadDto`: `{ houses?, pickups?, payments? }` array bebas (`SyncItem{id?}`) — field lain dibaca dinamis service.

## Respons kunci

- **POST /auth/login** → `{ access_token, user: { id, fullName, email, status, roles[] } }`
- **POST /auth/register** → `{ message }` (status pending, tunggu approve admin)
- **GET /pickups/today** → array PickupRecord + `house { id, ownerName, rt, gang, addressNote }` + `skips[]` (hari ini WIB)
- **POST /pickups/start-day** → `{ session, houses: <bentuk GET /pickups/today> }` (upsert sesi + buat record jatuh tempo terlewat, geser `nextDueDate += intervalDays`)
- **POST /payments** → `{ payment: { ..., requestedAmount, clamped }, record, remaining, kasbonLimit }` (server clamp; error "Catatan ini sudah lunas" bila sisa ≤ 0)
- **POST /sync/push** → `{ syncedAt, houseSynced, houseConflicts[], pickupSynced, pickupConflicts[], paymentSynced, paymentConflicts[] }` (conflict = id; tidak ada merge — klien harus re-pull)
- **GET /sync/pull** → `{ since, serverTime, houses[], pickups[] (+skips[]), settings[] }`
- **GET /payments/outstanding/:houseId** → array `{ id, houseId, collectorId, dueDate, pickedAt, bagsCount, feeAmount, paid, sisa, paymentStatus }` (hanya sudah_diambil, sisa > 0)
- **GET /pickups/stats** → `{ range, totalCollected, pending, progress, totalBags, totalMoney }`
- **Admin:** pending → array `{ id, fullName, email, createdAt, roles[{role:{name}}] }`; settings → `{ kasbonLimit: number|null, items[] }`

## Prisma / nilai enum (String, bukan enum DB)

- Versi Prisma **5.14.0**. Model: Role, User, UserRole, House, CollectionSession, PickupRecord, PickupSkip, Payment, HouseFeeHistory, Setting, ImportBatch.
- Role: `admin`, `collector`. User.status: `pending|approved|rejected`. Sesi: `not_started|in_progress`. pickup_status: `belum_diambil|sudah_diambil`. payment_status: `belum_bayar|sebagian|lunas`.
- Key Setting: `kasbon_limit_amount`. Pembayaran append-only: void = isi `voidedAt`.
- WIB: tanggal bisnis disimpan `00:00 UTC` hari WIB tsb (`@db.Date`). Minggu = Senin–Minggu WIB; `(getUTCDay()+6)%7`.
- PickupRecord unik `(houseId, dueDate)`. Skip unik `(recordId, skipDate)`. Sesi unik `(collectorId, sessionDate)`.
- Soft delete house: `deletedAt` + `isActive=false`; terfilter di list & sync-pull.
- Seed admin: `admin@bersihku.com` (lihat prisma/seed.ts; ⚠️ tidak boleh dipakai sebagai kredensial ter-commit di test frontend).

## Catatan deviasi dokumen

1. Playbook menyebut "jadwal Senin diambil Rabu, berikutnya tetap Senin depan" — backend mengimplementasikan generik `intervalDays` + `nextDueDate` (skip tidak menggeser jadwal; rumah terbawa muncul esok). Konsisten dengan ERD.
2. Token hanya access token 1 hari (tanpa refresh) — berdampak pada keputusan D1.
3. Tidak ada Swagger; kontrak dibangun dari kode. Backend belum memetakan CORS eksplisit — saat deploy CSP/origin harus diatur.

## Dependensi backend yang relevan

- Node modern (tanpa field engines; ESLint 9/Jest 30 → Node ≥ 20). Frontend pakai Node v22.23.2, npm 10.9.8.
