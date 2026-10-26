/* لب‌کیت: موتور آزمایشگاه مجازی پای‌آموز.
   آزمایشگاه یک برنامهٔ تمام‌صفحه است، نه کاربرگ: صحنه، پنل جسم انتخاب‌شده، کشوی چالش‌ها و صفحهٔ نتایج.
   زیر آن موتور درس (kelas v1 و layout برابر worksheet) فقط ذخیره، امتیاز و گزارش را انجام می‌دهد:
   - فعالیت اول (gate: false) با render: LabKit.app({...}) صحنه را می‌سازد.
   - هر چالش یک فعالیت custom امتیازدار با render: LabKit.challenge({...}) است و کارت آن به کشوی چالش‌ها منتقل می‌شود.
   بدون وابستگی، شبکه یا eval؛ حالت فقط در api.state و ذخیره فقط با api.save. */
var LabKit = (function () {
  'use strict';
  var VERSION = '0.3.1';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  var EVENT_CAP = 120; // سقف رویداد هر بار باز شدن آزمایشگاه؛ برای پر نشدن گزارش
  var CURRENT = null;  // آزمایشگاه باز؛ چالش‌ها در همان رندر به آن می‌پیوندند

  function fa(x) { return String(x).replace(/(\d)\.(\d)/g, '$1٫$2').replace(/\d/g, function (d) { return FA[d]; }); }
  function round(v, d) { var p = Math.pow(10, d == null ? 2 : d); return Math.round(v * p) / p; }
  /* عدد فارسی با تعداد رقم اعشار ثابت؛ trim صفرهای انتهایی را حذف می‌کند. */
  function fmt(v, d, trim) {
    if (!isFinite(v)) return '—';
    var s = round(v, d == null ? 2 : d).toFixed(d == null ? 2 : d);
    if (trim && s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (/^-0(\.0*)?$/.test(s)) s = s.slice(1);
    return fa(s).replace(/^-/, '−');
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function snap(v, step, min) { var b = min || 0; return round(b + Math.round((v - b) / step) * step, 6); }
  function strip(html) { return String(html).replace(/<[^>]+>/g, ''); }

  /* عدد شبه‌تصادفی بذردار (mulberry32) تا آزمایش‌ها تکرارپذیر و قابل ادامه باشند. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* مقدار قابل مشاهده؛ به‌جای Property در PhET. */
  function prop(value, normalize) {
    var subs = [];
    return {
      get: function () { return value; },
      set: function (v) {
        if (normalize) v = normalize(v);
        if (v === value) return;
        var old = value; value = v;
        subs.slice().forEach(function (f) { f(v, old); });
      },
      on: function (f) { subs.push(f); return function () { var i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; }
    };
  }

  function svg(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }
  function attr(el, attrs) { for (var k in attrs) { if (attrs[k] == null) el.removeAttribute(k); else el.setAttribute(k, attrs[k]); } return el; }

  /* تبدیل مختصات مدل به نما؛ محور y مدل رو به بالاست. */
  function transform(o) {
    var s = o.scale;
    return {
      scale: s,
      x: function (mx) { return o.vx + (mx - o.mx) * s; },
      y: function (my) { return o.vy - (my - o.my) * s; },
      len: function (m) { return m * s; },
      mx: function (vx) { return o.mx + (vx - o.vx) / s; },
      my: function (vy) { return o.my - (vy - o.vy) / s; }
    };
  }

  /* ساعت با گام ثابت؛ وقتی مدل آرام است فریم درخواست نمی‌کند تا باتری گوشی مصرف نشود. */
  function clock(o) {
    var dt = o.dt || 1 / 240, acc = 0, last = null, raf = 0, alive = true, playing = true, speed = 1;
    var hasRaf = typeof requestAnimationFrame === 'function';
    function frame(t) {
      raf = 0;
      if (!alive) return;
      var e = last == null ? 0 : Math.min(0.1, (t - last) / 1000);
      last = t;
      if (playing) {
        acc += e * speed;
        var n = 0;
        while (acc >= dt && n < 2000) { o.step(dt); acc -= dt; n++; }
        if (n >= 2000) acc = 0;
      }
      if (o.render) o.render();
      if (playing && !(o.idle && o.idle())) raf = requestAnimationFrame(frame);
      else last = null;
    }
    function wake() { if (alive && hasRaf && !raf) raf = requestAnimationFrame(frame); }
    return {
      wake: wake,
      play: function () { playing = true; wake(); },
      pause: function () { playing = false; },
      playing: function () { return playing; },
      setSpeed: function (k) { speed = k; },
      speed: function () { return speed; },
      stepOnce: function (sec) { var n = Math.round((sec || 1 / 30) / dt); for (var i = 0; i < n; i++) o.step(dt); if (o.render) o.render(); },
      dispose: function () { alive = false; if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf); raf = 0; }
    };
  }

  /* کشیدن با اشاره‌گر/لمس و جابه‌جایی با صفحه‌کلید روی یک عنصر SVG.
     لمس کوتاه بدون جابه‌جایی o.tap را صدا می‌زند؛ در گوشی جایگزین کشیدن دقیق است. */
  var TAP_PX = 10, TAP_MS = 450;
  function draggable(el, svgRoot, o) {
    var active = null, sx = 0, sy = 0, st = 0, moved = false;
    function point(e) {
      var m = svgRoot.getScreenCTM();
      if (!m) return {x: 0, y: 0};
      var p = svgRoot.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      p = p.matrixTransform(m.inverse());
      return {x: p.x, y: p.y};
    }
    function down(e) {
      if (e.button != null && e.button > 0) return;
      if (o.enabled && !o.enabled()) return;
      e.preventDefault();
      active = e.pointerId; sx = e.clientX; sy = e.clientY; st = Date.now(); moved = false;
      // start ممکن است عنصر را برای رفتن به رو جابه‌جا کند؛ این کار capture را می‌اندازد، پس capture بعد از آن است.
      if (o.start) o.start(point(e));
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      el.classList.add('lab-dragging');
    }
    function move(e) {
      if (active !== e.pointerId) return;
      e.preventDefault();
      if (!moved && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < TAP_PX) return; // لرزش انگشت کشیدن نیست
      moved = true;
      if (o.move) o.move(point(e));
    }
    function up(e) {
      if (active !== e.pointerId) return;
      active = null; el.classList.remove('lab-dragging');
      var tap = !moved && e.type === 'pointerup' && Date.now() - st < TAP_MS;
      if (o.end) o.end(point(e), tap);
      if (tap && o.tap) o.tap();
    }
    function key(e) {
      if (!o.key) return;
      var d = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1]}[e.key];
      if (d) { e.preventDefault(); o.key(d[0], d[1], e.shiftKey); return; }
      if ((e.key === 'Enter' || e.key === ' ') && o.activate) { e.preventDefault(); o.activate(); }
    }
    // touch-action روی عنصرهای درون SVG اعمال نمی‌شود؛ بدون لغو touchstart، مرورگر لمس را پیمایش صفحه می‌گیرد و کشیدن را با pointercancel قطع می‌کند.
    function touchStart(e) { if (!o.enabled || o.enabled()) e.preventDefault(); }
    el.setAttribute('tabindex', '0');
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', down);
    el.addEventListener('touchstart', touchStart, {passive: false});
    el.addEventListener('keydown', key);
    // حرکت و رها کردن روی window شنیده می‌شوند (رویداد capture‌شده هم به آن می‌رسد)؛ اگر capture از دست برود، کشیدن باز هم تمام می‌شود.
    window.addEventListener('pointermove', move, {passive: false});
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return function () { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }

  function prefersReducedMotion() {
    try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }

  /* ---------- برنامهٔ تمام‌صفحهٔ آزمایشگاه ---------- */
  function app(def) {
    var render = function (host, api) {
      autoStart();
      return api.session().started ? mountApp(host, api, def) : mountWaiting(api);
    };
    render.labKitApp = true; // سازنده پیکربندی ناسازگار را پیش از نوشتن HTML رد می‌کند.
    return render;
  }

  /* در قاب، گذشت زمان مجوز شروع نیست؛ init دیررس باید پیش از هر تعامل اعمال شود.
     env برای آزمون بدون DOM واقعی است؛ در مرورگر همان window مصرف می‌شود. */
  function startWhenReady(go, env) {
    var win = env || window, fired = false, timer = null, alive = true;
    var embedded = win.parent && win.parent !== win;
    function cancel() {
      alive = false;
      win.removeEventListener('message', onMessage);
      if (timer !== null) win.clearTimeout(timer);
      timer = null;
    }
    function schedule() {
      if (!alive || fired || timer !== null) return;
      timer = win.setTimeout(function () {
        timer = null;
        if (!alive || fired) return;
        fired = true; cancel(); go();
      }, 0); // ابتدا شنوندهٔ موتور باید init را پردازش کند.
    }
    function onMessage(e) {
      var m = e.data;
      if (e.source === win.parent && m && m.ns === 'kelas' && m.v === 1 && m.kind === 'init') schedule();
    }
    if (embedded) win.addEventListener('message', onMessage);
    else schedule();
    return cancel;
  }

  /* از نو در هر فراخوانی یک کپی تازه از پیش‌فرض‌ها می‌گیرد؛ تغییر مدل یا ذخیره، آن‌ها را عوض نمی‌کند. */
  function resetter(initial, restore) {
    var saved = JSON.stringify(initial);
    if (typeof saved !== 'string') throw Error('مقادیر اولیهٔ آزمایشگاه باید JSON باشند.');
    return function () { restore(JSON.parse(saved)); };
  }

  var AUTO = false;
  function autoStart() {
    if (AUTO) return;
    AUTO = true;
    startWhenReady(function () {
      var b = document.querySelector('.startov .modebtn.primary');
      if (b) b.click();
    });
  }

  function mountWaiting(api) {
    var root = api.h('div', {class: 'lab-app lab-wait', role: 'status', 'aria-live': 'polite'},
      api.h('b', {text: 'در حال آماده‌سازی آزمایشگاه…'}),
      api.h('p', {text: 'منتظر دریافت پیشرفت قبلی از سایت هستیم.'}));
    document.body.appendChild(root);
    document.documentElement.classList.add('lab-app-open', 'lab-app-waiting');
    api.onDispose(function () {
      root.remove();
      document.documentElement.classList.remove('lab-app-waiting');
      if (!document.querySelector('.lab-app')) document.documentElement.classList.remove('lab-app-open');
    });
    return null;
  }

  function mountApp(host, api, def) {
    var h = api.h, st = api.state;
    st.v = st.v && typeof st.v === 'object' ? st.v : {};
    var lab = {api: api, state: st, fa: fa, fmt: fmt, round: round, clamp: clamp, snap: snap, svg: svg, attr: attr, rng: rng, prop: prop, transform: transform, reducedMotion: prefersReducedMotion(), h: h};
    var cleanups = [], draws = [], resets = [], persists = [], props = {}, events = 0, saveTimer = 0, drawQueued = false, alive = true, clk = null;
    var challenges = [], context = function () { return {}; };

    // پوستهٔ موتور درس زیر این لایه پنهان می‌ماند؛ toast و confetti موتور روی آن دیده می‌شوند.
    var root = h('div', {class: 'lab-app', 'data-lab-app': def.id || 'lab'});
    var top = h('header', {class: 'lab-top'});
    var title = h('div', {class: 'lab-title'}, h('span', {class: 'lab-title-icon', 'aria-hidden': 'true', text: def.icon || '🧪'}), h('b', {text: def.title || api.lesson.title}));
    var btnChallenges = h('button', {type: 'button', class: 'lab-topbtn lab-primary', 'data-lab': 'open-challenges', 'aria-haspopup': 'dialog'});
    var btnResults = h('button', {type: 'button', class: 'lab-topbtn', 'data-lab': 'open-results', 'aria-haspopup': 'dialog', text: '📋 نتایج'});
    var btnMenu = h('button', {type: 'button', class: 'lab-topbtn lab-icon', 'data-lab': 'open-menu', 'aria-haspopup': 'menu', 'aria-label': 'گزینه‌های بیشتر', text: '⋯'});
    top.appendChild(title); top.appendChild(h('div', {class: 'lab-top-actions'}, btnChallenges, btnResults, btnMenu));
    var body = h('div', {class: 'lab-body'});
    var stage = h('div', {class: 'lab-stage'});
    var panel = h('aside', {class: 'lab-panel', 'aria-label': 'جسم انتخاب‌شده و تنظیمات'});
    body.appendChild(stage); body.appendChild(panel);
    var menu = h('div', {class: 'lab-menu', role: 'menu', hidden: true});
    var live = h('div', {class: 'lab-live', 'aria-live': 'polite', role: 'status'});
    var coach = h('div', {class: 'lab-coach', 'aria-hidden': 'true', hidden: true});
    stage.appendChild(coach);
    root.appendChild(top); root.appendChild(body); root.appendChild(menu); root.appendChild(live);
    var sheets = {};
    function sheet(id, label) {
      var list = h('div', {class: 'lab-sheet-body'});
      var close = h('button', {type: 'button', class: 'lab-topbtn lab-icon', 'aria-label': 'بستن', 'data-lab': 'close-' + id, text: '✕', onclick: function () { show(null); }});
      var el = h('div', {class: 'lab-sheet', role: 'dialog', 'aria-label': label, 'data-sheet': id, hidden: true}, h('div', {class: 'lab-sheet-head'}, h('b', {text: label}), close), list);
      root.appendChild(el);
      sheets[id] = {el: el, body: list};
      return sheets[id];
    }
    var chSheet = sheet('challenges', 'چالش‌های آزمایشگاه');
    var resSheet = sheet('results', 'نتایج آزمایش‌ها');
    function show(id) {
      Object.keys(sheets).forEach(function (k) { sheets[k].el.hidden = k !== id; });
      menu.hidden = true;
      root.classList.toggle('lab-sheet-open', !!id);
      if (id === 'results') renderResults();
      if (id) { var f = sheets[id].el.querySelector('button, input'); if (f) f.focus(); }
      else btnChallenges.focus();
    }
    lab.show = show;
    btnChallenges.onclick = function () { show(sheets.challenges.el.hidden ? 'challenges' : null); };
    btnResults.onclick = function () { show(sheets.results.el.hidden ? 'results' : null); };
    btnMenu.onclick = function () { menu.hidden = !menu.hidden; if (!menu.hidden) { var f = menu.querySelector('button'); if (f) f.focus(); } };

    document.body.appendChild(root);
    document.documentElement.classList.add('lab-app-open');
    lab.root = root; lab.stage = stage; lab.panel = panel;

    function on(target, type, fn, opt) { target.addEventListener(type, fn, opt); cleanups.push(function () { target.removeEventListener(type, fn, opt); }); }
    lab.on = on;
    lab.alive = function () { return alive && api.isActive(); };
    on(root, 'keydown', function (e) { if (e.key === 'Escape') show(null); });

    /* ذخیره با تأخیر کوتاه تا کشیدن لغزنده هر لحظه پیام state نفرستد. */
    function flush() {
      saveTimer = 0;
      if (!lab.alive()) return;
      persists.forEach(function (f) { f(st); });
      api.save();
    }
    lab.save = function (now) {
      if (saveTimer) clearTimeout(saveTimer);
      if (now) flush(); else saveTimer = setTimeout(flush, 400);
    };
    lab.persist = function (f) { persists.push(f); };
    lab.emit = function (type, data) {
      if (!lab.alive() || events >= EVENT_CAP) return;
      events++;
      api.emit('lab.' + type, data || {});
    };
    lab.say = function (text) { live.textContent = ''; setTimeout(function () { live.textContent = text; }, 30); };
    lab.toast = function (text) { api.toast(text); };

    lab.draw = function (f) { draws.push(f); };
    lab.invalidate = function () {
      if (drawQueued || !alive) return;
      drawQueued = true;
      var run = function () { drawQueued = false; if (alive) draws.forEach(function (f) { f(); }); };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run); else setTimeout(run, 16);
    };
    lab.redrawNow = function () { drawQueued = false; draws.forEach(function (f) { f(); }); };
    lab.onReset = function (f, initial) { resets.push(arguments.length > 1 ? resetter(initial, f) : f); };

    /* متغیرهای آزمایشگاه؛ مقدار ذخیره‌شدهٔ نامعتبر کنار گذاشته می‌شود. */
    function bind(key, def0, normalize) {
      var saved = Object.prototype.hasOwnProperty.call(st.v, key) ? normalize(st.v[key]) : undefined;
      var p = prop(saved === undefined ? def0 : saved, function (v) { var n = normalize(v); return n === undefined ? p.get() : n; });
      p.key = key; p.initial = def0;
      st.v[key] = p.get();
      p.on(function (v) { st.v[key] = v; lab.invalidate(); lab.save(); });
      props[key] = p;
      return p;
    }
    lab.num = function (key, def0, min, max, step) {
      return bind(key, def0, function (v) {
        if (typeof v !== 'number' || !isFinite(v)) return undefined;
        v = clamp(v, min, max);
        return step ? clamp(snap(v, step, min), min, max) : v;
      });
    };
    lab.pick = function (key, def0, ids) { return bind(key, def0, function (v) { return ids.indexOf(v) >= 0 ? v : undefined; }); };
    lab.flag = function (key, def0) { return bind(key, def0, function (v) { return typeof v === 'boolean' ? v : undefined; }); };
    lab.props = props;

    /* ---------- کنترل‌ها ---------- */
    lab.section = function (titleText, parent) {
      var s = h('div', {class: 'lab-sec'}, titleText ? h('div', {class: 'lab-sec-title', text: titleText}) : null);
      (parent || panel).appendChild(s);
      return s;
    };
    lab.slider = function (o) {
      var p = o.prop, digits = o.digits == null ? 2 : o.digits;
      var box = h('div', {class: 'lab-ctl lab-slider'});
      var val = h('output', {class: 'lab-val'});
      box.appendChild(h('div', {class: 'lab-ctl-head'}, h('span', {class: 'lab-ctl-label', text: o.label}), val));
      var input = h('input', {type: 'range', min: o.min, max: o.max, step: o.step, 'aria-label': o.label, 'data-lab': o.id || p.key});
      function nudge(dir) {
        if (input.disabled) return;
        p.set(clamp(round(p.get() + dir * o.step, 6), o.min, o.max));
        commit();
      }
      var minus = h('button', {type: 'button', class: 'lab-step', 'aria-label': 'کم کردن ' + o.label, text: '−', onclick: function () { nudge(-1); }});
      var plus = h('button', {type: 'button', class: 'lab-step', 'aria-label': 'زیاد کردن ' + o.label, text: '+', onclick: function () { nudge(1); }});
      box.appendChild(h('div', {class: 'lab-slider-row'}, minus, input, plus));
      var startValue = p.get();
      function commit() {
        var v = p.get();
        if (v !== startValue) { lab.emit('change', {key: p.key, from: startValue, to: v}); if (o.commit) o.commit(v, startValue); }
        startValue = v;
      }
      input.addEventListener('input', function () { p.set(+input.value); });
      input.addEventListener('change', commit);
      function sync() {
        var off = o.disabled ? !!o.disabled() : false;
        input.disabled = off; minus.disabled = off; plus.disabled = off;
        box.classList.toggle('lab-off', off);
        if (+input.value !== p.get()) input.value = p.get();
        var text = fmt(p.get(), digits) + (o.unit ? ' ' + o.unit : '');
        val.textContent = text;
        input.setAttribute('aria-valuetext', text);
        input.style.setProperty('--fill', (100 * (p.get() - o.min) / (o.max - o.min)) + '%');
        if (o.hidden) box.hidden = !!o.hidden();
      }
      p.on(sync); lab.draw(sync); sync();
      (o.parent || panel).appendChild(box);
      return box;
    };
    lab.choice = function (o) {
      var p = o.prop, box = h('div', {class: 'lab-ctl lab-choice'}), buttons = [];
      if (o.label) box.appendChild(h('div', {class: 'lab-ctl-label', text: o.label}));
      var row = h('div', {class: 'lab-chips', role: 'radiogroup', 'aria-label': o.label || ''});
      o.options.forEach(function (opt) {
        var b = h('button', {type: 'button', role: 'radio', class: 'lab-chip', 'data-lab': (o.id || p.key) + '-' + opt.id},
          opt.swatch ? h('span', {class: 'lab-swatch', style: 'background:' + opt.swatch}) : null, h('span', {text: opt.t}));
        b.addEventListener('click', function () {
          var old = p.get(); p.set(opt.id);
          if (old !== opt.id) { lab.emit('change', {key: p.key, from: old, to: opt.id}); if (o.commit) o.commit(opt.id, old); }
        });
        b.addEventListener('keydown', function (e) {
          var k = {ArrowLeft: 1, ArrowRight: -1, ArrowDown: 1, ArrowUp: -1}[e.key];
          if (!k) return;
          e.preventDefault();
          var i = (buttons.indexOf(b) + k + buttons.length) % buttons.length;
          buttons[i].focus(); buttons[i].click();
        });
        buttons.push(b); row.appendChild(b);
      });
      function sync() {
        buttons.forEach(function (b, i) {
          var on = o.options[i].id === p.get();
          b.setAttribute('aria-checked', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
          b.classList.toggle('on', on);
        });
      }
      p.on(sync); sync();
      box.appendChild(row);
      (o.parent || panel).appendChild(box);
      return box;
    };
    lab.button = function (o) {
      var b = h('button', {type: 'button', class: o.cls || 'lab-tool', 'data-lab': o.id, 'aria-label': o.aria || null, text: o.text, onclick: o.onclick});
      (o.parent || panel).appendChild(b);
      return b;
    };
    lab.svgRoot = function (w, hgt, label) {
      var s = svg('svg', {viewBox: '0 0 ' + w + ' ' + hgt, class: 'lab-svg', role: 'img', 'aria-label': label || 'صحنهٔ آزمایش', preserveAspectRatio: 'xMidYMid meet'});
      stage.insertBefore(s, coach);
      return s;
    };
    lab.drag = function (el, svgRoot, o) { cleanups.push(draggable(el, svgRoot, o)); };
    lab.coach = function (text) { coach.textContent = text || ''; coach.hidden = !text; };

    /* ---------- ساعت و منوی ابزار ---------- */
    function menuItem(id, text, fn) {
      var b = h('button', {type: 'button', role: 'menuitem', class: 'lab-menu-item', 'data-lab': id, text: text, onclick: function () { fn(b); }});
      menu.appendChild(b);
      return b;
    }
    lab.clock = function (o) {
      clk = clock({dt: o.dt, step: o.step, idle: o.idle, render: function () { if (o.render) o.render(); lab.redrawNow(); }});
      var pauseBtn = menuItem('play', '⏸ مکث زمان', function () {
        if (clk.playing()) clk.pause(); else clk.play();
        syncPlay(); lab.emit('clock', {playing: clk.playing()});
      });
      function syncPlay() { pauseBtn.textContent = clk.playing() ? '⏸ مکث زمان' : '▶ ادامهٔ زمان'; }
      menuItem('step', '⏭ یک گام جلو', function () { if (clk.playing()) { clk.pause(); syncPlay(); } clk.stepOnce(1 / 15); });
      return clk;
    };
    lab.wake = function () { if (clk) clk.wake(); else lab.invalidate(); };

    /* از نو، با تأیید درون صفحه (confirm در sandbox بسته است). */
    var resetArmed = 0;
    var resetBtn = menuItem('reset', '↺ چیدن دوبارهٔ اجسام', function () {
      if (!resetArmed) {
        resetBtn.textContent = 'مطمئنی؟ دوباره بزن';
        resetBtn.classList.add('armed');
        resetArmed = setTimeout(disarm, 3500);
        return;
      }
      disarm(); menu.hidden = true;
      Object.keys(props).forEach(function (k) { if (!props[k].keep) props[k].set(props[k].initial); });
      resets.forEach(function (f) { f(); });
      lab.emit('reset', {});
      lab.toast('↺ اجسام سر جایشان برگشتند. نتایج و چالش‌ها پاک نشدند.');
      lab.save(true); lab.wake(); lab.invalidate();
    });
    function disarm() { if (resetArmed) clearTimeout(resetArmed); resetArmed = 0; resetBtn.textContent = '↺ چیدن دوبارهٔ اجسام'; resetBtn.classList.remove('armed'); }

    /* ---------- نمای افقی ---------- */
    /* چرخش خودکار در iframe بی‌اجازهٔ تمام‌صفحه ممکن نیست؛ پیشنهاد می‌دهیم گوشی را بچرخاند،
       و اگر چرخش خودکار گوشی خاموش است، خود آزمایشگاه را ۹۰ درجه می‌چرخانیم. */
    var rotateBtn = menuItem('rotate', '🔄 نمای افقی', function () { setRotated(!root.classList.contains('lab-rotated')); menu.hidden = true; });
    var rotateHint = h('div', {class: 'lab-rotate', hidden: true},
      h('span', {class: 'lab-rotate-icon', 'aria-hidden': 'true', text: '📱↻'}),
      h('span', {class: 'lab-rotate-text', text: 'برای آزمایشگاه بزرگ‌تر، گوشی را افقی کن.'}),
      h('button', {type: 'button', class: 'lab-topbtn lab-primary', 'data-lab': 'rotate-yes', text: 'نمای افقی', onclick: function () { setRotated(true); }}),
      h('button', {type: 'button', class: 'lab-topbtn lab-icon', 'data-lab': 'rotate-no', 'aria-label': 'نه، همین خوب است', text: '✕', onclick: function () { st.v.noRotate = true; lab.save(); layout(); }}));
    stage.appendChild(rotateHint);
    function setRotated(onOff) {
      root.classList.toggle('lab-rotated', onOff);
      st.v.noRotate = true; // پس از انتخاب کاربر، پیشنهاد دوباره نمی‌آید
      lab.emit('rotate', {on: onOff});
      lab.save(); layout();
    }
    function layout() {
      var portraitDevice = innerHeight > innerWidth;
      // اگر کاربر گوشی را واقعاً افقی کرد، چرخش CSS دیگر لازم نیست.
      if (!portraitDevice && root.classList.contains('lab-rotated')) root.classList.remove('lab-rotated');
      var rotated = root.classList.contains('lab-rotated');
      var w = rotated ? innerHeight : innerWidth, hh = rotated ? innerWidth : innerHeight;
      root.classList.toggle('lab-land', w > hh);
      root.classList.toggle('lab-port', w <= hh);
      root.classList.toggle('lab-narrow', w < 700);
      rotateBtn.textContent = rotated ? '🔄 نمای عمودی' : '🔄 نمای افقی';
      rotateBtn.hidden = !portraitDevice || innerWidth > 900;
      rotateHint.hidden = !(portraitDevice && innerWidth < 700 && !rotated && !st.v.noRotate);
      lab.invalidate();
    }
    on(window, 'resize', layout);
    on(window, 'orientationchange', layout);

    /* ---------- چالش‌ها ---------- */
    lab.context = function (f) { context = f; };
    function scored() { return challenges.filter(function (c) { return c.scored; }); }
    var resultKey = null;
    function syncChallenges() {
      var done = challenges.filter(function (c) { return c.api.isDone(); }).length;
      btnChallenges.textContent = '🎯 چالش‌ها ' + fa(done) + '/' + fa(challenges.length);
      var activeSet = false, results = [];
      challenges.forEach(function (c) {
        var isDone = c.api.isDone();
        results.push((isDone ? 1 : 0) + ":" + (c.scored ? c.stars() : 0));
        c.card.classList.toggle('lab-ch-done', isDone);
        var open = !isDone && !activeSet;
        if (open) activeSet = true;
        if (!c.userToggled) c.card.classList.toggle('lab-ch-open', open);
        c.badge.textContent = isDone ? (c.scored ? '⭐'.repeat(Math.max(0, c.stars())) || '✓' : '✓') : '';
      });
      // Notebook rows may arrive before the automatic challenge awards its stars.
      var key = results.join('|');
      if (key !== resultKey) {
        resultKey = key;
        if (!resSheet.el.hidden) renderResults();
      }
    }
    lab.adopt = function (c) {
      challenges.push(c);
      c.card.classList.add('lab-ch');
      var head = c.card.querySelector('h2');
      c.badge = h('span', {class: 'lab-ch-badge', 'aria-hidden': 'true'});
      if (head) {
        head.setAttribute('tabindex', '0'); head.setAttribute('role', 'button');
        head.appendChild(c.badge);
        var toggle = function () { c.userToggled = true; c.card.classList.toggle('lab-ch-open'); };
        head.addEventListener('click', toggle);
        head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      }
      chSheet.body.appendChild(c.card);
      api.faNodes(c.card);
      syncChallenges();
    };
    /* محتوا پس از هر آزمایش آرام‌گرفته یا تغییر مهم صدا می‌زند؛ همهٔ چالش‌های خودکار بررسی می‌شوند. */
    lab.changed = function (reason) {
      if (!lab.alive()) return;
      var ctx = context(reason);
      challenges.forEach(function (c) { if (c.auto) c.auto(ctx); });
      syncChallenges();
    };
    lab.challengeDone = function (c, text) {
      syncChallenges();
      if (sheets.challenges.el.hidden) lab.toast('🎉 چالش «' + c.title + '» انجام شد' + (c.scored && c.stars() ? ' — ' + '⭐'.repeat(c.stars()) : ''));
      lab.say(strip(text || ''));
    };
    lab.contextNow = function () { return context('read'); };
    lab.challenges = function () { return challenges.slice(); };

    /* ---------- نتایج ---------- */
    var bookCfg = null;
    st.book = Array.isArray(st.book) ? st.book.slice(-30) : [];
    lab.notebook = function (o) {
      bookCfg = o;
      st.book = st.book.slice(-(o.max || 30));
      return {
        add: function (row) {
          var last = st.book[st.book.length - 1];
          if (last && o.same && o.same(last, row)) return false;
          st.book.push(row);
          if (st.book.length > (o.max || 30)) st.book.shift();
          lab.save(); lab.emit('record', row);
          if (!sheets.results.el.hidden) renderResults();
          return true;
        },
        rows: function () { return st.book.slice(); }
      };
    };
    function renderResults() {
      var b = resSheet.body;
      b.innerHTML = '';
      var sc = scored(), stars = 0, max = sc.length * 3;
      sc.forEach(function (c) { stars += c.stars(); });
      var allDone = challenges.every(function (c) { return c.api.isDone(); });
      b.appendChild(h('div', {class: 'lab-score'}, h('b', {text: '⭐ ' + fa(stars) + ' از ' + fa(max)}), h('span', {text: fa(challenges.filter(function (c) { return c.api.isDone(); }).length) + ' از ' + fa(challenges.length) + ' چالش انجام شده'})));
      var list = h('ul', {class: 'lab-reslist'});
      challenges.forEach(function (c) {
        var d = c.api.isDone();
        list.appendChild(h('li', {class: d ? 'done' : ''}, h('span', {text: (d ? '✅ ' : '⬜ ') + c.title}), h('span', {class: 'lab-res-stars', text: d && c.scored ? '⭐'.repeat(c.stars()) : ''})));
      });
      b.appendChild(list);
      if (bookCfg) {
        b.appendChild(h('div', {class: 'lab-sec-title', text: '📒 دفترچهٔ آزمایش‌ها'}));
        if (!st.book.length) b.appendChild(h('p', {class: 'muted small', text: bookCfg.empty || 'هنوز آزمایشی ثبت نشده است. جسمی را در مایع بینداز.'}));
        else {
          var table = h('table', {class: 't lab-table'});
          var tr = h('tr');
          bookCfg.columns.forEach(function (c) { tr.appendChild(h('th', {scope: 'col', text: c.t})); });
          table.appendChild(h('thead', null, tr));
          var tbody = h('tbody');
          st.book.slice().reverse().forEach(function (row) {
            var r = h('tr');
            bookCfg.columns.forEach(function (c) { var v = row[c.id]; r.appendChild(h('td', {text: c.fmt ? c.fmt(v, row) : typeof v === 'number' ? fmt(v, 2) : v == null ? '' : String(v)})); });
            tbody.appendChild(r);
          });
          table.appendChild(tbody);
          b.appendChild(h('div', {class: 'tablewrap'}, table));
        }
      }
      var endIdx = -1;
      api.lesson.slides.forEach(function (s, i) { if (s.type === 'end') endIdx = i; });
      var finish = h('button', {type: 'button', class: 'btn acc lab-finish', 'data-lab': 'finish', text: allDone ? 'پایان آزمایش و گزارش نهایی' : 'اول چالش‌ها را کامل کن', disabled: allDone ? null : true,
        onclick: function () { if (allDone && endIdx >= 0 && window.IL) window.IL.go(endIdx); }});
      b.appendChild(finish);
      if (window.IL && window.IL.brand) b.appendChild(h('p', {class: 'lab-brand small muted', html: 'ساختهٔ <b>' + window.IL.brand.name + '</b> — ' + window.IL.brand.site.label}));
      api.faNodes(b);
    }
    lab.results = renderResults;

    api.onDispose(function () {
      alive = false;
      if (CURRENT === lab) CURRENT = null;
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = 0; persists.forEach(function (f) { f(st); }); }
      if (resetArmed) clearTimeout(resetArmed);
      if (clk) clk.dispose();
      cleanups.forEach(function (f) { try { f(); } catch (e) {} });
      if (root.parentNode) root.parentNode.removeChild(root);
      // کارت‌ها به صفحهٔ موتور برنمی‌گردند؛ موتور هنگام رندر بعد آن‌ها را از نو می‌سازد.
      if (!document.querySelector('.lab-app')) document.documentElement.classList.remove('lab-app-open');
    });

    CURRENT = lab;
    def.build(lab);
    layout();
    lab.redrawNow();
    api.faNodes(panel);
    syncChallenges();
    return lab;
  }

  /* ---------- یک چالش: فعالیت امتیازدار درس که درون آزمایشگاه نمایش داده می‌شود ---------- */
  /* spec: {title, steps:[{text, check(ctx)->true|string}], answer:{label, unit, check(v, ctx)->{ok, fb, tag}}, choices:{label, options:[{id,t}], check(id, ctx)}, success} */
  function challenge(spec) {
    return function (host, api) {
      var lab = CURRENT, h = api.h, st = api.state;
      var card = host.closest ? host.closest('.slide') : null;
      var c = {title: spec.title, api: api, card: card, scored: api.lesson.slides.some(function (s) { return s.render && s.stars !== false && s.gate !== false && s.type === 'custom' && s._lkSpec === spec; })};
      c.stars = function () { var r = api.get(spec.id); return r ? r.stars || 0 : 0; };
      var steps = spec.steps || [];
      st.mi = typeof st.mi === 'number' && st.mi >= 0 && st.mi <= steps.length ? st.mi : 0;
      if (api.isDone()) st.mi = steps.length;
      var stepBox = h('div', {class: 'lab-ch-steps'});
      host.appendChild(stepBox);
      function renderSteps() {
        stepBox.innerHTML = '';
        if (!steps.length) return;
        steps.forEach(function (s, k) {
          stepBox.appendChild(h('div', {class: 'lab-ch-step' + (k < st.mi ? ' done' : k === st.mi ? ' now' : '')}, h('span', {class: 'lab-ch-dot', text: k < st.mi ? '✓' : fa(k + 1)}), h('span', {html: s.text})));
        });
        api.faNodes(stepBox);
      }
      renderSteps();
      function complete(text, resp) {
        api.right(text || spec.success, resp == null ? null : resp);
        if (lab) lab.challengeDone(c, text || spec.success);
      }
      if (steps.length) c.auto = function (ctx) {
        if (!api.isActive() || st.mi >= steps.length) return;
        // چند گام پشت‌سرهم ممکن است با یک آزمایش برقرار شوند.
        for (var guard = 0; guard < steps.length && st.mi < steps.length; guard++) {
          var res = steps[st.mi].check(ctx);
          if (!res) break;
          st.mi++;
          api.emit('lab.step', {step: st.mi, of: steps.length});
          if (st.mi >= steps.length) { renderSteps(); complete(typeof res === 'string' ? res : null, spec.response ? spec.response(ctx) : null); api.save(); return; }
          api.sound('ok');
          if (lab) lab.toast('✅ ' + strip(steps[st.mi - 1].ok || 'یک گام از «' + spec.title + '» انجام شد'));
        }
        renderSteps(); api.save();
      };
      if (spec.answer) {
        st.ans = typeof st.ans === 'string' ? st.ans.slice(0, 40) : '';
        var a = spec.answer;
        var input = h('input', {type: 'text', inputmode: 'decimal', class: 'lab-input', 'aria-label': strip(a.label), 'data-lab': spec.id + '-answer', autocomplete: 'off'});
        input.value = st.ans;
        input.addEventListener('input', function () { st.ans = input.value.slice(0, 40); api.save(); });
        var send = h('button', {type: 'button', class: 'btn acc', text: a.button || 'ثبت پاسخ', 'data-lab': spec.id + '-send'});
        var submit = function () {
          var raw = input.value.trim(), v = parseNumber(raw);
          if (raw === '' || !isFinite(v)) { api.info('یک عدد بنویس؛ رقم فارسی یا انگلیسی فرقی ندارد.'); return; }
          var r = a.check(v, lab ? lab.contextNow() : {}) || {};
          if (r.ok) complete(r.fb, {value: v}); else api.wrong(r.fb, r.tag, {value: v});
        };
        send.addEventListener('click', submit);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
        host.appendChild(h('div', {class: 'lab-answer'}, h('div', {class: 'lab-ctl-label', html: a.label}), h('div', {class: 'lab-answer-row'}, input, a.unit ? h('span', {class: 'lab-unit', text: a.unit}) : null, send)));
      }
      if (spec.choices) {
        var ch = spec.choices, row = h('div', {class: 'lab-chips', role: 'group', 'aria-label': strip(ch.label || spec.title)});
        ch.options.forEach(function (o) {
          row.appendChild(h('button', {type: 'button', class: 'lab-chip', 'data-lab': spec.id + '-' + o.id, text: o.t, onclick: function () {
            var r = ch.check(o.id, lab ? lab.contextNow() : {}) || {};
            if (r.ok) complete(r.fb, {choice: o.id}); else api.wrong(r.fb, r.tag, {choice: o.id});
          }}));
        });
        host.appendChild(h('div', {class: 'lab-answer'}, ch.label ? h('div', {class: 'lab-ctl-label', html: ch.label}) : null, row));
      }
      // موتور کارت را پس از render در صفحه می‌گذارد؛ انتقال به کشوی چالش‌ها بعد از آن انجام می‌شود.
      if (lab && card) Promise.resolve().then(function () { if (lab.alive() && api.isActive()) lab.adopt(c); });
    };
  }

  /* عدد با رقم فارسی، عربی یا انگلیسی و ممیز «٫» یا «/» یا «،». */
  function parseNumber(raw) {
    var s = String(raw).trim()
      .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/[٫،,\/]/g, '.').replace(/[−–]/g, '-').replace(/\s+/g, '');
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return parseFloat(s);
  }

  /* شناسهٔ چالش و امتیازدار بودن آن از خود اسلاید خوانده می‌شود. */
  function slide(o) {
    var spec = o.challenge;
    spec.id = o.id;
    var s = {id: o.id, type: 'custom', q: o.title, noType: true, render: challenge(spec), hints: o.hints, note: o.note, _lkSpec: spec};
    if (o.stars === false) s.stars = false;
    spec.title = spec.title || o.title;
    return s;
  }

  return {VERSION: VERSION, app: app, challenge: challenge, slide: slide, startWhenReady: startWhenReady, resetter: resetter, fa: fa, fmt: fmt, round: round, clamp: clamp, snap: snap, rng: rng, prop: prop, svg: svg, transform: transform, clock: clock, parseNumber: parseNumber};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = LabKit;
