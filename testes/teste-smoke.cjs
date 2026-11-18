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
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
  await page.goto(APP);
  await page.waitForTimeout(1500);
  const routes = ['dashboard','projetos','projeto-psolar','kanban','readme-psolar','competencias','vagas','entrevistas-ppdm','linkedin','exportar','configuracoes'];
  for (const r of routes) {
    await page.evaluate(h => location.hash = h, r);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${r}.png`), fullPage: false });
  }
  // Kanban drag: psolar -> desenvolvimento column
  await page.evaluate(() => location.hash = 'kanban'); await page.waitForTimeout(500);
  const card = page.locator('article', { hasText: 'usina solar' });
  const col = page.locator('section[aria-label="Em desenvolvimento"]');
  await card.dragTo(col);
  await page.waitForTimeout(400);
  const inDev = await col.locator('article', { hasText: 'usina solar' }).count();
  console.log('drag moved to dev:', inDev);
  await page.screenshot({ path: path.join(OUT, 'kanban-after.png') });
  // arrow move
  await page.locator('article', { hasText: 'Manutenção preditiva' }).hover();
  await page.locator('article', { hasText: 'Manutenção preditiva' }).getByLabel('Mover para próxima etapa').click();
  await page.waitForTimeout(300);
  console.log('arrow moved:', await col.locator('article', { hasText: 'Manutenção preditiva' }).count());
  // New project
  await page.getByLabel('Novo projeto').first().click();
  await page.getByPlaceholder('Ex.: Previsão de demanda de energia').fill('Projeto teste QA');
  await page.getByRole('button', { name: 'Criar projeto' }).click();
  await page.waitForTimeout(500);
  console.log('hash after create:', await page.evaluate(() => location.hash));
  // Add step
  await page.getByPlaceholder('Nova etapa…').fill('Etapa A');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await page.getByLabel('Concluir Etapa A').check();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'new-project.png') });
  // Exports
  await page.evaluate(() => location.hash = 'exportar'); await page.waitForTimeout(500);
  for (const name of ['Baixar README.md','Baixar JSON']) {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.getByRole('button', { name }).click()]);
    console.log('download', d.suggestedFilename());
  }
  const pdfBtns = page.getByRole('button', { name: 'Baixar PDF' });
  for (let i = 0; i < 2; i++) {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), pdfBtns.nth(i).click()]);
    const p = path.join(OUT, d.suggestedFilename()); await d.saveAs(p); console.log('pdf', d.suggestedFilename());
  }
  // persistence reload
  await page.reload(); await page.waitForTimeout(1200);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('portfolio-manager:data')).projects.length);
  console.log('projects after reload:', stored);
  // light mode
  await page.evaluate(() => location.hash = 'dashboard'); await page.waitForTimeout(300);
  await page.getByLabel('Ativar tema claro').click(); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'dashboard-light.png') });
  // mobile
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'mobile.png') });
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
