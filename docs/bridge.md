# پل «کلاس زنده» (kelas-bridge v1)

<div dir="rtl">

این سند قرارداد ارتباط یک درس «کلاس زنده» با **سایت میزبان** است؛ یعنی صفحه‌ای که درس را داخل `<iframe>` نمایش می‌دهد، مثل یک سامانهٔ آموزشی. این پل از نسخهٔ **1.1.0** موتور در دسترس است.

نمونهٔ اجرایی: [`07-bridge-demo.html`](../07-bridge-demo.html)

## اصول

- **فایل درس مستقل می‌ماند.** بدون میزبان، مثل قبل کار می‌کند و پیشرفت را در `localStorage` نگه می‌دارد.
- **سازگار با iframe ایزوله:** با `sandbox="allow-scripts"` و بدون `allow-same-origin` کار می‌کند؛ یعنی مبدأ درس `null` است. ارتباط فقط از راه `postMessage` است و درس هیچ درخواست شبکه‌ای نمی‌فرستد (سازگار با `connect-src 'none'`).
- همهٔ پیام‌ها این شکل را دارند: `{ ns: 'kelas', v: 1, kind: … }`
- **درس فقط از `window.parent` پیام می‌پذیرد.** میزبان هم باید فقط پیام‌هایی را بپذیرد که `event.source === iframe.contentWindow` باشد.
- **درس هیچ اطلاعات هویتی نمی‌فرستد.** نام واردشده در صفحهٔ شروع، محلی است. هویت را میزبان می‌داند و خودش به رویدادها وصل می‌کند.

## درس ← میزبان

| `kind` | زمان ارسال | محتوا |
|---|---|---|
| `hello` | پس از بارگذاری، و در پاسخ به `ping` | `engine`، `session`، `storage` (آیا `localStorage` در دسترس است)، `caps`، `lesson` (شناسه، نسخه، عنوان، `maxStars`، اهداف، مراحل، **فرهنگ بدفهمی‌ها `tags`**، و **کاتالوگ اسلایدها `items`**) |
| `event` | هر تعامل | `type`، `ts`، `seq`، `session`، `lesson`، `mode`، `slide`، `data` |
| `state` | حدود ۸۰۰ میلی‌ثانیه پس از هر تغییر، فقط اگر میزبان `persist: true` داده باشد | وضعیت کامل برای ادامهٔ درس (به‌صورت شیء مبهم ذخیره شود) |
| `summary` | در پاسخ به فرمان `summary` | خلاصهٔ کارکرد |

هر عضو کاتالوگ `items` این فیلدها را دارد: `id`، `idx`، `type`، `stage`، `gated`، `scored`، `q` (متن ساده)، `qhash` (برای تشخیص تغییر محتوا)، `tags` (بدفهمی‌های ممکن)، و `options` (برای چندگزینه‌ای و نظرسنجی).

> **شناسهٔ پایدار:** اگر اسلاید `id` داشته باشد، همان به کار می‌رود؛ وگرنه `s{شماره}`. برای درس‌هایی که بعد از انتشار ویرایش می‌شوند، **به هر اسلاید سنجیده‌شده `id` ثابت بدهید** تا داده‌های قبلی و بعدی قابل مقایسه بمانند. تغییر `qhash` یعنی متن پرسش عوض شده است.

## انواع رویداد (`event.type`)

| نوع | `data` |
|---|---|
| `session.start` | `resume`، `restart`، `embedded`، `hostPersist`، `storage`، `learner` |
| `session.pause` / `session.resume` | پنهان یا آشکار شدن صفحه |
| `session.restart` | `previous` (خلاصهٔ قبلی) |
| `slide.view` | `item`، `type`، `stage`، `index`، `from`، `prevDwellMs` (زمان ماندن در اسلاید قبل؛ حداکثر ۱۰ دقیقه) |
| `item.attempt` | `item`، `type`، `correct`، `attempt`، `hints`، `tags` (بدفهمی‌های این پاسخ)، `response` (`option` / `value` / `wrongItems` و `placement` / `order`)، `latencyMs` |
| `item.complete` | `item`، `stars`، `attempts`، `hints`، `latencyMs` |
| `item.done` | کامل شدن فعالیت‌های بی‌نمره یا نمایش پاسخ (`how`) |
| `item.reveal` / `item.explore` / `item.reset` | کارهای معلم در حالت ارائه |
| `item.tag` | بدفهمی‌ای که یک فعالیت سفارشی ثبت کرده |
| `hint.open` | `item`، `level`، `auto`، `attempts` |
| `steps.reveal` | `item`، `step`، `afterThink`، `latencyMs` |
| `poll.answer` / `poll.tally` | پاسخ فردی / شمارش رأی کلاس |
| `stage.complete` | `stage` |
| `badge.award` | `badge` |
| `self.assess` | `objective`، `level`، `of` |
| `reflect.submit` | `text` (حداکثر ۲۰۰۰ نویسه)، `length` |
| `report.copy` | — |
| `lesson.complete` | خلاصهٔ کامل: ستاره، درصد، نشان‌ها، بدفهمی‌ها، خودارزیابی، زمان، و وضعیت هر اسلاید |
| `mode.change`، `class.think`، `class.timer` | رویدادهای کلاس در حالت ارائه |
| `custom.*` | داده‌ای که فعالیت‌های سفارشی با `api.emit()` می‌فرستند |
| `host.connected` | `persist`، `resumed` |

## میزبان ← درس

| `kind` | کاربرد |
|---|---|
| `ping` | درخواست ارسال دوبارهٔ `hello` |
| `init` | `{ persist: bool, learner: { id, name }, state?: object, mode?: 'student' \| 'present' }`؛ اگر درس هنوز شروع نشده باشد، `state` بارگذاری می‌شود و گزینهٔ «ادامه» ظاهر می‌شود. |
| `command` | `{ command: 'goto', slide: n }` · `{ command: 'mode', mode }` · `{ command: 'summary' }` |

## نمونهٔ کد میزبان

```js
const frame = document.querySelector('iframe');
addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow) return;
  const m = e.data;
  if (!m || m.ns !== 'kelas' || m.v !== 1) return;
  if (m.kind === 'hello') {
    frame.contentWindow.postMessage({ ns: 'kelas', v: 1, kind: 'init', persist: true,
      learner: { id: 'u42' }, state: loadSavedState() }, '*');
  }
  if (m.kind === 'state') saveState(m.state);   // حداکثر اندازه را کنترل کنید
  if (m.kind === 'event') queueForServer(m);    // دسته‌ای و با محدودیت نرخ بفرستید
});
```

## «کد گزارش» (برای کلاس‌های آفلاین)

دکمهٔ «کپی گزارش» در انتهای متن یک خط `🔑 کد گزارش: KZ1.…` اضافه می‌کند: یک JSON فشرده که با base64url رمزگذاری شده است.

```json
{ "k":"KZ", "v":1, "l":"شناسهٔ درس", "lv":1, "s":ستاره, "m":سقف, "b":[نشان‌ها], "t":{بدفهمی: تعداد},
  "a":{هدف: سطح}, "i":{"شناسهٔ اسلاید":[انجام‌شده, تلاش‌های نادرست, راهنما, ستاره]}, "d":ثانیه, "ts":زمان }
```

دانش‌آموزی که درس را آفلاین (از پیام‌رسان) انجام داده، متن را برای معلم می‌فرستد و سامانه می‌تواند کد را بخواند. با `reportCode: false` در شیء `LESSON` این خط حذف می‌شود.

## ملاحظات امنیت و حریم خصوصی برای میزبان

- داده‌های درس از سمت کاربر می‌آیند و **قابل جعل‌اند.** برای تحلیل آموزشی مناسب‌اند، نه برای نمره‌ی رسمی یا صدور گواهی.
- برای `state` سقف اندازه (مثلاً ۲۵۶ کیلوبایت) و برای رویدادها محدودیت نرخ بگذارید.
- متن `reflect.submit` نوشتهٔ آزاد دانش‌آموز است: هنگام نمایش escape کنید و با آن مثل دادهٔ شخصی رفتار کنید.
- دادهٔ خام را فقط تا جای لازم نگه دارید و گزارش‌ها را از داده‌های تجمیعی بسازید.

</div>
