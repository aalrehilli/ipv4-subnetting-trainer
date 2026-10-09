import {
  signInWithPassword,
  signUpWithPassword,
  requestPasswordReset,
  updatePassword,
  translateAuthError
} from "./supabase-v30.js?v=485";

let authBusy=false;

const esc=v=>String(v==null?"":v)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function field(label,id,type,placeholder,autocomplete){
  return '<div class="field"><label for="'+id+'">'+label+'</label>'+
    '<input id="'+id+'" name="'+id+'" type="'+type+'" placeholder="'+placeholder+'" autocomplete="'+autocomplete+'" required></div>';
}

export function authView(mode="login",notice=""){
  const isSignup=mode==="signup";
  const isReset=mode==="reset";
  const title=isReset?"إعادة تعيين كلمة المرور":isSignup?"إنشاء حساب متدرب":"تسجيل الدخول";
  const desc=isReset?"اكتب كلمة مرور جديدة وقوية ثم حدّث حسابك.":isSignup?"أنشئ حسابك للوصول إلى مساحة التدريب والاختبارات والنتائج.":"سجّل الدخول للوصول إلى حسابك ومسارك التدريبي.";

  let form="";
  if(isReset){
    form='<form id="auth-reset-form">'+
      field("كلمة المرور الجديدة","auth-reset-password","password","8 أحرف على الأقل","new-password")+
      field("تأكيد كلمة المرور","auth-reset-confirm","password","أعد كتابة كلمة المرور","new-password")+
      '<button class="btn btn-primary" id="auth-reset-submit" type="submit">تحديث كلمة المرور</button>'+
      '<div class="auth-links"><button type="button" class="link-btn" data-auth-mode="login">العودة لتسجيل الدخول</button></div>'+
      '</form>';
  }else if(isSignup){
    form='<form id="auth-signup-form">'+
      field("الاسم الكامل","auth-signup-name","text","مثال: أحمد محمد","name")+
      field("البريد الإلكتروني","auth-signup-email","email","name@example.com","email")+
      field("كلمة المرور","auth-signup-password","password","8 أحرف على الأقل","new-password")+
      field("تأكيد كلمة المرور","auth-signup-confirm","password","أعد كتابة كلمة المرور","new-password")+
      '<button class="btn btn-primary" id="auth-signup-submit" type="submit">إنشاء الحساب</button>'+
      '<div class="auth-links"><button type="button" class="link-btn" data-auth-mode="login">لدي حساب بالفعل</button></div>'+
      '</form>';
  }else{
    form='<form id="auth-login-form">'+
      field("البريد الإلكتروني","auth-login-email","email","name@example.com","email")+
      field("كلمة المرور","auth-login-password","password","كلمة المرور","current-password")+
      '<button class="btn btn-primary" id="auth-login-submit" type="submit">دخول</button>'+
      '<div class="auth-links">'+
      '<button type="button" class="link-btn" data-auth-mode="reset-request">نسيت كلمة المرور؟</button>'+
      '<button type="button" class="link-btn" data-auth-mode="signup">إنشاء حساب جديد</button>'+
      '</div>'+
      '</form>';
  }

  if(mode==="reset-request"){
    return '<div class="auth-wrap"><div class="auth-card">'+
      '<div class="brand" style="padding:0 0 18px"><div class="brand-mark">IP</div><div><h1>IPv4 Academy</h1><div class="muted">V3.72 • الحسابات</div></div></div>'+
      '<h2 style="margin:0 0 8px">استعادة كلمة المرور</h2><p class="muted">سنرسل رسالة إلى بريدك الإلكتروني لإعادة تعيين كلمة المرور.</p>'+
      '<form id="auth-reset-request-form">'+
      field("البريد الإلكتروني","auth-reset-email","email","name@example.com","email")+
      '<button class="btn btn-primary" id="auth-reset-request-submit" type="submit">إرسال رابط الاستعادة</button>'+
      '<div class="auth-links"><button type="button" class="link-btn" data-auth-mode="login">العودة لتسجيل الدخول</button></div>'+
      '</form></div></div>';
  }

  return '<div class="auth-wrap"><div class="auth-card">'+
    '<div class="brand" style="padding:0 0 18px"><div class="brand-mark">IP</div><div><h1>IPv4 Academy</h1><div class="muted">منصة التدريب الذكية • V3.72</div></div></div>'+
    '<h2 style="margin:0 0 8px">'+title+'</h2><p class="muted">'+desc+'</p>'+
    (notice?'<div id="auth-notice" class="note" style="margin:14px 0">'+esc(notice)+'</div>':'<div id="auth-notice" class="note" style="display:none;margin:14px 0"></div>')+
    '<div id="auth-message" style="margin:12px 0"></div>'+
    form+
    (!isReset&&!isSignup?'<div class="note" style="margin-top:16px">التسجيل العام ينشئ حساب <strong>متدرب</strong> فقط. صلاحيات المدرب والمدير تُدار من داخل النظام.</div>':"")+
    '</div></div>';
}

function setMessage(text,type="info"){
  const el=document.getElementById("auth-message");
  if(!el)return;
  const cls=type==="error"?"red":type==="success"?"green":"purple";
  el.innerHTML='<div class="note" style="border-right:4px solid var(--'+cls+')">'+esc(text)+'</div>';
}

function setBusy(form,busy){
  if(!form)return;
  form.querySelectorAll("button").forEach(b=>b.disabled=busy);
}

async function submitLogin(form){
  const email=form.querySelector("#auth-login-email")?.value.trim();
  const password=form.querySelector("#auth-login-password")?.value||"";
  if(!email||!password) return setMessage("أدخل البريد الإلكتروني وكلمة المرور.","error");
  authBusy=true;setBusy(form,true);
  const r=await signInWithPassword(email,password);
  authBusy=false;setBusy(form,false);
  if(!r.ok)return setMessage(translateAuthError(r.error||r.reason||"تعذر تسجيل الدخول."),"error");
  window.dispatchEvent(new CustomEvent("ipv4-auth-success"));
}

async function submitSignup(form){
  const name=form.querySelector("#auth-signup-name")?.value.trim();
  const email=form.querySelector("#auth-signup-email")?.value.trim();
  const password=form.querySelector("#auth-signup-password")?.value||"";
  const confirm=form.querySelector("#auth-signup-confirm")?.value||"";
  if(!name||!email||!password)return setMessage("أكمل جميع الحقول.","error");
  if(password.length<8)return setMessage("كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.","error");
  if(password!==confirm)return setMessage("تأكيد كلمة المرور غير مطابق.","error");
  authBusy=true;setBusy(form,true);
  const r=await signUpWithPassword(email,password,name);
  authBusy=false;setBusy(form,false);
  if(!r.ok)return setMessage(translateAuthError(r.error||r.reason||"تعذر إنشاء الحساب."),"error");
  if(r.session){
    setMessage("تم إنشاء الحساب وتسجيل الدخول بنجاح.","success");
    window.dispatchEvent(new CustomEvent("ipv4-auth-success"));
  }else{
    setMessage("تم إنشاء الحساب. افحص بريدك الإلكتروني واضغط رابط التحقق لإكمال الدخول.","success");
    form.reset();
  }
}

async function submitResetRequest(form){
  const email=form.querySelector("#auth-reset-email")?.value.trim();
  if(!email)return setMessage("أدخل بريدك الإلكتروني.","error");
  authBusy=true;setBusy(form,true);
  const r=await requestPasswordReset(email);
  authBusy=false;setBusy(form,false);
  if(!r.ok)return setMessage(translateAuthError(r.error||r.reason||"تعذر إرسال الرابط."),"error");
  setMessage("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.","success");
}

async function submitReset(form){
  const password=form.querySelector("#auth-reset-password")?.value||"";
  const confirm=form.querySelector("#auth-reset-confirm")?.value||"";
  if(password.length<8)return setMessage("كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.","error");
  if(password!==confirm)return setMessage("تأكيد كلمة المرور غير مطابق.","error");
  authBusy=true;setBusy(form,true);
  const r=await updatePassword(password);
  authBusy=false;setBusy(form,false);
  if(!r.ok)return setMessage(translateAuthError(r.error||r.reason||"تعذر تحديث كلمة المرور."),"error");
  setMessage("تم تحديث كلمة المرور بنجاح. سيتم تحويلك إلى تسجيل الدخول.","success");
  setTimeout(()=>window.dispatchEvent(new CustomEvent("ipv4-auth-password-updated")),700);
}

export function bindAuth(){
  if(authBusy)return;
  document.querySelectorAll("[data-auth-mode]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const mode=btn.getAttribute("data-auth-mode")||"login";
      window.dispatchEvent(new CustomEvent("ipv4-auth-mode",{detail:{mode}}));
    });
  });
  document.getElementById("auth-login-form")?.addEventListener("submit",e=>{e.preventDefault();submitLogin(e.currentTarget);});
  document.getElementById("auth-signup-form")?.addEventListener("submit",e=>{e.preventDefault();submitSignup(e.currentTarget);});
  document.getElementById("auth-reset-request-form")?.addEventListener("submit",e=>{e.preventDefault();submitResetRequest(e.currentTarget);});
  document.getElementById("auth-reset-form")?.addEventListener("submit",e=>{e.preventDefault();submitReset(e.currentTarget);});
}
