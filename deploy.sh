#!/bin/bash
set -euo pipefail

# Load secrets from admin/.env.local
if [ -f admin/.env.local ]; then
  echo ">>> Loading secrets from admin/.env.local..."
  set -a
  source admin/.env.local
  set +a
fi

: "${BOT_TOKEN:?Chua set BOT_TOKEN}"
: "${CHAT_ID:?Chua set CHAT_ID}"

send_telegram() {
    local MESSAGE="$1"
    curl -s --connect-timeout 10 --max-time 15 -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d chat_id="${CHAT_ID}" \
        -d text="$MESSAGE" \
        -d parse_mode="Markdown" > /dev/null 2>&1 || true
}

CURRENT_STAGE="Khoi tao"
START_TIME=$(date +%s)

handle_error() {
    local EXIT_CODE=$?
    local FAILED_CMD="${BASH_COMMAND}"

    # Tắt trap để tránh loop nếu send_telegram bị lỗi
    trap - ERR

    send_telegram "❌ *Deploy THẤT BẠI*%0A*Bước:* ${CURRENT_STAGE}%0A*Lệnh lỗi:* \`${FAILED_CMD}\`%0A*Mã lỗi:* ${EXIT_CODE}"
    exit "$EXIT_CODE"
}
trap 'handle_error' ERR

# ==============================================================================
# BẮT ĐẦU DEPLOY
# ==============================================================================

HOSTNAME_SHORT=$(hostname)
send_telegram "🚀 *Bắt đầu Deploy trên ${HOSTNAME_SHORT}*%0AĐang cập nhật code mới..."

PROJECT_DIR="/opt/websites"

echo ">>> Vào thư mục dự án"
cd "$PROJECT_DIR"
# git restore deploy.sh

echo ">>> Git fetch + reset về origin/main"
CURRENT_STAGE="Git Fetch & Reset"
git fetch origin main
git reset --hard origin/main



chmod +x deploy.sh

echo ">>> Backend: install + build"
CURRENT_STAGE="Build Backend"
cd backend
# Nếu có package-lock.json thì dùng npm ci cho chắc
if [ -f package-lock.json ]; then
    npm_config_production=false npm ci
else
    npm_config_production=false npm install
fi
npm run build

echo ">>> Frontend: install + build"
CURRENT_STAGE="Build Frontend"
cd ../frontend
if [ -f package-lock.json ]; then
    npm_config_production=false npm ci
else
    npm_config_production=false npm install
fi
npm run build

echo ">>> Admin: install + build"
CURRENT_STAGE="Build Admin"
cd ../admin
if [ -f package-lock.json ]; then
    npm_config_production=false npm ci
else
    npm_config_production=false npm install
fi
npm run build

echo ">>> Restart PM2 apps từng cái một"
CURRENT_STAGE="Restart PM2"
cd "$PROJECT_DIR"

# Giải phóng ports trước khi restart (tránh EADDRINUSE)
echo ">>> Giải phóng ports..."
fuser -k 4000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
sleep 1

# Kiểm tra nếu apps đã tồn tại thì reload, không thì start
if pm2 list | grep -q "api"; then
    echo ">>> Restarting api..."
    pm2 restart api --update-env
    sleep 2
else
    pm2 start ecosystem.config.js --only api
fi

if pm2 list | grep -q "frontend"; then
    echo ">>> Restarting frontend..."
    pm2 restart frontend --update-env
    sleep 2
else
    pm2 start ecosystem.config.js --only frontend
fi

if pm2 list | grep -q "admin"; then
    echo ">>> Restarting admin..."
    pm2 restart admin --update-env
    sleep 2
else
    pm2 start ecosystem.config.js --only admin
fi

pm2 save

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ">>> Deploy xong!"
send_telegram "✅ *Deploy THÀNH CÔNG*%0AWebsite đã được cập nhật trên ${HOSTNAME_SHORT}!%0A*Thời gian:* ${DURATION}s"

