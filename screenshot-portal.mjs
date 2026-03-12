/**
 * Takes screenshots of portal pages by injecting a cookie first.
 * Usage: node screenshot-portal.mjs [clientId]
 * Pass a real clientId from your DB for populated data, or any UUID for empty-state view.
 */
import { createRequire } from 'module';
const puppeteer = createRequire(import.meta.url)(
  'C:/Users/zamar/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js'
);
import fs from 'fs';
import path from 'path';

const clientId = process.argv[2] || '00000000-0000-0000-0000-000000000001';

const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function nextFilename(label) {
  const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
  const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return path.join(dir, `screenshot-${next}-${label}.png`);
}

const PAGES = [
  { url: 'http://localhost:3007/portal/tasks', label: 'portal-tasks' },
  { url: 'http://localhost:3007/portal/invoices', label: 'portal-invoices' },
  { url: 'http://localhost:3007/portal/files', label: 'portal-files' },
];

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Users/zamar/.cache/puppeteer/chrome/win64-146.0.7680.66/chrome-win64/chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const { url, label } of PAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Set the portal auth cookie before navigating
  await page.setCookie({
    name: 'portal_client_id',
    value: clientId,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  const filepath = nextFilename(label);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`Saved: ${filepath}`);
  await page.close();
}

await browser.close();
