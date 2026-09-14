/* ============================================================
   موتور طرح درس تعاملی تک‌فایلی — نسخه ۱
   این بخش را لازم نیست تغییر دهید. محتوای درس در شیء LESSON (بالای فایل) است.
   ============================================================ */
(function () {
'use strict';
var L = window.LESSON;
if (!L) { document.body.innerHTML = '<p style="padding:2em">محتوای درس (LESSON) پیدا نشد.</p>'; return; }

/* ---------- ابزارهای کوچک ---------- */
var FA = '۰۱۲۳۴۵۶۷۸۹';
function fa(s) { return String(s).replace(/(\d)\.(\d)/g, '$1٫$2').replace(/\d/g, function (d) { return FA[d]; }); }
function en(s) {
  return String(s == null ? '' : s)
    .replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 1776; })
    .replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; })
    .replace(/[٫,]/g, '.').trim();
}
function norm(s) {
  return en(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‏\s]+/g, ' ').replace(/[.!؟?،]/g, '').trim().toLowerCase();
}
function h(tag, props) {
  var el = document.createElement(tag);
  if (props) for (var k in props) {
    var v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
  return el;
}
function add(el, c) {
  if (c == null || c === false) return;
  if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
  el.appendChild(c.nodeType ? c : document.createTextNode(c));
}
function faNodes(root) {
  if (!root) return;
  var w = document.createTreeWalker(root, 4, {
    acceptNode: function (n) {
      var p = n.parentElement;
      if (!p || p.closest('.ltr,code,pre,textarea,script,style,[data-nofa]')) return 2;
      return /\d/.test(n.nodeValue) ? 1 : 2;
    }
  });
  var list = []; while (w.nextNode()) list.push(w.currentNode);
  list.forEach(function (n) { n.nodeValue = fa(n.nodeValue); });
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function tagsOf(t) { return t ? (Array.isArray(t) ? t : [t]) : []; }

/* ---------- تم ---------- */
var TH = L.theme || {};
var MAP = { p: '--p', pSoft: '--p-soft', pInk: '--p-ink', a: '--a', aSoft: '--a-soft', bg: '--bg' };
for (var tk in MAP) if (TH[tk]) document.documentElement.style.setProperty(MAP[tk], TH[tk]);
document.title = L.title + (L.subtitle ? ' — ' + L.subtitle : '');

/* ---------- وضعیت و ذخیره ---------- */
var KEY = 'ilesson:' + (L.id || L.title);
function fresh() {
  return { name: '', mode: 'student', idx: 0, max: 0, res: {}, badges: [], stars: 0, classStars: 0, streak: 0,
    tags: {}, self: {}, reflect: '', stDone: {}, started: false, best: 0, mute: false };
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
function store() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
var S = Object.assign(fresh(), load() || {});

var SL = L.slides;
var STG = L.stages || [];
var lastStage = STG[0] && STG[0].id;
SL.forEach(function (s, i) { s._i = i; if (!s.stage) s.stage = lastStage; lastStage = s.stage; });
function stage(id) { for (var i = 0; i < STG.length; i++) if (STG[i].id === id) return STG[i]; return null; }
var GATED = { mcq: 1, input: 1, sort: 1, order: 1, poll: 1, steps: 1, custom: 1 };
var SCORED = { mcq: 1, input: 1, sort: 1, order: 1, custom: 1 };
function gated(s) { return !!GATED[s.type] && s.gate !== false; }
function res(i) { return S.res[i] || (S.res[i] = { tries: 0, hints: 0, done: false, stars: 0 }); }
function isDone(i) { var s = SL[i]; return !gated(s) || !!(S.res[i] && S.res[i].done); }
var MAXSTARS = SL.reduce(function (t, s) { return t + (SCORED[s.type] && s.stars !== false && s.gate !== false ? 3 : 0); }, 0);
var CLASSGOAL = L.classGoal || Math.max(3, Math.round(MAXSTARS * 0.7));
if (S.idx >= SL.length) S.idx = 0;

var TYPE_LBL = { mcq: 'پرسش', input: 'پاسخ کوتاه', sort: 'دسته‌بندی', order: 'مرتب‌سازی', poll: 'نظرسنجی', steps: 'مثال حل‌شده', custom: 'فعالیت' };
var LET = ['الف', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح'];
var HINT_LBL = ['تلنگر', 'راهبرد', 'مثال مشابه', 'گام‌به‌گام'];
var PRAISE = ['درست است! 👏', 'دقیقاً همین است!', 'آفرین، درست فکر کردی.', 'عالی! استدلالت درست بود.'];
var DEF_NO = 'هنوز نه 🙂 یک بار دیگر با دقت نگاه کن.';

var BADGES = Object.assign({
  detective: { i: '🕵️', t: 'کارآگاه اشتباه', d: 'بعد از بازخورد، اشتباهت را خودت اصلاح کردی.' },
  persistent: { i: '💪', t: 'پشتکار', d: 'چند بار تلاش کردی و دست نکشیدی.' },
  streak: { i: '🔥', t: 'سه‌تایی', d: 'سه پاسخ پشت‌سرهم در اولین تلاش.' },
  hintwise: { i: '🪜', t: 'راهنماخوان', d: 'از راهنما کمک گرفتی و بار اول درست جواب دادی.' },
  independent: { i: '🦅', t: 'مستقل', d: 'یک مرحلهٔ کامل را بدون راهنما تمام کردی.' },
  reflector: { i: '🪞', t: 'خودارزیاب', d: 'یادگیری‌ات را صادقانه ارزیابی کردی.' },
  finisher: { i: '🏁', t: 'به مقصد رسیدی', d: 'درس را تا آخر پیش رفتی.' }
}, L.badges || {});

/* ---------- صدا ---------- */
var AC = null;
function actx() {
  if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(f, t, d, type, v) {
  var a = actx(); if (!a) return;
  var o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + t;
  o.type = type || 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v || 0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.05);
}
var SND = {
  ok: function () { tone(660, 0, 0.18); tone(990, 0.12, 0.3); },
  no: function () { tone(330, 0, 0.22, 'triangle', 0.07); tone(262, 0.14, 0.3, 'triangle', 0.06); },
  hint: function () { tone(880, 0, 0.15, 'sine', 0.06); },
  badge: function () { [523, 659, 784, 1047].forEach(function (f, k) { tone(f, k * 0.09, 0.3, 'sine', 0.1); }); },
  stage: function () { [392, 523, 659, 784, 1047].forEach(function (f, k) { tone(f, k * 0.08, 0.35, 'triangle', 0.09); }); },
  tick: function () { tone(1200, 0, 0.05, 'square', 0.02); },
  click: function () { tone(700, 0, 0.05, 'sine', 0.04); },
  bell: function () { tone(880, 0, 1.2, 'sine', 0.12); tone(1320, 0, 1, 'sine', 0.05); }
};
function sound(n) { if (S.mute) return; try { SND[n] && SND[n](); } catch (e) {} }

/* ---------- اسکلت صفحه ---------- */
var app = document.getElementById('app') || document.body.appendChild(h('div', { id: 'app' }));
var starPill = h('span', { class: 'pill', title: 'ستاره‌ها' });
var badgePill = h('button', { class: 'ib', title: 'نشان‌ها', onclick: showBadges });
var timeChip = h('button', { class: 'ib timechip hide', title: 'تایمر فعالیت', onclick: function () { if (TMR.slide != null) go(TMR.slide); } });
var btnMute = h('button', { class: 'ib', title: 'صدا', onclick: function () { S.mute = !S.mute; store(); hud(); } });
var btnFull = h('button', { class: 'ib fs', title: 'تمام‌صفحه (F)', text: '⛶', onclick: fullscreen });
var btnMode = h('button', { class: 'ib', onclick: function () { setMode(S.mode === 'present' ? 'student' : 'present'); } });
var btnThink = h('button', { class: 'ib', title: 'زمان فکر کردن (T)', text: '⏱', onclick: function () { think(L.thinkSeconds || 30); } });
var btnNotes = h('button', { class: 'ib', title: 'یادداشت ارائه‌دهنده (N)', text: '📝', onclick: function () { S.showNotes = !S.showNotes; store(); notes(); } });
var mapEl = h('nav', { class: 'map', 'aria-label': 'نقشهٔ مسیر' });
var top = h('header', { class: 'topbar' },
  h('div', { class: 'brand' }, h('span', { class: 'mascot', text: L.mascot || '📘' }), h('div', null, h('b', { text: L.title }), h('small', { text: L.subtitle || '' }))),
  mapEl,
  h('div', { class: 'tools' }, timeChip, starPill, badgePill, btnThink, btnNotes, btnMute, btnFull, btnMode));
var main = h('main', { class: 'stage' });
var btnPrev = h('button', { class: 'btn ghost', onclick: function () { go(S.idx - 1); } }, '→ قبلی');
var btnNext = h('button', { class: 'btn next', onclick: function () { go(S.idx + 1); } }, 'بعدی ←');
var progI = h('i');
var cntEl = h('div', { class: 'cnt' });
var btnAns = h('button', { class: 'ib', title: 'نمایش پاسخ', text: '✓ پاسخ', onclick: function () { if (CUR && CUR.reveal) CUR.reveal(); } });
var btnReset = h('button', { class: 'ib', title: 'از نو (برای کلاس بعد)', text: '↺', onclick: function () { resetSlide(S.idx); } });
var ptools = h('div', { class: 'ptools' }, btnAns, btnReset);
var nav = h('footer', { class: 'navbar' }, btnPrev, h('div', { class: 'mid' }, h('div', { class: 'prog' }, progI), cntEl), ptools, btnNext);
var notesEl = h('div', { class: 'notes hide' });
var toasts = h('div', { class: 'toasts', 'aria-live': 'polite' });
var cv = h('canvas', { class: 'confetti' });
add(app, [top, main, nav, notesEl, toasts, cv]);

/* ---------- اعلان، ستاره، کاغذ رنگی ---------- */
function toast(html, kind) {
  var t = h('div', { class: 'toast ' + (kind || ''), html: html }); faNodes(t); toasts.appendChild(t);
  var d = kind === 'badge' ? 3800 : 2500;
  setTimeout(function () { t.classList.add('out'); }, d); setTimeout(function () { t.remove(); }, d + 500);
}
function floatStars(n, anchor) {
  var r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
  var e = h('div', { class: 'floatstar', text: '+' + fa(n) + ' ⭐' });
  e.style.left = (r.left + r.width / 2 - 40) + 'px'; e.style.top = (r.top) + 'px';
  document.body.appendChild(e); setTimeout(function () { e.remove(); }, 1400);
  starPill.classList.remove('bump'); void starPill.offsetWidth; starPill.classList.add('bump');
}
var parts = [], raf = 0, cx = cv.getContext('2d');
function confetti(n) {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cv.width = innerWidth; cv.height = innerHeight;
  var cs = getComputedStyle(document.documentElement);
  var cols = [cs.getPropertyValue('--p'), cs.getPropertyValue('--a'), '#1bb07a', '#ef5da8', '#4cc9f0'];
  for (var i = 0; i < (n || 140); i++) parts.push({ x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4, y: innerHeight * 0.3,
    vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 4, s: 6 + Math.random() * 7, c: pick(cols).trim() || '#f2a31b', r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, l: 0 });
  if (!raf) loop();
}
function loop() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts.forEach(function (p) { p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.l++;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6); cx.restore(); });
  parts = parts.filter(function (p) { return p.y < cv.height + 40 && p.l < 400; });
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
}

/* ---------- نشان‌ها ---------- */
function award(id) {
  if (!BADGES[id] || S.badges.indexOf(id) >= 0) return;
  S.badges.push(id); store();
  var b = BADGES[id];
  setTimeout(function () { toast('<span class="bi">' + b.i + '</span><span><b>نشان تازه: ' + b.t + '</b><small>' + b.d + '</small></span>', 'badge'); sound('badge'); hud(); }, 900);
}
function showBadges() {
  if (!S.badges.length) { toast('هنوز نشانی نگرفته‌ای؛ نشان‌ها برای «روش یادگرفتن» است، نه فقط جواب درست 🙂'); return; }
  toast(S.badges.map(function (id) { return BADGES[id].i + ' ' + BADGES[id].t; }).join(' · '));
}

/* ---------- بازخورد، درست، هنوز نه ---------- */
function showFb(ctx, kind, html, stars) {
  var ic = { ok: '✅', no: '🤔', info: '💡' }[kind];
  var box = h('div', { class: 'fb ' + kind }, h('div', { class: 'ic', text: ic }), h('div', { class: 'tx', html: html }),
    stars ? h('div', { class: 'st', text: '+' + fa(stars) + ' ⭐' }) : null);
  ctx.fb.innerHTML = ''; ctx.fb.appendChild(box); faNodes(box);
  if (kind !== 'info' || ctx.keepInfo) ctx.r.fbk = [kind, html, stars || 0];
  if (box.scrollIntoView && box.getBoundingClientRect().bottom > innerHeight - 90) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return box;
}
function wrong(ctx, fb, tag) {
  var r = ctx.r, s = ctx.s;
  if (r.done) { showFb(ctx, 'no', fb || s.fb || DEF_NO); return; }
  r.tries++; S.streak = 0;
  tagsOf(tag).forEach(function (t) { S.tags[t] = (S.tags[t] || 0) + 1; });
  showFb(ctx, 'no', fb || s.fb || DEF_NO); sound('no');
  if (r.tries >= 2 && s.hints && r.hints < s.hints.length && ctx.hintAdd) {
    setTimeout(function () { ctx.hintAdd(true); toast('🪜 یک پلهٔ راهنما برایت باز شد'); }, 700);
  }
  store();
}
function right(ctx, fb) {
  var r = ctx.r, s = ctx.s;
  if (r.done) { showFb(ctx, 'ok', fb || s.praise || pick(PRAISE)); return; }
  r.done = true;
  var st = 3 - Math.min(2, r.tries);
  if (r.hints >= 2) st = Math.min(st, 2);
  if (r.hints >= 3) st = 1;
  if (s.stars === false) st = 0;
  r.stars = st; S.stars += st; if (S.mode === 'present') S.classStars += st;
  if (r.tries === 0 && r.hints === 0) { S.streak++; if (S.streak >= 3) award('streak'); } else S.streak = 0;
  if (r.tries >= 1) award('detective');
  if (r.tries >= 2) award('persistent');
  if (r.tries === 0 && r.hints > 0) award('hintwise');
  var msg = fb || s.praise || pick(PRAISE);
  if (r.tries > 0 && S.mode !== 'present') msg += '<div class="small muted" style="margin-top:4px">🕵️ از بازخورد استفاده کردی و اشتباهت را اصلاح کردی؛ یادگیری واقعی همین است.</div>';
  if (s.explain) msg += '<div class="explain">' + s.explain + '</div>';
  var box = showFb(ctx, 'ok', msg, st);
  sound('ok'); if (st) floatStars(st, box);
  store(); hud(); navState(); map(); checkStage(s.stage);
}
function markDone(ctx) {
  if (ctx.r.done) return;
  ctx.r.done = true; store(); navState(); map(); checkStage(ctx.s.stage);
}
function stageDone(id) { return SL.every(function (s) { return s.stage !== id || isDone(s._i); }); }
function checkStage(id) {
  if (!id || S.stDone[id] || !stageDone(id)) return;
  var qs = SL.filter(function (s) { return s.stage === id && gated(s); });
  if (!qs.length) return;
  S.stDone[id] = true; store();
  var hadHints = qs.some(function (s) { return s.hints && s.hints.length; });
  var used = qs.some(function (s) { return S.res[s._i] && S.res[s._i].hints; });
  if (hadHints && !used) award('independent');
  var st = stage(id);
  setTimeout(function () { confetti(); sound('stage'); if (st) toast(st.icon + ' مرحلهٔ «' + st.title + '» کامل شد!', 'big'); map(); }, 500);
}

/* ---------- نردبان راهنمایی ---------- */
function hintsUI(ctx) {
  var s = ctx.s, r = ctx.r;
  if (!s.hints || !s.hints.length) return null;
  var list = h('div');
  var btn = h('button', { class: 'btn ghost', type: 'button' });
  function lbl() {
    btn.textContent = r.hints >= s.hints.length ? '🪜 همهٔ پله‌های راهنما باز شد' : '🪜 راهنما (' + fa(r.hints) + ' از ' + fa(s.hints.length) + ')';
    btn.disabled = r.hints >= s.hints.length;
  }
  function draw(k) {
    var e = h('div', { class: 'hint' }, h('span', { class: 'hl', text: 'پلهٔ ' + fa(k + 1) + ' · ' + (s.hintLabels ? s.hintLabels[k] : HINT_LBL[k] || 'راهنما') }), h('span', { html: s.hints[k] }));
    faNodes(e); list.appendChild(e);
  }
  ctx.hintAdd = function () { if (r.hints >= s.hints.length) return; draw(r.hints); r.hints++; store(); lbl(); sound('hint'); };
  btn.onclick = function () { ctx.hintAdd(); };
  for (var k = 0; k < r.hints; k++) draw(k);
  lbl();
  return h('div', { class: 'hints' }, btn, list);
}

/* ---------- رندر اسلایدها ---------- */
var R = {};
var CUR = null;

function head(ctx, title, type) {
  var st = stage(ctx.s.stage);
  var k = h('div', { class: 'kicker' }, st ? h('span', { text: st.icon + ' ' + st.title }) : null,
    TYPE_LBL[type] ? h('span', { class: 'ty', text: TYPE_LBL[type] }) : null,
    ctx.s.label ? h('span', { class: 'ty', text: ctx.s.label }) : null);
  ctx.card.appendChild(k);
  if (title) ctx.card.appendChild(h(type === 'content' || type === 'end' ? 'h2' : 'h2', { class: type === 'content' ? '' : 'q', html: title }));
  if (ctx.s.html && type !== 'content' && type !== 'end') ctx.card.appendChild(h('div', { class: 'media', html: ctx.s.html }));
}
function tail(ctx) {
  var hu = hintsUI(ctx); if (hu) ctx.card.appendChild(hu);
  ctx.card.appendChild(ctx.fb);
  if (ctx.r.fbk) showFb(ctx, ctx.r.fbk[0], ctx.r.fbk[1], ctx.r.fbk[2]);
}

R.content = function (ctx) {
  var s = ctx.s;
  head(ctx, s.title, 'content');
  if (s.html) ctx.card.appendChild(h('div', { class: 'body', html: s.html }));
  if (s.timer) ctx.card.appendChild(timerWidget(ctx));
  ctx.card.addEventListener('click', function (e) {
    var f = e.target.closest('.flip'); if (f) { f.classList.toggle('on'); sound('click'); }
  });
  if (s.render) s.render(ctx.card, api(ctx));
};

R.mcq = function (ctx) {
  var s = ctx.s, r = ctx.r;
  head(ctx, s.q, 'mcq');
  r.picked = r.picked || [];
  var grid = h('div', { class: 'opts' + (s.cols ? ' cols' + s.cols : '') });
  var btns = [];
  s.options.forEach(function (o, k) {
    var b = h('button', { class: 'opt', type: 'button' }, h('span', { class: 'let', text: LET[k] }), h('span', { class: 'ot', html: o.t }));
    b.onclick = function () {
      if (r.done) { showFb(ctx, o.ok ? 'ok' : 'no', o.fb || (o.ok ? s.praise : '') || (o.ok ? 'این پاسخ درست است.' : DEF_NO)); return; }
      if (r.picked.indexOf(k) < 0) r.picked.push(k);
      if (o.ok) {
        b.classList.add('right');
        btns.forEach(function (x) { x.disabled = S.mode !== 'present'; });
        right(ctx, o.fb);
      } else {
        b.classList.add('wrong', 'shake'); b.disabled = S.mode !== 'present';
        wrong(ctx, o.fb, o.tag);
      }
    };
    if (r.picked.indexOf(k) >= 0) { b.classList.add(o.ok ? 'right' : 'wrong'); if (S.mode !== 'present') b.disabled = true; }
    if (r.done && S.mode !== 'present') b.disabled = true;
    btns.push(b); grid.appendChild(b);
  });
  ctx.card.appendChild(grid);
  ctx.reveal = function () {
    s.options.forEach(function (o, k) { if (o.ok) { btns[k].classList.add('right'); showFb(ctx, 'ok', '<b>پاسخ:</b> ' + o.t + (o.fb ? '<br>' + o.fb : '') + (s.explain ? '<div class="explain">' + s.explain + '</div>' : '')); } });
    markDone(ctx);
  };
  tail(ctx);
};

R.poll = function (ctx) {
  var s = ctx.s, r = ctx.r;
  head(ctx, s.q, 'poll');
  var grid = h('div', { class: 'opts' });
  if (S.mode === 'present') {
    r.counts = r.counts || s.options.map(function () { return 0; });
    var rows = [];
    var redraw = function () {
      var tot = r.counts.reduce(function (a, b) { return a + b; }, 0) || 1;
      rows.forEach(function (x, k) { x.bar.style.width = (100 * r.counts[k] / tot) + '%'; x.cnt.textContent = fa(r.counts[k]); });
    };
    s.options.forEach(function (o, k) {
      var bar = h('span', { class: 'barf' }), cnt = h('span', { class: 'cnt', text: '۰' });
      var minus = h('button', { class: 'minus', type: 'button', text: '−', title: 'کم کن' });
      var b = h('div', { class: 'opt pollopt', role: 'button', tabindex: '0' }, bar, h('span', { class: 'let', text: LET[k] }), h('span', { class: 'ot', html: o.t }), cnt, minus);
      b.onclick = function (e) {
        if (e.target === minus) { r.counts[k] = Math.max(0, r.counts[k] - 1); }
        else { r.counts[k]++; sound('tick'); if (o.fb) showFb(ctx, 'info', o.fb); }
        markDone(ctx); store(); redraw();
      };
      rows.push({ bar: bar, cnt: cnt }); grid.appendChild(b);
    });
    ctx.card.appendChild(h('p', { class: 'muted small', text: 'حالت ارائه: با هر کلیک روی گزینه یک رأی اضافه می‌شود (دست‌های بالا را بشمارید). «−» یک رأی کم می‌کند.' }));
    ctx.card.appendChild(grid); redraw();
  } else {
    s.options.forEach(function (o, k) {
      var b = h('button', { class: 'opt' + (r.choice === k ? ' chosen' : ''), type: 'button' }, h('span', { class: 'let', text: LET[k] }), h('span', { class: 'ot', html: o.t }));
      b.onclick = function () {
        r.choice = k; Array.prototype.forEach.call(grid.children, function (x) { x.classList.remove('chosen'); }); b.classList.add('chosen');
        ctx.keepInfo = true; showFb(ctx, 'info', (o.fb || '') + (s.after ? (o.fb ? '<br>' : '') + s.after : '') || 'ثبت شد ✔'); sound('click');
        markDone(ctx);
      };
      grid.appendChild(b);
    });
    ctx.card.appendChild(grid);
  }
  ctx.card.appendChild(ctx.fb);
  if (r.fbk && S.mode !== 'present') showFb(ctx, r.fbk[0], r.fbk[1]);
};

R.input = function (ctx) {
  var s = ctx.s, r = ctx.r, kind = s.kind || 'number';
  head(ctx, s.q, 'input');
  var row = h('div', { class: 'inrow' }), ins = [];
  if (kind === 'fraction') {
    var n = h('input', { class: 'tin', inputmode: 'numeric', 'aria-label': 'صورت', autocomplete: 'off' });
    var d = h('input', { class: 'tin', inputmode: 'numeric', 'aria-label': 'مخرج', autocomplete: 'off' });
    ins = [n, d];
    row.appendChild(h('span', { class: 'frac-in' }, n, h('span', { class: 'bar' }), d));
  } else {
    var t = h('input', { class: 'tin' + (kind === 'text' ? ' wide' : ''), inputmode: kind === 'number' ? 'decimal' : 'text', 'aria-label': 'پاسخ', autocomplete: 'off', placeholder: s.placeholder || '' });
    ins = [t]; row.appendChild(t);
  }
  if (s.unit) row.appendChild(h('span', { class: 'unit', html: s.unit }));
  var go_ = h('button', { class: 'btn', type: 'button', text: 'بررسی ✓' });
  row.appendChild(go_);
  if (r.last) ins.forEach(function (x, k) { x.value = r.last[k] || ''; });
  function check() {
    var vals = ins.map(function (x) { return x.value; });
    r.last = vals;
    var out = judge(s, kind, vals);
    if (out.empty) { showFb(ctx, 'info', out.msg || 'اول پاسخت را بنویس 🙂'); return; }
    if (out.ok) { right(ctx, out.fb); ins.forEach(function (x) { x.disabled = S.mode !== 'present'; }); }
    else { wrong(ctx, out.fb, out.tag); ins[0].classList.add('shake'); setTimeout(function () { ins[0].classList.remove('shake'); }, 400); }
  }
  go_.onclick = check;
  ins.forEach(function (x, k) {
    x.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (k < ins.length - 1) ins[k + 1].focus(); else check(); }
    });
  });
  if (r.done && S.mode !== 'present') ins.forEach(function (x) { x.disabled = true; });
  ctx.card.appendChild(row);
  ctx.reveal = function () {
    var a = s.answerText || (kind === 'fraction' ? '<span class="fr"><b>' + s.answer[0] + '</b><i>' + s.answer[1] + '</i></span>' : String(s.answer));
    showFb(ctx, 'ok', '<b>پاسخ:</b> ' + a + (s.explain ? '<div class="explain">' + s.explain + '</div>' : ''));
    markDone(ctx);
  };
  tail(ctx);
};
function judge(s, kind, vals) {
  var rules = s.wrong || [], i, w;
  if (kind === 'fraction') {
    if (vals[0] === '' || vals[1] === '') return { empty: true, msg: 'هر دو خانه (صورت و مخرج) را پر کن.' };
    var n = parseInt(en(vals[0]), 10), d = parseInt(en(vals[1]), 10);
    if (isNaN(n) || isNaN(d)) return { empty: true, msg: 'فقط عدد بنویس.' };
    if (d === 0) return { ok: false, fb: 'مخرج نمی‌تواند صفر باشد؛ یعنی کیک به صفر تکه تقسیم شده!' };
    var A = s.answer;
    if (n === A[0] && d === A[1]) return { ok: true, fb: s.praise };
    if (s.equivalent !== false && n * A[1] === A[0] * d) return { ok: true, fb: (s.eqPraise || 'درست است! این کسر با پاسخ ما مساوی است 👌') };
    for (i = 0; i < rules.length; i++) {
      w = rules[i];
      if ((w.is && w.is[0] === n && w.is[1] === d) || (w.test && w.test(n, d))) return { ok: false, fb: w.fb, tag: w.tag };
    }
    return { ok: false, fb: s.fb };
  }
  if (kind === 'number') {
    var raw = en(vals[0]).replace(/\s/g, '').replace(/\//g, '.');
    if (raw === '') return { empty: true };
    var v = parseFloat(raw);
    if (isNaN(v)) return { empty: true, msg: 'پاسخ را به‌صورت عدد بنویس.' };
    var tol = s.tol == null ? 1e-9 : s.tol;
    var ans = Array.isArray(s.answer) ? s.answer : [s.answer];
    if (ans.some(function (a) { return Math.abs(v - a) <= tol; })) return { ok: true, fb: s.praise };
    for (i = 0; i < rules.length; i++) {
      w = rules[i];
      var wt = w.tol == null ? Math.max(tol, 1e-9) : w.tol;
      if ((w.is != null && Math.abs(v - w.is) <= wt) || (w.test && w.test(v))) return { ok: false, fb: w.fb, tag: w.tag };
    }
    return { ok: false, fb: s.fb };
  }
  var t = norm(vals[0]);
  if (!t) return { empty: true };
  var ok = (Array.isArray(s.answer) ? s.answer : [s.answer]).some(function (a) { return norm(a) === t; });
  if (ok) return { ok: true, fb: s.praise };
  for (i = 0; i < rules.length; i++) {
    w = rules[i];
    if ((w.is != null && norm(w.is) === t) || (w.test && w.test(t))) return { ok: false, fb: w.fb, tag: w.tag };
  }
  return { ok: false, fb: s.fb };
}

R.sort = function (ctx) {
  var s = ctx.s, r = ctx.r;
  head(ctx, s.q, 'sort');
  r.place = r.place || {}; r.lock = r.lock || {};
  var sel = null;
  var pool = h('div', { class: 'pool' });
  var bins = h('div', { class: 'bins' });
  var binEls = {};
  ctx.card.appendChild(h('p', { class: 'muted small', text: s.help || '👆 روی هر کارت بزن، بعد روی ستونی که به آن تعلق دارد بزن.' }));
  s.bins.forEach(function (b) {
    var list = h('div', { class: 'bl' });
    var el = h('div', { class: 'bin', role: 'button', tabindex: '0' }, h('span', { class: 'bt', html: b.t }), list);
    el.onclick = function (e) {
      if (e.target.closest('.item')) return;
      if (sel == null) return;
      r.place[sel] = b.id; sel = null; sound('click'); draw();
    };
    binEls[b.id] = { el: el, list: list }; bins.appendChild(el);
  });
  var chk = h('button', { class: 'btn', type: 'button', text: 'بررسی ✓' });
  function draw() {
    pool.innerHTML = ''; for (var id in binEls) binEls[id].list.innerHTML = '';
    s.items.forEach(function (it, k) {
      var c = h('button', { class: 'item' + (sel === k ? ' sel' : '') + (r.lock[k] ? ' ok' : ''), type: 'button', html: it.t });
      c.onclick = function () {
        if (r.lock[k]) return;
        if (r.place[k] != null) { delete r.place[k]; sel = k; }
        else sel = (sel === k ? null : k);
        sound('click'); draw();
      };
      if (r.place[k] != null && binEls[r.place[k]]) binEls[r.place[k]].list.appendChild(c); else pool.appendChild(c);
    });
    for (var b in binEls) binEls[b].el.classList.toggle('armed', sel != null);
    var all = s.items.every(function (_, k) { return r.place[k] != null; });
    chk.disabled = !all || (r.done && S.mode !== 'present');
    faNodes(pool); faNodes(bins);
  }
  chk.onclick = function () {
    var bad = [], tags = [];
    s.items.forEach(function (it, k) {
      if (r.place[k] === it.bin) r.lock[k] = true;
      else { bad.push(it); if (it.tag) tags.push(it.tag); delete r.place[k]; }
    });
    draw();
    if (!bad.length) { right(ctx, s.praise); return; }
    var fb = '<b>' + fa(bad.length) + ' کارت هنوز جای درستش نیست</b> (به ستون‌ها برگشتند):<ul>' +
      bad.map(function (it) { return '<li><b>' + it.t + '</b>' + (it.fb ? ' — ' + it.fb : '') + '</li>'; }).join('') + '</ul>';
    wrong(ctx, fb, tags);
  };
  ctx.card.appendChild(pool); ctx.card.appendChild(bins);
  ctx.card.appendChild(h('div', { class: 'row' }, chk));
  ctx.reveal = function () {
    s.items.forEach(function (it, k) { r.place[k] = it.bin; r.lock[k] = true; }); draw();
    showFb(ctx, 'ok', 'همهٔ کارت‌ها در جای درست قرار گرفتند.' + (s.explain ? '<div class="explain">' + s.explain + '</div>' : ''));
    markDone(ctx);
  };
  draw();
  tail(ctx);
};

R.order = function (ctx) {
  var s = ctx.s, r = ctx.r, n = s.items.length;
  head(ctx, s.q, 'order');
  if (!r.ord) {
    var o; do { o = shuffle(s.items.map(function (_, k) { return k; })); } while (n > 1 && o.every(function (v, k) { return v === k; }));
    r.ord = o;
  }
  var ul = h('ul', { class: 'olist' });
  var marks = null;
  function draw() {
    ul.innerHTML = '';
    r.ord.forEach(function (it, pos) {
      var up = h('button', { class: 'mv', type: 'button', text: '▲', 'aria-label': 'بالا' });
      var dn = h('button', { class: 'mv', type: 'button', text: '▼', 'aria-label': 'پایین' });
      up.disabled = pos === 0; dn.disabled = pos === n - 1;
      up.onclick = function () { swap(pos, pos - 1); }; dn.onclick = function () { swap(pos, pos + 1); };
      var li = h('li', { class: marks ? (marks[pos] ? 'ok' : 'bad') : '' }, h('span', { class: 'n', text: fa(pos + 1) }), h('span', { class: 't', html: s.items[it].t || s.items[it] }), up, dn);
      ul.appendChild(li);
    });
    faNodes(ul);
  }
  function swap(a, b) { if (r.done && S.mode !== 'present') return; var t = r.ord[a]; r.ord[a] = r.ord[b]; r.ord[b] = t; marks = null; sound('click'); store(); draw(); }
  var chk = h('button', { class: 'btn', type: 'button', text: 'بررسی ✓' });
  chk.onclick = function () {
    marks = r.ord.map(function (v, k) { return v === k; });
    draw();
    var good = marks.filter(Boolean).length;
    if (good === n) { right(ctx, s.praise); return; }
    var firstBad = r.ord.filter(function (v, k) { return v !== k; })[0];
    var it = s.items[firstBad];
    wrong(ctx, fa(good) + ' مورد از ' + fa(n) + ' در جای درست است (سبزها).' + (it && it.fb ? '<br>' + it.fb : (s.fb ? '<br>' + s.fb : '')), it && it.tag);
  };
  if (s.labels) ctx.card.appendChild(h('p', { class: 'muted small', html: '⬆️ ' + s.labels[0] + ' &nbsp; … &nbsp; ⬇️ ' + s.labels[1] }));
  ctx.card.appendChild(ul); ctx.card.appendChild(h('div', { class: 'row' }, chk));
  ctx.reveal = function () { r.ord = s.items.map(function (_, k) { return k; }); marks = r.ord.map(function () { return true; }); draw(); showFb(ctx, 'ok', 'ترتیب درست نمایش داده شد.' + (s.explain ? '<div class="explain">' + s.explain + '</div>' : '')); markDone(ctx); };
  if (r.done) marks = r.ord.map(function (v, k) { return v === k; });
  draw();
  tail(ctx);
};

R.steps = function (ctx) {
  var s = ctx.s, r = ctx.r;
  head(ctx, s.q || s.title, 'steps');
  if (s.intro) ctx.card.appendChild(h('div', { html: s.intro }));
  r.shown = r.shown || 0; r.thought = r.thought || 0;
  var box = h('div', { class: 'steps' });
  var ctrl = h('div', { class: 'row' });
  function draw() {
    box.innerHTML = ''; ctrl.innerHTML = '';
    for (var k = 0; k < r.shown; k++) box.appendChild(h('div', { class: 'step' }, h('span', { class: 'sn', text: fa(k + 1) }), h('div', { html: s.steps[k].html || s.steps[k] })));
    if (r.shown < s.steps.length) {
      var nx = s.steps[r.shown];
      if (nx.think && r.thought <= r.shown) {
        box.appendChild(h('div', { class: 'think', html: '🤔 <b>قبل از دیدن، فکر کن:</b> ' + nx.think }));
        ctrl.appendChild(h('button', { class: 'btn acc', type: 'button', text: 'فکر کردم؛ نشانم بده 👀', onclick: function () { r.thought = r.shown + 1; r.shown++; store(); sound('click'); draw(); fin(); } }));
      } else {
        ctrl.appendChild(h('button', { class: 'btn', type: 'button', text: r.shown ? 'گام بعدی ←' : 'شروع گام‌به‌گام ←', onclick: function () { r.shown++; r.thought = Math.max(r.thought, r.shown); store(); sound('click'); draw(); fin(); } }));
      }
    } else if (s.outro) box.appendChild(h('div', { class: 'callout ok', html: s.outro }));
    faNodes(box);
    var last = box.lastElementChild; if (last && last.scrollIntoView && last.getBoundingClientRect().bottom > innerHeight - 90) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function fin() { if (r.shown >= s.steps.length) markDone(ctx); }
  ctx.card.appendChild(box); ctx.card.appendChild(ctrl);
  ctx.reveal = function () { r.shown = s.steps.length; r.thought = r.shown; draw(); markDone(ctx); };
  draw();
  ctx.card.appendChild(ctx.fb);
};

R.custom = function (ctx) {
  var s = ctx.s;
  head(ctx, s.q || s.title, 'custom');
  var body = h('div', { class: 'custom' });
  ctx.card.appendChild(body);
  var a = api(ctx);
  try { s.render(body, a); } catch (e) { body.appendChild(h('div', { class: 'callout warn', text: 'خطا در این فعالیت: ' + e.message })); console.error(e); }
  if (s.reveal || s.answerText) ctx.reveal = function () { if (s.reveal) s.reveal(a); else showFb(ctx, 'ok', s.answerText); markDone(ctx); };
  tail(ctx);
};
function api(ctx) {
  var r = ctx.r;
  return {
    el: ctx.card, state: r.state || (r.state = {}), save: store, mode: S.mode, lesson: L,
    isDone: function () { return !!r.done; },
    right: function (fb) { right(ctx, fb); }, wrong: function (fb, tag) { wrong(ctx, fb, tag); },
    info: function (html) { showFb(ctx, 'info', html); }, done: function () { markDone(ctx); },
    tag: function (t) { tagsOf(t).forEach(function (x) { S.tags[x] = (S.tags[x] || 0) + 1; }); store(); },
    fa: fa, en: en, h: h, faNodes: faNodes, sound: sound, confetti: confetti, toast: toast,
    get: function (id) { for (var i = 0; i < SL.length; i++) if (SL[i].id === id) return S.res[i] || null; return null; },
    name: S.name
  };
}

/* ---------- صفحهٔ پایان ---------- */
R.end = function (ctx) {
  var s = ctx.s;
  award('finisher');
  var nm = S.name ? S.name + '، ' : '';
  head(ctx, s.title || ('🎉 ' + nm + 'به مقصد رسیدی!'), 'end');
  var pct = MAXSTARS ? Math.round(100 * S.stars / MAXSTARS) : 0;
  var best = Math.max(S.best || 0, S.stars);
  var sum = h('div', { class: 'sumgrid' },
    h('div', { class: 'sumbox' }, h('div', { class: 'v', text: fa(S.stars) + ' ⭐' }), h('div', { class: 'small', text: 'از ' + fa(MAXSTARS) + ' ستاره' })),
    h('div', { class: 'sumbox' }, h('div', { class: 'v', text: fa(S.badges.length) + ' 🏅' }), h('div', { class: 'small', text: 'نشان یادگیری' })),
    h('div', { class: 'sumbox' }, h('div', { class: 'v', text: fa(best) + ' 🏆' }), h('div', { class: 'small', text: 'رکورد خودت' })));
  if (S.mode === 'present') sum.appendChild(h('div', { class: 'sumbox' }, h('div', { class: 'v', text: fa(S.classStars) + ' / ' + fa(CLASSGOAL) }), h('div', { class: 'small', text: S.classStars >= CLASSGOAL ? 'هدف کلاس محقق شد! 🎉' : 'ستاره‌های کلاس' })));
  ctx.card.appendChild(sum);
  ctx.card.appendChild(h('p', { class: 'center muted', text: pct >= 85 ? 'فوق‌العاده! بیشتر پاسخ‌ها را در همان تلاش‌های اول پیدا کردی.' : pct >= 60 ? 'خیلی خوب! هر جا اشتباه کردی، از بازخورد استفاده کردی و جلو رفتی.' : 'آفرین که تا آخر آمدی! ستاره‌ها مهم نیستند؛ مهم این است که حالا چیزهایی را می‌دانی که اول درس نمی‌دانستی.' }));

  ctx.card.appendChild(h('h3', { text: '🏅 نشان‌های یادگیری' }));
  var bg = h('div', { class: 'badgegrid' });
  Object.keys(BADGES).forEach(function (id) { var b = BADGES[id]; bg.appendChild(h('div', { class: 'bdg' + (S.badges.indexOf(id) >= 0 ? ' got' : '') }, h('div', { class: 'bi', text: b.i }), h('b', { text: b.t }), h('small', { text: b.d }))); });
  ctx.card.appendChild(bg);

  var tg = Object.keys(S.tags).filter(function (t) { return L.tags && L.tags[t]; });
  if (tg.length) {
    ctx.card.appendChild(h('h3', { text: '🔍 نکته‌هایی که امروز کشف کردی (برای مرور)' }));
    ctx.card.appendChild(h('p', { class: 'muted small', text: 'این‌ها جاهایی است که یک بار اشتباه کردی و بعد درستش کردی. یک بار دیگر بخوان:' }));
    ctx.card.appendChild(h('div', null, tg.map(function (t) { return h('div', { class: 'callout acc', html: '<b>' + L.tags[t].t + '</b><br>' + L.tags[t].review }); })));
  } else if (Object.keys(S.res).length) {
    ctx.card.appendChild(h('div', { class: 'callout ok', text: '🔍 در هیچ‌کدام از تله‌های رایج این درس گیر نیفتادی. عالی!' }));
  }

  var objs = L.objectives || [];
  if (objs.length) {
    ctx.card.appendChild(h('h3', { text: '🪞 خودت را ارزیابی کن' }));
    var EMO = [['😟', 'هنوز نه'], ['🙂', 'کمی'], ['😀', 'خوب'], ['🤩', 'می‌توانم به دوستم یاد بدهم']];
    objs.forEach(function (o, k) {
      var row = h('div', { class: 'selfrow' }, h('span', { class: 'o', html: o }));
      EMO.forEach(function (e, j) {
        var b = h('button', { class: 'emo' + (S.self[k] === j ? ' on' : ''), type: 'button', title: e[1], text: e[0] + ' ' + e[1] });
        b.onclick = function () { S.self[k] = j; store(); Array.prototype.forEach.call(row.querySelectorAll('.emo'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); sound('click');
          if (objs.every(function (_, q) { return S.self[q] != null; })) award('reflector'); };
        row.appendChild(b);
      });
      ctx.card.appendChild(row);
    });
  }
  ctx.card.appendChild(h('h3', { text: '✍️ ' + (s.prompt || 'امروز یاد گرفتم که…') }));
  var ta = h('textarea', { class: 'refl', placeholder: 'یک یا دو جمله بنویس…' }); ta.value = S.reflect || '';
  ta.oninput = function () { S.reflect = ta.value; store(); };
  ctx.card.appendChild(ta);
  if (s.html) ctx.card.appendChild(h('div', { html: s.html, style: 'margin-top:12px' }));

  var copyBtn = h('button', { class: 'btn acc', type: 'button', text: '📋 کپی گزارش برای معلم', onclick: function () { copyText(report()); } });
  var again = h('button', { class: 'btn ghost', type: 'button', text: '🔄 شروع دوباره (رکوردت می‌ماند)', onclick: function () {
    if (!confirm('همهٔ پاسخ‌ها پاک شود و از اول شروع کنی؟')) return;
    var keep = { name: S.name, mode: S.mode, best: Math.max(S.best || 0, S.stars), mute: S.mute };
    S = Object.assign(fresh(), keep, { started: true }); store(); go(0, true);
  } });
  ctx.card.appendChild(h('div', { class: 'row' }, copyBtn, again));
  if (S.stars > (S.best || 0)) { S.best = S.stars; store(); }
  setTimeout(function () { confetti(200); sound('stage'); }, 400);
};
function report() {
  var EM = ['😟 هنوز نه', '🙂 کمی', '😀 خوب', '🤩 عالی'];
  var lines = ['📘 گزارش درس: ' + L.title, '👤 نام: ' + (S.name || '—'),
    '⭐ ستاره‌ها: ' + fa(S.stars) + ' از ' + fa(MAXSTARS),
    '🏅 نشان‌ها: ' + (S.badges.map(function (b) { return BADGES[b].t; }).join('، ') || '—')];
  var tg = Object.keys(S.tags).filter(function (t) { return L.tags && L.tags[t]; });
  lines.push('🔍 اشتباه‌های رفع‌شده: ' + (tg.map(function (t) { return L.tags[t].t; }).join('، ') || 'ندارد'));
  (L.objectives || []).forEach(function (o, k) { lines.push('🪞 ' + o.replace(/<[^>]+>/g, '') + ': ' + (S.self[k] != null ? EM[S.self[k]] : '—')); });
  if (S.reflect) lines.push('✍️ ' + S.reflect);
  var d = ''; try { d = new Date().toLocaleDateString('fa-IR'); } catch (e) {}
  lines.push('🗓 ' + d);
  return lines.join('\n');
}
function copyText(t) {
  var ok = function () { toast('📋 کپی شد! حالا در پیام‌رسان بچسبان و بفرست.'); };
  var fallback = function () {
    var ta = h('textarea', { style: 'position:fixed;top:0;opacity:0' }); ta.value = t; document.body.appendChild(ta); ta.select();
    var done = false; try { done = document.execCommand('copy'); } catch (e) {}
    ta.remove(); if (done) ok(); else prompt('این متن را کپی کن:', t);
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, fallback); else fallback();
}
window.ILcopy = copyText;

/* ---------- تایمر فعالیت ---------- */
var TMR = { slide: null, left: 0, end: 0, run: false, iv: 0 };
function fmt(sec) { sec = Math.max(0, Math.round(sec)); return fa(Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2)); }
function timerWidget(ctx) {
  var s = ctx.s;
  if (TMR.slide !== ctx.i && !TMR.run) { TMR.slide = ctx.i; TMR.left = s.timer * 60; }
  var tv = h('span', { class: 'tv' });
  var box = h('div', { class: 'timer' }, h('span', { text: '⏳ ' + (s.timerLabel || 'زمان فعالیت') }), tv);
  var bRun = h('button', { class: 'btn', type: 'button' });
  var bAdd = h('button', { class: 'btn ghost', type: 'button', text: '+۱ دقیقه', onclick: function () { own(); TMR.left += 60; if (TMR.run) TMR.end += 60000; paint(); } });
  var bRst = h('button', { class: 'btn ghost', type: 'button', text: '↺', onclick: function () { own(); stopT(); TMR.left = s.timer * 60; paint(); } });
  function own() { if (TMR.slide !== ctx.i) { stopT(); TMR.slide = ctx.i; TMR.left = s.timer * 60; } }
  bRun.onclick = function () { own(); if (TMR.run) stopT(); else startT(); paint(); };
  add(box, [bRun, bAdd, bRst]);
  function paint() {
    var left = TMR.slide === ctx.i ? (TMR.run ? (TMR.end - Date.now()) / 1000 : TMR.left) : s.timer * 60;
    tv.textContent = fmt(left);
    bRun.textContent = TMR.run && TMR.slide === ctx.i ? '⏸ مکث' : '▶ شروع';
  }
  TMR.paint = paint; paint();
  return box;
}
function startT() { TMR.run = true; TMR.end = Date.now() + TMR.left * 1000; clearInterval(TMR.iv); TMR.iv = setInterval(tickT, 250); }
function stopT() { if (TMR.run) TMR.left = Math.max(0, (TMR.end - Date.now()) / 1000); TMR.run = false; clearInterval(TMR.iv); timeChip.classList.add('hide'); }
function tickT() {
  var left = (TMR.end - Date.now()) / 1000;
  if (TMR.paint && S.idx === TMR.slide) TMR.paint();
  timeChip.classList.toggle('hide', S.idx === TMR.slide);
  timeChip.textContent = '⏳ ' + fmt(left);
  if (left <= 0) { stopT(); TMR.left = 0; sound('bell'); toast('⏰ زمان فعالیت تمام شد!', 'big'); if (TMR.paint) TMR.paint(); }
}

/* ---------- تایمر فکر ---------- */
function think(sec) {
  var t0 = Date.now(), tv = h('div', { class: 'tv' });
  var ring = h('div', { class: 'thinkring' }, tv, h('div', { text: 'فکر کنید… 🤔' }), h('small', { text: '(برای بستن کلیک کنید)', style: 'opacity:.7;font-weight:400' }));
  var ov = h('div', { class: 'thinkov' }, ring);
  var iv = setInterval(paint, 200);
  function paint() {
    var left = sec - (Date.now() - t0) / 1000;
    tv.textContent = fa(Math.max(0, Math.ceil(left)));
    var p = Math.max(0, left / sec) * 360;
    ring.style.background = 'conic-gradient(var(--a) ' + p + 'deg, rgba(255,255,255,.12) 0)';
    if (left <= 0) { clearInterval(iv); sound('bell'); setTimeout(close, 1200); }
  }
  function close() { clearInterval(iv); ov.remove(); }
  ov.onclick = close; document.body.appendChild(ov); paint();
}

/* ---------- ناوبری و رابط ---------- */
function setMode(m) {
  S.mode = m; store();
  toast(m === 'present' ? '🧑‍🏫 حالت ارائه: همهٔ مراحل باز است · کلیدها: ← بعدی، → قبلی، T تایمر فکر، N یادداشت، F تمام‌صفحه' : '🎒 حالت دانش‌آموز: مرحله‌ها یکی‌یکی باز می‌شوند');
  render();
}
function hud() {
  document.body.classList.toggle('present', S.mode === 'present');
  starPill.textContent = S.mode === 'present' ? '⭐ کلاس ' + fa(S.classStars) + ' / ' + fa(CLASSGOAL) : '⭐ ' + fa(S.stars);
  badgePill.textContent = '🏅 ' + fa(S.badges.length);
  btnMute.textContent = S.mute ? '🔇' : '🔊';
  btnMode.textContent = S.mode === 'present' ? '🎒' : '🧑‍🏫';
  btnMode.title = S.mode === 'present' ? 'رفتن به حالت دانش‌آموز' : 'رفتن به حالت ارائه (معلم)';
  btnThink.classList.toggle('hide', S.mode !== 'present');
  btnNotes.classList.toggle('hide', S.mode !== 'present');
  btnNotes.classList.toggle('on', !!S.showNotes);
  ptools.classList.toggle('hide', S.mode !== 'present');
}
function map() {
  mapEl.innerHTML = '';
  var cur = SL[S.idx].stage;
  STG.forEach(function (st) {
    var first = -1; for (var i = 0; i < SL.length; i++) if (SL[i].stage === st.id) { first = i; break; }
    if (first < 0) return;
    var locked = S.mode !== 'present' && !reachable(first);
    var done = stageDone(st.id) && SL.some(function (s) { return s.stage === st.id && gated(s); });
    var c = h('button', { class: 'chip' + (st.id === cur ? ' cur' : '') + (done ? ' done' : '') + (locked ? ' lock' : ''), type: 'button', title: st.title },
      h('span', { class: 'ci', text: locked ? '🔒' : done ? '✓' : st.icon }), h('span', { class: 'cl', text: st.title }));
    c.onclick = function () { if (locked) { toast('🔒 این مرحله بعد از تمام کردن مرحله‌های قبلی باز می‌شود'); return; } go(first); };
    mapEl.appendChild(c);
  });
  var curEl = mapEl.querySelector('.cur'); if (curEl && curEl.scrollIntoView) try { curEl.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
}
function reachable(i) { for (var k = 0; k < i; k++) if (!isDone(k)) return false; return true; }
function navState() {
  var i = S.idx, last = i >= SL.length - 1;
  btnPrev.disabled = i === 0;
  btnNext.classList.toggle('hide', last);
  var lockd = S.mode !== 'present' && !isDone(i);
  btnNext.classList.toggle('locked', lockd);
  btnNext.classList.toggle('pulse', !lockd && gated(SL[i]) && isDone(i));
  progI.style.width = (100 * (i + 1) / SL.length) + '%';
  cntEl.textContent = fa(i + 1) + ' / ' + fa(SL.length);
}
function notes() {
  var s = SL[S.idx];
  var show = S.mode === 'present' && S.showNotes && s.note;
  notesEl.classList.toggle('hide', !show);
  if (show) { notesEl.innerHTML = '<div class="nt">📝 یادداشت ارائه‌دهنده (N برای بستن)</div>' + s.note; }
}
function go(i, force) {
  i = Math.max(0, Math.min(SL.length - 1, i));
  if (!force && S.mode !== 'present' && i > S.idx) {
    for (var k = S.idx; k < i; k++) if (!isDone(k)) {
      if (k === S.idx) { toast('اول این فعالیت را کامل کن 🙂 بعد «بعدی» باز می‌شود.'); var c = main.querySelector('.slide'); if (c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); } return; }
      i = k; break;
    }
  }
  S.idx = i; S.max = Math.max(S.max, i); store(); render();
  window.scrollTo(0, 0);
}
function resetSlide(i) {
  var r = S.res[i];
  if (r && r.stars && S.mode !== 'present') { S.stars = Math.max(0, S.stars - r.stars); }
  delete S.res[i]; store(); render(); toast('↺ این اسلاید از نو شروع شد');
}
function render() {
  var s = SL[S.idx];
  main.innerHTML = '';
  var card = h('section', { class: 'slide t-' + s.type });
  var r = (gated(s) || s.type === 'custom') ? res(S.idx) : { tries: 0, hints: 0, done: true, stars: 0 };
  var ctx = { s: s, i: S.idx, r: r, card: card, fb: h('div', { class: 'fbwrap', 'aria-live': 'polite' }) };
  CUR = ctx;
  (R[s.type] || R.content)(ctx);
  main.appendChild(card); faNodes(card);
  hud(); navState(); map(); notes();
  btnAns.classList.toggle('hide', !ctx.reveal);
}
function fullscreen() {
  var d = document, el = d.documentElement;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else if (el.requestFullscreen) el.requestFullscreen(); else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}
document.addEventListener('keydown', function (e) {
  if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
  if (document.querySelector('.startov')) return;
  var k = e.key;
  if (k === 'ArrowLeft' || k === 'PageDown' || (k === ' ' && S.mode === 'present')) { e.preventDefault(); go(S.idx + 1); }
  else if (k === 'ArrowRight' || k === 'PageUp') { e.preventDefault(); go(S.idx - 1); }
  else if (k === 'f' || k === 'F' || k === 'ب') fullscreen();
  else if ((k === 'n' || k === 'N' || k === 'د') && S.mode === 'present') { S.showNotes = !S.showNotes; store(); notes(); hud(); }
  else if ((k === 't' || k === 'T' || k === 'ف') && S.mode === 'present') think(L.thinkSeconds || 30);
});

/* ---------- صفحهٔ شروع ---------- */
function startScreen() {
  var nameIn = h('input', { class: 'tin wide', placeholder: 'اسمت چیست؟ (اختیاری)', style: 'width:100%;text-align:center', autocomplete: 'off' });
  nameIn.value = S.name || '';
  var resume = S.started && (S.idx > 0 || Object.keys(S.res).length);
  function begin(mode, restart) {
    S.name = nameIn.value.trim();
    if (restart) { var keep = { name: S.name, best: Math.max(S.best || 0, S.stars), mute: S.mute }; S = Object.assign(fresh(), keep); }
    S.mode = mode; S.started = true; store(); ov.remove(); actx(); render();
    if (mode === 'present') toast('🧑‍🏫 حالت ارائه · کلیدها: ← بعدی، → قبلی، T تایمر فکر، N یادداشت، F تمام‌صفحه');
  }
  var modes = h('div', { class: 'modes' },
    resume ? h('button', { class: 'modebtn primary', type: 'button', onclick: function () { begin(S.mode || 'student'); } }, h('span', { class: 'e', text: '▶️' }), h('b', { text: 'ادامه از جایی که بودی' }), h('small', { text: 'اسلاید ' + fa(S.idx + 1) + ' از ' + fa(SL.length) + ' · ' + fa(S.stars) + ' ستاره' })) : null,
    h('button', { class: 'modebtn' + (resume ? '' : ' primary'), type: 'button', onclick: function () { begin('student', resume); } }, h('span', { class: 'e', text: '🎒' }), h('b', { text: resume ? 'شروع دوباره (دانش‌آموز)' : 'شروع یادگیری' }), h('small', { text: 'با سرعت خودت؛ مرحله‌ها یکی‌یکی باز می‌شوند' })),
    h('button', { class: 'modebtn', type: 'button', onclick: function () { begin('present', resume); } }, h('span', { class: 'e', text: '🧑‍🏫' }), h('b', { text: 'حالت ارائه (معلم)' }), h('small', { text: 'برای ویدئوپروژکتور؛ همهٔ مراحل باز' })));
  var meta = h('div', { class: 'meta' }, [L.grade, L.subject, L.duration].filter(Boolean).map(function (m) { return h('span', { class: 'tag', text: m }); }));
  var card = h('div', { class: 'startcard' },
    h('div', { class: 'm', text: L.mascot || '📘' }), h('h1', { text: L.title }), L.subtitle ? h('p', { class: 'sub', text: L.subtitle }) : null, meta,
    L.intro ? h('div', { class: 'center', html: L.intro }) : null,
    (L.objectives && L.objectives.length) ? h('div', null, h('b', { text: '🎯 در پایان این درس می‌توانی:' }), h('ul', { class: 'obj' }, L.objectives.map(function (o) { return h('li', { html: o }); }))) : null,
    nameIn, modes,
    h('p', { class: 'center muted small', style: 'margin-top:14px', html: L.credit || 'ساخته‌شده با موتور «کلاس زنده» · بدون نیاز به اینترنت' }));
  var ov = h('div', { class: 'startov' }, card);
  faNodes(card);
  document.body.appendChild(ov);
  nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') begin(resume ? S.mode : 'student'); });
}

hud();
if (/#present/.test(location.hash)) { S.mode = 'present'; S.started = true; render(); }
else if (L.noStart) { S.started = true; render(); }
else { render(); startScreen(); }
window.IL = { go: go, state: function () { return S; }, fa: fa, en: en, h: h, toast: toast, confetti: confetti, sound: sound, copy: copyText };
})();
