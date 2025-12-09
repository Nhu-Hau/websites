#!/bin/bash
set -euo pipefail

# Load secrets from backend/.env (safely - only valid KEY=value lines)
if [ -f backend/.env ]; then
  echo ">>> Loading secrets from backend/.env..."
  set -a
  # Only source lines matching KEY=value pattern, ignore comments and empty lines
  eval "$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' backend/.env | grep -v '^#')"
  set +a
fi

: "${BOT_TOKEN:?Chua set BOT_TOKEN}"
: "${CHAT_ID:?Chua set CHAT_ID}"

send_telegram() {
    local MESSAGE="$1"
    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d chat_id="${CHAT_ID}" \
        -d text="$MESSAGE" \
        -d parse_mode="Markdown" > /dev/null
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

echo ">>> Reload / start PM2 bằng ecosystem"
CURRENT_STAGE="Restart PM2"
cd "$PROJECT_DIR"
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ">>> Deploy xong!"
send_telegram "✅ *Deploy THÀNH CÔNG*%0AWebsite đã được cập nhật trên ${HOSTNAME_SHORT}!%0A*Thời gian:* ${DURATION}s"

