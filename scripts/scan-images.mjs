import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src-modern');

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.html'));

const imgMap = {};
for (const file of files) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const src = match[1];
    if (!imgMap[src]) imgMap[src] = [];
    imgMap[src].push(file);
  }
}

console.log('=== ALL IMG SRCS IN HTML FILES ===');
for (const [src, fileList] of Object.entries(imgMap)) {
  console.log(`${src} -> [${fileList.length} files] ${fileList.slice(0, 3).join(', ')}${fileList.length > 3 ? '...' : ''}`);
}
