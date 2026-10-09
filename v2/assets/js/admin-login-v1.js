import { signInWithPassword, signOut, getSupabaseStatus, fetchTrainerStudentRoster, fetchTrainerResultsSummary, fetchTrainerLiveExamMonitor } from "./supabase-v30.js?v=493";

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const msg=t=>{const e=$("msg");if(e){e.textContent=t;e.className="msg show";}};
const busy=b=>{const e=$("submit");if(e){e.disabled=b;e.textContent=b?"جاري تسجيل الدخول…":"دخول الإدارة";}};

function kpi(title,value,sub){
  return '<div class="adm-kpi"><div class="t">'+esc(title)+'</div><div class="v">'+esc(value)+'</div><div class="s">'+esc(sub)+'</div></div>';
}
function btn(id,title){
  return '<button class="adm-btn" id="'+id+'">'+esc(title)+'</button>';
}
async function dashboard(){
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  let students=0,groups=0,exams=0,active=0,recent=[];
  try{const r=await fetchTrainerStudentRoster("","");const p=r?.payload||{};students=Array.isArray(p.students)?p.students.length:0;groups=Array.isArray(p.groups)?p.groups.length:0;}catch{}
  try{const r=await fetchTrainerResultsSummary("");const p=r?.payload||{};exams=Number(p.summary?.exams||0);recent=Array.isArray(p.recent)?p.recent.slice(0,10):[];}catch{}
  try{const r=await fetchTrainerLiveExamMonitor();active=Number(r?.payload?.activeCount||0);}catch{}
  document.body.innerHTML='<div class="admin-page">'+
    '<div class="adm-wrap">'+
      '<section class="adm-hero"><div><div class="ver">🔐 بوابة الإدارة • V3.89</div><h1>مرحبًا '+esc(name)+' 👋</h1><p>لوحة مدير IPv4 Academy المستقلة عن مساحة المتدربين.</p><div class="actions">'+btn("dash-refresh","تحديث البيانات")+btn("dash-students","المتدربون")+btn("dash-results","النتائج")+btn("dash-exams","الاختبارات")+btn("dash-analytics","التحليلات")+btn("dash-logout","تسجيل الخروج")+'</div></div><div class="mark">IP</div></section>'+
      '<div class="kpis">'+kpi("المتدربون",students,"السجلات الظاهرة")+kpi("المجموعات",groups,"المجموعات المسجلة")+kpi("الاختبارات",exams,"لها نتائج")+kpi("اختبارات نشطة",active,"المراقبة الحية")+'</div>'+
      '<section class="panel"><h2>آخر النتائج</h2><div class="table-wrap"><table><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th></tr></thead><tbody>'+
      (recent.length?recent.map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td></tr>').join(""):'<tr><td colspan="4" class="empty">لا توجد نتائج مركزية بعد.</td></tr>')+
      '</tbody></table></div></section>'+
    '</div></div>'+
    '<style>.admin-page{min-height:100vh;background:#f4f8fc;direction:rtl;font-family:Tahoma,Arial,sans-serif;color:#17324d}.adm-wrap{max-width:1240px;margin:auto;padding:24px}.adm-hero{background:#0b6bcb;color:#fff;border-radius:22px;padding:28px;display:flex;justify-content:space-between;align-items:center;gap:20px}.adm-hero h1{margin:0 0 8px;font-size:30px}.adm-hero p{margin:0;opacity:.9}.ver{font-size:13px;font-weight:900;margin-bottom:8px}.mark{width:60px;height:60px;border-radius:16px;background:#fff;color:#0b6bcb;display:grid;place-items:center;font-weight:900}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:17px}.adm-btn{border:1px solid rgba(255,255,255,.65);background:transparent;color:#fff;border-radius:10px;padding:10px 14px;font-weight:900;cursor:pointer;font-family:inherit}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}.adm-kpi{background:#fff;border:1px solid #dbe7f2;border-radius:18px;padding:18px}.adm-kpi .t{color:#73879a;font-weight:700}.adm-kpi .v{font-size:30px;font-weight:900;color:#0b6bcb;margin:8px 0}.adm-kpi .s{font-size:13px;color:#8b9aaa}.panel{background:#fff;border:1px solid #dbe7f2;border-radius:18px;padding:18px}.panel h2{margin:0 0 14px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:11px;border-bottom:1px solid #edf2f6;text-align:right;white-space:nowrap}.empty{text-align:center;color:#8596a6;padding:28px}@media(max-width:800px){.kpis{grid-template-columns:1fr 1fr}.adm-hero{align-items:flex-start;flex-direction:column}}@media(max-width:500px){.kpis{grid-template-columns:1fr}.adm-wrap{padding:12px}}</style>';
  $("dash-refresh")?.addEventListener("click",()=>dashboard());
  $("dash-students")?.addEventListener("click",()=>msg("سيتم فتح مركز المتدربين بعد هذه الخطوة."));
  $("dash-results")?.addEventListener("click",()=>msg("سيتم فتح مركز النتائج بعد هذه الخطوة."));
  $("dash-exams")?.addEventListener("click",()=>msg("سيتم فتح مركز الاختبارات بعد هذه الخطوة."));
  $("dash-analytics")?.addEventListener("click",()=>msg("سيتم فتح مركز التحليلات بعد هذه الخطوة."));
  $("dash-logout")?.addEventListener("click",async()=>{await signOut();location.href="./admin.html";});
}
async function init(){
  try{
    const status=await getSupabaseStatus();
    window.__IPV4_SUPABASE_STATUS__=status;
    if(status?.authenticated&&String(status.role)==="admin"){await dashboard();}
  }catch{}
}
const form=$("admin-form");
form?.addEventListener("submit",async e=>{
  e.preventDefault();
  const email=String($("email")?.value||"").trim();
  const password=String($("password")?.value||"");
  if(!email||!password){msg("أدخل البريد الإلكتروني وكلمة المرور.");return;}
  busy(true);
  try{
    const r=await signInWithPassword(email,password);
    if(!r.ok){msg(String(r.error||r.reason||"تعذر تسجيل الدخول."));return;}
    const status=await getSupabaseStatus();
    window.__IPV4_SUPABASE_STATUS__=status;
    if(!status?.authenticated){await signOut();msg("تم تسجيل الدخول لكن تعذر قراءة جلسة المدير.");return;}
    if(String(status.role)!=="admin"){await signOut();msg("هذا الحساب ليس حساب مدير.");return;}
    await dashboard();
  }catch(error){
    msg("حدث خطأ أثناء الدخول: "+String(error?.message||error));
  }finally{busy(false);}
});
init();
