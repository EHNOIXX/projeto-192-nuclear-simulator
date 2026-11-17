import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const baselineUrl=process.env.SPECTRA_BASELINE_URL||'http://127.0.0.1:4173/nave/';
const experimentalUrl=process.env.SPECTRA_EXPERIMENTAL_URL||'http://127.0.0.1:4174/nave/';
const out='artifacts/spectra-axis-phase-1';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
const views=[['isometrica','iso'],['superior','top'],['inferior','bottom'],['frontal','front'],['traseira','rear'],['lateral-direita','side'],['lateral-esquerda','left']];
async function openVersion(url,label){
 const page=await browser.newPage({viewport:{width:1600,height:1200},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(label+': '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(label+': '+m.text())});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForSelector('#viewport canvas',{timeout:90000});
 await page.bringToFront();
 if(label==='experimental'){
  await page.waitForFunction(()=>window.__spectraReady===true,null,{timeout:90000});
 }else{
  // A baseline histórica pode não expor o marcador de readiness na mesma versão.
  await page.waitForTimeout(15000);
  const state=await page.evaluate(()=>({canvas:!!document.querySelector('#viewport canvas'),status:document.querySelector('#renderStatus')?.textContent||null}));
  if(!state.canvas||errors.some(e=>e.startsWith('baseline:')))throw new Error('Baseline não inicializou corretamente: '+JSON.stringify(state)+' '+errors.join(' | '));
 }
 return page;
}
async function capture(page,camera,path){
 await page.locator('[data-camera="'+camera+'"]').evaluate(el=>el.click());
 await page.waitForTimeout(900);
 const rect=await page.locator('#viewport').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});
 const cdp=await page.context().newCDPSession(page);
 const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false,clip:{...rect,scale:1}});
 await fs.writeFile(path,Buffer.from(shot.data,'base64'));await cdp.detach();
}
try{
 const baseline=await openVersion(baselineUrl,'baseline');
 for(const [name,camera] of views)await capture(baseline,camera,out+'/baseline-'+name+'.png');
 await baseline.close();

 const experimental=await openVersion(experimentalUrl,'experimental');
 const metrics=await experimental.evaluate(()=>({geometry:window.__spectraPrimaryHullMetrics||null,runtime:window.__spectraRuntimeMetrics||null,builder:window.__spectraHullBuilder,meshName:window.__spectraHullMeshName,marker:!!window.__spectraTemporaryHullMarker?.isObject3D}));
 if(!metrics.geometry||!metrics.geometry.finite||!metrics.geometry.normalFinite||metrics.geometry.triangles<10000)throw new Error('Métricas da malha principal inválidas: '+JSON.stringify(metrics));
 if(metrics.builder!=='primaryHullGeometry'||metrics.meshName!=='primary_pressure_hull'||!metrics.marker)throw new Error('A geometria experimental não é a malha identificada na cena: '+JSON.stringify(metrics));
 if(!metrics.runtime||!metrics.runtime.envelopeMatches)throw new Error('Bounding box global não corresponde ao envelope configurado: '+JSON.stringify(metrics.runtime));
 const ui=await experimental.evaluate(()=>({length:document.querySelector('#lenOut').textContent,width:document.querySelector('#widOut').textContent,height:document.querySelector('#heiOut').textContent,statLength:document.querySelector('#statLen').textContent,statWidth:document.querySelector('#statWid').textContent,statHeight:document.querySelector('#statHei').textContent}));
 if(ui.length!=='2500 m'||ui.width!=='1200 m'||ui.height!=='800 m'||ui.statLength!=='2500 m'||ui.statWidth!=='1200 m'||ui.statHeight!=='800 m')throw new Error('Dimensões da interface divergentes: '+JSON.stringify(ui));
 for(const [name,camera] of views)await capture(experimental,camera,out+'/experimental-'+name+'.png');

 await experimental.locator('#autoRotate').evaluate(el=>el.click());
 if(!(await experimental.locator('#autoRotate').evaluate(el=>el.classList.contains('active'))))throw new Error('Órbita automática não ativou');
 await experimental.locator('#autoRotate').evaluate(el=>el.click());
 const egas=experimental.locator('[data-module="egas"]'),label=egas.locator('xpath=..');
 await label.scrollIntoViewIfNeeded();await label.click();
 if(!(await egas.isChecked()))throw new Error('Visibilidade EGAS não ativou');await label.click();
 const piece=experimental.locator('#pieceSelect'),value=await piece.locator('option').nth(1).getAttribute('value');
 if(!value)throw new Error('Lista de componentes vazia');
 await piece.selectOption(value);await experimental.locator('#hidePiece').evaluate(el=>el.click());await experimental.locator('#restorePieces').evaluate(el=>el.click());
 await experimental.locator('#modeCut').evaluate(el=>el.click());
 if(!(await experimental.locator('#modeCut').evaluate(el=>el.classList.contains('active'))))throw new Error('Modo corte não ativou');
 await experimental.locator('#modeAssembled').evaluate(el=>el.click());
 await experimental.close();

 for(const [name] of views){
  const a=out+'/baseline-'+name+'.png',b=out+'/experimental-'+name+'.png',o=out+'/overlay-'+name+'.png';
  const cyan=await sharp(a).greyscale().tint({r:55,g:190,b:255}).png().toBuffer();
  const amber=await sharp(b).greyscale().tint({r:255,g:155,b:55}).png().toBuffer();
  await sharp(cyan).composite([{input:amber,blend:'screen',opacity:.72}]).png().toFile(o);
 }
 if(errors.length)throw new Error('Erros de navegador: '+errors.join(' | '));
 const report={status:'passed',baseline_url:baselineUrl,experimental_url:experimentalUrl,views:views.map(v=>v[0]),metrics,ui_dimensions:{length:'2500 m',width:'1200 m',height:'800 m'},controls:['seven camera presets','auto rotation','EGAS visibility','component selection','hide/restore','section cut','assembled mode'],browser_errors:errors};
 await fs.writeFile(out+'/comparison-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){await fs.writeFile(out+'/comparison-error.txt',String(e.stack||e));throw e}
finally{await browser.close()}
