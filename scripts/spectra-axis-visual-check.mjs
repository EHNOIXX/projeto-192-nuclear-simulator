import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const out = process.env.SPECTRA_OUTPUT || 'artifacts/spectra-axis';
const baseUrl = process.env.SPECTRA_URL || 'http://127.0.0.1:4173/nave/';
const requireGeometryVersion = process.env.SPECTRA_REQUIRE_GEOMETRY_VERSION !== '0';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const errors = [];
const cdp = await page.context().newCDPSession(page);
await cdp.send('Page.enable');
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#viewport canvas', { timeout: 90000 });
  await page.waitForFunction(() => window.__spectraReady === true && Number.isFinite(window.__spectraStartupMs), { timeout: 90000 });
  const startupMs = await page.evaluate(() => window.__spectraStartupMs);
  const geometry = await page.evaluate(() => ({
    version: window.__spectraGeometryVersion || null,
    hull: window.__spectraHullDimensions || null,
    ship: window.__spectraShipDimensions || null
  }));
  if (requireGeometryVersion && geometry.version !== 'blueprint-blockout-v1') {
    throw new Error('O navegador não carregou a geometria esperada: ' + JSON.stringify(geometry));
  }
  if (requireGeometryVersion && (!geometry.ship || !geometry.hull ||
      Math.abs(geometry.ship.length - 2500) > 1 ||
      Math.abs(geometry.ship.width - 1200) > 1 ||
      Math.abs(geometry.ship.height - 800) > 1 ||
      Math.abs(geometry.hull.length - 2500) > 1 ||
      Math.abs(geometry.hull.width - 1200) > 1 ||
      Math.abs(geometry.hull.height - 800) > 1)) {
    throw new Error('Envelope geométrico real da nave fora da especificação: ' + JSON.stringify(geometry));
  }
  const canvasSize = await page.locator('#viewport canvas').evaluate(el => ({ width: el.width, height: el.height }));
  if (!canvasSize.width || !canvasSize.height) throw new Error('Canvas WebGL sem dimensões após inicialização');
  await page.waitForTimeout(500);

  const views = [
    ['frontal', 'front'],
    ['traseira', 'rear'],
    ['superior', 'top'],
    ['inferior', 'bottom'],
    ['lateral-direita', 'side'],
    ['lateral-esquerda', 'left'],
    ['isometrica', 'iso']
  ];
  for (const [name, camera] of views) {
    await page.locator(`[data-camera="${camera}"]`).evaluate(el => el.click());
    await page.waitForTimeout(900);
    const rect = await page.locator('#viewport').evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    const capture = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false, clip: { ...rect, scale: 1 } });
    await fs.writeFile(`${out}/spectra-axis-${name}.png`, Buffer.from(capture.data, 'base64'));
  }

  // Smoke tests dos controles preservados.
  await page.locator('#autoRotate').evaluate(el => el.click());
  if (!(await page.locator('#autoRotate').evaluate(el => el.classList.contains('active')))) throw new Error('Órbita automática não ativou');
  await page.locator('#autoRotate').evaluate(el => el.click());

  const egasToggle = page.locator('[data-module="egas"]');
  const egasLabel = egasToggle.locator('xpath=..');
  await egasLabel.scrollIntoViewIfNeeded();
  await egasLabel.click();
  if (!(await egasToggle.isChecked())) throw new Error('Controle de visibilidade EGAS não ativou');
  await egasLabel.click();
  if (await egasToggle.isChecked()) throw new Error('Controle de visibilidade EGAS não desativou');

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
  const expectedDimensions = requireGeometryVersion
    ? { length: '2500 m', width: '1200 m', height: '800 m' }
    : { length: '160 m', width: '96 m', height: '48 m' };
  if (dimensions.length !== expectedDimensions.length || dimensions.width !== expectedDimensions.width || dimensions.height !== expectedDimensions.height) {
    throw new Error(`Envelope dimensional inesperado: ${JSON.stringify(dimensions)}; esperado: ${JSON.stringify(expectedDimensions)}`);
  }
  if (errors.length) throw new Error('Erros de console/runtime: ' + errors.join(' | '));

  await fs.writeFile(`${out}/validation.json`, JSON.stringify({ status: 'passed', startup_ms_from_navigation: startupMs, canvas: canvasSize, views: views.map(([name]) => name), dimensions, geometry, controls: ['orbit', 'module visibility', 'individual selection', 'hide/restore', 'section cut', 'assembled mode'] }, null, 2));
  console.log(`SPECTRA-AXIS visual validation passed; startup=${startupMs}ms; canvas=${canvasSize.width}x${canvasSize.height}`);
} catch (error) {
  await fs.writeFile(`${out}/validation-error.txt`, String(error.stack || error));
  throw error;
} finally {
  await browser.close();
}
