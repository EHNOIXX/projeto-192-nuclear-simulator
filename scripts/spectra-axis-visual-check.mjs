import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const out = 'artifacts/spectra-axis';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

try {
  await page.goto('http://127.0.0.1:4173/nave/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#viewport canvas', { timeout: 90000 });
  await page.waitForFunction(() => document.querySelector('#renderStatus')?.textContent.includes('PRONTO'), { timeout: 90000 });
  await page.waitForTimeout(2500);

  const views = [
    ['frontal', 'front'],
    ['traseira', 'rear'],
    ['superior', 'top'],
    ['inferior', 'bottom'],
    ['lateral-direita', 'side'],
    ['lateral-esquerda', 'left']
  ];
  for (const [name, camera] of views) {
    await page.locator(`[data-camera="${camera}"]`).evaluate(el => el.click());
    await page.waitForTimeout(900);
    const rect = await page.locator('#viewport').evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    await page.screenshot({ path: `${out}/spectra-axis-${name}.png`, clip: rect, animations: 'disabled', timeout: 60000 });
  }

  // Smoke tests dos controles preservados.
  await page.locator('#autoRotate').evaluate(el => el.click());
  if (!(await page.locator('#autoRotate').evaluate(el => el.classList.contains('active')))) throw new Error('Órbita automática não ativou');
  await page.locator('#autoRotate').evaluate(el => el.click());

  await page.locator('[data-module="egas"]').check();
  await page.locator('[data-module="egas"]').uncheck();

  const piece = page.locator('#pieceSelect');
  const firstPiece = await piece.locator('option').nth(1).getAttribute('value');
  if (!firstPiece) throw new Error('Lista de componentes individuais vazia');
  await piece.selectOption(firstPiece);
  await page.locator('#hidePiece').evaluate(el => el.click());
  await page.locator('#restorePieces').evaluate(el => el.click());

  await page.locator('#modeCut').evaluate(el => el.click());
  if (!(await page.locator('#modeCut').evaluate(el => el.classList.contains('active')))) throw new Error('Modo de corte não ativou');
  await page.locator('#modeAssembled').evaluate(el => el.click());

  const dimensions = {
    length: await page.locator('#statLen').textContent(),
    width: await page.locator('#statWid').textContent(),
    height: await page.locator('#statHei').textContent()
  };
  if (dimensions.length !== '160 m' || dimensions.width !== '96 m' || dimensions.height !== '48 m') {
    throw new Error(`Envelope dimensional inesperado: ${JSON.stringify(dimensions)}`);
  }
  if (errors.length) throw new Error('Erros de console/runtime: ' + errors.join(' | '));

  await fs.writeFile(`${out}/validation.json`, JSON.stringify({ status: 'passed', views: views.map(([name]) => name), dimensions, controls: ['orbit', 'module visibility', 'individual selection', 'hide/restore', 'section cut', 'assembled mode'] }, null, 2));
  console.log('SPECTRA-AXIS visual validation passed');
} catch (error) {
  await fs.writeFile(`${out}/validation-error.txt`, String(error.stack || error));
  throw error;
} finally {
  await browser.close();
}
