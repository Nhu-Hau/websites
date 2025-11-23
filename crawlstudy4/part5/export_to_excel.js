const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read the text file
const inputFile = path.join(__dirname, 'text.txt');
const tagFile = path.join(__dirname, 'tag.txt');
const outputFile = path.join(__dirname, 'Part5_Questions.xlsx');

// Read and parse tags
const tagContent = fs.readFileSync(tagFile, 'utf-8');
const tagLines = tagContent.split('\n').map(line => line.trim()).filter(line => line);

// Create a map: question number -> tag names
const questionTagMap = {};
tagLines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 6) {
        const tagName = parts[0].replace(/\[Part 5\]\s*/, '').replace(/\[Grammar\]\s*/, ''); // Remove prefixes
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

// Parse Part 5 data
const part5Data = [];
let i = 0;

while (i < lines.length) {
    const line = lines[i].trim();

    // Check if this is a question number (just a number)
    if (/^\d+$/.test(line)) {
        const number = line;
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

        // Skip "Giải thích chi tiết đáp án"
        if (i < lines.length && lines[i].trim() === 'Giải thích chi tiết đáp án') {
            i++;
        }

        // Skip empty lines
        while (i < lines.length && lines[i].trim() === '') {
            i++;
        }

        // Collect explanation until next question number
        const explanationLines = [];
        while (i < lines.length) {
            const expLine = lines[i].trim();
            // Stop if we hit next question number
            if (/^\d+$/.test(expLine)) {
                break;
            }
            if (expLine !== '') {
                explanationLines.push(expLine);
            }
            i++;
        }

        // Add question to data
        if (number && answer && question) {
            part5Data.push({
                number,
                answer,
                question,
                optionA,
                optionB,
                optionC,
                optionD,
                explanations: explanationLines
            });
        }
    } else {
        i++;
    }
}

// Format data for Excel
const excelData = part5Data.map(q => {
    // Combine all explanations
    const explanation = q.explanations.join('\n');

    // Get tags for this question
    const tags = questionTagMap[q.number] || [];
    const tagString = tags.join(', ');

    return {
        'Số câu': q.number,
        'Đáp án': q.answer,
        'Giải thích chi tiết đáp án': explanation,
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
    { wch: 80 },  // Giải thích chi tiết đáp án
    { wch: 100 }, // Câu hỏi
    { wch: 30 },  // A
    { wch: 30 },  // B
    { wch: 30 },  // C
    { wch: 30 },  // D
    { wch: 40 }   // Tag
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Part 5');

// Write to file
XLSX.writeFile(wb, outputFile);

console.log(`✓ Đã xuất ${excelData.length} câu hỏi Part 5 vào Excel`);
console.log(`✓ File Excel: ${outputFile}`);
console.log('\n--- Cấu trúc các cột ---');
console.log('1. Số câu');
console.log('2. Đáp án');
console.log('3. Giải thích chi tiết đáp án');
console.log('4. Câu hỏi');
console.log('5. A');
console.log('6. B');
console.log('7. C');
console.log('8. D');
console.log('9. Tag (đã bỏ prefix "[Part 5]" và "[Grammar]")');
