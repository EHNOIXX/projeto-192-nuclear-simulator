import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color('#080f1b');scene.fog=new THREE.Fog('#080f1b',25,55);
const camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(17,10,18);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2.25));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('viewport').appendChild(renderer.domElement);
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(900,600),.48,.65,.78);
composer.addPass(bloom);composer.addPass(new OutputPass());
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=5;controls.maxDistance=42;controls.target.set(0,0,0);
scene.add(new THREE.HemisphereLight(0xc6dcff,0x111927,1.65));
const key=new THREE.DirectionalLight(0xd9eaff,3.2);key.position.set(7,10,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-16;key.shadow.camera.right=16;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;scene.add(key);
const fill=new THREE.PointLight(0x69dce5,85,35);fill.position.set(-5,2,6);scene.add(fill);
const rim=new THREE.PointLight(0x9278ff,110,35);rim.position.set(-8,-2,-6);scene.add(rim);
const warm=new THREE.PointLight(0xffb66d,48,24);warm.position.set(7,-3,2);scene.add(warm);
const pmrem=new THREE.PMREMGenerator(renderer);const envScene=new THREE.Scene();envScene.background=new THREE.Color(0x35465b);
const envRoom=new THREE.Mesh(new THREE.BoxGeometry(30,18,30),new THREE.MeshBasicMaterial({color:0x283b52,side:THREE.BackSide}));envScene.add(envRoom);
const envTex=pmrem.fromScene(envScene,.04).texture;scene.environment=envTex;pmrem.dispose();
const grid=new THREE.GridHelper(32,32,0x24364c,0x152338);grid.position.y=-4.5;scene.add(grid);
const root=new THREE.Group();scene.add(root);const groups={structure:new THREE.Group(),core:new THREE.Group(),field:new THREE.Group(),plasma:new THREE.Group(),nova:new THREE.Group(),control:new THREE.Group()};Object.values(groups).forEach(g=>root.add(g));
const mats={
structure:new THREE.MeshPhysicalMaterial({color:0x8296a9,metalness:.88,roughness:.24,clearcoat:.8,clearcoatRoughness:.2,envMapIntensity:1.5,transparent:true,opacity:1}),
dark:new THREE.MeshPhysicalMaterial({color:0x1c2a3b,metalness:.82,roughness:.27,clearcoat:.6}),
core:new THREE.MeshPhysicalMaterial({color:0x9d7aff,emissive:0x5425bb,emissiveIntensity:2.2,metalness:.25,roughness:.16,clearcoat:1}),
cyan:new THREE.MeshPhysicalMaterial({color:0x69e4e1,emissive:0x167d91,emissiveIntensity:1.15,metalness:.65,roughness:.2,clearcoat:.8}),
amber:new THREE.MeshPhysicalMaterial({color:0xd9a45d,emissive:0x79421a,emissiveIntensity:.75,metalness:.78,roughness:.22}),
glass:new THREE.MeshPhysicalMaterial({color:0x4aa9c9,transparent:true,opacity:.12,roughness:.04,metalness:.05,transmission:.72,thickness:.18,ior:1.45,side:THREE.DoubleSide,depthWrite:false})
};
const objects={};function add(id,label,layer,geometry,material,pos,scale){const m=new THREE.Mesh(geometry,material);m.name=id;m.userData={id,label,layer};m.position.set(...pos);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;groups[layer].add(m);objects[id]=m;return m}
function cyl(r1,r2,h,mat,pos,rad=64){return add('part'+Object.keys(objects).length,'', 'structure',new THREE.CylinderGeometry(r1,r2,h,rad,1,true),mat,pos)}
// Central longitudinal axis is X.
const shell=add('outerShell','Revestimento externo','structure',new THREE.CylinderGeometry(2.05,2.05,14,128,1,true),mats.structure,[0,0,0],[1,1,.78]);shell.rotation.z=Math.PI/2;shell.castShadow=true;shell.receiveShadow=true;
add('frontRing','Anel estrutural frontal','structure',new THREE.TorusGeometry(1.65,.16,16,80),mats.dark,[-6.9,0,0],[1,1,.78]).rotation.y=Math.PI/2;
add('rearRing','Anel estrutural traseiro','structure',new THREE.TorusGeometry(1.65,.16,16,80),mats.dark,[6.9,0,0],[1,1,.78]).rotation.y=Math.PI/2;
for(let x of [-5.7,-3.8,3.8,5.7]){let r=add('support'+x,'Aro de suporte','structure',new THREE.TorusGeometry(1.62,.09,12,64),mats.cyan,[x,0,0],[1,1,.78]);r.rotation.y=Math.PI/2}
add('core','Núcleo E-192 (hipotético)','core',new THREE.IcosahedronGeometry(.62,3),mats.core,[0,0,0]);
let glow=add('coreGlow','Halo ilustrativo do núcleo','core',new THREE.SphereGeometry(.95,32,24),new THREE.MeshBasicMaterial({color:0x8f68ff,transparent:true,opacity:.10}),[0,0,0]);
for(let i=0;i<3;i++){let ring=add('orbit'+i,'Anel orbital ilustrativo','core',new THREE.TorusGeometry(1.05+i*.22,.018,8,90),mats.core,[0,0,0]);ring.rotation.set(i*.8,i*.6,i*.3)}
for(let x of [-3.4,3.4]){let coil=add('coil'+x,'Bobina eletromagnética ilustrativa','field',new THREE.TorusGeometry(1.25,.18,16,64),mats.amber,[x,0,0]);coil.rotation.y=Math.PI/2;let casing=add('fieldCase'+x,'Câmara de campo','field',new THREE.CylinderGeometry(1.42,1.42,.55,64,1,true),mats.glass,[x,0,0]);casing.rotation.z=Math.PI/2}
for(let x of [-5.2,5.2]){let p=add('plasma'+x,'Câmara conceitual de plasma','plasma',new THREE.CylinderGeometry(.9,.9,1.5,48,1,true),mats.glass,[x,0,0]);p.rotation.z=Math.PI/2;let inner=add('plasmaGlow'+x,'Volume luminoso ilustrativo','plasma',new THREE.SphereGeometry(.68,24,18),new THREE.MeshBasicMaterial({color:0x3b9fff,transparent:true,opacity:.14}),[x,0,0],[1,1,1.7])}
add('nova','Módulo N.O.V.A. (conceitual)','nova',new THREE.TorusKnotGeometry(.8,.13,100,12),mats.cyan,[2.1,0,0]);
add('vector','Anel de controle vetorial','control',new THREE.TorusGeometry(1.75,.12,14,80),mats.dark,[6.2,0,0]).rotation.y=Math.PI/2;

add('nozzle','Bocal cenográfico','structure',new THREE.CylinderGeometry(1.0,1.8,2.2,96,1,true),mats.dark,[8,0,0],[1,1,.85]).rotation.z=Math.PI/2;
// Fine visual detailing: segmented armor bands, fasteners and service panels.
for(const x of [-6.45,-5.9,-1.8,1.8,5.9,6.45]){
 const band=add('armorBand'+x,'Faixa de acabamento','structure',new THREE.TorusGeometry(2.055,.045,10,96),mats.amber,[x,0,0],[1,1,.78]);band.rotation.y=Math.PI/2;
}
for(const x of [-5.7,-3.8,3.8,5.7]){
 for(let j=0;j<16;j++){const a=j*Math.PI/8;add('bolt'+x+'_'+j,'Fixador cenográfico','structure',new THREE.SphereGeometry(.055,12,8),mats.dark,[x,2.08*Math.cos(a),1.62*Math.sin(a)]);}
}
for(let j=0;j<8;j++){const a=j*Math.PI/4;const panel=add('panel'+j,'Painel externo de serviço','structure',new THREE.BoxGeometry(1.25,.055,.32),mats.dark,[-.8,2.075*Math.cos(a),1.62*Math.sin(a)]);panel.rotation.x=a;}

const names={structure:'Estrutura externa',core:'Núcleo E-192',field:'Sistema eletromagnético',plasma:'Câmaras conceituais de plasma',nova:'Módulo N.O.V.A.',control:'Controle vetorial'};
const descriptions={outerShell:'Carcaça cenográfica para organizar a visualização dos módulos. Não define espessura estrutural real.',frontRing:'Anel de referência visual da estrutura frontal.',rearRing:'Anel de referência visual da estrutura traseira.',core:'Representação artística de um núcleo com Z=192. Sua existência e propriedades são desconhecidas.',coreGlow:'Efeito gráfico sem correspondência com emissão física medida.','coil-3.4':'Bobina ilustrativa para discutir eletromagnetismo; não é especificação de bobina real.','coil3.4':'Bobina ilustrativa para discutir eletromagnetismo; não é especificação de bobina real.',plasma:'Volume visual para representar uma região de estudo de plasma, sem parâmetros operacionais.',nova:'Módulo conceitual que agrupa temas de energia e propulsão especulativa.',vector:'Representação de um módulo de orientação e controle, não de um sistema construído.',nozzle:'Bocal cenográfico; não implica existência de fluxo ou empuxo.'};
const layerKeys=Object.keys(groups);$('layers').innerHTML=layerKeys.map(k=>'<label class="check"><input type="checkbox" data-layer="'+k+'" checked> '+names[k]+'</label>').join('');
const partList=[['outerShell','Revestimento externo','structure'],['frontRing','Anel frontal','structure'],['rearRing','Anel traseiro','structure'],['core','Núcleo E-192','core'],['coil-3.4','Bobina eletromagnética esquerda','field'],['coil3.4','Bobina eletromagnética direita','field'],['plasma','Câmara de plasma','plasma'],['nova','Módulo N.O.V.A.','nova'],['vector','Controle vetorial','control'],['nozzle','Bocal cenográfico','structure']];
$('partSelect').innerHTML=partList.map(p=>'<option value="'+p[0]+'">'+p[1]+'</option>').join('');
let selected='outerShell',material='titanium',length=24,diam=8,alpha=100;
const materialData={titanium:{name:'Liga de titânio',density:'Alta resistência específica e boa resistência à corrosão.',fit:86,caution:'Propriedades dependem da liga e da temperatura; não valida o projeto.'},aluminum:{name:'Liga de alumínio',density:'Baixa densidade e boa usinabilidade em várias ligas.',fit:76,caution:'Limites térmicos e mecânicos variam muito entre ligas.'},copper:{name:'Cobre',density:'Alta condutividade elétrica e térmica.',fit:69,caution:'É pesado e não é, por si só, um supercondutor.'},graphite:{name:'Compósito de carbono',density:'Baixa densidade e propriedades direcionais.',fit:72,caution:'Compatibilidade térmica, matriz e radiação dependem do compósito.'},ceramic:{name:'Cerâmica técnica',density:'Pode oferecer alta estabilidade térmica e dureza.',fit:70,caution:'Fragilidade e choque térmico precisam ser avaliados.'},niobium:{name:'Nióbio',density:'Metal usado em certas ligas e supercondutores.',fit:64,caution:'Supercondutividade exige composição, temperatura e campo adequados.'}};
function scoreFor(id){let base={outerShell:80,frontRing:78,rearRing:78,core:0,'coil-3.4':74,'coil3.4':74,plasma:62,nova:0,vector:67,nozzle:55}[id]??50;let delta={titanium:4,aluminum:-3,copper:-8,graphite:-1,ceramic:-4,niobium:-6}[material];return id==='core'||id==='nova'?null:Math.max(0,Math.min(100,base+delta))}
function refresh(){const p=partList.find(x=>x[0]===selected)||partList[0],sc=scoreFor(selected),md=materialData[material];$('partInfo').innerHTML='<b>'+p[1]+'</b><br>'+ (descriptions[selected]||'Componente visual do modelo.')+'<br><br><span>Camada: '+names[p[2]]+'</span>';$('materialInfo').innerHTML='<b>'+md.name+'</b><br>'+md.density+'<br><br>'+md.caution;$('score').innerHTML=(sc===null?'N/A':sc+'/100')+'<small>ÍNDICE QUALITATIVO, NÃO VALIDADO</small>';$('compatText').textContent=sc===null?'Não há base científica para pontuar a compatibilidade deste componente com o motor.':sc>=80?'Compatibilidade conceitual relativamente alta para estudos preliminares; ainda requer análise de engenharia.':sc>=65?'Compatibilidade parcial: há propriedades úteis, mas também limitações importantes.':'Compatibilidade limitada: exige justificativa e estudos adicionais.';$('criteria').innerHTML=(sc===null?['Evidência experimental: indisponível','Desempenho: desconhecido','Viabilidade: não demonstrada']: [['Propriedades relevantes',Math.min(98,sc+5)],['Compatibilidade térmica',Math.max(20,sc-12)],['Maturidade tecnológica',Math.max(10,sc-24)]].map(([n,v])=>'<div class="criterion">'+n+'<div><i style="width:'+v+'%"></i></div></div>').join(''));$('selectionLabel').textContent=p[1].toUpperCase()}
$('partSelect').addEventListener('change',e=>{selected=e.target.value;refresh();highlight()});$('material').addEventListener('change',e=>{material=e.target.value;refresh();applyMaterial()});
document.querySelectorAll('[data-layer]').forEach(el=>el.addEventListener('change',()=>{groups[el.dataset.layer].visible=el.checked}));
$('allLayers').onclick=()=>{document.querySelectorAll('[data-layer]').forEach(el=>{el.checked=true;groups[el.dataset.layer].visible=true})};
function applyMaterial(){const color={titanium:0x8296a9,aluminum:0xb7c4cf,copper:0xb97848,graphite:0x384450,ceramic:0xd8d4c9,niobium:0x7595b8}[material];objects.outerShell.material.color.setHex(color);objects.outerShell.material.needsUpdate=true}
function highlight(){Object.values(objects).forEach(o=>{if(o.material&&o.material.emissive)o.material.emissiveIntensity=o.name===selected?2.2:(o.userData.layer==='core'?1.4:.2)})}
function resize(){let w=$('viewport').clientWidth,h=$('viewport').clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);bloom.setSize(w,h)}window.addEventListener('resize',resize);resize();
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();renderer.domElement.addEventListener('click',e=>{let r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera);let hits=ray.intersectObjects(root.children.flatMap(g=>g.children),false);let hit=hits.find(h=>h.object.userData.id);if(hit){selected=hit.object.userData.id;let option=partList.find(p=>p[0]===selected);if(option){$('partSelect').value=selected;refresh();highlight()}}});
$('length').oninput=e=>{length=+e.target.value;$('lengthOut').value=length+' m';root.scale.x=length/24};$('diameter').oninput=e=>{diam=+e.target.value;$('diamOut').value=diam+' m';root.scale.y=diam/8;root.scale.z=diam/8};$('alpha').oninput=e=>{alpha=+e.target.value;$('alphaOut').value=alpha+'%';objects.outerShell.material.opacity=alpha/100;objects.outerShell.material.transparent=alpha<100;objects.outerShell.material.needsUpdate=true};
$('homeView').onclick=()=>{camera.position.set(17,10,18);controls.target.set(0,0,0);controls.update()};
$('reset').onclick=()=>{$('length').value=24;$('diameter').value=8;$('alpha').value=100;$('material').value='titanium';$('partSelect').value='outerShell';length=24;diam=8;root.scale.set(1,1,1);$('lengthOut').value='24 m';$('diamOut').value='8 m';$('alphaOut').value='100%';objects.outerShell.material.opacity=1;material='titanium';selected='outerShell';document.querySelectorAll('[data-layer]').forEach(el=>{el.checked=true;groups[el.dataset.layer].visible=true});applyMaterial();refresh();highlight()};
function animate(){requestAnimationFrame(animate);controls.update();composer.render()}refresh();highlight();animate();