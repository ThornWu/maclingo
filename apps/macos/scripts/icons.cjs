// Optional developer tool: npm install --no-save --package-lock=false sharp
const sharp = require('sharp');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'maclingo-icons-'));
  try {
    const iconset = path.join(temp, 'AppIcon.iconset');
    fs.mkdirSync(iconset);
    for (const size of [16, 32, 128, 256, 512]) {
      for (const scale of [1, 2]) {
        await sharp(path.join(root, 'shared/assets/icon.svg'), { density: 576 })
          .resize(size * scale, size * scale).png()
          .toFile(path.join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`));
      }
    }
    execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconset, '-o', path.join(root, 'apps/macos/MacLingo/Resources/AppIcon.icns')]);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
