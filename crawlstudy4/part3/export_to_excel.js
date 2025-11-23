const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read the text file
const inputFile = path.join(__dirname, 'text.txt');
const tagFile = path.join(__dirname, 'tag.txt');
const outputFile = path.join(__dirname, 'Part3_Questions.xlsx');

// Read and parse tags
const tagContent = fs.readFileSync(tagFile, 'utf-8');
const tagLines = tagContent.split('\n').map(line => line.trim()).filter(line => line);

// Create a map: question number -> tag names
const questionTagMap = {};
tagLines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 6) {
        const tagName = parts[0].replace('[Part 3] ', ''); // Remove "[Part 3] " prefix
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

// Parse Part 3 data
const part3Data = [];
let i = 0;

while (i < lines.length) {
    const line = lines[i].trim();

    // Look for "Hiện Transcript" which marks the start of a conversation
    if (line === 'Hiện Transcript') {
        i++; // Move to next line

        // Skip empty lines
        while (i < lines.length && lines[i].trim() === '') {
            i++;
        }

        // Collect the conversation (English and Vietnamese)
        let conversationLines = [];
        let endOfConversation = false;

        // Collect lines until we hit a question number
        while (i < lines.length && !endOfConversation) {
            const currentLine = lines[i].trim();

            // Check if this is a question number (just a number)
            if (/^\d+$/.test(currentLine)) {
                endOfConversation = true;
            } else {
                if (currentLine !== '') {
                    conversationLines.push(currentLine);
                }
                i++;
            }
        }

        const conversation = conversationLines.join('\n');

        // Now parse questions for this conversation
        while (i < lines.length) {
            const currentLine = lines[i].trim();

            // Check if this is a question number
            if (/^\d+$/.test(currentLine)) {
                const number = currentLine;
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

                // Get "Dịch đáp án:"
                const explanationLines = [];
                if (i < lines.length && lines[i].trim() === 'Dịch đáp án:') {
                    i++;

                    // Skip empty lines
                    while (i < lines.length && lines[i].trim() === '') {
                        i++;
                    }

                    // Collect explanation until next question number or "Play"
                    while (i < lines.length) {
                        const expLine = lines[i].trim();
                        if (/^\d+$/.test(expLine) || expLine === 'Play' || expLine === 'Hiện Transcript') {
                            break;
                        }
                        if (expLine !== '') {
                            explanationLines.push(expLine);
                        }
                        i++;
                    }
                }

                // Add question to data
                if (number && answer && question) {
                    part3Data.push({
                        number,
                        answer,
                        conversation,
                        question,
                        optionA,
                        optionB,
                        optionC,
                        optionD,
                        explanations: explanationLines
                    });
                }
            } else if (currentLine === 'Play' || currentLine === 'Hiện Transcript' || currentLine.includes('Settings')) {
                // End of this conversation's questions
                break;
            } else {
                i++;
            }
        }
    } else {
        i++;
    }
}

// Format data for Excel
const excelData = part3Data.map(q => {
    // Process explanations to remove question numbers
    const processedExplanations = q.explanations.map((line, index) => {
        // First line often has question number like "32. Người phụ nữ..."
        if (index === 0) {
            return line.replace(/^\d+\.\s*/, '');
        }
        return line;
    });

    // Combine all explanations with "Dịch đáp án:" prefix
    const explanation = 'Dịch đáp án:\n' + processedExplanations.join('\n');

    // Remove question numbers from conversation like (32, 33) or (71)
    const cleanConversation = q.conversation.replace(/\(\d+(?:,\s*\d+)*\)/g, '').replace(/\s+/g, ' ').trim();

    // Get tags for this question
    const tags = questionTagMap[q.number] || [];
    const tagString = tags.join(', ');

    return {
        'Số câu': q.number,
        'Đáp án': q.answer,
        'Hiện Transcript': cleanConversation,
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
    { wch: 120 }, // Hiện Transcript (longer for conversation)
    { wch: 80 },  // Giải thích chi tiết đáp án
    { wch: 60 },  // Câu hỏi
    { wch: 50 },  // A
    { wch: 50 },  // B
    { wch: 50 },  // C
    { wch: 50 },  // D
    { wch: 40 }   // Tag
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Part 3');

// Write to file
XLSX.writeFile(wb, outputFile);

console.log(`✓ Đã xuất ${excelData.length} câu hỏi Part 3 vào Excel`);
console.log(`✓ File Excel: ${outputFile}`);
console.log('\n--- Cấu trúc các cột ---');
console.log('1. Số câu');
console.log('2. Đáp án');
console.log('3. Hiện Transcript (đoạn hội thoại, đã bỏ số câu)');
console.log('4. Giải thích chi tiết đáp án (có "Dịch đáp án:" ở đầu, đã bỏ số câu)');
console.log('5. Câu hỏi');
console.log('6. A');
console.log('7. B');
console.log('8. C');
console.log('9. D');
console.log('10. Tag (đã bỏ prefix "[Part 3]")');
