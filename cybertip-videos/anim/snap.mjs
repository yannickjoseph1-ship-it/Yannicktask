// usage: node snap.mjs out.png t1 t2 ...  -> contact sheet (half-res)
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW || 'playwright');
import { execFileSync } from 'child_process';
const [out, ...ts] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto('http://localhost:8765/index.html');
await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
const files = [];
for (const t of ts) { await p.evaluate(t => window.renderAt(t), parseFloat(t)); const f = `/tmp/claude-0/-home-user-Yannicktask/c3a510fd-858c-5936-891d-59ef09f48425/scratchpad/snap_${t}.png`; await p.screenshot({ path: f }); files.push(f); }
await b.close();
const cols = Math.min(files.length, 4);
execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', files.map((_, i) => `[${i}]scale=360:-1[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${files.length}:fill=black:layout=` + files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|') + (files.length === 1 ? '' : ''), out]);
