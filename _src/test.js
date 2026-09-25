// آزمون موتور ۱٫۲ بدون هیچ وابستگی: node _src/test.js
// (آزمون مرورگر: node _src/e2e.mjs، اگر Playwright نصب باشد)
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const meta = require('./meta');

const ROOT = path.join(__dirname, '..');
const S = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
let failed = 0;
function test(name, fn) {
  try { fn(); console.log('✓', name); } catch (e) { failed++; console.log('✗', name, '\n   ', e.message); }
}
const lesson = (extra = '', slides = "{ id: 'q1', type: 'mcq', q: 'پرسش', options: [{ t: 'الف', ok: true }] }") =>
  `var LESSON = { id: 'demo-lesson', title: 'درس نمونه', objectives: ['هدف'], ${extra} slides: [ ${slides}, { type: 'end' } ] };`;

const LESSONS = { '01-workshop.html': 'workshop.js', '02-lesson-fractions.html': 'lesson-fractions.js', '03-lesson-density.html': 'lesson-density.js', '05-template.html': 'template.js' };

test('every published lesson has a valid kz-meta', () => {
  for (const src of Object.values(LESSONS)) {
    const m = meta.build(S(src), '1.2.0');
    assert.strictEqual(m.kz, 1);
    assert.strictEqual(m.engine, '1.2.0');
    assert.ok(/^[a-z0-9-]+$/.test(m.id), src);
    assert.ok(['syllabus', 'textbook-licensed'].includes(m.contentMode), src);
    assert.ok(m.items.length > 0 && m.objectives.length > 0, src);
    const ids = m.items.map((i) => i.id);
    assert.strictEqual(new Set(ids).size, ids.length, src + ': ids are unique');
    m.items.filter((i) => i.gated).forEach((i) => assert.ok(!/^s\d+$/.test(i.id), `${src}: ${i.id} is a stable id`));
    assert.strictEqual(m.maxStars, m.items.filter((i) => i.scored).length * 3);
    assert.ok(m.title && !/[<>]/.test(m.title), 'titles are plain text');
  }
});

test('built files carry the same kz-meta as their source (build is up to date)', () => {
  const engine = S('engine.js').match(/var ENGINE_VERSION = '([^']+)'/)[1];
  assert.strictEqual(engine, '1.2.0');
  for (const [file, src] of Object.entries(LESSONS)) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.deepStrictEqual(meta.read(html), meta.build(S(src), engine), file + ': run node _src/build.js');
    assert.ok(html.indexOf('id="kz-meta"') < html.indexOf('<style>'), file + ': kz-meta sits in <head>');
    assert.ok(html.includes("var ENGINE_VERSION = '1.2.0'"), file);
  }
  assert.strictEqual(meta.read(fs.readFileSync(path.join(ROOT, '04-prompt-kit.html'), 'utf8')), null, 'the prompt kit is not a lesson');
});

test('the reference lessons keep their ids (published data stays comparable)', () => {
  const d = meta.build(S('lesson-density.js'), '1.2.0');
  assert.deepStrictEqual(d.items.filter((i) => i.scored).map((i) => i.id), ['drop-lab', 'density-lab', 'stone-density', 'same-mass', 'half-wood', 'cotton-iron', 'true-false', 'clay-boat', 'crown-density', 'crown-verdict']);
  const f = meta.build(S('lesson-fractions.js'), '1.2.0');
  assert.ok(f.items.some((i) => i.id === 'equal-parts' && i.type === 'mcq'));
  assert.deepStrictEqual(d.concepts, ['چگالی', 'جرم', 'حجم', 'شناوری']);
  assert.strictEqual(d.durationMinutes, 40);
  assert.ok(d.misconceptions.every((m) => m.tag && m.title));
});

test('an interactive slide without an id stops the build', () => {
  assert.throws(() => meta.build(lesson('', "{ type: 'mcq', q: 'بی‌شناسه', options: [{ t: 'الف', ok: true }] }"), '1.2.0'), /needs a stable id/);
});

test('a duplicate or malformed id stops the build', () => {
  assert.throws(() => meta.build(lesson('', "{ id: 'a', type: 'poll', q: '1', options: [] }, { id: 'a', type: 'poll', q: '2', options: [] }"), '1.2.0'), /duplicate id/);
  assert.throws(() => meta.build(lesson('', "{ id: 'Bad Id', type: 'poll', q: '1', options: [] }"), '1.2.0'), /short English id/);
  assert.throws(() => meta.build("var LESSON = { id: 'نام فارسی', title: 't', slides: [] };", '1.2.0'), /LESSON.id/);
});

test('contentMode: syllabus by default, textbook-licensed only with a license number', () => {
  assert.strictEqual(meta.build(lesson(), '1.2.0').contentMode, 'syllabus');
  assert.throws(() => meta.build(lesson("contentMode: 'copy',"), '1.2.0'), /contentMode/);
  assert.throws(() => meta.build(lesson("contentMode: 'textbook-licensed',"), '1.2.0'), /licenseNumber/);
  const ok = meta.build(lesson("contentMode: 'textbook-licensed', licenseNumber: '1405-12',"), '1.2.0');
  assert.strictEqual(ok.contentMode, 'textbook-licensed');
  assert.strictEqual(ok.licenseNumber, '1405-12');
});

test('kz-meta can never close its <script> early', () => {
  const m = meta.build(lesson().replace("title: 'درس نمونه'", "title: '&lt;/script&gt;&lt;script&gt;alert(1)'"), '1.2.0');
  assert.ok(m.title.includes('</script>'), 'the title really holds a closing tag');
  const block = meta.block(m);
  assert.ok(!/<\/script>.*<\/script>/.test(block.replace(/<\/script>$/, 'END')));
  assert.strictEqual((block.match(/<\/script>/g) || []).length, 1);
  assert.deepStrictEqual(meta.read('<head>' + block + '</head>'), m);
});

test('a lesson written for engine 1.1 still loads (ids fall back to s{n})', () => {
  const L = meta.load(S('test/legacy-density-1.1.js'));
  assert.ok(L.slides.filter((s) => !s.id).length > 5, 'the fixture really is the old lesson');
  assert.throws(() => meta.build(S('test/legacy-density-1.1.js'), '1.2.0'), /needs a stable id/, 'but it cannot be published without ids');
});

test('the prompt kit carries the live-lab checklist and the 1.2 rules', () => {
  const tk = S('toolkit.js');
  ['کنجکاوی', 'پیش‌بینی', 'تعامل', 'بازخورد', 'تلاش دوباره', 'کاربرد تازه', 'تأمل و ادامه'].forEach((w) => assert.ok(tk.includes(w), w));
  assert.ok(tk.includes('آزمایشگاه زنده'));
  assert.ok(tk.includes("contentMode: \\'syllabus\\'"));
  assert.ok(tk.includes('id انگلیسی کوتاه، یکتا و پایدار'));
});

test('the engine uses the brand colours and signature', () => {
  const css = S('engine.css');
  assert.ok(css.includes('--p:#1f5fd6') && css.includes('--p-ink:#0e2c52'));
  const js = S('engine.js');
  assert.ok(js.includes('kz-mark') && js.includes('پای‌آموز'));
  assert.ok(js.includes("emit('lesson.summary'"));
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
