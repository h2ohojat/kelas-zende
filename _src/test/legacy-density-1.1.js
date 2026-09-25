/* ================================================================
   محتوای درس — «راز شناوری» (چگالی، علوم هفتم)
   فقط همین بخش را برای ساختن درس تازه تغییر دهید.
   ================================================================ */

var U = '<span class="ltr">g/cm³</span>';
/* آیکون‌های ساده (به‌جای ایموجی‌هایی که روی ویندوزهای قدیمی نمایش داده نمی‌شوند) */
var IC = {
  log: '<svg viewBox="0 0 90 40" width="90" height="40"><rect x="2" y="6" width="80" height="28" rx="12" fill="#a0673a" stroke="#5c3a1e" stroke-width="3"/><ellipse cx="80" cy="20" rx="8" ry="14" fill="#e3b77f" stroke="#5c3a1e" stroke-width="3"/><ellipse cx="80" cy="20" rx="3" ry="6" fill="none" stroke="#a0673a" stroke-width="2"/></svg>',
  coin: '<svg viewBox="0 0 40 40" width="34" height="34"><circle cx="20" cy="20" r="16" fill="#f0c33c" stroke="#9c7a12" stroke-width="3"/><circle cx="20" cy="20" r="10" fill="none" stroke="#c89b1e" stroke-width="2"/></svg>',
  stone: '<svg viewBox="0 0 44 36" width="40" height="32"><path d="M6 22 C4 12 14 4 24 5 C35 6 42 14 39 24 C36 32 22 34 14 32 C9 31 7 27 6 22Z" fill="#8d9199" stroke="#50545c" stroke-width="3"/></svg>'
};
var OBJS = [
  { id: 'log', t: 'تنهٔ درخت بزرگ (۴۰ کیلوگرم!)', ic: IC.log, rho: 0.6, w: 84 },
  { id: 'nail', t: 'میخ آهنی کوچک', ic: '🔩', rho: 7.9 },
  { id: 'ice', t: 'تکه یخ', ic: '🧊', rho: 0.92 },
  { id: 'apple', t: 'سیب', ic: '🍎', rho: 0.85 },
  { id: 'coin', t: 'سکهٔ فلزی', ic: IC.coin, rho: 8.9 },
  { id: 'egg', t: 'تخم‌مرغ تازه', ic: '🥚', rho: 1.03 },
  { id: 'candle', t: 'شمع', ic: '🕯️', rho: 0.9 },
  { id: 'stone', t: 'سنگ‌ریزه', ic: IC.stone, rho: 2.6 }
];

var LESSON = {
  id: 'density-g7-v1',
  title: 'راز شناوری',
  subtitle: 'چگالی — علوم هفتم',
  grade: 'پایهٔ هفتم (متوسطهٔ اول)',
  subject: 'علوم تجربی',
  duration: '۳۵ تا ۴۵ دقیقه',
  mascot: '🚢',
  theme: { p: '#0f7c8c', pSoft: '#e1f4f6', pInk: '#0b4f5a', a: '#f4a340', aSoft: '#fff2df', bg: '#f3f7f7' },
  intro: '<p>یک کشتی آهنیِ هزاران تُنی روی آب می‌ماند، اما یک میخ کوچکِ آهنی غرق می‌شود. <b>چرا؟</b> مأموریت امروزت کشف این راز است.</p>',
  objectives: [
    'توضیح بدهم چرا <b>وزن</b> یا <b>اندازه</b> به‌تنهایی تعیین نمی‌کند جسمی غرق شود یا نه.',
    'چگالی را با رابطهٔ <b>جرم ÷ حجم</b> حساب کنم و یکایش را درست بنویسم.',
    'با مقایسهٔ چگالی با آب، شناوری را پیش‌بینی کنم و راز شناوری کشتی را توضیح بدهم.'
  ],
  stages: [
    { id: 'p', title: 'پیش‌بینی', icon: '🔮' },
    { id: 'd', title: 'چگالی چیست؟', icon: '🧪' },
    { id: 'c', title: 'محاسبه', icon: '📐' },
    { id: 't', title: 'تله‌ها', icon: '🪤' },
    { id: 'sh', title: 'راز کشتی', icon: '🚢' },
    { id: 'm', title: 'مأموریت ارشمیدس', icon: '👑' },
    { id: 'e', title: 'گزارش', icon: '📋' }
  ],
  tags: {
    heavy: { t: '«سنگین‌ها غرق می‌شوند» درست نیست', review: 'تنهٔ درختِ ۴۰ کیلویی شناور است و میخِ چند گرمی غرق می‌شود. جرم به‌تنهایی تعیین‌کننده نیست؛ <b>چگالی</b> تعیین‌کننده است.' },
    formula: { t: 'رابطهٔ چگالی', review: 'چگالی = جرم ÷ حجم (ρ = m ÷ V). نه ضرب، نه جمع.' },
    inverse: { t: 'ترتیب تقسیم', review: 'جرم را بر حجم تقسیم کن، نه حجم را بر جرم. یکا هم همین را می‌گوید: گرم «بر» سانتی‌متر مکعب.' },
    cut: { t: 'بریدن، چگالی را عوض نمی‌کند', review: 'اگر جسمی را نصف کنیم، جرم و حجم هر دو نصف می‌شوند و نسبتشان (چگالی) ثابت می‌ماند. چگالی ویژگی <b>جنس</b> است، نه اندازه.' },
    massdens: { t: 'سنگین‌تر ≠ چگال‌تر', review: 'یک کیلو پنبه و یک کیلو آهن جرم برابر دارند. آهن «چگال‌تر» است، یعنی همان جرم را در حجم کمتری جا داده.' },
    bigger: { t: 'حجم بیشتر با جرم برابر', review: 'اگر جرم ثابت باشد، هرچه حجم بیشتر شود، چگالی کمتر می‌شود.' },
    shape: { t: 'شکل و چگالی میانگین', review: 'شکل قایق، جنس ماده را عوض نمی‌کند؛ اما حجم کلی (با هوای داخلش) را زیاد می‌کند، پس چگالی میانگین «قایق + هوا» کمتر از آب می‌شود.' }
  },
  slides: [
    /* ---------- پیش‌بینی ---------- */
    { stage: 'p', id: 'predict', type: 'poll', q: 'پیش از هر چیز، نظر خودت: به نظرت چه چیزی تعیین می‌کند یک جسم در آب <b>غرق شود</b> یا <b>شناور بماند</b>؟',
      html: '<div style="font-size:3.2em">🚢 ⚓ 🔩</div>',
      options: [
        { t: '⚖️ وزن (جرم) جسم: سنگین‌ها غرق می‌شوند.' },
        { t: '📦 اندازه (حجم) جسم: بزرگ‌ها غرق می‌شوند.' },
        { t: '🧱 جنس جسم: از چه ماده‌ای ساخته شده.' },
        { t: '🛶 شکل جسم.' }
      ],
      after: '🔖 پیش‌بینی‌ات ثبت شد. درست یا غلط بودنش مهم نیست؛ آخر درس برمی‌گردیم و می‌بینیم نظرت عوض شده یا نه.',
      note: 'در حالت ارائه، دست‌ها را بشمارید و روی هر گزینه کلیک کنید تا نمودار ساخته شود. <b>قضاوت نکنید</b>؛ فقط ثبت کنید. معمولاً بیشتر رأی‌ها به «وزن» می‌رود؛ همین بدفهمی را در ادامه به چالش می‌کشیم.' },
    { stage: 'p', type: 'custom', q: 'آزمایشگاه: پیش‌بینی کن، بعد در آب بینداز! 💦', label: 'پیش‌بینی ← مشاهده',
      render: function (el, api) {
        var st = api.state; st.pred = st.pred || {};
        var list = api.h('div', { class: 'grid2', style: 'grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr))' });
        var go = api.h('button', { class: 'btn bigb acc', type: 'button', text: 'بینداز در آب! 💦' });
        var tank = api.h('div', { style: 'position:relative;height:280px;border:3px solid #7aa7b0;border-top:0;border-radius:0 0 22px 22px;margin:14px auto 6px;max-width:760px;overflow:hidden;background:linear-gradient(#fff 0 26%,#bfe6ee 26%,#7cc6d6 100%)' });
        tank.appendChild(api.h('div', { style: 'position:absolute;inset-inline:0;top:26%;height:3px;background:#4aa3b5;opacity:.7' }));
        var out = api.h('div');
        el.appendChild(api.h('p', null, 'برای هر جسم پیش‌بینی کن: در آب ', api.h('b', { text: 'شناور' }), ' می‌ماند یا ', api.h('b', { text: 'غرق' }), ' می‌شود؟'));
        OBJS.forEach(function (o) {
          var bF = api.h('button', { class: 'emo', type: 'button', text: '🛟 شناور' });
          var bS = api.h('button', { class: 'emo', type: 'button', text: '⚓ غرق' });
          function paint() { bF.classList.toggle('on', st.pred[o.id] === 'f'); bS.classList.toggle('on', st.pred[o.id] === 's'); ready(); }
          bF.onclick = function () { if (st.dropped) return; st.pred[o.id] = 'f'; api.sound('click'); api.save(); paint(); };
          bS.onclick = function () { if (st.dropped) return; st.pred[o.id] = 's'; api.sound('click'); api.save(); paint(); };
          list.appendChild(api.h('div', { class: 'tile', style: 'display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:8px 12px' },
            api.h('span', { html: o.ic.charAt(0) === '<' ? o.ic : '<span style="font-size:1.8em">' + o.ic + '</span>', style: 'min-width:48px;text-align:center' }),
            api.h('span', { style: 'flex:1 1 110px;line-height:1.6', text: o.t }), api.h('span', { style: 'display:flex;gap:6px' }, bF, bS)));
          setTimeout(paint);
        });
        function ready() { go.disabled = !!st.dropped || OBJS.some(function (o) { return !st.pred[o.id]; }); }
        el.appendChild(list);
        el.appendChild(api.h('div', { class: 'row', style: 'justify-content:center' }, go));
        el.appendChild(tank); el.appendChild(out);
        var els = OBJS.map(function (o, k) {
          var e = api.h('div', { style: 'position:absolute;top:-70px;transition:top 1.1s cubic-bezier(.3,.8,.4,1);text-align:center;line-height:1;width:' + (o.w || 56) + 'px', html: (o.ic.charAt(0) === '<' ? o.ic : '<span style="font-size:2.1em">' + o.ic + '</span>') });
          var grp = OBJS.filter(function (x) { return (x.rho < 1) === (o.rho < 1); }), gi = grp.indexOf(o);
          e.style.right = 'calc(' + (gi / Math.max(1, grp.length - 1)).toFixed(3) + ' * (100% - ' + ((o.w || 56) + 8) + 'px) + 4px)'; tank.appendChild(e); return e;
        });
        function drop(anim) {
          var H = tank.clientHeight, surf = H * 0.26;
          OBJS.forEach(function (o, k) {
            var e = els[k], hh = e.offsetHeight || 40, y;
            if (o.rho < 1) y = surf - hh * (1 - o.rho); else y = H - hh - 6;
            setTimeout(function () { e.style.top = y + 'px'; if (anim) api.sound(o.rho < 1 ? 'tick' : 'click'); }, anim ? k * 260 : 0);
          });
          setTimeout(result, anim ? OBJS.length * 260 + 1200 : 0);
        }
        function result() {
          var right = 0, surpr = [];
          OBJS.forEach(function (o) { var real = o.rho < 1 ? 'f' : 's'; if (st.pred[o.id] === real) right++; else surpr.push(o); });
          var rows = OBJS.map(function (o) {
            var real = o.rho < 1 ? '🛟 شناور' : '⚓ غرق', ok = (o.rho < 1 ? 'f' : 's') === st.pred[o.id];
            return '<tr><td>' + o.t + '</td><td>' + (st.pred[o.id] === 'f' ? '🛟 شناور' : '⚓ غرق') + '</td><td><b>' + real + '</b></td><td>' + (ok ? '✅' : '😮 غافلگیری!') + '</td></tr>';
          }).join('');
          out.innerHTML = '<div class="tablewrap"><table class="t"><tr><th>جسم</th><th>پیش‌بینی تو</th><th>مشاهده</th><th></th></tr>' + rows + '</table></div>';
          api.faNodes(out);
          if (!st.done) {
            st.done = true; api.save();
            if (st.pred.log === 's' || st.pred.nail === 'f' || st.pred.coin === 'f') api.tag('heavy');
            api.right(api.fa(right) + ' پیش‌بینی از ' + api.fa(OBJS.length) + ' درست بود' + (surpr.length ? ' و <b>' + api.fa(surpr.length) + ' مورد غافلگیرت کرد</b>. غافلگیری یعنی ذهنت دارد چیز تازه‌ای یاد می‌گیرد! 🧠' : '. پیش‌بینی‌های دقیقی داشتی! 🎯') +
              '<br>🔍 به دو جسم دقت کن: <b>تنهٔ درختِ ۴۰ کیلویی</b> شناور ماند اما <b>میخِ چند گرمی</b> غرق شد. پس فقط «سنگینی» مهم نیست… چه چیز دیگری؟');
          }
        }
        go.onclick = function () { st.dropped = true; api.save(); ready(); drop(true); };
        if (st.dropped) setTimeout(function () { drop(false); });
        ready();
      },
      note: 'بگذارید اول همه پیش‌بینی کنند (در حالت ارائه، برای هر جسم از کلاس رأی بگیرید). بعد «بینداز» را بزنید. روی تناقض <b>تنهٔ درخت / میخ</b> مکث کنید و بپرسید: «پس چه چیزی مهم است؟»' },

    /* ---------- چگالی چیست ---------- */
    { stage: 'd', type: 'content', title: 'نکتهٔ اصلی: چقدر ماده در هر مقدار جا فشرده شده؟',
      html: '<div class="grid2"><div class="center"><svg viewBox="0 0 300 150" width="300" height="150"><rect x="10" y="20" width="120" height="120" rx="8" fill="#f3e2c7" stroke="#8a6a3d" stroke-width="3"/><rect x="170" y="20" width="120" height="120" rx="8" fill="#dde3ea" stroke="#56606e" stroke-width="3"/>' +
        (function () { var s = ''; for (var i = 0; i < 9; i++) s += '<circle cx="' + (30 + (i % 3) * 40) + '" cy="' + (40 + Math.floor(i / 3) * 40) + '" r="7" fill="#8a6a3d"/>'; for (var j = 0; j < 36; j++) s += '<circle cx="' + (182 + (j % 6) * 19) + '" cy="' + (32 + Math.floor(j / 6) * 19) + '" r="7" fill="#3d4652"/>'; return s; })() +
        '</svg><p class="small"><b>چوب</b> ⟵ یک مکعب هم‌اندازه ⟶ <b>آهن</b></p></div><div><p>دو مکعبِ <b>کاملاً هم‌اندازه</b> را تصور کن: یکی چوبی، یکی آهنی. آهنی خیلی سنگین‌تر است، چون در همان مقدار جا <b>مادهٔ بیشتری فشرده شده</b>.</p><div class="callout"><b>چگالی</b> یعنی: در هر یک سانتی‌متر مکعب از یک ماده، چند گرم ماده وجود دارد.</div><div class="flips"><div class="flip"><div class="front"><b>🤔 چگالی آب چقدر است؟</b><span class="hintx">بزن</span></div><div class="back">هر ۱ سانتی‌متر مکعب آب، حدود <b>۱ گرم</b> جرم دارد. پس چگالی آب ≈ ۱ ' + U + '. این عدد مرز شناوری در آب است!</div></div></div></div></div>' },
    { stage: 'd', type: 'steps', q: 'مثال حل‌شده: چگالی یک قطعه چوب',
      intro: '<p>یک قطعه چوب <b>۶ گرم</b> جرم و <b>۱۰ سانتی‌متر مکعب</b> حجم دارد.</p>',
      steps: [
        { html: 'رابطه: <b>چگالی = جرم ÷ حجم</b> &nbsp; <span class="ltr">(ρ = m ÷ V)</span>' },
        { think: 'عددها را کجای رابطه می‌گذاری؟', html: 'چگالی = ۶ ÷ ۱۰ = <b>0.6</b> گرم بر سانتی‌متر مکعب' },
        { think: 'این چوب در آب شناور می‌ماند یا غرق می‌شود؟ چرا؟', html: '0.6 کمتر از ۱ (چگالی آب) است ← <b>شناور می‌ماند</b>. 🛟' }
      ],
      outro: '✅ قانون شناوری: <b>چگالی کمتر از آب ← شناور</b> &nbsp;·&nbsp; <b>چگالی بیشتر از آب ← غرق</b>' },
    { stage: 'd', type: 'custom', q: 'آزمایشگاه چگالی: خودت جسم بساز! 🧪', label: 'شبیه‌سازی',
      render: function (el, api) {
        var st = api.state; st.m = st.m || 60; st.v = st.v || 100; st.task = st.task || 0;
        var TASKS = [
          'جسمی بساز که در آب <b>شناور</b> بماند.',
          'حالا <b>بدون تغییر جرم</b> (قفل شد 🔒)، فقط با تغییر حجم کاری کن جسم <b>غرق</b> شود.',
          'جسمی بساز که نه بالا بیاید نه غرق شود؛ <b>معلق</b> در وسط آب بماند.'
        ];
        var mIn = api.h('input', { type: 'range', min: '10', max: '300', step: '5', style: 'width:100%' });
        var vIn = api.h('input', { type: 'range', min: '10', max: '300', step: '5', style: 'width:100%' });
        var mL = api.h('b'), vL = api.h('b'), rhoL = api.h('div', { class: 'callout', style: 'text-align:center' });
        var svgBox = api.h('div', { class: 'center' });
        var tasksEl = api.h('div');
        var prevT = null;
        function block() {
          var m = st.m, v = st.v, rho = m / v, s = Math.round(Math.cbrt(v) * 14), surf = 70, bot = 228;
          var y = rho < 1 ? surf - s + s * rho : rho > 1 ? bot - s : surf + (bot - surf - s) / 2;
          var n = Math.min(80, Math.round(m / 4)), dots = '';
          var cols = Math.max(2, Math.ceil(Math.sqrt(n)));
          for (var i = 0; i < n; i++) { var cx = ((i % cols) + 0.5) * s / cols, cy = (Math.floor(i / cols) + 0.5) * s / Math.ceil(n / cols); dots += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + Math.max(1.5, Math.min(4, s / cols / 3)).toFixed(1) + '" fill="rgba(0,0,0,.45)"/>'; }
          var hue = Math.max(0, 40 - rho * 12), light = Math.max(40, 82 - rho * 10);
          return '<svg viewBox="0 0 320 240" width="320" height="240" style="max-width:100%"><rect x="20" y="10" width="280" height="222" rx="10" fill="#fff" stroke="#7aa7b0" stroke-width="3"/><rect x="22" y="' + surf + '" width="276" height="' + (230 - surf) + '" fill="#bfe6ee"/><line x1="22" y1="' + surf + '" x2="298" y2="' + surf + '" stroke="#4aa3b5" stroke-width="3"/>' +
            '<g style="transition:transform .7s cubic-bezier(.3,.8,.4,1);transform:translate(' + (160 - s / 2) + 'px,' + y.toFixed(1) + 'px)"><rect width="' + s + '" height="' + s + '" rx="6" fill="hsl(' + hue + ',45%,' + light + '%)" stroke="#333" stroke-width="2.5"/>' + dots + '</g>' +
            '<text x="292" y="' + (surf - 8) + '" font-size="12" fill="#2a7d8c">سطح آب</text></svg>';
        }
        function status(rho) { return rho < 1 ? '🛟 شناور' : rho > 1 ? '⚓ غرق' : '🎈 معلق'; }
        function draw() {
          var rho = st.m / st.v;
          mIn.value = st.m; vIn.value = st.v; mIn.disabled = st.task === 1;
          mL.textContent = api.fa(st.m + ' گرم') + (st.task === 1 ? ' 🔒' : ''); vL.textContent = api.fa(st.v + ' سانتی‌متر مکعب');
          rhoL.innerHTML = 'چگالی = ' + api.fa(st.m) + ' ÷ ' + api.fa(st.v) + ' = <b class="big">' + api.fa(Math.round(rho * 100) / 100) + '</b> گرم بر سانتی‌متر مکعب &nbsp; ← ' + status(Math.round(rho * 1000) / 1000);
          svgBox.innerHTML = block();
          var g = svgBox.querySelector('g'), nt = g.style.transform;
          if (prevT && prevT !== nt) { g.style.transition = 'none'; g.style.transform = prevT; void g.getBoundingClientRect(); g.style.transition = 'transform .7s cubic-bezier(.3,.8,.4,1)'; g.style.transform = nt; }
          prevT = nt;
          tasksEl.innerHTML = '';
          var chips = TASKS.map(function (t, k) { return '<span class="tag" style="' + (k < st.task ? 'background:var(--ok-soft);color:var(--ok)' : k > st.task ? 'opacity:.5' : 'background:var(--a);color:#3a2600') + '">' + (k < st.task ? '✅' : k === st.task ? '👉' : '🔒') + ' مأموریت ' + api.fa(k + 1) + '</span>'; }).join(' ');
          tasksEl.appendChild(api.h('div', { html: chips }));
          if (st.task < TASKS.length) tasksEl.appendChild(api.h('div', { class: 'callout acc', html: '<b>مأموریت ' + api.fa(st.task + 1) + ' از ' + api.fa(TASKS.length) + ':</b> ' + TASKS[st.task] }));
          else tasksEl.appendChild(api.h('div', { class: 'callout ok', html: '🎉 هر سه مأموریت انجام شد! باز هم می‌توانی آزمایش کنی.' }));
          api.faNodes(tasksEl);
        }
        function check() {
          var rho = Math.round(st.m / st.v * 1000) / 1000;
          if (st.task === 0 && rho < 1) { st.task = 1; st.m0 = st.m; api.sound('ok'); api.info('✅ شناور شد! چگالی‌اش از ۱ کمتر است. حالا مأموریت ۲ 👇'); }
          else if (st.task === 1 && rho > 1) { st.task = 2; api.sound('ok'); api.info('✅ غرق شد! با <b>کم کردن حجم</b>، همان جرم در جای کمتری فشرده شد و چگالی بیشتر شد. حالا مأموریت آخر 👇'); }
          else if (st.task === 2 && rho === 1) { st.task = 3; api.right('آفرین! وقتی جرم و حجم برابر باشند (مثل ' + api.fa(st.m) + ' گرم و ' + api.fa(st.v) + ' سانتی‌متر مکعب)، چگالی دقیقاً ۱ است، مثل خود آب؛ پس جسم <b>معلق</b> می‌ماند. ماهی‌ها و زیردریایی‌ها از همین ترفند استفاده می‌کنند! 🐟'); }
          api.save(); draw();
        }
        mIn.oninput = function () { st.m = +mIn.value; draw(); };
        vIn.oninput = function () { st.v = +vIn.value; draw(); };
        mIn.onchange = vIn.onchange = check;
        el.appendChild(tasksEl);
        el.appendChild(api.h('div', { class: 'grid2', style: 'align-items:center' },
          svgBox,
          api.h('div', null, api.h('p', null, '⚖️ جرم: ', mL), mIn, api.h('p', null, '📦 حجم: ', vL), vIn)));
        el.appendChild(rhoL);
        draw();
      },
      hints: ['چگالی آب ۱ است. برای شناوری باید چگالی جسم از ۱ کمتر شود.', 'برای شناور کردن: حجم را از جرم بیشتر کن. برای غرق کردن با جرم ثابت: حجم را کم کن تا از جرم کمتر شود.', 'برای معلق ماندن: جرم و حجم را روی یک عدد بگذار، مثلاً ۱۰۰ گرم و ۱۰۰ سانتی‌متر مکعب.'],
      note: 'مأموریت ۲ قلب این شبیه‌سازی است: با جرم ثابت، فقط حجم تغییر می‌کند؛ ارتباط معکوس حجم و چگالی را دانش‌آموز «می‌بیند».' },

    /* ---------- محاسبه ---------- */
    { stage: 'c', type: 'input', q: 'یک قطعه سنگ <b>۱۲۰ گرم</b> جرم و <b>۴۰ سانتی‌متر مکعب</b> حجم دارد. چگالی آن چقدر است؟',
      unit: 'گرم بر سانتی‌متر مکعب', answer: 3,
      praise: 'درست! ۱۲۰ ÷ ۴۰ = ۳. چون ۳ بیشتر از ۱ است، این سنگ در آب غرق می‌شود. ⚓',
      wrong: [
        { is: 4800, tag: 'formula', fb: 'جرم و حجم را <b>ضرب</b> کردی (۱۲۰ × ۴۰). چگالی یعنی «جرم در هر سانتی‌متر مکعب»؛ پس باید جرم را بین حجم‌ها <b>تقسیم</b> کنی.' },
        { is: 0.333, tol: 0.01, tag: 'inverse', fb: 'حجم را بر جرم تقسیم کردی (۴۰ ÷ ۱۲۰). به یکا دقت کن: «گرم <b>بر</b> سانتی‌متر مکعب»؛ یعنی گرم بالا (صورت)، سانتی‌متر مکعب پایین.' },
        { is: 160, tag: 'formula', fb: 'جرم و حجم را جمع کردی. این دو کمیت از یک جنس نیستند که جمع شوند! رابطهٔ چگالی را به یاد بیاور.' },
        { is: 80, tag: 'formula', fb: 'جرم و حجم را از هم کم کردی. رابطهٔ چگالی تقسیم است.' },
        { is: 0.3, tol: 0.001, tag: 'inverse', fb: 'نزدیک شدی ولی جای عددها برعکس است (۴۰ ÷ ۱۲۰ ≈ ۰٫۳۳). جرم باید تقسیم بر حجم شود.' }
      ],
      fb: 'هنوز نه. رابطه را بنویس: چگالی = جرم ÷ حجم. عددها را جایگزین کن.',
      hints: ['کدام رابطه جرم و حجم را به چگالی وصل می‌کند؟', 'چگالی = جرم ÷ حجم. جرم کدام عدد است؟ حجم کدام؟', 'مثال: ۵۰ گرم و ۱۰ سانتی‌متر مکعب ← ۵۰ ÷ ۱۰ = ۵.'] },
    { stage: 'c', type: 'mcq', q: 'دو جسم <b>جرم برابر</b> دارند. جسم «الف» حجم بیشتری دارد و جسم «ب» حجم کمتری. چگالی کدام بیشتر است؟',
      options: [
        { t: 'جسم الف، چون بزرگ‌تر است.', tag: 'bigger', fb: 'بزرگ‌تر بودن یعنی همان مقدار ماده در جای <b>بیشتری</b> پخش شده، پس ماده کمتر فشرده است. در شبیه‌سازی، وقتی حجم را زیاد کردی چه شد؟' },
        { t: 'جسم ب، چون همان جرم در حجم کمتری فشرده شده.', ok: true, fb: 'دقیقاً! جرم ثابت، حجم کمتر ← چگالی بیشتر. همان کاری که در مأموریت ۲ شبیه‌سازی کردی 👏' },
        { t: 'برابرند، چون جرمشان برابر است.', tag: 'massdens', fb: 'جرم برابر است، اما چگالی به <b>حجم</b> هم بستگی دارد (جرم ÷ حجم). حجم‌ها فرق دارند.' },
        { t: 'نمی‌شود فهمید، باید جنسشان را بدانیم.', fb: 'اطلاعات کافی داریم! با جرم برابر، کافی است حجم‌ها را مقایسه کنی. رابطهٔ جرم ÷ حجم را امتحان کن: مثلاً ۱۰۰ ÷ ۵۰ و ۱۰۰ ÷ ۲۰۰.' }
      ],
      hints: ['رابطهٔ چگالی = جرم ÷ حجم را به یاد بیاور.', 'با یک مثال عددی امتحان کن: جرم هر دو ۱۰۰ گرم؛ حجم یکی ۲۰۰ و دیگری ۵۰.'] },

    /* ---------- تله‌ها ---------- */
    { stage: 't', type: 'mcq', q: 'یک قطعه چوب با چگالی <b>0.6</b> گرم بر سانتی‌متر مکعب را از وسط نصف می‌کنیم. چگالی هر نیمه چقدر است؟',
      options: [
        { t: '0.3', tag: 'cut', fb: 'جرم نصف شد، درست؛ اما <b>حجم هم نصف شد</b>! مثلاً ۶ ÷ ۱۰ = ۰٫۶ و ۳ ÷ ۵ = ۰٫۶. نسبت عوض نشد.' },
        { t: '0.6', ok: true, fb: 'درست! چگالی ویژگی <b>جنس</b> ماده است، نه اندازهٔ آن. برای همین تکهٔ کوچک چوب هم مثل تنهٔ بزرگ درخت شناور است.' },
        { t: '1.2', tag: ['cut', 'inverse'], fb: 'تکه کوچک‌تر شد، اما فشرده‌تر نشد! جرم و حجم هر دو به یک نسبت کم شدند.' },
        { t: 'بستگی دارد کدام نیمه باشد.', tag: 'cut', fb: 'اگر چوب یکنواخت باشد، هر دو نیمه از یک جنس‌اند و چگالی یکسانی دارند.' }
      ],
      hints: ['وقتی چوب نصف می‌شود، چه چیزهایی نصف می‌شوند؟ فقط جرم؟', 'فرض کن چوب اول ۶ گرم و ۱۰ سانتی‌متر مکعب بود. نیمه‌اش چند گرم و چند سانتی‌متر مکعب است؟ حالا تقسیم کن.'] },
    { stage: 't', type: 'mcq', q: 'سؤال معروف: <b>یک کیلوگرم پنبه</b> سنگین‌تر است یا <b>یک کیلوگرم آهن</b>؟',
      html: '<div style="font-size:3em">☁️ ⚖️ 🔩</div>',
      options: [
        { t: 'آهن', tag: 'massdens', fb: 'آهن «<b>چگال‌تر</b>» است، نه سنگین‌تر! جرم هر دو دقیقاً ۱ کیلوگرم است. پنبه فقط جای خیلی بیشتری می‌گیرد.' },
        { t: 'پنبه', tag: 'massdens', fb: 'پنبه حجم بیشتری دارد، اما جرمش همان ۱ کیلوگرم است. سؤال دربارهٔ جرم است.' },
        { t: 'هیچ‌کدام؛ جرمشان برابر است، اما چگالی آهن خیلی بیشتر است.', ok: true, fb: 'آفرین که در تله نیفتادی! «سنگین‌تر» دربارهٔ جرم است و «چگال‌تر» دربارهٔ جرم در واحد حجم. دو مفهوم متفاوت.' }
      ] },
    { stage: 't', type: 'sort', q: 'کدام جمله <b>درست</b> است و کدام <b>نادرست</b>؟',
      bins: [{ id: 'y', t: '✅ درست' }, { id: 'n', t: '❌ نادرست' }],
      items: [
        { t: 'اجسام سنگین همیشه در آب غرق می‌شوند.', bin: 'n', tag: 'heavy', fb: 'تنهٔ درخت ۴۰ کیلویی را یادت هست؟ شناور بود.' },
        { t: 'اگر یک جسم را کوچک‌تر ببریم، چگالی‌اش کم می‌شود.', bin: 'n', tag: 'cut', fb: 'جرم و حجم با هم کم می‌شوند؛ چگالی ثابت می‌ماند.' },
        { t: 'چگالی آب حدود ۱ گرم بر سانتی‌متر مکعب است.', bin: 'y', fb: 'این یک واقعیت مهم است: مرز شناوری در آب.' },
        { t: 'جسمی که چگالی‌اش از آب کمتر است، در آب شناور می‌ماند.', bin: 'y', fb: 'قانون اصلی شناوری همین است.' },
        { t: 'چگالی = جرم × حجم', bin: 'n', tag: 'formula', fb: 'چگالی از تقسیم به دست می‌آید، نه ضرب.' },
        { t: 'یخ روی آب شناور است، چون چگالی‌اش از آب مایع کمتر است.', bin: 'y', fb: 'چگالی یخ حدود ۰٫۹۲ است. برای همین کوه‌های یخ روی آب‌اند.' }
      ],
      praise: 'عالی! حالا تله‌های رایج دربارهٔ چگالی را می‌شناسی و در آن‌ها نمی‌افتی 🪤✅',
      hints: ['آزمایش پیش‌بینی (درخت و میخ) و آزمایش نصف کردن چوب را به یاد بیاور.', 'برای هر جمله یک مثال نقض پیدا کن. اگر پیدا شد، جمله نادرست است.'] },

    /* ---------- راز کشتی ---------- */
    { stage: 'sh', type: 'mcq', q: 'یک گلوله خمیر (پلاستیسین) در آب غرق می‌شود. همان خمیر را به شکل <b>قایق</b> درمی‌آوریم و روی آب می‌ماند! چه چیزی تغییر کرد؟',
      html: '<div style="font-size:2.6em">🟤 ⚓ ⟵ ⟶ 🛶 🛟</div>',
      options: [
        { t: 'جرم خمیر کمتر شد.', tag: 'shape', fb: 'هیچ خمیری کم نشد! اگر روی ترازو بگذاری، همان عدد را نشان می‌دهد.' },
        { t: 'چگالی خودِ خمیر کمتر شد.', tag: ['shape', 'cut'], fb: 'جنس خمیر همان است؛ پس چگالی خودِ ماده عوض نشد. چیز دیگری عوض شده…' },
        { t: 'قایق فضای بیشتری را (همراه با هوای داخلش) اشغال می‌کند، پس چگالی میانگینِ «خمیر + هوا» از آب کمتر شد.', ok: true, fb: 'دقیقاً! جرم همان است، اما <b>حجم کل</b> (خمیر + هوای داخل قایق) خیلی بیشتر شده؛ پس جرم ÷ حجم کل از ۱ کمتر شد. 🛶' },
        { t: 'آب به خمیرِ صاف نیروی بیشتری وارد می‌کند، ربطی به چگالی ندارد.', fb: 'آب واقعاً به قایق نیروی بالابر وارد می‌کند، اما این نیرو به حجمی از آب بستگی دارد که قایق کنار می‌زند؛ یعنی دوباره به حجم کل و چگالی میانگین برمی‌گردیم.' }
      ],
      hints: ['جرم خمیر تغییر کرد؟ جنسش چطور؟', 'قایق چه چیزی را درون خودش نگه می‌دارد که گلوله نداشت؟', 'چگالی میانگین = جرم کل ÷ حجم کل. هوای داخل قایق هم جزو حجم کل است.'] },
    { stage: 'sh', type: 'steps', q: 'راز کشتی آهنی 🚢',
      intro: '<p>چگالی آهن حدود <b>7.9</b> است، اما بدنهٔ کشتی توخالی است و مقدار زیادی <b>هوا</b> را در بر می‌گیرد.</p>',
      steps: [
        { html: 'یک کشتی اسباب‌بازی فلزی: جرم = <b>۲۰۰ گرم</b>، حجم کل (فلز + هوای داخل) = <b>۵۰۰ سانتی‌متر مکعب</b>' },
        { think: 'چگالی میانگین کشتی را حساب کن.', html: 'چگالی میانگین = ۲۰۰ ÷ ۵۰۰ = <b>0.4</b> گرم بر سانتی‌متر مکعب ← کمتر از ۱ ← <b>شناور</b> 🛟' },
        { think: 'اگر بدنه سوراخ شود و آب وارد کشتی شود، چه اتفاقی می‌افتد؟', html: 'آب جای هوا را می‌گیرد؛ <b>جرم کل زیاد می‌شود</b> در حالی که حجم کل تقریباً ثابت است. چگالی میانگین از ۱ بیشتر می‌شود و کشتی غرق می‌شود. (همان اتفاقی که برای تایتانیک افتاد.)' }
      ],
      outro: '✅ کشتی به‌خاطر <b>شکلش</b> شناور است: شکل، حجم کل را زیاد و چگالی میانگین را کم می‌کند.' },
    { stage: 'sh', type: 'custom', gate: false, q: 'برگردیم به پیش‌بینی اولت 🔖',
      render: function (el, api) {
        var r = api.get('predict'), P = api.lesson.slides[0];
        var txt = r && r.choice != null ? P.options[r.choice].t : null;
        el.appendChild(api.h('div', { class: 'callout acc', html: txt ? 'اول درس گفتی: <b>' + txt + '</b>' : 'اول درس پیش‌بینی‌ای ثبت نشد (یا در حالت ارائه بودی).' }));
        el.appendChild(api.h('div', { class: 'flips' },
          api.h('div', { class: 'flip' }, api.h('div', { class: 'front', html: '<b>حالا جواب علمی چیست؟</b><span class="hintx">بزن</span>' }),
            api.h('div', { class: 'back', html: 'آنچه تعیین می‌کند غرق شود یا نه، <b>چگالی</b> است، یعنی جرم ÷ حجم. برای یک جسم توپُر، چگالی به <b>جنس</b> بستگی دارد؛ برای جسم توخالی (مثل کشتی)، <b>شکل</b> هم مهم است، چون چگالی میانگین را عوض می‌کند. «وزن» یا «اندازه» به‌تنهایی کافی نیستند.' }))));
        el.appendChild(api.h('p', { class: 'muted', text: 'با بغل‌دستی‌ات بحث کن: پیش‌بینی اولت چقدر به جواب علمی نزدیک بود؟ چه چیزی نظرت را عوض کرد؟' }));
        el.addEventListener('click', function (e) { var f = e.target.closest('.flip'); if (f) f.classList.toggle('on'); });
      } },

    /* ---------- مأموریت ارشمیدس ---------- */
    { stage: 'm', type: 'content', title: '👑 مأموریت ارشمیدس',
      html: '<p class="lead">حدود ۲۲۰۰ سال پیش، پادشاهی از <b>ارشمیدس</b> پرسید: «آیا زرگر در تاج من <b>نقره</b> قاطی کرده، یا تاج از طلای خالص است؟» ارشمیدس نمی‌توانست تاج را ذوب کند یا ببرد…</p><div class="tablewrap"><table class="t"><tr><th>فلز</th><th>طلا</th><th>نقره</th><th>مس</th><th>آهن</th><th>آلومینیوم</th></tr><tr><th>چگالی (' + U + ')</th><td>19.3</td><td>10.5</td><td>8.9</td><td>7.9</td><td>2.7</td></tr></table></div><div class="callout acc">جرم تاج: <b>۵۷۹ گرم</b> · حجم تاج (با فروبردن در آب اندازه گرفته شد): <b>۵۰ سانتی‌متر مکعب</b></div><p>این مأموریت <b>دو گام</b> دارد. گام به گام جلو برو.</p>' },
    { stage: 'm', type: 'input', label: 'گام ۱ از ۲', q: 'گام ۱: چگالی تاج را حساب کن. (جرم ۵۷۹ گرم، حجم ۵۰ سانتی‌متر مکعب)',
      unit: 'گرم بر سانتی‌متر مکعب', answer: 11.58, tol: 0.1, answerText: '۵۷۹ ÷ ۵۰ = ۱۱٫۵۸',
      praise: 'درست! ۵۷۹ ÷ ۵۰ ≈ <b>11.6</b>. گام اول کامل شد؛ حالا این عدد را با جدول مقایسه کن ←',
      wrong: [
        { is: 28950, tag: 'formula', fb: 'جرم و حجم را ضرب کردی. چگالی = جرم <b>÷</b> حجم.' },
        { test: function (v) { return Math.abs(v - 0.0864) < 0.01; }, tag: 'inverse', fb: 'حجم را بر جرم تقسیم کردی. جرم (۵۷۹) باید صورت باشد.' },
        { test: function (v) { return Math.abs(v - 19.3) < 0.05; }, fb: 'این چگالی طلای خالص از جدول است! تو باید چگالی <b>این تاج</b> را از روی جرم و حجمش حساب کنی.' },
        { is: 11, tol: 0.001, fb: 'نزدیکی! تقسیم را تا رقم اعشار ادامه بده: ۵۷۹ ÷ ۵۰.' },
        { is: 12, tol: 0.001, fb: 'نزدیکی! تقسیم را دقیق‌تر انجام بده: ۵۷۹ ÷ ۵۰.' }
      ],
      hints: ['رابطهٔ چگالی چیست؟', '۵۷۹ را بر ۵۰ تقسیم کن. (راهنمایی: ۵۰ × ۱۱ = ۵۵۰)', '۵۷۹ ÷ ۵۰ = ۱۱ و باقی‌ماندهٔ ۲۹؛ ۲۹ ÷ ۵۰ = ۰٫۵۸.'] },
    { stage: 'm', type: 'mcq', label: 'گام ۲ از ۲', q: 'گام ۲: چگالی تاج حدود <b>11.6</b> شد. نتیجه‌گیری ارشمیدس چه باید باشد؟',
      options: [
        { t: 'تاج از طلای خالص است، چون فلزی زرد و براق است.', fb: 'ظاهر می‌تواند فریب بدهد! دانشمند به داده نگاه می‌کند: ۱۱٫۶ با ۱۹٫۳ خیلی فاصله دارد.' },
        { t: 'تاج طلای خالص نیست؛ چگالی‌اش خیلی کمتر از طلا (19.3) است. احتمالاً طلا با فلز سبک‌تری مثل نقره مخلوط شده.', ok: true, fb: 'آفرین، کارآگاه! چگالی ۱۱٫۶ بین نقره (۱۰٫۵) و طلا (۱۹٫۳) است؛ پس تاج احتمالاً <b>مخلوطی</b> از این دو است. زرگر تقلب کرده! 🕵️' },
        { t: 'تاج از نقرهٔ خالص است.', fb: 'نزدیک است، اما ۱۱٫۶ دقیقاً ۱۰٫۵ نیست. چگالی تاج بین نقره و طلاست. این چه معنایی دارد؟' },
        { t: 'نمی‌شود فهمید، چون تاج را نمی‌شود برید.', tag: 'cut', fb: 'اصلاً لازم نیست تاج را ببریم! چگالی به اندازه یا شکل بستگی ندارد؛ با جرم و حجم کل تاج هم می‌توانیم جنسش را بسنجیم. همین کشف بزرگ ارشمیدس بود.' }
      ],
      explain: '🛁 می‌گویند ارشمیدس این راه‌حل را وقتی در حمام دید آب بالا آمد پیدا کرد و فریاد زد: «<b>یافتم! (اورِکا!)</b>»',
      hints: ['عدد ۱۱٫۶ را در جدول پیدا کن. به کدام فلز نزدیک است؟', 'اگر چگالی بین دو فلز باشد، چه چیزی دربارهٔ جنس جسم می‌گوید؟'] },

    { stage: 'e', type: 'end', prompt: 'مهم‌ترین چیزی که امروز دربارهٔ شناوری فهمیدم این بود که…',
      html: '<div class="callout">🚢 <b>جمع‌بندی در یک جمله:</b> جسم وقتی شناور است که چگالی (میانگینِ) آن از چگالی آب کمتر باشد. چگالی = جرم ÷ حجم؛ و به جنس (و برای اجسام توخالی، به شکل) بستگی دارد، نه فقط به وزن یا اندازه.</div>' }
  ]
};
