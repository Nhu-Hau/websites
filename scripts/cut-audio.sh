#!/bin/bash

# Script để cắt 2 giây đầu của tất cả file audio trong dự án
# Yêu cầu: cài đặt ffmpeg
# Cách sử dụng: ./scripts/cut-audio.sh

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kiểm tra xem ffmpeg có được cài đặt không
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Lỗi: ffmpeg chưa được cài đặt.${NC}"
    echo "Vui lòng cài đặt ffmpeg:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  Windows: https://ffmpeg.org/download.html"
    exit 1
fi

# Tìm tất cả file audio
echo -e "${YELLOW}Đang tìm các file audio...${NC}"
AUDIO_FILES=$(find . -type f \( -name "*.mp3" -o -name "*.wav" -o -name "*.m4a" -o -name "*.ogg" -o -name "*.aac" -o -name "*.flac" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" 2>/dev/null)

if [ -z "$AUDIO_FILES" ]; then
    echo -e "${YELLOW}Không tìm thấy file audio nào trong dự án.${NC}"
    exit 0
fi

# Đếm số file
FILE_COUNT=$(echo "$AUDIO_FILES" | wc -l | tr -d ' ')
echo -e "${GREEN}Tìm thấy $FILE_COUNT file audio.${NC}"

# Hỏi xác nhận
echo -e "${YELLOW}Script sẽ cắt 2 giây đầu của tất cả các file audio.${NC}"
echo -e "${YELLOW}Các file gốc sẽ được sao lưu với đuôi .bak${NC}"
read -p "Bạn có muốn tiếp tục? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Đã hủy."
    exit 0
fi

# Xử lý từng file
COUNT=0
SUCCESS=0
FAILED=0

echo "$AUDIO_FILES" | while IFS= read -r file; do
    if [ -z "$file" ]; then
        continue
    fi
    
    COUNT=$((COUNT + 1))
    echo -e "\n[${COUNT}/${FILE_COUNT}] Đang xử lý: ${file}"
    
    # Tạo tên file backup
    BACKUP_FILE="${file}.bak"
    
    # Kiểm tra xem file backup đã tồn tại chưa
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "  ${YELLOW}File backup đã tồn tại, bỏ qua...${NC}"
        continue
    fi
    
    # Sao lưu file gốc
    cp "$file" "$BACKUP_FILE"
    if [ $? -ne 0 ]; then
        echo -e "  ${RED}Lỗi: Không thể sao lưu file${NC}"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    # Cắt 2 giây đầu (bắt đầu từ 2 giây)
    # -ss 2: bắt đầu từ giây thứ 2
    # -i: input file
    # -acodec copy: copy audio codec để nhanh hơn (nếu format hỗ trợ)
    # Nếu không hỗ trợ copy, dùng codec mặc định
    if ffmpeg -i "$BACKUP_FILE" -ss 2 -acodec copy -y "$file" 2>/dev/null; then
        echo -e "  ${GREEN}✓ Thành công (sử dụng codec copy)${NC}"
        SUCCESS=$((SUCCESS + 1))
    elif ffmpeg -i "$BACKUP_FILE" -ss 2 -y "$file" 2>/dev/null; then
        echo -e "  ${GREEN}✓ Thành công${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "  ${RED}✗ Lỗi: Không thể cắt file${NC}"
        # Khôi phục file gốc nếu lỗi
        mv "$BACKUP_FILE" "$file"
        FAILED=$((FAILED + 1))
    fi
done

echo -e "\n${GREEN}Hoàn thành!${NC}"
echo -e "Thành công: ${SUCCESS}"
echo -e "Thất bại: ${FAILED}"

