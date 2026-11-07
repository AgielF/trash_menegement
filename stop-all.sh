#!/bin/bash

# Pastikan skrip berjalan dari folder tempat skrip ini berada (root project)
cd "$(dirname "$0")"

echo "Mematikan Backend (Port 3000) dan Frontend (Port 5173)..."
# Menggunakan fuser (bawaan Linux) untuk mematikan proses di port tersebut
fuser -k 3000/tcp 5173/tcp 2>/dev/null || echo "Tidak ada proses yang berjalan di port 3000/5173."

echo "Mematikan Database (Docker)..."
docker compose down

echo ""
echo "Semua service sudah dimatikan."