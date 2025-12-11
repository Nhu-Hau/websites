#!/bin/bash
set -euo pipefail

# CẤU HÌNH CƠ BẢN
PROJECT_DIR="/opt/websites"

echo ">>> Vào thư mục dự án: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Load secrets từ admin/.env.local (nếu có)
if [ -f admin/.env.local ]; then
  echo ">>> Loading secrets từ admin/.env.local..."
  set -a
  # shellcheck disable=SC1091
  source admin/.env.local
  set +a
fi

: "${BOT_TOKEN:?Chua set BOT_TOKEN}"
: "${CHAT_ID:?Chua set CHAT_ID}"

# HÀM GỬI TELEGRAM

send_telegram() {
    local MESSAGE="$1"
    curl -s --connect-timeout 10 --max-time 15 -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d chat_id="${CHAT_ID}" \
        -d text="$MESSAGE" \
        -d parse_mode="Markdown" >/dev/null 2>&1 || true
}

CURRENT_STAGE="Khoi tao"
START_TIME=$(date +%s)

# XỬ LÝ LỖI TOÀN CỤC

handle_error() {
    local EXIT_CODE=$?
    local FAILED_CMD="${BASH_COMMAND}"

    # Tắt trap để tránh loop nếu send_telegram bị lỗi
    trap - ERR

    send_telegram "❌ *Deploy THẤT BẠI*
*Bước:* ${CURRENT_STAGE}
*Lệnh lỗi:* \`${FAILED_CMD}\`
*Mã lỗi:* ${EXIT_CODE}"

    exit "$EXIT_CODE"
}
trap 'handle_error' ERR

# BẮT ĐẦU DEPLOY

HOSTNAME_SHORT=$(hostname -s 2>/dev/null || hostname)

send_telegram "🚀 *Bắt đầu Deploy trên ${HOSTNAME_SHORT}*
Đang cập nhật code mới..."

echo ">>> Git fetch + reset về origin/main"
CURRENT_STAGE="Git Fetch & Reset"
git fetch origin main
git reset --hard origin/main

echo ">>> Đảm bảo deploy.sh có quyền thực thi"
chmod +x deploy.sh || true

# BACKEND

echo ">>> Backend: install + build"
CURRENT_STAGE="Build Backend"
cd "${PROJECT_DIR}/backend"

if [ -f package-lock.json ]; then
    echo ">>> Dùng npm ci cho backend"
    npm_config_production=false npm ci
else
    echo ">>> Dùng npm install cho backend"
    npm_config_production=false npm install
fi

npm run build

# FRONTEND

echo ">>> Frontend: install + build"
CURRENT_STAGE="Build Frontend"
cd "${PROJECT_DIR}/frontend"

if [ -f package-lock.json ]; then
    echo ">>> Dùng npm ci cho frontend"
    npm_config_production=false npm ci
else
    echo ">>> Dùng npm install cho frontend"
    npm_config_production=false npm install
fi

npm run build

# ADMIN

echo ">>> Admin: install + build"
CURRENT_STAGE="Build Admin"
cd "${PROJECT_DIR}/admin"

if [ -f package-lock.json ]; then
    echo ">>> Dùng npm ci cho admin"
    npm_config_production=false npm ci
else
    echo ">>> Dùng npm install cho admin"
    npm_config_production=false npm install
fi

npm run build

# PM2: GIẢI PHÓNG PORT + RESTART / START

echo ">>> Khởi động lại PM2 apps (xóa cache cũ)"
CURRENT_STAGE="Restart PM2"
cd "$PROJECT_DIR"

echo ">>> Dừng và xóa tất cả PM2 apps để load config mới..."
pm2 delete all 2>/dev/null || true
sleep 1

echo ">>> Giải phóng ports..."
fuser -k 4000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
sleep 1

echo ">>> Khởi động tất cả apps từ ecosystem.config.js..."
pm2 start ecosystem.config.js

echo ">>> Đợi apps khởi động..."
sleep 3

pm2 save

# HOÀN TẤT

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MIN=$((DURATION / 60))
SEC=$((DURATION % 60))

echo ">>> Deploy xong trong ${MIN}m ${SEC}s!"

send_telegram "✅ *Deploy THÀNH CÔNG*
Website đã được cập nhật trên ${HOSTNAME_SHORT}!
*Thời gian:* ${MIN}m ${SEC}s"
