// Rendu complet sur ta machine (utilise la carte graphique) :
//   npm install
//   npx playwright install chromium
//   npm run render
// Résultat : cybertip-videos/cybertip_frigos_9x16.mp4
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const AUDIO = path.join(DIR, '..', 'audio', 'v1_frigos_piste_voix.mp3');
const OUT = path.join(DIR, '..', 'cybertip_frigos_9x16.mp4');
const FPS = 30;
const args = process.argv.slice(2);
const secArg = args.find(a => a.startsWith('--seconds='));
const preview = args.includes('--preview') || !!secArg; // rendu court pour tester

// petit serveur local pour la page
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(DIR, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(DIR) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const angle = process.platform === 'win32' ? 'd3d11' : process.platform === 'darwin' ? 'metal' : 'gl';
async function open(flags) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: flags });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  let webglError = false;
  page.on('pageerror', e => { if (/WebGL/i.test(e.message)) webglError = true; else console.log('Erreur page :', e.message); });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  try { await page.waitForFunction(() => window.ready, null, { timeout: 60000 }); }
  catch (e) { await browser.close(); if (webglError) return null; throw e; }
  return { browser, page };
}
let ctx = await open([`--use-angle=${angle}`, '--enable-gpu', '--ignore-gpu-blocklist']);
if (!ctx) {
  console.log('La carte graphique n\'a pas pu être utilisée, passage en rendu logiciel (plus lent).');
  ctx = await open(['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']);
}
const { browser, page } = ctx;
const gpu = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'inconnu'; });
console.log('Carte graphique utilisée :', gpu);

const duration = secArg ? parseFloat(secArg.split('=')[1]) : preview ? 10 : await page.evaluate(() => window.DURATION);
const total = Math.round(duration * FPS);
const out = preview ? OUT.replace('.mp4', '_apercu.mp4') : OUT;
const ff = spawn(ffmpegPath, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', AUDIO,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.renderAt(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 60 === 0 || i === total - 1) {
    const el = (Date.now() - t0) / 1000, eta = el / (i + 1) * (total - i - 1);
    process.stdout.write(`\rImage ${i + 1}/${total}  –  reste ~${Math.ceil(eta / 60)} min   `);
  }
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close(); server.close();
console.log(`\nTerminé : ${out}`);
