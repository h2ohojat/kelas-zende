/* صفحهٔ مستقل جعبه‌ابزار معلم */
(function () {
  var app = document.getElementById('app');
  var TABS = [
    ['🤖', 'پرامپت‌ساز', function (el) { TK.builder(el); }],
    ['🔧', 'پرامپت‌های تعمیر', function (el) { TK.fixes(el); }],
    ['🔍', 'چک‌لیست کیفیت', function (el) { TK.checklist(el); }],
    ['📄', 'ذخیره و انتشار', function (el) { TK.saveGuide(el); }],
    ['🧩', 'پنج «ت»', function (el) {
      el.innerHTML = '<div class="grid3">' + [
        ['🧩', 'تکه', 'یک ایده در هر صفحه · اول مثال حل‌شده، بعد تمرین · سرعت دست یادگیرنده.'],
        ['🔍', 'تشخیص', 'هر گزینهٔ غلط = یک بدفهمی واقعی = یک بازخورد مخصوص، بدون لو دادن جواب.'],
        ['🪜', 'تلنگر', 'راهنمای سه‌پله‌ای: تلنگر ← راهبرد ← مثال مشابه. بعد از دو اشتباه، خودکار.'],
        ['⭐', 'تشویق', 'ستاره برای تلاش (۳/۲/۱)، نشان برای رفتار یادگیری، رکورد شخصی؛ بدون جدول رده‌بندی.'],
        ['🪞', 'تأمل', 'مرور اشتباه‌ها، خودارزیابی با ایموجی، و گزارشی که به دست معلم برسد.']
      ].map(function (t) { return '<div class="tile"><div class="ti">' + t[0] + '</div><b>' + t[1] + '</b><div class="small">' + t[2] + '</div></div>'; }).join('') + '</div>' +
      '<div class="callout acc" style="margin-top:14px"><b>یادتان باشد:</b> هوش مصنوعی کد را می‌نویسد؛ <b>شما</b> طراح آموزشی هستید: هدف، بدفهمی‌ها، بازخورد و ترتیب. و همیشه محتوای علمی را خودتان بررسی کنید.</div>';
    }]
  ];
  var K = 'tk:tab', cur = 0; try { cur = +localStorage.getItem(K) || 0; } catch (e) {}
  var bar = document.createElement('nav'); bar.className = 'map'; bar.style.justifyContent = 'flex-start';
  var head = document.createElement('header'); head.className = 'topbar';
  head.innerHTML = '<div class="brand"><span class="mascot">🧰</span><div><b>جعبه‌ابزار کلاس زنده</b><small>ساخت طرح درس تعاملی با هوش مصنوعی</small></div></div>';
  head.appendChild(bar);
  var main = document.createElement('main'); main.className = 'stage';
  var card = document.createElement('section'); card.className = 'slide';
  main.appendChild(card);
  var toasts = document.createElement('div'); toasts.className = 'toasts';
  app.appendChild(head); app.appendChild(main); app.appendChild(toasts);
  function show(k) {
    cur = k; try { localStorage.setItem(K, k); } catch (e) {}
    bar.innerHTML = '';
    TABS.forEach(function (t, i) {
      var b = document.createElement('button'); b.className = 'chip' + (i === k ? ' cur' : ''); b.type = 'button';
      b.innerHTML = '<span class="ci">' + t[0] + '</span><span class="cl">' + t[1] + '</span>';
      b.onclick = function () { show(i); }; bar.appendChild(b);
    });
    card.innerHTML = '<h2>' + TABS[k][0] + ' ' + TABS[k][1] + '</h2>';
    var body = document.createElement('div'); card.appendChild(body); TABS[k][2](body);
    window.scrollTo(0, 0);
  }
  show(Math.min(cur, TABS.length - 1));
})();
