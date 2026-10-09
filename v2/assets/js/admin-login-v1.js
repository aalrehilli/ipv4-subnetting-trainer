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
} from "./supabase-v30.js?v=498";

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

let currentView="dashboard";
let cache={roster:null,results:null,live:null,readiness:null,audit:null,signals:null};

function injectStyles(){
  return '<style>'+
  ':root{--blue:#0b67bd;--blue2:#0a5aa4;--ink:#17324d;--muted:#7890a3;--line:#e2eaf2;--soft:#f6f9fc;--green:#15945a;--orange:#b46b00;--red:#bf3030;--purple:#6f4ab5}'+
  '*{box-sizing:border-box}.admin-page{min-height:100vh;background:#f5f8fc;direction:rtl;color:var(--ink);font-family:Tahoma,Arial,sans-serif}.admin-layout{display:flex;min-height:100vh}.side{width:255px;background:linear-gradient(180deg,#0b67bd 0%,#09569d 100%);color:#fff;padding:18px 14px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column}.brand{display:flex;align-items:center;gap:11px;padding:7px 9px 20px;border-bottom:1px solid rgba(255,255,255,.16)}.logo{width:44px;height:44px;border-radius:13px;background:#fff;color:var(--blue);display:grid;place-items:center;font-weight:900}.brand strong{display:block;font-size:18px}.brand small{display:block;color:#d7ebff;margin-top:2px}.nav{display:grid;gap:6px;padding:16px 0}.nav button{border:0;background:transparent;color:#dbedff;padding:12px 12px;border-radius:11px;text-align:right;font:800 14px Tahoma;cursor:pointer}.nav button:hover,.nav button.active{background:rgba(255,255,255,.13);color:#fff}.side-foot{margin-top:auto;border-top:1px solid rgba(255,255,255,.16);padding:14px 9px;font-size:12px;color:#cfe7fb;line-height:1.8}.main{flex:1;min-width:0}.top{height:74px;background:#fff;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;padding:0 26px}.top-title{font-size:19px;font-weight:900}.top-meta{display:flex;gap:10px;align-items:center;color:var(--muted);font-size:12px}.avatar{width:38px;height:38px;border-radius:50%;background:#eaf4ff;color:var(--blue);display:grid;place-items:center;font-weight:900}.container{max-width:1450px;margin:auto;padding:22px 26px 35px}.hero{background:linear-gradient(135deg,#0a63b7,#0b7bd3 62%,#0a589e);color:#fff;border-radius:22px;padding:26px;display:grid;grid-template-columns:1.55fr .8fr;gap:20px;box-shadow:0 14px 36px rgba(14,89,150,.15)}.hero h1{font-size:30px;margin:0 0 8px}.hero p{margin:0;line-height:1.9;color:#e2f1ff}.eyebrow{font-size:12px;font-weight:900;color:#d7ecff;margin-bottom:7px}.hero-side{background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.15);border-radius:17px;padding:17px}.hero-score{font-size:42px;font-weight:900;margin:4px 0}.bar{height:9px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}.bar span{display:block;height:100%;background:#fff}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.btn{border:1px solid var(--line);border-radius:10px;padding:10px 14px;font:900 13px Tahoma;cursor:pointer}.btn-primary{background:#fff;color:var(--blue);border-color:#fff}.btn-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.65)}.btn-danger{background:#fff;color:var(--red);border-color:#fff}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:17px 0}.kpi,.card{background:#fff;border:1px solid var(--line);border-radius:17px;box-shadow:0 7px 24px rgba(25,74,112,.045)}.kpi{padding:17px}.kpi-head{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:12px;font-weight:800}.kpi-icon{width:33px;height:33px;border-radius:10px;background:#edf6ff;color:var(--blue);display:grid;place-items:center}.kpi-value{font-size:30px;color:var(--blue);font-weight:900;margin:8px 0 2px}.kpi-sub{font-size:12px;color:#98a6b2}.grid2{display:grid;grid-template-columns:1.4fr .9fr;gap:15px;margin-top:15px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:15px}.card{padding:18px}.card h2{font-size:18px;margin:0}.card-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:14px}.link{border:0;background:transparent;color:var(--blue);font:900 12px Tahoma;cursor:pointer}.table-wrap{overflow:auto}.table{width:100%;border-collapse:collapse}.table th,.table td{text-align:right;padding:11px 7px;border-bottom:1px solid #edf2f6;white-space:nowrap}.table th{font-size:11px;color:#7b8e9e}.table td{font-size:13px}.badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:900}.green{background:#e8f7ef;color:var(--green)}.orange{background:#fff3df;color:var(--orange)}.blue{background:#edf6ff;color:var(--blue)}.purple{background:#f1edff;color:var(--purple)}.red{background:#fff0f0;color:var(--red)}.empty{text-align:center;color:#8ca0af;padding:28px}.quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.quick{border:1px solid #dce8f2;background:#f9fcff;border-radius:13px;padding:16px;text-align:right;cursor:pointer;font:900 13px Tahoma;color:var(--blue)}.quick small{display:block;color:#8397a7;font-weight:400;margin-top:5px}.filter{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:14px}.filter input,.filter select{height:42px;border:1px solid #cddce8;border-radius:10px;background:#fff;padding:0 11px;font-family:Tahoma;min-width:190px}.student-row{cursor:pointer}.student-row:hover{background:#f8fbff}.status{display:inline-flex;align-items:center;gap:6px}.status:before{content:"";width:8px;height:8px;border-radius:50%;background:#19a65f}.meter{height:8px;background:#ecf1f5;border-radius:99px;overflow:hidden}.meter span{display:block;height:100%;background:var(--blue)}.topic{padding:11px 0;border-bottom:1px solid #edf2f6}.topic:last-child{border-bottom:0}.topic-head{display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:7px}.alert{padding:12px 14px;border-radius:12px;background:#fff8e9;border:1px solid #f1dfbd;color:#8d650d}.success{padding:12px 14px;border-radius:12px;background:#eefaf4;border:1px solid #d3eedf;color:#207b4f}.detail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.detail{background:#f8fbff;border:1px solid #deebf5;border-radius:13px;padding:14px}.detail .label{font-size:11px;color:#7f93a3}.detail .value{font-size:19px;color:var(--blue);font-weight:900;margin-top:5px}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:15px}.back{background:var(--blue);color:#fff;border:0;border-radius:10px;padding:9px 13px;font:900 12px Tahoma;cursor:pointer}.mobile-nav{display:none}.audit-list{display:grid;gap:9px}.audit-item{border:1px solid #e2eaf2;border-radius:12px;padding:12px;background:#fbfdff}.audit-item strong{display:block;margin-bottom:4px}.side-mobile-btn{display:none}@media(max-width:1050px){.side{width:215px}.hero{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}.kpis{grid-template-columns:1fr 1fr}}@media(max-width:750px){.side{display:none}.side-mobile-btn{display:inline-flex}.top{padding:0 14px}.container{padding:14px}.quick-grid,.grid3,.two-col,.detail-grid{grid-template-columns:1fr 1fr}}@media(max-width:500px){.kpis,.quick-grid,.grid3,.two-col,.detail-grid{grid-template-columns:1fr}.hero h1{font-size:24px}}'+
  '</style>';
}
function layout(title,body){
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  document.body.innerHTML=injectStyles()+
  '<div class="admin-page"><div class="admin-layout">'+
  '<aside class="side"><div class="brand"><div class="logo">IP</div><div><strong>IPv4 Academy</strong><small>لوحة الإدارة • V3.96</small></div></div>'+
  '<nav class="nav">'+
  '<button id="nav-dashboard">⌂ لوحة التحكم</button>'+
  '<button id="nav-students">👥 المتدربون</button>'+
  '<button id="nav-groups">🏷️ المجموعات</button>'+
  '<button id="nav-results">📊 النتائج</button>'+
  '<button id="nav-exams">📝 الاختبارات</button>'+
  '<button id="nav-analytics">📈 التحليلات</button>'+
  '<button id="nav-audit">🛡️ التدقيق والجاهزية</button>'+
  '</nav><div class="side-foot">مدير النظام<br>'+esc(name)+'<button id="nav-logout" style="width:100%;margin-top:10px;border:0;border-radius:10px;padding:10px;background:rgba(255,255,255,.1);color:#fff;font:900 12px Tahoma;cursor:pointer">تسجيل الخروج</button></div></aside>'+
  '<main class="main"><header class="top"><div class="top-title">'+esc(title)+'</div><div class="top-meta"><span>IPv4 Academy</span><div class="avatar">'+esc((name||"م").slice(0,1))+'</div><span>'+esc(name)+'</span></div></header>'+
  '<div class="container">'+body+'</div></main></div></div>';
  bindNav();
}
function bindNav(){
  const map={dashboard:"nav-dashboard",students:"nav-students",groups:"nav-groups",results:"nav-results",exams:"nav-exams",analytics:"nav-analytics",audit:"nav-audit"};
  Object.entries(map).forEach(([view,id])=>$(id)?.addEventListener("click",()=>renderView(view)));
  $("nav-logout")?.addEventListener("click",async()=>{await signOut();location.href="./admin.html";});
}
function setActive(view){
  const ids={dashboard:"nav-dashboard",students:"nav-students",groups:"nav-groups",results:"nav-results",exams:"nav-exams",analytics:"nav-analytics",audit:"nav-audit"};
  document.querySelectorAll(".nav button").forEach(b=>b.classList.remove("active"));
  $(ids[view])?.classList.add("active");
}
function kpi(title,value,sub,icon){
  return '<div class="kpi"><div class="kpi-head"><span>'+esc(title)+'</span><div class="kpi-icon">'+(icon||"•")+'</div></div><div class="kpi-value">'+esc(value)+'</div><div class="kpi-sub">'+esc(sub)+'</div></div>';
}
function quick(id,title,sub){
  return '<button class="quick" id="'+id+'">'+esc(title)+'<small>'+esc(sub)+'</small></button>';
}
async function getAll(){
  if(!cache.roster)try{cache.roster=await fetchTrainerStudentRoster("","");}catch{}
  if(!cache.results)try{cache.results=await fetchTrainerResultsSummary("");}catch{}
  if(!cache.live)try{cache.live=await fetchTrainerLiveExamMonitor();}catch{}
  if(!cache.readiness)try{cache.readiness=await fetchExamE2EReadiness();}catch{}
  if(!cache.audit)try{cache.audit=await fetchQuestionBankAudit();}catch{}
  if(!cache.signals)try{cache.signals=await fetchTrainerLearningSignals();}catch{}
}
async function dashboard(){
  await getAll();
  const rp=cache.roster?.payload||{}, pp=cache.results?.payload||{}, lp=cache.live?.payload||{}, rs=cache.readiness?.payload||{}, sig=cache.signals||{};
  const students=Array.isArray(rp.students)?rp.students:[],groups=Array.isArray(rp.groups)?rp.groups:[],recent=Array.isArray(pp.recent)?pp.recent.slice(0,8):[];
  const summary=pp.summary||{}, live=Number(lp.activeCount||0), s=rs.summary||{}, ss=sig.summary||{};
  const avg=Number(ss.average||ss.avg||0), high=Number(ss.highRisk||ss.high_risk||0);
  const topics=Array.isArray(sig.topics)?sig.topics.slice(0,5):[];
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  const published=Number(s.published||s.publishedExams||0),ready=Number(s.ready||s.readyExams||0),blocked=Number(s.blocked||s.blockedExams||0);
  const body='<section class="hero"><div><div class="eyebrow">SMART ADMIN • مركز الإدارة</div><h1>مرحبًا '+esc(name)+' 👋</h1><p>إدارة المتدربين والاختبارات والنتائج والتحليلات من مركز واحد.</p><div class="actions"><button class="btn btn-primary" id="hero-students">إدارة المتدربين</button><button class="btn btn-ghost" id="hero-results">عرض النتائج</button><button class="btn btn-ghost" id="hero-exams">فحص الاختبارات</button></div></div><div class="hero-side"><div style="font-size:12px;color:#d8ebfb">متوسط الأداء العام</div><div class="hero-score">'+avg+'%</div><div class="bar"><span style="width:'+Math.max(0,Math.min(100,avg))+'%"></span></div><div style="font-size:11px;color:#d8ebfb;margin-top:8px">متابعة مرتفعة: '+high+'</div></div></section>'+
  '<section class="kpis">'+kpi("المتدربون",students.length,"السجلات الظاهرة","👥")+kpi("المجموعات",groups.length,"المجموعات المسجلة","🏷️")+kpi("الاختبارات",Number(summary.exams||0),"لها نتائج","📝")+kpi("اختبارات مباشرة",live,live?"جلسات قيد التنفيذ":"لا توجد جلسات","🔴")+'</section>'+
  '<div class="grid2"><section class="card"><div class="card-head"><h2>آخر النتائج</h2><button class="link" id="more-results">عرض الكل ←</button></div><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>'+
  (recent.length?recent.map(x=>'<tr><td><strong>'+esc(x.studentName||"متدرب")+'</strong><div style="font-size:10px;color:#8d9eab">مجموعة '+esc(x.groupNo||"—")+'</div></td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td></tr>').join(""):'<tr><td colspan="4" class="empty">لا توجد نتائج بعد.</td></tr>')+
  '</tbody></table></div></section>'+
  '<section class="card"><div class="card-head"><h2>حالة المنصة</h2><span class="badge green">متصل</span></div>'+
  '<div class="card" style="padding:13px;background:#fbfdff"><strong>المراقبة الحية</strong><div style="color:#7d90a0;font-size:12px;margin-top:4px">'+live+' اختبار قيد التنفيذ</div></div>'+
  '<div style="height:9px"></div><div class="card" style="padding:13px;background:#fbfdff"><strong>جاهزية الاختبارات</strong><div style="color:#7d90a0;font-size:12px;margin-top:4px">'+ready+' جاهز / '+published+' منشور / '+blocked+' محجوب</div></div>'+
  '<div style="height:9px"></div><div class="card" style="padding:13px;background:#fbfdff"><strong>إشارات التدخل</strong><div style="color:#7d90a0;font-size:12px;margin-top:4px">'+high+' متابعة مرتفعة</div></div>'+
  '</section></div>'+
  '<div class="grid2"><section class="card"><div class="card-head"><h2>إجراءات سريعة</h2></div><div class="quick-grid">'+
  quick("quick-students","👥 المتدربون","إدارة المتدربين وStudent 360")+quick("quick-groups","🏷️ المجموعات","عرض المجموعات وأعدادها")+quick("quick-results","📊 النتائج","النتائج الرسمية والمراقبة")+quick("quick-exams","📝 الاختبارات","الجاهزية وبنك الأسئلة")+quick("quick-analytics","📈 التحليلات","الأداء وإشارات التعلم")+quick("quick-audit","🛡️ التدقيق","سلامة البنك والاختبارات")+
  '</div></section>'+
  '<section class="card"><div class="card-head"><h2>أهم الموضوعات</h2><button class="link" id="more-topics">التحليلات ←</button></div>'+
  (topics.length?topics.map(t=>{const v=Math.max(0,Math.min(100,Number(t.accuracy||t.percent||t.avg||0)));return '<div class="topic"><div class="topic-head"><strong>'+esc(t.topic||t.name||"موضوع")+'</strong><span>'+v+'%</span></div><div class="meter"><span style="width:'+v+'%"></span></div></div>';}).join(""):'<div class="empty">لا توجد بيانات تحليلية كافية.</div>')+
  '</section></div>';
  layout("لوحة التحكم",body);setActive("dashboard");
  $("hero-students")?.addEventListener("click",()=>renderView("students"));$("hero-results")?.addEventListener("click",()=>renderView("results"));$("hero-exams")?.addEventListener("click",()=>renderView("exams"));
  $("more-results")?.addEventListener("click",()=>renderView("results"));$("quick-students")?.addEventListener("click",()=>renderView("students"));$("quick-groups")?.addEventListener("click",()=>renderView("groups"));$("quick-results")?.addEventListener("click",()=>renderView("results"));$("quick-exams")?.addEventListener("click",()=>renderView("exams"));$("quick-analytics")?.addEventListener("click",()=>renderView("analytics"));$("quick-audit")?.addEventListener("click",()=>renderView("audit"));$("more-topics")?.addEventListener("click",()=>renderView("analytics"));
}
async function students(){
  await getAll();const p=cache.roster?.payload||{},rows=Array.isArray(p.students)?p.students:[],groups=Array.isArray(p.groups)?p.groups:[];
  const body='<section class="card"><div class="filter"><input id="student-search" placeholder="بحث بالاسم أو الرقم التدريبي"><select id="student-group"><option value="">كل المجموعات</option>'+groups.map(g=>'<option value="'+esc(g.groupNo||g.group_no||g.id||"")+'">'+esc(g.groupNo||g.group_no||g.name||"مجموعة")+'</option>').join("")+'</select></div><div class="table-wrap"><table class="table" id="students-table"><thead><tr><th>المتدرب</th><th>الرقم</th><th>المجموعة</th><th>الحالة</th><th>Student 360</th></tr></thead><tbody>'+
  (rows.length?rows.map(x=>{const id=x.studentId||x.student_id||x.id||"",name=x.studentName||x.full_name||"متدرب",grp=x.groupNo||x.group_no||"—";return '<tr class="student-row" data-search="'+esc((name+" "+id).toLowerCase())+'" data-group="'+esc(grp)+'"><td><strong>'+esc(name)+'</strong></td><td>'+esc(id)+'</td><td>'+esc(grp)+'</td><td><span class="status">نشط</span></td><td><button class="back" data-student="'+esc(id)+'">فتح الملف</button></td></tr>';}).join(""):'<tr><td colspan="5" class="empty">لا توجد سجلات.</td></tr>')+
  '</tbody></table></div></section>';
  layout("إدارة المتدربين",'<div class="card" style="margin-bottom:15px"><div class="card-head"><div><h2>المتدربون</h2><div style="color:var(--muted);font-size:12px;margin-top:5px">بحث، تصفية، وفتح ملف Student 360.</div></div><span class="badge blue">'+rows.length+' متدرب</span></div></div>'+body);setActive("students");
  const apply=()=>{const q=String($("student-search")?.value||"").toLowerCase(),g=String($("student-group")?.value||"");document.querySelectorAll("#students-table tbody tr").forEach(tr=>tr.style.display=(!q||(tr.dataset.search||"").includes(q))&&(!g||(tr.dataset.group||"")===g)?"":"none");};
  $("student-search")?.addEventListener("input",apply);$("student-group")?.addEventListener("change",apply);document.querySelectorAll("[data-student]").forEach(b=>b.addEventListener("click",()=>renderStudent360(b.dataset.student||"")));
}
async function groups(){
  await getAll();const p=cache.roster?.payload||{},rows=Array.isArray(p.students)?p.students:[],groups=Array.isArray(p.groups)?p.groups:[];
  const counts={};rows.forEach(s=>{const g=String(s.groupNo||s.group_no||"غير محدد");counts[g]=(counts[g]||0)+1;});
  const body='<section class="grid3">'+(groups.length?groups.map(g=>{const id=String(g.groupNo||g.group_no||g.id||g.name||"");const count=counts[id]||0;return '<div class="card"><div class="card-head"><h2>المجموعة '+esc(id)+'</h2><span class="badge blue">'+count+' متدرب</span></div><div style="font-size:13px;color:var(--muted)">حالة المجموعة</div><div class="meter" style="margin-top:9px"><span style="width:'+Math.min(100,count*20)+'%"></span></div><div style="font-size:12px;color:var(--muted);margin-top:8px">المسجلون: '+count+'</div></div>';}).join(""):'<div class="card"><div class="empty">لا توجد مجموعات.</div></div>')+'</section>';
  layout("المجموعات",'<div class="card"><div class="card-head"><div><h2>إدارة المجموعات</h2><div style="color:var(--muted);font-size:12px;margin-top:5px">نظرة سريعة على توزيع المتدربين.</div></div></div></div>'+body);setActive("groups");
}
async function renderStudent360(id){
  layout("Student 360",'<div class="card"><div class="empty">جاري تحميل الملف…</div></div>');setActive("students");
  try{
    const r=await fetchTrainerStudent360(id),p=r||{},prof=p.profile||{},sum=p.summary||{},courses=Array.isArray(p.courses)?p.courses:[],topics=Array.isArray(p.topics)?p.topics:[],attempts=Array.isArray(p.attempts)?p.attempts:[],risk=p.risk||"منخفض";
    const body='<section class="card"><div class="card-head"><div><h2>Student 360</h2><div style="color:var(--muted);font-size:12px;margin-top:5px">ملف تفصيلي للمتدرب</div></div><span class="badge '+(String(risk).includes("مرتفع")||String(risk).toLowerCase().includes("high")?"orange":"green")+'">'+esc(risk)+'</span></div><div class="detail-grid">'+
    '<div class="detail"><div class="label">الاسم</div><div class="value">'+esc(prof.fullName||prof.full_name||prof.name||"—")+'</div></div><div class="detail"><div class="label">الرقم</div><div class="value">'+esc(prof.studentId||prof.student_id||"—")+'</div></div><div class="detail"><div class="label">المجموعة</div><div class="value">'+esc(prof.groupNo||prof.group_no||"—")+'</div></div><div class="detail"><div class="label">الحالة</div><div class="value">نشط</div></div></div></section>'+
    '<section class="kpis">'+kpi("الإتقان",Number(sum.overall||sum.mastery||0)+"%","المؤشر العام","🎯")+kpi("تقدم الدروس",Number(sum.lessonProgress||sum.lesson_progress||0)+"%","التقدم التعليمي","📚")+kpi("متوسط الاختبارات",Number(sum.examAvg||sum.exam_avg||0)+"%","النتائج الرسمية","📝")+kpi("المحاولات",attempts.length,"المحاولات المسجلة","↺")+'</section>'+
    '<div class="two-col"><section class="card"><div class="card-head"><h2>المقررات</h2></div>'+(courses.length?courses.map(c=>'<div class="topic"><div class="topic-head"><strong>'+esc(c.title||c.name||"مقرر")+'</strong><span>'+Number(c.progress||c.percent||0)+'%</span></div><div class="meter"><span style="width:'+Math.max(0,Math.min(100,Number(c.progress||c.percent||0)))+'%"></span></div></div>').join(""):'<div class="empty">لا توجد مقررات.</div>')+'</section>'+
    '<section class="card"><div class="card-head"><h2>الموضوعات</h2></div>'+(topics.length?topics.slice(0,12).map(t=>'<div class="topic"><div class="topic-head"><strong>'+esc(t.topic||t.name||"موضوع")+'</strong><span>'+Number(t.accuracy||t.percent||0)+'%</span></div></div>').join(""):'<div class="empty">لا توجد بيانات.</div>')+'</section></div>'+
    '<section class="card" style="margin-top:15px"><div class="card-head"><h2>آخر المحاولات</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>الاختبار</th><th>النتيجة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>'+
    (attempts.length?attempts.slice(0,20).map(a=>'<tr><td>'+esc(a.exam||a.title||"اختبار")+'</td><td>'+Number(a.percent||a.score||0)+'%</td><td><span class="badge '+(a.passed?"green":"orange")+'">'+(a.passed?"ناجح":"غير مجتاز")+'</span></td><td>'+esc(a.submittedAt||a.submitted_at||"—")+'</td></tr>').join(""):'<tr><td colspan="4" class="empty">لا توجد محاولات.</td></tr>')+'</tbody></table></div></section>'+
    '<section class="card" style="margin-top:15px"><button class="back" id="back-students">← العودة إلى المتدربين</button></section>';
    layout("Student 360",body);setActive("students");$("back-students")?.addEventListener("click",()=>renderView("students"));
  }catch(e){
    layout("Student 360",'<div class="card"><div class="alert">تعذر تحميل ملف المتدرب: '+esc(e?.message||e)+'</div></div>');setActive("students");
  }
}
async function results(){
  await getAll();const p=cache.results?.payload||{},summary=p.summary||{},rows=Array.isArray(p.recent)?p.recent:[],live=Array.isArray(cache.live?.payload?.attempts)?cache.live.payload.attempts:[];
  const body='<section class="kpis">'+kpi("النتائج",Number(summary.submitted_attempts||0),"محاولات مسلّمة","📊")+kpi("الاختبارات",Number(summary.exams||0),"اختبارات لها نتائج","📝")+kpi("المتدربون",Array.isArray(p.students)?p.students.length:0,"ضمن المركز","👥")+kpi("مباشر",live.length,"جلسات نشطة","🔴")+'</section>'+
  '<section class="card"><div class="card-head"><h2>النتائج الرسمية</h2><span class="badge blue">'+rows.length+' نتيجة</span></div><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>'+
  (rows.length?rows.slice(0,50).map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td></tr>').join(""):'<tr><td colspan="5" class="empty">لا توجد نتائج.</td></tr>')+'</tbody></table></div></section>'+
  '<section class="card" style="margin-top:15px"><div class="card-head"><h2>المراقبة الحية</h2><span class="badge '+(live.length?"orange":"green")+'">'+(live.length?"هناك جلسات":"لا توجد جلسات")+'</span></div><div class="table-wrap"><table class="table"><thead><tr><th>المتدرب</th><th>الاختبار</th><th>المجاب</th><th>المتبقي</th></tr></thead><tbody>'+
  (live.length?live.map(x=>'<tr><td>'+esc(x.studentName||"متدرب")+'</td><td>'+esc(x.title||x.examTitle||"اختبار")+'</td><td>'+Number(x.answeredCount||0)+'/'+Number(x.totalQuestions||0)+'</td><td>'+Number(x.remainingSeconds||0)+' ث</td></tr>').join(""):'<tr><td colspan="4" class="empty">لا توجد اختبارات قيد التنفيذ.</td></tr>')+'</tbody></table></div></section>';
  layout("مركز النتائج",body);setActive("results");
}
async function exams(){
  await getAll();const rs=cache.readiness?.payload||{},s=rs.summary||{},rows=Array.isArray(rs.exams)?rs.exams:[],a=cache.audit?.payload?.summary||{};
  const body='<section class="kpis">'+kpi("منشورة",Number(s.published||s.publishedExams||0),"اختبارات مركزية","📢")+kpi("جاهزة",Number(s.ready||s.readyExams||0),"جاهزة للتشغيل","✅")+kpi("محجوبة",Number(s.blocked||s.blockedExams||0),"تحتاج معالجة","⚠️")+kpi("بنك الأسئلة",Number(a.active||a.activeQuestions||a.total||0),"أسئلة نشطة","❓")+'</section>'+
  '<section class="card"><div class="card-head"><div><h2>جاهزية الاختبارات</h2><div style="font-size:12px;color:var(--muted);margin-top:5px">فحص مركزي قبل تشغيل الاختبار للمتدربين.</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>الاختبار</th><th>الحالة</th><th>الأسئلة</th><th>التفاصيل</th></tr></thead><tbody>'+
  (rows.length?rows.map(x=>'<tr><td><strong>'+esc(x.title||x.examTitle||"اختبار")+'</strong></td><td><span class="badge '+(x.ready?"green":"orange")+'">'+(x.ready?"جاهز":"يحتاج مراجعة")+'</span></td><td>'+Number(x.questionCount||x.questions||0)+'</td><td>'+esc(x.status||"published")+'</td></tr>').join(""):'<tr><td colspan="4" class="empty">لا توجد بيانات جاهزية.</td></tr>')+'</tbody></table></div></section>';
  layout("مركز الاختبارات",body);setActive("exams");
}
async function analytics(){
  await getAll();const p=cache.signals||{},sum=p.summary||{},topics=Array.isArray(p.topics)?p.topics:[],students=Array.isArray(p.students)?p.students:[];
  const body='<section class="kpis">'+kpi("المتدربون",Number(sum.students||students.length||0),"ضمن التحليل","👥")+kpi("المتوسط",Number(sum.average||sum.avg||0)+"%","متوسط الأداء","📈")+kpi("متابعة مرتفعة",Number(sum.highRisk||sum.high_risk||0),"تحتاج تدخلًا","⚠️")+kpi("الموضوعات",topics.length,"موضوعات مرصودة","🎯")+'</section>'+
  '<div class="two-col"><section class="card"><div class="card-head"><h2>أداء الموضوعات</h2></div>'+(topics.length?topics.slice(0,15).map(t=>{const v=Math.max(0,Math.min(100,Number(t.accuracy||t.percent||t.avg||0)));return '<div class="topic"><div class="topic-head"><strong>'+esc(t.topic||t.name||"موضوع")+'</strong><span>'+v+'%</span></div><div class="meter"><span style="width:'+v+'%"></span></div></div>';}).join(""):'<div class="empty">لا توجد بيانات موضوعات.</div>')+'</section>'+
  '<section class="card"><div class="card-head"><h2>إشارات المتدربين</h2></div>'+(students.length?students.slice(0,15).map(x=>'<div class="topic"><div class="topic-head"><strong>'+esc(x.studentName||x.name||"متدرب")+'</strong><span class="badge '+(String(x.risk||"").includes("مرتفع")||String(x.risk||"").toLowerCase().includes("high")?"orange":"blue")+'">'+esc(x.risk||"متابعة")+'</span></div><div style="font-size:11px;color:var(--muted)">'+esc(x.recommendation||x.action||"متابعة الأداء")+'</div></div>').join(""):'<div class="empty">لا توجد إشارات حالية.</div>')+'</section></div>';
  layout("التحليلات",body);setActive("analytics");
}
async function audit(){
  await getAll();const a=cache.audit?.payload||{},s=a.summary||{},issues=Array.isArray(a.issues)?a.issues:[],rs=cache.readiness?.payload?.summary||{};
  const topics=Array.isArray(a.topics)?a.topics:[],diff=Array.isArray(a.difficulties)?a.difficulties:[];
  const body='<section class="kpis">'+kpi("أسئلة نشطة",Number(s.active||s.activeQuestions||s.total||0),"في البنك","❓")+kpi("مشكلات",issues.length,"مشكلات مرصودة","⚠️")+kpi("اختبارات جاهزة",Number(rs.ready||rs.readyExams||0),"جاهزة للتشغيل","✅")+kpi("محجوبة",Number(rs.blocked||rs.blockedExams||0),"تحتاج معالجة","🔒")+'</section>'+
  '<div class="grid2"><section class="card"><div class="card-head"><h2>المشكلات المرصودة</h2></div><div class="audit-list">'+
  (issues.length?issues.slice(0,25).map(i=>'<div class="audit-item"><strong>'+esc(i.message||i.issue||i.type||"مشكلة")+'</strong><span style="font-size:11px;color:var(--muted)">'+esc(i.questionId||i.id||"")+'</span></div>').join(""):'<div class="success">لا توجد مشكلات ظاهرة في التدقيق الحالي.</div>')+
  '</div></section><section class="card"><div class="card-head"><h2>توزيع البنك</h2></div>'+
  (topics.length?topics.slice(0,10).map(t=>'<div class="topic"><div class="topic-head"><strong>'+esc(t.topic||t.name||"موضوع")+'</strong><span>'+Number(t.count||t.questions||0)+'</span></div></div>').join(""):'<div class="empty">لا توجد بيانات موضوعات.</div>')+
  (diff.length?'<div style="margin-top:10px;padding-top:10px;border-top:1px solid #edf2f6"><strong style="font-size:12px">الصعوبة</strong>'+diff.slice(0,8).map(d=>'<div class="topic"><div class="topic-head"><span>'+esc(d.difficulty||d.name||"—")+'</span><span>'+Number(d.count||d.questions||0)+'</span></div></div>').join("")+'</div>':'')+
  '</section></div>';
  layout("التدقيق والجاهزية",body);setActive("audit");
}
function showMessageBox(text){
  const old=$("admin-toast");if(old)old.remove();
  const d=document.createElement("div");d.id="admin-toast";d.textContent=text;d.style.cssText="position:fixed;left:20px;bottom:20px;z-index:50;background:#17324d;color:#fff;border-radius:12px;padding:13px 16px;font:800 12px Tahoma;box-shadow:0 10px 25px rgba(0,0,0,.18)";document.body.appendChild(d);setTimeout(()=>d.remove(),2400);
}
async function renderView(view){
  currentView=view;
  if(view==="dashboard")return dashboard();
  if(view==="students")return students();
  if(view==="groups")return groups();
  if(view==="results")return results();
  if(view==="exams")return exams();
  if(view==="analytics")return analytics();
  if(view==="audit")return audit();
}
async function init(){
  try{
    const s=await getSupabaseStatus();window.__IPV4_SUPABASE_STATUS__=s;
    if(s?.authenticated&&String(s.role)==="admin")await dashboard();
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
    const s=await getSupabaseStatus();window.__IPV4_SUPABASE_STATUS__=s;
    if(!s?.authenticated){await signOut();showMessage("تم تسجيل الدخول لكن تعذر قراءة جلسة المدير.");return;}
    if(String(s.role)!=="admin"){await signOut();showMessage("هذا الحساب ليس حساب مدير.");return;}
    await dashboard();
  }catch(error){showMessage("حدث خطأ أثناء الدخول: "+String(error?.message||error));}
  finally{setBusy(false);}
});
init();
