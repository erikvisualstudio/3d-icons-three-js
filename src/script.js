import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { Pane } from 'tweakpane';

// // --- Pane (GUI) ---
// const pane = new Pane();

// --- Canvas ---
const canvas = document.querySelector('canvas.threejs');

// --- Szene ---
const scene = new THREE.Scene();

// --- Licht ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(-3, 2, 2); // leicht von oben/vorne
dirLight.castShadow = true;

scene.add(ambientLight, dirLight);

// --- Kamera ---
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(9, 0, 18);  // von links & leicht oben
camera.lookAt(0, 0, 0);

scene.add(camera);

// --- Textur / EnvMap ---
const textureLoader = new THREE.TextureLoader();

// selbe Datei als einfache "Fake"-EnvMap benutzen
const envTexture = textureLoader.load('textures/blue-light-background.jpg');
envTexture.mapping = THREE.EquirectangularReflectionMapping;
envTexture.colorSpace = THREE.SRGBColorSpace;

// PBR-Materialien sollen diese Umgebung reflektieren
scene.environment = envTexture;

// ggf. auch als Hintergrund der Szene setzen (nicht nötig, weil wir CSS nutzen)
// scene.background = envTexture;

// --- Material für das Logo ---
const webflowMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 1,
  roughness: 0.12,
  reflectivity: 1,
  clearcoat: 1,
  clearcoatRoughness: 0.15,
  envMapIntensity: 1.5,
});

// --- GLTF Loader ---
const loader = new GLTFLoader();

let model = null;

loader.load(
  '3D/figma.glb',
  (gltf) => {
    model = gltf.scene;

    // allen Meshes im Modell unser Material geben
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = webflowMaterial;
      }
    });

   // Bounding Box berechnen
const box = new THREE.Box3().setFromObject(model);
const center = box.getCenter(new THREE.Vector3());

// Pivot korrekt setzen
model.traverse((child) => {
  if (child.isMesh) {
    child.geometry.computeBoundingBox();
    const geoCenter = child.geometry.boundingBox.getCenter(new THREE.Vector3());
    child.geometry.translate(-geoCenter.x, -geoCenter.y, -geoCenter.z);
  }
});

// Model selbst wieder an (0,0,0) setzen
model.position.set(0, 0, 0);

    scene.add(model);

    // --- Pane-Controls ---
    // const folder = pane.addFolder({ title: 'Material' });

    // folder.addBinding(webflowMaterial, 'metalness', { min: 0, max: 1, step: 0.01 });
    // folder.addBinding(webflowMaterial, 'roughness', { min: 0, max: 1, step: 0.01 });
    // folder.addBinding(webflowMaterial, 'clearcoat', { min: 0, max: 1, step: 0.01 });
    // folder.addBinding(webflowMaterial, 'clearcoatRoughness', { min: 0, max: 1, step: 0.01 });
    // folder.addBinding(webflowMaterial, 'envMapIntensity', { min: 0, max: 5, step: 0.1 });
  },
  undefined,
  (error) => {
    console.error('Fehler beim Laden der GLB-Datei:', error);
  }
);

// --- Hilfen (optional) ---
// const axesHelper = new THREE.AxesHelper(8);
// scene.add(axesHelper);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,      // Canvas durchsichtig, damit der CSS-Background zu sehen ist
  antialias: true,
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const maxPixelRatio = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(maxPixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Hintergrund transparent halten
renderer.setClearColor(0x000000, 0);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

// Nur drehen erlauben:
controls.enableZoom = false; // kein Scroll-Zoom, kein Pinch
controls.enablePan  = false; // kein Verschieben mit rechter Maustaste

// optional: auch keine Rotation mit rechter Maustaste erzwingen
controls.mouseButtons.RIGHT = null;
controls.mouseButtons.MIDDLE = null;


// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Render Loop ---
const renderloop = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(renderloop);
};

renderloop();
