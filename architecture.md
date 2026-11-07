# Architecture Final v1.0 — Aplikasi Pemungutan Sampah (Kontz / Bersihku)

> **Status:** Final Draft (Berdasarkan kesepakatan Tech Stack).
> **Pendekatan Arsitektur:** Local-First (Offline-Capable) + Modular Monolith.
> **Tech Stack:** React (TS) + PWA + Dexie.js | NestJS (TS) + Prisma | PostgreSQL.
> **Target Environment:** Web Browser (Mobile-first) & Local Development (Docker).

## 1. Diagram Arsitektur Makro

```mermaid
graph TD
    subgraph Client ["Frontend: React TS + PWA (Browser/HP Petugas & Admin)"]
        UI["UI Components<br>(Beranda, Daftar Rumah, Form, Admin Panel)"]
        SW["Service Worker<br>(Cache Aset & Background Sync)"]
        LDB[("Local Database<br>Dexie.js / IndexedDB")]
        
        UI <-->|"Baca/Tulis Instan"| LDB
        UI <-->|"Daftarkan Aset"| SW
    end

    subgraph Backend ["Backend: Node.js + NestJS (Modular Monolith)"]
        API["API Gateway / Controller Layer"]
        
        subgraph Modules ["Domain Modules (Terisolasi)"]
            M_Auth["Auth & Users Module"]
            M_House["Houses Module"]
            M_Pickup["Pickups & Sessions Module"]
            M_Pay["Payments Module"]
            M_Admin["Admin & Settings Module"]
            M_Sync["Sync & Conflict Resolver Module"]
        end
        
        API --> M_Auth
        API --> M_House
        API --> M_Pickup
        API --> M_Pay
        API --> M_Admin
        API --> M_Sync
    end

    subgraph DB ["Database Server"]
        PG[("PostgreSQL<br>via Docker Lokal")]
    end

    SW <-->|"Sinkronisasi Data<br>(REST / JSON)"| API
    M_Auth <-->|"Prisma ORM"| PG
    M_House <-->|"Prisma ORM"| PG
    M_Pickup <-->|"Prisma ORM"| PG
    M_Pay <-->|"Prisma ORM"| PG
    M_Admin <-->|"Prisma ORM"| PG
    M_Sync <-->|"Prisma ORM"| PG