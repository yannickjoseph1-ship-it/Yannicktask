// usage: node render.mjs start end out.mp4   (frame indices, 30 fps)
import { createRequire } from 'module'; import { spawn } from 'child_process';
const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW);
const [a, b, out] = process.argv.slice(2); const s = +a, e = +b;
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
for (let i = s; i < e; i++) {
  await p.evaluate(t => window.renderAt(t), i / 30);
  const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 150 === 0) console.log(out, i);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close();
