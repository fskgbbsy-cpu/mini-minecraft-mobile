import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.2, 6);

const hemi = new THREE.HemisphereLight(0xffffff, 0x666666, 1.0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.7);
dir.position.set(5, 10, 2);
scene.add(dir);

const world = new THREE.Group();
scene.add(world);

const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x6dbb4f });
const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
const stoneMat = new THREE.MeshLambertMaterial({ color: 0x999999 });

const blocks = new Map();
function key(x, y, z) { return `${x},${y},${z}`; }

function addBlock(x, y, z, mat = dirtMat) {
  const k = key(x, y, z);
  if (blocks.has(k)) return null;
  const m = new THREE.Mesh(blockGeo, mat);
  m.position.set(x, y, z);
  m.userData.block = { x, y, z };
  world.add(m);
  blocks.set(k, m);
  return m;
}

function removeBlock(x, y, z) {
  const k = key(x, y, z);
  const m = blocks.get(k);
  if (!m) return false;
  world.remove(m);
  blocks.delete(k);
  return true;
}

for (let x = -12; x <= 12; x++) {
  for (let z = -12; z <= 12; z++) {
    addBlock(x, 0, z, groundMat);
    if ((x + z) % 7 === 0) addBlock(x, -1, z, stoneMat);
  }
}

for (let y = 1; y <= 3; y++) addBlock(3, y, 3, dirtMat);

const player = {
  pos: new THREE.Vector3(0, 1.7, 6),
  yaw: Math.PI,
  pitch: -0.15,
  speed: 4.0,
};

const joystick = {
  active: false,
  id: null,
  x: 0,
  y: 0,
};

const look = {
  active: false,
  id: null,
  lastX: 0,
  lastY: 0,
};

const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");
const placeBtn = document.getElementById("placeBtn");

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

joystickBase.addEventListener("pointerdown", (e) => {
  joystick.active = true;
  joystick.id = e.pointerId;
  joystickBase.setPointerCapture(e.pointerId);
  updateJoystickFromEvent(e);
});

joystickBase.addEventListener("pointermove", (e) => {
  if (!joystick.active || e.pointerId !== joystick.id) return;
  updateJoystickFromEvent(e);
});

joystickBase.addEventListener("pointerup", (e) => {
  if (e.pointerId !== joystick.id) return;
  resetJoystick();
});

joystickBase.addEventListener("pointercancel", (e) => {
  if (e.pointerId !== joystick.id) return;
  resetJoystick();
});

function updateJoystickFromEvent(e) {
  const r = joystickBase.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const max = r.width * 0.35;
  const len = Math.hypot(dx, dy) || 1;
  if (len > max) {
    dx = (dx / len) * max;
    dy = (dy / len) * max;
  }
  joystick.x = dx / max;
  joystick.y = dy / max;
  joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function resetJoystick() {
  joystick.active = false;
  joystick.id = null;
  joystick.x = 0;
  joystick.y = 0;
  joystickKnob.style.transform = "translate(-50%, -50%)";
}

canvas.addEventListener("pointerdown", (e) => {
  const inJoystick = e.clientX < 180 && e.clientY > window.innerHeight - 180;
  const inPlaceBtn = e.clientX > window.innerWidth - 130 && e.clientY > window.innerHeight - 130;
  if (inJoystick || inPlaceBtn) return;

  look.active = true;
  look.id = e.pointerId;
  look.lastX = e.clientX;
  look.lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!look.active || e.pointerId !== look.id) return;
  const dx = e.clientX - look.lastX;
  const dy = e.clientY - look.lastY;
  look.lastX = e.clientX;
  look.lastY = e.clientY;

  player.yaw -= dx * 0.004;
  player.pitch -= dy * 0.004;
  player.pitch = clamp(player.pitch, -1.45, 1.45);
});

canvas.addEventListener("pointerup", (e) => {
  if (e.pointerId !== look.id) return;
  look.active = false;
  look.id = null;
});
canvas.addEventListener("pointercancel", () => {
  look.active = false;
  look.id = null;
});

const raycaster = new THREE.Raycaster();

function getForward() {
  const f = new THREE.Vector3();
  f.x = -Math.sin(player.yaw) * Math.cos(player.pitch);
  f.y = Math.sin(player.pitch);
  f.z = -Math.cos(player.yaw) * Math.cos(player.pitch);
  return f.normalize();
}

function breakBlock() {
  raycaster.set(player.pos, getForward());
  const hit = raycaster.intersectObjects(world.children, false)[0];
  if (!hit) return;
  const { x, y, z } = hit.object.userData.block;
  if (y <= 0) return;
  removeBlock(x, y, z);
}

function placeBlock() {
  raycaster.set(player.pos, getForward());
  const hit = raycaster.intersectObjects(world.children, false)[0];
  if (!hit) return;

  const n = hit.face.normal.clone();
  const p = hit.object.position.clone().add(n);
  const x = Math.round(p.x), y = Math.round(p.y), z = Math.round(p.z);
  if (y < 0 || y > 8) return;

  const d = new THREE.Vector3(x, y, z).distanceTo(player.pos);
  if (d < 1.5) return;

  addBlock(x, y, z, dirtMat);
}

placeBtn.addEventListener("click", placeBlock);
canvas.addEventListener("click", breakBlock);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const move = new THREE.Vector3();

  move.addScaledVector(forward, -joystick.y);
  move.addScaledVector(right, joystick.x);

  if (move.lengthSq() > 0.0001) {
    move.normalize().multiplyScalar(player.speed * dt);
    player.pos.add(move);
  }

  player.pos.y = 1.7;

  camera.position.copy(player.pos);
  const lookDir = getForward();
  camera.lookAt(player.pos.clone().add(lookDir));

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
