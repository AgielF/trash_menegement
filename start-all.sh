#!/bin/bash

echo "Memulai Database (Docker)..."
docker compose up -d

sleep 3

echo "Memulai Backend..."
cd backend && npm run start:dev > ../backend.log 2>&1 &

echo "Memulai Frontend..."
cd frontend && npm run dev > ../frontend.log 2>&1 &

echo ""
echo "Semua service berjalan di background!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"
echo ""
echo "Catatan: Lihat backend.log dan frontend.log jika ada error."