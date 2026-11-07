# Planning Aplikasi Pemungutan Sampah (Sisi Petugas)

> **Status: DRAFT v7** — admin diputuskan sebagai role di aplikasi yang sama; ERD difinalkan (lihat `erd-final.md` untuk kamus data lengkap).
> **Tech stack dan eksekusi kode: ditunda.** Diagram netral (tanpa endpoint/framework).
> ⚠️ = belum pasti / perlu dikonfirmasi. 💡 = usulan atau tafsiran saya, bukan keputusan.

## 0. Ringkasan Keputusan

| # | Keputusan |
|---|---|
| 1 | Iuran default **Rp5.000 per rumah**. Petugas bisa mengubah nominal; berlaku **seterusnya sebagai default rumah**, **hanya untuk catatan yang belum diangkut**. Catatan lama dibiarkan, tetapi **perubahan dicatat** |
| 2 | Kartu **Uang** dan **Karung** di Beranda punya filter **Hari ini / Mingguan (Senin–Minggu) / Bulanan**; Karung dihitung dari tanggal pengambilan |
| 3 | Rumah **Skip dihitung belum selesai** dan **ikut terbawa ke hari berikutnya** |
| 4 | **Petugas mengisi data rumah**; rencana **import dari Excel, PDF, DOCX** |
| 5 | **Jadwal pengambilan sesuai jadwal tertentu**; jadwal juga bisa **diimport** dari Excel/PDF/DOCX |
| 6 | Siklus sementara **mingguan mengikuti hari jadwal tetap**: jadwal Senin lalu baru diambil Rabu, berikutnya tetap **Senin depan**. Jika catatan lama belum diambil saat jatuh tempo baru tiba, jadi **dua catatan terpisah** (dua tagihan, dua pembayaran) |
| 7 | **1 petugas memegang banyak rumah; 1 rumah hanya dipegang 1 petugas** |
| 8 | Idealnya **bayar tunai langsung setelah diangkut**; **pembayaran sebagian dan kasbon dicatat** |
| 9 | Saat bayar kasbon, **petugas memilih catatan yang dilunasi**; uang yang melebihi sisa **dibatasi sebesar sisa** |
| 10 | **Ada batas kasbon**: satuan **nominal rupiah**, berlaku **untuk semua rumah**, saat terlampaui **hanya peringatan dulu**; nilainya diubah admin |
| 11 | Warna status: pembayaran **sebagian = kuning**; **Skip = merah dengan nuansa berbeda** dari merah "Belum bayar penuh" |
| 12 | **Admin yang memindahkan rumah** antarpetugas |
| 13 | **Pendaftaran petugas perlu persetujuan admin** |
| 14 | **Skip wajib alasan** dan **bisa diubah** |
| 15 | **Sebisa mungkin offline** |
| 16 | **Ikon navigasi persis seperti Figma**; **label dan layar** ikon 1, 2, 4 belum ada dan akan **dirancang kemudian mengikuti tema UI yang sudah ada** |
| 17 | Tech stack dan eksekusi **nanti** |
| 18 | **Admin adalah role di aplikasi yang sama** (login multi-role), bukan panel terpisah; menu yang tampil mengikuti role |

## 1. Referensi UI

Branding di desain: aplikasi **Kontz**, logo **Bersihku**.

| Layar | Isi yang terlihat di desain |
|---|---|
| **Login** | Email, password, "Forget password?", tombol Login, link "Sign Up" |
| **Registration** | Full name, email, password, confirm password, tombol Register, link "Sign In" |
| **Beranda** | Tanggal, sapaan "Hallo [nama user], Selamat Bertugas Hari Ini", progres (50% — 20 dari 40 rumah), kartu **Karung** (X pcs), kartu **Uang** (Rp.), tombol **Mulai Ambil Sampah** |
| **Daftar Rumah** | Kolom cari, kartu rumah: nama pemilik, RT, gang, status berwarna |
| **Bottom navigation** | 4 ikon di layar utama |

### Status rumah (warna kartu)

| Warna | Status | Sumber |
|---|---|---|
| Abu-abu | Belum diambil | Figma |
| Hijau | Sudah diambil + Sudah bayar (lunas) | Figma |
| Merah (seperti Figma) | Sudah diambil + Belum bayar (kasbon penuh) | Figma |
| Merah (nuansa berbeda) | **Skip** | Keputusan terbaru (di Figma Skip berwarna kuning) |
| Kuning | **Sudah diambil + Bayar sebagian** | Keputusan terbaru |

**Desain Figma perlu diperbarui:** kartu Skip di Daftar Rumah berubah dari kuning ke merah, dan ditambah status baru Sebagian (kuning).

**Dua status merah dibedakan lewat nuansa warna.** "Belum bayar penuh" tetap merah seperti Figma, sedangkan Skip memakai merah dengan nuansa berbeda. Kode warna tepatnya ditentukan saat desain diperbarui. ⚠️ 💡 Selain warna, kartu sebaiknya tetap menampilkan label teks status, supaya tidak keliru dibaca di lapangan (misalnya saat layar terkena sinar matahari).

### Navigasi bawah

Empat ikon: (1) clipboard, (2) dua orang, (3) rumah, (4) kantong uang. Ikon harus identik dengan Figma, sebaiknya asset diekspor langsung dari Figma. **Label dan layar untuk ikon 1, 2, dan 4 belum ada**; akan dirancang kemudian dengan mengikuti tema visual yang sudah ada (lihat di bawah). Ikon 3 (rumah) sudah punya layar: Daftar Rumah (⚠️ dugaan, dari ikon dan isi layar).

### Tema visual yang sudah ada (acuan untuk layar baru)

Hal-hal yang terlihat konsisten di desain saat ini:
- Header **hijau cerah** berbentuk lengkung dengan logo **Bersihku**, di atas latar putih/abu sangat muda.
- Kartu **hijau** dengan sudut membulat untuk ringkasan (progres, Karung, Uang) dan status rumah.
- Tombol aksi utama berbentuk **pil**; layar Login/Registrasi memakai tombol **teal**, kolom isian putih membulat, dan ilustrasi.
- Teks tebal dan ringkas, bottom navigation 4 ikon.

Layar baru (form catat, kasbon, tambah/edit rumah, import, admin, layar ikon 1, 2, 4) sebaiknya memakai elemen-elemen ini agar konsisten. Ini ringkasan visual dari gambar yang dikirim, bukan spesifikasi resmi (kode warna dan font belum diketahui).

### Belum ada desainnya

Form catat pengambilan/pembayaran, pelunasan kasbon, tambah/edit rumah (jadwal, nominal), import data & jadwal, layar ikon 1, 2, 4, lupa password, profil, layar admin (persetujuan, pemindahan rumah, batas kasbon), form alasan skip.

## 2. Lingkup

**Sekarang:** aktor **Petugas** (utama) dan **Admin**. Admin kini memegang: persetujuan pendaftaran, pemindahan rumah, dan pengaturan batas kasbon. Admin memakai **aplikasi yang sama** dengan role `admin`; setelah login, petugas diarahkan ke Beranda dan admin ke menu admin. Layar admin belum didesain.
**Nanti:** peran lain dan fitur admin lebih lengkap. Skema memakai `roles` + `user_roles`.

| Kode | Fitur | Dasar |
|---|---|---|
| F1 | Registrasi (menunggu persetujuan admin) | Layar Registration + #13 |
| F2 | Login / logout | Layar Login |
| F3 | Lupa password | Link di Login (⚠️ layar belum ada) |
| F4 | Beranda: progres, karung, uang + filter | Layar Beranda + #2 |
| F5 | Mulai ambil sampah (rumah jatuh tempo + terbawa) | Tombol Beranda + #3, #5, #6 |
| F6 | Daftar rumah + cari + status | Layar Daftar Rumah |
| F7 | Catat pengambilan & pembayaran (penuh / sebagian / kasbon) | #1, #8, #10 |
| F8 | Skip rumah (alasan wajib, bisa diubah) | #14 |
| F9 | Tambah/edit rumah: data, jadwal, nominal default | #1, #4, #5 |
| F10 | Import data rumah dan jadwal | #4, #5 |
| F11 | Persetujuan pendaftaran oleh admin | #13 |
| F12 | Sinkronisasi data offline | #15 |
| F13 | Pelunasan kasbon (petugas memilih catatan) | #8, #9 |
| F14 | Rekap uang (tab ikon 4) | ⚠️ asumsi, ditunda |
| F15 | Admin memindahkan rumah antarpetugas | #12 |
| F16 | Admin mengatur batas kasbon | #10 |

## 3. Aturan Bisnis

1. **Iuran:** default Rp5.000 (`houses.default_fee`). Mengubah nominal: (a) mengubah default rumah seterusnya, (b) memperbarui `fee_amount` pada catatan rumah itu yang **belum diangkut**, (c) **tidak mengubah** catatan yang sudah diangkut, (d) **mencatat perubahan** di riwayat nominal (siapa, kapan, dari berapa ke berapa).
2. **Kepemilikan rumah:** setiap rumah dipegang tepat **1 petugas** (`houses.collector_id`); 1 petugas boleh memegang **banyak rumah**. Rumah yang dibuat/diimport petugas otomatis miliknya. **Hanya admin yang bisa memindahkan** rumah ke petugas lain.
3. **Jadwal mingguan tetap:** tiap rumah punya tanggal jatuh tempo berulang (`interval_days`, default 7, bisa diubah karena aturan ini "untuk sementara"). Jatuh tempo **tidak bergeser** oleh tanggal ambil: jadwal Senin diambil Rabu, berikutnya tetap Senin depan. Tanggal jadwal pertama diisi manual atau lewat import.
4. **Daftar hari ini** = catatan terbuka (belum diambil) milik petugas dengan `due_date <= hari ini`. Rumah belum diambil dan rumah skip otomatis **terbawa** sampai diambil. Bila jatuh tempo berikutnya tiba saat catatan lama masih terbuka, keduanya tetap **catatan terpisah** (dua tagihan, dua pembayaran) dan keduanya muncul di daftar, catatan lama ditandai terbawa.
5. **Skip:** wajib alasan, berlaku untuk hari itu. Besoknya rumah muncul lagi sebagai terbawa; riwayat skip tetap tersimpan. Alasan hari itu boleh diubah, dan rumah boleh diubah jadi diambil.
6. **Progres Beranda:** `rumah diambil hari ini ÷ (diambil hari ini + belum diambil di daftar hari ini)`. Skip dan terbawa masuk penyebut; **skip bukan selesai**.
7. **Pembayaran:** ideal tunai penuh saat diangkut. Boleh **sebagian** atau **nol (kasbon)**. Tiap uang masuk = satu baris pembayaran. Sisa = `fee_amount − Σ pembayaran`. Pelunasan kemudian (F13): **petugas memilih catatan** yang dilunasi. Uang yang diterima **dibatasi sebesar sisa** catatan terpilih (tidak bisa melebihi sisa).
8. **Batas kasbon:** satu nilai **nominal rupiah** yang **berlaku untuk semua rumah**, diatur dan diubah **admin**. Kasbon rumah = total sisa tagihan semua catatan yang sudah diambil. Saat terlampaui, aplikasi **hanya menampilkan peringatan** (tidak memblokir pengambilan atau pencatatan). 💡 Peringatan muncul saat petugas mencatat pengambilan rumah tersebut. Perilaku bisa diperketat nanti.
9. **Kartu Uang:** total uang yang **diterima** petugas pada rentang (menurut tanggal terima), termasuk pelunasan kasbon lama. **Kartu Karung:** total `bags_count` menurut tanggal pengambilan.
10. **Rentang filter:** Hari ini; **Mingguan = Senin–Minggu** minggu berjalan; Bulanan = bulan kalender berjalan 💡.
11. **Pendaftaran:** akun baru `pending`, tidak bisa login sampai disetujui admin.

## 4. Prinsip Offline (netral stack)

**Perlu online:** registrasi, login pertama, tindakan admin, sinkronisasi.
**Harus bisa offline:** lihat daftar rumah, catat pengambilan/pembayaran/skip, tambah-edit rumah, lihat Beranda.

- ID dibuat di perangkat (UUID); setiap tabel punya `updated_at`; penghapusan memakai `deleted_at`.
- Catatan pengambilan unik per **(house_id, due_date)**, jadi pembuatan offline tidak menghasilkan duplikat.
- **Pembayaran append-only**: tiap setoran baris baru, aman disinkronkan. Koreksi lewat pembatalan (`voided_at`). 💡
- Karena 1 rumah hanya 1 petugas, bentrok antarpetugas jarang terjadi. Bentrok tersisa (satu petugas di dua perangkat, atau admin memindahkan rumah saat petugas offline): 💡 **perubahan terbaru (`updated_at`) berlaku**, dan bentrok pemindahan rumah diberi pemberitahuan. ⚠️
- Perangkat menyimpan antrean perubahan (`sync_status`: pending / synced / conflict).

## 5. Entity Relationship Diagram (FINAL v1.0)

> Kamus data lengkap (kolom, tipe, constraint, indeks, rumus, aturan sinkronisasi) ada di **`erd-final.md`**. Diagram di bawah sama dengan yang di sana.

```mermaid
erDiagram
    ROLES ||--o{ USER_ROLES : has
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ USERS : "menyetujui"
    USERS ||--o{ HOUSES : "memegang"
    USERS ||--o{ COLLECTION_SESSIONS : "memulai"
    USERS ||--o{ PICKUP_RECORDS : "petugas saat dicatat"
    USERS ||--o{ PAYMENTS : "menerima"
    USERS ||--o{ IMPORT_BATCHES : "mengunggah"
    USERS ||--o{ HOUSE_FEE_HISTORY : "mengubah"
    USERS ||--o{ SETTINGS : "mengatur"
    IMPORT_BATCHES ||--o{ HOUSES : "menghasilkan"
    HOUSES ||--o{ PICKUP_RECORDS : "jatuh tempo"
    HOUSES ||--o{ HOUSE_FEE_HISTORY : "riwayat nominal"
    PICKUP_RECORDS ||--o{ PICKUP_SKIPS : "riwayat skip"
    PICKUP_RECORDS ||--o{ PAYMENTS : "dibayar lewat"

    ROLES {
        uuid id PK
        string name UK "collector, admin"
    }
    USERS {
        uuid id PK
        string full_name
        string email UK
        string password_hash
        string status "pending, approved, rejected"
        uuid approved_by FK "nullable, user admin"
        datetime approved_at
        datetime created_at
        datetime updated_at
    }
    USER_ROLES {
        uuid user_id PK, FK
        uuid role_id PK, FK
    }
    HOUSES {
        uuid id PK
        string owner_name
        string rt
        string gang
        string address_note "opsional"
        uuid collector_id FK "1 rumah = 1 petugas"
        int default_fee "rupiah, default 5000"
        date next_due_date "kursor jatuh tempo berikutnya"
        int interval_days "default 7"
        uuid import_batch_id FK "nullable"
        bool is_active
        datetime created_at
        datetime updated_at
        datetime deleted_at "nullable"
    }
    COLLECTION_SESSIONS {
        uuid id PK
        uuid collector_id FK
        date session_date
        string status "not_started, in_progress, finished"
        datetime started_at
        datetime finished_at
        datetime updated_at
    }
    PICKUP_RECORDS {
        uuid id PK
        uuid house_id FK
        uuid collector_id FK "petugas saat dicatat"
        date due_date "unik bersama house_id"
        string pickup_status "belum_diambil, sudah_diambil"
        datetime picked_at "nullable"
        int bags_count "nullable sampai diambil"
        int fee_amount "rupiah, tagihan catatan ini"
        string payment_status "turunan: belum_bayar, sebagian, lunas"
        datetime created_at
        datetime updated_at
    }
    PICKUP_SKIPS {
        uuid id PK
        uuid record_id FK
        date skip_date
        string reason "wajib"
        datetime created_at
        datetime updated_at
    }
    PAYMENTS {
        uuid id PK
        uuid record_id FK
        uuid received_by FK
        int amount "rupiah, lebih dari 0"
        datetime paid_at
        string note "opsional"
        datetime voided_at "nullable, pembatalan"
        datetime updated_at
    }
    HOUSE_FEE_HISTORY {
        uuid id PK
        uuid house_id FK
        int old_fee
        int new_fee
        uuid changed_by FK
        datetime changed_at
    }
    SETTINGS {
        string key PK "mis. kasbon_limit_amount"
        string value
        uuid updated_by FK
        datetime updated_at
    }
    IMPORT_BATCHES {
        uuid id PK
        uuid uploaded_by FK
        string import_type "houses, schedule"
        string file_name
        string file_type "xlsx, pdf, docx"
        string status "previewed, confirmed, failed"
        int total_rows
        int success_rows
        int failed_rows
        datetime created_at
    }
```

**Ringkasan keputusan skema**
- **Kepemilikan:** `houses.collector_id` satu nilai per rumah (1 rumah 1 petugas); satu petugas bisa memegang banyak rumah. Tidak ada tabel penugasan.
- **Satu `PICKUP_RECORDS` = satu kemunculan jatuh tempo** (house_id + due_date), bertahan lintas hari sampai diambil, sehingga rumah belum diambil dan skip terbawa tanpa mekanisme tambahan. Dua jatuh tempo yang bertumpuk = dua catatan terpisah.
- **Jadwal tetap:** `next_due_date` adalah kursor pembuatan catatan; tanggal ambil tidak menggesernya.
- **Skip** = riwayat per hari (`PICKUP_SKIPS`), bukan status record.
- **Pembayaran** append-only (`PAYMENTS`); `payment_status` turunan; kasbon rumah dihitung.
- **Riwayat nominal** di `HOUSE_FEE_HISTORY`; batas kasbon global di `SETTINGS`.
- Rupiah sebagai bilangan bulat; waktu UTC dengan tanggal bisnis zona lokal (usulan, lihat `erd-final.md` bagian 8).
- Tidak ada tabel kategori/berat, foto, kendala, atau akun warga karena tidak ada di desain.

## 6. Sequence Diagram per Fitur

### F1 — Registrasi

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant A as AuthService
    participant DB as Database
    P->>UI: isi nama, email, password, konfirmasi
    UI->>UI: validasi input
    UI->>A: register(data)
    A->>DB: cek email
    alt email sudah ada
        A-->>UI: error
        UI-->>P: pesan email dipakai
    else baru
        A->>DB: simpan user status=pending, role collector
        A-->>UI: sukses
        UI-->>P: "Menunggu persetujuan admin"
    end
```

### F2 — Login

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant A as AuthService
    participant DB as Database
    P->>UI: isi email & password
    UI->>A: login(email, password)
    A->>DB: cari user + roles
    alt kredensial salah
        A-->>UI: error
        UI-->>P: pesan gagal
    else status pending
        A-->>UI: ditolak sementara
        UI-->>P: "Akun menunggu persetujuan admin"
    else status rejected
        A-->>UI: ditolak
        UI-->>P: "Pendaftaran ditolak"
    else approved
        A-->>UI: sesi + profil
        UI->>UI: simpan data untuk mode offline
        UI-->>P: tampil Beranda (role collector) atau menu admin (role admin)
    end
```

### F3 — Lupa password
⚠️ Ditunda: layar dan mekanisme reset belum ditentukan.

### F4 — Beranda dengan filter Uang dan Karung

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant S as RecordService
    participant DB as Database lokal/server
    P->>UI: buka Beranda
    UI->>S: getSummary(collector, today)
    S->>DB: record milik petugas untuk hari ini
    DB-->>S: data
    S->>S: progres (skip & terbawa masuk penyebut, skip bukan selesai)
    S->>S: karung & uang (filter default Hari ini)
    S-->>UI: ringkasan
    UI-->>P: sapaan, progres, karung, uang
    P->>UI: ganti filter (Hari ini / Mingguan / Bulanan)
    UI->>S: getTotals(collector, range)
    S->>DB: Σ bags_count (picked_at) dan Σ payments (paid_at) pada rentang
    S-->>UI: total karung & uang
    UI-->>P: kedua kartu diperbarui
```
Mingguan = Senin–Minggu.

### F5 — Mulai ambil sampah (jatuh tempo + terbawa)

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant S as RecordService
    participant DB as Database lokal/server
    P->>UI: tekan "Mulai Ambil Sampah"
    UI->>S: startDay(collector, today)
    S->>DB: buat/lanjut sesi hari ini
    S->>DB: ambil rumah milik petugas dengan next_due_date <= today
    loop selama next_due_date <= today
        S->>DB: buat record (house_id, due_date=next_due_date), belum_diambil
        S->>DB: next_due_date += interval_days
    end
    Note over S,DB: record lama yang belum diambil/skip tetap terbuka = terbawa
    S-->>UI: daftar rumah hari ini
    UI-->>P: buka Daftar Rumah
```

### F6 — Daftar rumah + cari

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant S as RecordService
    participant DB as Database lokal/server
    P->>UI: buka Daftar Rumah
    UI->>S: listHouses(collector, today, keyword?)
    S->>DB: record terbuka + diambil hari ini (filter nama/RT/gang)
    DB-->>S: data
    S-->>UI: daftar + status (abu / hijau / merah / kuning)
    UI-->>P: kartu berwarna
    P->>UI: ketik di kolom cari
    UI->>S: listHouses(..., keyword)
    S-->>UI: hasil terfilter
```

### F7 — Catat pengambilan & pembayaran (penuh / sebagian / kasbon)
⚠️ Layar belum didesain; ini usulan alur.

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant S as RecordService
    participant PS as PaymentService
    participant DB as Database lokal
    P->>UI: pilih rumah
    UI-->>P: form: karung, nominal tagihan, uang diterima
    opt ubah nominal tagihan
        P->>UI: edit nominal
        UI->>S: changeDefaultFee(houseId, amount)
        S->>DB: houses.default_fee = amount (seterusnya)
        S->>DB: fee_amount semua record rumah itu yang belum diambil = amount
        S->>DB: catat house_fee_history (lama, baru, petugas, waktu)
    end
    P->>UI: isi uang diterima (penuh / sebagian / 0) lalu simpan
    UI->>S: recordPickup(recordId, bags)
    S->>DB: pickup_status=sudah_diambil, picked_at, bags_count
    opt uang diterima > 0
        UI->>PS: addPayment(recordId, amount)
        PS->>PS: amount = min(amount, sisa catatan)
        PS->>DB: tambah baris payments
    end
    S->>DB: hitung payment_status (lunas / sebagian / belum_bayar)
    S->>DB: hitung kasbon rumah, bandingkan dengan batas global
    opt melampaui batas kasbon
        S-->>UI: peringatan (tidak memblokir)
    end
    S-->>UI: sukses
    UI-->>P: hijau jika lunas, kuning jika sebagian, merah jika kasbon penuh
    UI-->>P: tampil peringatan bila kasbon melebihi batas
```

### F8 — Skip (alasan wajib) dan ubah

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant S as RecordService
    participant DB as Database lokal
    P->>UI: pilih rumah, tekan Skip
    UI-->>P: minta alasan
    P->>UI: isi alasan
    alt alasan kosong
        UI-->>P: tolak, alasan wajib
    else terisi
        UI->>S: skipHouse(recordId, reason)
        S->>DB: tambah/ubah pickup_skips (skip_date = hari ini)
        S-->>UI: sukses
        UI-->>P: kartu kuning (Skip)
    end
    opt ubah kemudian (hari yang sama)
        P->>UI: buka rumah berstatus skip
        UI->>S: updateSkip(recordId, reason) atau recordPickup(...)
        S->>DB: ubah alasan / batalkan skip lalu catat pengambilan
        S-->>UI: sukses
    end
    Note over S,DB: esok hari rumah muncul lagi sebagai terbawa (due_date tetap)
```

### F9 — Tambah / edit rumah, jadwal, nominal default
⚠️ Layar belum didesain.

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant H as HouseService
    participant DB as Database lokal
    P->>UI: tambah rumah baru / edit rumah
    UI-->>P: form nama, RT, gang, tanggal jadwal pertama, interval, nominal default
    P->>UI: simpan
    UI->>H: saveHouse(data)
    H->>DB: simpan rumah (default_fee 5000, interval 7 bila kosong)
    opt rumah baru
        H->>DB: collector_id = petugas pembuat
    end
    opt nominal default berubah
        H->>DB: perbarui record belum diambil + catat house_fee_history
    end
    H-->>UI: sukses
    UI-->>P: rumah muncul di daftar sesuai jadwal
```
Catatan: petugas tidak bisa mengubah `collector_id` rumah yang sudah ada (hanya admin, lihat F15).

### F10 — Import data rumah dan jadwal

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant I as ImportService
    participant DB as Database
    P->>UI: pilih jenis (data rumah / jadwal) dan file (xlsx/pdf/docx)
    UI->>I: upload(file, type)
    I->>I: ekstrak baris (nama, RT, gang, tanggal jadwal, interval, ...)
    I->>I: validasi + deteksi duplikat
    I-->>UI: pratinjau (valid / bermasalah)
    UI-->>P: tampil pratinjau, bisa edit atau buang baris
    P->>UI: konfirmasi
    UI->>I: confirm(batchId)
    alt jenis data rumah
        I->>DB: simpan rumah baru milik pengunggah
    else jenis jadwal
        I->>DB: perbarui next_due_date / interval rumah yang cocok milik pengunggah
    end
    I->>DB: catat import_batches
    I-->>UI: ringkasan sukses/gagal
    UI-->>P: "X berhasil, Y gagal"
```
Catatan: Excel paling andal. PDF/DOCX bergantung format; **pratinjau wajib** sebelum disimpan. 💡 Sediakan template Excel standar. Satu file boleh memuat data rumah sekaligus jadwal.

### F11 — Persetujuan admin

```mermaid
sequenceDiagram
    actor AD as Admin
    participant UI as Aplikasi (role admin)
    participant A as AdminService
    participant DB as Database
    AD->>UI: buka daftar pendaftar pending
    UI->>A: listPending()
    A->>DB: user status=pending
    DB-->>A: data
    A-->>UI: daftar
    AD->>UI: setujui / tolak
    UI->>A: decide(userId, approve|reject)
    A->>DB: status, approved_by, approved_at
    A-->>UI: sukses
```

### F12 — Sinkronisasi offline

```mermaid
sequenceDiagram
    participant UI as Aplikasi (lokal)
    participant Q as Antrean Sinkron
    participant SV as Server
    UI->>Q: simpan perubahan (sync_status=pending)
    Note over UI,Q: bekerja tanpa sinyal
    UI->>SV: kirim antrean saat online
    SV->>SV: payments ditambahkan apa adanya (append-only)
    SV->>SV: ubahan lain dibandingkan lewat updated_at
    alt tidak bentrok
        SV-->>UI: diterima, sync_status=synced
    else bentrok (mis. rumah dipindahkan admin)
        SV-->>UI: konflik
        UI-->>UI: tandai conflict, beri tahu petugas
    end
    SV-->>UI: kirim perubahan terbaru (rumah, jadwal, record, pengaturan)
```

### F13 — Pelunasan kasbon (petugas memilih catatan)
⚠️ Layar belum didesain.

```mermaid
sequenceDiagram
    actor P as Petugas
    participant UI as Aplikasi
    participant PS as PaymentService
    participant DB as Database lokal
    P->>UI: buka rumah yang punya sisa (kasbon)
    UI->>PS: getOutstanding(houseId)
    PS->>DB: record diambil dengan fee − pembayaran > 0
    DB-->>PS: daftar sisa per catatan
    PS-->>UI: total sisa + rincian per catatan
    UI-->>P: tampil rincian kasbon
    P->>UI: pilih catatan yang dilunasi, isi uang diterima
    UI->>PS: addPayment(recordId, amount)
    PS->>PS: amount = min(amount, sisa catatan terpilih)
    PS->>DB: tambah baris payments (paid_at = sekarang)
    PS->>DB: perbarui payment_status
    PS-->>UI: sukses
    UI-->>P: sisa diperbarui, masuk ke kartu Uang
```
Uang diterima yang melebihi sisa catatan terpilih **dibatasi sebesar sisa**; aplikasi memberi tahu petugas jumlah yang benar-benar dicatat.

### F14 — Rekap uang
⚠️ Ditunda sampai layar ikon ke-4 didesain.

### F15 — Admin memindahkan rumah

```mermaid
sequenceDiagram
    actor AD as Admin
    participant UI as Aplikasi (role admin)
    participant A as AdminService
    participant DB as Database
    AD->>UI: pilih rumah, pilih petugas tujuan
    UI->>A: reassignHouse(houseId, collectorId)
    A->>DB: cek petugas tujuan berstatus approved
    A->>DB: houses.collector_id = tujuan
    A->>DB: record terbuka rumah itu ikut pindah ke petugas tujuan
    A-->>UI: sukses
    UI-->>AD: rumah kini milik petugas tujuan
    Note over A,DB: petugas asal menerima perubahan saat sinkronisasi berikutnya
```
💡 Catatan terbuka ikut pindah supaya tidak tertinggal di petugas lama; catatan yang sudah diambil tetap atas nama petugas saat itu.

### F16 — Admin mengatur batas kasbon

```mermaid
sequenceDiagram
    actor AD as Admin
    participant UI as Aplikasi (role admin)
    participant A as AdminService
    participant DB as Database
    AD->>UI: buka pengaturan batas kasbon
    UI->>A: getSettings()
    A->>DB: baca settings
    DB-->>A: nilai saat ini
    A-->>UI: tampil nilai
    AD->>UI: ubah nilai, simpan
    UI->>A: setKasbonLimit(value)
    A->>DB: simpan settings (updated_by, updated_at)
    A-->>UI: sukses
    Note over A,DB: perangkat petugas menerima nilai baru saat sinkronisasi
```

## 7. Class Diagram (keseluruhan)

```mermaid
classDiagram
    class User {
        +uuid id
        +string fullName
        +string email
        +UserStatus status
        +hasRole(name) bool
    }
    class Role {
        +uuid id
        +string name
    }
    class House {
        +uuid id
        +string ownerName
        +string rt
        +string gang
        +decimal defaultFee
        +date nextDueDate
        +int intervalDays
        +changeDefaultFee(amount, userId)
        +reassign(collectorId)
        +outstanding() decimal
    }
    class HouseFeeHistory {
        +uuid id
        +decimal oldFee
        +decimal newFee
        +datetime changedAt
    }
    class CollectionSession {
        +uuid id
        +date sessionDate
        +SessionStatus status
        +start()
        +finish()
    }
    class PickupRecord {
        +uuid id
        +date dueDate
        +PickupStatus pickupStatus
        +datetime pickedAt
        +int bagsCount
        +decimal feeAmount
        +decimal paidTotal()
        +decimal outstanding()
        +PaymentStatus paymentStatus()
        +bool isCarriedOver(today)
        +markPicked(bags)
    }
    class PickupSkip {
        +uuid id
        +date skipDate
        +string reason
        +updateReason(reason)
    }
    class Payment {
        +uuid id
        +decimal amount
        +datetime paidAt
        +string note
        +datetime voidedAt
        +void()
    }
    class Setting {
        +string key
        +string value
    }
    class ImportBatch {
        +uuid id
        +string importType
        +string fileType
        +ImportStatus status
    }
    class AuthService {
        +register(data)
        +login(email, password)
        +logout()
    }
    class AdminService {
        +listPending()
        +decide(userId, approve)
        +reassignHouse(houseId, collectorId)
        +getSettings()
        +setKasbonLimit(value)
    }
    class HouseService {
        +saveHouse(data)
        +changeDefaultFee(houseId, amount)
    }
    class RecordService {
        +getSummary(collectorId, date)
        +getTotals(collectorId, range)
        +startDay(collectorId, date)
        +listHouses(collectorId, date, keyword)
        +recordPickup(recordId, data)
        +skipHouse(recordId, reason)
        +updateSkip(recordId, reason)
    }
    class PaymentService {
        +addPayment(recordId, amount)
        +voidPayment(paymentId)
        +getOutstanding(houseId)
    }
    class ImportService {
        +upload(file, type)
        +preview(batchId)
        +confirm(batchId)
    }
    class SyncService {
        +queueChange(change)
        +push()
        +pull()
        +resolveConflict(change)
    }

    User "*" -- "*" Role
    User "1" -- "*" House : collector
    User "1" -- "*" CollectionSession
    House "1" -- "*" PickupRecord
    House "1" -- "*" HouseFeeHistory
    PickupRecord "1" *-- "*" PickupSkip
    PickupRecord "1" *-- "*" Payment
    User "1" -- "*" Payment : receivedBy
    User "1" -- "*" ImportBatch
    ImportBatch "1" -- "*" House
    AuthService ..> User
    AdminService ..> User
    AdminService ..> House
    AdminService ..> Setting
    HouseService ..> House
    HouseService ..> HouseFeeHistory
    RecordService ..> PickupRecord
    RecordService ..> PickupSkip
    PaymentService ..> Payment
    ImportService ..> ImportBatch
    ImportService ..> HouseService
    SyncService ..> PickupRecord
    SyncService ..> Payment
```

## 8. Pertanyaan Terbuka

**Admin dan akses:**
1. **Admin pertama:** bagaimana akun admin pertama dibuat? 💡 Disiapkan manual saat setup awal (seed), lalu admin berikutnya diberi role oleh admin yang sudah ada. (Admin sudah diputuskan sebagai role di aplikasi yang sama.)

**Skip dan data:**
2. **Alasan skip:** teks bebas atau pilihan baku + "lainnya"?
3. **Batas pengeditan** skip dan pembayaran: kapan saja atau dikunci setelah hari berganti? Salah input uang: setuju dikoreksi lewat pembatalan (void)?
4. **Import:** kolom apa di file sumber, termasuk kolom jadwal? Perlu **contoh file** Excel/PDF/DOCX. Duplikat rumah: lewati, timpa, atau tanya?
5. **Peringatan kasbon:** muncul saat mencatat pengambilan rumah itu (usulan saya), atau rumah berkasbon tinggi juga ditandai di daftar rumah?

**Offline:**
6. Berapa lama boleh offline, dan perlu login ulang setelah sekian hari?

**Sudah diputuskan untuk dikerjakan nanti (bukan pertanyaan terbuka):** kode warna nuansa merah Skip, serta label dan layar ikon navigasi 1, 2, 4 (mengikuti tema UI yang ada).

## 9. Langkah Berikutnya

1. Tinjau dan setujui `erd-final.md`, terutama asumsi bagian 8 (rupiah bulat, zona waktu, cache `payment_status`, dan lainnya).
2. Rancang layar yang belum ada mengikuti tema UI (form catat & bayar, kasbon, tambah/edit rumah, import, layar ikon 1, 2, 4, **layar admin**) dan perbarui Daftar Rumah di Figma.
3. Jawab pertanyaan sisa, terutama contoh file import (no. 4) karena bisa menambah kolom di `HOUSES`.
4. Pilih tech stack, lalu eksekusi kode.
