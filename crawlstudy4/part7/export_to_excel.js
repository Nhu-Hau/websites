//hình
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read the text file
const inputFile = path.join(__dirname, 'text.txt');
const tagFile = path.join(__dirname, 'tag.txt');
const outputFile = path.join(__dirname, 'Part7_Questions.xlsx');

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

// Parse Part 7 - simpler approach: track passages and questions
const part7Data = [];
let currentPassageText = '';
let i = 0;

while (i < lines.length) {
    const line = lines[i].trim();

    // Look for "Hiện Transcript" - everything before it is passage English
    if (line === 'Hiện Transcript') {
        // We found transcript marker
        // Go back to collect English text (before this line)
        // Then collect Vietnamese text (after this line)
        i++; // Skip "Hiện Transcript"

        // Skip empty lines
        while (i < lines.length && lines[i].trim() === '') {
            i++;
        }

        // Collect Vietnamese until we hit a question number
        const vietnameseLines = [];
        while (i < lines.length) {
            const vLine = lines[i].trim();
            if (/^\d+$/.test(vLine)) {
                break;
            }
            if (vLine !== '') {
                vietnameseLines.push(vLine);
            }
            i++;
        }

        // Append Vietnamese to current passage
        if (vietnameseLines.length > 0) {
            currentPassageText += '\n\n' + vietnameseLines.join('\n');
        }

        // Now collect questions for this passage
        while (i < lines.length) {
            const qLine = lines[i].trim();

            // Break if we hit a new passage (typically starts with http or capital letter line after empty line)
            if (qLine.startsWith('http://') || qLine.startsWith('https://') || qLine.startsWith('*E-mail*') || qLine === 'Hiện Transcript') {
                // Reset for next passage - but first collect English text
                currentPassageText = '';
                const englishLines = [];

                // Collect until "Hiện Transcript"
                while (i < lines.length && lines[i].trim() !== 'Hiện Transcript') {
                    const eLine = lines[i].trim();
                    if (eLine !== '' && !/^\d+$/.test(eLine)) {
                        englishLines.push(eLine);
                    }
                    i++;
                }

                currentPassageText = englishLines.join('\n');
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

                // Check if there's explanation
                const explanationLines = [];

                // Skip "Giải thích chi tiết đáp án" if present
                if (i < lines.length && lines[i].trim() === 'Giải thích chi tiết đáp án') {
                    i++;

                    // Skip empty lines
                    while (i < lines.length && lines[i].trim() === '') {
                        i++;
                    }

                    // Collect until next question or passage
                    while (i < lines.length) {
                        const expLine = lines[i].trim();

                        // Check if this is a question number line (e.g., "147", "148", etc.)
                        const isQuestionNumber = /^\d+$/.test(expLine);

                        if (isQuestionNumber || expLine.startsWith('http://') || expLine.startsWith('https://') || expLine.startsWith('*E-mail*') || expLine === 'Hiện Transcript' || (expLine.length > 20 && !expLine.includes('Dịch') && !expLine.includes('.') && lines[i - 1] && lines[i - 1].trim() === '' && lines[i + 1] && lines[i + 1].trim() === '')) {
                            break;
                        }

                        // Skip lines that start with question number followed by dot and content (e.g., "147. Điều gì...")
                        const startsWithQuestionNumber = /^\d+\./.test(expLine);

                        if (expLine !== '' && !startsWithQuestionNumber) {
                            explanationLines.push(expLine);
                        }
                        i++;
                    }
                }

                // Add question to data
                if (number && answer && question) {
                    part7Data.push({
                        number,
                        answer,
                        passageText: currentPassageText,
                        question,
                        optionA,
                        optionB,
                        optionC,
                        optionD,
                        explanation: explanationLines.join('\n')
                    });
                }
            } else {
                i++;
            }
        }
    } else if (!/^\d+$/.test(line) && line !== '') {
        // This might be start of English passage
        // Just increment, we'll handle it when we hit "Hiện Transcript"
        i++;
    } else {
        i++;
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

console.log(`✓ Đã xuất ${excelData.length} câu hỏi Part 7 vào Excel`);
console.log(`✓ File Excel: ${outputFile}`);
console.log('\n--- Cấu trúc các cột ---');
console.log('1. Số câu');
console.log('2. Đáp án');
console.log('3. Hiện Transcript (đoạn văn tiếng Anh + tiếng Việt)');
console.log('4. Giải thích chi tiết đáp án (đã bỏ số câu)');
console.log('5. Câu hỏi');
console.log('6. A');
console.log('7. B');
console.log('8. C');
console.log('9. D');
console.log('10. Tag (đã bỏ prefix "[Part 7]")');
