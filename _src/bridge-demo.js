/* نمونهٔ میزبان «کلاس زنده» (kelas-bridge v1): پخش درس در iframe ایزوله + جمع‌آوری و تحلیل زندهٔ رویدادها */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  var fa = function (x) { return String(x).replace(/\d/g, function (d) { return FA[d]; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var LESSONS = [['02-lesson-fractions.html', '🧁 قنادی آقای کسری (کسرها)'], ['03-lesson-density.html', '🚢 راز شناوری (چگالی)'], ['05-template.html', '🧊 قالب: جامد، مایع، گاز']];
  var q = new URLSearchParams(location.search);
  var src = q.get('lesson');
  if (!LESSONS.some(function (l) { return l[0] === src; })) src = LESSONS[0][0];   // فقط فایل‌های مجاز
  var sandboxed = q.get('sandbox') !== '0';
  var persist = q.get('persist') !== '0';

  var sel = $('#lessonSel');
  LESSONS.forEach(function (l) { var o = document.createElement('option'); o.value = l[0]; o.textContent = l[1]; if (l[0] === src) o.selected = true; sel.appendChild(o); });
  $('#sbChk').checked = sandboxed; $('#psChk').checked = persist;
  function reload() {
    var p = new URLSearchParams({ lesson: sel.value, sandbox: $('#sbChk').checked ? '1' : '0', persist: $('#psChk').checked ? '1' : '0' });
    location.search = p.toString();
  }
  sel.onchange = reload; $('#sbChk').onchange = reload; $('#psChk').onchange = reload;

  var frame = document.createElement('iframe');
  frame.title = 'درس';
  if (sandboxed) frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('allow', 'fullscreen');
  frame.src = src;
  $('#stageBox').appendChild(frame);

  var STATE_KEY = 'kz-host-state:' + src;
  var meta = null, items = {}, tags = {}, events = [], sessions = {};
  function itemRow(id) { return items[id] || (items[id] = { id: id, views: 0, dwell: 0, attempts: 0, firstOk: 0, firstTotal: 0, done: 0, hints: 0, reveals: 0, lat: [], opts: {}, tags: {} }); }

  window.addEventListener('message', function (e) {
    if (e.source !== frame.contentWindow) return;          // فقط همان قاب
    var m = e.data;
    if (!m || m.ns !== 'kelas' || m.v !== 1) return;       // فقط قالب پل
    if (m.kind === 'hello') {
      meta = m.lesson;
      $('#conn').innerHTML = '🟢 متصل · موتور <b>' + esc(m.engine) + '</b> · ' + fa(meta.items.length) + ' اسلاید · ذخیرهٔ مرورگر در قاب: ' + (m.storage ? 'دارد' : '<b>ندارد</b>');
      meta.items.forEach(function (it) { itemRow(it.id); });
      var saved = null;
      if (persist) { try { saved = JSON.parse(localStorage.getItem(STATE_KEY)); } catch (x) {} }
      frame.contentWindow.postMessage({ ns: 'kelas', v: 1, kind: 'init', persist: persist, learner: { id: 'demo-learner', name: 'کاربر نمونه' }, state: saved || undefined }, '*');
      paint();
      return;
    }
    if (m.kind === 'state') { if (persist) try { localStorage.setItem(STATE_KEY, JSON.stringify(m.state)); } catch (x) {} return; }
    if (m.kind !== 'event') return;
    events.push(m); if (events.length > 400) events.shift();
    sessions[m.session] = true;
    ingest(m);
    paint();
  });

  function ingest(ev) {
    var d = ev.data || {};
    var r = d.item ? itemRow(d.item) : null;
    switch (ev.type) {
      case 'slide.view': r.views++; if (d.from && d.prevDwellMs) itemRow(d.from).dwell += d.prevDwellMs; break;
      case 'item.attempt':
        r.attempts++;
        if (d.attempt === 1) { r.firstTotal++; if (d.correct) r.firstOk++; }
        if (d.latencyMs != null) r.lat.push(d.latencyMs);
        if (d.response && d.response.option != null && !d.correct) r.opts[d.response.option] = (r.opts[d.response.option] || 0) + 1;
        (d.tags || []).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; r.tags[t] = (r.tags[t] || 0) + 1; });
        break;
      case 'item.complete': case 'item.done': r.done++; break;
      case 'item.reveal': r.reveals++; break;
      case 'hint.open': r.hints++; break;
      case 'item.tag': (d.tags || []).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); break;
    }
  }
  function median(a) { if (!a.length) return null; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor(b.length / 2)]; }
  function sec(ms) { return ms == null ? '—' : fa(Math.round(ms / 1000)) + ' ث'; }

  function paint() {
    if (!meta) return;
    var rows = meta.items.filter(function (it) { return it.gated || it.type === 'content'; }).map(function (it) {
      var r = itemRow(it.id);
      var first = r.firstTotal ? Math.round(100 * r.firstOk / r.firstTotal) + '٪' : '—';
      var flag = '';
      if (it.scored && r.attempts >= 3 && r.done === 0) flag = '<span class="tag" style="background:#fde2e2;color:#9b1c1c">⚠️ گیر کرده</span>';
      else if (it.scored && r.firstTotal && r.firstOk === 0) flag = '<span class="tag" style="background:#fff0e0;color:#9a4a00">نقطهٔ دشوار</span>';
      var topOpt = Object.keys(r.opts).sort(function (a, b) { return r.opts[b] - r.opts[a]; })[0];
      var trap = topOpt != null && it.options && it.options[topOpt] ? (esc(it.options[topOpt].t).slice(0, 40) || 'گزینهٔ ' + fa(+topOpt + 1)) + ' (' + fa(r.opts[topOpt]) + ' بار)' : '';
      return '<tr><td>' + fa(it.idx + 1) + '</td><td style="text-align:right">' + esc(it.q || it.type).slice(0, 60) + ' ' + flag + '</td><td>' + esc(it.type) + '</td><td>' + fa(r.views) +
        '</td><td>' + fa(r.attempts) + '</td><td>' + fa(first) + '</td><td>' + fa(r.hints) + '</td><td>' + sec(median(r.lat)) + '</td><td>' + sec(r.dwell || null) + '</td><td style="text-align:right" class="small">' + trap + '</td></tr>';
    }).join('');
    $('#items').innerHTML = '<table class="t small"><tr><th>#</th><th>اسلاید</th><th>نوع</th><th>دیدن</th><th>تلاش</th><th>درست در تلاش اول</th><th>راهنما</th><th>میانهٔ زمان پاسخ</th><th>زمان ماندن</th><th>تلهٔ پرتکرار</th></tr>' + rows + '</table>';

    var tk = Object.keys(tags).sort(function (a, b) { return tags[b] - tags[a]; });
    var mx = tk.length ? tags[tk[0]] : 1;
    $('#tags').innerHTML = tk.length ? tk.map(function (t) {
      var info = meta.tags[t] || { t: t };
      return '<div class="tagrow"><span>' + esc(info.t) + '</span><span class="barw"><i style="width:' + (100 * tags[t] / mx) + '%"></i></span><b>' + fa(tags[t]) + '</b></div>';
    }).join('') : '<p class="muted small">هنوز بدفهمی‌ای ثبت نشده. در درس سمت راست عمداً پاسخ اشتباه بدهید.</p>';

    $('#log').innerHTML = events.slice(-40).reverse().map(function (ev) {
      var d = ev.data || {};
      var extra = d.correct === true ? '✅' : d.correct === false ? '🤔' : '';
      return '<div class="ev"><code>' + esc(ev.type) + '</code> ' + extra + ' <span class="muted">' + esc(d.item || '') + (d.tags && d.tags.length ? ' · ' + esc(d.tags.join('، ')) : '') + (d.level ? ' · پلهٔ ' + fa(d.level) : '') + '</span></div>';
    }).join('');
    $('#count').textContent = fa(events.length) + ' رویداد، ' + fa(Object.keys(sessions).length) + ' نشست';
  }

  $('#decodeBtn').onclick = function () {
    var raw = ($('#codeIn').value.match(/KZ1\.[A-Za-z0-9_-]+/) || [])[0];
    if (!raw) { $('#codeOut').textContent = 'کد معتبری پیدا نشد (باید با KZ1. شروع شود).'; return; }
    try {
      var b64 = raw.slice(4).replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var obj = JSON.parse(decodeURIComponent(escape(atob(b64))));
      $('#codeOut').textContent = JSON.stringify(obj, null, 2);
    } catch (x) { $('#codeOut').textContent = 'کد خراب است: ' + x.message; }
  };
  $('#clearBtn').onclick = function () { try { localStorage.removeItem(STATE_KEY); } catch (x) {} location.reload(); };
})();
