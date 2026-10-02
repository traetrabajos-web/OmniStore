import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src-modern');

const htmlFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.html'));

console.log('Total HTML files:', htmlFiles.length);
console.log('Files:', htmlFiles.sort());

const allHrefs = new Set();
const brokenHrefs = [];
const hashOnlyHrefs = {};

for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  
  // check hrefs
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    const raw = match[1];
    if (raw === '#' || raw === '#!' || raw === 'javascript:void(0)' || raw === 'javascript:;') {
      hashOnlyHrefs[file] = (hashOnlyHrefs[file] || 0) + 1;
      continue;
    }
    if (raw.startsWith('#')) continue;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('data:')) {
      continue;
    }

    allHrefs.add(raw);
    let cleanPath = raw.split('?')[0].split('#')[0];
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);

    if (cleanPath && !cleanPath.includes('assets') && !cleanPath.includes('manifest.json')) {
      const fullP = path.join(srcDir, cleanPath);
      if (!fs.existsSync(fullP)) {
        brokenHrefs.push({ file, link: raw, target: cleanPath });
      }
    }
  }

  // check window.location or navigate in js scripts or inline onclick
  const navRegex = /(?:window\.location(?:\.href|\.replace)?\s*=\s*|location\.href\s*=\s*)["']([^"']+)["']/g;
  while ((match = navRegex.exec(content)) !== null) {
    const raw = match[1];
    if (!raw.startsWith('http')) {
      let cleanPath = raw.split('?')[0].split('#')[0];
      if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
      if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
      if (cleanPath && !cleanPath.includes('assets')) {
        const fullP = path.join(srcDir, cleanPath);
        if (!fs.existsSync(fullP)) {
          brokenHrefs.push({ file, link: raw, target: cleanPath, type: 'js-navigation' });
        }
      }
    }
  }
}

console.log('\n=== UNIQUE LOCAL HREF TARGETS ===');
console.log(Array.from(allHrefs).sort());

console.log('\n=== BROKEN TARGETS (' + brokenHrefs.length + ') ===');
brokenHrefs.forEach(b => console.log(`${b.file} -> ${b.link} (target: ${b.target}) ${b.type || ''}`));

console.log('\n=== HASH-ONLY / PLACEHOLDER HREF COUNTS PER FILE ===');
for (const [f, count] of Object.entries(hashOnlyHrefs)) {
  console.log(`${f}: ${count} placeholder links`);
}
