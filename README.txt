# V13 Authentication Pages

Pages:
- login.html — تسجيل الدخول
- register.html — إنشاء حساب
- forgot-password.html — إرسال رابط إعادة تعيين كلمة المرور
- reset-password.html — تعيين كلمة مرور جديدة
- index.html — تحويل تلقائي إلى تسجيل الدخول

Supabase:
- Auth Email/Password
- emailRedirectTo للإنتاج
- Password recovery عبر resetPasswordForEmail/updateUser

قبل الاستخدام:
1. Supabase Authentication > URL Configuration
2. Site URL:
   https://aalrehilli.github.io/ipv4-subnetting-trainer/
3. Redirect URLs أضف:
   https://aalrehilli.github.io/ipv4-subnetting-trainer/**
