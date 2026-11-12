import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------
const W = 1080, H = 1920;
const YEL = 0xFFD43B;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const backOut = k => { k = clamp(k); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const ramp = (t, a, d = .35) => clamp((t - a) / d);
let seed = 11;
const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------
// Timeline (seconds) – synced on the voice track
// ---------------------------------------------------------------------------
const DURATION = 99.5;
const CLIPS = [
  ['N', 0.40, 7.19, null],
  ['J', 7.99, 11.88, 'Bonjour… euh, pourquoi il fait <em>si chaud</em> ici ?'],
  ['J', 12.23, 14.66, 'Les yaourts sont à <em>50 °C</em> !'],
  ['N', 15.46, 18.02, 'Salut ! Chez vous aussi, les frigos ont chauffé ?'],
  ['J', 18.37, 20.44, 'On s’est fait <em>pirater</em> un frigo ?!'],
  ['N', 20.79, 25.18, 'Pas le frigo : <em>l’automate</em> qui le pilote, relié à Internet.'],
  ['J', 25.98, 27.73, 'Mais comment ils sont entrés ?'],
  ['N', 28.08, 31.84, 'L’automate était <em>visible sur Internet</em>, avec un <em>mot de passe faible</em>.'],
  ['N', 32.19, 35.22, 'Et certains n’étaient <em>plus mis à jour</em> depuis des années.'],
  ['J', 36.02, 37.22, 'On est les seuls ?'],
  ['N', 37.57, 43.92, 'Non. Plus de <em>300</em> Intermarché et Netto, <em>80</em> Carrefour, environ <em>80</em> magasins U…'],
  ['N', 44.27, 48.86, 'Puis une <em>deuxième vague</em> en Europe, et <em>trois sites</em> de l’Établissement français du sang.'],
  ['J', 49.66, 51.13, 'Qu’est-ce qu’on aurait dû faire ?'],
  ['N', 51.48, 57.15, 'Ne jamais brancher l’automate <em>en direct</em> sur Internet : le prestataire passe par un <em>VPN</em>.'],
  ['N', 57.50, 62.72, '<em>Mettre à jour</em>, remplacer le vieux matériel, et garder une <em>alarme</em> de température à part.'],
  ['J', 63.52, 65.69, 'Et mon frigo connecté, <em>à la maison</em> ?'],
  ['N', 66.04, 70.90, 'Aucun piratage connu chez un particulier. Mais mets-le quand même sur un <em>Wi-Fi invité</em>.'],
  ['N', 71.25, 78.12, '<em>Mot de passe unique</em>, double authentification, mises à jour… et coupe ce qui ne sert pas.'],
  ['J', 78.92, 81.69, 'Merci ! J’appelle tout de suite le frigoriste.'],
  ['N', 82.04, 84.18, 'Et pense à <em>changer ce mot de passe</em> !'],
  ['J', 84.98, 98.20, null],
];
const SCENES = [
  { s: 0, e: 7.6, k: 'CYBERATTAQUE' },
  { s: 7.6, e: 15.1, k: 'LUNDI, 7 H' },
  { s: 15.1, e: 25.6, k: 'UN EXPERT ARRIVE' },
  { s: 25.6, e: 35.6, k: 'COMMENT ?' },
  { s: 35.6, e: 49.3, k: 'L’AMPLEUR' },
  { s: 49.3, e: 63.1, k: 'LES SOLUTIONS' },
  { s: 63.1, e: 78.5, k: 'ET CHEZ TOI ?' },
  { s: 78.5, e: 84.6, k: 'MERCI' },
  { s: 84.6, e: DURATION, k: 'ET TOI ?' },
];
const sceneIdx = t => { for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].s) return i; return 0; };

// ---------------------------------------------------------------------------
// Renderer / scene
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0b);
scene.fog = new THREE.Fog(0x0b0b0b, 16, 34);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = .55;
const camera = new THREE.PerspectiveCamera(40, W / H, .1, 100);

const hemi = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1.1); scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(3, 7, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xbcd6ff, 2.2); rim.position.set(-5, 5, -3); scene.add(rim);
const rim2 = new THREE.DirectionalLight(0xffe39a, 1.4); rim2.position.set(5, 3, -3); scene.add(rim2);
const heatLight = new THREE.PointLight(0xff5a1f, 0, 9, 1.2); heatLight.position.set(-.7, 1.6, -1.2); scene.add(heatLight);
const coolLight = new THREE.PointLight(0x8fd0ff, 0, 9, 1.2); coolLight.position.set(-.7, 1.6, -1.2); scene.add(coolLight);
const spot = new THREE.SpotLight(0xffffff, 0, 14, .5, .6, 1); spot.position.set(0, 7, 3); scene.add(spot); scene.add(spot.target);

const M = {
  yellow: new THREE.MeshPhysicalMaterial({ color: YEL, roughness: .3, clearcoat: .8, clearcoatRoughness: .2 }),
  black: new THREE.MeshPhysicalMaterial({ color: 0x161616, roughness: .32, clearcoat: 1, clearcoatRoughness: .12 }),
  green: new THREE.MeshStandardMaterial({ color: 0x1fa04a, roughness: .62 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x272727, roughness: .8 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: .95 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: .45, metalness: .35 }),
  shelf: new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: .4, metalness: .2 }),
  white: new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, roughness: .25, clearcoat: .6 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: .5 }),
};

function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { c, ctx: c.getContext('2d'), tex, key: null };
}
const cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 10, 24), m);
const sph = (r, m) => new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), m);
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

// Room ---------------------------------------------------------------------
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), M.floor); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), M.wall); wall.position.set(0, 15, -3); scene.add(wall);
const base = box(60, .12, .05, M.dark); base.position.set(0, .06, -2.97); scene.add(base);

// soft contact shadow
const shTex = (() => { const t = canvasTex(128, 128); const g = t.ctx.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); t.ctx.fillStyle = g; t.ctx.fillRect(0, 0, 128, 128); t.tex.needsUpdate = true; return t.tex; })();
const shadow = (w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .005; return m; };

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------
function makeChar(kind) {
  const isN = kind === 'N';
  const body = isN ? M.black : M.yellow, shirt = isN ? M.green : M.yellow;
  const root = new THREE.Group(); scene.add(root);
  const sh = shadow(1.1, .8); root.add(sh);
  const hips = new THREE.Group(); hips.position.y = .84; root.add(hips);
  const torso = cap(.23, .42, shirt); torso.position.y = .36; torso.scale.set(1, 1, .82); hips.add(torso);
  if (isN) {
    const pants = cap(.236, .06, M.black); pants.position.y = .06; pants.scale.set(1, 1, .84); hips.add(pants);
    const ct = canvasTex(256, 80); ct.ctx.fillStyle = '#fff'; ct.ctx.font = '800 44px Inter'; ct.ctx.textAlign = 'center'; ct.ctx.textBaseline = 'middle'; ct.ctx.fillText('Cybertip', 128, 42); ct.tex.needsUpdate = true;
    const dec = new THREE.Mesh(new THREE.PlaneGeometry(.26, .081), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true }));
    dec.position.set(0, .44, .2); hips.add(dec);
  }
  const neck = new THREE.Group(); neck.position.y = .72; hips.add(neck);
  const head = sph(.3, body); head.position.y = .27; neck.add(head);
  const arms = {};
  for (const [k, side] of [['A', -1], ['B', 1]]) {
    const s = new THREE.Group(); s.position.set(.27 * side, .6, 0); hips.add(s);
    const up = cap(.078, .26, isN ? M.green : body); up.position.y = -.19; s.add(up);
    const el = new THREE.Group(); el.position.y = -.38; s.add(el);
    const lo = cap(.07, .24, body); lo.position.y = -.17; el.add(lo);
    const hand = sph(.095, body); hand.position.y = -.36; el.add(hand);
    arms[k] = { sh: s, el, hand };
  }
  const thumb = cap(.035, .07, body); thumb.position.set(0, -.11, .03); arms.B.hand.add(thumb); thumb.visible = false;
  const legs = {};
  for (const [k, side] of [['A', -1], ['B', 1]]) {
    const hp = new THREE.Group(); hp.position.set(.12 * side, 0, 0); hips.add(hp);
    const th = cap(.088, .24, body); th.position.y = -.2; hp.add(th);
    const kn = new THREE.Group(); kn.position.y = -.4; hp.add(kn);
    const shn = cap(.08, .24, body); shn.position.y = -.18; kn.add(shn);
    const ft = sph(.1, body); ft.scale.set(1, .55, 1.5); ft.position.set(0, -.37, .05); kn.add(ft);
    legs[k] = { hp, kn };
  }
  return { root, hips, neck, head, arms, legs, thumb, kind };
}
const J = makeChar('J'), N = makeChar('N');

const GEST = {
  idle: { A: { r: .12 }, B: { r: .12 } },
  cheer: { A: { r: 1.45, e: 1.5 }, B: { r: 1.45, e: 1.5 } },
  scratch: { A: { r: .12 }, B: { r: 2.4, e: 1.6 }, tilt: -.14 },
  panic: { A: { r: 2.4, e: 1.6 }, B: { r: 2.4, e: 1.6 }, bob: .02 },
  shrug: { A: { r: .55, e: 1.25, f: -.35 }, B: { r: .55, e: 1.25, f: -.35 }, tilt: .12 },
  pointUp: { A: { r: .12 }, B: { r: 2.55, e: .15, f: -.2 } },
  pointLeft: { A: { r: 1.5, e: .05, f: -.25 }, B: { r: .12 } },
  pointRight: { A: { r: .12 }, B: { r: 1.5, e: .05, f: -.25 } },
  explain: { A: { r: .2 }, B: { r: .35, f: -.75, ef: -.75 } },
  explain2: { A: { r: .35, f: -.7, ef: -.8 }, B: { r: .35, f: -.7, ef: -.8 } },
  wave: { A: { r: .12 }, B: { r: 2.3, e: .5 }, wave: 1 },
  thumb: { A: { r: .15 }, B: { r: .95, e: 1.75, f: -.25 } },
  shake: { A: { r: .12 }, B: { r: .1, f: -1.3 }, shake: 1 },
  shakeA: { A: { r: .1, f: -1.3 }, B: { r: .12 }, shake: 1 },
  wag: { A: { r: .12 }, B: { r: 2.1, e: 1.0 }, wag: 1 },
  phone: { A: { r: .12 }, B: { r: 2.75, e: 2.45 }, tilt: .18 },
  hips: { A: { r: .55, e: -1.9 }, B: { r: .55, e: -1.9 } },
};
const ARMK = ['r', 'f', 'e', 'ef'];
function blendGest(sched, t) {
  let i = 0; for (let j = 0; j < sched.length; j++) if (t >= sched[j][0]) i = j;
  const cur = GEST[sched[i][1]], prev = GEST[i > 0 ? sched[i - 1][1] : sched[i][1]];
  const k = ease((t - sched[i][0]) / .4);
  const out = { A: {}, B: {} };
  for (const s of ['A', 'B']) for (const p of ARMK) out[s][p] = lerp(prev[s][p] || 0, cur[s][p] || 0, k);
  for (const p of ['tilt', 'bob', 'wave', 'shake', 'wag']) out[p] = lerp(prev[p] || 0, cur[p] || 0, k);
  return out;
}
function speakAmt(kind, t) {
  let a = 0;
  for (const [k, s, e] of CLIPS) if (k === kind) a = Math.max(a, clamp((t - s) / .15) * clamp((e - t) / .2));
  return a;
}
function applyPose(ch, P, t) {
  ch.root.visible = P.vis !== false;
  ch.root.position.set(P.x, 0, P.z); ch.root.rotation.y = P.ry || 0; ch.root.scale.setScalar(P.s ?? 1);
  const g = P.g, ph = ch.kind === 'J' ? 0 : 1.7;
  const talk = speakAmt(ch.kind, t);
  const walking = P.walk != null;
  ch.hips.position.y = .84 + .01 * Math.sin(t * 2.3 + ph) + (g.bob || 0) * Math.abs(Math.sin(t * 9)) + talk * .012 * Math.abs(Math.sin(t * 10 + ph)) + (walking ? .03 * Math.abs(Math.sin(P.walk)) : 0) + (P.jump || 0);
  ch.hips.rotation.z = .02 * Math.sin(t * 1.3 + ph) + (P.lean || 0);
  ch.hips.rotation.y = 0;
  ch.neck.rotation.set(talk * .08 * Math.sin(t * 11 + ph) + .03 * Math.sin(t * 1.7 + ph) + (P.nod || 0), talk * .05 * Math.sin(t * 4.3), (g.tilt || 0) + .03 * Math.sin(t * 1.1 + ph));
  for (const [k, side] of [['A', -1], ['B', 1]]) {
    const a = g[k], arm = ch.arms[k];
    let f = a.f, e = a.e, r = a.r;
    if (k === 'B' && g.wave) e += g.wave * .45 * Math.sin(t * 11);
    if (g.wag && k === 'B') e += g.wag * .25 * Math.sin(t * 13);
    if (g.shake) f += g.shake * .09 * Math.sin(t * 15);
    if (walking) f += .45 * Math.sin(P.walk) * side;
    r += .03 * Math.sin(t * 1.9 + ph + side);
    arm.sh.rotation.set(f, 0, side * r);
    arm.el.rotation.set(a.ef, 0, side * e);
  }
  for (const [k, s] of [['A', 1], ['B', -1]]) {
    const leg = ch.legs[k];
    const w = walking ? Math.sin(P.walk) * s : 0;
    leg.hp.rotation.x = w * .55;
    leg.kn.rotation.x = walking ? Math.max(0, Math.sin(P.walk + Math.PI / 2 * s) * .7) : 0;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
const PROD_COLS = [0xf08a24, 0xffffff, 0x3aa0ff, 0xff5a4a, 0xffd43b, 0x7bd389, 0xf08a24, 0xffb15a];
function makeDisplay(w, h) {
  const ct = canvasTex(256, 112);
  const g = new THREE.Group();
  const back = box(w + .04, h + .04, .05, M.dark); g.add(back);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false })); pl.position.z = .028; g.add(pl);
  const draw = (temp, cold) => {
    const k = `${temp}|${cold}`; if (ct.key === k) return; ct.key = k;
    const c = ct.ctx; c.fillStyle = '#0d0d0d'; c.fillRect(0, 0, 256, 112);
    c.fillStyle = cold ? '#36e27a' : '#ff3b30'; c.font = '800 70px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(`${temp} °C`, 128, 60); ct.tex.needsUpdate = true;
  };
  return { g, draw };
}
function makeWave(mat) {
  const pts = []; for (let i = 0; i <= 20; i++) { const y = i / 20 * .32; pts.push(V(.035 * Math.sin(y * 24), y, 0)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .016, 8), mat);
}
function makeFridge(x) {
  const g = new THREE.Group(); g.position.set(x, 0, -2.45); scene.add(g);
  const w = .92, h = 2.0, d = .6;
  const add = (m, px, py, pz) => { m.position.set(px, py, pz); g.add(m); return m; };
  add(box(w, h, .06, M.frame), 0, h / 2, -d / 2 + .03);
  add(box(.06, h, d, M.frame), -w / 2 + .03, h / 2, 0);
  add(box(.06, h, d, M.frame), w / 2 - .03, h / 2, 0);
  add(box(w, .1, d, M.frame), 0, h - .05, 0);
  add(box(w, .26, d, M.frame), 0, .13, 0);
  const inner = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff7a1a, emissiveIntensity: 1 });
  add(new THREE.Mesh(new THREE.PlaneGeometry(w - .12, h - .36), inner), 0, .26 + (h - .36) / 2, -d / 2 + .065);
  for (let s = 0; s < 4; s++) {
    const y = .3 + s * .4;
    add(box(w - .12, .025, d - .1, M.shelf), 0, y, 0);
    let px = -w / 2 + .1;
    while (px < w / 2 - .14) {
      const bw = .09 + rnd() * .07, bh = .12 + rnd() * .14;
      const col = PROD_COLS[Math.floor(rnd() * PROD_COLS.length)];
      const pm = new THREE.MeshStandardMaterial({ color: col, roughness: .5 });
      add(box(bw, bh, .14 + rnd() * .08, pm), px + bw / 2, y + .012 + bh / 2, .05 + rnd() * .05);
      px += bw + .025;
    }
  }
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .1, roughness: .05, metalness: 0, clearcoat: 1 });
  add(new THREE.Mesh(new THREE.PlaneGeometry(w - .08, h - .34), glass), 0, .25 + (h - .34) / 2, d / 2 - .01);
  const disp = makeDisplay(.5, .22); disp.g.position.set(0, h + .17, .05); g.add(disp.g);
  const wmat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0, toneMapped: false });
  const waves = [-.22, 0, .22].map(wx => { const m = makeWave(wmat); m.position.set(wx, h + .34, .05); g.add(m); return m; });
  return { g, inner, disp, waves, wmat };
}
const fridges = [-1.7, -.7, .3].map(makeFridge);

// Automate + Internet ---------------------------------------------------------
const auto = (() => {
  const g = new THREE.Group(); g.position.set(1.5, 1.95, -2.86); scene.add(g);
  g.scale.setScalar(1.25); const b = box(.62, .78, .16, M.frame); g.add(b);
  const ct = canvasTex(320, 400);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.56, .7), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false })); face.position.z = .082; g.add(face);
  const draw = (mode, blink) => {
    const k = mode + blink; if (ct.key === k) return; ct.key = k;
    const c = ct.ctx; c.fillStyle = '#1b1b1b'; c.fillRect(0, 0, 320, 400);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (mode === 'ok') { c.fillStyle = '#1fa04a'; c.beginPath(); c.roundRect(40, 40, 240, 70, 14); c.fill(); c.fillStyle = '#fff'; c.font = '800 40px Inter'; c.fillText('À JOUR', 160, 77); }
    else { c.fillStyle = '#e0362c'; c.beginPath(); c.roundRect(40, 40, 240, 70, 14); c.fill(); c.fillStyle = '#fff'; c.font = '800 42px Inter'; c.fillText(mode === 'pwd' ? '1234' : 'admin', 160, 77); }
    c.fillStyle = '#0c0c0c'; c.fillRect(40, 140, 240, 120);
    c.fillStyle = mode === 'old' ? '#ff9f1c' : (mode === 'ok' ? '#36e27a' : '#9aa0a6'); c.font = '700 30px Inter';
    c.fillText(mode === 'old' ? 'v1.0 · 2012' : (mode === 'ok' ? 'v2026 ✓' : 'TEMP 4 °C'), 160, 200);
    c.fillStyle = '#d0d0d0'; c.font = '800 34px Inter'; c.fillText('AUTOMATE', 160, 318);
    c.fillStyle = blink ? '#36e27a' : '#145c2c'; c.beginPath(); c.arc(270, 318, 12, 0, 7); c.fill();
    c.fillStyle = mode === 'ok' ? '#145c2c' : (blink ? '#5a1410' : '#ff3b30'); c.beginPath(); c.arc(50, 318, 12, 0, 7); c.fill();
    ct.tex.needsUpdate = true;
  };
  return { g, draw };
})();
const globe = (() => {
  const g = new THREE.Group(); g.position.set(1.55, 3.3, -2.6); scene.add(g); const spin = new THREE.Group(); g.add(spin);
  const core = sph(.28, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .4 })); spin.add(core);
  const wire = new THREE.Mesh(new THREE.SphereGeometry(.31, 14, 10), new THREE.MeshBasicMaterial({ color: YEL, wireframe: true, toneMapped: false })); spin.add(wire);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.31, .012, 8, 64), new THREE.MeshBasicMaterial({ color: YEL, toneMapped: false })); spin.add(ring);
  const ct = canvasTex(256, 64); ct.ctx.fillStyle = '#FFD43B'; ct.ctx.font = '800 40px Inter'; ct.ctx.textAlign = 'center'; ct.ctx.textBaseline = 'middle'; ct.ctx.fillText('INTERNET', 128, 34); ct.tex.needsUpdate = true;
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(.6, .15), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false })); lbl.position.set(0, .48, 0); g.add(lbl);
  return { g, wire, spin };
})();
// cable between automate and globe
const CA = V(1.52, 2.36, -2.78), CB = V(1.55, 2.97, -2.62);
const dashMat = new THREE.MeshBasicMaterial({ color: YEL, toneMapped: false });
const dashes = [];
for (let i = 0; i < 9; i++) {
  const k = (i + .5) / 9; const m = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .06, 8), dashMat);
  m.position.lerpVectors(CA, CB, k); m.lookAt(CB); m.rotateX(Math.PI / 2); scene.add(m); dashes.push(m);
}
const pulseMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false });
const pulses = [0, 1, 2].map(() => { const m = sph(.045, pulseMat); scene.add(m); return m; });
// VPN tunnel
const vpn = new THREE.Group(); scene.add(vpn);
const vpnMat = new THREE.MeshBasicMaterial({ color: 0x2BD45B, transparent: true, opacity: .9, toneMapped: false });
const vpnRings = [];
for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.1, .012, 8, 40), vpnMat); r.position.lerpVectors(CA, CB, (i + .5) / 6); r.lookAt(CB); vpn.add(r); vpnRings.push(r); }
function makeLock(colBody) {
  const g = new THREE.Group();
  const bm = new THREE.MeshPhysicalMaterial({ color: colBody, roughness: .3, clearcoat: .8 });
  const b = box(.2, .16, .07, bm); g.add(b);
  const s = new THREE.Mesh(new THREE.TorusGeometry(.068, .018, 10, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0xcfcfcf, metalness: .8, roughness: .25 })); s.position.y = .08; g.add(s);
  const kh = box(.03, .06, .01, M.dark); kh.position.set(0, -.01, .04); g.add(kh);
  return g;
}
const vpnLock = makeLock(0x2BD45B); vpnLock.position.lerpVectors(CA, CB, .5); vpnLock.position.x += .26; scene.add(vpnLock);
// "cut" X
const xMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false });
const cutX = new THREE.Group(); [.8, -.8].forEach(a => { const m = box(.34, .05, .03, xMat); m.rotation.z = a; cutX.add(m); });
cutX.position.lerpVectors(CA, CB, .5); cutX.position.z += .08; scene.add(cutX);
// alarm siren
const alarm = (() => {
  const g = new THREE.Group(); g.position.set(-2.45, 2.55, -2.85); scene.add(g);
  const b = box(.3, .12, .14, M.frame); g.add(b);
  const lm = new THREE.MeshStandardMaterial({ color: 0xff9f1c, emissive: 0xff7a00, emissiveIntensity: 2, transparent: true, opacity: .9 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.12, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), lm); dome.position.y = .06; g.add(dome);
  return { g, lm };
})();

// Board (Comment ? / Côté pros / Chez toi) -----------------------------------
const board = (() => {
  const g = new THREE.Group(); scene.add(g);
  const bw = 2.9, bh = 1.62;
  const fr = box(bw + .1, bh + .1, .06, M.dark); g.add(fr);
  const ct = canvasTex(1160, 648);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false })); pl.position.z = .032; g.add(pl);
  const draw = (title, items, prog) => {
    const k = title + prog.map(p => p.toFixed(2)).join(','); if (ct.key === k) return; ct.key = k;
    const c = ct.ctx; c.fillStyle = '#f5f1e8'; c.fillRect(0, 0, 1160, 648);
    c.font = '900 84px Inter'; const tw = c.measureText(title).width;
    c.fillStyle = '#FFD43B'; c.beginPath(); c.roundRect(44, 34, tw + 56, 116, 14); c.fill();
    c.fillStyle = '#111'; c.textBaseline = 'middle'; c.fillText(title, 72, 94);
    items.forEach((it, i) => {
      const p = prog[i]; if (p <= 0) return;
      const y = 222 + i * 112;
      c.globalAlpha = clamp(p * 1.4);
      const xo = (1 - easeOut(p)) * -40;
      c.fillStyle = '#FFD43B'; c.beginPath(); c.arc(84 + xo, y, 30, 0, 7); c.fill();
      c.fillStyle = '#111'; c.font = '900 38px Inter'; c.textAlign = 'center'; c.fillText(String(i + 1), 84 + xo, y + 2);
      c.textAlign = 'left'; c.font = '800 54px Inter'; c.fillText(it, 132 + xo, y + 2, 1000);
      c.globalAlpha = 1;
    });
    ct.tex.needsUpdate = true;
  };
  return { g, draw };
})();

// Home: fridge + router -------------------------------------------------------
const home = (() => {
  const g = new THREE.Group(); scene.add(g);
  const f = new THREE.Group(); f.position.set(1.35, 0, -2.45); g.add(f);
  const body = box(.9, 1.95, .7, M.white); body.position.y = .975; f.add(body);
  const line = box(.9, .015, .02, M.dark); line.position.set(0, 1.3, .355); f.add(line);
  const hm = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: .9, roughness: .2 });
  [[1.6, .35], [.85, .45]].forEach(([y, l]) => { const h = box(.04, l, .05, hm); h.position.set(-.36, y, .38); f.add(h); });
  const disp = makeDisplay(.32, .14); disp.g.position.set(.12, 1.62, .36); disp.g.scale.setScalar(1); f.add(disp.g);
  const wifiMat = new THREE.MeshBasicMaterial({ color: YEL, toneMapped: false, transparent: true });
  const arcs = [.12, .22, .32].map((r, i) => { const a = new THREE.Mesh(new THREE.TorusGeometry(r, .022, 8, 40, Math.PI / 2), wifiMat.clone()); a.rotation.z = Math.PI / 4; a.position.set(0, 2.15, 0); f.add(a); return a; });
  const dot = sph(.035, wifiMat); dot.position.set(0, 2.15, 0); f.add(dot);
  /*router
  const tb = box(.7, .05, .45, M.frame); tb.position.set(-1.95, .85, -2.4); g.add(tb);
  const leg = box(.05, .85, .05, M.frame); leg.position.set(-1.95, .425, -2.4); g.add(leg);
  const r = box(.42, .09, .26, M.white); r.position.set(-1.95, .92, -2.4); g.add(r);
  [-.14, .14].forEach(x => { const a = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .3, 8), M.white); a.position.set(-1.95 + x, 1.1, -2.48); g.add(a); });
  const ledM = new THREE.MeshBasicMaterial({ color: 0x36e27a, toneMapped: false });
  for (let i = 0; i < 4; i++) { const l = sph(.012, ledM); l.position.set(-2.1 + i * .06, .93, -2.27); g.add(l); }
  const ct = canvasTex(256, 64); ct.ctx.fillStyle = '#36e27a'; ct.ctx.font = '800 36px Inter'; ct.ctx.textAlign = 'center'; ct.ctx.textBaseline = 'middle'; ct.ctx.fillText('Wi-Fi invité', 128, 34); ct.tex.needsUpdate = true;
  */
  const ct = canvasTex(320, 72); ct.ctx.fillStyle = '#0e2a18'; ct.ctx.beginPath(); ct.ctx.roundRect(4, 4, 312, 64, 32); ct.ctx.fill(); ct.ctx.fillStyle = '#36e27a'; ct.ctx.font = '800 38px Inter'; ct.ctx.textAlign = 'center'; ct.ctx.textBaseline = 'middle'; ct.ctx.fillText('Wi-Fi invité', 160, 38); ct.tex.needsUpdate = true;
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(.8, .18), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false })); lbl.position.set(1.35, 2.68, -2.3); g.add(lbl);
  return { g, disp, arcs, lbl };
})();

// Checks (scene 8) -------------------------------------------------------------
const chkMat = new THREE.MeshPhysicalMaterial({ color: 0x2BD45B, emissive: 0x1a8a3c, emissiveIntensity: .6, roughness: .3, clearcoat: .8 });
const checks = [-1.7, -.7, .3].map(x => {
  const g = new THREE.Group(); g.position.set(x, 2.85, -2.3);
  const bg = box(.46, .46, .06, new THREE.MeshStandardMaterial({ color: 0x0e2a18, roughness: .5 })); g.add(bg);
  const a = box(.08, .16, .05, chkMat); a.position.set(-.07, -.03, .05); a.rotation.z = .8; g.add(a);
  const b = box(.08, .3, .05, chkMat); b.position.set(.06, .03, .05); b.rotation.z = -.62; g.add(b);
  scene.add(g); return g;
});

// Grid of stores (scene 5) ----------------------------------------------------------
const grid = (() => {
  const pts = [];
  for (let x = -2.2; x <= 2.2; x += .155) for (let z = -2.4; z <= 1.0; z += .155) {
    const nx = x / 2.0, nz = (z + .7) / 1.55;
    if (nx * nx + nz * nz <= 1) pts.push([x + (rnd() - .5) * .03, z + (rnd() - .5) * .03, rnd()]);
  }
  pts.sort((a, b) => a[2] - b[2]);
  const fr = pts.slice(0, 460);
  const eu = [];
  for (let i = 0; eu.length < 150 && i < 4000; i++) {
    const a = rnd() * Math.PI * 2, r = 1 + rnd() * .55;
    const x = Math.cos(a) * 2.0 * r, z = -.7 + Math.sin(a) * 1.55 * r;
    if (z < 1.4 && z > -2.8) eu.push([x, z]);
  }
  const all = [...fr.map(p => [p[0], p[1]]), ...eu];
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(.11, .1, .11), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6 }), all.length);
  scene.add(im);
  const efs = [[-.6, -1.6], [.9, -.2], [-1.3, .1]].map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const dm = new THREE.MeshPhysicalMaterial({ color: 0xe0242c, roughness: .25, clearcoat: 1 });
    const s = sph(.13, dm); s.position.y = .5; g.add(s);
    const c = new THREE.Mesh(new THREE.ConeGeometry(.125, .22, 32), dm); c.position.y = .66; g.add(c);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .4, 8), M.white); st.position.y = .2; g.add(st);
    scene.add(g); return g;
  });
  return { im, n: all.length, all, efs };
})();
const dummy = new THREE.Object3D(), colTmp = new THREE.Color();
const C_BASE = new THREE.Color(0x5a5a5a), C_RED = new THREE.Color(0xff3b30), C_ORG = new THREE.Color(0xff9f1c);
function updateGrid(t) {
  for (let i = 0; i < grid.n; i++) {
    const [x, z] = grid.all[i];
    let on = 0, col = C_RED;
    if (i < 300) on = ramp(t, 37.7 + (i / 300) * 2.2, .25);
    else if (i < 380) on = ramp(t, 40.2 + ((i - 300) / 80) * 1.2, .25);
    else if (i < 460) on = ramp(t, 41.6 + ((i - 380) / 80) * 1.2, .25);
    else { on = ramp(t, 44.4 + ((i - 460) / 150) * 1.8, .25); col = C_ORG; }
    const appear = i < 460 ? 1 : ramp(t, 44.0 + ((i - 460) / 150) * 1.2, .3);
    dummy.position.set(x, .05 * appear + (on > 0 ? backOut(on) * .08 : 0), z);
    dummy.scale.set(appear, Math.max(.01, appear * (1 + backOut(on) * 1.6)), appear);
    dummy.updateMatrix(); grid.im.setMatrixAt(i, dummy.matrix);
    colTmp.copy(C_BASE).lerp(col, clamp(on)); grid.im.setColorAt(i, colTmp);
  }
  grid.im.instanceMatrix.needsUpdate = true; grid.im.instanceColor.needsUpdate = true;
  grid.efs.forEach((g, i) => { const k = backOut(ramp(t, 46.7 + i * .45, .45)); g.scale.setScalar(Math.max(.001, k)); g.rotation.y = t * 1.5; });
}

// ---------------------------------------------------------------------------
// Choreography
// ---------------------------------------------------------------------------
const SCHED_J = [[0, 'cheer'], [7.6, 'idle'], [8.9, 'scratch'], [12.2, 'panic'], [14.9, 'idle'], [18.3, 'panic'], [20.7, 'idle'], [25.6, 'scratch'], [28.0, 'idle'],
  [35.6, 'shrug'], [37.4, 'idle'], [49.3, 'shrug'], [51.3, 'idle'], [63.3, 'pointRight'], [65.9, 'idle'], [72, 'hips'], [78.5, 'shake'], [80.4, 'phone'], [84.6, 'idle'], [85.4, 'thumb'], [96.6, 'wave']];
const SCHED_N = [[0, 'pointUp'], [7.6, 'idle'], [15.2, 'idle'], [15.5, 'wave'], [17.4, 'idle'], [20.8, 'pointUp'], [23.2, 'explain'], [25.6, 'idle'], [28.0, 'pointLeft'], [32.1, 'explain'],
  [35.6, 'idle'], [37.6, 'explain2'], [44.2, 'explain'], [49.3, 'idle'], [51.4, 'pointLeft'], [54.4, 'explain2'], [57.4, 'pointLeft'], [60.2, 'explain'], [63.1, 'idle'], [66.0, 'explain'], [68.0, 'pointUp'], [71.2, 'pointUp'], [73.6, 'explain2'], [78.5, 'shakeA'], [80.4, 'idle'], [82.0, 'wag'], [84.6, 'idle']];

function charStates(t) {
  const sc = sceneIdx(t);
  const j = { x: -.85, z: .45, ry: .22, g: blendGest(SCHED_J, t) };
  const n = { x: .95, z: .45, ry: -.22, g: blendGest(SCHED_N, t) };
  if (sc === 0) { j.x = -.8; n.x = .9; j.jump = .06 * Math.abs(Math.sin(t * 5)) * clamp(1 - t / 2.5); }
  if (sc === 1) {
    n.vis = false;
    const k = clamp((t - 7.6) / 1.3);
    j.x = lerp(-3.1, -.45, easeOut(k)); j.z = .6;
    j.ry = lerp(Math.PI / 2, .05, ease((t - 8.6) / .45));
    if (t < 8.85) j.walk = (t - 7.6) * 10;
    if (t > 12.2) j.jump = .12 * Math.max(0, Math.sin((t - 12.2) * 9)) * clamp(1 - (t - 12.2) / 1.2);
  }
  if (sc === 2) {
    const k = clamp((t - 15.1) / 1.25);
    n.x = lerp(3.2, .55, easeOut(k));
    n.ry = lerp(-Math.PI / 2, -.25, ease((t - 16.1) / .45));
    if (t < 16.35) n.walk = (t - 15.1) * 10;
    j.ry = lerp(.05, .35, ease((t - 15.4) / .5));
    if (t > 18.3 && t < 19.6) j.jump = .1 * Math.max(0, Math.sin((t - 18.3) * 10)) * clamp(1 - (t - 18.3) / 1.2);
  }
  if (sc === 3) { j.x = -1.2; n.x = .5; n.ry = -.35; }
  if (sc === 4) {
    j.x = -.5; n.x = .5; j.z = n.z = 2.4;
    const turn = ease((t - 37.4) / .7);
    j.ry = lerp(.2, Math.PI - .15, turn); n.ry = lerp(-.2, -Math.PI + .15, turn);
  }
  if (sc === 5) { j.x = -1.2; n.x = .5; n.ry = -.35; }
  if (sc === 6) { j.x = .25; j.ry = .5; n.x = -1.05; n.ry = .1; j.z = .6; n.z = .5; }
  if (sc === 7) { j.x = -.66; n.x = .66; j.ry = .95; n.ry = -.95; j.z = n.z = .5; }
  if (sc === 8) { n.vis = false; j.x = .4; j.z = .8; j.ry = -.3; j.s = 1.0; j.jump = t > 96.6 ? .1 * Math.abs(Math.sin((t - 96.6) * 7)) : 0; }
  return { j, n };
}

// Camera keyframes per scene: [pos, target] from -> to
const CAMS = [
  [[0, 2.3, 9.6], [0, 1.55, -.5], [.35, 2.15, 8.4], [0, 1.5, -.5]],
  [[-.4, 1.9, 8.0], [-.4, 1.35, -1], [-.3, 1.9, 7.6], [-.4, 1.35, -1]],
  [[.25, 2.2, 8.4], [.2, 1.55, -1], [.45, 2.3, 8.0], [.35, 1.7, -1]],
  [[0, 2.35, 8.4], [0, 1.65, -1], [.1, 2.3, 7.9], [0, 1.65, -1]],
  [[0, 2.0, 9.6], [0, 1.1, 1], [0, 7.6, 6.6], [0, 0, -2.0]],
  [[0, 2.35, 8.4], [0, 1.65, -1], [-.15, 2.3, 7.8], [0, 1.65, -1]],
  [[0, 2.3, 8.3], [0, 1.6, -1], [.15, 2.25, 7.8], [0, 1.6, -1]],
  [[0, 2.0, 7.4], [0, 1.45, -.5], [0, 1.9, 6.6], [0, 1.45, -.5]],
  [[-.05, 1.95, 8.0], [-.15, 1.9, 0], [-.2, 1.9, 7.5], [-.15, 1.9, 0]],
];
const camPos = V(0, 0, 0), camTgt = V(0, 0, 0), tmpA = V(0, 0, 0), tmpB = V(0, 0, 0);
function updateCamera(t, sc) {
  const S = SCENES[sc], c = CAMS[sc];
  let k = (t - S.s) / (S.e - S.s);
  if (sc === 4) k = ease((t - 37.0) / 2.6) * .85 + clamp((t - 39.6) / 9.7) * .15;
  else k = ease(k * .5 + .25) * 1.0; // gentle constant drift
  if (sc !== 4) k = clamp((t - S.s) / (S.e - S.s));
  const kk = sc === 4 ? k : (k * k * (3 - 2 * k));
  camPos.set(lerp(c[0][0], c[2][0], kk), lerp(c[0][1], c[2][1], kk), lerp(c[0][2], c[2][2], kk));
  camTgt.set(lerp(c[1][0], c[3][0], kk), lerp(c[1][1], c[3][1], kk), lerp(c[1][2], c[3][2], kk));
  if (sc === 4) { const a = (t - 39.6) * .05 * clamp((t - 39.6) / 2); camPos.x = Math.sin(a) * 6.6 * clamp((t - 39.6)); camPos.z = lerp(camPos.z, Math.cos(a) * 6.6, clamp(t - 39.6)); }
  if (sc === 1) { // push in on the temperature display
    const z = ease((t - 12.15) / .9) * (1 - ease((t - 14.4) / .6));
    tmpA.set(-.7, 2.22, .9); tmpB.set(-.7, 2.17, -2.4);
    camPos.lerp(tmpA, z); camTgt.lerp(tmpB, z);
  }
  if (sc === 0) { const sh = clamp(1 - Math.abs(t - 4.75) / .25); camPos.x += sh * .06 * Math.sin(t * 80); camPos.y += sh * .04 * Math.cos(t * 70); }
  camera.position.copy(camPos); camera.lookAt(camTgt);
}

// ---------------------------------------------------------------------------
// HTML overlay
// ---------------------------------------------------------------------------
const $ = id => document.getElementById(id);
const prog = $('prog'); prog.innerHTML = SCENES.map(() => '<i><b></b></i>').join('');
const progBars = [...prog.querySelectorAll('b')];
const ICON = {
  com: '<svg viewBox="0 0 24 24" fill="none" stroke="#FFD43B" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="#FFD43B" stroke-width="2.2" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="#FFD43B" stroke-width="2.2" stroke-linejoin="round"><path d="M21 3L3 10.5l7 3 3 7z"/><path d="M10 13.5L21 3"/></svg>',
};
const cache = {};
const setHTML = (el, html) => { if (cache[el] !== html) { $(el).innerHTML = html; cache[el] = html; } };
const vis = (el, on) => $(el).classList.toggle('hide', !on);
const headProj = V(0, 0, 0);

function updateOverlay(t, sc) {
  const S = SCENES[sc];
  $('kick').textContent = S.k;
  progBars.forEach((b, i) => { const s = SCENES[i]; b.style.transform = `scaleX(${clamp((t - s.s) / (s.e - s.s))})`; });
  // fade between scenes
  let f = 0; for (let i = 1; i < SCENES.length; i++) f = Math.max(f, 1 - Math.abs(t - SCENES[i].s) / .18);
  if (sc === 1) f = Math.max(f, t < 8.6 ? 0 : 0);
  $('fade').style.opacity = clamp(f).toFixed(3);
  // title (scene 1)
  vis('title', sc === 0);
  if (sc === 0) {
    const a = ramp(t, 4.65, .12);
    setHTML('title', `Des frigos chauffés à 50 °C.<span class="l2" style="opacity:${a.toFixed(2)};transform:translateX(${((1 - a) * -30).toFixed(1)}px)">Par des pirates.</span>`);
  }
  // stats (scene 5)
  vis('stats', sc === 4);
  if (sc === 4) {
    const rows = [
      [37.7, 300, '+', 'Intermarché & Netto', 'red', 2.2], [40.2, 80, '', 'Carrefour', 'red', 1.2], [41.6, 80, '≈', 'magasins U', 'red', 1.2],
      [44.3, 2, 'e', 'vague : Europe', 'org', .01], [46.7, 3, '', 'sites de l’EFS', 'red', .9],
    ];
    setHTML('stats', rows.map(([s, n, suf, txt, cl, d]) => {
      const a = ramp(t, s, .25); if (a <= 0) return '';
      const v = Math.round(n * clamp((t - s) / d));
      const num = suf === '≈' ? `≈${v}` : `${v}${suf === '+' ? '+' : suf === 'e' ? 'ᵉ' : ''}`;
      return `<div class="row" style="opacity:${a.toFixed(2)}"><div class="n ${cl}">${num}</div><div class="t">${txt}</div></div>`;
    }).join(''));
  }
  // pill (scene 7)
  const pa = sc === 6 ? ramp(t, 66.0, .3) : 0;
  vis('pill', pa > 0);
  if (pa > 0) setHTML('pill', `<span style="opacity:${pa.toFixed(2)}">✓ Aucun piratage connu chez un particulier</span>`);
  // CTA (scene 9)
  vis('cta', sc === 8); vis('sub', sc === 8 && t >= 96.5);
  if (sc === 8) {
    const r = (s) => { const a = ramp(t, s, .3); return `opacity:${a.toFixed(2)};transform:translateY(${((1 - easeOut(a)) * 30).toFixed(1)}px)`; };
    setHTML('cta', `<h1 style="${r(84.9)}">Tes objets connectés sont <span>protégés</span> ?</h1>
      <div class="r" style="${r(87.6)}">${ICON.com}<div>Dis-le en commentaire : <b>oui, non, dis-m’en plus</b></div></div>
      <div class="r" style="${r(91.6)}">${ICON.save}<div><b>Enregistre</b> cette vidéo pour ne pas l’oublier</div></div>
      <div class="r" style="${r(94.1)}">${ICON.send}<div><b>Envoie-la</b> à quelqu’un qui a un frigo connecté</div></div>`);
    const sa = ramp(t, 96.5, .3); $('sub').style.opacity = sa.toFixed(2); $('sub').style.transform = `scale(${(.85 + .15 * backOut(sa)).toFixed(3)})`;
  }
  // speech bubble
  let cur = null;
  for (const c of CLIPS) if (c[3] && t >= c[1] - .05 && sceneIdx(c[1]) === sc) cur = c;
  vis('bubble', !!cur);
  if (cur) {
    const ch = cur[0] === 'J' ? J : N;
    ch.head.getWorldPosition(headProj); headProj.project(camera);
    const hx = (headProj.x * .5 + .5) * W;
    const a = ramp(t, cur[1] - .05, .22);
    setHTML('bubble', `<div class="b ${cur[0]}"><div class="tail"></div>${cur[3]}</div>`);
    const b = $('bubble').firstChild; const bw = b.offsetWidth;
    // position bubble horizontally near speaker
    let left = clamp(hx - 60 - bw / 2, 0, Math.max(0, 870 - bw));
    b.style.marginLeft = left + 'px';
    b.querySelector('.tail').style.left = clamp(hx - 60 - left - 22, 30, bw - 74) + 'px';
    b.style.opacity = a.toFixed(2);
    b.style.transform = `scale(${(.9 + .1 * backOut(a)).toFixed(3)})`;
    b.style.transformOrigin = `${clamp(hx - 60 - left, 30, bw - 30)}px 0`;
  }
}

// ---------------------------------------------------------------------------
// World state per time
// ---------------------------------------------------------------------------
function heatAt(t) {
  if (t < 7.6) return 1;
  if (t < 15.1) return ease((t - 9.2) / 3.0);
  if (t < 49.3) return 1;
  if (t < 63.1) return 1 - ease((t - 60.4) / 2.5);
  return 0;
}
function update(t) {
  const sc = sceneIdx(t);
  // visibility
  const shop = [0, 1, 2, 7].includes(sc) || (sc === 5 && false);
  fridges.forEach(f => f.g.visible = shop);
  auto.g.visible = [2, 3, 5].includes(sc);
  globe.g.visible = auto.g.visible;
  board.g.visible = [3, 5, 6].includes(sc);
  home.g.visible = sc === 6;
  grid.im.visible = sc === 4; grid.efs.forEach(e => e.visible = sc === 4);
  checks.forEach(c => c.visible = sc === 7);
  alarm.g.visible = sc === 5;

  // lighting
  let lv = 1;
  if (sc === 1) { const on = t >= 8.75; const fl = (t > 8.75 && t < 9.25) ? (Math.sin(t * 90) > 0 ? 1 : .25) : 1; lv = on ? fl : .1; }
  if (sc === 8) lv = .75;
  hemi.intensity = 1.1 * lv; key.intensity = 2.6 * lv; rim.intensity = 2.2 * Math.max(lv, .5); rim2.intensity = 1.4 * Math.max(lv, .4);
  scene.environmentIntensity = .55 * lv;
  const heat = heatAt(t);
  heatLight.intensity = shop ? 9 * heat * lv * (1 + .08 * Math.sin(t * 7)) : 0;
  coolLight.intensity = shop ? 7 * (1 - heat) * lv * (sc === 1 ? 0 : 1) : 0;
  spot.intensity = sc === 8 ? 60 : 0; spot.position.set(.8, 6, 3); spot.target.position.set(.8, 1, .8);
  // wall tint
  M.wall.color.setHex(sc === 6 ? 0x3a3530 : 0x333333); M.floor.color.setHex(sc === 6 ? 0x2e2925 : 0x272727);

  // fridges
  const temp = Math.round(lerp(4, 50, heat));
  fridges.forEach((f, i) => {
    const on = sc === 1 ? (t >= 8.75 ? 1 : .05) : 1;
    f.inner.emissive.setHex(0xff7a1a).lerp(new THREE.Color(0xbfe6ff), 1 - heat);
    f.inner.emissiveIntensity = (.25 + .9 * (heat > .5 ? heat : (1 - heat) * .8 + .2)) * on;
    f.disp.draw(temp, heat < .5);
    f.waves.forEach((w, k) => { const p = ((t * .7 + k * .33 + i * .17) % 1); w.position.y = 2.32 + p * .32; });
    f.wmat.opacity = heat * on * .95;
    f.waves.forEach((w, k) => { const p = ((t * .7 + k * .33 + i * .17) % 1); w.scale.setScalar(.6 + .4 * Math.sin(p * Math.PI)); });
  });

  // automate & globe & cable
  if (auto.g.visible) {
    const ap = sc === 2 ? backOut(ramp(t, 21.4, .45)) : 1;
    const gp = sc === 2 ? backOut(ramp(t, 22.9, .45)) : 1;
    auto.g.scale.setScalar(Math.max(.001, ap) * 1.25); globe.g.scale.setScalar(Math.max(.001, gp));
    globe.spin.rotation.y = t * .6; globe.spin.rotation.x = .25;
    let mode = 'admin';
    if (sc === 3 && t > 30.0) mode = 'pwd';
    if (sc === 3 && t > 32.2) mode = 'old';
    if (sc === 5 && t > 57.6) mode = 'ok';
    auto.draw(mode, Math.sin(t * 6) > 0 ? 1 : 0);
    const cableOn = gp > .9;
    const cut = sc === 5 && t > 51.6;
    const vpnOn = sc === 5 ? ramp(t, 54.5, .5) : 0;
    dashes.forEach((d, i) => { d.visible = cableOn && !(cut && vpnOn < .99); });
    dashMat.color.setHex(vpnOn > .99 ? 0x2BD45B : YEL);
    cutX.visible = cut && vpnOn < 1; cutX.scale.setScalar(Math.max(.001, backOut(ramp(t, 51.6, .35))) * (1 - vpnOn));
    vpn.visible = vpnOn > 0; vpnRings.forEach((r, i) => { const k = backOut(clamp(vpnOn * 1.6 - i * .1)); r.scale.setScalar(Math.max(.001, k)); });
    vpnLock.visible = vpnOn > 0; vpnLock.scale.setScalar(Math.max(.001, backOut(ramp(t, 55.2, .4)))); vpnLock.rotation.y = Math.sin(t * 2) * .3;
    const hacking = cableOn && (sc === 2 || sc === 3) ;
    pulses.forEach((p, i) => { p.visible = hacking; const k = ((t * .55 + i / 3) % 1); p.position.lerpVectors(CB, CA, k); p.scale.setScalar(1 + .3 * Math.sin(t * 12 + i)); });
    // in scene 4 highlight: globe "scan" pulse when "visible sur Internet"
    globe.wire.material.color.setHex(sc === 3 && t > 28.1 && t < 30 && Math.sin(t * 20) > 0 ? 0xff3b30 : YEL);
  } else { dashes.forEach(d => d.visible = false); pulses.forEach(p => p.visible = false); vpn.visible = false; vpnLock.visible = false; cutX.visible = false; }

  // board
  if (board.g.visible) {
    if (sc === 3) { board.g.position.set(-.5, 2.75, -2.9); board.g.scale.setScalar(1.08);
      board.draw('Comment ?', ['Automate visible sur Internet', 'Mot de passe faible', 'Matériel plus mis à jour'], [ramp(t, 28.1, .4), ramp(t, 30.0, .4), ramp(t, 32.2, .4)]); }
    if (sc === 5) { board.g.position.set(-.5, 2.75, -2.9); board.g.scale.setScalar(1.08);
      board.draw('Côté pros', ['Jamais d’accès direct depuis Internet', 'Un VPN pour le prestataire', 'Mettre à jour ou remplacer', 'Une alarme de température à part'], [ramp(t, 51.6, .4), ramp(t, 54.5, .4), ramp(t, 57.6, .4), ramp(t, 60.3, .4)]); }
    if (sc === 6) { board.g.position.set(-.62, 2.8, -2.9); board.g.scale.setScalar(.98);
      board.draw('Chez toi', ['Wi-Fi invité pour les objets', 'Mot de passe unique + 2FA', 'Mises à jour automatiques', 'Caméra, micro : coupés'], [ramp(t, 68.2, .4), ramp(t, 71.3, .4), ramp(t, 73.8, .4), ramp(t, 75.9, .4)]); }
    const bp = backOut(ramp(t, SCENES[sc].s + .1, .5)); board.g.scale.multiplyScalar(Math.max(.001, bp));
  }
  // alarm
  if (alarm.g.visible) { const a = backOut(ramp(t, 60.4, .4)); alarm.g.scale.setScalar(Math.max(.001, a)); alarm.lm.emissiveIntensity = 1 + 2.5 * (Math.sin(t * 9) > 0 ? 1 : 0); }
  // home
  if (home.g.visible) {
    home.disp.draw(4, true);
    home.arcs.forEach((a, i) => { a.material.opacity = .25 + .75 * clamp(Math.sin(t * 4 - i * .9) * .5 + .5); });
    home.lbl.visible = t > 68.0; home.lbl.scale.setScalar(Math.max(.001, backOut(ramp(t, 68.0, .4))));
  }
  // checks
  if (sc === 7) checks.forEach((c, i) => { c.scale.setScalar(Math.max(.001, backOut(ramp(t, 79.0 + i * .35, .4)))); c.rotation.y = Math.sin(t * 2 + i) * .2; });
  // grid
  if (sc === 4) updateGrid(t);

  // characters
  const st = charStates(t);
  applyPose(J, st.j, t); applyPose(N, st.n, t);
  J.thumb.visible = sc === 8;
  updateCamera(t, sc);
  renderer.toneMappingExposure = 1.05;
  renderer.render(scene, camera);
  updateOverlay(t, sc);
}

window.DURATION = DURATION;
window.renderAt = (t) => { update(t); return true; };
(async () => {
  await document.fonts.load('900 60px Inter'); await document.fonts.load('800 60px Inter'); await document.fonts.load('600 60px Inter');
  await new Promise(r => { const i = $('hdr').querySelector('img'); if (i.complete) r(); else i.onload = r; });
  const q = new URLSearchParams(location.search);
  update(parseFloat(q.get('t') || '0'));
  window.ready = true;
})();
