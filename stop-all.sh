#!/bin/bash

echo "Mematikan Backend dan Frontend..."
npx kill-port 3000 5173

echo "Mematikan Database..."
docker compose down

echo ""
echo "Semua service sudah dimatikan."