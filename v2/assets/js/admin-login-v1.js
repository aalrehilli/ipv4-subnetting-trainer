import {
  signInWithPassword,
  signOut,
  getSupabaseStatus,
  fetchTrainerStudentRoster,
  fetchTrainerStudent360,
  fetchTrainerResultsSummary,
  fetchTrainerLiveExamMonitor,
  fetchExamE2EReadiness,
  fetchQuestionBankAudit,
  fetchTrainerLearningSignals
} from "./supabase-v30.js?v=494";

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function showMessage(text,ok=false){
  const el=$("msg");
  if(!el)return;
  el.textContent=text;
  el.className="msg show"+(ok?" ok":"");
}
function setBusy(flag){
  const el=$("submit");
  if(!el)return;
  el.disabled=flag;
  el.textContent=flag?"جاري تسجيل الدخول…":"دخول الإدارة";
}
function kpi(title,value,sub){
  return '<div class="adm-kpi"><div class="t">'+esc(title)+'</div><div class="v">'+esc(value)+'</div><div class="s">'+esc(sub)+'</div></div>';
}
function action(id,title){
  return '<button class="adm-action" id="'+id+'">'+esc(title)+'</button>';
}
function baseStyles(){
  return '<style>'+
  '.admin-page{min-height:100vh;background:#f4f8fc;direction:rtl;font-family:Tahoma,Arial,sans-serif;color:#17324d}.adm-wrap{max-width:1240px;margin:auto;padding:22px}.adm-hero{background:#0b6bcb;color:#fff;border-radius:22px;padding:26px;display:flex;justify-content:space-between;align-items:center;gap:20px}.adm-hero h1{margin:0 0 7px;font-size:30px}.adm-hero p{margin:0;opacity:.92;line-height:1.8}.ver{font-size:13px;font-weight:900;margin-bottom:7px}.mark{width:58px;height:58px;border-radius:15px;background:#fff;color:#0b6bcb;display:grid;place-items:center;font-weight:900;font-size:20px}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.adm-btn{border:1px solid rgba(255,255,255,.7);background:transparent;color:#fff;border-radius:10px;padding:10px 14px;font-weight:900;cursor:pointer;font-family:inherit}.adm-btn.primary{background:#fff;color:#0b6bcb;border-color:#fff}.adm-btn.danger{background:#fff;color:#a52c2c;border-color:#fff}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}.adm-kpi,.panel{background:#fff;border:1px solid #dbe7f2;border-radius:18px;box-shadow:0 8px 24px rgba(31,76,115,.05)}.adm-kpi{padding:18px}.adm-kpi .t{color:#73879a;font-weight:700}.adm-kpi .v{font-size:30px;font-weight:900;color:#0b6bcb;margin:8px 0}.adm-kpi .s{font-size:13px;color:#8b9aaa}.panel{padding:18px;margin-top:16px}.panel h2{margin:0 0 14px;font-size:20px}.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.adm-action{background:#f7fbff;color:#0b6bcb;border:1px solid #dceaf7;border-radius:13px;padding:16px;font-weight:900;cursor:pointer;font-family:inherit}.table-wrap{overflow:auto}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:11px;border-bottom:1px solid #edf2f6;text-align:right;white-space:nowrap}.empty{padding:28px;text-align:center;color:#8596a6}.filterbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.filterbar input,.filterbar select{height:42px;border:1px solid #cbdbea;border-radius:10px;padding:0 12px;font-family:inherit;min-width:180px}.badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800}.green{background:#e9f8ef;color:#198754}.blue{background:#edf6ff;color:#0b6bcb}.orange{background:#fff4e5;color:#a76500}.detail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.detail-card{background:#f8fbff;border:1px solid #deebf6;border-radius:14px;padding:14px}.detail-card .label{font-size:12px;color:#788da0}.detail-card .value{font-size:20px;font-weight:900;color:#0b6bcb;margin-top:5px}.subhead{display:flex;justify-content:space-between;align-items:center;gap:10px}.back-btn{background:#0b6bcb;color:#fff;border:0;border-radius:10px;padding:9px 13px;font-weight:900;cursor:pointer}.risk-box{padding:15px;border-radius:14px;background:#fff8ea;border:1px solid #f0ddb8}.attempt-pill{display:inline-block;padding:5px 8px;border-radius:999px;background:#edf6ff;color:#0b6bcb;font-size:12px;font-weight:800}.status-dot{display:inline-flex;align-items:center;gap:6px}.status-dot:before{content:"";width:8px;height:8px;border-radius:50%;background:#18a558}.message-inline{padding:12px 14px;border-radius:12px;background:#eff7ff;color:#1f5f99;border-right:4px solid #0b6bcb}@media(max-width:900px){.kpis,.quick,.detail-grid{grid-template-columns:1fr 1fr}.adm-hero{flex-direction:column;align-items:flex-start}}@media(max-width:540px){.kpis,.quick,.detail-grid{grid-template-columns:1fr}.adm-wrap{padding:12px}.adm-hero h1{font-size:24px}}'+
  '</style>';
}
function header(title,subtitle){
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  return '<div class="adm-wrap">'+
    '<section class="adm-hero">'+
      '<div><div class="ver">🔐 بوابة الإدارة • V3.91</div><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p>'+
      '<div class="actions"><button class="adm-btn primary" id="go-dashboard">لوحة الإدارة</button><button class="adm-btn" id="go-refresh">تحديث</button><button class="adm-btn" id="go-student-site">منصة المتدربين</button><button class="adm-btn danger" id="go-logout">تسجيل الخروج</button></div></div>'+
      '<div class="mark">IP</div>'+
    '</section></div>';
}
function bindHeader(){
  $("go-dashboard")?.addEventListener("click",()=>renderView("dashboard"));
  $("go-refresh")?.addEventListener("click",()=>renderView(currentView));
  $("go-student-site")?.addEventListener("click",()=>location.href="./index.html");
  $("go-logout")?.addEventListener("click",async()=>{await signOut();location.href="./admin.html";});
}
let currentView="dashboard";
function shell(body){
  document.body.innerHTML=baseStyles()+'<div class="admin-page">'+body+'</div>';
}
async function dashboard(){
  let students=0,groups=0,exams=0,active=0,recent=[];
  try{const r=await fetchTrainerStudentRoster("","");const p=r?.payload||{};students=Array.isArray(p.students)?p.students.length:0;groups=Array.isArray(p.groups)?p.groups.length:0;}catch{}
  try{const r=await fetchTrainerResultsSummary("");const p=r?.payload||{};exams=Number(p.summary?.exams||0);recent=Array.isArray(p.recent)?p.recent.slice(0,10):[];}catch{}
  try{const r=await fetchTrainerLiveExamMonitor();active=Number(r?.payload?.activeCount||0);}catch{}
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  shell(header("مرحبًا "+name+" 👋","لوحة مدير IPv4 Academy المستقلة عن مساحة المتدربين.")+
    '<div class="adm-wrap">'+
      '<div class="kpis">'+kpi("المتدربون",students,"السجلات الظاهرة")+kpi("المجموعات",groups,"المجموعات المسجلة")+kpi("الاختبارات",exams,"لها نتائج")+kpi("اختبارات نشطة",active,"المراقبة الحية")+'</div>'+
      '<section class="panel"><div class="subhead"><h2>إدارة المنصة</h2><span class="badge green">مدير النظام</span></div><div class="quick">'+
      action("go-students","👥 إدارة المتدربين")+action("go-results","📊 مركز النتائج")+action("go-exams","📝 الاختبارات")+action("go-analytics","📈 التحليلات")+
      '</div></section>'+
      '<section class="panel"><h2>آخر النتائج</h2><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th></tr></thead><tbody>'+
      (recent.length?recent.map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td></tr>').join(""):'<tr><td colspan="4" class="empty">لا توجد نتائج مركزية بعد.</td></tr>')+
      '</tbody></table></div></section>'+
    '</div>');
  bindHeader();
  $("go-students")?.addEventListener("click",()=>renderView("students"));
  $("go-results")?.addEventListener("click",()=>showInfo("مركز النتائج"));
  $("go-exams")?.addEventListener("click",()=>showInfo("مركز الاختبارات"));
  $("go-analytics")?.addEventListener("click",()=>showInfo("التحليلات"));
}
async function students(){
  const r=await fetchTrainerStudentRoster("","");
  const p=r?.payload||{}, rows=Array.isArray(p.students)?p.students:[], groups=Array.isArray(p.groups)?p.groups:[];
  shell(header("إدارة المتدربين","مركز موحد لعرض المتدربين والبحث والتصفية وفتح ملف Student 360.")+
    '<div class="adm-wrap">'+
    '<section class="panel"><div class="filterbar"><input id="student-search" placeholder="بحث بالاسم أو الرقم التدريبي"><select id="student-group"><option value="">كل المجموعات</option>'+
      groups.map(g=>'<option value="'+esc(g.groupNo||g.group_no||g.id||"")+'">'+esc(g.groupNo||g.group_no||g.name||"مجموعة")+'</option>').join("")+
    '</select></div>'+
    '<div class="table-wrap"><table class="table" id="students-table"><thead><tr><th>المتدرب</th><th>الرقم</th><th>المجموعة</th><th>الدور</th><th>الحالة</th><th>الملف</th></tr></thead><tbody>'+
    (rows.length?rows.map(x=>{const id=x.studentId||x.student_id||x.id||"",name=x.studentName||x.full_name||"متدرب",grp=x.groupNo||x.group_no||"—";return '<tr data-search="'+esc(name+" "+id).toLowerCase()+'" data-group="'+esc(grp)+'"><td><strong>'+esc(name)+'</strong></td><td>'+esc(id)+'</td><td>'+esc(grp)+'</td><td><span class="badge blue">'+esc(x.role||"student")+'</span></td><td><span class="status-dot">نشط</span></td><td><button class="back-btn view-student" data-id="'+esc(id)+'">Student 360</button></td></tr>';}).join(""):'<tr><td colspan="6" class="empty">لا توجد سجلات متدربين.</td></tr>')+
    '</tbody></table></div></section></div>');
  bindHeader();
  const apply=()=>{const q=String($("student-search")?.value||"").toLowerCase(),g=String($("student-group")?.value||"");document.querySelectorAll("#students-table tbody tr").forEach(tr=>{const s=tr.dataset.search||"",rg=tr.dataset.group||"";tr.style.display=(!q||s.includes(q))&&(!g||rg===g)?"":"none";});};
  $("student-search")?.addEventListener("input",apply);$("student-group")?.addEventListener("change",apply);
  document.querySelectorAll(".view-student").forEach(b=>b.addEventListener("click",()=>renderStudent360(b.dataset.id||"")));
}
async function renderStudent360(key){
  shell(header("ملف المتدرب","جاري تحميل Student 360 من النظام المركزي…")+'<div class="adm-wrap"><section class="panel"><div class="empty">جاري التحميل…</div></section></div>');
  bindHeader();
  try{
    const r=await fetchTrainerStudent360(key);
    const p=r||{}, prof=p.profile||{}, sum=p.summary||{}, risk=p.risk||"منخفض", courses=Array.isArray(p.courses)?p.courses:[], topics=Array.isArray(p.topics)?p.topics:[], attempts=Array.isArray(p.attempts)?p.attempts:[];
    shell(header("Student 360 — "+(prof.fullName||prof.full_name||prof.name||"المتدرب"),"ملخص شامل لتقدم المتدرب وأدائه ونتائج الاختبارات.")+
      '<div class="adm-wrap">'+
      '<section class="panel"><div class="detail-grid">'+
        '<div class="detail-card"><div class="label">اسم المتدرب</div><div class="value">'+esc(prof.fullName||prof.full_name||prof.name||"—")+'</div></div>'+
        '<div class="detail-card"><div class="label">الرقم التدريبي</div><div class="value">'+esc(prof.studentId||prof.student_id||"—")+'</div></div>'+
        '<div class="detail-card"><div class="label">المجموعة</div><div class="value">'+esc(prof.groupNo||prof.group_no||"—")+'</div></div>'+
        '<div class="detail-card"><div class="label">الحالة</div><div class="value">نشط</div></div>'+
      '</div></section>'+
      '<div class="kpis">'+
        kpi("الإتقان العام",Number(sum.overall||sum.mastery||0)+"%","المؤشر العام")+
        kpi("تقدم الدروس",Number(sum.lessonProgress||sum.lesson_progress||0)+"%","التقدم التعليمي")+
        kpi("متوسط الاختبارات",Number(sum.examAvg||sum.exam_avg||0)+"%","نتائج الاختبارات")+
        kpi("المحاولات",attempts.length,"محاولات مسجلة")+
      '</div>'+
      '<section class="panel"><div class="subhead"><h2>مستوى المتابعة</h2><span class="badge '+(String(risk).includes("مرتفع")||String(risk).toLowerCase().includes("high")?"orange":"green")+'">'+esc(risk)+'</span></div></section>'+
      '<div class="grid2">'+
      '<section class="panel"><h2>المقررات</h2>'+(courses.length?courses.map(c=>'<div class="signal-row" style="padding:12px 0;border-bottom:1px solid #edf2f6"><strong>'+esc(c.title||c.name||"مقرر")+'</strong><div style="color:#73879a;margin-top:5px">'+Number(c.progress||c.percent||0)+'%</div></div>').join(""):'<div class="empty">لا توجد مقررات مسجلة.</div>')+'</section>'+
      '<section class="panel"><h2>الموضوعات</h2>'+(topics.length?topics.slice(0,12).map(t=>'<div class="signal-row" style="padding:12px 0;border-bottom:1px solid #edf2f6"><div class="subhead"><strong>'+esc(t.topic||t.name||"موضوع")+'</strong><span>'+Number(t.accuracy||t.percent||0)+'%</span></div></div>').join(""):'<div class="empty">لا توجد بيانات موضوعات.</div>')+'</section>'+
      '</div>'+
      '<section class="panel"><h2>آخر محاولات الاختبارات</h2><div class="table-wrap"><table class="table"><thead><tr><th>الاختبار</th><th>النتيجة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>'+
      (attempts.length?attempts.slice(0,20).map(a=>'<tr><td>'+esc(a.exam||a.title||"اختبار")+'</td><td>'+Number(a.percent||a.score||0)+'%</td><td><span class="attempt-pill">'+(a.passed?"ناجح":"غير مجتاز")+'</span></td><td>'+esc(a.submittedAt||a.submitted_at||"—")+'</td></tr>').join(""):'<tr><td colspan="4" class="empty">لا توجد محاولات.</td></tr>')+
      '</tbody></table></div></section>'+
      '<section class="panel"><button class="back-btn" id="back-students">← العودة إلى المتدربين</button></section>'+
      '</div>');
    bindHeader();
    $("back-students")?.addEventListener("click",()=>renderView("students"));
  }catch(error){
    shell(header("تعذر تحميل ملف المتدرب","حدث خطأ أثناء قراءة Student 360.")+'<div class="adm-wrap"><section class="panel"><div class="empty">'+esc(error?.message||error)+'</div></section></div>');
    bindHeader();
  }
}
async function resultsView(){
  let summary={},recent=[],students=[],live=[];
  try{const r=await fetchTrainerResultsSummary("");const p=r?.payload||{};summary=p.summary||{};recent=Array.isArray(p.recent)?p.recent:[];students=Array.isArray(p.students)?p.students:[];}catch{}
  try{const r=await fetchTrainerLiveExamMonitor();live=Array.isArray(r?.payload?.attempts)?r.payload.attempts:[]}catch{}
  shell(header("مركز النتائج","النتائج الرسمية والمراقبة الحية للاختبارات.")+
    '<div class="adm-wrap"><div class="kpis">'+
    kpi("النتائج",Number(summary.submitted_attempts||0),"محاولات مسلّمة")+
    kpi("الاختبارات",Number(summary.exams||0),"اختبارات لها نتائج")+
    kpi("المتدربون",students.length,"لهم نتائج")+
    kpi("قيد التنفيذ",live.length,"جلسات نشطة")+
    '</div><section class="panel"><h2>النتائج الرسمية</h2><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>'+
    (recent.length?recent.slice(0,50).map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td></tr>').join(""):'<tr><td colspan="5" class="empty">لا توجد نتائج حتى الآن.</td></tr>')+
    '</tbody></table></div></section><section class="panel"><h2>المراقبة الحية</h2><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>الاختبار</th><th>المجاب</th><th>المتبقي</th></tr></thead><tbody>'+
    (live.length?live.map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.title||x.examTitle||"اختبار")+'</td><td>'+Number(x.answeredCount||0)+'/'+Number(x.totalQuestions||0)+'</td><td>'+Number(x.remainingSeconds||0)+' ثانية</td></tr>').join(""):'<tr><td colspan="4" class="empty">لا توجد اختبارات قيد التنفيذ.</td></tr>')+
    '</tbody></table></div></section></div>');
  bindHeader();
}
async function examsView(){
  let ready={},audit={};
  try{const r=await fetchExamE2EReadiness();ready=r?.payload||{};}catch{}
  try{const r=await fetchQuestionBankAudit();audit=r?.payload||{};}catch{}
  const s=ready.summary||{}, b=audit.summary||{}, rows=Array.isArray(ready.exams)?ready.exams:[];
  shell(header("مركز الاختبارات","فحص جاهزية الاختبارات وبنك الأسئلة.")+
    '<div class="adm-wrap"><div class="kpis">'+
    kpi("منشورة",Number(s.published||s.publishedExams||0),"اختبارات مركزية")+
    kpi("جاهزة",Number(s.ready||s.readyExams||0),"جاهزة للتشغيل")+
    kpi("محجوبة",Number(s.blocked||s.blockedExams||0),"تحتاج مراجعة")+
    kpi("بنك الأسئلة",Number(b.active||b.activeQuestions||b.total||0),"أسئلة نشطة")+
    '</div><section class="panel"><h2>جاهزية الاختبارات</h2><div class="table-wrap"><table class="table"><thead><tr><th>الاختبار</th><th>الحالة</th><th>الأسئلة</th></tr></thead><tbody>'+
    (rows.length?rows.map(x=>'<tr><td>'+esc(x.title||x.examTitle||"اختبار")+'</td><td><span class="badge '+(x.ready?"green":"orange")+'">'+(x.ready?"جاهز":"يحتاج مراجعة")+'</span></td><td>'+Number(x.questionCount||x.questions||0)+'</td></tr>').join(""):'<tr><td colspan="3" class="empty">لا توجد بيانات جاهزية.</td></tr>')+
    '</tbody></table></div></section></div>');
  bindHeader();
}
async function analyticsView(){
  let payload={summary:{},topics:[],students:[]};
  try{const r=await fetchTrainerLearningSignals();payload=r||payload;}catch{}
  const sum=payload.summary||{}, topics=Array.isArray(payload.topics)?payload.topics:[], students=Array.isArray(payload.students)?payload.students:[];
  shell(header("التحليلات","مؤشرات الأداء وإشارات التعلم من النظام المركزي.")+
    '<div class="adm-wrap"><div class="kpis">'+
    kpi("المتدربون",Number(sum.students||students.length||0),"ضمن التحليل")+
    kpi("متوسط الأداء",Number(sum.average||sum.avg||0)+"%","المؤشر العام")+
    kpi("عالية الخطورة",Number(sum.highRisk||sum.high_risk||0),"تحتاج تدخلًا")+
    kpi("الموضوعات",topics.length,"موضوعات مرصودة")+
    '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><section class="panel"><h2>الموضوعات</h2>'+
    (topics.length?topics.slice(0,15).map(t=>'<div style="padding:12px 0;border-bottom:1px solid #edf2f6"><div class="subhead"><strong>'+esc(t.topic||t.name||"موضوع")+'</strong><span>'+Number(t.accuracy||t.percent||t.avg||0)+'%</span></div></div>').join(""):'<div class="empty">لا توجد بيانات موضوعات.</div>')+
    '</section><section class="panel"><h2>إشارات المتدربين</h2>'+
    (students.length?students.slice(0,15).map(x=>'<div style="padding:12px 0;border-bottom:1px solid #edf2f6"><div class="subhead"><strong>'+esc(x.studentName||x.name||"متدرب")+'</strong><span class="badge blue">'+esc(x.risk||"متابعة")+'</span></div></div>').join(""):'<div class="empty">لا توجد إشارات حالية.</div>')+
    '</section></div></div>');
  bindHeader();
}

function showInfo(title){
  const el=document.getElementById("admin-temp-message");
  if(el){el.remove();return;}
  const main=document.querySelector(".admin-page");
  if(main){
    const d=document.createElement("div");d.id="admin-temp-message";d.textContent=title+" — سيتم ربط هذا القسم في الإصدار التالي.";d.style.cssText="position:fixed;bottom:20px;right:20px;z-index:20;background:#0b6bcb;color:#fff;padding:14px 18px;border-radius:12px;font-weight:800;box-shadow:0 10px 25px rgba(0,0,0,.15)";document.body.appendChild(d);setTimeout(()=>d.remove(),2600);
  }
}
async function renderView(view){
  currentView=view;
  if(view==="dashboard"){await dashboard();return;}
  if(view==="students"){await students();return;}
  if(view==="results"){await resultsView();return;}
  if(view==="exams"){await examsView();return;}
  if(view==="analytics"){await analyticsView();return;}
  showInfo(view);
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
  const email=String($("email")?.value||"").trim(),password=String($("password")?.value||"");
  if(!email||!password){showMessage("أدخل البريد الإلكتروني وكلمة المرور.");return;}
  setBusy(true);
  try{
    const r=await signInWithPassword(email,password);
    if(!r.ok){showMessage(String(r.error||r.reason||"تعذر تسجيل الدخول."));return;}
    const status=await getSupabaseStatus();
    window.__IPV4_SUPABASE_STATUS__=status;
    if(!status?.authenticated){await signOut();showMessage("تم تسجيل الدخول لكن تعذر قراءة جلسة المدير.");return;}
    if(String(status.role)!=="admin"){await signOut();showMessage("هذا الحساب ليس حساب مدير.");return;}
    await dashboard();
  }catch(error){showMessage("حدث خطأ أثناء الدخول: "+String(error?.message||error));}
  finally{setBusy(false);}
});
init();
