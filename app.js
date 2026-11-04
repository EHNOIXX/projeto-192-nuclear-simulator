import * as THREE from 'three';

const $ = id => document.getElementById(id);
const z = $('z');
const n = $('n');
const C = {
  ac: 0.711,
  as: 17.8,
  u: 1.66053906660e-27,
  G: 6.67430e-11,
  c: 299792458
};

let scene, camera, renderer, nucleus, cloud, shell;
let view = 'nucleus';
let targetZoom = 4.0;
const MIN_ZOOM = 2.4;
const MAX_ZOOM = 18;

function makeParticle(material, radius) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 20), material);
}

function setup() {
  const host = $('atomView');
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#080e19');

  camera = new THREE.PerspectiveCamera(40, host.clientWidth / host.clientHeight, 0.1, 100);
  camera.position.set(0, 0, targetZoom);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Núcleo atômico 3D esquemático. Arraste para girar e use a roda ou os botões para aproximar.');

  scene.add(new THREE.AmbientLight(0xb7d8ef, 1.8));
  const keyLight = new THREE.PointLight(0x72e8e5, 42, 30);
  keyLight.position.set(4, 5, 7);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(0x8e7dff, 18, 24);
  fillLight.position.set(-5, -2, 3);
  scene.add(fillLight);

  nucleus = new THREE.Group();
  cloud = new THREE.Group();
  scene.add(nucleus, cloud);

  const stars = [];
  for (let i = 0; i < 500; i++) {
    stars.push((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 12);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x526783, size: 0.022, transparent: true, opacity: 0.65 })));

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
  renderer.domElement.addEventListener('pointercancel', () => { dragging = false; });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    nucleus.rotation.y += dx * 0.009;
    nucleus.rotation.x += dy * 0.009;
    cloud.rotation.y += dx * 0.006;
    cloud.rotation.x += dy * 0.006;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  renderer.domElement.addEventListener('wheel', event => {
    event.preventDefault();
    targetZoom = THREE.MathUtils.clamp(targetZoom * Math.exp(event.deltaY * 0.0014), MIN_ZOOM, MAX_ZOOM);
  }, { passive: false });

  $('zoomIn')?.addEventListener('click', () => { targetZoom = Math.max(MIN_ZOOM, targetZoom * 0.78); });
  $('zoomOut')?.addEventListener('click', () => { targetZoom = Math.min(MAX_ZOOM, targetZoom * 1.28); });
  $('zoomReset')?.addEventListener('click', () => { targetZoom = 4.0; });

  window.addEventListener('resize', () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  draw();
  animate();
}

function draw() {
  if (!nucleus) return;
  nucleus.clear();
  cloud.clear();

  const Z = Number(z.value);
  const N = Number(n.value);
  const A = Z + N;
  const count = Math.min(A, 750);
  const radius = 1.72 * Math.cbrt(Math.max(1, A) / 442);
  const protonMaterial = new THREE.MeshStandardMaterial({
    color: 0x55e0e5, emissive: 0x0b555d, emissiveIntensity: 0.35, roughness: 0.24, metalness: 0.18
  });
  const neutronMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b8cff, emissive: 0x34266f, emissiveIntensity: 0.3, roughness: 0.27, metalness: 0.14
  });

  // Distribuição de pontos ilustrativa; não representa posições nucleares calculadas.
  for (let i = 0; i < count; i++) {
    const isProton = i < Z;
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = radius * Math.cbrt((i + 0.5) / count);
    const particle = makeParticle(isProton ? protonMaterial : neutronMaterial, isProton ? 0.073 : 0.069);
    particle.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    const sizeVariation = 0.94 + 0.12 * (0.5 + 0.5 * Math.sin(i * 12.9898));
    particle.scale.setScalar(sizeVariation);
    nucleus.add(particle);
  }

  const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 40, 32),
    new THREE.MeshBasicMaterial({ color: 0x54dce2, wireframe: true, transparent: true, opacity: 0.055 })
  );
  nucleus.add(outerGlow);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.22, 40, 32),
    new THREE.MeshBasicMaterial({ color: 0x6b83c9, wireframe: true, transparent: true, opacity: 0.035 })
  );
  nucleus.add(halo);

  // Contornos decorativos para evidenciar o volume; não são camadas nucleares reais.
  const contourMaterial = new THREE.MeshBasicMaterial({
    color: 0x8cebea, wireframe: true, transparent: true, opacity: 0.075
  });
  [0.48, 0.72, 0.94].forEach((fraction, index) => {
    const contour = new THREE.Mesh(
      new THREE.SphereGeometry(radius * fraction, 28, 20),
      contourMaterial
    );
    contour.rotation.set(index * 0.31, index * 0.47, index * 0.19);
    nucleus.add(contour);
  });

  // Nuvem de probabilidade meramente ilustrativa: não é uma orbital calculada.
  const cloudPositions = [];
  for (let i = 0; i < 1100; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 1.8 + Math.random() * 0.75;
    cloudPositions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }
  const cloudGeometry = new THREE.BufferGeometry();
  cloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cloudPositions, 3));
  cloud.add(new THREE.Points(cloudGeometry, new THREE.PointsMaterial({
    color: 0x6fe7e2, size: 0.026, transparent: true, opacity: 0.22, sizeAttenuation: true
  })));
  const cloudSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.15, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x68e0df, wireframe: true, transparent: true, opacity: 0.045 })
  );
  cloud.add(cloudSphere);

  nucleus.visible = view === 'nucleus';
  cloud.visible = view === 'cloud';
  const particleCount = $('particleCount');
  if (particleCount) particleCount.textContent = count.toLocaleString('pt-BR') + ' partículas exibidas';
  const nucleusScale = $('nucleusScale');
  if (nucleusScale) nucleusScale.textContent = 'A = ' + A;
}

function animate() {
  requestAnimationFrame(animate);
  if (camera) {
    camera.position.z += (targetZoom - camera.position.z) * 0.14;
  }
  if (view === 'nucleus' && nucleus) nucleus.rotation.y += 0.0011;
  if (view === 'cloud' && cloud) cloud.rotation.y += 0.0008;
  renderer.render(scene, camera);
}

function calc() {
  const Z = Number(z.value);
  const N = Number(n.value);
  const A = Z + N;
  const x = C.ac * Z * Z / (2 * C.as * A);
  const mass = A * C.u;
  const schwarzschild = 2 * C.G * mass / (C.c * C.c);
  const nuclearRadius = 1.2e-15 * Math.cbrt(A);
  const gravity = C.G * mass / (nuclearRadius * nuclearRadius);

  $('zv').value = Z;
  $('nv').value = N;
  $('av').textContent = A;
  $('xv').textContent = x.toFixed(3);
  $('xs').textContent = x < 1
    ? 'x < 1: o indicador da gota líquida fica abaixo do limiar x = 1.'
    : 'x ≥ 1: o indicador da gota líquida ultrapassa o limiar x = 1.';
  $('mv').textContent = mass.toExponential(3) + ' kg';
  $('rsv').textContent = schwarzschild.toExponential(2) + ' m';
  $('gv').textContent = gravity.toExponential(2) + ' m/s²';
  draw();
}

z.addEventListener('input', calc);
n.addEventListener('input', calc);
$('reset').addEventListener('click', () => {
  z.value = 192;
  n.value = 250;
  calc();
});
document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    view = button.dataset.view;
    $('viewname').textContent = view === 'nucleus' ? 'NUCLEUS VIEW' : 'PROBABILITY CLOUD';
    draw();
  });
});

setup();
calc();
