import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const inFile = path.join(root, 'images', 'logo.png');
const outDir = path.join(root, 'images');
const sizes = [40, 80, 120];

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const size of sizes) {
    const out = path.join(outDir, `logo-${size}.png`);
    await sharp(inFile)
      .resize(size, size, { fit: 'cover', withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, effort: 10 })
      .toFile(out);
    console.log(`generated ${path.basename(out)} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error('Thumbnail generation failed:', err);
  process.exit(1);
});


