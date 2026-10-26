// کاربرگ از همان renderer، state و گزارش درس استفاده می‌کند.
var LESSON = {
  id: 'worksheet-states-of-matter', version: 2, layout: 'worksheet', contentMode: 'syllabus',
  title: 'کاربرگ تعاملی: حالت‌های ماده', subtitle: 'تمرین‌ها را به ترتیب دلخواه حل کن',
  grade: 'سوم و چهارم', subject: 'علوم', duration: '۱۰ دقیقه', durationMinutes: 10, mascot: '📝',
  intro: '<p>برای هر تمرین پاسخ بده؛ اگر نیاز داشتی راهنما را باز کن. پاسخ نیمه‌تمام هم حفظ می‌شود.</p>',
  startStudent: 'شروع کاربرگ', startStudentNote: 'همهٔ تمرین‌ها در یک صفحه؛ گزارش پس از تکمیل',
  objectives: ['حالت ماده را با مثال تشخیص بدهم.'],
  stages: [{id: 'practice', title: 'تمرین', icon: '📝'}, {id: 'finish', title: 'گزارش', icon: '🪞'}],
  tags: {shape: {t: 'شکل و حجم مایع', review: 'شکل مایع با ظرف عوض می‌شود، حجم آن ثابت می‌ماند.'}},
  slides: [
    {id: 'liquid-shape', stage: 'practice', type: 'mcq', q: 'با ریختن آب در ظرف دیگر، چه چیزی عوض می‌شود؟',
      options: [{t: 'شکل', ok: true, fb: 'درست است؛ آب شکل ظرف را می‌گیرد.'}, {t: 'حجم', tag: 'shape', fb: 'مقدار آب ثابت می‌ماند؛ به شکل ظرف توجه کن.'}],
      hints: ['به مقدار آب نگاه کن.', 'همان آب را به ظرف اول برگردان.', 'شکل ظرف عوض شده است.']},
    {id: 'boiling-point', stage: 'practice', type: 'input', kind: 'number', q: 'آب در شرایط معمول در چند درجهٔ سانتی‌گراد می‌جوشد؟', answer: 100, unit: 'درجه',
      hints: ['دمای جوش از دمای اتاق بیشتر است.', 'عدد سه‌رقمی است.', 'صد درجه.']},
    {id: 'report', stage: 'finish', type: 'end', prompt: 'یک مثال تازه برای تغییر حالت ماده بنویس.'}
  ]
};
