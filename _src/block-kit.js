/* ============ بلوک‌کیت — برنامه‌نویسی بلوکی مرحله‌ای روی لب‌کیت و Blockly (اول موبایل) ============
   هر درس فقط بلوک‌ها، مرحله‌ها و صحنه را می‌دهد؛ بلوک‌کیت این‌ها را فراهم می‌کند:
   - مرحله‌ها با جعبهٔ بلوکِ مخصوص هر مرحله، برنامهٔ آغازین (اشکال‌یابی)، سقف تعداد بلوک و برنامهٔ ذخیره‌شدهٔ جدا؛
   - اجرای گام‌به‌گام با روشن‌شدن بلوکِ در حال اجرا، توقف و سه سرعت؛
   - موبایل: «ضربه بزن تا اضافه شود»، حذف/برگشت با دکمه، جعبهٔ افقی پایین صفحه در نمای عمودی، شعاع چسبیدن بزرگ‌تر برای انگشت؛
   - چالش‌های لب‌کیت: هر مرحله یک چالش امتیازدار است (BlockKit.slides)؛
   - دعوت به کانال و سایت پای‌آموز (از brand.js) در منو، فهرست مرحله‌ها و کارت حل هر ۵ مرحله؛ هرگز شرط ادامه نیست.
   برنامهٔ کودک هرگز به متن تبدیل و اجرا نمی‌شود؛ درخت بلوک‌ها مستقیم پیموده می‌شود (CSP اجازهٔ eval نمی‌دهد).
   چرخش CSS لب‌کیت برای ویرایشگر کشیدنی امن نیست؛ نمای عمودی چیدمان خودش را دارد. */
var BlockKit = (function () {
  'use strict';
  var VERSION = '0.1.2', K = LabKit, fa = LabKit.fa;
  var SPEEDS = [{id: 'slow', icon: '🐢', label: 'آهسته', ms: 800}, {id: 'normal', icon: '🚶', label: 'عادی', ms: 460}, {id: 'fast', icon: '🐇', label: 'تند', ms: 170}];
  var defined = {}, themed = false;

  function define(def) {
    var fresh = def.blocks.filter(function (b) { return !defined[b.type]; });
    if (fresh.length) Blockly.common.defineBlocksWithJsonArray(fresh);
    fresh.forEach(function (b) { defined[b.type] = true; });
    if (themed) return;
    themed = true;
    Blockly.Theme.defineTheme('pyamooz-blocks', {name: 'pyamooz-blocks', base: Blockly.Themes.Classic,
      fontStyle: {family: 'Vazirmatn, Tahoma, sans-serif', weight: '700', size: 13},
      componentStyles: {workspaceBackgroundColour: '#f7f9fc', flyoutBackgroundColour: '#e8eef7', flyoutOpacity: 1, scrollbarColour: '#c3cedc', insertionMarkerColour: '#1d6fb8'}});
  }

  /* برنامهٔ ساده (['move', {repeat: 3, body: [...]}]) → JSON بلوک‌ها زیر بلوک شروع. */
  function program(def, list) {
    var typeOf = {};
    Object.keys(def.ops).forEach(function (t) { typeOf[def.ops[t]] = t; });
    function build(items) {
      var head = null, tail = null;
      (items || []).forEach(function (it) {
        var b;
        if (typeof it === 'string') b = {type: typeOf[it]};
        else {
          b = {type: def.loop.type, fields: {}, inputs: {}};
          b.fields[def.loop.field] = String(it.repeat);
          var body = build(it.body);
          if (body) b.inputs[def.loop.input] = {block: body};
        }
        if (!b.type) throw Error('بلوک ناشناخته در برنامهٔ مرحله: ' + JSON.stringify(it));
        if (tail) tail.next = {block: b}; else head = b;
        tail = b;
      });
      return head;
    }
    var hat = {type: def.hat, x: 24, y: 24, deletable: false};
    var first = build(list);
    if (first) hat.next = {block: first};
    return {blocks: {languageVersion: 0, blocks: [hat]}};
  }

  function toolbox(def, lv) {
    if (def.flow) return BlockFlow.toolbox(def, lv);
    var typeOf = {};
    Object.keys(def.ops).forEach(function (t) { typeOf[def.ops[t]] = t; });
    return {kind: 'flyoutToolbox', contents: lv.palette.map(function (p) {
      if (p === 'repeat') { var f = {}; f[def.loop.field] = String(def.loop.initial || 4); return {kind: 'block', type: def.loop.type, fields: f}; }
      return {kind: 'block', type: typeOf[p]};
    })};
  }

  /* فهرست دستورها با شناسهٔ بلوکِ هر دستور برای روشن‌کردن هنگام اجرا. */
  function compile(def, ws, max) {
    var start = ws.getBlocksByType(def.hat, false)[0];
    if (!start) return {error: 'start'};
    var ops = [], over = false;
    function walk(b) {
      for (; b && !over; b = b.getNextBlock()) {
        if (def.ops[b.type]) ops.push({t: def.ops[b.type], id: b.id});
        else if (b.type === def.loop.type) {
          var n = parseInt(b.getFieldValue(def.loop.field), 10) || 0, body = b.getInputTargetBlock(def.loop.input);
          for (var i = 0; i < n && body && !over; i++) walk(body);
        }
        if (ops.length > max) over = true;
      }
    }
    walk(start.getNextBlock());
    var used = start.getDescendants(false).filter(function (b) { return b !== start; });
    return {ops: ops.slice(0, max), over: over, blocks: used.length,
      loops: used.filter(function (b) { return b.type === def.loop.type; }).length,
      emptyLoop: used.some(function (b) { return b.type === def.loop.type && !b.getInputTargetBlock(def.loop.input); })};
  }

  /* پنل دعوت پای‌آموز: داده فقط از brand.js (KZ_BRAND و KZ_BRAND_QR) می‌آید.
     قاب سایت sandbox بدون allow-popups است و پیوند باز نمی‌شود؛ آن‌جا کد QR و نشانیِ قابل‌کپی نشان داده می‌شود. */
  function brandPanel(lab, h) {
    var B = typeof KZ_BRAND !== 'undefined' && KZ_BRAND && KZ_BRAND.channel ? KZ_BRAND : (window.IL && window.IL.brand);
    if (!B || !B.channel || !B.channel.url) return null;
    var embedded = window.parent !== window, panel = null, status = null;
    var app = B.channel.app || 'کانال';
    function qr() {
      var Q = typeof KZ_BRAND_QR !== 'undefined' && KZ_BRAND_QR.url === B.channel.url ? KZ_BRAND_QR : null;
      if (!Q) return null;
      var n = Q.n, fnd = function (x, y) {
        return '<rect x="' + (x + 0.5) + '" y="' + (y + 0.5) + '" width="6" height="6" rx="1.6" fill="none" stroke="#1b3f7a"/>' +
          '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" rx=".8" fill="#1b3f7a"/>';
      };
      return h('div', {class: 'bk-qr', role: 'img', 'aria-label': 'کد QR ' + app + ' ' + B.name,
        html: '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" width="100%" height="100%" aria-hidden="true"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" rx="2" fill="#fff"/>' +
          '<path d="' + Q.d + '" fill="#1b3f7a"/>' + fnd(0, 0) + fnd(n - 7, 0) + fnd(0, n - 7) + '</svg>'});
    }
    function copy(text, input) {
      var DONE = '📋 نشانی کپی شد؛ در ایتا باز یا جست‌وجو کن.';
      var fallback = function () {
        var done = false;
        try { input.focus(); input.select(); done = document.execCommand('copy'); } catch (e) {}
        status.textContent = done ? DONE : 'نشانی انتخاب شد؛ انگشتت را نگه دار و «کپی» را بزن.';
      };
      try {
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { status.textContent = DONE; }, fallback);
        else fallback();
      } catch (e) { fallback(); }
    }
    function line(kind, label, url) {
      if (!embedded) return h('a', {class: 'bk-brand-link bk-brand-' + kind, href: url, target: '_blank', rel: 'noopener noreferrer', 'data-bk': 'brand-' + kind,
        onclick: function () { lab.emit('brand', {action: 'open', target: kind}); }}, h('b', {text: label}), h('span', {text: url.replace(/^https?:\/\//, '') + ' ↗'}));
      var input = h('input', {class: 'bk-brand-url', readonly: true, 'aria-label': label, 'data-bk': 'brand-url-' + kind, dir: 'ltr'});
      input.value = url;
      input.addEventListener('focus', function () { input.select(); });
      return h('div', {class: 'bk-brand-row'}, h('b', {text: label}), input,
        h('button', {type: 'button', class: 'bk-promo-btn', 'data-bk': 'brand-copy-' + kind, text: '📋 کپی',
          onclick: function () { lab.emit('brand', {action: 'copy', target: kind}); copy(url, input); }}));
    }
    function build() {
      var perks = ((B.cta && B.cta.perks) || []).map(function (t) { return h('span', {text: t}); });
      status = h('p', {class: 'bk-brand-status', role: 'status'});
      panel = h('div', {class: 'bk-brand', role: 'dialog', 'aria-label': app + ' و درس‌های بیشتر ' + B.name, hidden: true},
        h('div', {class: 'bk-brand-card'},
          h('button', {type: 'button', class: 'lab-topbtn lab-icon bk-brand-close', 'aria-label': 'بستن', 'data-bk': 'brand-close', text: '✕', onclick: close}),
          h('div', {class: 'bk-brand-kick', text: '📣 ' + app + ' ' + B.name}),
          h('h3', {text: 'درس‌ها و بازی‌های بیشتر منتظرت هستند!'}),
          h('p', {text: 'در ' + app + ' ' + B.name + ' عضو شو تا کارگاه‌ها، بازی‌ها و درس‌های تعاملی تازه را زودتر از همه ببینی.'}),
          perks.length ? h('div', {class: 'bk-brand-perks'}, perks) : null,
          h('div', {class: 'bk-brand-body'}, qr(),
            h('div', {class: 'bk-brand-lines'},
              embedded ? h('small', {class: 'bk-brand-hint', text: '📱 کد را با دوربین گوشی اسکن کن، یا نشانی را کپی کن.'}) : null,
              line('channel', app + ' ' + B.name, B.channel.url),
              B.site && B.site.url ? line('site', 'سایت ' + B.name, B.site.url) : null,
              status)),
          h('button', {type: 'button', class: 'btn acc bk-brand-back', 'data-bk': 'brand-back', text: 'برگشت به کارگاه', onclick: close})));
      panel.addEventListener('click', function (e) { if (e.target === panel) close(); });
      lab.root.appendChild(panel);
    }
    function close() { if (panel) panel.hidden = true; }
    return {
      open: function (where) { if (!panel) build(); status.textContent = ''; panel.hidden = false; lab.emit('brand', {action: 'show', where: where}); },
      close: close
    };
  }

  function app(def) {
    if (!def.levels || !def.levels.length) throw Error('بلوک‌کیت دست‌کم یک مرحله لازم دارد.');
    return K.app({id: def.id, title: def.title, icon: def.icon, build: function (lab) { mount(lab, def); }});
  }

  // Flyout focus is temporary; keep only a live block ID from the main workspace.
  function selection(workspace, focused) {
    var id = null;
    function remember(next) {
      var block = next && workspace.getBlockById(next);
      if (block && block.workspace === workspace && block.type) id = block.id;
    }
    return {
      remember: remember,
      clear: function () { id = null; },
      current: function () {
        var block = focused();
        if (block && block.workspace === workspace) remember(block.id);
        return id ? workspace.getBlockById(id) : null;
      }
    };
  }

  function mount(lab, def) {
    var st = lab.state, api = lab.api, h = api.h, levels = def.levels, byId = {};
    var maxOps = def.maxOps || 400, flow = !!def.flow, flowVars = null, interpreter = null, flowBefore = null;
    var editButtons = [], inputButtons = [], editEvent = 'start';
    if (flow && typeof BlockFlow === 'undefined') throw Error('ماژول block-flow لازم است.');
    if (flow) st.flow = st.flow && typeof st.flow === 'object' && !Array.isArray(st.flow) ? st.flow : {};
    levels.forEach(function (l, i) { byId[l.id] = l; l.index = i; });
    st.progs = st.progs && typeof st.progs === 'object' && !Array.isArray(st.progs) ? st.progs : {};
    st.solved = Array.isArray(st.solved) ? st.solved.filter(function (id) { return byId[id]; }) : [];
    st.runs = Number.isInteger(st.runs) && st.runs >= 0 ? st.runs : 0;
    st.speed = SPEEDS.some(function (s) { return s.id === st.speed; }) ? st.speed : 'normal';
    function firstOpen() { for (var i = 0; i < levels.length; i++) if (st.solved.indexOf(levels[i].id) < 0) return levels[i]; return levels[0]; }
    var level = byId[st.level] || firstOpen();
    st.level = level.id;
    var ws = null, choice = null, mode = null, running = false, timer = 0, last = null, observer = null, resizeTimer = 0, loading = false;
    var touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

    lab.root.classList.add('bk');
    var stage = lab.stage;

    // ---------- نوار مرحله، هدف، فهرست مرحله‌ها و کارت پیروزی ----------
    var brand = brandPanel(lab, h);
    function promoStrip(where, text) {
      if (!brand) return null;
      var t = h('span', {class: 'bk-promo-text', text: text});
      var el = h('div', {class: 'bk-promo', 'data-bk-promo': where}, t,
        h('button', {type: 'button', class: 'bk-promo-btn', 'data-bk': 'promo-' + where, text: '📣 کانال پای‌آموز', onclick: function () { brand.open(where); }}));
      el.setText = function (x) { t.textContent = x; };
      return el;
    }
    var prevBtn = h('button', {type: 'button', class: 'bk-nav', 'data-bk': 'prev', 'aria-label': 'مرحلهٔ قبل', text: '→'});
    var titleBtn = h('button', {type: 'button', class: 'bk-title', 'data-bk': 'levels', 'aria-haspopup': 'dialog'});
    var nextBtn = h('button', {type: 'button', class: 'bk-nav', 'data-bk': 'next', 'aria-label': 'مرحلهٔ بعد', text: '←'});
    var bar = h('div', {class: 'bk-levelbar'}, prevBtn, titleBtn, nextBtn);
    var goal = h('div', {class: 'bk-goal', 'aria-live': 'polite'});
    stage.insertBefore(goal, stage.firstChild);
    stage.insertBefore(bar, goal);
    var pickerGrid = h('div', {class: 'bk-picker-grid'});
    var picker = h('div', {class: 'bk-picker', role: 'dialog', 'aria-label': 'انتخاب مرحله', hidden: true},
      h('div', {class: 'bk-picker-head'}, h('b', {text: 'مرحله‌ها'}), h('button', {type: 'button', class: 'lab-topbtn lab-icon', 'aria-label': 'بستن', text: '✕', onclick: function () { picker.hidden = true; }})), pickerGrid,
      promoStrip('picker', '🎁 مرحله‌ها، بازی‌ها و درس‌های بیشتر در کانال پای‌آموز'));
    stage.appendChild(picker);
    var winText = h('p', {class: 'bk-win-text'});
    var winPromo = promoStrip('win', '');
    var winNext = h('button', {type: 'button', class: 'btn acc bk-win-next', 'data-bk': 'win-next'});
    var win = h('div', {class: 'bk-win', role: 'status', hidden: true},
      h('div', {class: 'bk-win-card'}, h('div', {class: 'bk-win-icon', 'aria-hidden': 'true', text: '🎉'}), winText,
        h('div', {class: 'bk-win-actions'}, winNext, h('button', {type: 'button', class: 'btn bk-win-stay', 'data-bk': 'win-stay', text: 'همین‌جا بمان', onclick: function () { win.hidden = true; }})),
        winPromo));
    stage.appendChild(win);
    // ضربه بیرون کارت آن را می‌بندد؛ کارت روی نوار مرحله نمی‌افتد تا رفتن به مرحلهٔ دیگر بسته نشود.
    win.addEventListener('click', function (e) { if (e.target === win) win.hidden = true; });
    function showWin() { win.style.top = (bar.offsetTop + bar.offsetHeight) + 'px'; win.hidden = false; }

    prevBtn.onclick = function () { if (level.index > 0) setLevel(levels[level.index - 1].id); };
    nextBtn.onclick = function () { if (level.index < levels.length - 1) setLevel(levels[level.index + 1].id); };
    titleBtn.onclick = function () { win.hidden = true; renderPicker(); picker.hidden = !picker.hidden; };
    winNext.onclick = function () {
      win.hidden = true;
      if (level.index < levels.length - 1) setLevel(levels[level.index + 1].id); else lab.show('results');
    };
    // دکمهٔ «برو به این مرحله» در کارت چالش‌ها
    lab.on(lab.root, 'click', function (e) {
      var b = e.target.closest && e.target.closest('[data-bk-level]');
      if (b && byId[b.getAttribute('data-bk-level')]) { setLevel(b.getAttribute('data-bk-level')); lab.show(null); }
    });

    function renderBar() {
      titleBtn.textContent = (st.solved.indexOf(level.id) >= 0 ? '✅ ' : '') + 'مرحلهٔ ' + fa(level.index + 1) + ' از ' + fa(levels.length) + ' · ' + level.title + ' ▾';
      prevBtn.disabled = level.index === 0;
      nextBtn.disabled = level.index === levels.length - 1;
      goal.innerHTML = level.text;
      api.faNodes(goal);
    }
    function renderPicker() {
      pickerGrid.innerHTML = '';
      levels.forEach(function (l) {
        var done = st.solved.indexOf(l.id) >= 0;
        pickerGrid.appendChild(h('button', {type: 'button', class: 'bk-pick' + (done ? ' done' : '') + (l === level ? ' now' : ''), 'data-bk-pick': l.id,
          'aria-label': 'مرحلهٔ ' + fa(l.index + 1) + ': ' + l.title + (done ? '، حل شده' : ''), text: fa(l.index + 1),
          onclick: function () { picker.hidden = true; setLevel(l.id); }}));
      });
    }

    // ---------- صحنهٔ درس ----------
    var scene = def.scene(lab, {fa: fa});
    if (flow) lab.root.classList.add('bk-flow');

    // ---------- پنل: دکمه‌ها و میز بلوک‌ها ----------
    var panel = lab.panel;
    panel.classList.add('bk-panel');
    var actions = h('div', {class: 'bk-actions'});
    panel.appendChild(actions);
    function act(id, icon, label, fn, cls) {
      var b = h('button', {type: 'button', class: 'bk-act ' + (cls || ''), 'data-lab': id, 'aria-label': label, title: label},
        h('span', {class: 'bk-ico', 'aria-hidden': 'true', text: icon}), h('span', {class: 'bk-lbl', text: label}));
      b.onclick = fn;
      // دکمه نباید فوکوس را از Blockly بگیرد؛ وگرنه بلوکِ انتخاب‌شده (برای حذف یا افزودن) از دست می‌رود.
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      actions.appendChild(b);
      return b;
    }
    var runBtn = act('run', '▶', 'اجرا', run, 'bk-run');
    var stopBtn = act('stop', '⏹', 'توقف', function () { stop('⏹ اجرا متوقف شد.'); });
    var undoBtn = act('undo', '↶', 'برگرد', function () { if (ws && !running) ws.undo(false); });
    var delBtn = act('delete', '🗑', 'حذف بلوک', removeSelected);
    var speedBtn = act('speed', '🚶', 'سرعت', function () {
      var i = SPEEDS.findIndex(function (s) { return s.id === st.speed; });
      st.speed = SPEEDS[(i + 1) % SPEEDS.length].id; syncSpeed(); lab.save();
    });
    var fitBtn = flow ? act('fit', '⊡', 'نمایش کل برنامه', function () { if (ws && !running) ws.zoomToFit(); }) : null;
    var countChip = h('span', {class: 'bk-count', 'data-lab': 'count', 'aria-live': 'polite'});
    actions.appendChild(countChip);
    var wsBox = h('div', {class: 'bk-ws', 'data-lab': 'workspace'});
    panel.appendChild(wsBox);
    if (flow) flowControls();
    function syncSpeed() {
      var s = SPEEDS.filter(function (x) { return x.id === st.speed; })[0];
      speedBtn.querySelector('.bk-ico').textContent = s.icon;
      speedBtn.querySelector('.bk-lbl').textContent = s.label;
      speedBtn.setAttribute('aria-label', 'سرعت: ' + s.label);
    }
    syncSpeed();

    // گزینهٔ منو: پاک‌کردن برنامهٔ همین مرحله با تأیید دوباره
    var menu = lab.root.querySelector('.lab-menu'), armed = 0;
    var clearItem = h('button', {type: 'button', role: 'menuitem', class: 'lab-menu-item', 'data-lab': 'clear', text: '🧹 از نو: برنامهٔ این مرحله', onclick: function () {
      if (!armed) { clearItem.textContent = 'مطمئنی؟ دوباره بزن'; clearItem.classList.add('armed'); armed = setTimeout(disarm, 3500); return; }
      disarm(); if (menu) menu.hidden = true;
      stop(''); if (flow) { delete st.flow[level.id]; flowVars = BlockFlow.variables(def); last = null; } else delete st.progs[level.id]; load(start(level)); scene.home(); lab.coach('برنامهٔ این مرحله از نو شروع شد.'); lab.save();
    }});
    function disarm() { if (armed) clearTimeout(armed); armed = 0; clearItem.textContent = '🧹 از نو: برنامهٔ این مرحله'; clearItem.classList.remove('armed'); }
    if (menu) menu.insertBefore(clearItem, menu.firstChild);
    if (menu && brand) menu.insertBefore(h('button', {type: 'button', role: 'menuitem', class: 'lab-menu-item', 'data-lab': 'brand',
      text: '📣 کانال پای‌آموز و درس‌های بیشتر', onclick: function () { menu.hidden = true; brand.open('menu'); }}), menu.firstChild);

    function eventLabel(json) {
      var copy = JSON.parse(JSON.stringify(json));
      if (flow && copy.blocks && copy.blocks.blocks) copy.blocks.blocks.forEach(function (b) {
        if (b.type === def.hat) { b.fields = b.fields || {}; b.fields.EVENT = def.flow.events.find(function (e) { return e.id === editEvent; }).label; }
      });
      return copy;
    }
    function start(lv) { return flow ? eventLabel(BlockFlow.program(def, (lv.program || {})[editEvent] || [])) : program(def, lv.program || []); }
    function saved(lv) {
      var p = flow ? flowState().programs[editEvent] : st.progs[lv.id];
      return p && typeof p === 'object' && (!flow || BlockFlow.workspace(def, p)) ? p : start(lv);
    }
    function copy(v) { return JSON.parse(JSON.stringify(v)); }
    function flowState() {
      var f = st.flow[level.id];
      if (!f || typeof f !== 'object' || Array.isArray(f) || f.schema !== 1) f = st.flow[level.id] = {schema: 1, programs: {}, started: false};
      if (!f.programs || typeof f.programs !== 'object' || Array.isArray(f.programs)) f.programs = {};
      return f;
    }
    function allowedEvents() { return def.flow.events.filter(function (e) { return e.id === 'start' || (level.inputs || []).indexOf(e.id) >= 0; }); }
    function flowControls() {
      var editors = h('div', {class: 'bk-event-editors', role: 'group', 'aria-label': 'برنامهٔ کدام رویداد؟'});
      panel.insertBefore(editors, wsBox);
      var inputs = h('div', {class: 'bk-inputs', role: 'group', 'aria-label': 'کنترل بازی'});
      stage.appendChild(inputs);
      def.flow.events.forEach(function (e) {
        var edit = h('button', {type: 'button', class: 'bk-event', 'data-event-edit': e.id, text: e.label,
          onclick: function () { if (running || editEvent === e.id) return; save(); editEvent = e.id; flowState().editing = e.id; load(saved(level)); sync(); lab.save(); }});
        editors.appendChild(edit); editButtons.push({event: e.id, el: edit});
        if (e.id !== 'start') {
          var input = h('button', {type: 'button', class: 'bk-event bk-input', 'data-event-input': e.id, text: e.icon || e.label, 'aria-label': 'حرکت ' + e.label,
            onclick: function () { dispatch(e.id); }});
          inputs.appendChild(input); inputButtons.push({event: e.id, el: input});
        }
      });
      lab.on(lab.root, 'keydown', function (e) {
        var keys = {ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down'};
        if (!e.repeat && keys[e.key] && e.target.closest && e.target.closest('.bk-inputs')) { e.preventDefault(); dispatch(keys[e.key]); }
      });
      runBtn.querySelector('.bk-lbl').textContent = 'شروع بازی'; runBtn.setAttribute('aria-label', 'شروع بازی');
    }
    function flowSave(json) {
      var f = flowState(); f.programs[editEvent] = json; f.editing = editEvent;
      f.world = copy(flowBefore ? flowBefore.world : scene.snapshot());
      f.vars = copy(flowBefore ? flowBefore.vars : flowVars); f.started = flowBefore ? flowBefore.started : !!f.started;
      f.last = last;
    }
    function flowHome() {
      var f = flowState(), allowed = allowedEvents();
      editEvent = allowed.some(function (e) { return e.id === f.editing; }) ? f.editing : level.editEvent || 'start';
      flowVars = BlockFlow.variables(def, f.vars);
      if (!flowVars || !f.world || !scene.restore(copy(f.world))) {
        flowVars = BlockFlow.variables(def); f.started = false; scene.home();
      }
      last = f.last && f.last.level === level.id && typeof f.last.ok === 'boolean' ? f.last : null;
      if (scene.refresh) scene.refresh(flowVars);
    }
    function dispatch(event) {
      if (!ws || running || !lab.alive() || !allowedEvents().some(function (e) { return e.id === event; })) return;
      var f = flowState();
      if (event !== 'start' && (!f.started || (scene.terminal && scene.terminal()))) return;
      save();
      var programs = {}, total = 0;
      try {
        allowedEvents().forEach(function (e) {
          var scratch = new Blockly.Workspace();
          try {
            var json = f.programs[e.id] || BlockFlow.program(def, (level.program || {})[e.id] || []);
            if (!BlockFlow.workspace(def, json)) throw Error('برنامهٔ ذخیره‌شده معتبر نیست؛ آن رویداد را از نو بساز.');
            Blockly.serialization.workspaces.load(json, scratch);
            programs[e.id] = BlockFlow.compile(def, scratch); total += programs[e.id].blocks;
          } finally { scratch.dispose(); }
        });
        if (total > 120) throw Error('برنامه بزرگ شد؛ بلوک‌های اضافه را کم کن.');
      } catch (e) { lab.coach(e.message); return; }
      flowBefore = {world: copy(scene.snapshot()), vars: copy(flowVars), started: !!f.started};
      if (event === 'start') { scene.home(); flowVars = BlockFlow.variables(def); f.started = true; }
      if (scene.beforeEvent) scene.beforeEvent(event);
      var prog = {blocks: total, loops: 0};
      interpreter = BlockFlow.runner(programs[event].nodes, {event: event, vars: flowVars,
        act: function (op, vars, id) { scene.act(op, vars, id); }, test: function (condition, vars, id) { return scene.test(condition, vars, id); }});
      running = true; win.hidden = true; lab.coach(''); sync();
      var ms = SPEEDS.find(function (x) { return x.id === st.speed; }).ms;
      (function tick() {
        timer = 0;
        if (!running || !lab.alive()) return;
        try {
          var op = interpreter.next();
          if (op) {
            if (ws.getBlockById(op.id)) ws.highlightBlock(op.id);
            if (scene.refresh) scene.refresh(flowVars);
            timer = setTimeout(tick, ms); return;
          }
          flowBefore = null; interpreter = null;
          if (scene.afterEvent) scene.afterEvent(event, flowVars);
          if (scene.refresh) scene.refresh(flowVars);
          finish(prog);
        } catch (e) { stop(e.message); }
      })();
    }
    function save() {
      if (!ws || loading) return;
      var json = Blockly.serialization.workspaces.save(ws);
      if (JSON.stringify(json).length > 20000) return; // سقف هر مرحله؛ کل state زیر ۲۵۶ کیلوبایت می‌ماند
      if (flow) flowSave(json); else st.progs[level.id] = json;
      lab.save();
    }
    function load(json) {
      if (choice) choice.clear();
      loading = true;
      try {
        ws.clear();
        try { if (flow && !BlockFlow.workspace(def, json)) throw Error('workspace'); Blockly.serialization.workspaces.load(flow ? eventLabel(json) : json, ws); } catch (e) { ws.clear(); Blockly.serialization.workspaces.load(start(level), ws); }
        if (!ws.getBlocksByType(def.hat, false).length) { ws.clear(); Blockly.serialization.workspaces.load(start(level), ws); }
      } finally { loading = false; }
      ws.clearUndo();
      ws.scroll(0, 0);
      sync();
    }
    function hat() { return ws && ws.getBlocksByType(def.hat, false)[0]; }
    /* جعبهٔ افقیِ راست‌به‌چپ پس از عوض‌شدن بلوک‌ها گاهی جای خالی نشان می‌دهد؛ به ابتدای آن برمی‌گردیم. */
    function paletteStart() {
      var fly = ws && ws.getFlyout && ws.getFlyout();
      if (!fly || !fly.scrollToStart) return;
      fly.scrollToStart();
      setTimeout(function () { if (ws && fly.isVisible && fly.isVisible()) fly.scrollToStart(); }, 60);
    }
    function focusedBlock() {
      return Blockly.getSelected ? Blockly.getSelected() : (Blockly.common && Blockly.common.getSelected ? Blockly.common.getSelected() : null);
    }
    function selected() { return choice ? choice.current() : null; }
    function sync() {
      if (!ws) return;
      var root = hat(), n = root ? root.getDescendants(false).length - 1 : 0, max = level.maxBlocks;
      countChip.textContent = '🧩 ' + fa(n) + (max ? ' از ' + fa(max) : '');
      countChip.classList.toggle('over', !!max && n > max);
      countChip.setAttribute('aria-label', 'تعداد بلوک‌ها: ' + fa(n) + (max ? '، سقف ' + fa(max) : ''));
      var s = selected();
      delBtn.disabled = running || !s || s.type === def.hat;
      if (fitBtn) fitBtn.disabled = running;
      undoBtn.disabled = running;
      runBtn.disabled = running;
      stopBtn.disabled = !running;
      lab.root.classList.toggle('bk-running', running);
      if (flow) {
        var ids = allowedEvents().map(function (e) { return e.id; });
        editButtons.forEach(function (b) { b.el.hidden = ids.indexOf(b.event) < 0; b.el.disabled = running; b.el.setAttribute('aria-pressed', String(b.event === editEvent)); });
        inputButtons.forEach(function (b) { b.el.hidden = ids.indexOf(b.event) < 0; b.el.disabled = running || !flowState().started || !!(scene.terminal && scene.terminal()); });
      }
    }

    /* ضربه روی بلوکِ جعبه: بعد از بلوکِ انتخاب‌شده (یا داخل تکرارِ خالیِ انتخاب‌شده، یا ته برنامه) اضافه می‌شود و خودش انتخاب می‌شود. */
    function addFrom(flyBlock) {
      if (!ws || running) return;
      var json = Blockly.serialization.blocks.save(flyBlock, {addCoordinates: false, addInputBlocks: false, addNextBlocks: false});
      var sel = selected(), b;
      Blockly.Events.setGroup(true);
      try {
        b = Blockly.serialization.blocks.append(json, ws);
        var input = sel && (flow ? def.flow.rules[sel.type] && def.flow.rules[sel.type].input : sel.type === def.loop.type && def.loop.input);
        if (input && !sel.getInputTargetBlock(input)) sel.getInput(input).connection.connect(b.previousConnection);
        else if (sel && sel.nextConnection) sel.nextConnection.connect(b.previousConnection);
        else {
          var t = hat();
          while (t.getNextBlock()) t = t.getNextBlock();
          t.nextConnection.connect(b.previousConnection);
        }
      } finally { Blockly.Events.setGroup(false); }
      choice.remember(b.id);
      // ژست ضربه پس از این رویداد هنوز بلوکِ جعبه را انتخاب می‌کند؛ انتخاب بلوک تازه باید بعد از آن بیاید.
      setTimeout(function () {
        if (!ws || !b.workspace) return;
        // در Blockly ۱۳ انتخاب همان فوکوس است؛ select() به‌تنهایی انتخاب را جابه‌جا نمی‌کند.
        if (Blockly.getFocusManager) Blockly.getFocusManager().focusNode(b); else b.select();
        try { ws.scrollBoundsIntoView(b.getBoundingRectangle()); } catch (e) {}
        sync();
      }, 0);
      lab.emit('add', {type: b.type, by: 'tap'});
      if (!st.tapTip) { st.tapTip = true; lab.coach('👆 بلوک بعدی پشت همین بلوکِ انتخاب‌شده می‌آید. برای حذف، بلوک را لمس کن و 🗑 را بزن.'); }
    }
    function removeSelected() {
      var s = selected();
      if (!s || s.type === def.hat || running) { lab.coach('اول بلوکی را که می‌خواهی حذف کنی لمس کن.'); return; }
      Blockly.Events.setGroup(true);
      try { s.dispose(true, true); } finally { Blockly.Events.setGroup(false); }
      sync();
    }

    function wantMode() { return innerHeight > innerWidth * 1.05 ? 'port' : 'land'; }
    function inject() {
      if (!lab.alive()) return;
      var json = ws ? Blockly.serialization.workspaces.save(ws) : saved(level);
      if (ws) { ws.dispose(); ws = null; }
      if (observer) { observer.disconnect(); observer = null; }
      define(def);
      mode = wantMode();
      var small = Math.min(innerWidth, innerHeight) < 500;
      Blockly.config.snapRadius = touch ? 44 : 28;
      Blockly.config.connectingSnapRadius = touch ? 56 : 32;
      var opts = {toolbox: toolbox(def, level), rtl: true, renderer: 'zelos', theme: 'pyamooz-blocks', sounds: false,
        media: 'data:text/plain,', trashcan: false, maxBlocks: def.maxBlocks || 60,
        zoom: {controls: false, wheel: false, pinch: true, startScale: mode === 'port' ? 0.9 : small ? 0.78 : 0.92, minScale: 0.5, maxScale: 1.5},
        move: {scrollbars: !touch, drag: true, wheel: !touch}};
      var max = {}; max[def.hat] = 1; opts.maxInstances = max;
      if (mode === 'port') { opts.horizontalLayout = true; opts.toolboxPosition = 'end'; }
      lab.root.classList.toggle('bk-port', mode === 'port');
      ws = Blockly.inject(wsBox, opts);
      choice = selection(ws, focusedBlock);
      load(json);
      ws.addChangeListener(Blockly.Events.disableOrphans);
      ws.addChangeListener(function (e) {
        if (e.isUiEvent) { if (e.type === Blockly.Events.SELECTED) { choice.remember(e.newElementId); sync(); } return; }
        if (e.type === Blockly.Events.FINISHED_LOADING) return;
        if (loading) return;
        if (flow && !running && e.recordUndo !== false) { flowState().started = false; lab.coach('برنامه تغییر کرد؛ برای اجرای تازه، شروع بازی را بزن.'); }
        save(); sync();
      });
      var fly = ws.getFlyout && ws.getFlyout();
      if (fly) fly.getWorkspace().addChangeListener(function (e) {
        if (e.type === Blockly.Events.CLICK && e.targetType === 'block' && e.blockId) {
          var b = fly.getWorkspace().getBlockById(e.blockId);
          if (b) addFrom(b.getRootBlock());
        }
      });
      if (typeof ResizeObserver === 'function') { observer = new ResizeObserver(function () { if (ws) { Blockly.svgResize(ws); paletteStart(); } }); observer.observe(wsBox); }
      paletteStart();
    }
    lab.on(wsBox, 'pointerdown', function (e) {
      if (choice && e.target.classList && e.target.classList.contains('blocklyMainBackground')) choice.clear();
    }, true);
    lab.on(window, 'resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (ws && wantMode() !== mode && !running) inject(); }, 180);
    });
    // پیش از اندازه‌گیری متن بلوک‌ها قلم وزیرمتن باید آماده باشد.
    if (document.fonts && document.fonts.load) document.fonts.load('700 13px Vazirmatn').then(inject, inject);
    else setTimeout(inject, 0);
    lab.on(document, 'visibilitychange', function () { if (document.hidden) { if (flow && running) stop('اجرا متوقف شد؛ آخرین حرکت کامل حفظ شد.'); save(); lab.save(true); } });
    api.onDispose(function () {
      running = false;
      if (interpreter) interpreter.stop();
      clearTimeout(timer); clearTimeout(resizeTimer); disarm();
      if (observer) observer.disconnect();
      if (choice) choice.clear();
      choice = null;
      if (ws) { ws.dispose(); ws = null; }
    });

    // ---------- مرحله ----------
    function setLevel(id) {
      if (!byId[id]) return;
      stop('');
      save();
      level = byId[id];
      st.level = id;
      win.hidden = true; picker.hidden = true;
      scene.level(level);
      if (flow) flowHome(); else scene.home();
      if (ws) { ws.updateToolbox(toolbox(def, level)); paletteStart(); load(saved(level)); }
      renderBar();
      lab.coach('');
      lab.emit('level', {level: id});
      lab.save();
    }

    // ---------- اجرای گام‌به‌گام ----------
    function run() {
      if (flow) { dispatch('start'); return; }
      if (running || !ws) return;
      win.hidden = true;
      var prog = compile(def, ws, maxOps);
      if (prog.error) { load(start(level)); lab.coach('بلوک شروع برگشت؛ بلوک‌ها را زیرش بچسبان.'); return; }
      if (!prog.ops.length) {
        lab.coach(prog.emptyLoop ? '🔁 بلوک تکرار خالی است؛ بلوکی داخل دهانه‌اش بگذار.' : '🧩 هنوز بلوکی زیر بلوک شروع نچسبیده است. روی بلوکی در جعبه ضربه بزن.');
        return;
      }
      lab.coach('');
      if (Blockly.hideChaff) Blockly.hideChaff();
      scene.home();
      running = true; sync();
      var i = 0, ms = SPEEDS.filter(function (s) { return s.id === st.speed; })[0].ms;
      lab.emit('run', {level: level.id, blocks: prog.blocks, loops: prog.loops, ops: prog.ops.length});
      (function tick() {
        timer = 0;
        if (!running || !lab.alive()) return;
        if (i >= prog.ops.length) return finish(prog);
        var op = prog.ops[i++];
        if (ws.getBlockById(op.id)) ws.highlightBlock(op.id);
        if (!scene.step(op.t, ms)) return finish(prog);
        timer = setTimeout(tick, ms);
      })();
    }
    function stop(text) {
      if (!running) { if (text) lab.coach(text); return; }
      running = false;
      if (interpreter) { interpreter.stop(); interpreter = null; }
      if (flowBefore) {
        scene.restore(copy(flowBefore.world)); flowVars = copy(flowBefore.vars); flowState().started = flowBefore.started; flowBefore = null;
        if (scene.refresh) scene.refresh(flowVars);
      }
      clearTimeout(timer); timer = 0;
      if (ws) ws.highlightBlock(null);
      sync();
      if (text) lab.coach(text);
      if (flow) save();
    }
    function finish(prog) {
      running = false; sync();
      setTimeout(function () { if (ws && !running) ws.highlightBlock(null); }, 400);
      var r = scene.finish();
      var within = !level.maxBlocks || prog.blocks <= level.maxBlocks, ok = !!r.ok && within;
      st.runs++;
      last = {level: level.id, ok: ok, goal: !!r.ok, blocks: prog.blocks, loops: prog.loops};
      var text = r.ok && !within ? '✅ به هدف رسیدی! حالا همین کار را با ' + fa(level.maxBlocks) + ' بلوک یا کمتر انجام بده (الان ' + fa(prog.blocks) + ' تاست).' : r.text;
      lab.coach(ok ? '' : text);
      lab.say(text);
      book.add({lv: level.index + 1, b: prog.blocks, r: ok ? 'ok' : r.ok ? 'many' : r.label || 'none'});
      lab.changed('run');
      if (ok) {
        if (st.solved.indexOf(level.id) < 0) st.solved.push(level.id);
        var ch = lab.challenges().filter(function (c) { return c.title === titleOf(level); })[0], stars = ch && ch.scored ? ch.stars() : 0;
        winText.innerHTML = (stars ? '<span class="bk-win-stars">' + '⭐'.repeat(stars) + '</span><br>' : '') + text;
        winNext.textContent = level.index < levels.length - 1 ? 'مرحلهٔ بعد ←' : '📋 دیدن نتایج';
        if (winPromo) { // دعوت فقط در نقطه‌های عطف، نه بعد از هر مرحله
          var lastOne = level.index === levels.length - 1, milestone = lastOne || (level.index + 1) % (def.promoEvery || 5) === 0;
          winPromo.hidden = !milestone;
          winPromo.setText(lastOne ? '🏆 همهٔ مرحله‌ها را حل کردی! برای کارگاه‌ها و بازی‌های تازه، عضو کانال پای‌آموز شو.'
            : '🌟 ' + fa(level.index + 1) + ' مرحله را حل کردی! درس‌ها و بازی‌های بیشتر در کانال ایتای پای‌آموز است.');
        }
        api.faNodes(win);
        showWin();
        renderBar();
      }
      save();
      lab.save();
    }

    lab.context(function () { return {runs: st.runs, last: last}; });
    var RESULT = {ok: '✅ حل شد', many: '🧩 بلوک زیاد', bump: '💥 دیوار', none: 'به هدف نرسید'};
    var book = lab.notebook({columns: [
      {id: 'lv', t: 'مرحله', fmt: function (v) { return fa(v); }},
      {id: 'b', t: 'بلوک', fmt: function (v) { return fa(v); }},
      {id: 'r', t: 'نتیجه', fmt: function (v) { return RESULT[v] || (def.results && def.results[v]) || ''; }}
    ], max: 30, empty: 'هنوز برنامه‌ای اجرا نشده است. بلوک بچین و ▶ را بزن.'});

    scene.level(level);
    if (flow) flowHome(); else scene.home();
    if (flow) lab.persist(function () {
      if (ws && !loading) { var json = Blockly.serialization.workspaces.save(ws); if (JSON.stringify(json).length <= 20000) flowSave(json); }
    });
    renderBar();
    sync();
  }

  /* هر مرحله یک چالش امتیازدار لب‌کیت است؛ دکمهٔ داخل کارت همان مرحله را باز می‌کند. */
  function titleOf(l) { return 'مرحلهٔ ' + fa(l.index + 1) + ': ' + l.title; }
  function slides(def, o) {
    o = o || {};
    return def.levels.map(function (l, i) {
      l.index = i;
      return K.slide({id: l.id, stage: o.stage || 'lab', title: titleOf(l), hints: l.hints,
        challenge: {steps: [{text: l.text + ' <button type="button" class="bk-go" data-bk-level="' + l.id + '">▶ برو به این مرحله</button>',
          check: function (c) { return !!(c.last && c.last.level === l.id && c.last.ok); }}],
          success: l.success || 'مرحلهٔ ' + fa(i + 1) + ' حل شد!',
          response: function (c) { return {blocks: c.last && c.last.blocks, loops: c.last && c.last.loops}; }}});
    });
  }

  return {VERSION: VERSION, app: app, slides: slides, program: program, toolbox: toolbox, compile: compile, selection: selection};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BlockKit;
