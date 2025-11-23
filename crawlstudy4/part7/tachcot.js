const XLSX = require('xlsx');
const path = require('path');
const { execSync } = require('child_process');

// Hàm phát hiện và tách tiếng Anh/tiếng Việt
function splitEnglishVietnamese(text) {
    if (!text) return { english: '', vietnamese: '' };

    // Thử cách 1: Tách theo marker "Dịch nghĩa:"
    if (text.includes('Dịch nghĩa:')) {
        const parts = text.split('Dịch nghĩa:');
        return {
            english: parts[0].trim(),
            vietnamese: ('Dịch nghĩa:\n' + parts.slice(1).join('Dịch nghĩa:')).trim()
        };
    }

    // Thử cách 2: Tách theo \n\n
    if (text.includes('\n\n')) {
        const parts = text.split('\n\n');
        return {
            english: parts[0].trim(),
            vietnamese: parts.slice(1).join('\n\n').trim()
        };
    }

    // Thử cách 3: Tách theo một xuống dòng và phát hiện ký tự tiếng Việt
    const lines = text.split('\n');

    // Tìm dòng đầu tiên có chứa ký tự tiếng Việt
    let vietnameseStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Kiểm tra có ký tự tiếng Việt (các dấu thanh, dấu âm)
        if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(line)) {
            vietnameseStartIndex = i;
            break;
        }
    }

    if (vietnameseStartIndex > 0) {
        const english = lines.slice(0, vietnameseStartIndex).join('\n').trim();
        const vietnamese = lines.slice(vietnameseStartIndex).join('\n').trim();
        return { english, vietnamese };
    }

    // Nếu không tìm thấy tiếng Việt, toàn bộ là tiếng Anh
    return {
        english: text.trim(),
        vietnamese: ''
    };
}

// Hàm tách cột Hiện Transcript thành 2 cột
function splitTranscriptColumn(inputFile, outputFile) {
    console.log(`\nĐang xử lý: ${path.basename(inputFile)}`);

    // Đọc file Excel
    const workbook = XLSX.readFile(inputFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Chuyển worksheet thành JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✓ Đã đọc ${data.length} dòng dữ liệu`);

    // Tách cột "Hiện Transcript" thành 2 cột
    const newData = data.map((row, index) => {
        const transcript = row['Hiện Transcript'] || '';
        const explanation = row['Giải thích chi tiết đáp án'] || '';

        // Tách tiếng Anh và tiếng Việt cho transcript
        let { english, vietnamese } = splitEnglishVietnamese(transcript);

        // Thêm header "Dịch nghĩa:" nếu chưa có
        if (vietnamese && vietnamese.trim() && !vietnamese.startsWith('Dịch nghĩa:')) {
            vietnamese = 'Dịch nghĩa:\n' + vietnamese;
        }

        // Thêm header "Dịch đáp án:" nếu chưa có
        let processedExplanation = explanation;
        if (explanation && explanation.trim() && !explanation.startsWith('Dịch đáp án:')) {
            processedExplanation = 'Dịch đáp án:\n' + explanation;
        }

        // Debug: In ra vài dòng đầu để kiểm tra
        if (index < 2) {
            console.log(`\n--- Câu ${row['Số câu']} ---`);
            console.log('English length:', english.length);
            console.log('Vietnamese length:', vietnamese.length);
            console.log('Has "Dịch nghĩa:":', vietnamese.startsWith('Dịch nghĩa:'));
            console.log('Has "Dịch đáp án:":', processedExplanation.startsWith('Dịch đáp án:'));
        }

        // Tạo row mới
        return {
            'Số câu': row['Số câu'],
            'Đáp án': row['Đáp án'],
            'Transcript (English)': english,
            'Transcript (Tiếng Việt)': vietnamese,
            'Giải thích chi tiết đáp án': processedExplanation,
            'Câu hỏi': row['Câu hỏi'],
            'A': row['A'],
            'B': row['B'],
            'C': row['C'],
            'D': row['D'],
            'Tag': row['Tag'] || ''
        };
    });

    // Tạo workbook mới
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(newData);

    // Thiết lập độ rộng cột
    newWorksheet['!cols'] = [
        { wch: 10 },  // Số câu
        { wch: 10 },  // Đáp án
        { wch: 80 },  // Transcript (English)
        { wch: 80 },  // Transcript (Tiếng Việt)
        { wch: 80 },  // Giải thích chi tiết đáp án
        { wch: 60 },  // Câu hỏi
        { wch: 50 },  // A
        { wch: 50 },  // B
        { wch: 50 },  // C
        { wch: 50 },  // D
        { wch: 50 }   // Tag
    ];

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Part 7');

    // Ghi file
    XLSX.writeFile(newWorkbook, outputFile);

    console.log(`✓ Đã tạo file: ${path.basename(outputFile)}`);
    console.log(`✓ Đã tách cột "Hiện Transcript" thành 2 cột riêng biệt`);
}

// Xử lý cả 2 file
const file1Input = path.join(__dirname, 'Part7_Questions.xlsx');
const file1Output = path.join(__dirname, 'Part7_Questions_Split.xlsx');

const file2Input = path.join(__dirname, 'Part7_Questions_1.xlsx');
const file2Output = path.join(__dirname, 'Part7_Questions_1_Split.xlsx');

console.log('==================================================');
console.log('BƯỚC 1: CHẠY EXPORT SCRIPTS');
console.log('==================================================');

// Chạy export_to_excel.js trước (hình)
console.log('\n>>> Đang chạy export_to_excel.js (có hình)...');
try {
    execSync('node export_to_excel.js', {
        cwd: __dirname,
        stdio: 'inherit'
    });
    console.log('✓ Hoàn thành export_to_excel.js\n');
} catch (error) {
    console.error('✗ Lỗi khi chạy export_to_excel.js:', error.message);
}

// Chạy export_to_excel_1.js sau đó (không hình)
console.log('>>> Đang chạy export_to_excel_1.js (không hình)...');
try {
    execSync('node export_to_excel_1.js', {
        cwd: __dirname,
        stdio: 'inherit'
    });
    console.log('✓ Hoàn thành export_to_excel_1.js\n');
} catch (error) {
    console.error('✗ Lỗi khi chạy export_to_excel_1.js:', error.message);
}

console.log('==================================================');
console.log('BƯỚC 2: TÁCH CỘT TRANSCRIPT');
console.log('==================================================');

// Xử lý file 1
try {
    splitTranscriptColumn(file1Input, file1Output);
} catch (error) {
    console.error(`✗ Lỗi khi xử lý ${path.basename(file1Input)}:`, error.message);
}

console.log('\n--------------------------------------------------');

// Xử lý file 2
try {
    splitTranscriptColumn(file2Input, file2Output);
} catch (error) {
    console.error(`✗ Lỗi khi xử lý ${path.basename(file2Input)}:`, error.message);
}

console.log('\n==================================================');
console.log('HOÀN THÀNH!');
console.log('==================================================');
console.log('\nCấu trúc cột mới:');
console.log('1. Số câu');
console.log('2. Đáp án');
console.log('3. Transcript (English) - Chỉ phần tiếng Anh');
console.log('4. Transcript (Tiếng Việt) - Tự động thêm "Dịch nghĩa:" nếu chưa có');
console.log('5. Giải thích chi tiết đáp án - Tự động thêm "Dịch đáp án:" nếu chưa có');
console.log('6. Câu hỏi');
console.log('7. A');
console.log('8. B');
console.log('9. C');
console.log('10. D');
console.log('11. Tag');
