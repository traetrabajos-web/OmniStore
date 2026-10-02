import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src-modern');

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.html') && f !== 'marketplace.html');

const oldLogoPattern = /<a class="navbar-brand d-flex align-items-center" href="\.\/index\.html">[\s\S]*?<img src="\/assets\/images\/logo\.svg"[\s\S]*?<\/a>/g;

const newLogo = `<a class="navbar-brand d-flex align-items-center" href="./index.html">
                        <div class="brand-icon me-2">
                            <i class="bi bi-bag-check-fill"></i>
                        </div>
                        <span class="brand-text">OmniStore</span>
                        <span class="admin-pill ms-2">Admin</span>
                    </a>`;

const oldThemeMeta = /<meta name="theme-color" content="#2563eb">/g;
const newThemeMeta = `<meta name="theme-color" content="#ff5722">`;

const oldMarketBtn = /<a href="\.\/marketplace\.html" class="btn btn-warning btn-sm me-2 d-flex align-items-center gap-1 fw-bold text-dark shadow-sm">/g;
const newMarketBtn = `<a href="./marketplace.html" class="btn btn-sm me-2 d-flex align-items-center gap-1 fw-bold text-white shadow-sm marketplace-nav-btn">`;

const oldSidebarBtn = /<a class="nav-link bg-primary text-white fw-bold rounded-3 shadow-sm d-flex align-items-center" href="\.\/marketplace\.html">/g;
const newSidebarBtn = `<a class="nav-link marketplace-nav-btn text-white fw-bold rounded-3 shadow-sm d-flex align-items-center" href="./marketplace.html">`;

for (const file of files) {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (oldLogoPattern.test(content)) {
    content = content.replace(oldLogoPattern, newLogo);
    changed = true;
  }

  if (oldThemeMeta.test(content)) {
    content = content.replace(oldThemeMeta, newThemeMeta);
    changed = true;
  }

  if (oldMarketBtn.test(content)) {
    content = content.replace(oldMarketBtn, newMarketBtn);
    changed = true;
  }

  if (oldSidebarBtn.test(content)) {
    content = content.replace(oldSidebarBtn, newSidebarBtn);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated branding in ${file}`);
  }
}
console.log('Branding unification complete.');
