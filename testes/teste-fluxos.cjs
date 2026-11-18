const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
// App compilado (rode `npm run build` antes). Pode ser sobrescrito com APP_URL.
const APP = process.env.APP_URL || pathToFileURL(path.resolve(__dirname, '../dist/index.html')).href;
const OUT = path.resolve(__dirname, 'saida');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
  await page.goto(APP + '#vagas');
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Nova vaga' }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Colar lista' }).click();
  await page.locator('textarea').last().fill('Python\nSQL\nSéries temporais\nExperiência com Azure ou Databricks\nPower BI\nKubernetes');
  await page.getByRole('button', { name: 'Adicionar', exact: true }).last().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'job.png'), fullPage: true });
  await page.evaluate(() => location.hash = 'linkedin'); await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Novo rascunho' }).first().click();
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'linkedin2.png') });
  await page.evaluate(() => location.hash = 'dashboard'); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'dash2.png'), fullPage: true });
  await page.keyboard.press('Control+k'); await page.waitForTimeout(200);
  await page.keyboard.type('anomalia'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  console.log('palette ->', await page.evaluate(() => location.hash));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
