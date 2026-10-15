// Renders the app icons (quenched "研" on near-black) with headless Chromium.
// Usage: node scripts/generate-icons.mjs   (needs network for the Google Font)
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const OUT = "public/icons";
const ICONS = [
  { file: "icon-192.png", size: 192, scale: 0.62 },
  { file: "icon-512.png", size: 512, scale: 0.62 },
  { file: "maskable-512.png", size: 512, scale: 0.46 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.6 },
];

const html = (size, scale) => `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@900&text=%E7%A0%94&display=block" rel="stylesheet">
<style>
  html,body{margin:0;width:${size}px;height:${size}px;background:#0A0A0C}
  div{width:100%;height:100%;display:flex;align-items:center;justify-content:center;
    font-family:'Noto Serif JP';font-weight:900;font-size:${Math.round(size * scale)}px;line-height:1;color:#0A0A0C;
    text-shadow:${[1, -1].flatMap((x) => [`${x * size * 0.004}px 0 0 #FF4D1C`, `0 ${x * size * 0.004}px 0 #FF4D1C`]).join(",")},
      0 0 ${size * 0.02}px rgba(255,77,28,.85),0 0 ${size * 0.06}px rgba(255,77,28,.45)}
</style></head><body><div>研</div></body></html>`;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const { file, size, scale } of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html(size, scale), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/${file}` });
  await page.close();
}
await browser.close();
console.log(`wrote ${ICONS.length} icons to ${OUT}`);
