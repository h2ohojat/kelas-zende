// نشانه‌های ضروری صحنه شکل برداری‌اند، نه ایموجیِ وابسته به قلم سیستم (Issue #7): node --test _src/scene-marks.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* DOM ساختگیِ کوچک؛ فقط آنچه LabKit.svg و صحنهٔ ربات به کار می‌برند. */
class Node {
  constructor(tag) { this.tagName = tag; this.attrs = {}; this.children = []; this.parentNode = null; this.style = {}; this._text = ''; this.listeners = {};
    const self = this;
    this.classList = {
      set() { return new Set((self.attrs.class || '').split(/\s+/).filter(Boolean)); },
      write(s) { self.attrs.class = [...s].join(' '); },
      add(...c) { const s = this.set(); c.forEach((x) => s.add(x)); this.write(s); },
      remove(...c) { const s = this.set(); c.forEach((x) => s.delete(x)); this.write(s); },
      toggle(c, on) { const s = this.set(); if (on === undefined ? !s.has(c) : on) s.add(c); else s.delete(c); this.write(s); },
      contains(c) { return this.set().has(c); }
    };
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(t, f) { this.listeners[t] = f; }
  appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; }
  insertBefore(c, ref) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  get firstChild() { return this.children[0] || null; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this.children = []; this._text = String(v); }
  getElementsByTagName(tag) { const out = []; const walk = (n) => n.children.forEach((c) => { if (c.tagName === tag) out.push(c); walk(c); }); walk(this); return out; }
}
const document = {createElementNS: (ns, tag) => new Node(tag), createElement: (tag) => new Node(tag)};
const SRC = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const ROBOT = path.join(__dirname, '..', 'content', 'lab-robot-blocks');
const cx = vm.createContext({document, window: {}, navigator: {}, console, setTimeout() {}, clearTimeout() {}});
cx.window = cx;
for (const code of [SRC('lab-kit.js'), SRC('block-kit.js'), ...['model.js', 'levels.js', 'lesson.js'].map((f) => fs.readFileSync(path.join(ROBOT, f), 'utf8'))]) vm.runInContext(code, cx);
const {BlockKit, LabKit, RLAB, ROBOT_LEVELS} = cx;

const VECTOR = new Set(['polygon', 'rect', 'path', 'circle', 'ellipse', 'line', 'polyline']);
const all = (g) => g.children.flatMap(function walk(n) { return [n, ...n.children.flatMap(walk)]; });
const marks = (root, kind) => all(root).filter((n) => n.tagName === 'g' && n.getAttribute('data-mark') === kind);

test('BlockKit.mark فقط شکل برداری می‌سازد، با نام دسترس‌پذیر و بدون متن', () => {
  for (const kind of ['star', 'wall', 'goal']) {
    const g = BlockKit.mark(kind, 150, 250, 72);
    assert.equal(g.getAttribute('data-mark'), kind);
    assert.equal(g.getAttribute('role'), 'img');
    assert.ok(g.getAttribute('aria-label'), kind + ' بدون نام');
    assert.ok(g.classList.contains('bk-mark') && g.classList.contains('bk-mark-' + kind));
    assert.equal(g.getAttribute('transform'), null, 'گروه بیرونی برای CSS درس آزاد است');
    assert.equal(g.children[0].getAttribute('transform'), 'translate(150 250)');
    const nodes = all(g);
    assert.ok(nodes.some((n) => VECTOR.has(n.tagName)), kind + ' شکل ندارد');
    assert.ok(!nodes.some((n) => n.tagName === 'text' || n.tagName === 'image' || n.tagName === 'use'), kind + ' به متن یا تصویر وابسته است');
    for (const n of nodes) for (const [k, v] of Object.entries(n.attrs)) assert.ok(!/NaN|undefined|url\(/.test(v), kind + ' ' + k + '=' + v);
  }
  assert.equal(BlockKit.mark('star', 0, 0, 10, 'ستارهٔ طلایی').getAttribute('aria-label'), 'ستارهٔ طلایی');
  assert.throws(() => BlockKit.mark('heart', 0, 0, 10));
});

test('آشکارساز، وابستگی صرف به <text> ایموجی را پیدا می‌کند (الگوی پیش از Issue #7)', () => {
  const svg = new Node('svg');
  svg.appendChild(LabKit.svg('text', {text: '⭐'}));
  svg.appendChild(LabKit.svg('text', {text: '🧱'}));
  svg.appendChild(LabKit.svg('text', {text: 'مرحلهٔ ۱'}));
  assert.equal(BlockKit.emojiText(svg).length, 2);
});

function sceneFor(lv) {
  const svg = new Node('svg');
  const lab = {svgRoot: () => svg};
  const scene = RLAB.def.scene(lab);
  scene.level(lv);
  scene.home();
  return {svg, scene};
}

test('صحنهٔ هر ۲۰ مرحلهٔ نمونهٔ ربات ستاره و دیوار را برداری می‌کشد و هیچ ایموجیِ متنی ندارد', () => {
  assert.equal(ROBOT_LEVELS.length, 20);
  let walls = 0, stars = 0;
  for (const lv of ROBOT_LEVELS) {
    const {svg} = sceneFor(lv);
    assert.deepEqual(Array.from(BlockKit.emojiText(svg), (t) => t.textContent), [], lv.id + ': ایموجی متنی در صحنه');
    assert.equal(marks(svg, 'star').length, lv.stars.length, lv.id + ': تعداد ستاره');
    assert.equal(marks(svg, 'wall').length, lv.walls.length, lv.id + ': تعداد دیوار');
    for (const g of [...marks(svg, 'star'), ...marks(svg, 'wall')]) assert.ok(all(g).some((n) => VECTOR.has(n.tagName)), lv.id);
    stars += lv.stars.length; walls += lv.walls.length;
  }
  assert.ok(stars > 0 && walls > 0, 'نمونهٔ مرجع باید هم ستاره و هم دیوار داشته باشد');
});

test('ستاره و دیوار سر جای همان خانهٔ مدل‌اند و جمع‌شدن ستاره دیده می‌شود', () => {
  const lv = ROBOT_LEVELS.find((l) => l.id === 'around-wall');
  const {svg, scene} = sceneFor(lv);
  const at = (g) => g.children[0].getAttribute('transform');
  assert.deepEqual(marks(svg, 'wall').map(at), Array.from(lv.walls, ([x, y]) => 'translate(' + (10 + x * 100 + 50) + ' ' + (10 + y * 100 + 50) + ')'));
  assert.deepEqual(marks(svg, 'star').map(at), Array.from(lv.stars, ([x, y]) => 'translate(' + (10 + x * 100 + 50) + ' ' + (10 + y * 100 + 50) + ')'));
  const star = marks(svg, 'star')[0];
  assert.ok(star.classList.contains('rb-star') && !star.classList.contains('got'));
  for (const op of ['move', 'left', 'move', 'right', 'move', 'move', 'right', 'move', 'left', 'move']) scene.step(op, 0);
  assert.ok(star.classList.contains('got'), 'ستارهٔ جمع‌شده کلاس got می‌گیرد');
  assert.equal(scene.finish().ok, true);
  scene.home();
  assert.ok(!star.classList.contains('got'), 'شروع دوباره ستاره را برمی‌گرداند');
  const bump = sceneFor(lv);
  assert.equal(bump.scene.step('move', 0), true);
  assert.equal(bump.scene.step('move', 0), false, 'دیوار برداری همان خانهٔ برخورد مدل است');
});
