import { signInWithPassword, signOut, getSupabaseStatus, fetchTrainerStudentRoster, fetchTrainerResultsSummary, fetchTrainerLiveExamMonitor } from "./supabase-v30.js?v=489";

const $=id=>document.getElementById(id);
const msg=$("msg"), form=$("admin-form"), submit=$("submit");

function show(text,ok=false){
  msg.textContent=text;
  msg.className="msg show"+(ok?" ok":"");
}
function busy(flag){
  submit.disabled=flag;
  submit.textContent=flag?"جاري التحقق…":"دخول الإدارة";
}
function shell(content){
  document.body.innerHTML='<div class="admin-shell">'+content+'</div>';
}
function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function card(title,value,sub){
  return '<div class="kpi"><div class="kpi-title">'+esc(title)+'</div><div class="kpi-value">'+esc(value)+'</div><div class="kpi-sub">'+esc(sub)+'</div></div>';
}
async function dashboard(){
  try{
    const [roster,results,live]=await Promise.all([
      fetchTrainerStudentRoster("",""),
      fetchTrainerResultsSummary(""),
      fetchTrainerLiveExamMonitor()
    ]);
    const rs=roster?.payload||{}, rp=results?.payload||{}, lp=live?.payload||{};
    const students=Array.isArray(rs.students)?rs.students:[];
    const groups=Array.isArray(rs.groups)?rs.groups:[];
    const recent=Array.isArray(rp.recent)?rp.recent:[];
    const summary=rp.summary||{};
    const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
    shell(
      '<style>'+
      '.admin-shell{min-height:100vh;background:#f4f8fc;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#17324d}.admin-wrap{max-width:1200px;margin:auto;padding:26px}.admin-head{background:#0b6bcb;color:#fff;border-radius:22px;padding:28px;display:flex;justify-content:space-between;gap:20px;align-items:center}.admin-head h1{margin:0 0 8px;font-size:30px}.admin-head p{margin:0;opacity:.9}.admin-head .mark{width:58px;height:58px;border-radius:16px;background:#fff;color:#0b6bcb;display:grid;place-items:center;font-weight:900;font-size:20px}.admin-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.admin-btn{border:0;border-radius:11px;padding:11px 16px;font-weight:900;cursor:pointer}.admin-btn.primary{background:#fff;color:#0b6bcb}.admin-btn.outline{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6)}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:18px 0}.kpi{background:#fff;border:1px solid #dbe7f2;border-radius:18px;padding:18px;box-shadow:0 8px 22px rgba(31,76,115,.06)}.kpi-title{color:#73879a;font-weight:700}.kpi-value{font-size:30px;font-weight:900;color:#0b6bcb;margin:8px 0}.kpi-sub{font-size:13px;color:#8b9aaa}.panel{background:#fff;border:1px solid #dbe7f2;border-radius:18px;padding:18px;margin-top:18px}.panel h2{margin:0 0 14px;font-size:20px}.table-wrap{overflow:auto}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:11px;border-bottom:1px solid #edf2f6;text-align:right;white-space:nowrap}.badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800}.green{background:#e9f8ef;color:#198754}.orange{background:#fff4e5;color:#a76500}.empty{padding:28px;text-align:center;color:#8596a6}.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.quick button{width:100%;height:auto;margin:0;background:#f7fbff;color:#0b6bcb;border:1px solid #dceaf7;border-radius:14px;padding:16px;font-weight:900;cursor:pointer}.topline{display:flex;justify-content:space-between;align-items:center;gap:10px}.logout{background:#fff;color:#b52b2b;border:1px solid #f0c8c8}.back{background:#0b6bcb;color:#fff;border:0;border-radius:11px;padding:10px 15px;font-weight:900;cursor:pointer}@media(max-width:850px){.kpis,.quick{grid-template-columns:1fr 1fr}.admin-head{flex-direction:column;align-items:flex-start}}@media(max-width:520px){.kpis,.quick{grid-template-columns:1fr}.admin-wrap{padding:14px}.admin-head h1{font-size:23px}}'+
      '</style>'+
      '<div class="admin-wrap">'+
        '<section class="admin-head"><div><div style="font-size:13px;font-weight:800;margin-bottom:8px">🔐 بوابة الإدارة V3.88</div><h1>مرحبًا '+esc(name)+' 👋</h1><p>لوحة مدير منصة IPv4 Academy المستقلة عن مساحة المتدربين.</p>'+
        '<div class="admin-actions"><button class="admin-btn primary" id="admin-refresh">تحديث البيانات</button><button class="admin-btn outline" id="admin-student-site">منصة المتدربين</button><button class="admin-btn outline logout" id="admin-logout">تسجيل الخروج</button></div></div><div class="mark">IP</div></section>'+
        '<div class="kpis">'+
          card("المتدربون",students.length,"السجلات الظاهرة")+
          card("المجموعات",groups.length,"المجموعات المسجلة")+
          card("الاختبارات",Number(summary.exams||0),"لها نتائج")+
          card("اختبارات نشطة",Number(lp.activeCount||0),"المراقبة الحية")+
        '</div>'+
        '<section class="panel"><div class="topline"><h2>إدارة المنصة</h2><span class="badge green">مدير النظام</span></div><div class="quick">'+
          '<button id="go-students">👥 المتدربون</button><button id="go-results">📊 النتائج</button><button id="go-exams">📝 الاختبارات</button><button id="go-analytics">📈 التحليلات</button>'+
        '</div></section>'+
        '<section class="panel"><h2>آخر النتائج</h2><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>'+
          (recent.length?recent.slice(0,10).map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td></tr>').join(""):'<tr><td colspan="5"><div class="empty">لا توجد نتائج مركزية بعد.</div></td></tr>')+
        '</tbody></table></div></section>'+
      '</div>'
    );
    $("#admin-logout")?.addEventListener("click",async()=>{await signOut();location.href="./admin.html";});
    $("#admin-student-site")?.addEventListener("click",()=>{location.href="./index.html";});
    $("#admin-refresh")?.addEventListener("click",()=>location.reload());
    const info=(label)=>show("وحدة "+label+" ستتصل بمركز الإدارة الموحد في الإصدار التالي.",true);
    $("#go-students")?.addEventListener("click",()=>info("المتدربين"));
    $("#go-results")?.addEventListener("click",()=>info("النتائج"));
    $("#go-exams")?.addEventListener("click",()=>info("الاختبارات"));
    $("#go-analytics")?.addEventListener("click",()=>info("التحليلات"));
  }catch(error){
    show("تم تسجيل الدخول، لكن تعذر تحميل لوحة الإدارة: "+String(error?.message||error));
  }
}

async function boot(){
  const params=new URLSearchParams(location.search);
  if(params.get("denied")==="1") show("تم رفض الدخول: هذا الحساب ليس حساب مدير.");
  try{
    const status=await getSupabaseStatus();
    window.__IPV4_SUPABASE_STATUS__=status;
    if(status?.authenticated && String(status.role)==="admin"){
      await dashboard();
      return;
    }
    if(status?.authenticated){
      await signOut();
    }
  }catch(error){
    show("تعذر التحقق من حالة الحساب. حاول مرة أخرى.");
  }
}

form.addEventListener("submit",async event=>{
  event.preventDefault();
  const email=String($("email").value||"").trim();
  const password=String($("password").value||"");
  if(!email||!password){show("أدخل البريد الإلكتروني وكلمة المرور.");return;}
  busy(true);
  try{
    const result=await signInWithPassword(email,password);
    if(!result.ok){show(String(result.error||result.reason||"تعذر تسجيل الدخول."));return;}
    const status=await getSupabaseStatus();
    window.__IPV4_SUPABASE_STATUS__=status;
    if(!status?.authenticated){
      await signOut();
      show("تم تسجيل الدخول، لكن تعذر قراءة ملف الإدارة.");
      return;
    }
    if(String(status.role)!=="admin"){
      await signOut();
      show("تم رفض الدخول: هذا الحساب ليس حساب مدير.");
      return;
    }
    await dashboard();
  }catch(error){
    try{await signOut();}catch{}
    show("تعذر إكمال تسجيل دخول الإدارة.");
  }finally{busy(false);}
});

boot();
