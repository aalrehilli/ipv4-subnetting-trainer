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
      '<div><div class="ver">🔐 بوابة الإدارة • V3.92</div><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p>'+
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
  let students=0,groups=0,exams=0,active=0,recent=[],signals={summary:{},students:[]},readiness={summary:{}};
  try{const r=await fetchTrainerStudentRoster("","");const p=r?.payload||{};students=Array.isArray(p.students)?p.students.length:0;groups=Array.isArray(p.groups)?p.groups.length:0;}catch{}
  try{const r=await fetchTrainerResultsSummary("");const p=r?.payload||{};exams=Number(p.summary?.exams||0);recent=Array.isArray(p.recent)?p.recent.slice(0,8):[];}catch{}
  try{const r=await fetchTrainerLiveExamMonitor();active=Number(r?.payload?.activeCount||0);}catch{}
  try{signals=await fetchTrainerLearningSignals();}catch{}
  try{const r=await fetchExamE2EReadiness();readiness=r?.payload||{};}catch{}
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  const sum=signals?.summary||{}, riskStudents=Array.isArray(signals?.students)?signals.students.slice(0,5):[];
  const topics=Array.isArray(signals?.topics)?signals.topics.slice(0,5):[];
  const rs=readiness?.summary||{};
  const published=Number(rs.published||rs.publishedExams||0),ready=Number(rs.ready||rs.readyExams||0),blocked=Number(rs.blocked||rs.blockedExams||0);
  const avg=Number(sum.average||sum.avg||0);
  const highRisk=Number(sum.highRisk||sum.high_risk||0);

  document.body.innerHTML=
  '<div class="pro-admin">'+
  '<style>'+
  '.pro-admin{min-height:100vh;background:#f5f8fc;direction:rtl;font-family:Tahoma,Arial,sans-serif;color:#182b3c;display:flex}.pro-sidebar{width:250px;background:#0a5fae;color:#fff;position:sticky;top:0;height:100vh;padding:22px 15px;box-sizing:border-box;display:flex;flex-direction:column}.pro-brand{display:flex;align-items:center;gap:12px;padding:5px 8px 24px;border-bottom:1px solid rgba(255,255,255,.14)}.pro-logo{width:44px;height:44px;border-radius:13px;background:#fff;color:#0a67c0;display:grid;place-items:center;font-weight:900}.pro-brand strong{font-size:18px}.pro-brand small{display:block;color:#d9edff;margin-top:3px}.pro-nav{padding:18px 0;display:grid;gap:7px}.pro-nav button{border:0;background:transparent;color:#dfefff;text-align:right;padding:12px 13px;border-radius:11px;font-weight:800;font-family:inherit;cursor:pointer}.pro-nav button:hover,.pro-nav button.active{background:rgba(255,255,255,.13);color:#fff}.pro-side-footer{margin-top:auto;padding:14px 10px;border-top:1px solid rgba(255,255,255,.14);font-size:12px;color:#cbe6fb;line-height:1.8}.pro-main{flex:1;min-width:0}.pro-topbar{height:76px;background:#fff;border-bottom:1px solid #e2eaf2;display:flex;align-items:center;justify-content:space-between;padding:0 28px;box-sizing:border-box}.pro-topbar-title{font-weight:900;font-size:18px}.pro-topbar-meta{display:flex;align-items:center;gap:10px;color:#6c8296;font-size:13px}.pro-avatar{width:38px;height:38px;border-radius:50%;background:#eaf4ff;color:#0a68bd;display:grid;place-items:center;font-weight:900}.pro-container{padding:24px 28px 34px;max-width:1400px;margin:auto}.pro-hero{background:linear-gradient(135deg,#0a67bd 0%,#0b7edb 60%,#0d5da5 100%);color:#fff;border-radius:22px;padding:28px;display:grid;grid-template-columns:1.6fr .8fr;gap:24px;box-shadow:0 14px 34px rgba(10,89,155,.16)}.pro-hero h1{margin:0 0 8px;font-size:31px}.pro-hero p{margin:0;color:#e4f2ff;line-height:1.9}.pro-hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}.pro-hero-actions button{border:0;border-radius:11px;padding:11px 16px;font-weight:900;font-family:inherit;cursor:pointer}.hero-primary{background:#fff;color:#0b67bd}.hero-light{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.5)!important;color:#fff}.pro-status-card{background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:18px}.pro-status-card .label{color:#d9ecfb;font-size:13px}.pro-score{font-size:42px;font-weight:900;margin:5px 0}.pro-progress{height:9px;background:rgba(255,255,255,.18);border-radius:99px;overflow:hidden}.pro-progress span{display:block;height:100%;background:#fff}.pro-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}.pro-kpi{background:#fff;border:1px solid #e0e9f1;border-radius:17px;padding:18px;box-shadow:0 7px 22px rgba(30,75,115,.05)}.pro-kpi-head{display:flex;justify-content:space-between;align-items:center;color:#71879a;font-size:13px;font-weight:800}.pro-kpi-icon{width:34px;height:34px;border-radius:10px;background:#edf6ff;display:grid;place-items:center;color:#0b6cc6}.pro-kpi-value{font-size:30px;font-weight:900;color:#0b63b7;margin:8px 0 2px}.pro-kpi-sub{font-size:12px;color:#91a0ae}.pro-grid{display:grid;grid-template-columns:1.6fr .95fr;gap:16px;margin-top:16px}.pro-card{background:#fff;border:1px solid #e0e9f1;border-radius:18px;padding:18px;box-shadow:0 7px 22px rgba(30,75,115,.04)}.pro-card h2{font-size:18px;margin:0}.pro-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:16px}.pro-link{border:0;background:transparent;color:#0b68bd;font-weight:900;cursor:pointer;font-family:inherit}.pro-table{width:100%;border-collapse:collapse}.pro-table th,.pro-table td{text-align:right;padding:11px 7px;border-bottom:1px solid #edf2f6;white-space:nowrap}.pro-table th{font-size:12px;color:#7a8e9f}.pro-table td{font-size:13px}.pro-badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900}.pro-green{background:#e8f7ee;color:#198754}.pro-orange{background:#fff4e4;color:#a56500}.pro-blue{background:#edf6ff;color:#0b68bd}.pro-live{display:flex;align-items:center;gap:10px;padding:13px;border-radius:13px;background:#f7fbff;border:1px solid #e2edf6}.live-dot{width:10px;height:10px;border-radius:50%;background:#1aac61;box-shadow:0 0 0 5px #e5f7ed}.pro-action-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}.pro-action{border:1px solid #deebf5;background:#f9fcff;border-radius:14px;padding:15px;text-align:right;cursor:pointer;font-family:inherit}.pro-action strong{display:block;color:#0b5fae;font-size:14px}.pro-action span{display:block;color:#8194a5;font-size:11px;margin-top:4px}.pro-mini-list{display:grid;gap:10px}.pro-mini-item{padding:11px 12px;border:1px solid #e7eef4;border-radius:12px;background:#fbfdff}.pro-mini-item .row{display:flex;justify-content:space-between;gap:10px}.pro-topic{display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:7px}.mini-bar{height:7px;background:#edf2f6;border-radius:99px;overflow:hidden}.mini-bar span{display:block;height:100%;background:#0b6cc6}.pro-footer-note{margin-top:16px;font-size:12px;color:#91a0ae}.pro-logout{margin-top:8px}.pro-mobile{display:none}@media(max-width:1050px){.pro-sidebar{width:210px}.pro-grid{grid-template-columns:1fr}.pro-hero{grid-template-columns:1fr}.pro-kpis{grid-template-columns:1fr 1fr}}@media(max-width:700px){.pro-sidebar{display:none}.pro-mobile{display:inline-flex}.pro-topbar{padding:0 15px}.pro-container{padding:15px}.pro-kpis{grid-template-columns:1fr 1fr}.pro-action-grid{grid-template-columns:1fr}.pro-topbar-title{font-size:15px}}@media(max-width:480px){.pro-kpis{grid-template-columns:1fr}.pro-hero h1{font-size:24px}}'+
  '</style>'+
  '<aside class="pro-sidebar">'+
    '<div class="pro-brand"><div class="pro-logo">IP</div><div><strong>IPv4 Academy</strong><small>لوحة الإدارة • V3.92</small></div></div>'+
    '<nav class="pro-nav">'+
      '<button class="active" id="nav-dashboard">⌂ لوحة التحكم</button>'+
      '<button id="nav-students">👥 المتدربون</button>'+
      '<button id="nav-results">📊 النتائج</button>'+
      '<button id="nav-exams">📝 الاختبارات</button>'+
      '<button id="nav-analytics">📈 التحليلات</button>'+
      '<button id="nav-audit">🛡️ التدقيق والجاهزية</button>'+
    '</nav>'+
    '<div class="pro-side-footer">مدير النظام<br>'+esc(name)+'<div class="pro-logout"><button id="side-logout" style="width:100%;border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:10px;padding:10px;font-family:inherit;font-weight:900;cursor:pointer">تسجيل الخروج</button></div></div>'+
  '</aside>'+
  '<main class="pro-main">'+
    '<header class="pro-topbar"><div class="pro-topbar-title">لوحة التحكم الرئيسية</div><div class="pro-topbar-meta"><span>آخر تحديث: الآن</span><div class="pro-avatar">'+esc((name||"م").slice(0,1))+'</div><span>'+esc(name)+'</span></div></header>'+
    '<div class="pro-container">'+
      '<section class="pro-hero">'+
        '<div><div style="font-size:13px;font-weight:900;color:#d8edff;margin-bottom:7px">SMART ADMIN • مركز الإدارة</div><h1>مرحبًا '+esc(name)+' 👋</h1><p>من هنا تدير المتدربين والاختبارات والنتائج وتتابع مؤشرات الأداء في مكان واحد.</p>'+
        '<div class="pro-hero-actions"><button class="hero-primary" id="hero-students">إدارة المتدربين</button><button class="hero-light" id="hero-results">عرض النتائج</button><button class="hero-light" id="hero-exams">فحص الاختبارات</button></div></div>'+
        '<div class="pro-status-card"><div class="label">متوسط الأداء العام</div><div class="pro-score">'+(avg||0)+'%</div><div class="pro-progress"><span style="width:'+Math.max(0,Math.min(100,avg))+'%"></span></div><div style="margin-top:8px;font-size:12px;color:#d7ebf9">إشارات متابعة عالية: '+highRisk+'</div></div>'+
      '</section>'+
      '<section class="pro-kpis">'+
        '<div class="pro-kpi"><div class="pro-kpi-head"><span>المتدربون</span><div class="pro-kpi-icon">👥</div></div><div class="pro-kpi-value">'+students+'</div><div class="pro-kpi-sub">السجلات الظاهرة حاليًا</div></div>'+
        '<div class="pro-kpi"><div class="pro-kpi-head"><span>المجموعات</span><div class="pro-kpi-icon">🏷️</div></div><div class="pro-kpi-value">'+groups+'</div><div class="pro-kpi-sub">المجموعات المسجلة</div></div>'+
        '<div class="pro-kpi"><div class="pro-kpi-head"><span>الاختبارات</span><div class="pro-kpi-icon">📝</div></div><div class="pro-kpi-value">'+exams+'</div><div class="pro-kpi-sub">اختبارات لها نتائج</div></div>'+
        '<div class="pro-kpi"><div class="pro-kpi-head"><span>اختبارات مباشرة</span><div class="pro-kpi-icon">🔴</div></div><div class="pro-kpi-value">'+active+'</div><div class="pro-kpi-sub">'+(active?"توجد جلسات قيد التنفيذ":"لا توجد جلسات الآن")+'</div></div>'+
      '</section>'+
      '<div class="pro-grid">'+
        '<section class="pro-card"><div class="pro-card-head"><h2>آخر النتائج</h2><button class="pro-link" id="results-more">عرض الكل ←</button></div><div class="table-wrap"><table class="pro-table"><thead><tr><th>المتدرب</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>'+
          (recent.length?recent.map(x=>'<tr><td><strong>'+esc(x.studentName||"متدرب")+'</strong><br><span style="font-size:10px;color:#8b9aa8">مجموعة '+esc(x.groupNo||"—")+'</span></td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="pro-badge '+(x.passed?"pro-green":"pro-orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td></tr>').join(""):'<tr><td colspan="4" style="text-align:center;padding:28px;color:#8a9baa">لا توجد نتائج مركزية بعد.</td></tr>')+
        '</tbody></table></div></section>'+
        '<section class="pro-card"><div class="pro-card-head"><h2>حالة المنصة</h2><span class="pro-badge pro-green">متصل</span></div>'+
          '<div class="pro-live"><div class="live-dot"></div><div><strong>المراقبة الحية</strong><div style="font-size:12px;color:#7a8e9f">'+active+' اختبار قيد التنفيذ</div></div></div>'+
          '<div style="height:10px"></div>'+
          '<div class="pro-live"><div style="font-size:21px">✅</div><div><strong>جاهزية الاختبارات</strong><div style="font-size:12px;color:#7a8e9f">'+ready+' جاهز / '+published+' منشور / '+blocked+' محجوب</div></div></div>'+
          '<div style="height:10px"></div>'+
          '<div class="pro-live"><div style="font-size:21px">🎯</div><div><strong>إشارات التدخل</strong><div style="font-size:12px;color:#7a8e9f">'+highRisk+' متدرب يحتاج متابعة مرتفعة</div></div></div>'+
        '</section>'+
      '</div>'+
      '<div class="pro-grid">'+
        '<section class="pro-card"><div class="pro-card-head"><h2>إجراءات سريعة</h2></div><div class="pro-action-grid">'+
          '<button class="pro-action" id="quick-students"><strong>👥 إدارة المتدربين</strong><span>بحث، مجموعات، Student 360</span></button>'+
          '<button class="pro-action" id="quick-results"><strong>📊 مركز النتائج</strong><span>نتائج رسمية ومراقبة حية</span></button>'+
          '<button class="pro-action" id="quick-exams"><strong>📝 مركز الاختبارات</strong><span>جاهزية وبنك الأسئلة</span></button>'+
          '<button class="pro-action" id="quick-analytics"><strong>📈 التحليلات</strong><span>الأداء وإشارات التعلم</span></button>'+
        '</div></section>'+
        '<section class="pro-card"><div class="pro-card-head"><h2>الموضوعات الأهم</h2><button class="pro-link" id="topics-more">التحليلات ←</button></div><div class="pro-mini-list">'+
          (topics.length?topics.map(t=>{const v=Math.max(0,Math.min(100,Number(t.accuracy||t.percent||t.avg||0)));return '<div class="pro-topic"><strong>'+esc(t.topic||t.name||"موضوع")+'</strong><span>'+v+'%</span></div><div class="mini-bar"><span style="width:'+v+'%"></span></div>';}).join(""):'<div style="color:#8b9ba9">لا توجد بيانات تحليلية كافية بعد.</div>')+
        '</div></section>'+
      '</div>'+
      '<div class="pro-footer-note">IPv4 Academy • لوحة إدارة مركزية • يتم تحديث البيانات من Supabase عند فتح اللوحة.</div>'+
    '</div>'+
  '</main></div>';

  $("nav-dashboard")?.addEventListener("click",()=>dashboard());
  $("nav-students")?.addEventListener("click",()=>renderView("students"));
  $("nav-results")?.addEventListener("click",()=>renderView("results"));
  $("nav-exams")?.addEventListener("click",()=>renderView("exams"));
  $("nav-analytics")?.addEventListener("click",()=>renderView("analytics"));
  $("nav-audit")?.addEventListener("click",()=>showInfo("التدقيق والجاهزية"));
  $("hero-students")?.addEventListener("click",()=>renderView("students"));
  $("hero-results")?.addEventListener("click",()=>renderView("results"));
  $("hero-exams")?.addEventListener("click",()=>renderView("exams"));
  $("results-more")?.addEventListener("click",()=>renderView("results"));
  $("quick-students")?.addEventListener("click",()=>renderView("students"));
  $("quick-results")?.addEventListener("click",()=>renderView("results"));
  $("quick-exams")?.addEventListener("click",()=>renderView("exams"));
  $("quick-analytics")?.addEventListener("click",()=>renderView("analytics"));
  $("topics-more")?.addEventListener("click",()=>renderView("analytics"));
  $("side-logout")?.addEventListener("click",async()=>{await signOut();location.href="./admin.html";});
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
