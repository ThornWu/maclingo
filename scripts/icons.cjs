// Optional developer tool: npm install --no-save --package-lock=false sharp
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'extension/icons'), { recursive: true });
Promise.all([16, 32, 48, 128].map(size =>
  sharp(path.join(root, 'assets/icon.svg'), { density: 384 })
    .resize(size, size).png().toFile(path.join(root, `extension/icons/icon${size}.png`))
)).catch(error => { console.error(error); process.exitCode = 1; });
