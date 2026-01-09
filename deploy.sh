#!/bin/bash

# Deploy Script - Citraborneo Test
# Author: Adam Suchi Hafizullah

set -e

echo "=========================================="
echo "Deploying Citraborneo Test Projects..."
echo "=========================================="

# Git Pull
echo ""
echo "[1/6] Pulling latest changes..."
git pull

# Sistem HR
echo ""
echo "[2/6] Sistem HR Backend..."
cd sistem-hr/backend
npm install
npm run migrate

echo ""
echo "[3/6] Sistem HR Frontend..."
cd ../frontend
npm install
npm run build

# Sistem Gudang
echo ""
echo "[4/6] Sistem Gudang Backend..."
cd ../../sistem-manajemen-gudang/backend
npm install
npm run migrate

echo ""
echo "[5/6] Sistem Gudang Frontend..."
cd ../frontend
npm install
npm run build

# Restart Services
echo ""
echo "[6/6] Restarting services..."
cd ../..
sudo systemctl restart sistem-hr-backend
sudo systemctl restart sistem-gudang-backend

echo ""
echo "=========================================="
echo "Deploy completed!"
echo "=========================================="
sudo systemctl status sistem-hr-backend --no-pager
sudo systemctl status sistem-gudang-backend --no-pager
