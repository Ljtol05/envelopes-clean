#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Go up one directory from /scripts to project root
const root = path.resolve(new URL('.', import.meta.url).pathname, '..');
const src = path.join(root, 'src/assets/branding/owl.png');
const outDir = path.join(root, 'public/icons');
const sizes = [16,32,48,64,96,128,192,256,384,512,1024];
await fs.promises.mkdir(outDir, { recursive: true });
if (!fs.existsSync(src)) {
  console.error('Source owl.png not found at', src);
  process.exit(1);
}
for (const size of sizes) {
  const pngOut = path.join(outDir, `owl-${size}.png`);
  const webpOut = path.join(outDir, `owl-${size}.webp`);
  await sharp(src).resize(size, size).toFile(pngOut);
  await sharp(src).resize(size, size).webp({ quality: 90 }).toFile(webpOut);
  console.log('Generated', size);
}
// favicon.ico (16,32,48)
const icoSizes = [16,32,48];
const icoBuffers = await Promise.all(icoSizes.map(s => sharp(src).resize(s,s).png().toBuffer()));
try {
  const toIco = (await import('to-ico')).default;
  const ico = await toIco(icoBuffers);
  await fs.promises.writeFile(path.join(outDir, 'favicon.ico'), ico);
  console.log('favicon.ico created');
} catch {
  await fs.promises.copyFile(path.join(outDir,'owl-32.png'), path.join(outDir,'favicon.ico'));
  console.log('favicon.ico fallback (single 32px) created');
}
