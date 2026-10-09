import { signInWithPassword, signOut, getSupabaseStatus } from "./supabase-v30.js?v=485";

const $ = id => document.getElementById(id);
const msg = $("msg");
const form = $("admin-form");
const submit = $("submit");

function show(text, ok=false){
  msg.textContent = text;
  msg.className = "msg show" + (ok ? " ok" : "");
}
function busy(flag){
  submit.disabled = flag;
  submit.textContent = flag ? "جاري التحقق…" : "دخول الإدارة";
}

async function boot(){
  const params = new URLSearchParams(location.search);
  if(params.get("denied")==="1"){
    show("تم رفض الدخول: هذا الحساب ليس حساب مدير.");
  }
  try{
    const status = await getSupabaseStatus();
    if(status?.authenticated){
      if(String(status.role)==="admin"){
        location.replace("./index.html?admin=1");
        return;
      }
      await signOut();
      if(params.get("denied")!=="1") show("الحساب مسجل الدخول حاليًا، لكنه لا يملك صلاحية المدير.");
    }
  }catch(error){
    show("تعذر التحقق من حالة الحساب. حاول مرة أخرى.");
  }
}

form.addEventListener("submit", async event=>{
  event.preventDefault();
  const email = String($("email").value||"").trim();
  const password = String($("password").value||"");
  if(!email || !password){ show("أدخل البريد الإلكتروني وكلمة المرور."); return; }
  busy(true);
  try{
    const result = await signInWithPassword(email,password);
    if(!result.ok){
      show(String(result.error||result.reason||"تعذر تسجيل الدخول."));
      return;
    }
    const status = await getSupabaseStatus();
    if(!status?.authenticated){
      await signOut();
      show("تم تسجيل الدخول، لكن تعذر قراءة ملف الإدارة. تحقق من إعدادات المنصة.");
      return;
    }
    if(String(status.role)!=="admin"){
      await signOut();
      show("تم رفض الدخول: هذا الحساب ليس حساب مدير.");
      return;
    }
    show("تم التحقق من صلاحية المدير، جاري فتح لوحة الإدارة…",true);
    setTimeout(()=>location.replace("./index.html?admin=1"),250);
  }catch(error){
    try{ await signOut(); }catch{}
    show("تعذر إكمال تسجيل دخول الإدارة.");
  }finally{
    busy(false);
  }
});

boot();
