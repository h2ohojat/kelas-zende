// آزمون مرورگر موتور ۱٫۲: هر درس در iframe ایزوله (sandbox="allow-scripts") اجرا می‌شود.
// node _src/e2e.mjs   (به Playwright نیاز دارد؛ مسیر دیگر: PLAYWRIGHT_MODULE=/path/to/playwright/index.js)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(DIR, '..');
let pw;
try { pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch { console.log('Playwright not found: skipped'); process.exit(0); }

const shots = process.env.SHOTS; // folder for screenshots, optional
const engine = fs.readFileSync(path.join(DIR, 'engine.js'), 'utf8');
const built = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
// A lesson written for 1.1 (no stable ids, no contentMode) with today's engine, as a host would rebuild it.
const legacy = built('03-lesson-density.html')
  .replace(/<script type="application\/json" id="kz-meta">[\s\S]*?<\/script>\n/, '')
  .replace(/<script>\n\/\* =+\n   محتوای درس[\s\S]*?<\/script>/, () => '<script>\n' + fs.readFileSync(path.join(DIR, 'test/legacy-density-1.1.js'), 'utf8') + '\n</script>');
if (legacy.includes("id: 'drop-lab'")) throw new Error('legacy fixture was not swapped in');

const CASES = [
  { name: 'density', html: built('03-lesson-density.html'), objectives: 3 },
  { name: 'fractions', html: built('02-lesson-fractions.html') },
  { name: 'template', html: built('05-template.html') },
  { name: 'legacy 1.1 lesson', html: legacy, legacy: true, objectives: 3 },
];

const host = (html) => `<!DOCTYPE html><html><body style="margin:0">
<iframe id="f" sandbox="allow-scripts" style="width:100vw;height:100vh;border:0"></iframe>
<script>
  window.__msgs = [];
  const f = document.getElementById('f');
  window.addEventListener('message', (e) => {
    if (e.source !== f.contentWindow) return;
    window.__msgs.push(e.data);
    if (e.data && e.data.kind === 'hello') f.contentWindow.postMessage({ ns: 'kelas', v: 1, kind: 'init', persist: true, learner: { id: 'x', name: 'سارا' } }, '*');
  });
  f.srcdoc = ${JSON.stringify(html).replace(/</g, '\\u003c')};
</script></body></html>`;

let failed = 0;
const ok = (cond, msg) => { if (!cond) { failed++; console.log('   ✗', msg); } };
const browser = await pw.chromium.launch();
for (const c of CASES) {
  for (const width of shots ? [390, 1280] : [390]) {
    const page = await browser.newPage({ viewport: { width, height: 860 } });
    const errors = [], warnings = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
    await page.setContent(host(c.html));
    await page.waitForFunction(() => window.__msgs.some((m) => m.kind === 'event' && m.type === 'host.connected'), null, { timeout: 10000 });
    const frame = page.frames().find((f) => f !== page.mainFrame());
    if (shots) { await page.waitForTimeout(1500); await page.screenshot({ path: path.join(shots, `engine-${c.name.split(' ')[0]}-${width}-start.png`) }); }
    if (width !== 390) { await page.close(); continue; }

    const hello = await page.evaluate(() => window.__msgs.find((m) => m.kind === 'hello'));
    console.log('•', c.name);
    ok(hello.engine === '1.2.0', 'hello reports engine 1.2.0');
    ok(hello.lesson.contentMode === 'syllabus', 'contentMode defaults to syllabus');
    ok(await frame.locator('.kz-sig .kz-mark').count() === 1, 'brand signature on the start screen');
    const ids = hello.lesson.items.map((i) => i.id);
    if (c.legacy) {
      ok(ids.includes('s1') && ids.includes('predict'), 'old slides fall back to s{n}, given ids are kept');
      ok(warnings.some((w) => w.includes('has no stable id')), 'the engine warns about missing ids');
    } else {
      ok(!hello.lesson.items.some((i) => i.gated && /^s\d+$/.test(i.id)), 'every interactive slide has a stable id');
    }

    // Play to the end, assess every objective, write the reflection.
    await frame.locator('.modebtn.primary').first().click();
    const last = hello.lesson.items.length - 1;
    await frame.evaluate((n) => window.IL.go(n, true), last);
    await frame.waitForSelector('.refl');
    const rows = await frame.locator('.selfrow').count();
    ok(!c.objectives || rows === c.objectives, `a self-assessment row per objective (${rows})`);
    for (let r = 0; r < rows; r++) await frame.locator('.selfrow').nth(r).locator('.emo').nth(2).click();
    await frame.fill('.refl', 'چگالی یعنی جرم در هر حجم.');
    await frame.locator('.refl').evaluate((t) => t.dispatchEvent(new Event('change')));
    await page.waitForTimeout(700);

    const msgs = await page.evaluate(() => window.__msgs);
    const types = msgs.filter((m) => m.kind === 'event').map((m) => m.type);
    const complete = types.indexOf('lesson.complete'), firstSummary = types.indexOf('lesson.summary');
    ok(complete >= 0, 'lesson.complete is sent');
    ok(firstSummary > complete, 'lesson.summary follows it');
    ok(types.indexOf('self.assess') < types.lastIndexOf('lesson.summary'), 'the last summary comes after the self-assessment');
    const sum = msgs.filter((m) => m.kind === 'event' && m.type === 'lesson.summary').pop().data;
    ok(sum.final === true && sum.selfComplete === true, 'the final summary is marked final');
    ok(Object.keys(sum.self).length === rows && Object.values(sum.self).every((v) => v === 2), 'it holds the self-assessment');
    ok(sum.reflect === 'چگالی یعنی جرم در هر حجم.' && sum.reflectLength > 0, 'it holds the reflection');
    ok(sum.contentMode === 'syllabus' && typeof sum.stars === 'number', 'it holds the score and contentMode');
    ok(msgs.some((m) => m.kind === 'summary' && m.summary.final), 'a summary message is posted too');
    ok(msgs.filter((m) => m.kind === 'event').every((m) => m.lesson.engine === '1.2.0'), 'events name the engine');
    ok(errors.length === 0, 'no errors: ' + errors.join(' | '));
    if (shots) await page.screenshot({ path: path.join(shots, `engine-${c.name.split(' ')[0]}-390-end.png`) });
    await page.close();
  }
}
await browser.close();
if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
