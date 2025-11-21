import * as XLSX from 'xlsx';
import * as path from 'path';

const itemsData = [
    {
        id: 'Q101',
        part: 'part.1',
        level: 1,
        test: 1,
        stimulusId: 'S101',
        stem: '',
        answer: 'A',
        explain: 'Giải thích cho câu 101',
        order: 1,
        choiceA: '',
        choiceB: '',
        choiceC: '',
        choiceD: '',
        tags: 'tag1, tag2'
    },
    {
        id: 'Q102',
        part: 'part.5',
        level: 2,
        test: 1,
        stimulusId: '',
        stem: 'Question stem for part 5...',
        answer: 'B',
        explain: 'Giải thích cho câu 102',
        order: 2,
        choiceA: 'Option A',
        choiceB: 'Option B',
        choiceC: 'Option C',
        choiceD: 'Option D',
        tags: 'grammar'
    }
];

const stimuliData = [
    {
        id: 'S101',
        part: 'part.1',
        level: 1,
        test: 1,
        image: 'https://example.com/image.jpg',
        audio: 'https://example.com/audio.mp3',
        script: 'Script content here...',
        explain: 'Stimulus explanation'
    }
];

const workbook = XLSX.utils.book_new();

const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');

const stimuliSheet = XLSX.utils.json_to_sheet(stimuliData);
XLSX.utils.book_append_sheet(workbook, stimuliSheet, 'Stimuli');

// Save to admin root for easy access
const outputPath = path.resolve(__dirname, '../../admin/public/sample_import.xlsx');


XLSX.writeFile(workbook, outputPath);

console.log(`Sample Excel file created at: ${outputPath}`);
