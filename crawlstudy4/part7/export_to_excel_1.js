//không hình
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read the text file
const inputFile = path.join(__dirname, 'text1.txt');
const tagFile = path.join(__dirname, 'tag.txt');
const outputFile = path.join(__dirname, 'Part7_Questions_1.xlsx');

// Read and parse tags
const tagContent = fs.readFileSync(tagFile, 'utf-8');
const tagLines = tagContent.split('\n').map(line => line.trim()).filter(line => line);

// Create a map: question number -> tag names
const questionTagMap = {};
tagLines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 6) {
        const tagName = parts[0].replace(/\[Part 7\]\s*/, ''); // Remove "[Part 7]" prefix
        const questionNumbers = parts[5].split(' ').map(n => n.trim()).filter(n => n);

        questionNumbers.forEach(qNum => {
            if (!questionTagMap[qNum]) {
                questionTagMap[qNum] = [];
            }
            questionTagMap[qNum].push(tagName);
        });
    }
});

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\r\n');

// Parse Part 7 - Format 1: English + Vietnamese
const part7Data = [];
let i = 0;

while (i < lines.length) {
    // Look for "Hiện Transcript" marker
    let transcriptIndex = -1;
    let passageStartIndex = i;

    // Find the next "Hiện Transcript"
    while (i < lines.length && lines[i].trim() !== 'Hiện Transcript') {
        i++;
    }

    if (i >= lines.length) {
        break;
    }

    transcriptIndex = i;

    // Collect passage text (English) - everything before "Hiện Transcript"
    const englishPassageLines = [];
    for (let j = passageStartIndex; j < transcriptIndex; j++) {
        const line = lines[j].trim();
        // Skip empty lines and question numbers
        if (line !== '' && !/^\d+$/.test(line)) {
            englishPassageLines.push(line);
        }
    }

    // Skip "Hiện Transcript" line
    i++;

    // Skip empty lines
    while (i < lines.length && lines[i].trim() === '') {
        i++;
    }

    // Collect Vietnamese translation (until we hit a question number)
    const vietnamesePassageLines = [];
    while (i < lines.length) {
        const line = lines[i].trim();

        // Stop if we hit a question number
        if (/^\d+$/.test(line)) {
            break;
        }

        // Stop if we hit "Dịch đáp án:"
        if (line.startsWith('Dịch đáp án:')) {
            break;
        }

        // Skip lines that look like question numbers with description (e.g., "147. Mục đích...")
        if (/^\d+\.\s+/.test(line)) {
            i++;
            continue;
        }

        // Stop if we hit "Giải thích chi tiết đáp án"
        if (line.startsWith('Giải thích chi tiết đáp án')) {
            break;
        }

        if (line !== '') {
            vietnamesePassageLines.push(line);
        }
        i++;
    }

    // Combine English and Vietnamese passages
    const fullPassageText = englishPassageLines.join('\n') + '\n\n' + vietnamesePassageLines.join('\n');

    // Now collect questions for this passage
    while (i < lines.length) {
        const qLine = lines[i].trim();

        // Check if we've reached a new passage
        if (qLine &&
            !qLine.startsWith('A.') &&
            !qLine.startsWith('B.') &&
            !qLine.startsWith('C.') &&
            !qLine.startsWith('D.') &&
            !qLine.startsWith('Đáp án đúng:') &&
            !qLine.startsWith('Giải thích chi tiết đáp án') &&
            !qLine.startsWith('Dịch đáp án:') &&
            !/^\d+$/.test(qLine) &&
            !qLine.includes('A.M.') && !qLine.includes('P.M.') &&
            qLine.length > 100) {
            // This looks like start of new passage
            break;
        }

        // Check if this is a question number
        if (/^\d+$/.test(qLine)) {
            const number = qLine;
            i++;

            // Next line is the question
            let question = '';
            if (i < lines.length) {
                question = lines[i].trim();
                i++;
            }

            // Next 4 lines are options A, B, C, D
            let optionA = '', optionB = '', optionC = '', optionD = '';

            for (let j = 0; j < 4; j++) {
                if (i < lines.length) {
                    const optionLine = lines[i].trim();
                    if (optionLine.startsWith('A.')) {
                        optionA = optionLine.substring(2).trim();
                    } else if (optionLine.startsWith('B.')) {
                        optionB = optionLine.substring(2).trim();
                    } else if (optionLine.startsWith('C.')) {
                        optionC = optionLine.substring(2).trim();
                    } else if (optionLine.startsWith('D.')) {
                        optionD = optionLine.substring(2).trim();
                    }
                    i++;
                }
            }

            // Get correct answer
            let answer = '';
            if (i < lines.length && lines[i].trim().startsWith('Đáp án đúng:')) {
                answer = lines[i].trim().replace('Đáp án đúng:', '').trim();
                i++;
            }

            // Skip "Giải thích chi tiết đáp án" if present
            if (i < lines.length && lines[i].trim() === 'Giải thích chi tiết đáp án') {
                i++;
            }

            // Collect explanation (Vietnamese translation of question and options)
            const explanationLines = [];
            while (i < lines.length) {
                const expLine = lines[i].trim();

                // Stop at next question number
                if (/^\d+$/.test(expLine)) {
                    break;
                }

                // Skip "Dịch đáp án:" header
                if (expLine === 'Dịch đáp án:') {
                    i++;
                    continue;
                }

                // Skip lines that are question numbers with description (e.g., "147. Mục đích...")
                if (/^\d+\.\s+/.test(expLine)) {
                    i++;
                    continue;
                }

                // Stop if we see content that looks like a new passage
                if (expLine.length > 100 &&
                    !expLine.startsWith('A.') &&
                    !expLine.startsWith('B.') &&
                    !expLine.startsWith('C.') &&
                    !expLine.startsWith('D.')) {
                    break;
                }

                if (expLine !== '') {
                    explanationLines.push(expLine);
                }
                i++;
            }

            const explanation = explanationLines.join('\n');

            // Add question to data
            if (number && answer && question) {
                part7Data.push({
                    number,
                    answer,
                    passageText: fullPassageText,
                    question,
                    optionA,
                    optionB,
                    optionC,
                    optionD,
                    explanation
                });
            }
        } else if (qLine === '') {
            // Skip empty lines
            i++;
        } else {
            // Skip other lines
            i++;
        }
    }
}

// Format data for Excel
const excelData = part7Data.map(q => {
    // Get tags for this question
    const tags = questionTagMap[q.number] || [];
    const tagString = tags.join(', ');

    return {
        'Số câu': q.number,
        'Đáp án': q.answer,
        'Hiện Transcript': q.passageText,
        'Giải thích chi tiết đáp án': q.explanation,
        'Câu hỏi': q.question,
        'A': q.optionA,
        'B': q.optionB,
        'C': q.optionC,
        'D': q.optionD,
        'Tag': tagString
    };
});

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(excelData);

// Set column widths for better readability
ws['!cols'] = [
    { wch: 10 },  // Số câu
    { wch: 10 },  // Đáp án
    { wch: 120 }, // Hiện Transcript (passage text)
    { wch: 80 },  // Giải thích chi tiết đáp án
    { wch: 60 },  // Câu hỏi
    { wch: 50 },  // A
    { wch: 50 },  // B
    { wch: 50 },  // C
    { wch: 50 },  // D
    { wch: 50 }   // Tag
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Part 7');

// Write to file
XLSX.writeFile(wb, outputFile);

console.log(`✓ Đã xuất ${excelData.length} câu hỏi Part 7 từ text1.txt vào Excel`);
console.log(`✓ File Excel: ${outputFile}`);
console.log('\n--- Cấu trúc các cột ---');
console.log('1. Số câu');
console.log('2. Đáp án');
console.log('3. Hiện Transcript (đoạn văn tiếng Anh + tiếng Việt - đã loại bỏ số câu)');
console.log('4. Giải thích chi tiết đáp án (đã loại bỏ "Dịch đáp án:" và số câu)');
console.log('5. Câu hỏi');
console.log('6. A');
console.log('7. B');
console.log('8. C');
console.log('9. D');
console.log('10. Tag (đã bỏ prefix "[Part 7]")');
