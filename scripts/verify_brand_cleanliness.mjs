/**
 * Automated Brand Cleanliness Guard
 * Scans the production build output in frontend/dist/ for banned academic,
 * student-project, or placeholder terminology.
 * Exits with code 1 if any forbidden term is detected.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../frontend/dist');

if (!fs.existsSync(distDir)) {
  console.error(`[Error] dist directory not found at ${distDir}. Run 'npm run build' first.`);
  process.exit(1);
}

// Banned regex patterns for real consumer product
const BANNED_PATTERNS = [
  { pattern: /\bcapstone\b/i, label: 'capstone' },
  { pattern: /\bfinal[- ]year\b/i, label: 'final-year' },
  { pattern: /\bB\.?Tech\b/i, label: 'B.Tech' },
  { pattern: /\bstudent project\b/i, label: 'student project' },
  { pattern: /\bcollege demo\b/i, label: 'college demo' },
  { pattern: /\btest preset\b/i, label: 'test preset' },
  { pattern: /\boutside_training_region\b/i, label: 'outside_training_region' },
  { pattern: /\blorem ipsum\b/i, label: 'lorem ipsum' },
  { pattern: /\bTODO\b/, label: 'TODO' },
];

function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else if (/\.(html|js|css|json)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles(distDir);
let violations = 0;

console.log(`[Brand Guard] Scanning ${files.length} built assets in ${distDir}...`);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(distDir, file).replace(/\\/g, '/');

  for (const { pattern, label } of BANNED_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      console.error(`❌ [VIOLATION] Found banned term "${label}" in dist/${relPath}`);
      // Find surrounding snippet
      const idx = match.index || 0;
      const snippet = content.substring(Math.max(0, idx - 40), Math.min(content.length, idx + 60)).replace(/\n/g, ' ');
      console.error(`   Snippet: "...${snippet}..."`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n🚨 Brand Cleanliness Check FAILED with ${violations} violation(s).`);
  process.exit(1);
} else {
  console.log(`\n✅ Brand Cleanliness Check PASSED. All ${files.length} production assets are clean of banned academic wording.`);
  process.exit(0);
}
