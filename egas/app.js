import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d14);
scene.fog = new THREE.Fog(0x080d14, 34, 72);
const camera = new THREE.PerspectiveCamera(38, 1, .1, 120);
camera.position.set(19, 11, 20);

const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('viewport').appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(900,600),.22,.45,.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.minDistance = 1.25;
controls.maxDistance = 90;
controls.target.set(0,0,0);
controls.screenSpacePanning = true;

scene.add(new THREE.HemisphereLight(0xc9dcf2,0x202936,1.35));
const key = new THREE.DirectionalLight(0xffe5c4,3.0);
key.position.set(7,13,10); key.castShadow = true;
key.shadow.mapSize.set(2048,2048);
key.shadow.camera.left=-18; key.shadow.camera.right=18;
key.shadow.camera.top=15; key.shadow.camera.bottom=-15;
scene.add(key);
const fill = new THREE.DirectionalLight(0x78b9d4,1.8);
fill.position.set(-10,4,-8); scene.add(fill);
const rim = new THREE.PointLight(0x4e9db4,65,34);
rim.position.set(0,5,-7); scene.add(rim);
const warm = new THREE.PointLight(0xffa85c,42,28);
warm.position.set(8,-2,5); scene.add(warm);

const grid = new THREE.GridHelper(36,36,0x34485b,0x1b2a3a);
grid.position.y=-4.4; scene.add(grid);
const ground = new THREE.Mesh(new THREE.CircleGeometry(13,96),new THREE.MeshStandardMaterial({color:0x0d1722,metalness:.35,roughness:.8}));
ground.rotation.x=-Math.PI/2; ground.position.y=-4.43; ground.receiveShadow=true; scene.add(ground);

const root = new THREE.Group(); scene.add(root);
const groups = {
 structure:new THREE.Group(), core:new THREE.Group(), radiation:new THREE.Group(), field:new THREE.Group(),
 plasma:new THREE.Group(), nova:new THREE.Group(), control:new THREE.Group(), instrumentation:new THREE.Group()
};
Object.values(groups).forEach(g=>root.add(g));

const mat = {
 titanium:new THREE.MeshStandardMaterial({color:0x8795a2,metalness:.82,roughness:.29}),
 dark:new THREE.MeshStandardMaterial({color:0x263442,metalness:.8,roughness:.34}),
 steel:new THREE.MeshStandardMaterial({color:0xb5c0c9,metalness:.9,roughness:.23}),
 copper:new THREE.MeshStandardMaterial({color:0xb87843,metalness:.86,roughness:.26}),
 ceramic:new THREE.MeshStandardMaterial({color:0xddd8ca,metalness:.22,roughness:.32}),
 cyan:new THREE.MeshStandardMaterial({color:0x4aa6b4,metalness:.72,roughness:.24,emissive:0x123c46,emissiveIntensity:.45}),
 violet:new THREE.MeshStandardMaterial({color:0x9874d9,metalness:.35,roughness:.22,emissive:0x46227d,emissiveIntensity:1.15}),
 glass:new THREE.MeshPhysicalMaterial({color:0x4d9eb4,metalness:.05,roughness:.12,transparent:true,opacity:.13,transmission:.35,thickness:.2,side:THREE.DoubleSide,depthWrite:false}),
 glow:new THREE.MeshBasicMaterial({color:0x9c76ff}),
 shield:new THREE.MeshPhysicalMaterial({color:0x8eb7c5,metalness:.55,roughness:.28,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}),
 solar:new THREE.MeshStandardMaterial({color:0x315b82,metalness:.48,roughness:.3,emissive:0x102b49,emissiveIntensity:.45}),
 electron:new THREE.MeshBasicMaterial({color:0x70e9ff})
};
const objects={};
function add(id,label,layer,geometry,material,position=[0,0,0],rotation=[0,0,0]){
 const m=new THREE.Mesh(geometry,material); m.name=id; m.userData={id,label,layer};
 m.position.set(...position); m.rotation.set(...rotation);
 m.castShadow=true; m.receiveShadow=true; groups[layer].add(m); objects[id]=m; return m;
}
function cylinder(id,label,layer,r1,r2,len,material,x,y=0,z=0,radial=48){
 return add(id,label,layer,new THREE.CylinderGeometry(r1,r2,len,radial,1,false),material,[x,y,z],[0,0,Math.PI/2]);
}
function torus(id,label,layer,x,r,tube,material,y=0,z=0,scaleY=1,scaleZ=1){
 return add(id,label,layer,new THREE.TorusGeometry(r,tube,12,96),material,[x,y,z],[0,Math.PI/2,0]).scale.set(1,scaleY,scaleZ);
}
function rod(id,label,layer,a,b,r,material){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
 const m=add(id,label,layer,new THREE.CylinderGeometry(r,r,delta.length(),12),material,start.clone().add(end).multiplyScalar(.5).toArray());
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); return m;
}

// Chassi aberto: armação em anéis, longarinas e painéis separados.
// Eixo longitudinal X; dimensões apenas cenográficas.
const frameX=[-6.4,-4.6,-2.5,2.5,4.6,6.4];
frameX.forEach((x,i)=>{
 torus('frameRing'+i,'Anel estrutural '+(i+1),'structure',x,2.18,.105, i%2?mat.steel:mat.titanium,0,0,.92,.92);
});
for(let j=0;j<12;j++){
 const a=j*Math.PI/6, y=2.18*Math.cos(a), z=2.18*Math.sin(a);
 rod('rail'+j,'Longarina estrutural','structure',[-6.4,y,z],[6.4,y,z],.075,j%3===0?mat.copper:mat.dark);
}
for(let x of [-5.5,-3.5,3.5,5.5]){
 for(let j=0;j<12;j++){
  const a=j*Math.PI/6;
  add('bolt_'+x+'_'+j,'Fixador de chassi','structure',new THREE.SphereGeometry(.075,12,8),mat.steel,[x,2.2*Math.cos(a),2.2*Math.sin(a)]);
 }
}
// Placas externas curtas, deixando o interior legível.
for(let i=0;i<8;i++){
 const a=i*Math.PI/4, y=2.22*Math.cos(a), z=2.22*Math.sin(a);
 const p=add('armor'+i,'Painel de blindagem cenográfico','structure',new THREE.BoxGeometry(2.35,.07,.72),i%2?mat.dark:mat.titanium,[-.1,y,z]);
 p.rotation.x=a; p.rotation.y=0;
}
for(let x of [-6.65,6.65]){
 torus('endCollar'+x,'Colar estrutural de extremidade','structure',x,1.82,.19,mat.steel);
 for(let j=0;j<8;j++){const a=j*Math.PI/4;add('collarBolt'+x+'_'+j,'Parafuso de flange','structure',new THREE.SphereGeometry(.09,12,8),mat.copper,[x,1.82*Math.cos(a),1.82*Math.sin(a)]);}
}

// Núcleo suspenso visualmente no centro, com suportes e blindagem em segmentos.
cylinder('coreSpine','Eixo central do núcleo','core',.25,.25,3.7,mat.dark,0);
add('core','Núcleo E-192 hipotético','core',new THREE.IcosahedronGeometry(.78,3),mat.violet,[0,0,0]);
add('coreInner','Centro luminoso ilustrativo','core',new THREE.SphereGeometry(.34,32,24),mat.glow,[0,0,0]);
for(let i=0;i<4;i++){
 const r=1.05+i*.22;
 torus('coreRing'+i,'Anel de contenção ilustrativo','core',0,r,.045,i%2?mat.copper:mat.cyan,0,0,1,1);
}
for(let i=0;i<6;i++){
 const a=i*Math.PI/3;
 rod('coreBrace'+i,'Suporte radial do núcleo','core',[0,.85*Math.cos(a),.85*Math.sin(a)],[0,1.65*Math.cos(a),1.65*Math.sin(a)],.055,mat.steel);
}

// Blindagem radiológica conceitual em camadas concêntricas.
for(let i=0;i<3;i++){
 const shell=add('radiationShield'+i,'Camada de blindagem radiológica ilustrativa','radiation',new THREE.SphereGeometry(1.55+i*.22,48,32),mat.shield,[0,0,0]);
 shell.material=mat.shield.clone();shell.material.opacity=.22-i*.035;
}
for(let i=0;i<12;i++){
 const a=i*Math.PI/6;
 const plate=add('energyPlate'+i,'Coletor de energia radiativa hipotético','radiation',new THREE.BoxGeometry(.14,.72,.46),mat.solar,[0,2.45*Math.cos(a),2.45*Math.sin(a)],[a,0,0]);
 add('plateCell'+i,'Células conversoras ilustrativas','radiation',new THREE.BoxGeometry(.035,.58,.34),mat.cyan,[.09,2.45*Math.cos(a),2.45*Math.sin(a)],[a,0,0]);
}
for(let i=0;i<3;i++){
 const orbit=add('electronOrbit'+i,'Trajetória eletrônica hipotética','radiation',new THREE.TorusGeometry(1.15+i*.18,.018,8,120),mat.electron,[0,0,0],[i*.72,0,i*.48]);
}
for(let i=0;i<9;i++){
 const a=i*2*Math.PI/9;
 add('electron'+i,'Partícula eletrônica ilustrativa','radiation',new THREE.SphereGeometry(.065,16,12),mat.electron,[1.15*Math.cos(a),.78*Math.sin(a),.35*Math.sin(a*2)]);
}

// Bobinas distribuídas simetricamente no eixo.
for(let side of [-1,1]){
 const x=side*3.35;
 cylinder('coilHousing'+side,'Carcaça da bobina','field',1.55,1.55,.62,mat.dark,x);
 torus('coilFront'+side,'Flange frontal da bobina','field',x-side*.34,1.45,.12,mat.steel);
 torus('coilBack'+side,'Flange traseira da bobina','field',x+side*.34,1.45,.12,mat.steel);
 for(let k=0;k<9;k++){
  const xx=x-.25+k*.0625;
  torus('winding'+side+'_'+k,'Enrolamento de cobre','field',xx,1.22,.055,mat.copper);
 }
 for(let j=0;j<8;j++){
  const a=j*Math.PI/4;
  rod('coilSupport'+side+'_'+j,'Suporte de bobina','field',[x,1.48*Math.cos(a),1.48*Math.sin(a)],[x,1.9*Math.cos(a),1.9*Math.sin(a)],.045,mat.cyan);
 }
}
// Câmaras de plasma transparentes com aro de extremidade e volume luminoso discreto.
for(let side of [-1,1]){
 const x=side*5.25;
 cylinder('plasmaChamber'+side,'Câmara conceitual transparente','plasma',.92,.92,1.65,mat.glass,x);
 torus('plasmaRim'+side,'Aro da câmara','plasma',x-side*.83,.94,.09,mat.cyan);
 add('plasmaVolume'+side,'Volume luminoso ilustrativo','plasma',new THREE.SphereGeometry(.62,32,24),new THREE.MeshBasicMaterial({color:0x399bd0,transparent:true,opacity:.12}),[x,0,0]).scale.set(1,1,1.5);
}
// Módulo N.O.V.A. e sistema de controle traseiro.
add('nova','Módulo N.O.V.A. conceitual','nova',new THREE.TorusKnotGeometry(.7,.12,120,16),mat.cyan,[1.35,0,0]);
for(let i=0;i<3;i++) torus('novaGuard'+i,'Arco de proteção N.O.V.A.','nova',1.35,.98+i*.16,.035,mat.steel,0,0,1,1);
torus('vectorRing','Anel de controle vetorial','control',6.95,1.55,.16,mat.copper);
cylinder('rearHub','Cubo traseiro cenográfico','control',.72,.72,.85,mat.dark,7.5);
for(let j=0;j<10;j++){
 const a=j*Math.PI/5;
 rod('vectorVane'+j,'Aleta de orientação','control',[7.0,1.1*Math.cos(a),1.1*Math.sin(a)],[8.0,1.7*Math.cos(a),1.7*Math.sin(a)],.075,mat.steel);
}
cylinder('nozzle','Bocal externo cenográfico','structure',1.65,.95,1.7,mat.dark,8.65,0,0,64);
torus('nozzleLip','Borda do bocal','structure',9.5,1.0,.13,mat.steel);


// Módulo central de contenção: vaso cilíndrico, flanges, portas e instrumentação.
// A geometria é uma representação de arquitetura, não um projeto de blindagem.
cylinder('containmentVessel','Vaso central de contenção conceitual','core',2.05,2.05,3.35,mat.dark,0,0,0,96);
for(const x of [-1.72,1.72]){
 torus('vesselFlange'+x,'Flange usinada do vaso','core',x,2.04,.16,mat.steel);
 torus('vesselSeal'+x,'Junta de vedação ilustrativa','core',x*1.015,1.91,.045,mat.ceramic);
 for(let j=0;j<24;j++){
  const a=j*Math.PI/12;
  add('vesselBolt'+x+'_'+j,'Parafuso de flange do vaso','core',new THREE.CylinderGeometry(.055,.055,.09,12),mat.copper,[x,2.04*Math.cos(a),2.04*Math.sin(a)],[0,0,Math.PI/2]);
 }
}
for(let j=0;j<8;j++){
 const a=j*Math.PI/4, y=2.02*Math.cos(a), z=2.02*Math.sin(a);
 cylinder('vesselPort'+j,'Bocal de instrumentação do vaso','core',.19,.19,.42,mat.steel,j%2?1.05:-1.05,y,z,24);
 add('vesselPortCap'+j,'Tampa do bocal','core',new THREE.SphereGeometry(.2,20,12),mat.cyan,[j%2?1.28:-1.28,y,z]);
}
// Blindagem externa segmentada e suportes mecânicos independentes.
for(let j=0;j<16;j++){
 const a=j*Math.PI/8;
 const p=add('shieldSegment'+j,'Segmento externo de blindagem ilustrativa','radiation',new THREE.BoxGeometry(1.1,.16,.58),j%2?mat.ceramic:mat.titanium,[0,2.28*Math.cos(a),2.28*Math.sin(a)],[a,0,0]);
}
for(let j=0;j<8;j++){
 const a=j*Math.PI/4;
 rod('containmentSupport'+j,'Pé estrutural do vaso','structure',[-2.0,2.0*Math.cos(a),2.0*Math.sin(a)],[-2.0,2.85*Math.cos(a),2.85*Math.sin(a)],.09,mat.steel);
 rod('containmentSupportB'+j,'Pé estrutural do vaso','structure',[2.0,2.0*Math.cos(a),2.0*Math.sin(a)],[2.0,2.85*Math.cos(a),2.85*Math.sin(a)],.09,mat.steel);
}
// Circuitos externos de serviço, tubulações e caixas de diagnóstico (elementos cenográficos).
for(let j=0;j<6;j++){
 const a=j*Math.PI/3, y=2.85*Math.cos(a), z=2.85*Math.sin(a);
 rod('servicePipe'+j,'Linha externa de serviço','instrumentation',[-2.6,y,z],[2.6,y,z],.045,j%2?mat.cyan:mat.copper);
 for(const x of [-2.4,2.4]){
  add('sensorBox'+j+'_'+x,'Caixa de sensor e diagnóstico','instrumentation',new THREE.BoxGeometry(.42,.32,.28),mat.dark,[x,y*1.04,z*1.04]);
  add('sensorLamp'+j+'_'+x,'Indicador de estado','instrumentation',new THREE.SphereGeometry(.07,12,8),mat.electron,[x,y*1.04,z*1.04+.17]);
 }
}
for(let j=0;j<10;j++){
 const a=j*Math.PI/5, y=3.25*Math.cos(a), z=3.25*Math.sin(a);
 rod('cableRun'+j,'Canaleta de cabos e sensores','instrumentation',[-5.8,y,z],[5.8,y,z],.035,j%2?mat.cyan:mat.dark);
}
for(let x of [-5.9,5.9]){
 add('serviceManifold'+x,'Distribuidor de serviços','instrumentation',new THREE.BoxGeometry(.72,1.0,1.1),mat.dark,[x,0,0]);
 for(let j=0;j<6;j++){
  const a=j*Math.PI/3;
  add('manifoldPort'+x+'_'+j,'Conector do distribuidor','instrumentation',new THREE.CylinderGeometry(.09,.09,.12,16),mat.copper,[x,Math.cos(a)*.42,Math.sin(a)*.42],[0,0,Math.PI/2]);
 }
}

const names={structure:'Estrutura externa',core:'Núcleo E-192',radiation:'Blindagem e recuperação energética',field:'Sistema eletromagnético',plasma:'Câmaras conceituais de plasma',nova:'Módulo N.O.V.A.',control:'Controle vetorial',instrumentation:'Instrumentação e serviços'};
const descriptions={
 outerShell:'A estrutura agora é uma armação aberta de anéis, longarinas e painéis independentes.',
 core:'Posição hipotética do E-192. Elemento 192 não foi descoberto; propriedades e capacidade de alterar o espaço-tempo são desconhecidas.',
 radiationShield:'Camadas cenográficas de blindagem radiológica ao redor do núcleo. Não representam materiais, espessuras ou proteção calculados.',
 energyCollector:'Placas conversoras hipotéticas que representam recuperação de parte da energia radiativa absorvida. Não equivalem a painéis fotovoltaicos comuns validados para essa função.',
 electronFlow:'Órbitas e partículas eletrônicas estilizadas para ilustrar a hipótese especulativa de interação com o espaço-tempo; não são uma descrição orbital real.',
 coilLeft:'Bobinas cenográficas com enrolamentos de cobre e suportes mecânicos.',
 plasmaLeft:'Câmara transparente ilustrativa; não representa parâmetros operacionais.',
 nova:'Módulo conceitual para organizar temas de energia e física especulativa.',
 vectorRing:'Conjunto cenográfico de orientação e controle, sem validação funcional.', containmentVessel:'Vaso central ilustrativo com flanges, bocais e suportes. Não define pressão, vácuo, espessura ou proteção radiológica.', instrumentation:'Tubulações, canaletas, sensores e distribuidores representados para dar contexto de manutenção e monitoramento; não possuem especificações funcionais.'
};
const partList=[
 ['outerShell','Chassi estrutural','structure'],['core','Núcleo E-192 hipotético','core'],
 ['radiationShield','Filtros de radiação intensa','radiation'],['energyCollector','Placas de recuperação energética','radiation'],['electronFlow','Região eletrônica hipotética','radiation'],
 ['coilLeft','Bobina eletromagnética esquerda','field'],['coilRight','Bobina eletromagnética direita','field'],
 ['plasmaLeft','Câmara de plasma esquerda','plasma'],['plasmaRight','Câmara de plasma direita','plasma'],
 ['nova','Módulo N.O.V.A.','nova'],['vectorRing','Controle vetorial','control'],['nozzle','Bocal cenográfico','structure'],['containmentVessel','Vaso central de contenção','core'],['instrumentation','Instrumentação e serviços','instrumentation']
];
// Alias de seleção para peças compostas.
objects.outerShell=objects.frameRing0;
objects.coilLeft=objects['coilHousing-1'];
objects.coilRight=objects.coilHousing1;
objects.plasmaLeft=objects['plasmaChamber-1'];
objects.plasmaRight=objects.plasmaChamber1;

$('layers').innerHTML=Object.keys(groups).map(k=>'<label class="check"><input type="checkbox" data-layer="'+k+'" checked> '+names[k]+'</label>').join('');
$('partSelect').innerHTML=partList.map(p=>'<option value="'+p[0]+'">'+p[1]+'</option>').join('');
let selected='outerShell',material='titanium',length=24,diam=8,alpha=100;
const materialData={
 titanium:{name:'Liga de titânio',density:'Boa resistência específica e resistência à corrosão.',fit:86,caution:'Propriedades variam conforme liga, temperatura e tratamento.'},
 aluminum:{name:'Liga de alumínio',density:'Baixa densidade e boa usinabilidade em várias ligas.',fit:76,caution:'Limites térmicos e mecânicos variam entre ligas.'},
 copper:{name:'Cobre',density:'Alta condutividade elétrica e térmica.',fit:69,caution:'É denso e não é, por si só, supercondutor.'},
 graphite:{name:'Compósito de carbono',density:'Baixa densidade e propriedades direcionais.',fit:72,caution:'Matriz, orientação e temperatura alteram o comportamento.'},
 ceramic:{name:'Cerâmica técnica',density:'Pode oferecer estabilidade térmica e dureza.',fit:70,caution:'Fragilidade e choque térmico precisam ser considerados.'},
 niobium:{name:'Nióbio',density:'Metal empregado em certas ligas e materiais supercondutores.',fit:64,caution:'Supercondutividade depende de composição e condições específicas.'}
};
const evidenceStatus={
 outerShell:['ENGENHARIA CONVENCIONAL','Geometrias estruturais são familiares à engenharia; dimensões, cargas, materiais e segurança deste conceito não foram dimensionados.'],
 containmentVessel:['ANALOGIA DE ENGENHARIA','Vasos e flanges existem em instalações reais; este modelo não calcula pressão, vácuo, fadiga, espessura ou contenção.'],
 instrumentation:['TECNOLOGIA ESTABELECIDA / INTEGRAÇÃO CONCEITUAL','Sensores, cabos e instrumentação são tecnologias conhecidas; a integração EGAS é cenográfica e não validada.'],
 coilLeft:['PRINCÍPIO ESTABELECIDO / DESEMPENHO NÃO AVALIADO','Eletroímãs e bobinas são tecnologias reais; campo, aquecimento, refrigeração e confinamento não foram calculados.'],
 coilRight:['PRINCÍPIO ESTABELECIDO / DESEMPENHO NÃO AVALIADO','Eletroímãs e bobinas são tecnologias reais; campo, aquecimento, refrigeração e confinamento não foram calculados.'],
 plasmaLeft:['FENÔMENO ESTABELECIDO / MÓDULO HIPOTÉTICO','Plasma é um estado da matéria conhecido; esta câmara não representa um projeto operacional ou confinamento validado.'],
 plasmaRight:['FENÔMENO ESTABELECIDO / MÓDULO HIPOTÉTICO','Plasma é um estado da matéria conhecido; esta câmara não representa um projeto operacional ou confinamento validado.'],
 core:['HIPÓTESE NÃO COMPROVADA','E-192 (Z=192) não foi descoberto ou sintetizado. Massa, estabilidade, estrutura nuclear e eletrônica são desconhecidas.'],
 radiationShield:['SEM DIMENSIONAMENTO','Blindagem radiológica depende do tipo e espectro da radiação, material, geometria e critérios de dose. Nada disso foi calculado aqui.'],
 energyCollector:['CONVERSÃO NÃO DEMONSTRADA','Absorver radiação não garante conversão elétrica útil. Não há eficiência, balanço energético ou arquitetura validada para este módulo.'],
 electronFlow:['ILUSTRAÇÃO, NÃO ORBITAIS','As linhas e partículas animadas são recursos gráficos. Não descrevem orbitais quânticos nem velocidades reais de elétrons em Z=192.'],
 nova:['MÓDULO ESPECULATIVO','N.O.V.A. é uma organização conceitual do projeto, sem mecanismo físico ou desempenho demonstrado.'],
 vectorRing:['FUNÇÃO NÃO DEMONSTRADA','Anel e aletas são geometria cenográfica; não demonstram controle vetorial, empuxo ou troca de momento.'],
 nozzle:['GEOMETRIA CENOGRÁFICA','Um bocal só produz empuxo em conjunto com fluxo de massa/energia e condições de operação definidas.']
};
function refresh(){
 const p=partList.find(x=>x[0]===selected)||partList[0],md=materialData[material],ev=evidenceStatus[selected]||['NÃO AVALIADO','Não há dados suficientes para classificar este componente.'];
 $('partInfo').innerHTML='<b>'+p[1]+'</b><br>'+(descriptions[selected]||'Componente visual do modelo.')+'<br><br><span>Camada: '+names[p[2]]+'</span>';
 $('materialInfo').innerHTML='<b>'+md.name+'</b><br>'+md.density+'<br><br>'+md.caution;
 $('score').innerHTML='—<small>'+ev[0]+'</small>';
 $('compatText').textContent=ev[1];
 $('criteria').innerHTML='<div class="criterion">Evidência experimental: não atribuída sem fonte específica.</div><div class="criterion">Desempenho: não calculado.</div><div class="criterion">Viabilidade do conjunto: não demonstrada.</div>';
 $('selectionLabel').textContent=p[1].toUpperCase();
}
function highlight(){
 Object.values(objects).forEach(o=>{if(o?.material?.emissive)o.material.emissiveIntensity=.25;});
 const chosen=objects[selected];if(chosen?.material?.emissive)chosen.material.emissiveIntensity=1.5;
}
$('partSelect').addEventListener('change',e=>{selected=e.target.value;refresh();highlight();});
$('material').addEventListener('change',e=>{material=e.target.value;refresh();applyMaterial();});
document.querySelectorAll('[data-layer]').forEach(el=>el.addEventListener('change',()=>groups[el.dataset.layer].visible=el.checked));
$('allLayers').onclick=()=>document.querySelectorAll('[data-layer]').forEach(el=>{el.checked=true;groups[el.dataset.layer].visible=true;});
function applyMaterial(){
 const color={titanium:0x8795a2,aluminum:0xb7c4cf,copper:0xb97848,graphite:0x384450,ceramic:0xd8d4c9,niobium:0x7595b8}[material];
 [objects.frameRing0,objects.frameRing1,objects.frameRing2,objects.frameRing3,objects.frameRing4,objects.frameRing5].forEach(o=>o.material.color.setHex(color));
}
function resize(){
 const w=Math.max(1,$('viewport').clientWidth),h=Math.max(1,$('viewport').clientHeight);
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);bloom.setSize(w,h);
}
window.addEventListener('resize',resize);resize();
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
renderer.domElement.addEventListener('click',e=>{
 const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
 ray.setFromCamera(mouse,camera);
 const hits=ray.intersectObjects(Object.values(groups).flatMap(g=>g.children),false);
 const hit=hits.find(h=>h.object.userData.layer);if(!hit)return;
 const layer=hit.object.userData.layer;
 const map={structure:'outerShell',core:hit.object.name==='containmentVessel'?'containmentVessel':'core',instrumentation:'instrumentation',radiation:hit.object.name.startsWith('energyPlate')||hit.object.name.startsWith('plateCell')?'energyCollector':hit.object.name.startsWith('electron')?'electronFlow':'radiationShield',field:hit.object.name.includes('1')?'coilRight':'coilLeft',plasma:hit.object.name.includes('1')?'plasmaRight':'plasmaLeft',nova:'nova',control:'vectorRing'};
 selected=map[layer]||'outerShell';$('partSelect').value=selected;refresh();highlight();
});
$('length').oninput=e=>{length=+e.target.value;$('lengthOut').value=length+' m';root.scale.x=length/24;};
$('diameter').oninput=e=>{diam=+e.target.value;$('diamOut').value=diam+' m';root.scale.y=diam/8;root.scale.z=diam/8;};
$('alpha').oninput=e=>{alpha=+e.target.value;$('alphaOut').value=alpha+'%';groups.structure.children.filter(o=>o.name.startsWith('armor')).forEach(o=>{o.material.transparent=alpha<100;o.material.opacity=alpha/100;});};
$('homeView').onclick=()=>{camera.position.set(19,11,20);controls.target.set(0,0,0);controls.update();};
$('reset').onclick=()=>{
 $('length').value=24;$('diameter').value=8;$('alpha').value=100;$('material').value='titanium';$('partSelect').value='outerShell';
 length=24;diam=8;alpha=100;material='titanium';selected='outerShell';root.scale.set(1,1,1);
 $('lengthOut').value='24 m';$('diamOut').value='8 m';$('alphaOut').value='100%';
 groups.structure.children.filter(o=>o.name.startsWith('armor')).forEach(o=>{o.material.transparent=false;o.material.opacity=1;});
 document.querySelectorAll('[data-layer]').forEach(el=>{el.checked=true;groups[el.dataset.layer].visible=true;});
 applyMaterial();refresh();highlight();setExploded(false);
};

let exploded=false,sectionEnabled=false;
const cutPlane=new THREE.Plane(new THREE.Vector3(1,0,0),0);
renderer.localClippingEnabled=true;
function applyCut(){Object.values(groups).forEach(g=>g.children.forEach(o=>{if(o.material&&!Array.isArray(o.material)){o.material.clippingPlanes=sectionEnabled?[cutPlane]:[];o.material.needsUpdate=true;}}));}
function setExploded(on){
 exploded=on;
 const off={structure:[0,0,0],core:[0,0,0],field:[0,0,0],plasma:[0,0,0],nova:[0,0,0],control:[0,0,0],radiation:[0,0,0],instrumentation:[0,0,0]};
 if(on){off.core=[0,0,0];off.field=[0,2.8,0];off.plasma=[0,-2.6,0];off.nova=[0,0,2.6];off.control=[2.0,0,-2.4];off.instrumentation=[0,0,3.4];}
 Object.entries(groups).forEach(([k,g])=>g.position.set(...off[k]));
 $('explodeBtn').setAttribute('aria-pressed',String(on));$('explodeBtn').textContent=on?'VISTA MONTADA':'VISTA EXPLODIDA';
}
$('explodeBtn').addEventListener('click',()=>setExploded(!exploded));
$('sectionBtn').addEventListener('click',()=>{sectionEnabled=!sectionEnabled;applyCut();$('sectionBtn').setAttribute('aria-pressed',String(sectionEnabled));$('sectionBtn').textContent=sectionEnabled?'DESATIVAR CORTE':'CORTE TRANSVERSAL';$('sectionRange').disabled=!sectionEnabled;});
$('sectionRange').addEventListener('input',e=>{cutPlane.constant=Number(e.target.value);$('sectionOut').value=cutPlane.constant.toFixed(1);if(sectionEnabled)applyCut();});
$('rotateBtn').addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;controls.autoRotateSpeed=1.0;$('rotateBtn').setAttribute('aria-pressed',String(controls.autoRotate));$('rotateBtn').textContent=controls.autoRotate?'PARAR ÓRBITA':'ÓRBITA AUTOMÁTICA';});
const views={front:[0,2,25],side:[25,2,0],top:[0,25,.01],iso:[19,11,20]};
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{const v=views[btn.dataset.view];camera.position.set(...v);controls.target.set(0,0,0);controls.update();controls.autoRotate=false;$('rotateBtn').setAttribute('aria-pressed','false');$('rotateBtn').textContent='ÓRBITA AUTOMÁTICA';}));
$('shotBtn').addEventListener('click',()=>{composer.render();const a=document.createElement('a');a.download='EGAS-industrial-conceitual.png';a.href=renderer.domElement.toDataURL('image/png');a.click();});
$('fullBtn').addEventListener('click',()=>{const t=$('viewport').parentElement;if(!document.fullscreenElement)t.requestFullscreen?.();else document.exitFullscreen?.();});
// Inventário de peças: ocultação visual reversível, sem apagar geometria.
function getPieceMeshes(){return Object.values(groups).flatMap(g=>g.children).filter(o=>o.isMesh&&o.userData?.id);}
function refreshPieceInventory(){
 const list=getPieceMeshes(),sel=$('pieceSelect'),previous=sel.value;
 sel.innerHTML=list.map(o=>'<option value="'+o.userData.id+'">'+o.userData.label+' · '+o.userData.id+'</option>').join('');
 if(list.some(o=>o.userData.id===previous))sel.value=previous;
 updatePieceStatus();
}
function updatePieceStatus(){
 const o=getPieceMeshes().find(x=>x.userData.id===$('pieceSelect').value);
 if(!o){$('pieceStatus').textContent='Nenhuma peça selecionada.';return;}
 $('pieceStatus').textContent=o.visible?'Peça montada e visível.':'Peça retirada visualmente — pode ser recolocada.';
 $('pieceToggle').textContent=o.visible?'RETIRAR PEÇA':'RECOLOCAR PEÇA';
}
$('pieceSelect').addEventListener('change',updatePieceStatus);
$('pieceToggle').addEventListener('click',()=>{
 const o=getPieceMeshes().find(x=>x.userData.id===$('pieceSelect').value);if(!o)return;
 o.visible=!o.visible;updatePieceStatus();
});
$('restorePieces').addEventListener('click',()=>{
 getPieceMeshes().forEach(o=>o.visible=true);updatePieceStatus();
});
refreshPieceInventory();
function configData(){return {version:'0.6',selected,material,length:Number($('length').value),diameter:Number($('diameter').value),alpha:Number($('alpha').value),layers:Object.fromEntries(Object.keys(groups).map(k=>[k,groups[k].visible])),exploded,sectionEnabled,sectionPosition:cutPlane.constant,pieces:Object.fromEntries(getPieceMeshes().map(o=>[o.userData.id,o.visible]))};}
$('saveBtn').addEventListener('click',()=>{try{localStorage.setItem('egas-lab-config',JSON.stringify(configData()));$('saveBtn').textContent='CONFIGURAÇÃO SALVA';}catch(e){$('saveBtn').textContent='FALHA AO SALVAR';}setTimeout(()=>$('saveBtn').textContent='SALVAR CONFIG.',1800);});
$('exportBtn').addEventListener('click',()=>{const data={projeto:'S.P.E.C.T.R.A. / EGAS',natureza:'modelo conceitual educacional; não validado',aviso:'Elemento 192 não descoberto. Geometrias e valores são ilustrativos.',configuracao:configData(),componentes:partList.map(p=>({id:p[0],nome:p[1],camada:p[2]})),materiais:materialData};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='EGAS-ficha-conceitual.json';a.click();URL.revokeObjectURL(url);});
function restoreSaved(){
 try{const raw=localStorage.getItem('egas-lab-config');if(!raw)return;const d=JSON.parse(raw);if(d.material&&materialData[d.material]){$('material').value=d.material;material=d.material;}if(partList.some(p=>p[0]===d.selected)){$('partSelect').value=d.selected;selected=d.selected;}
 $('length').value=d.length??24;$('diameter').value=d.diameter??8;$('alpha').value=d.alpha??100;$('length').dispatchEvent(new Event('input'));$('diameter').dispatchEvent(new Event('input'));$('alpha').dispatchEvent(new Event('input'));
 Object.keys(groups).forEach(k=>{const el=document.querySelector('[data-layer="'+k+'"]');if(el){el.checked=d.layers?.[k]??true;groups[k].visible=el.checked;}});
 if(d.pieces)getPieceMeshes().forEach(o=>{if(Object.hasOwn(d.pieces,o.userData.id))o.visible=Boolean(d.pieces[o.userData.id]);});setExploded(Boolean(d.exploded));sectionEnabled=Boolean(d.sectionEnabled);cutPlane.constant=Number(d.sectionPosition)||0;$('sectionRange').value=cutPlane.constant;$('sectionOut').value=cutPlane.constant.toFixed(1);$('sectionBtn').textContent=sectionEnabled?'DESATIVAR CORTE':'CORTE TRANSVERSAL';$('sectionRange').disabled=!sectionEnabled;applyCut();refresh();highlight();applyMaterial();
 }catch(e){console.warn('Configuração salva não pôde ser carregada.',e);}
}
function updatePhysics(){
 const gamma=Number($('gammaInput').value),r=10**Number($('radiusInput').value);
 const me=9.1093837139e-31,u=1.66053906660e-27,G=6.67430e-11,c=299792458,Z=192,A=300;
 const electronRest=Z*me,nuclearMass=A*u,kinetic=Z*(gamma-1)*me*c*c;
 const gElectron=G*(electronRest+kinetic/(c*c))/(r*r),gNucleus=G*nuclearMass/(r*r);
 const rsElectron=2*G*(electronRest+kinetic/(c*c))/(c*c),rsNucleus=2*G*nuclearMass/(c*c);
 const fmt=x=>x.toExponential(3);
 $('gammaOut').value=gamma.toFixed(2);$('radiusOut').value=fmt(r)+' m';
 $('physicsResults').innerHTML=[
 ['ENERGIA CINÉTICA ELETRÔNICA TOTAL',fmt(kinetic/1.602176634e-13)+' MeV'],
 ['g ESTIMADO — ELÉTRONS',fmt(gElectron)+' m/s²'],
 ['g ESTIMADO — NÚCLEO',fmt(gNucleus)+' m/s²'],
 ['RAIO DE SCHWARZSCHILD EQUIVALENTE — ELÉTRONS',fmt(rsElectron)+' m'],
 ['RAIO DE SCHWARZSCHILD EQUIVALENTE — NÚCLEO',fmt(rsNucleus)+' m']
 ].map(([a,b])=>'<div class="physicsMetric"><span>'+a+'</span><b>'+b+'</b></div>').join('');
}
$('gammaInput').addEventListener('input',updatePhysics);
$('radiusInput').addEventListener('input',updatePhysics);
const mcData=[['Instrumentação e serviços',52.19],['Vaso e interfaces mecânicas',38.64],['Contenção radiológica',33.00],['Recuperação energética',25.89],['Núcleo E-192',21.25],['Interação eletrônica / espaço-tempo',16.08]];
$('mcRows').innerHTML=mcData.map(([n,v])=>'<div class="mcRow"><span>'+n+'</span><b>'+v.toFixed(2)+'</b><div class="mcBar"><i style="width:'+v+'%"></i></div></div>').join('');
updatePhysics();
restoreSaved();
refreshPieceInventory();
let lastFrame=performance.now(),frames=0;
function animate(now=performance.now()){requestAnimationFrame(animate);controls.update();const pulse=0.8+0.2*Math.sin(now*0.0018);if(objects.coreInner?.material)objects.coreInner.material.opacity=pulse;for(let i=0;i<9;i++){const e=objects['electron'+i];if(e){const a=now*.00035+i*2*Math.PI/9;e.position.set(1.15*Math.cos(a),.78*Math.sin(a),.35*Math.sin(a*2));}}composer.render();frames++;if(now-lastFrame>=1000){$('fpsReadout').textContent=frames+' FPS';frames=0;lastFrame=now;}}
refresh();highlight();animate();
