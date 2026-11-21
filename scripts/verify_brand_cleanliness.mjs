/**
 * Automated Brand Cleanliness Guard & Regression Scanner
 *
 * Verifies:
 * 1. Production build in frontend/dist/ contains ZERO banned academic/student-project terms.
 * 2. Production build in frontend/dist/ and source in frontend/src/ contain ZERO old brand names
 *    ("VayuPulse", "Pollution XAI", "Air Pollution XAI", "Explainable PM2.5 Intelligence", "PollutionXAI", "XAI App").
 *    (Existing deployment hostnames and backward-compatible storage keys are permitted).
 * 3. Official academic thesis title is strictly quarantined to docs/ACADEMIC_TITLE.md.
 *
 * Exits with code 1 if any violation is detected.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'frontend/dist');
const srcDir = path.resolve(rootDir, 'frontend/src');
const docsDir = path.resolve(rootDir, 'docs');

let violations = 0;

// 1. Banned student project & academic terminology (applied to dist)
const BANNED_ACADEMIC_PATTERNS = [
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

// 2. Old brand names to replace everywhere in user-facing text
const BANNED_OLD_BRAND_PATTERNS = [
  { pattern: /\bVayuPulse\b/i, label: 'VayuPulse' },
  { pattern: /\bPollution XAI\b/i, label: 'Pollution XAI' },
  { pattern: /\bAir Pollution XAI\b/i, label: 'Air Pollution XAI' },
  { pattern: /\bExplainable PM2\.5 Intelligence\b/i, label: 'Explainable PM2.5 Intelligence' },
  { pattern: /\bPollutionXAI\b/i, label: 'PollutionXAI' },
  { pattern: /\bXAI App\b/i, label: 'XAI App' },
];

function getFiles(dir, extensions = ['.html', '.js', '.jsx', '.css', '.json', '.md']) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        files = files.concat(getFiles(fullPath, extensions));
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

// Strip permissible URLs and technical compatibility keys from string before checking
function sanitizeContentForBrandCheck(content) {
  return content
    // Allow existing deployment URLs (as instructed, keep unchanged so deployment doesn't break)
    .replace(/https?:\/\/[a-zA-Z0-9.-]*air-pollution-xai[a-zA-Z0-9.-]*/gi, '[DEPLOYMENT_URL]')
    .replace(/github\.com\/[a-zA-Z0-9_.-]+\/Air-Pollution-XAI/gi, '[GITHUB_REPO_URL]')
    // Allow local storage backward compatibility fallback keys
    .replace(/pollution_xai_theme/gi, '[THEME_FALLBACK_KEY]');
}

console.log('=====================================================');
console.log('🛡️  AirIQ India Brand Cleanliness & Regression Guard');
console.log('=====================================================\n');

// --- AUDIT 1: Built Production Assets (frontend/dist/) ---
if (fs.existsSync(distDir)) {
  const distFiles = getFiles(distDir, ['.html', '.js', '.css', '.json']);
  console.log(`[1/3] Scanning ${distFiles.length} compiled production assets in frontend/dist/...`);

  for (const file of distFiles) {
    const rawContent = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(distDir, file).replace(/\\/g, '/');

    // Check academic words
    for (const { pattern, label } of BANNED_ACADEMIC_PATTERNS) {
      const match = rawContent.match(pattern);
      if (match) {
        console.error(`❌ [ACADEMIC VIOLATION] Found "${label}" in dist/${relPath}`);
        const idx = match.index || 0;
        const snippet = rawContent.substring(Math.max(0, idx - 40), Math.min(rawContent.length, idx + 60)).replace(/\n/g, ' ');
        console.error(`   Snippet: "...${snippet}..."`);
        violations++;
      }
    }

    // Check old brand names
    const sanitized = sanitizeContentForBrandCheck(rawContent);
    for (const { pattern, label } of BANNED_OLD_BRAND_PATTERNS) {
      const match = sanitized.match(pattern);
      if (match) {
        console.error(`❌ [OLD BRAND VIOLATION] Found old brand "${label}" in dist/${relPath}`);
        const idx = match.index || 0;
        const snippet = sanitized.substring(Math.max(0, idx - 40), Math.min(sanitized.length, idx + 60)).replace(/\n/g, ' ');
        console.error(`   Snippet: "...${snippet}..."`);
        violations++;
      }
    }
  }
} else {
  console.log('[1/3] Note: frontend/dist/ not found yet (will be validated post-build).');
}

// --- AUDIT 2: Frontend Source Code (frontend/src/) ---
if (fs.existsSync(srcDir)) {
  const srcFiles = getFiles(srcDir, ['.html', '.js', '.jsx', '.css']);
  console.log(`[2/3] Scanning ${srcFiles.length} source files in frontend/src/...`);

  for (const file of srcFiles) {
    const rawContent = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(srcDir, file).replace(/\\/g, '/');

    // Check academic words
    for (const { pattern, label } of BANNED_ACADEMIC_PATTERNS) {
      const match = rawContent.match(pattern);
      if (match) {
        console.error(`❌ [ACADEMIC VIOLATION] Found "${label}" in src/${relPath}`);
        violations++;
      }
    }

    // Check old brand names
    const sanitized = sanitizeContentForBrandCheck(rawContent);
    for (const { pattern, label } of BANNED_OLD_BRAND_PATTERNS) {
      const match = sanitized.match(pattern);
      if (match) {
        console.error(`❌ [OLD BRAND VIOLATION] Found old brand "${label}" in src/${relPath}`);
        violations++;
      }
    }
  }
}

// --- AUDIT 3: Documentation & Academic Title Isolation (docs/) ---
if (fs.existsSync(docsDir)) {
  const docFiles = getFiles(docsDir, ['.md']);
  console.log(`[3/3] Scanning ${docFiles.length} documentation files in docs/...`);

  const ACADEMIC_TITLE_PHRASE = /Explainable AI for Air Quality: Spatial PM2\.5 Prediction and Interpretability in India/i;

  for (const file of docFiles) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');

    if (relPath !== 'docs/ACADEMIC_TITLE.md' && ACADEMIC_TITLE_PHRASE.test(content)) {
      console.error(`❌ [POLICY VIOLATION] Academic capstone title found in unauthorized file: ${relPath}`);
      console.error('   Official academic title is strictly restricted to docs/ACADEMIC_TITLE.md.');
      violations++;
    }
  }
}

// Final Outcome
console.log('-----------------------------------------------------');
if (violations > 0) {
  console.error(`🚨 Cleanliness & Regression Check FAILED with ${violations} violation(s).`);
  process.exit(1);
} else {
  console.log('✅ ALL CHECKS PASSED: 0 academic terms, 0 old brand leaks, academic title strictly quarantined.');
  process.exit(0);
}
