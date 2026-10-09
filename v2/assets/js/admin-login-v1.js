import {
  signInWithPassword,
  signOut,
  getSupabaseStatus,
  fetchTrainerStudentRoster,
  fetchTrainerResultsSummary,
  fetchTrainerLiveExamMonitor,
  fetchExamE2EReadiness,
  fetchQuestionBankAudit,
  fetchTrainerLearningSignals
} from "./supabase-v30.js?v=491";

const $=id=>document.getElementById(id);

function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function shell(content){
  document.body.innerHTML='<div class="admin-shell">'+content+'</div>';
}
function card(title,value,sub){
  return '<div class="kpi"><div class="kpi-title">'+esc(title)+'</div><div class="kpi-value">'+esc(value)+'</div><div class="kpi-sub">'+esc(sub)+'</div></div>';
}
function styles(){
  return '<style>'+
  '.admin-shell{min-height:100vh;background:#f4f8fc;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#17324d}.admin-wrap{max-width:1240px;margin:auto;padding:24px}.admin-head{background:#0b6bcb;color:#fff;border-radius:22px;padding:24px 28px;display:flex;justify-content:space-between;gap:22px;align-items:center;box-shadow:0 10px 28px rgba(20,75,120,.12)}.admin-head h1{margin:0 0 8px;font-size:30px}.admin-head p{margin:0;opacity:.9;line-height:1.8}.mark{width:60px;height:60px;border-radius:16px;background:#fff;color:#0b6bcb;display:grid;place-items:center;font-weight:900;font-size:20px;flex:0 0 auto}.admin-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.admin-btn{border-radius:11px;padding:10px 15px;font-weight:900;cursor:pointer;font-family:inherit}.primary{border:0;background:#fff;color:#0b6bcb}.outline{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.65)}.danger{background:#fff;color:#b32929;border:1px solid #f0c7c7}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}.kpi,.panel{background:#fff;border:1px solid #dbe7f2;border-radius:18px;box-shadow:0 8px 24px rgba(31,76,115,.05)}.kpi{padding:18px}.kpi-title{color:#73879a;font-weight:700}.kpi-value{font-size:30px;font-weight:900;color:#0b6bcb;margin:8px 0}.kpi-sub{font-size:13px;color:#8b9aaa}.panel{padding:18px;margin-top:16px}.panel h2{margin:0 0 14px;font-size:20px}.topline{display:flex;justify-content:space-between;align-items:center;gap:10px}.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.quick button,.filterbar button{background:#f7fbff;color:#0b6bcb;border:1px solid #dceaf7;border-radius:13px;padding:14px;font-weight:900;cursor:pointer;font-family:inherit}.table-wrap{overflow:auto}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:11px;border-bottom:1px solid #edf2f6;text-align:right;white-space:nowrap}.badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800}.green{background:#e9f8ef;color:#198754}.orange{background:#fff4e5;color:#a76500}.purple{background:#f1ecff;color:#6d45b3}.blue{background:#edf6ff;color:#0b6bcb}.empty{padding:28px;text-align:center;color:#8596a6}.filterbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.filterbar input,.filterbar select{height:42px;border:1px solid #cbdbea;border-radius:10px;padding:0 12px;font-family:inherit;min-width:180px}.back{background:#0b6bcb;color:#fff;border:0;border-radius:10px;padding:9px 14px;font-weight:900;cursor:pointer}.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.signal{padding:14px;border:1px solid #e2ebf3;border-radius:13px;background:#fbfdff}.meter{height:8px;background:#e8eef5;border-radius:999px;overflow:hidden}.meter>span{display:block;height:100%;background:#0b6bcb}.section-link{color:#0b6bcb;font-weight:900;cursor:pointer}@media(max-width:900px){.kpis,.quick{grid-template-columns:1fr 1fr}.grid2{grid-template-columns:1fr}.admin-head{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.kpis,.quick{grid-template-columns:1fr}.admin-wrap{padding:12px}.admin-head h1{font-size:24px}}'+
  '</style>';
}
function header(title,subtitle){
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  return styles()+
  '<div class="admin-wrap"><section class="admin-head"><div><div style="font-size:13px;font-weight:800;margin-bottom:7px">🔐 بوابة الإدارة V3.89</div><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p><div class="admin-actions">'+
  '<button class="admin-btn primary" id="go-dashboard">لوحة الإدارة</button><button class="admin-btn outline" id="refresh-page">تحديث</button><button class="admin-btn outline" id="student-site">منصة المتدربين</button><button class="admin-btn danger" id="logout-admin">تسجيل الخروج</button></div></div><div class="mark">IP</div></section></div>';
}
function bindCommon(){
  $("#go-dashboard")?.addEventListener("click",()=>showView("dashboard"));
  $("#refresh-page")?.addEventListener("click",()=>showView(currentView));
  $("#student-site")?.addEventListener("click",()=>location.href="./index.html");
  $("#logout-admin")?.addEventListener("click",async()=>{await signOut();location.href="./admin.html";});
}
function loading(title){
  shell(header(title,"جاري تحميل بيانات الإدارة من النظام المركزي…")+'<div class="admin-wrap"><section class="panel"><div class="empty">جاري التحميل…</div></section></div>');
  bindCommon();
}
let currentView="dashboard";

async function dashboard(){
  const [roster,results,live]=await Promise.all([
    fetchTrainerStudentRoster("",""),fetchTrainerResultsSummary(""),fetchTrainerLiveExamMonitor()
  ]);
  const rs=roster?.payload||{}, rp=results?.payload||{}, lp=live?.payload||{};
  const students=Array.isArray(rs.students)?rs.students:[], groups=Array.isArray(rs.groups)?rs.groups:[], recent=Array.isArray(rp.recent)?rp.recent:[];
  const summary=rp.summary||{}, name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  shell(
    header("مرحبًا "+name+" 👋","لوحة مدير منصة IPv4 Academy المستقلة عن مساحة المتدربين.")+
    '<div class="admin-wrap">'+
    '<div class="kpis">'+card("المتدربون",students.length,"السجلات الظاهرة")+card("المجموعات",groups.length,"المجموعات المسجلة")+card("الاختبارات",Number(summary.exams||0),"لها نتائج")+card("اختبارات نشطة",Number(lp.activeCount||0),"المراقبة الحية")+'</div>'+
    '<section class="panel"><div class="topline"><h2>إدارة المنصة</h2><span class="badge green">مدير النظام</span></div><div class="quick">'+
    '<button id="go-students">👥 المتدربون</button><button id="go-results">📊 النتائج</button><button id="go-exams">📝 الاختبارات</button><button id="go-analytics">📈 التحليلات</button></div></section>'+
    '<section class="panel"><h2>آخر النتائج</h2><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>'+
    (recent.length?recent.slice(0,10).map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td></tr>').join(""):'<tr><td colspan="5"><div class="empty">لا توجد نتائج مركزية بعد.</div></td></tr>')+
    '</tbody></table></div></section></div>'
  );
  bindCommon();
  $("#go-students")?.addEventListener("click",()=>showView("students"));
  $("#go-results")?.addEventListener("click",()=>showView("results"));
  $("#go-exams")?.addEventListener("click",()=>showView("exams"));
  $("#go-analytics")?.addEventListener("click",()=>showView("analytics"));
}
async function students(){
  const r=await fetchTrainerStudentRoster("",""); const p=r?.payload||{}; const rows=Array.isArray(p.students)?p.students:[];
  shell(header("إدارة المتدربين","عرض موحد للمتدربين والمجموعات من قاعدة البيانات المركزية.")+
    '<div class="admin-wrap"><section class="panel"><div class="filterbar"><input id="student-filter" placeholder="بحث بالاسم أو الرقم"><select id="group-filter"><option value="">كل المجموعات</option>'+((Array.isArray(p.groups)?p.groups:[]).map(g=>'<option value="'+esc(g.groupNo||g.group_no||g.id||"")+'">'+esc(g.groupNo||g.group_no||g.name||"مجموعة")+'</option>').join("")))+'</select></div>'+
    '<div class="table-wrap"><table class="table" id="students-table"><thead><tr><th>الاسم</th><th>الرقم</th><th>المجموعة</th><th>الدور</th><th>الحالة</th></tr></thead><tbody>'+
    (rows.length?rows.map(x=>'<tr data-name="'+esc((x.studentName||x.full_name||"")+" "+(x.studentId||x.student_id||""))+'" data-group="'+esc(x.groupNo||x.group_no||"")+'"><td><strong>'+esc(x.studentName||x.full_name||"متدرب")+'</strong></td><td>'+esc(x.studentId||x.student_id||"—")+'</td><td>'+esc(x.groupNo||x.group_no||"—")+'</td><td><span class="badge blue">'+esc(x.role||"student")+'</span></td><td><span class="badge green">نشط</span></td></tr>').join(""):'<tr><td colspan="5"><div class="empty">لا توجد سجلات.</div></td></tr>')+
    '</tbody></table></div></section></div>');
  bindCommon();
  const apply=()=>{const q=String($("#student-filter")?.value||"").toLowerCase(),g=String($("#group-filter")?.value||"");document.querySelectorAll("#students-table tbody tr").forEach(row=>{const n=(row.dataset.name||"").toLowerCase(),rg=row.dataset.group||"";row.style.display=(!q||n.includes(q))&&(!g||rg===g)?"":"none";});};
  $("#student-filter")?.addEventListener("input",apply);$("#group-filter")?.addEventListener("change",apply);
}
async function results(){
  const [r,live]=await Promise.all([fetchTrainerResultsSummary(""),fetchTrainerLiveExamMonitor()]);
  const p=r?.payload||{}, rows=Array.isArray(p.recent)?p.recent:[], lp=live?.payload||{};
  shell(header("مركز النتائج","النتائج الرسمية + المراقبة الحية للاختبارات.")+
    '<div class="admin-wrap"><div class="kpis">'+card("النتائج",Number(p.summary?.submitted_attempts||0),"محاولات مسلّمة")+card("الاختبارات",Number(p.summary?.exams||0),"اختبارات لها نتائج")+card("المتدربون",Array.isArray(p.students)?p.students.length:0,"لهم نتائج")+card("قيد التنفيذ",Number(lp.activeCount||0),"جلسات نشطة")+'</div>'+
    '<section class="panel"><h2>النتائج الرسمية</h2><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>الدرجة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>'+
    (rows.length?rows.slice(0,50).map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td><td>'+esc(x.submittedAt||"—")+'</td></tr>').join(""):'<tr><td colspan="6"><div class="empty">لا توجد نتائج حتى الآن.</div></td></tr>')+
    '</tbody></table></div></section>'+
    '<section class="panel"><h2>المراقبة الحية</h2><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>الاختبار</th><th>الأسئلة المجابة</th><th>المتبقي</th></tr></thead><tbody>'+
    ((Array.isArray(lp.attempts)?lp.attempts:[]).length?(lp.attempts||[]).map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.title||x.examTitle||"اختبار")+'</td><td>'+Number(x.answeredCount||0)+'/'+Number(x.totalQuestions||0)+'</td><td>'+Number(x.remainingSeconds||0)+' ثانية</td></tr>').join(""):'<tr><td colspan="4"><div class="empty">لا توجد اختبارات قيد التنفيذ.</div></td></tr>')+
    '</tbody></table></div></section></div>');
  bindCommon();
}
async function exams(){
  const [e,a]=await Promise.all([fetchExamE2EReadiness(),fetchQuestionBankAudit()]);
  const ep=e?.payload||{}, ap=a?.payload||{}, s=ep.summary||{}, bs=ap.summary||{};
  const rows=Array.isArray(ep.exams)?ep.exams:[];
  shell(header("مركز الاختبارات","فحص جاهزية الاختبارات وبنك الأسئلة قبل التشغيل.")+
    '<div class="admin-wrap"><div class="kpis">'+card("الاختبارات المنشورة",Number(s.published||s.publishedExams||0),"الاختبارات المركزية")+card("الجاهزة",Number(s.ready||s.readyExams||0),"جاهزة للتشغيل")+card("المحجوبة",Number(s.blocked||s.blockedExams||0),"تحتاج معالجة")+card("بنك الأسئلة",Number(bs.active||bs.activeQuestions||bs.total||0),"أسئلة نشطة")+'</div>'+
    '<section class="panel"><h2>جاهزية الاختبارات</h2><div class="table-wrap"><table class="table"><thead><tr><th>الاختبار</th><th>الحالة</th><th>الأسئلة</th><th>النوع</th></tr></thead><tbody>'+
    (rows.length?rows.map(x=>'<tr><td><strong>'+esc(x.title||x.examTitle||"اختبار")+'</strong></td><td><span class="badge '+(x.ready?"green":"orange")+'">'+(x.ready?"جاهز":"يحتاج مراجعة")+'</span></td><td>'+Number(x.questionCount||x.questions||0)+'</td><td>'+esc(x.status||"published")+'</td></tr>').join(""):'<tr><td colspan="4"><div class="empty">لا توجد بيانات جاهزية.</div></td></tr>')+
    '</tbody></table></div></section></div>');
  bindCommon();
}
async function analytics(){
  const s=await fetchTrainerLearningSignals(); const p=s||{}; const sum=p.summary||{}, topics=Array.isArray(p.topics)?p.topics:[], students=Array.isArray(p.students)?p.students:[];
  shell(header("التحليلات","مؤشرات التعلم والإشارات المبنية على بيانات المنصة المركزية.")+
    '<div class="admin-wrap"><div class="kpis">'+card("المتدربون",Number(sum.students||students.length||0),"ضمن التحليل")+card("المتوسط",Number(sum.average||sum.avg||0)+"%","متوسط الأداء")+card("عالية الخطورة",Number(sum.highRisk||sum.high_risk||0),"تحتاج تدخلًا")+card("الموضوعات",topics.length,"موضوعات مرصودة")+'</div>'+
    '<div class="grid2">'+
    '<section class="panel"><h2>الموضوعات</h2>'+(topics.length?topics.slice(0,12).map(t=>{const acc=Number(t.accuracy||t.percent||t.avg||0);return '<div class="signal"><div class="topline"><strong>'+esc(t.topic||t.name||"موضوع")+'</strong><span>'+acc+'%</span></div><div class="meter" style="margin-top:9px"><span style="width:'+Math.max(0,Math.min(100,acc))+'%"></span></div></div>';}).join(""):'<div class="empty">لا توجد إشارات تحليلية بعد.</div>')+
    '</section><section class="panel"><h2>المتدربون ذوو الأولوية</h2>'+(students.length?students.slice(0,12).map(x=>'<div class="signal"><div class="topline"><strong>'+esc(x.studentName||x.name||"متدرب")+'</strong><span class="badge '+((String(x.risk||"").toLowerCase().includes("high")||String(x.risk||"").includes("مرتفع"))?"orange":"blue")+'">'+esc(x.risk||"متابعة")+'</span></div><div style="margin-top:7px;color:#73879a">'+esc(x.recommendation||x.action||"متابعة الأداء")+'</div></div>').join(""):'<div class="empty">لا توجد إشارات حالية.</div>')+
    '</section></div></div>');
  bindCommon();
}
async function showView(view){
  currentView=view;
  try{
    if(view==="dashboard"){loading("لوحة المدير");await dashboard();}
    else if(view==="students"){loading("إدارة المتدربين");await students();}
    else if(view==="results"){loading("مركز النتائج");await results();}
    else if(view==="exams"){loading("مركز الاختبارات");await exams();}
    else if(view==="analytics"){loading("التحليلات");await analytics();}
  }catch(error){
    shell(header("تعذر تحميل القسم","حدث خطأ أثناء قراءة بيانات الإدارة.")+'<div class="admin-wrap"><section class="panel"><div class="empty">'+esc(error?.message||error)+'</div></section></div>');
    bindCommon();
  }
}
async function boot(){
  const params=new URLSearchParams(location.search);
  if(params.get("denied")==="1") showOld("تم رفض الدخول: هذا الحساب ليس حساب مدير.");
  try{
    const status=await getSupabaseStatus();
    window.__IPV4_SUPABASE_STATUS__=status;
    if(status?.authenticated && String(status.role)==="admin"){await showView("dashboard");return;}
    if(status?.authenticated) await signOut();
  }catch(error){showOld("تعذر التحقق من حالة الحساب. حاول مرة أخرى.");}
}
function showOld(text){
  const m=$("msg");
  if(!m)return;
  m.textContent=text;m.className="msg show";
}
async function login(event){
  event.preventDefault();
  const email=String($("email")?.value||"").trim(),password=String($("password")?.value||"");
  const submit=$("submit");
  if(!email||!password){showOld("أدخل البريد الإلكتروني وكلمة المرور.");return;}
  submit.disabled=true;submit.textContent="جاري التحقق…";
  try{
    const r=await signInWithPassword(email,password);
    if(!r.ok){showOld(String(r.error||r.reason||"تعذر تسجيل الدخول."));return;}
    const status=await getSupabaseStatus();
    window.__IPV4_SUPABASE_STATUS__=status;
    if(!status?.authenticated){await signOut();showOld("تم الدخول لكن تعذر قراءة ملف الإدارة.");return;}
    if(String(status.role)!=="admin"){await signOut();showOld("تم رفض الدخول: الحساب ليس مديرًا.");return;}
    await showView("dashboard");
  }catch(error){try{await signOut();}catch{}showOld("تعذر إكمال تسجيل دخول الإدارة.");}
  finally{submit.disabled=false;submit.textContent="دخول الإدارة";}
}
const form=$("admin-form");
if(form) form.addEventListener("submit",login);
boot();
