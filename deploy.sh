#!/bin/bash
set -e

echo ">>> Vào thư mục project"
cd /opt/websites

rm -f deploy.log
rm -rf logs/

git restore deploy.sh
git restore frontend/package-lock.json
git restore admin/package-lock.json  
git restore backend/package-lock.json

echo ">>> Git pull main"
git pull origin main

chmod +x deploy.sh

echo ">>> Backend: install + build"
cd backend
npm_config_production=false npm install
npm run build

echo ">>> Frontend: install + build"
cd ../frontend
npm_config_production=false npm install
npm run build

echo ">>> Admin: install + build"
cd ../admin
npm_config_production=false npm install
npm run build

echo ">>> Reload PM2"
cd ..
pm2 reload ecosystem.config.js

echo ">>> Deploy xong!"
