V13 Final — فصل المصادقة عن المنصة

index.html = المنصة الرئيسية فقط
login.html = تسجيل الدخول
register.html = إنشاء الحساب
forgot-password.html = إرسال رابط إعادة التعيين
reset-password.html = تعيين كلمة مرور جديدة

بعد تسجيل الدخول يتم التحقق من جلسة Supabase ثم الانتقال إلى index.html.
إذا تعذر قراءة profiles لا يتم طرد المستخدم؛ يتم استخدام بيانات Auth كخطة احتياطية مع role=student.

Supabase URL Configuration:
Site URL: https://aalrehilli.github.io/ipv4-subnetting-trainer/
Redirect URLs: https://aalrehilli.github.io/ipv4-subnetting-trainer/**
