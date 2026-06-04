#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist/app');
const candidateRoots = [path.join(distDir, 'browser'), distDir];
const buildRoot = candidateRoots.find((candidate) => fs.existsSync(path.join(candidate, 'index.html')));
const indexPath = buildRoot ? path.join(buildRoot, 'index.html') : path.join(distDir, 'index.html');
const maxInitialBundleBytes = Number.parseInt(process.env.MAX_INITIAL_BUNDLE_BYTES ?? '350000', 10);

if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/app/index.html was not found. Run a production build first.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const assetMatches = [...indexHtml.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)];
const localAssets = [...new Set(assetMatches.map((match) => match[1]))]
  .filter((asset) => !asset.startsWith('http://') && !asset.startsWith('https://'))
  .map((asset) => asset.replace(/^\//, '').split('?')[0]);

let totalBytes = 0;
const measuredAssets = [];

for (const asset of localAssets) {
  const fullPath = path.join(buildRoot ?? distDir, asset);
  if (!fs.existsSync(fullPath)) {
    continue;
  }
  const size = fs.statSync(fullPath).size;
  measuredAssets.push({ asset, size });
  totalBytes += size;
}

for (const { asset, size } of measuredAssets) {
  console.log(`- ${asset}: ${(size / 1024).toFixed(2)} kB`);
}

console.log(`Initial bundle total: ${(totalBytes / 1024).toFixed(2)} kB`);
console.log(`Budget: ${(maxInitialBundleBytes / 1024).toFixed(2)} kB`);

if (totalBytes > maxInitialBundleBytes) {
  console.error(
    `❌ Initial bundle budget exceeded by ${((totalBytes - maxInitialBundleBytes) / 1024).toFixed(2)} kB.`
  );
  process.exit(1);
}

console.log('✅ Initial bundle is within configured budget.');
