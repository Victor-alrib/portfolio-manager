const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
// App compilado (rode `npm run build` antes). Pode ser sobrescrito com APP_URL.
const APP = process.env.APP_URL || pathToFileURL(path.resolve(__dirname, '../dist/index.html')).href;
const OUT = path.resolve(__dirname, 'saida');
fs.mkdirSync(OUT, { recursive: true });

const mock = `
window.__store = {};
window.__writes = 0;
const mkDoc = (path) => ({ id: path.split('/').pop(),
  set: async (d) => { window.__writes++; window.__store[path] = JSON.parse(JSON.stringify(d)); },
  delete: async () => { delete window.__store[path]; } });
const db = { collection: (p) => ({ get: async () => { const docs = Object.keys(window.__store).filter(k => k.startsWith(p + '/')).map(k => ({ id: k.split('/').pop(), data: () => window.__store[k] })); return { docs }; }, doc: (id) => mkDoc(p + '/' + id) }) };
const user = { id: async () => 'u123' };
setTimeout(() => { window.claude = { use: async (n) => n === 'db' ? db : n === 'user' ? user : null }; }, 300);
`;
(async () => {
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const ctx = await b.newContext();
  await ctx.addInitScript(mock);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(APP);
  await page.waitForTimeout(3500);
  let keys = await page.evaluate(() => Object.keys(window.__store));
  console.log('docs after first sync:', keys.length, keys.slice(0,4));
  const w1 = await page.evaluate(() => window.__writes);
  // change one project
  await page.evaluate(() => location.hash = 'kanban'); await page.waitForTimeout(300);
  await page.locator('article', { hasText: 'Manutenção preditiva' }).hover();
  await page.locator('article', { hasText: 'Manutenção preditiva' }).getByLabel('Mover para próxima etapa').click();
  await page.waitForTimeout(2500);
  const w2 = await page.evaluate(() => window.__writes);
  console.log('writes for one change:', w2 - w1, '(expect 2: project + meta; reorder may add)');
  console.log('status:', await page.locator('aside').last().innerText().then(t => t.split('\n').pop()));
  console.log('errors', errs);
  await b.close();
})();
