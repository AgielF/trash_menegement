# Playbook Agentic AI — Frontend Bersihku

> Dokumen ini disiapkan **sebelum eksekusi**. Isinya: (1) master prompt untuk agen, (2) standar industri + pakar + cara menegakkannya, (3) template konfigurasi, (4) Definition of Done, (5) keputusan yang menunggu persetujuan Anda.
> Tidak ada kode aplikasi yang dibuat di sini; hanya prompt dan template.
> ⚠️ = belum diverifikasi, agen wajib mengecek. 💡 = rekomendasi saya, butuh persetujuan.

## 0. Cara Pakai

1. Salin **bagian 1 (Master Prompt)** ke `frontend/AGENTS.md` (atau `CLAUDE.md` bila memakai Claude Code) agar dibaca agen di setiap sesi.
2. Simpan dokumen ini sebagai `docs/agentic-frontend-playbook.md` di repo supaya agen bisa merujuk template bagian 3.
3. Putuskan dulu butir di **bagian 5** sebelum agen mulai memasang dependensi.
4. Minta agen bekerja per fase (Recon → Rencana → Implementasi → Verifikasi → Laporan). Jangan izinkan agen langsung menulis kode di sesi pertama.

---

## 1. Master Prompt untuk Agen

```text
PERAN
Kamu adalah senior frontend engineer dan reviewer keamanan untuk aplikasi PWA "Bersihku"
(pemungutan sampah, sisi petugas dan admin). Kamu bekerja di folder /frontend. Kualitas,
keamanan, dan keterbacaan lebih penting daripada kecepatan.

KONTEKS (tetap, jangan diubah tanpa izin)
- Backend (/backend): NestJS + TypeScript + Prisma + PostgreSQL. SUDAH SELESAI dan teruji.
  Jangan mengubah backend kecuali ada bug kritis; jika ada, berhenti dan laporkan.
- Frontend: React + TypeScript + Vite, Tailwind CSS, Dexie.js (IndexedDB, offline-first PWA),
  Zustand, Axios.
- Dokumen acuan di repo: erd-final.md, planning-aplikasi-sampah.md, docs/agentic-frontend-playbook.md.
- Role: "collector" (petugas) dan "admin" dalam satu aplikasi; menu mengikuti role.
- UI mobile-first mengikuti Figma: header hijau melengkung, kartu bersudut membulat,
  tombol pil, bottom navigation 4 ikon (ikon harus persis seperti Figma).

ATURAN BISNIS (tidak boleh dilanggar)
1. Semua tanggal bisnis (jatuh tempo, skip, "hari ini", rentang mingguan Senin-Minggu,
   bulanan) memakai WIB (Asia/Jakarta, UTC+7), bukan zona waktu perangkat. Gunakan satu
   util tanggal terpusat; dilarang memakai new Date() mentah untuk logika bisnis.
2. Pembayaran append-only. Koreksi = void (voidedAt), tidak ada edit/hapus. Jumlah bayar
   tidak boleh melebihi sisa tagihan; UI membatasi, server tetap penentu.
3. Jadwal mingguan tetap: jadwal Senin diambil Rabu, berikutnya tetap Senin depan.
4. Skip wajib alasan. Rumah belum diambil dan rumah skip terbawa ke hari berikutnya.
5. Offline-first: tulis ke Dexie dulu, antrekan ke outbox, sinkron ke /sync/push saat
   online, tarik perubahan lewat /sync/pull. ID dibuat di klien (UUID) agar idempoten.
6. Satu rumah hanya satu petugas; kepemilikan dicek server (IDOR). Frontend tidak boleh
   menjadi satu-satunya penjaga otorisasi.

ALUR KERJA WAJIB
Fase 0 - RECON (hanya baca): baca /backend (controller, DTO, Swagger bila ada, schema
  Prisma), erd-final.md, dan file konfigurasi frontend yang ada. Catat kontrak API nyata.
  DILARANG menebak path endpoint, nama field, atau bentuk respons.
Fase 1 - RENCANA: tulis rencana tertulis: file yang akan dibuat/diubah, dependensi baru
  (dengan alasan), risiko, dan pertanyaan. BERHENTI dan tunggu persetujuan sebelum
  memasang dependensi atau menulis kode.
Fase 2 - IMPLEMENTASI: kerjakan dalam irisan vertikal kecil (satu fitur utuh per commit:
  UI + state + API + test). Jangan menumpuk perubahan besar tanpa verifikasi.
Fase 3 - VERIFIKASI: jalankan "npm run verify" (typecheck, lint, format check, test,
  build). Perbaiki sampai hijau. Jangan menonaktifkan aturan lint atau mengecilkan test
  agar lolos.
Fase 4 - LAPORAN: setiap tugas diakhiri laporan: apa yang diubah, bukti verifikasi
  (perintah + hasil), asumsi, hal yang belum dikerjakan, dan keputusan yang perlu manusia.

BERHENTI DAN TANYA JIKA
- Kontrak API tidak jelas atau berbeda dari dokumen.
- Perlu dependensi di luar daftar yang disetujui.
- Perlu mengubah backend, skema database, atau konfigurasi keamanan.
- Ada trade-off keamanan (mis. tempat menyimpan token, kebijakan CSP).
- Desain Figma untuk layar yang diminta belum ada. Jangan mengarang; buat placeholder
  jelas atau minta desain.
- Instruksi bertentangan satu sama lain.

STANDAR KODE
- TypeScript strict. Dilarang: any, @ts-ignore, non-null assertion (!) tanpa alasan.
  Gunakan unknown + type guard / validasi skema untuk data dari luar.
- Semua respons API divalidasi saat runtime dengan skema (zod) sebelum dipakai.
- Struktur feature-first (lihat template). Komponen kecil, satu tanggung jawab.
  Abstraksi baru hanya setelah pola muncul minimal 3 kali (hindari abstraksi prematur).
- Tidak ada logika bisnis di komponen UI; letakkan di fungsi murni yang bisa dites.
- Tidak ada string ajaib: status, role, path, dan label berasal dari konfigurasi terpusat.
- Nama: jelas, bahasa Inggris untuk kode, bahasa Indonesia untuk teks UI.
- Komentar menjelaskan "mengapa", bukan "apa".

KEAMANAN (acuan: OWASP ASVS v5.0.0, OWASP Top 10:2025)
- Dilarang: dangerouslySetInnerHTML, innerHTML, eval, new Function, skrip pihak ketiga
  tanpa izin, inline script/style yang melanggar CSP.
- Dilarang menaruh rahasia di frontend. Hanya variabel VITE_ publik; divalidasi saat start.
- Jangan log token, password, atau data pribadi. Jangan simpan password dalam bentuk apa pun.
- Akses localStorage/sessionStorage hanya lewat satu modul penyimpanan terpusat.
- Cek peran di UI hanya untuk pengalaman pengguna; otorisasi sebenarnya di backend.
- Dependensi: pasang versi pasti (exact), lockfile wajib di-commit, hindari rilis yang
  masih baru (kurang dari 14 hari), jalankan audit, jangan menambah paket untuk hal sepele.
- Kredensial uji tidak boleh ada di source atau test yang di-commit; pakai env/secret CI.
- Data warga (nama, alamat, nominal) adalah data pribadi: simpan seminimal mungkin di
  Dexie dan bersihkan saat logout setelah outbox kosong.

OFFLINE / PWA
- Service worker hanya meng-cache aset statis (app shell). Respons API TIDAK di-cache
  oleh service worker; sumber data offline adalah Dexie.
- Jangan mengandalkan navigator.onLine sebagai kebenaran; anggap gagal-request sebagai
  offline. Pemicu sinkron: app start, event online, interval saat aplikasi terbuka, tombol manual.
- Skema Dexie hanya boleh ditambah versi baru (dengan migrasi); jangan mengedit versi lama.
- Jangan logout otomatis bila outbox masih berisi data belum terkirim; peringatkan pengguna.
- Konflik sinkron ditampilkan ke pengguna, bukan ditimpa diam-diam.

AKSESIBILITAS & UX (WCAG 2.2 AA)
- Semua kontrol bisa dipakai dengan keyboard dan pembaca layar; label, fokus terlihat,
  kontras cukup, target sentuh minimal 24x24 px (rekomendasi 44x44 untuk mobile).
- Status tidak boleh hanya dibedakan lewat warna: selalu ada label teks (terutama dua
  status merah: Skip dan Belum bayar).
- Tampilkan status memuat, kosong, galat, dan offline untuk setiap layar data.

TESTING
- Logika murni (util WIB, status kartu, hitung sisa, filter rentang): unit test.
- Layar dan alur: Testing Library + MSW (mock API tervalidasi skema).
- Alur kritis end-to-end (login, mulai ambil, catat, bayar, skip, offline lalu sinkron):
  Playwright.
- Uji perilaku, bukan implementasi. Bug baru wajib punya test regresi.

GIT
- Conventional Commits. Satu perubahan logis per commit. Jangan commit .env, dist, coverage.
- Jangan force-push, jangan ubah riwayat, jangan sentuh /backend dalam commit frontend.

KELUARAN
Bahasa Indonesia, ringkas, jujur. Jangan mengklaim sesuatu "sudah teruji" tanpa menjalankan
perintahnya. Jika tidak bisa memverifikasi, katakan terus terang.
```

---

## 2. Standar Industri, Pakar, dan Cara Menegakkan

Kolom **Gate** = cara standar itu _dipaksakan_ (otomatis bila memungkinkan), bukan sekadar dianjurkan.

| Area                      | Standar / praktik                                                                                                                                                                                          | Pakar atau otoritas                                                                                                                                    | Penerapan di proyek                                                                           | Gate                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Keamanan aplikasi         | **OWASP ASVS v5.0.0** (Mei 2025), level 2 sebagai target                                                                                                                                                   | Tim proyek OWASP ASVS (pemimpin: Daniel Cuthbert, Elar Lang, Josh Grossman)                                                                            | Checklist keamanan per fitur; rujuk requirement dengan format `v5.0.0-<bab>.<bagian>.<nomor>` | Review keamanan di PR; checklist bagian 4                        |
| Risiko utama web          | **OWASP Top 10:2025** (A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, plus kategori baru Mishandling of Exceptional Conditions) | OWASP Foundation                                                                                                                                       | Otorisasi di server; CSP; dependensi terkunci; penanganan galat terpusat                      | CI audit, lint keamanan, review                                  |
| XSS dan penyimpanan klien | OWASP **XSS Prevention** dan **HTML5 Security** Cheat Sheet                                                                                                                                                | Komunitas OWASP; Jim Manico (pegiat OWASP, penulis cheat sheet XSS)                                                                                    | Tanpa `dangerouslySetInnerHTML`; storage lewat satu modul                                     | Lint (`no-restricted-syntax`, `no-unsanitized`)                  |
| Content Security Policy   | **Strict CSP** + Trusted Types                                                                                                                                                                             | Mike West (editor spesifikasi CSP), Lukas Weichselbaum (Google, strict CSP)                                                                            | Header CSP produksi, mulai dari Report-Only                                                   | Uji header di CI/staging                                         |
| Rantai pasok              | **OpenSSF Scorecard**, praktik SLSA, lockfile + `npm ci`                                                                                                                                                   | OpenSSF (Linux Foundation)                                                                                                                             | Versi exact, Dependabot, audit, hindari rilis < 14 hari                                       | `npm ci`, `npm audit`, Dependabot                                |
| Aksesibilitas             | **WCAG 2.2 AA** (Rekomendasi W3C Okt 2023; diadopsi sebagai ISO/IEC 40500:2025), WAI-ARIA Authoring Practices                                                                                              | W3C WAI (Accessibility Guidelines WG); Léonie Watson, Adrian Roselli, Heydon Pickering (_Inclusive Components_), Sara Soueidan                         | Komponen aksesibel, label teks status, fokus terlihat                                         | `eslint-plugin-jsx-a11y`, uji keyboard manual, axe di Playwright |
| Kualitas produk           | **ISO/IEC 25010** (maintainability, security, reliability, usability, compatibility)                                                                                                                       | ISO/IEC                                                                                                                                                | Dipakai sebagai rubrik review, bukan alat otomatis                                            | Checklist Definition of Done                                     |
| Kode bersih               | **Clean Code**, SOLID, refactoring                                                                                                                                                                         | Robert C. Martin, Martin Fowler (_Refactoring_), Kent Beck                                                                                             | Fungsi kecil, tanggung jawab tunggal, logika murni terpisah dari UI                           | Review, lint kompleksitas                                        |
| Reusability yang sehat    | **AHA / Rule of Three**: tunda abstraksi sampai pola muncul                                                                                                                                                | Kent C. Dodds (AHA), Sandi Metz ("duplikasi lebih murah daripada abstraksi yang salah")                                                                | Primitif UI hanya setelah dipakai ≥ 3 kali                                                    | Review                                                           |
| Arsitektur frontend       | **Feature-first** + aturan arah dependensi                                                                                                                                                                 | Alan Alickovic (_Bulletproof React_); komunitas Feature-Sliced Design                                                                                  | `app` → `features` → `shared`; feature tidak mengimpor `app`                                  | `no-restricted-imports` (atau `eslint-plugin-boundaries`)        |
| TypeScript                | `strict` + `noUncheckedIndexedAccess`; validasi data di batas sistem                                                                                                                                       | Anders Hejlsberg (pencipta TS), Matt Pocock (_Total TypeScript_), Dan Vanderkam (_Effective TypeScript_), Josh Goldberg (maintainer typescript-eslint) | Tanpa `any`; zod di setiap respons API                                                        | `tsc -b`, `strictTypeChecked`                                    |
| Validasi runtime          | Skema sebagai satu sumber kebenaran tipe                                                                                                                                                                   | Colin McDonnell (zod)                                                                                                                                  | `z.infer` untuk tipe; kontrak API divalidasi                                                  | Test kontrak + MSW                                               |
| Konfigurasi               | **Twelve-Factor App** (config di lingkungan)                                                                                                                                                               | Adam Wiggins                                                                                                                                           | `.env` + validasi saat start, tanpa rahasia                                                   | Skema env gagal-cepat                                            |
| Offline-first             | **Local-first software**, Offline Cookbook, outbox/idempotensi                                                                                                                                             | Ink & Switch (Martin Kleppmann dkk.); Jake Archibald (_The Offline Cookbook_); David Fahlander (pencipta Dexie); tim Workbox (Google)                  | Dexie = sumber data; outbox + ID klien; SW hanya aset statis                                  | E2E offline di Playwright                                        |
| Performa                  | **Core Web Vitals** (LCP ≤ 2,5 dtk, INP ≤ 200 ms, CLS ≤ 0,1), pola render                                                                                                                                  | Addy Osmani, Philip Walton, Barry Pollard (web.dev); Lydia Hallie (patterns.dev)                                                                       | Code-splitting per rute, aset ringan, hindari re-render berlebih                              | Lighthouse CI (opsional)                                         |
| Pengujian                 | **Testing Trophy**, uji perilaku                                                                                                                                                                           | Kent C. Dodds (Testing Library); Anthony Fu dkk. (Vitest); Artem Zakharchenko (MSW); tim Playwright (Microsoft)                                        | Unit murni + integrasi dengan MSW + E2E alur kritis                                           | Coverage threshold, CI                                           |
| Desain sistem             | Design tokens, atomic design, token W3C                                                                                                                                                                    | Brad Frost (_Atomic Design_); W3C Design Tokens Community Group                                                                                        | Token tema di CSS; komponen primitif dari token                                               | Review visual vs Figma                                           |
| Mobile-first              | Rancang dari layar kecil dulu                                                                                                                                                                              | Luke Wroblewski (_Mobile First_)                                                                                                                       | Tata letak satu kolom, target sentuh besar                                                    | Uji viewport 360 px                                              |
| Versi dan riwayat         | **Semantic Versioning**, **Conventional Commits 1.0**, Keep a Changelog, trunk-based development                                                                                                           | Tom Preston-Werner (SemVer), Olivier Lacan (Keep a Changelog), Paul Hammant (trunk-based)                                                              | Commit konvensional, cabang pendek, PR kecil                                                  | commitlint, CI                                                   |
| Data pribadi              | Minimisasi data; **UU No. 27/2022 tentang Pelindungan Data Pribadi** (Indonesia)                                                                                                                           | Pemerintah RI (⚠️ bukan nasihat hukum; minta tinjauan bila diperlukan)                                                                                 | Simpan seminimal mungkin di perangkat, bersihkan saat logout                                  | Review                                                           |

**Cara membaca "standarisasi":** standar di tabel hanya berguna bila ada _gate_ yang gagal ketika dilanggar. Karena itu setiap standar di atas dipetakan ke alat (lint, tsc, test, CI) atau ke checklist review yang wajib.

---

## 3. Template Konfigurasi

> Semua template adalah **titik awal**. Versi paket sengaja tidak dipatok di sini. Per 7 Nov 2026, scaffold React + Vite umumnya memakai React 19, Vite 8, TypeScript 6, Tailwind CSS 4, dan ESLint 10 (flat config). Agen wajib membaca dokumentasi versi yang terpasang karena **nama preset plugin sering berubah antar versi**.

### 3.1 Struktur folder (feature-first) 💡

```text
frontend/
  AGENTS.md                      # master prompt
  docs/                          # playbook, keputusan arsitektur (ADR)
  src/
    app/                         # entry, providers, router, error boundary, styles global
    config/                      # env.ts, navigation.ts, status.ts (config terpusat)
    features/
      auth/                      # login, register, session store
        api/  components/  hooks/  store/  schemas/  index.ts
      pickups/                   # beranda, daftar rumah, catat, skip
      payments/                  # bayar, kasbon, void
      houses/                    # tambah/edit, import
      admin/                     # persetujuan, pindah rumah, batas kasbon
      sync/                      # outbox, push/pull, konflik
    shared/
      api/                       # http client, ApiError, helper kontrak
      components/ui/             # primitif: Button, TextField, Card, StatusBadge ...
      db/                        # skema Dexie, helper
      lib/                       # date (WIB), money, storage, id
      hooks/
    test/                        # setup, util test, handler MSW
  e2e/                           # Playwright
```

**Aturan dependensi (searah, satu arah):** `app` boleh mengimpor `features` dan `shared`; `features` boleh mengimpor `shared`; `shared` tidak mengimpor `features` atau `app`. Setiap feature mengekspor hanya lewat `index.ts` (API publiknya).

> Handoff awal menyebut struktur datar (`src/api`, `components`, `pages`, `store`, `db`, `routes`). Feature-first adalah rekomendasi saya karena lebih mudah diskalakan; lihat keputusan D2 di bagian 5.

### 3.2 `package.json` (skrip) dan `.npmrc`

```json
{
  "engines": { "node": ">=20.19" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "audit:prod": "npm audit --omit=dev --audit-level=high",
    "verify": "npm run typecheck && npm run lint && npm run format:check && npm run test && npm run build"
  }
}
```

```ini
# .npmrc
save-exact=true
engine-strict=true
fund=false
```

Tambahkan `.nvmrc` berisi versi Node LTS yang dipakai. ⚠️ Rentang Node minimum mengikuti persyaratan versi Vite yang terpasang.

### 3.3 `tsconfig` (tambahan pada template Vite)

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
  },
}
```

Pasang alias yang sama di `vite.config.ts`: `resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }`. `erasableSyntaxOnly` melarang `enum` dan parameter-property; pakai union literal dan field biasa.

### 3.4 `eslint.config.js` (flat config) ⚠️

```js
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import noUnsanitized from 'eslint-plugin-no-unsanitized'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage', 'playwright-report']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended, // ⚠️ nama preset bergantung versi plugin; cek README
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended, // ⚠️ cek kompatibilitas dengan ESLint yang terpasang
      noUnsanitized.configs.recommended, // ⚠️ idem
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Dilarang: risiko XSS. Gunakan JSX/teks biasa.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Gunakan modul shared/lib/storage.' },
        { name: 'sessionStorage', message: 'Gunakan modul shared/lib/storage.' },
      ],
    },
  },
  // Penyimpanan terpusat boleh memakai storage langsung
  { files: ['src/shared/lib/storage.ts'], rules: { 'no-restricted-globals': 'off' } },
  // Batas arsitektur
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@/features/*', '@/app/*'] }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@/app/*'] }],
    },
  },
  // File konfigurasi tidak ikut type-aware linting
  { files: ['**/*.config.{js,ts,mjs}'], extends: [tseslint.configs.disableTypeChecked] },
])
```

Catatan: larangan "feature tidak mengimpor feature lain" butuh `eslint-plugin-boundaries` atau `import-x/no-restricted-paths` (zona per feature). Pasang hanya bila disetujui (D3).

### 3.5 Prettier dan EditorConfig

```json
// .prettierrc.json
{ "semi": false, "singleQuote": true, "trailingComma": "all", "printWidth": 100 }
```

```ini
# .editorconfig
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

### 3.6 Konfigurasi lingkungan tervalidasi (`src/config/env.ts`)

```ts
import { z } from 'zod'

const EnvSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
})

const parsed = EnvSchema.safeParse(import.meta.env)
if (!parsed.success) {
  const detail = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  throw new Error(`Konfigurasi lingkungan tidak valid: ${detail}`)
}

/** Hanya variabel VITE_ (publik). Jangan pernah menaruh rahasia di sini. */
export const env = parsed.data
```

Sertakan `.env.example` (di-commit) dan pastikan `.env*` selain contoh ada di `.gitignore`.

### 3.7 HTTP client yang reusable dan tervalidasi (`src/shared/api/http.ts`)

```ts
import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { env } from '@/config/env'

export class ApiError extends Error {
  readonly status: number | null
  readonly code: string | null
  constructor(message: string, status: number | null, code: string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface HttpHooks {
  getToken: () => string | null
  onUnauthorized: () => void
  /** Request auth (login/register) tidak memicu onUnauthorized. */
  isAuthRequest: (url: string) => boolean
}

let hooks: HttpHooks = {
  getToken: () => null,
  onUnauthorized: () => undefined,
  isAuthRequest: () => false,
}

/** Dipanggil sekali di app/ untuk menyambungkan store tanpa impor melingkar. */
export function configureHttp(next: HttpHooks): void {
  hooks = next
}

export const http = axios.create({ baseURL: env.VITE_API_URL, timeout: 15_000 })

http.interceptors.request.use((config) => {
  const token = hooks.getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error)
  const status = error.response?.status ?? null
  if (status === 401 && !hooks.isAuthRequest(error.config?.url ?? '')) hooks.onUnauthorized()
  const data: unknown = error.response?.data
  const message =
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
      ? data.message
      : status === null
        ? 'Tidak dapat terhubung ke server.'
        : 'Permintaan gagal.'
  return Promise.reject(new ApiError(message, status, error.code ?? null))
})

/** Respons selalu divalidasi skema; ketidakcocokan kontrak langsung terdeteksi. */
export async function request<S extends z.ZodType>(
  config: AxiosRequestConfig,
  schema: S,
): Promise<z.infer<S>> {
  const response = await http.request<unknown>(config)
  return schema.parse(response.data)
}
```

### 3.8 Konfigurasi dinamis: navigasi per role dan tampilan status

```ts
// src/config/navigation.ts  (⚠️ label dan ikon mengikuti Figma; ikon 1, 2, 4 belum didesain)
export type Role = 'admin' | 'collector'

export interface NavItem {
  to: string
  label: string
  roles: readonly Role[]
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'TODO-sesuai-Figma', roles: ['collector'] },
  { to: '/rumah', label: 'Rumah', roles: ['collector'] }, // layar Daftar Rumah sudah ada
  { to: '/admin', label: 'Admin', roles: ['admin'] },
]

export const navFor = (roles: readonly Role[]): NavItem[] =>
  NAV_ITEMS.filter((item) => item.roles.some((r) => roles.includes(r)))
```

```ts
// src/config/status.ts  — satu sumber kebenaran untuk status kartu rumah
export type DisplayStatus = 'belum_diambil' | 'skip' | 'lunas' | 'sebagian' | 'kasbon'

export const STATUS_PRESENTATION: Record<DisplayStatus, { label: string; className: string }> = {
  belum_diambil: { label: 'Belum diambil', className: 'bg-status-belum' },
  lunas: { label: 'Sudah diambil · Lunas', className: 'bg-status-lunas' },
  sebagian: { label: 'Sudah diambil · Bayar sebagian', className: 'bg-status-sebagian' },
  kasbon: { label: 'Sudah diambil · Belum bayar', className: 'bg-status-kasbon' },
  skip: { label: 'Skip', className: 'bg-status-skip' },
}

// Aturan turunan (lihat erd-final.md bagian 4). Nama field disesuaikan dengan kontrak API nyata.
export function deriveDisplayStatus(input: {
  picked: boolean
  skippedToday: boolean
  paidTotal: number
  fee: number
}): DisplayStatus {
  if (!input.picked) return input.skippedToday ? 'skip' : 'belum_diambil'
  if (input.paidTotal >= input.fee) return 'lunas'
  return input.paidTotal > 0 ? 'sebagian' : 'kasbon'
}
```

Kelas Tailwind ditulis utuh di dalam literal agar terdeteksi saat build. Dua status merah (Kasbon dan Skip) harus beda nuansa **dan** selalu disertai label teks.

### 3.9 Offline-first: Dexie dan outbox (`src/shared/db/db.ts`)

```ts
import Dexie, { type EntityTable } from 'dexie'

export interface OutboxItem {
  id: string // UUID dibuat di klien = kunci idempotensi
  entity: string
  op: 'create' | 'update' | 'void'
  payload: unknown
  createdAt: number
  attempts: number
  status: 'pending' | 'sending' | 'failed' | 'conflict'
  lastError?: string
}

export interface MetaItem {
  key: string
  value: string
}

class BersihkuDB extends Dexie {
  outbox!: EntityTable<OutboxItem, 'id'>
  meta!: EntityTable<MetaItem, 'key'>
  // Tabel domain (houses, pickupRecords, payments) mengikuti kontrak /sync/pull nyata.
  // Indeks mengikuti pola kueri (mis. [collectorId+dueDate]) — lihat erd-final.md bagian 3.

  constructor() {
    super('bersihku')
    this.version(1).stores({
      outbox: 'id, status, createdAt',
      meta: 'key',
    })
  }
}

export const db = new BersihkuDB()
```

Aturan: versi skema hanya **ditambah** (dengan `.upgrade()` bila perlu), tidak pernah mengedit versi lama. Logout menghapus tabel domain **hanya jika outbox kosong**; bila tidak, tampilkan peringatan. Konflik dari `/sync/push` ditandai `conflict` dan ditampilkan ke pengguna.

### 3.10 PWA (`vite-plugin-pwa`)

```ts
VitePWA({
  registerType: 'prompt', // pengguna memilih saat ada versi baru, hindari reload paksa saat input
  workbox: {
    cleanupOutdatedCaches: true,
    navigateFallback: '/index.html',
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
    runtimeCaching: [], // JANGAN cache respons API; sumber data offline = Dexie
  },
  manifest: {
    name: 'Bersihku',
    short_name: 'Bersihku',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#00dc5a', // ⚠️ ganti dengan warna resmi Figma
    background_color: '#eff5f3',
    icons: [/* 192, 512, dan maskable — diekspor dari logo Figma */],
  },
})
```

Catatan: Background Sync tidak tersedia di semua browser (terutama iOS Safari), jadi sinkron dipicu dari aplikasi (start, event `online`, interval, tombol manual), bukan hanya dari service worker.

### 3.11 Header keamanan produksi dan CSP

Terapkan di server/hosting (bukan hanya `<meta>`). **Mulai dengan `Content-Security-Policy-Report-Only`**, perbaiki pelanggaran, baru ubah ke mode penegakan.

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://API-ORIGIN-ANDA;
  worker-src 'self';
  manifest-src 'self';
  object-src 'none';
  base-uri 'none';
  form-action 'self';
  frame-ancestors 'none';
  require-trusted-types-for 'script'   # uji dulu di Report-Only; sebagian pustaka bisa gagal
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains   # hanya bila seluruh subdomain HTTPS
```

Konsekuensi: atribut `style={{...}}` inline di React dibatasi `style-src`/`style-src-attr`; gunakan kelas Tailwind. Backend harus mengizinkan origin frontend pada CORS dengan daftar eksplisit (tanpa `*`).

### 3.12 Pengujian (Vitest, Testing Library, MSW, Playwright)

```ts
// bagian vite.config.ts
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  css: false,
  coverage: {
    provider: 'v8',
    include: ['src/shared/lib/**', 'src/config/**', 'src/features/**/*.{ts,tsx}'],
    thresholds: { lines: 80, functions: 80, branches: 70 },
  },
}
```

Strategi (Testing Trophy): banyak unit test untuk logika murni, integrasi (Testing Library + MSW) untuk layar, E2E Playwright hanya alur kritis: login, mulai ambil, catat, bayar, skip, offline lalu sinkron. Handler MSW memakai skema zod yang sama dengan aplikasi supaya kontrak tidak menyimpang. E2E menyertakan pemeriksaan aksesibilitas otomatis (axe) pada layar utama.

### 3.13 Git hooks dan konvensi commit

```js
// commitlint.config.js
export default { extends: ['@commitlint/config-conventional'] }
```

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,yml}": ["prettier --write"]
}
```

Husky: `pre-commit` menjalankan `lint-staged`; `commit-msg` menjalankan `commitlint`. Karena repo monorepo, arahkan hook ke folder `frontend`. Cabang pendek (trunk-based), PR kecil, satu perubahan logis per commit.

### 3.14 CI (GitHub Actions) dan Dependabot

```yaml
# .github/workflows/frontend-ci.yml
name: frontend-ci
on:
  pull_request:
    paths: ['frontend/**']
  push:
    branches: [main]
    paths: ['frontend/**']
permissions:
  contents: read
concurrency:
  group: frontend-${{ github.ref }}
  cancel-in-progress: true
jobs:
  verify:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@<PIN-KE-SHA-COMMIT>
      - uses: actions/setup-node@<PIN-KE-SHA-COMMIT>
        with:
          node-version-file: frontend/.nvmrc
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test -- --coverage
      - run: npm run build
      - run: npm run audit:prod
```

Pin action ke SHA commit (bukan tag mengambang). Tambahkan job E2E terpisah. Dependabot:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /frontend
    schedule: { interval: weekly }
    open-pull-requests-limit: 5
    groups:
      minor-and-patch:
        update-types: [minor, patch]
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

`.gitignore` tambahan: `.env`, `.env.*` (kecuali `.env.example`), `dist`, `dev-dist`, `coverage`, `playwright-report`, `*.local`.

---

## 4. Definition of Done (per fitur)

- [ ] `npm run verify` hijau (typecheck, lint, format, test, build); tidak ada aturan lint yang dimatikan.
- [ ] Tanpa `any`, `@ts-ignore`, `dangerouslySetInnerHTML`; semua respons API melewati skema.
- [ ] Aturan bisnis terpenuhi: WIB, pembayaran append-only dan dibatasi sisa, jadwal tetap, skip beralasan, offline-first.
- [ ] Ada test: logika murni, integrasi layar (MSW), dan E2E bila alur kritis; bug punya test regresi.
- [ ] Status memuat, kosong, galat, dan offline ditangani.
- [ ] Aksesibel: keyboard, label, fokus, kontras; status tidak hanya lewat warna.
- [ ] Sesuai Figma; layar tanpa desain ditandai placeholder, tidak dikarang.
- [ ] Checklist keamanan: tidak ada rahasia/log sensitif, storage lewat modul terpusat, CSP tidak dilanggar, dependensi baru disetujui dan versi exact.
- [ ] Commit konvensional; tidak ada perubahan di `/backend`.
- [ ] Laporan agen memuat bukti perintah verifikasi, asumsi, dan hal yang belum selesai.

---

## 5. Keputusan yang Menunggu Persetujuan Anda

| #   | Keputusan                                      | Rekomendasi saya                                                                                                                                                    | Catatan                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Tempat menyimpan token JWT**                 | Jangka panjang: access token berumur pendek di memori + refresh token di cookie `httpOnly`                                                                          | Butuh perubahan backend (saat ini dibekukan) dan membuat start offline lebih rumit. Panduan OWASP HTML5 Security Cheat Sheet menyarankan tidak menyimpan pengenal sesi di localStorage karena selalu bisa dibaca JavaScript. Opsi sementara: tetap di storage klien dengan CSP ketat, tanpa skrip pihak ketiga, masa berlaku pendek, dan dicatat sebagai **risiko yang diterima** |
| D2  | **Struktur folder**                            | Feature-first (bagian 3.1)                                                                                                                                          | Menggantikan struktur datar dari handoff                                                                                                                                                                                                                                                                                                                                          |
| D3  | **Dependensi baru**                            | zod, vitest + testing-library + jsdom, msw, playwright, `eslint-plugin-jsx-a11y`, `eslint-plugin-no-unsanitized`, husky + lint-staged + commitlint, vite-plugin-pwa | Setiap paket butuh persetujuan; versi exact. `eslint-plugin-boundaries` opsional                                                                                                                                                                                                                                                                                                  |
| D4  | **Utilitas kelas Tailwind**                    | Mulai tanpa pustaka tambahan; pertimbangkan `clsx` (+ `tailwind-merge`) bila varian komponen mulai rumit                                                            | Hindari tambah paket sebelum perlu                                                                                                                                                                                                                                                                                                                                                |
| D5  | **CSP**                                        | Report-Only dulu, lalu penegakan; Trusted Types diuji terpisah                                                                                                      | Sebagian pustaka bisa melanggar Trusted Types                                                                                                                                                                                                                                                                                                                                     |
| D6  | **Server-state library** (mis. TanStack Query) | Tidak dipasang di awal                                                                                                                                              | Dexie sudah menjadi sumber data offline; tambah hanya bila ada kebutuhan nyata                                                                                                                                                                                                                                                                                                    |

---

## 6. Catatan Verifikasi

**Diverifikasi lewat pencarian (7 Nov 2026):** OWASP ASVS 5.0.0 (Mei 2025) beserta pemimpin proyeknya; daftar OWASP Top 10:2025; WCAG 2.2 sebagai rekomendasi W3C terkini (draf WCAG 3.0 belum final) dan adopsinya sebagai ISO/IEC 40500:2025; kutipan panduan OWASP tentang penyimpanan sesi di localStorage; kombinasi versi tooling yang umum dipakai (React 19, Vite 8, TypeScript 6, Tailwind 4, ESLint 10 flat config).

**Belum diverifikasi (agen wajib mengecek):** nama preset tiap plugin ESLint untuk versi terpasang; rentang versi Node minimum untuk Vite terpasang; opsi `tsconfig` yang tersedia di TypeScript terpasang; bentuk kontrak API nyata; kompatibilitas Trusted Types dengan pustaka yang dipakai.

**Tidak diuji:** semua template di atas belum dijalankan; sandbox tanpa akses npm.
