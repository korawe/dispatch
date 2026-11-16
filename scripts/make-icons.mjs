// Generates the app icons from scripts/icon.svg. Run with: node scripts/make-icons.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const svg = await readFile(path.join(root, "scripts", "icon.svg"));

const outputs = [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["src/app/apple-icon.png", 180],
  ["src/app/icon.png", 64],
];

for (const [file, size] of outputs) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(path.join(root, file));
  console.log(`wrote ${file} (${size}x${size})`);
}
