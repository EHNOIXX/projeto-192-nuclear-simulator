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
const cdp = await page.context().newCDPSession(page);
await cdp.send('Page.enable');
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

try {
  await page.goto('http://127.0.0.1:4173/nave/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#viewport canvas', { timeout: 90000 });
  await page.waitForFunction(() => window.__spectraReady === true && Number.isFinite(window.__spectraStartupMs), { timeout: 90000 });
  const startupMs = await page.evaluate(() => window.__spectraStartupMs);
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
    const cameraState = await page.evaluate(() => ({ camera: window.__spectraCameraMetrics || null, drawCalls: window.__spectraRenderer?.info?.render?.calls ?? 0 }));
    if (!cameraState.camera || cameraState.camera.view !== camera || cameraState.camera.fogFar <= cameraState.camera.cameraDistance || cameraState.drawCalls <= 0) {
      throw new Error(`Câmera ou renderização inválida na vista ${name}: ${JSON.stringify(cameraState)}`);
    }
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

  const measured = await page.evaluate(() => {
    const root = window.__spectraRoot;
    if (!root) throw new Error('Grupo raiz da nave não foi exposto');
    root.updateMatrixWorld(true);
    const THREE = window.__spectraTHREE;
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    return { min: box.min.toArray(), max: box.max.toArray(), size: { length: size.x, height: size.y, width: size.z }, rootScale: root.scale.toArray() };
  });
  const dimensions = {
    length: await page.locator('#statLen').textContent(),
    width: await page.locator('#statWid').textContent(),
    height: await page.locator('#statHei').textContent()
  };
  if (dimensions.length !== '250 m' || dimensions.width !== '120 m' || dimensions.height !== '80 m') {
    throw new Error(`Envelope dimensional inesperado: ${JSON.stringify(dimensions)}`);
  }
  const runtime = await page.evaluate(() => window.__spectraRuntimeMetrics || null);
  if (!runtime || !runtime.envelopeMatches) throw new Error('Envelope medido não corresponde à configuração: ' + JSON.stringify(runtime));
  const structure = await page.evaluate(() => {
    const root = window.__spectraRoot;
    const groups = window.__spectraGroups;
    const propulsion = groups?.propulsion;
    const engines = propulsion?.children.filter(object => object.name.startsWith('aft_engine_')) || [];
    const world = engines.map(object => {
      const position = new window.__spectraTHREE.Vector3();
      object.getWorldPosition(position);
      return { name: object.name, x: position.x, y: position.y, z: position.z };
    }).sort((a, b) => a.z - b.z);
    return {
      rootContainsSubsystems: Object.values(groups || {}).every(group => group.parent === root),
      subsystemCount: Object.keys(groups || {}).length,
      engines: world
    };
  });
  if (!structure.rootContainsSubsystems || structure.subsystemCount !== 11) {
    throw new Error('Hierarquia principal de subsistemas alterada: ' + JSON.stringify(structure));
  }
  if (structure.engines.length !== 3) throw new Error('Quantidade de propulsores traseiros divergente: ' + JSON.stringify(structure.engines));
  const engineYs = structure.engines.map(engine => engine.y);
  const engineXs = structure.engines.map(engine => engine.x);
  const engineZs = structure.engines.map(engine => engine.z);
  if (Math.max(...engineYs) - Math.min(...engineYs) > 0.01 ||
      Math.max(...engineXs) - Math.min(...engineXs) > 0.01 ||
      Math.abs(engineZs[1]) > 0.01 ||
      Math.abs(engineZs[0] + engineZs[2]) > 0.01) {
    throw new Error('Os três propulsores não estão alinhados/simétricos no eixo longitudinal: ' + JSON.stringify(structure.engines));
  }
  const expected = { length: 250, width: 120, height: 80 };
  for (const key of Object.keys(expected)) {
    if (Math.abs(runtime.renderedEnvelope[key] - expected[key]) > 0.01) {
      throw new Error(`Bounding box ${key} divergente: ${runtime.renderedEnvelope[key]} vs ${expected[key]}`);
    }
  }
  if (errors.length) throw new Error('Erros de console/runtime: ' + errors.join(' | '));

  await fs.writeFile(`${out}/validation.json`, JSON.stringify({ status: 'passed', startup_ms_from_navigation: startupMs, canvas: canvasSize, views: views.map(([name]) => name), dimensions, measured_rendered_bbox: measured, final_runtime_metrics: runtime, structure, camera_metrics: await page.evaluate(() => window.__spectraCameraMetrics || null), controls: ['orbit', 'module visibility', 'individual selection', 'hide/restore', 'section cut', 'assembled mode'] }, null, 2));
  console.log(`SPECTRA-AXIS visual validation passed; startup=${startupMs}ms; canvas=${canvasSize.width}x${canvasSize.height}`);
} catch (error) {
  await fs.writeFile(`${out}/validation-error.txt`, String(error.stack || error));
  throw error;
} finally {
  await browser.close();
}
