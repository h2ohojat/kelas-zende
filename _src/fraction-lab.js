/* میز آزمایش کسرها؛ بدون وابستگی، با حساب صحیح گویا و ذخیره از طریق API موتور. */
var FractionLab = (function () {
  'use strict';
  var DENOMS = [2, 3, 4, 6, 8, 12];
  var MISSIONS = [
    { id: 'mix', title: 'دو طعم، یک پارچ', text: 'نصف و یک‌سوم لیتر را ترکیب کن. اول حدس بزن به یک لیتر می‌رسند یا نه؛ بعد شبکه‌های ۶ و ۱۲ را امتحان کن.', a: [1, 2], b: [1, 3], op: '+',
      hints: ['به ارتفاع دو مایع نگاه کن؛ آیا با هم یک ظرف کامل می‌شوند؟', 'شبکه‌ای انتخاب کن که هم نیم‌ها و هم سوم‌ها را به تکه‌های کامل تبدیل کند.', 'برای یک آزمایش مشابه: یک‌دوم + یک‌چهارم = دوچهارم + یک‌چهارم.'] },
    { id: 'take', title: 'سهم دوستت را جدا کن', text: 'از سه‌چهارم لیتر، یک‌ششم لیتر جدا کن. ظرف دوم سهم دوست توست؛ چیزی از مایع گم نمی‌شود!', a: [3, 4], b: [1, 6], op: '−',
      hints: ['سطح ظرف اول باید پس از برداشتن پایین بیاید.', 'خط‌هایی پیدا کن که چهارم و ششم را با تکه‌های هم‌اندازه نشان بدهند.', 'مثال مشابه: سه‌چهارم − یک‌دوم = سه‌چهارم − دوچهارم.'] },
    { id: 'overflow', title: 'یک پارچ کافی نیست؟', text: 'دو‌سوم و پنج‌ششم لیتر را ترکیب کن. قبل از ریختن حدس بزن یک ظرف یک‌لیتری کافی است یا دو ظرف لازم داریم.', a: [2, 3], b: [5, 6], op: '+',
      hints: ['هر دو مقدار از نصف بیشترند؛ دو نصف روی هم چقدر می‌شود؟', 'وقتی ظرف اول پر شد، باقی نوشیدنی باید در ظرف دوم جا بگیرد.', 'مثال مشابه: سه‌چهارم + سه‌چهارم = شش‌چهارم؛ چهارچهارمِ آن یک واحد کامل است.'] }
  ];
  var SERIAL = 0, returnIndex = 0;
  function gcd(a, b) { while (b) { var r = a % b; a = b; b = r; } return a || 1; }
  function calc(a, b, op) {
    var d = a[1] * b[1] / gcd(a[1], b[1]);
    var an = a[0] * d / a[1], bn = b[0] * d / b[1];
    var n = op === '+' ? an + bn : an - bn, g = gcd(Math.abs(n), d);
    return { d: d, an: an, bn: bn, n: n, simple: [n / g, d / g], value: n / d };
  }
  function render(el, api) {
    var st = api.state, h = api.h, fa = api.fa;
    function valid(f) { return Array.isArray(f) && DENOMS.indexOf(f[1]) >= 0 && Number.isInteger(f[0]) && f[0] >= 0 && f[0] <= f[1]; }
    st.a = valid(st.a) ? st.a : [1, 2]; st.b = valid(st.b) ? st.b : [1, 3];
    st.op = st.op === '−' ? '−' : '+'; st.mission = st.mission || 'free';
    st.grid = st.grid || 6; st.notebook = st.notebook || []; st.visits = st.visits || {}; st.seenGrids = st.seenGrids || {};
    st.hint = st.hint || 0; st.revealed = !!st.revealed;
    var root = h('div', { class: 'flab' }); el.appendChild(root);
    var slideCard = el.closest('.slide');
    if (slideCard) { slideCard.style.maxWidth = '1100px'; slideCard.style.padding = 'clamp(12px,2vw,24px)'; }
    var intro = h('div', { class: 'flab-top' }, h('div', null,
      h('div', { class: 'flab-eyebrow', text: 'دستت باز است؛ ترکیب تازه بساز' }),
      h('h3', { class: 'flab-title', text: 'میزِ کشف کسرها 🧪' }),
      h('p', { class: 'flab-subtitle', text: 'هر ظرف کامل = ۱ لیتر. رنگ‌ها نشان می‌دهند هر مقدار از کجا آمده است.' })),
      h('button', { type: 'button', class: 'btn ghost flab-back', text: 'بازگشت به درس', onclick: function () { window.IL.go(returnIndex, true); } }));
    root.appendChild(intro);
    var modes = h('div', { class: 'flab-modes', role: 'group', 'aria-label': 'انتخاب آزمایش' });
    var missionBox = h('div', { class: 'flab-mission' });
    root.appendChild(modes); root.appendChild(missionBox);
    var modeUIs = [];
    [{ id: 'free', title: 'آزمایش آزاد' }].concat(MISSIONS).forEach(function (entry) {
      var b = h('button', { type: 'button', class: 'flab-mode', 'data-mission': entry.id });
      b.onclick = function () { setMission(entry.id === 'free' ? null : entry); };
      modes.appendChild(b); modeUIs.push({ entry: entry, el: b });
    });
    var opButtons = [], gridToggle = h('input', { type: 'checkbox', 'data-lab': 'grid-toggle' });
    var gridSelect = h('select', { 'aria-label': 'تعداد تکه‌های مشترک', 'data-lab': 'grid' });
    var toolbar = h('div', { class: 'flab-toolbar' });
    ['+', '−'].forEach(function (op) {
      var b = h('button', { type: 'button', class: 'flab-op', 'data-lab': op === '+' ? 'add' : 'subtract', text: op === '+' ? '＋ روی هم بریز' : '− جدا کن' });
      b.onclick = function () { st.op = op; changed(true); }; opButtons.push(b); toolbar.appendChild(b);
    });
    gridToggle.checked = !!st.common;
    toolbar.appendChild(h('label', { class: 'flab-grid-toggle' }, gridToggle, 'تکه‌ها را هم‌اندازه کن'));
    toolbar.appendChild(h('label', { class: 'flab-grid' }, 'شبکهٔ هر لیتر ', gridSelect));
    root.appendChild(toolbar);
    var gridNote = h('p', { class: 'flab-grid-note', 'aria-live': 'polite' }); root.appendChild(gridNote);
    var bench = h('div', { class: 'flab-bench' }); root.appendChild(bench);
    var ingredientUIs = {};
    ['a', 'b'].forEach(function (key) {
      var amount = h('div', { class: 'flab-frac' });
      var title = h('b');
      var pic = h('div', { class: 'flab-beaker' });
      var den = h('select', { 'aria-label': 'مخرج پیمانهٔ ' + (key === 'a' ? 'اول' : 'دوم'), 'data-lab': key + '-den' });
      DENOMS.forEach(function (d) { den.appendChild(h('option', { value: d, text: fa(d) + ' قسمت مساوی' })); });
      var range = h('input', { type: 'range', min: '0', step: '1', 'aria-label': 'صورت پیمانهٔ ' + (key === 'a' ? 'اول' : 'دوم'), 'data-lab': key + '-num' });
      var minus = h('button', { type: 'button', text: '−', 'aria-label': 'یک تکه کمتر در پیمانهٔ ' + (key === 'a' ? 'اول' : 'دوم'), 'data-lab': key + '-minus' });
      var plus = h('button', { type: 'button', text: '+', 'aria-label': 'یک تکه بیشتر در پیمانهٔ ' + (key === 'a' ? 'اول' : 'دوم'), 'data-lab': key + '-plus' });
      var eq = h('div', { class: 'flab-equivalent' });
      var card = h('section', { class: 'flab-ingredient', 'data-color': key },
        h('div', { class: 'flab-ingredient-head' }, title, amount), pic,
        h('div', { class: 'flab-controls' }, h('label', null, 'مخرج: چند قسمت؟ ', den),
          h('div', { class: 'flab-counter' }, minus, range, plus)), eq);
      bench.appendChild(card); ingredientUIs[key] = { amount: amount, title: title, pic: pic, den: den, range: range, minus: minus, plus: plus, eq: eq };
      den.onchange = function () { st[key] = [Math.min(st[key][0], +den.value), +den.value]; changed(true); };
      range.oninput = function () { st[key][0] = +range.value; changed(true); };
      minus.onclick = function () { if (st[key][0] > 0) { st[key][0]--; changed(true); } };
      plus.onclick = function () { if (st[key][0] < st[key][1]) { st[key][0]++; changed(true); } };
    });
    var predictions = h('div', { class: 'flab-predictions', role: 'group', 'aria-label': 'پیش‌بینی مقدار نتیجه' });
    var predictionButtons = [];
    [['less', 'کمتر از ۱ لیتر'], ['equal', 'دقیقاً ۱ لیتر'], ['more', 'بیشتر از ۱ لیتر']].forEach(function (p) {
      var b = h('button', { type: 'button', text: p[1], 'data-lab': 'predict-' + p[0] });
      b.onclick = function () { st.prediction = p[0]; st.revealed = false; api.save(); paint(); };
      predictions.appendChild(b); predictionButtons.push({ key: p[0], el: b });
    });
    root.appendChild(h('div', { class: 'flab-predict' }, h('b', { text: 'پیش از آزمایش، حدس بزن مقدار نتیجه چقدر می‌شود:' }), predictions));
    var run = h('button', { type: 'button', class: 'btn flab-run', 'data-lab': 'run', text: 'بریز و ببین 💧' });
    var hint = h('button', { type: 'button', class: 'btn ghost flab-help', 'data-lab': 'hint', text: 'یک تلنگر 💡' });
    var surprise = h('button', { type: 'button', class: 'btn ghost', 'data-lab': 'surprise', text: 'یک ترکیب تازه 🎲' });
    root.appendChild(h('div', { class: 'flab-actions' }, run, hint, surprise));
    var feedback = h('div', { class: 'flab-feedback', 'aria-live': 'polite' }); root.appendChild(feedback);
    var result = h('section', { class: 'flab-result', 'aria-label': 'نتیجهٔ آزمایش' }); root.appendChild(result);
    var notes = h('ol', { class: 'flab-notes' });
    var noteDetails = h('details', { class: 'flab-notebook' }, h('summary', { text: '📒 دفتر آزمایش‌های من' }), notes);
    root.appendChild(noteDetails);
    var reflection = h('textarea', { maxlength: '240', rows: '2', 'data-lab': 'reflection', placeholder: 'مثلاً: خط‌های بیشتری کشیدم، اما مقدار مایع همان بود…' });
    reflection.value = st.reflection || '';
    reflection.oninput = function () { st.reflection = reflection.value; api.save(); };
    reflection.onchange = function () { api.emit('lab.reflect', { text: reflection.value }); };
    root.appendChild(h('label', { class: 'flab-reflection' }, h('b', { text: '🪞 امروز در آزمایشگاه کشف کردم که…' }), reflection));
    root.appendChild(h('div', { class: 'flab-actions' }, h('button', { type: 'button', class: 'btn ghost', text: 'بازگشت به درس از همان‌جا', onclick: function () { window.IL.go(returnIndex, true); } })));

    function fraction(n, d) { return '<span class="fr"><b>' + fa(n) + '</b><i>' + fa(d) + '</i></span>'; }
    function expression(a, b, op) { return fraction(a[0], a[1]) + '<span>' + op + '</span>' + fraction(b[0], b[1]); }
    function mission() { return MISSIONS.filter(function (m) { return m.id === st.mission; })[0]; }
    function showFeedback(text, kind) { feedback.textContent = text; feedback.dataset.kind = kind || 'hint'; }
    function changed(free) {
      if (free) { st.mission = 'free'; st.hint = 0; }
      st.revealed = false; st.prediction = null; api.save(); showFeedback('مقدارها را عوض کردی؛ نتیجهٔ تازه را پیش‌بینی کن و دوباره آزمایش کن.'); paint();
    }
    function setMission(m) {
      st.mission = m ? m.id : 'free'; st.hint = 0;
      if (m) { st.a = m.a.slice(); st.b = m.b.slice(); st.op = m.op; st.common = false; }
      st.revealed = false; st.prediction = null; api.save(); showFeedback('پیش‌بینی‌ات را انتخاب کن؛ بعد مایع‌ها را جابه‌جا کن.'); paint();
    }
    gridToggle.onchange = function () { st.common = gridToggle.checked; if (st.common) st.grid = calc(st.a, st.b, st.op).d; gridChanged(); };
    gridSelect.onchange = function () { st.grid = +gridSelect.value; gridChanged(); };
    function gridChanged() {
      if (st.common) st.seenGrids[st.grid] = true;
      api.save(); showFeedback('فقط خط‌های تقسیم عوض شدند؛ ارتفاع مایع را با قبل مقایسه کن.');
      api.emit('lab.grid', { grid: st.common ? st.grid : null, a: st.a.slice(), b: st.b.slice() }); paint();
    }
    function vessel(segments, divisions, label, ghost) {
      var id = 'flab-' + (++SERIAL), out = '', yBottom = 204, tall = 164;
      segments.forEach(function (s) {
        if (s.to <= s.from) return;
        out += '<rect class="flab-liquid" x="40" y="' + (yBottom - s.to * tall) + '" width="112" height="' + ((s.to - s.from) * tall) + '" fill="' + s.color + '"/>';
      });
      if (ghost && ghost.to > ghost.from) out += '<rect x="40" y="' + (yBottom - ghost.to * tall) + '" width="112" height="' + ((ghost.to - ghost.from) * tall) + '" fill="url(#' + id + '-hatch)"/>';
      var marks = '';
      for (var k = 1; k < divisions; k++) {
        var y = yBottom - tall * k / divisions;
        marks += '<line x1="40" x2="152" y1="' + y + '" y2="' + y + '" stroke="#183c39" stroke-opacity=".24" stroke-width="1"/>';
      }
      return '<svg viewBox="0 0 206 244" role="img" aria-label="' + label + '"><defs><clipPath id="' + id + '"><path d="M40 35H152V194Q152 204 142 204H50Q40 204 40 194Z"/></clipPath><pattern id="' + id + '-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-2 2L2 -2M0 8L8 0M6 10L10 6" stroke="#ca6c3c" stroke-width="2" opacity=".4"/></pattern></defs>' +
        '<ellipse cx="96" cy="218" rx="76" ry="8" fill="#173f3910"/>' +
        '<path d="M153 55H168Q186 55 182 90L168 125H153" fill="none" stroke="#719b91" stroke-width="5"/>' +
        '<path d="M40 35H152V194Q152 204 142 204H50Q40 204 40 194Z" fill="#fff"/>' +
        '<g clip-path="url(#' + id + ')">' + out + marks + '</g>' +
        '<path d="M30 29L40 42V194Q40 204 50 204H142Q152 204 152 194V29" fill="none" stroke="#315b54" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M49 48V184" stroke="white" stroke-width="5" opacity=".35" stroke-linecap="round"/>' +
        '<text x="31" y="43" font-size="13" text-anchor="end" fill="#315b54">' + fa(1) + '</text><text x="31" y="208" font-size="13" text-anchor="end" fill="#315b54">' + fa(0) + '</text>' +
        '<text x="96" y="240" font-size="13" text-anchor="middle" fill="#315b54">ظرف یک‌لیتری</text></svg>';
    }
    function numberline(c) {
      var x = function (v) { return 34 + v * 270; }, a = st.a[0] / st.a[1];
      var out = '<svg viewBox="0 0 608 110" role="img" aria-label="خط اعداد از صفر تا دو؛ ابتدا مقدار اول، سپس ' + (st.op === '+' ? 'حرکت به راست برای جمع' : 'حرکت به چپ برای تفریق') + '"><line x1="34" x2="574" y1="67" y2="67" stroke="#54706b" stroke-width="2"/>';
      [0, .5, 1, 1.5, 2].forEach(function (n) { out += '<line x1="' + x(n) + '" x2="' + x(n) + '" y1="61" y2="73" stroke="#54706b"/><text x="' + x(n) + '" y="96" text-anchor="middle" font-size="15" fill="#315b54">' + fa(n) + '</text>'; });
      out += '<path d="M34 62Q' + ((34 + x(a)) / 2) + ' -8 ' + x(a) + ' 62" fill="none" stroke="#e18a38" stroke-width="3"/>';
      if (st.b[0]) out += '<path d="M' + x(a) + ' 60Q' + ((x(a) + x(c.value)) / 2) + ' 10 ' + x(c.value) + ' 60" fill="none" stroke="#8664c1" stroke-width="3"/>' +
        '<path d="M' + (x(c.value) + (st.op === '+' ? -7 : 7)) + ' 51L' + x(c.value) + ' 60L' + (x(c.value) + (st.op === '+' ? 2 : -2)) + ' 48" fill="none" stroke="#8664c1" stroke-width="2"/>';
      return out + '<circle cx="' + x(c.value) + '" cy="67" r="6" fill="#166d62"/></svg>';
    }
    function paintResult(c) {
      result.innerHTML = ''; result.hidden = !st.revealed;
      if (!st.revealed || c.n < 0) return;
      var displayD = st.common && (st.grid * st.a[0]) % st.a[1] === 0 && (st.grid * st.b[0]) % st.b[1] === 0 ? st.grid : c.d;
      var an = st.a[0] * displayD / st.a[1], bn = st.b[0] * displayD / st.b[1], rn = st.op === '+' ? an + bn : an - bn;
      var a = st.a[0] / st.a[1], b = st.b[0] / st.b[1];
      result.appendChild(h('div', { class: 'flab-result-head' }, h('h3', { text: st.op === '+' ? 'ببین نوشیدنی کجا رسید!' : 'ببین چه مقدار باقی ماند!' }), h('span', { class: 'tag', text: st.op === '+' && c.value > 1 ? 'ظرف دوم هم لازم شد!' : 'هیچ مقداری گم نشد' })));
      var cups = h('div', { class: 'flab-result-vessels' });
      for (var i = 0; i < 2; i++) {
        var segments, caption, ghost;
        if (st.op === '+') {
          segments = [{ from: 0, to: Math.max(0, Math.min(1, a - i)), color: '#eda44c' }, { from: Math.max(0, Math.min(1, a - i)), to: Math.max(0, Math.min(1, a + b - i)), color: '#9874d0' }];
          caption = i ? 'ظرف دوم: ' + fraction(Math.max(0, rn - displayD), displayD) : 'ظرف اول: ' + fraction(Math.min(rn, displayD), displayD);
        } else {
          segments = [{ from: 0, to: i ? b : c.value, color: i ? '#eda44c' : '#63b4a0' }];
          caption = i ? 'سهم جداشده: ' + fraction(bn, displayD) : 'باقی‌مانده: ' + fraction(rn, displayD);
          if (!i) ghost = { from: c.value, to: a };
        }
        cups.appendChild(h('div', null, h('div', { class: 'flab-beaker', html: vessel(segments, displayD, 'ظرف نتیجه ' + fa(i + 1), ghost) }), h('div', { class: 'center', html: caption })));
      }
      result.appendChild(cups);
      var eq = expression(st.a, st.b, st.op) + '<span>=</span>' + fraction(an, displayD) + '<span>' + st.op + '</span>' + fraction(bn, displayD) + '<span>=</span>' + fraction(rn, displayD);
      if (c.simple[1] !== displayD) eq += '<span>=</span>' + fraction(c.simple[0], c.simple[1]);
      result.appendChild(h('div', { class: 'flab-equation', html: eq }));
      if (c.n > c.d) result.appendChild(h('p', { class: 'center', html: fa(Math.floor(c.n / c.d)) + ' لیتر کامل' + (c.n % c.d ? ' و ' + fraction(c.n % c.d, c.d) + ' لیتر دیگر' : '') }));
      result.appendChild(h('div', { class: 'flab-numberline', html: numberline(c) }));
      result.appendChild(h('p', { class: 'small muted center', text: st.op === '+' ? 'روی محور: از صفر، مقدار اول و سپس مقدار دوم را به راست رفتیم.' : 'روی محور: تا مقدار اول به راست رفتیم؛ سپس مقدار دوم را به چپ برگشتیم.' }));
      if (st.op === '−') result.appendChild(h('p', { class: 'small center', text: 'قسمت هاشورخورده جای مایعی است که حالا در ظرف دوستت می‌بینی.' }));
    }
    function paint() {
      var c = calc(st.a, st.b, st.op), m = mission();
      modeUIs.forEach(function (ui) {
        ui.el.setAttribute('aria-pressed', String(st.mission === ui.entry.id));
        ui.el.textContent = (st.visits[ui.entry.id] ? '✓ ' : '') + ui.entry.title;
      });
      missionBox.innerHTML = '';
      missionBox.appendChild(h('b', { class: 'flab-mission-title', text: m ? m.title : 'تو طراح نوشیدنی هستی!' }));
      missionBox.appendChild(h('p', { class: 'flab-mission-copy', text: m ? m.text : 'مقدارها را تغییر بده؛ یک بار کمتر از یک لیتر و یک بار بیشتر از یک لیتر بساز. می‌توانی هر آزمایش را دوباره انجام بدهی.' }));
      missionBox.appendChild(h('span', { class: 'flab-mission-progress', text: fa(MISSIONS.filter(function (x) { return st.visits[x.id]; }).length) + ' از ۳ آزمایش پیشنهادی را دیده‌ای' }));
      opButtons.forEach(function (b, i) { b.setAttribute('aria-pressed', String(st.op === (i ? '−' : '+'))); });
      gridToggle.checked = !!st.common; gridSelect.disabled = !st.common;
      var grids = [2, 3, 4, 6, 8, 12, 24]; if (grids.indexOf(c.d) < 0) grids.push(c.d);
      if (grids.indexOf(st.grid) < 0) st.grid = c.d;
      gridSelect.innerHTML = ''; grids.sort(function (a, b) { return a - b; }).forEach(function (d) { gridSelect.appendChild(h('option', { value: d, text: fa(d) + ' تکه' })); }); gridSelect.value = st.grid;
      var compatible = (st.grid * st.a[0]) % st.a[1] === 0 && (st.grid * st.b[0]) % st.b[1] === 0;
      gridNote.textContent = st.common ? (compatible ? 'تکه‌ها هم‌اندازه‌اند؛ مقدار مایع همان است، فقط تعداد تکه‌ها عوض شد.' : 'اندازهٔ کل ظرف ثابت است. این شبکه هنوز برای هر دو مخرج مناسب نیست؛ خط‌های دیگر را امتحان کن.') : 'فعلاً خط‌های هر پیمانه با مخرج خودش هماهنگ است. با «هم‌اندازه کن» هر دو را با یک شبکه ببین.';
      ['a', 'b'].forEach(function (key) {
        var ui = ingredientUIs[key], f = st[key], color = key === 'a' ? '#eda44c' : '#9874d0';
        ui.title.textContent = key === 'a' ? (st.op === '+' ? '🍊 پیمانهٔ اول' : '🧃 نوشیدنی آغاز') : (st.op === '+' ? '🍇 پیمانهٔ دوم' : '🥤 مقداری که جدا می‌کنی');
        ui.amount.innerHTML = fraction(f[0], f[1]) + ' لیتر'; ui.den.value = f[1]; ui.range.max = f[1]; ui.range.value = f[0];
        ui.range.setAttribute('aria-valuetext', fa(f[0]) + ' از ' + fa(f[1]) + ' تکه'); ui.minus.disabled = f[0] === 0; ui.plus.disabled = f[0] === f[1];
        ui.pic.innerHTML = vessel([{ from: 0, to: f[0] / f[1], color: color }], st.common ? st.grid : f[1], fa(f[0]) + ' از ' + fa(f[1]) + ' لیتر');
        ui.eq.innerHTML = st.common && (st.grid * f[0]) % f[1] === 0 ? '<span class="flab-equation">' + fraction(f[0], f[1]) + '<span>=</span>' + fraction(f[0] * st.grid / f[1], st.grid) + '</span>' : (st.common ? 'خط‌ها را عوض کن؛ مقدار مایع سر جایش می‌ماند.' : 'صورت: ' + fa(f[0]) + ' تکه از ' + fa(f[1]) + ' تکه');
      });
      predictionButtons.forEach(function (p) { p.el.setAttribute('aria-pressed', String(st.prediction === p.key)); });
      run.textContent = st.op === '+' ? 'بریز و ببین 💧' : 'جدا کن و ببین 🥤';
      paintResult(c);
      notes.innerHTML = '';
      st.notebook.forEach(function (n) { notes.appendChild(h('li', null, h('span', { class: 'flab-equation', html: expression(n.a, n.b, n.op) + '<span>=</span>' + fraction(n.answer[0], n.answer[1]) }), h('small', { text: n.prediction ? 'با پیش‌بینی' : 'مشاهدهٔ آزاد' }))); });
      if (!st.notebook.length) notes.appendChild(h('li', { text: 'نتیجهٔ شش آزمایش آخرت اینجا می‌ماند.' }));
    }
    run.onclick = function () {
      var c = calc(st.a, st.b, st.op);
      if (c.n < 0) {
        st.revealed = false; api.save(); paint(); showFeedback('بیشتر از موجودی می‌خواهی برداری! مقدار آغاز را بیشتر یا مقدار برداشت را کمتر کن؛ در این آزمایشگاه از ظرف خالی برداشت نمی‌کنیم.');
        api.emit('lab.insufficient', { a: st.a.slice(), b: st.b.slice() }); return;
      }
      var expected = c.n < c.d ? 'less' : c.n === c.d ? 'equal' : 'more';
      st.revealed = true;
      if (mission()) st.visits[st.mission] = true;
      var experiment = { a: st.a.slice(), b: st.b.slice(), op: st.op, answer: c.simple.slice(), prediction: st.prediction || null };
      st.notebook.unshift(experiment); st.notebook = st.notebook.slice(0, 6);
      api.save(); api.done(); api.emit('lab.observe', experiment); paint(); api.sound('tick');
      if (!st.prediction) showFeedback('نتیجه را دیدی! حالا یک مقدار را عوض کن و پیش از آزمایش بعدی حدس بزن.', 'ok');
      else if (st.prediction === expected) showFeedback('پیش‌بینی‌ات با شکل جور بود! حالا فقط خط‌های تقسیم را عوض کن؛ مقدار نتیجه تغییر می‌کند؟', 'ok');
      else showFeedback('نتیجه با پیش‌بینی‌ات فرق داشت؛ این هم یک کشف است. سطح ظرف‌ها و مسیر روی محور را مقایسه کن و دوباره بساز.');
    };
    hint.onclick = function () {
      var hints = mission() ? mission().hints : ['هر ظرف کامل یک لیتر است. اول مقدارها را با نصف مقایسه کن.', 'مخرج مشترک فقط خط‌ها را عوض می‌کند؛ نباید مایع تازه‌ای تولید شود.', 'مثال: یک‌دوم + یک‌چهارم = دوچهارم + یک‌چهارم = سه‌چهارم.'];
      showFeedback(hints[Math.min(st.hint, 2)]); st.hint = Math.min(3, st.hint + 1); api.save(); api.emit('lab.hint', { level: st.hint });
    };
    surprise.onclick = function () {
      var candidates = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 6], [5, 6], [3, 8]];
      st.a = candidates[Math.floor(Math.random() * candidates.length)].slice(); st.b = candidates[Math.floor(Math.random() * candidates.length)].slice();
      if (st.op === '−' && calc(st.a, st.b, st.op).n < 0) { var tmp = st.a; st.a = st.b; st.b = tmp; }
      changed(true);
    };
    paint(); api.save();
  }
  function install() {
    if (!window.IL || !window.LESSON || window.LESSON.id !== 'fraction-add-sub-g5') return;
    var index = window.LESSON.slides.findIndex(function (s) { return s.id === 'free-fraction-lab'; });
    if (index < 0) return;
    var savedReturn = window.LESSON.slides.findIndex(function (s) { return s.id === window.IL.state().labReturnId; });
    returnIndex = savedReturn >= 0 && savedReturn !== index ? savedReturn : 0;
    var nav = document.querySelector('.navbar');
    function syncNavigation() {
      if (nav) nav.style.display = window.IL.state().idx === index ? 'none' : '';
    }
    window.addEventListener('kelas:event', function (e) {
      if (e.detail.type !== 'slide.view') return;
      if (window.IL.state().idx === index && e.detail.data.from) {
        var previous = window.LESSON.slides.findIndex(function (s) { return s.id === e.detail.data.from; });
        if (previous >= 0 && previous !== index) { returnIndex = previous; window.IL.state().labReturnId = window.LESSON.slides[previous].id; }
      }
      syncNavigation();
    });
    document.addEventListener('keydown', function (e) {
      if (window.IL.state().idx !== index || e.target.closest('input,textarea,select,[contenteditable]')) return;
      if (['ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', ' '].indexOf(e.key) >= 0) {
        e.stopImmediatePropagation();
        if (e.key !== ' ') e.preventDefault();
      }
    }, true);
    function open() {
      var state = window.IL.state(); if (state.idx !== index) { returnIndex = state.idx; state.labReturnId = window.LESSON.slides[returnIndex].id; }
      var ov = document.querySelector('.startov'); if (ov) ov.remove();
      state.started = true; window.IL.go(index, true);
      syncNavigation();
    }
    var tools = document.querySelector('.tools');
    if (tools) tools.insertBefore(window.IL.h('button', { type: 'button', class: 'ib', text: '🧪', title: 'آزمایشگاه آزاد کسرها', 'aria-label': 'آزمایشگاه آزاد کسرها', onclick: open }), tools.firstChild);
    var modes = document.querySelector('.startov .modes');
    if (modes) modes.appendChild(window.IL.h('button', { type: 'button', class: 'modebtn', onclick: open }, window.IL.h('span', { class: 'e', text: '🧪' }), window.IL.h('b', { text: 'ورود به آزمایشگاه آزاد' }), window.IL.h('small', { text: 'کسرها را تغییر بده، بریز و ببین!' })));
    if (location.hash === '#lab') open();
    else syncNavigation();
  }
  document.addEventListener('DOMContentLoaded', install);
  return { render: render, calculate: calc };
})();
