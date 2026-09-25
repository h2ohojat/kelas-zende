# پل «کلاس زنده» (kelas-bridge v1)

<div dir="rtl">

این سند قرارداد ارتباط یک درس «کلاس زنده» با **سایت میزبان** است؛ یعنی صفحه‌ای که درس را داخل `<iframe>` نمایش می‌دهد، مثل یک سامانهٔ آموزشی. این پل از نسخهٔ **1.1.0** موتور در دسترس است. نسخهٔ **1.2.0** این‌ها را اضافه کرده، بی‌آنکه چیزی از 1.1 تغییر کند: بلوک [`kz-meta`](#kz-meta-برگهٔ-درس-برای-میزبان)، فیلد `contentMode`، شناسهٔ پایدار اسلایدها، و رویداد [`lesson.summary`](#خلاصهٔ-نهایی-lessonsummary).

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
| `hello` | پس از بارگذاری، و در پاسخ به `ping` | `engine`، `session`، `storage` (آیا `localStorage` در دسترس است)، `caps`، `lesson` (شناسه، نسخه، عنوان، `contentMode`، `maxStars`، اهداف، مراحل، **فرهنگ بدفهمی‌ها `tags`**، و **کاتالوگ اسلایدها `items`**) |
| `event` | هر تعامل | `type`، `ts`، `seq`، `session`، `lesson`، `mode`، `slide`، `data` |
| `state` | حدود ۸۰۰ میلی‌ثانیه پس از هر تغییر، فقط اگر میزبان `persist: true` داده باشد | وضعیت کامل برای ادامهٔ درس (به‌صورت شیء مبهم ذخیره شود) |
| `summary` | در پاسخ به فرمان `summary`، و (از 1.2) همراه هر `lesson.summary` | خلاصهٔ کارکرد |

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
| `lesson.complete` | با باز شدن صفحهٔ پایان: ستاره، درصد، نشان‌ها، بدفهمی‌ها، زمان، و وضعیت هر اسلاید (خودارزیابی هنوز انجام نشده) |
| `lesson.summary` | (1.2) خلاصهٔ نهایی پس از خودارزیابی و تأمل؛ پایین‌تر را ببینید |
| `mode.change`، `class.think`، `class.timer` | رویدادهای کلاس در حالت ارائه |
| `custom.*` | داده‌ای که فعالیت‌های سفارشی با `api.emit()` می‌فرستند |
| `host.connected` | `persist`، `resumed` |

## خلاصهٔ نهایی (`lesson.summary`)

`lesson.complete` وقتی صفحهٔ پایان باز می‌شود فرستاده می‌شود؛ یعنی **پیش از** خودارزیابی و نوشتن تأمل. از نسخهٔ 1.2، پس از آن `lesson.summary` هم فرستاده می‌شود:

- وقتی دانش‌آموز به همهٔ هدف‌ها خودارزیابی داد (`reason: 'self'`)،
- وقتی جملهٔ تأمل را نوشت (`reason: 'reflect'`)،
- و وقتی پس از پایان درس صفحه را ترک کرد (`reason: 'leave'`).

`data` همان خلاصهٔ `lesson.complete` است به‌اضافهٔ `self` (سطح هر هدف)، `selfComplete`، `reflect` (متن تأمل، حداکثر ۲۰۰۰ نویسه)، `reflectLength`، `contentMode`، `reason` و `final`. وقتی `final: true` باشد (همهٔ هدف‌ها ارزیابی شده‌اند، یا درس هدفی ندارد)، خلاصه کامل است. هر خلاصهٔ تازه جای قبلی را می‌گیرد؛ **میزبان آخرین را نگه دارد.** همراه هر `lesson.summary`، یک پیام `kind: 'summary'` هم فرستاده می‌شود.

## `kz-meta`: برگهٔ درس برای میزبان

هر درسی که با موتور 1.2 ساخته شود (`node _src/build.js`)، در `<head>` این بلوک را دارد:

```html
<script type="application/json" id="kz-meta">{ "kz": 1, "engine": "1.2.0", "id": "density-g7-v1", … }</script>
```

میزبان آن را **بدون اجرای JavaScript** می‌خواند (مثلاً هنگام بارگذاری فایل در پنل). فیلدها:

| فیلد | توضیح |
|---|---|
| `kz` | نسخهٔ قالب همین بلوک (اکنون ۱) |
| `engine` | نسخهٔ موتوری که فایل با آن ساخته شده |
| `id`، `version` | شناسهٔ انگلیسی درس و نسخهٔ محتوا (با هر تغییر محتوا یکی بیشتر شود) |
| `title`، `subtitle`، `grade`، `subject`، `duration` | متن ساده |
| `durationMinutes` | عدد، یا `null` |
| `contentMode` | `syllabus` (سرفصل‌محور؛ مثال و بیان از خودمان) یا `textbook-licensed` (مطابق کتاب) |
| `licenseNumber` | برای `textbook-licensed` الزامی؛ بدون آن build شکست می‌خورد |
| `objectives`، `concepts`، `prerequisites` | فهرست متن ساده |
| `stages` | `{ id, title }` |
| `maxStars` | بیشترین ستارهٔ ممکن |
| `misconceptions` | `{ tag, title, review }`: فرهنگ بدفهمی‌ها |
| `items` | کاتالوگ اسلایدها: `id`، `idx`، `type`، `stage`، `gated`، `scored`، `q`، `tags` |

**قواعد build:** `id` درس و هر اسلاید تعاملی (`mcq`، `input`، `sort`، `order`، `poll`، `steps`، `custom`) باید یک شناسهٔ انگلیسی کوتاه، یکتا و پایدار باشد (`a-z`، `0-9`، `-`). اگر نباشد، build با پیام روشن متوقف می‌شود. درسی که با نسخهٔ 1.1 ساخته شده و این شناسه‌ها را ندارد، همچنان اجرا می‌شود؛ موتور فقط در کنسول هشدار می‌دهد و برای آن اسلایدها `s{شماره}` را به کار می‌برد.

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
