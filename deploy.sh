#!/bin/bash
set -e

PROJECT_DIR="/opt/websites"

echo ">>> Vào thư mục dự án"
cd "$PROJECT_DIR"


# git restore deploy.sh
git fetch origin main
git reset --hard origin/main

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

# echo ">>> Reload PM2"
# cd ..
# pm2 reload ecosystem.config.js

# echo ">>> Deploy xong!"

echo ">>> Reload / start PM2 bằng ecosystem"
cd "$PROJECT_DIR"
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo ">>> Deploy xong!"