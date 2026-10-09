import {
  signInWithPassword,
  signUpWithPassword,
  requestPasswordReset,
  updatePassword,
  translateAuthError,
  getSupabaseStatus,
  signOut
} from "./supabase-v30.js?v=503";

let authBusy=false;
let selectedRole="student";

const esc=v=>String(v==null?"":v)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function roleTabs(){
  const roles=[
    ["student","👨‍🎓","المتدرب","الوصول إلى المقرر والتدريب والاختبارات"],
    ["trainer","👨‍🏫","المدرب","إدارة المتدربين والمحتوى والنتائج"],
    ["admin","🛡️","الإدارة","إدارة المستخدمين والمنصة بالكامل"]
  ];
  return '<div class="auth-role-tabs" role="tablist" aria-label="نوع الحساب">'+roles.map(function(r){
    return '<button type="button" class="auth-role-tab '+(selectedRole===r[0]?"active":"")+'" data-auth-role="'+r[0]+'" role="tab" aria-selected="'+(selectedRole===r[0]?"true":"false")+'"><span class="auth-role-icon">'+r[1]+'</span><span><strong>'+r[2]+'</strong><small>'+r[3]+'</small></span></button>';
  }).join("")+'</div>';
}
function selectedRoleNote(){
  const notes={
    student:"للمتدربين: الدروس، التمارين، الاختبارات، المراجعة والنتائج.",
    trainer:"للمدربين: إدارة المتدربين والمجموعات والمقررات والاختبارات والنتائج.",
    admin:"للإدارة: التحكم الكامل بالمستخدمين والمنصة وإعداداتها."
  };
  return notes[selectedRole]||notes.student;
}

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
    form='<div id="auth-role-panel" class="auth-role-panel">'+roleTabs()+'</div>'+
      '<div id="auth-role-description" class="auth-role-description">'+selectedRoleNote()+'</div>'+
      '<form id="auth-login-form">'+
      field("البريد الإلكتروني","auth-login-email","email","name@example.com","email")+
      field("كلمة المرور","auth-login-password","password","كلمة المرور","current-password")+
      '<button class="btn btn-primary auth-login-btn" id="auth-login-submit" type="submit"><span>دخول</span><span>←</span></button>'+
      '<div class="auth-links">'+
      '<button type="button" class="link-btn" data-auth-mode="reset-request">نسيت كلمة المرور؟</button>'+
      '<button type="button" class="link-btn" data-auth-mode="signup">إنشاء حساب متدرب</button>'+
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
  if(!r.ok){
    authBusy=false;setBusy(form,false);
    return setMessage(translateAuthError(r.error||r.reason||"تعذر تسجيل الدخول."),"error");
  }
  const status=await getSupabaseStatus();
  const actual=String(status.role||"student");
  if(!status.authenticated){
    await signOut().catch(()=>{});
    authBusy=false;setBusy(form,false);
    return setMessage(status.message||"تعذر التحقق من صلاحية الحساب.","error");
  }
  if(actual!==selectedRole){
    await signOut().catch(()=>{});
    authBusy=false;setBusy(form,false);
    const labels={student:"المتدرب",trainer:"المدرب",admin:"الإدارة"};
    return setMessage("هذا الحساب مصنف كـ "+(labels[actual]||"حساب آخر")+"، بينما اخترت تبويب "+(labels[selectedRole]||"آخر")+" . اختر التبويب الصحيح ثم حاول مرة أخرى.","error");
  }
  authBusy=false;setBusy(form,false);
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
  document.querySelectorAll("[data-auth-role]").forEach(function(btn){
    btn.addEventListener("click",function(){
      selectedRole=btn.getAttribute("data-auth-role")||"student";
      document.querySelectorAll("[data-auth-role]").forEach(function(x){
        const active=x.getAttribute("data-auth-role")===selectedRole;
        x.classList.toggle("active",active);
        x.setAttribute("aria-selected",active?"true":"false");
      });
      const note=document.getElementById("auth-role-description");
      if(note)note.textContent=selectedRoleNote();
    });
  });
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
