import fs from 'fs';
import path from 'path';

const dir = 'src-modern';
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

console.log(`\n Total HTML files in project: ${htmlFiles.length}`);

const brokenLinks = [];
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  const regex = /href=["']([^"'#?]+)(\?[^"'#]*)?(#[^"']*)?["']/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    let target = m[1].replace(/^\.\//, '');
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('#')) continue;
    if (target.endsWith('.html') && !fs.existsSync(path.join(dir, target))) {
      brokenLinks.push({ from: file, to: target });
    }
  }
});

console.log(` Broken HTML links found: ${brokenLinks.length}`);
if (brokenLinks.length > 0) {
  console.log(brokenLinks);
} else {
  console.log(' All internal HTML navigation links are valid!');
}
