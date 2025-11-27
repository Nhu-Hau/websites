#!/usr/bin/env node

/**
 * Script to detect hardcoded Vietnamese/English text in TSX files
 * Usage: node scripts/check-hardcoded-text.js [directory]
 */

const fs = require('fs');
const path = require('path');

// Vietnamese character patterns
const VIETNAMESE_PATTERN = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/;

// Common English phrases that should be translated
const COMMON_ENGLISH_PHRASES = [
  /["'](Start|Cancel|Save|Delete|Edit|Close|Open|Submit|Loading|Error|Success|Failed|Please|Click|Tap|Select|Choose)[^"']*["']/i,
  /["'][A-Z][a-z]+ [A-Z][a-z]+[^"']*["']/, // Multi-word capitalized phrases
];

// Exclude patterns (comments, console.log, etc.)
const EXCLUDE_PATTERNS = [
  /\/\/.*/, // Comments
  /console\.(log|error|warn)/,
  /aria-label/,
  /title=/,
  /placeholder=/,
  /alt=/,
  /className/,
  /href=/,
  /src=/,
  /dangerouslySetInnerHTML/,
];

function shouldExclude(line) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(line));
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    if (shouldExclude(line)) return;

    // Check for Vietnamese text
    if (VIETNAMESE_PATTERN.test(line)) {
      // Check if it's inside a string literal
      const stringMatches = line.match(/["']([^"']*[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ][^"']*)["']/g);
      if (stringMatches) {
        issues.push({
          line: index + 1,
          type: 'vietnamese',
          matches: stringMatches,
          content: line.trim(),
        });
      }
    }

    // Check for common English phrases
    COMMON_ENGLISH_PHRASES.forEach((pattern, i) => {
      const matches = line.match(pattern);
      if (matches && !line.includes('useTranslations') && !line.includes('t(')) {
        issues.push({
          line: index + 1,
          type: 'english',
          matches: matches,
          content: line.trim(),
        });
      }
    });
  });

  return issues;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  const targetDir = process.argv[2] || path.join(__dirname, '../src');
  const files = walkDir(targetDir);
  const allIssues = [];

  console.log(`\n🔍 Checking ${files.length} files for hardcoded text...\n`);

  files.forEach(file => {
    const issues = checkFile(file);
    if (issues.length > 0) {
      allIssues.push({ file, issues });
    }
  });

  if (allIssues.length === 0) {
    console.log('✅ No hardcoded text found!\n');
    process.exit(0);
  }

  console.log(`⚠️  Found hardcoded text in ${allIssues.length} files:\n`);

  allIssues.forEach(({ file, issues }) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`📄 ${relativePath}`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.type}`);
      issue.matches.forEach(match => {
        console.log(`     - ${match}`);
      });
    });
    console.log('');
  });

  console.log(`\n💡 Tip: Use useTranslations() hook and add keys to en.json and vi.json\n`);
  process.exit(1);
}

main();











