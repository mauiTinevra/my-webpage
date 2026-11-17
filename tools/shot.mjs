// Screenshot harness for the gallery. Renders a page at desktop and phone sizes and reports
// what a reviewer needs: console errors, page height, sideways overflow and loaded fonts.
//
//   node tools/shot.mjs <file-or-url> <out-prefix> [--click "<selector>"]
//
// Writes <out-prefix>-desktop-top.png, -desktop-full.png, -phone-top.png, -phone-full.png
// and prints one JSON line per size.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { resolve } from 'node:path';

const [target, prefix = '/tmp/shot', ...rest] = process.argv.slice(2);
if (!target) {
  console.error('usage: node tools/shot.mjs <file-or-url> <out-prefix> [--click "<selector>"]');
  process.exit(1);
}
const click = rest[0] === '--click' ? rest[1] : null;
const url = /^https?:|^file:/.test(target) ? target : `file://${resolve(target)}`;

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${prefix}-${name}-top.png` });
  if (click) {
    await page.click(click).catch((e) => errors.push(`click failed: ${e.message.split('\n')[0]}`));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${prefix}-${name}-clicked.png` });
  }
  // Scroll through once so lazy content and scroll effects have run, then capture the page.
  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < docHeight; y += 700) {
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${prefix}-${name}-full.png`, fullPage: true });
  const info = await page.evaluate(() => ({
    docHeight: document.documentElement.scrollHeight,
    sidewaysOverflow: document.documentElement.scrollWidth > innerWidth,
    fontsLoaded: [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))],
  }));
  console.log(JSON.stringify({ size: name, ...info, consoleErrors: errors }));
  await page.close();
}
await browser.close();
