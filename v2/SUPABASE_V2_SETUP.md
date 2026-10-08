# تشغيل قاعدة بيانات IPv4 Academy V2

## 1) إنشاء البنية
افتح مشروع Supabase المستخدم حالياً ثم شغّل كامل الملف:

`v2/supabase/schema.sql`

## 2) إظهار Schema V2
من Supabase:
**Settings → API → Exposed schemas**

أضف:
`academy_v2`

## 3) الصلاحيات
لا تمنح المتدرب صلاحية تغيير:
- role
- is_active
- scores
- passed
- attempts الخاصة بمتدربين آخرين

هذه الصلاحيات يجب أن تبقى خلف RLS وRPC.

## 4) اختبار الإنشاء
عند تسجيل مستخدم جديد في Auth:
- يُنشأ له سجل تلقائياً في `academy_v2.profiles`
- الدور الافتراضي: `student`
- لا يتم قبول role من بيانات التسجيل.

## 5) التصميم المعتمد
Student:
الرئيسية → تحديد المستوى → المقرر → التدريب → الاختبار → التحليل → التحسين → الشهادة

Trainer:
Command Center → المتدربون → المجموعات → المقررات → بنك الأسئلة → الاختبارات → المختبرات → التحليلات

## 6) المرحلة البرمجية التالية
سيتم تحويل البيانات التجريبية في الواجهة إلى:
- تسجيل الدخول والجلسة
- Student 360
- Trainer Command Center الحقيقي
- RPC للتحليلات
- محاولات الاختبارات server-authoritative
- نظام الإشعارات
- Smart Review Engine

> V2 تستخدم حالياً نفس مشروع Supabase الخاص بالمنصة الحالية، لكن داخل schema مستقل `academy_v2` حتى لا نؤثر على V1. يمكن نقلها لاحقاً إلى مشروع Supabase مستقل بدون إعادة تصميم التطبيق.


## V3.29 — ربط النتائج ببنك الأسئلة
كل نتيجة تحفظ:
- question_id للسؤال الأصلي.
- نص السؤال والخيارات وقت المحاولة.
- الموضوع والصعوبة.
- الإجابة المختارة والصحيحة.
- تحليل الدقة لكل سؤال.

وهذا يحافظ على التحليل حتى لو تم تعديل السؤال أو تعطيله لاحقًا في بنك الأسئلة.

## V3.30 — تفعيل Supabase في GitHub Pages
1. افتح:
`v2/assets/js/supabase-config.js`
2. ضع:
- Supabase Project URL.
- Supabase anon/publishable key فقط.
3. لا تضع `service_role` key في الموقع.
4. شغّل كامل:
`v2/supabase/schema.sql`
5. من Supabase:
**Settings → API → Exposed schemas → academy_v2**
6. فعّل Authentication بالطريقة التي ستعتمدها المنصة.
7. امنح المدرب `role='trainer'` في `academy_v2.profiles`.

عند تهيئة Supabase وتسجيل الدخول:
- بنك الأسئلة يُقرأ من `academy_v2.questions`.
- الاختبارات تُحفظ في `academy_v2.exams`.
- ربط الاختبار بالأسئلة في `academy_v2.exam_questions`.
- محاولات الطلاب في `academy_v2.attempts`.
- إجابات كل سؤال في `academy_v2.attempt_answers`.
- لوحة المدرب تقرأ النتائج الفعلية.

عند عدم تهيئة Supabase، تستمر المنصة في العمل بالبيانات المحلية ولا تتعطل الشاشة.
