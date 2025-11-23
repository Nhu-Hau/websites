const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read the text file
const inputFile = path.join(__dirname, 'text.txt');
const tagFile = path.join(__dirname, 'tag.txt');
const outputFile = path.join(__dirname, 'Part1_Questions.xlsx');

// Read and parse tags
const tagContent = fs.readFileSync(tagFile, 'utf-8');
const tagLines = tagContent.split('\n').map(line => line.trim()).filter(line => line);

// Create a map: question number -> tag names
const questionTagMap = {};
tagLines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 6) {
        const tagName = parts[0].replace('[Part 1] ', ''); // Remove "[Part 1] " prefix
        const questionNumbers = parts[5].split(' ').map(n => n.trim()).filter(n => n); // e.g., ["2", "4", "6"]

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

// Parse Part 1 data
const part1Data = [];
let i = 0;

while (i < lines.length) {
    const line = lines[i].trim();

    // Look for "Hiện Transcript" which marks the start of a question
    if (line === 'Hiện Transcript') {
        i++; // Move to next line

        // Skip empty lines
        while (i < lines.length && lines[i].trim() === '') {
            i++;
        }

        // Next line should be the transcript (options)
        const transcript = lines[i].trim();
        i++;

        // Next should be question number
        const number = lines[i].trim();
        i++;

        // Skip A. B. C. D.
        while (i < lines.length && /^[A-D]\.$/.test(lines[i].trim())) {
            i++;
        }

        // Get correct answer
        let answer = '';
        if (lines[i].trim().startsWith('Đáp án đúng:')) {
            answer = lines[i].trim().replace('Đáp án đúng:', '').trim();
            i++;
        }

        // Skip "Giải thích chi tiết đáp án"
        if (lines[i].trim() === 'Giải thích chi tiết đáp án') {
            i++;
        }

        // Skip empty lines
        while (i < lines.length && lines[i].trim() === '') {
            i++;
        }

        // Get "Dịch đáp án:"
        if (lines[i].trim() === 'Dịch đáp án:') {
            i++;

            // Collect explanation lines
            const explanationLines = [];
            while (i < lines.length && lines[i].trim() === '') {
                i++;
            }

            // Collect all explanation until we hit "Play" or end
            while (i < lines.length && lines[i].trim() !== 'Play' && !lines[i].trim().startsWith('Part')) {
                const trimmed = lines[i].trim();
                if (trimmed !== '') {
                    explanationLines.push(trimmed);
                }
                i++;
            }

            // Add question to data
            if (number && answer && transcript) {
                part1Data.push({
                    number,
                    answer,
                    transcript,
                    explanations: explanationLines
                });
            }
        }
    } else {
        i++;
    }
}

// Format data for Excel with 5 columns (including Tag)
const excelData = part1Data.map(q => {
    // Keep full transcript
    const transcript = q.transcript;

    // Combine all explanations with "Dịch đáp án:" prefix
    const explanation = 'Dịch đáp án:\n' + q.explanations.join('\n');

    // Get tags for this question
    const tags = questionTagMap[q.number] || [];
    const tagString = tags.join(', ');

    return {
        'Số câu': q.number,
        'Đáp án': q.answer,
        'Hiện Transcript': transcript,
        'Giải thích chi tiết đáp án': explanation,
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
    { wch: 80 },  // Hiện Transcript
    { wch: 80 },  // Giải thích chi tiết đáp án
    { wch: 40 }   // Tag
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Part 1');

// Write to file
XLSX.writeFile(wb, outputFile);

console.log(`✓ Đã xuất ${excelData.length} câu hỏi Part 1 vào Excel`);
console.log(`✓ File Excel: ${outputFile}`);
console.log('\n--- Cấu trúc các cột ---');
console.log('1. Số câu');
console.log('2. Đáp án');
console.log('3. Hiện Transcript');
console.log('4. Giải thích chi tiết đáp án (có "Dịch đáp án:" ở đầu)');
console.log('5. Tag (đã bỏ prefix "[Part 1]")');
