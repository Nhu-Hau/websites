const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read the text file
const inputFile = path.join(__dirname, 'text.txt');
const tagFile = path.join(__dirname, 'tag.txt');
const outputFile = path.join(__dirname, 'Part2_Questions.xlsx');

// Read and parse tags
const tagContent = fs.readFileSync(tagFile, 'utf-8');
const tagLines = tagContent.split('\n').map(line => line.trim()).filter(line => line);

// Create a map: question number -> tag names
const questionTagMap = {};
tagLines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 6) {
        const tagName = parts[0].replace('[Part 2] ', ''); // Remove "[Part 2] " prefix
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

// Parse Part 2 data
const part2Data = [];
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

        // Next line should be the transcript with question and answers
        const transcript = lines[i].trim();
        i++;

        // Skip empty lines
        while (i < lines.length && lines[i].trim() === '') {
            i++;
        }

        // Next should be question number
        const number = lines[i].trim();
        i++;

        // Skip A. B. C.
        while (i < lines.length && /^[A-C]\.$/.test(lines[i].trim())) {
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

            // Parse transcript to extract question and answers
            let question = '';
            let optionA = '';
            let optionB = '';
            let optionC = '';

            // Remove speaker prefix (M-Au:, W-Br:, etc.) and extract parts
            const cleanTranscript = transcript.replace(/^[MW]-[A-Z][a-z]\s*/, '');

            // Extract question (before first (A))
            const questionMatch = cleanTranscript.match(/^(.*?)\(A\)/);
            if (questionMatch) {
                question = questionMatch[1].trim();
            }

            // Extract options
            const optionAMatch = cleanTranscript.match(/\(A\)\s*([^(]*?)(?=\(B\)|$)/);
            if (optionAMatch) {
                optionA = optionAMatch[1].trim();
            }

            const optionBMatch = cleanTranscript.match(/\(B\)\s*([^(]*?)(?=\(C\)|$)/);
            if (optionBMatch) {
                optionB = optionBMatch[1].trim();
            }

            const optionCMatch = cleanTranscript.match(/\(C\)\s*([^(]*?)$/);
            if (optionCMatch) {
                optionC = optionCMatch[1].trim();
            }

            // Add question to data
            if (number && answer && transcript) {
                part2Data.push({
                    number,
                    answer,
                    transcript,
                    question,
                    optionA,
                    optionB,
                    optionC,
                    explanations: explanationLines
                });
            }
        }
    } else {
        i++;
    }
}

// Format data for Excel (giống Part 1 + thêm 4 cột + Tag)
const excelData = part2Data.map(q => {
    // Process explanations to remove question numbers
    const processedExplanations = q.explanations.map((line, index) => {
        // First line often has question number like "7. Tại sao..."
        if (index === 0) {
            return line.replace(/^\d+\.\s*/, '');
        }
        return line;
    });

    // Combine all explanations with "Dịch đáp án:" prefix
    const explanation = 'Dịch đáp án:\n' + processedExplanations.join('\n');

    // Get tags for this question
    const tags = questionTagMap[q.number] || [];
    const tagString = tags.join(', ');

    return {
        'Số câu': q.number,
        'Đáp án': q.answer,
        'Hiện Transcript': q.transcript,
        'Giải thích chi tiết đáp án': explanation,
        'Câu hỏi': q.question,
        'A': q.optionA,
        'B': q.optionB,
        'C': q.optionC,
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
    { wch: 100 }, // Hiện Transcript
    { wch: 80 },  // Giải thích chi tiết đáp án
    { wch: 60 },  // Câu hỏi
    { wch: 50 },  // A
    { wch: 50 },  // B
    { wch: 50 },  // C
    { wch: 40 }   // Tag
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Part 2');

// Write to file
XLSX.writeFile(wb, outputFile);

console.log(`✓ Đã xuất ${excelData.length} câu hỏi Part 2 vào Excel`);
console.log(`✓ File Excel: ${outputFile}`);
console.log('\n--- Cấu trúc các cột ---');
console.log('1. Số câu');
console.log('2. Đáp án');
console.log('3. Hiện Transcript');
console.log('4. Giải thích chi tiết đáp án (có "Dịch đáp án:" ở đầu, đã bỏ số câu)');
console.log('5. Câu hỏi');
console.log('6. A');
console.log('7. B');
console.log('8. C');
console.log('9. Tag (đã bỏ prefix "[Part 2]")');
