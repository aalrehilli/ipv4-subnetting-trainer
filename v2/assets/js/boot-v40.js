const state={role:"student",page:"auth",filter:"",group:"",studentId:null,analyticsCourse:"",authMode:"login"};
const NAV_STATE_KEY="ipv4AcademyNavStateV1";
function restoreNavState(){
  try{
    const saved=JSON.parse(sessionStorage.getItem(NAV_STATE_KEY)||"null");
    if(!saved)return;
    if(["student","trainer","admin"].includes(String(saved.role))) state.role=String(saved.role);
    if(saved.page)state.page=String(saved.page);
    state.filter=String(saved.filter||"");
    state.group=String(saved.group||"");
    state.studentId=saved.studentId||null;
    state.analyticsCourse=String(saved.analyticsCourse||"");
  }catch{}
}
function persistNavState(){
  try{
    sessionStorage.setItem(NAV_STATE_KEY,JSON.stringify({
      role:state.role,page:state.page,filter:state.filter,group:state.group,
      studentId:state.studentId,analyticsCourse:state.analyticsCourse
    }));
  }catch{}
}
function clearNavState(){
  try{sessionStorage.removeItem(NAV_STATE_KEY);}catch{}
}
const STUDENT_PAGES=["home","level","course","practice","exams","review","review-session","labs","progress","notifications","achievements","certificate","lesson-content","lesson-assessment","subnet-lab","flsm","vlsm"];
const TRAINER_PAGES=["tdash","students","groups","courses","questions","qbaudit","examcheck","exams","results","qintel","labs","analytics","interventions","notifications","student360","audit"];
const ADMIN_PAGES=["adash","users","students","groups","courses","questions","qbaudit","examcheck","exams","results","analytics","interventions","notifications","audit"];
function normalizeRolePage(){
  const role=String(state.role||"student");
  const page=String(state.page||"auth");
  if(role==="admin"){
    if(!ADMIN_PAGES.includes(page)) state.page="adash";
  }else if(role==="trainer"){
    if(!TRAINER_PAGES.includes(page)) state.page="tdash";
  }else{
    if(!STUDENT_PAGES.includes(page)) state.page="home";
  }
  persistNavState();
}
restoreNavState();

const studentNav=[
  ["home","الرئيسية"],["level","ابدأ من مستواي"],["course","المقرر"],["practice","التدريب"],
  ["exams","الاختبارات"],["review","المراجعة الذكية"],["labs","المختبرات"],["progress","التقدم"],
  ["notifications","الإشعارات"],["achievements","الإنجازات"],["certificate","الشهادة"]
];

const trainerNav=[
  ["tdash","الرئيسية"],["students","المتدربون"],["groups","المجموعات"],["courses","المقررات"],
  ["questions","بنك الأسئلة"],["qbaudit","تدقيق البنك"],["examcheck","فحص الاختبار"],["exams","الاختبارات"],["results","مركز النتائج"],["qintel","ذكاء السؤال"],["labs","المختبرات"],["analytics","التحليلات"],
  ["interventions","مركز التدخل"],["notifications","الإشعارات"]
];

const adminNav=[
  ["adash","لوحة المدير"],["users","إدارة المستخدمين"],["students","المتدربون"],["groups","المجموعات"],["courses","المقررات"],
  ["questions","بنك الأسئلة"],["qbaudit","تدقيق البنك"],["examcheck","فحص الاختبار"],
  ["exams","الاختبارات"],["results","مركز النتائج"],["analytics","التحليلات"],
  ["interventions","مركز التدخل"],["notifications","الإشعارات"]
];



function esc(v){
  return String(v==null?"":v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function card(title,value,sub){
  return '<div class="card student-stat"><div class="muted">'+title+'</div><div class="kpi-value">'+value+'</div><div class="muted">'+sub+'</div></div>';
}

function sidebar(){
  const items=state.role==="student"?studentNav:(state.role==="admin"?adminNav:trainerNav);
  return '<aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V4.01 • Unified Platform</small></div></div>'+
    '<nav class="nav">'+items.map(function(item){
      return '<button class="'+(state.page===item[0]?"active":"")+'" data-page="'+item[0]+'">'+item[1]+'</button>';
    }).join("")+'</nav>'+
    '<div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div></aside>';
}

function topbar(){
  const role=String(state.role||"student");
  const name=window.__IPV4_SUPABASE_STATUS__?.name||(role==="admin"?"المدير":role==="trainer"?"المدرب":"المتدرب");
  const label=role==="admin"?"المدير":role==="trainer"?"المدرب":"المتدرب";
  return '<header class="topbar"><div class="topbar-title">'+
    (role==="admin"?"مركز المدير":role==="trainer"?"مساحة المدرب":"مساحة المتدرب")+
    ' <span class="badge" style="margin-right:8px">'+label+'</span></div>'+
    '<div class="topbar-actions"><span class="muted">'+esc(name)+'</span>'+
    '<button class="btn btn-soft" id="auth-logout">تسجيل الخروج</button>'+
    '<button class="btn btn-ghost" id="hard-refresh">تحديث</button>'+
    '<div class="avatar">'+esc((name||label).slice(0,1))+'</div></div></header>';
}
function adminPortalLoginView(){
  return '<div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#eef6ff,#f7fbff);direction:rtl;font-family:Tahoma,Arial,sans-serif">'+
    '<section style="width:min(460px,100%);background:#fff;border:1px solid #d7e6f5;border-radius:22px;box-shadow:0 18px 50px rgba(22,68,110,.10);padding:32px">'+
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:24px"><div style="width:52px;height:52px;border-radius:15px;background:#0b6bcb;color:#fff;display:grid;place-items:center;font-weight:900;font-size:19px">IP</div><div><h1 style="margin:0;color:#0b5dab;font-size:26px">IPv4 Academy</h1><small style="color:#70859a">بوابة الإدارة • V4.01</small></div></div>'+
    '<div style="display:inline-flex;padding:7px 11px;border-radius:999px;background:#edf6ff;color:#0b6bcb;font-weight:800;font-size:13px;margin-bottom:18px">🔐 دخول المدير فقط</div>'+
    '<h2 style="margin:0 0 8px;font-size:28px;color:#102d48">تسجيل دخول الإدارة</h2>'+
    '<p style="margin:0 0 22px;color:#6c7f91;line-height:1.8">هذه الصفحة مستقلة عن دخول المتدربين، ومخصصة للوصول إلى لوحة مدير المنصة.</p>'+
    '<div id="admin-login-msg" style="display:none;margin:14px 0;padding:12px 14px;border-radius:12px;line-height:1.7"></div>'+
    '<form id="admin-login-form">'+
    '<label style="display:block;font-weight:800;margin:14px 0 7px">البريد الإلكتروني</label>'+
    '<input id="admin-login-email" type="email" autocomplete="username" placeholder="adel.alrehili@gmail.com" required style="width:100%;height:50px;border:1px solid #cbdbea;border-radius:12px;padding:0 14px;font-size:16px">'+
    '<label style="display:block;font-weight:800;margin:14px 0 7px">كلمة المرور</label>'+
    '<input id="admin-login-password" type="password" autocomplete="current-password" placeholder="كلمة المرور" required style="width:100%;height:50px;border:1px solid #cbdbea;border-radius:12px;padding:0 14px;font-size:16px">'+
    '<button id="admin-login-submit" type="submit" style="width:100%;height:52px;border:0;border-radius:12px;background:#0b6bcb;color:#fff;font-size:17px;font-weight:900;cursor:pointer;margin-top:20px">دخول الإدارة</button>'+
    '</form>'+
    '<div style="margin-top:20px;text-align:center;color:#7a8d9f;font-size:13px"><a href="./index.html" style="color:#0b6bcb;text-decoration:none;font-weight:800">العودة إلى منصة المتدربين</a></div>'+
    '</section></div>';
}

async function bindAdminPortalLogin(){
  const form=document.getElementById("admin-login-form");
  if(!form)return;
  const msg=document.getElementById("admin-login-msg");
  const btn=document.getElementById("admin-login-submit");
  const show=(text,ok)=>{
    msg.style.display="block";
    msg.style.background=ok?"#f0fbf4":"#fff5f5";
    msg.style.color=ok?"#206c3e":"#a42626";
    msg.style.borderRight="4px solid "+(ok?"#2d9a58":"#d64545");
    msg.textContent=text;
  };
  try{
    const sb=await import("./supabase-v30.js?v=498");
    const current=await sb.getSupabaseStatus();
    if(current?.authenticated){
      if(String(current.role)==="admin"){
        window.location.href="./index.html?admin=1";
        return;
      }
      await sb.signOut();
    }
    form.addEventListener("submit",async function(e){
      e.preventDefault();
      const email=String(document.getElementById("admin-login-email")?.value||"").trim();
      const password=String(document.getElementById("admin-login-password")?.value||"");
      if(!email||!password){show("أدخل البريد الإلكتروني وكلمة المرور.");return;}
      btn.disabled=true;btn.textContent="جاري التحقق…";
      try{
        const login=await sb.signInWithPassword(email,password);
        if(!login.ok){show(String(login.error||"تعذر تسجيل الدخول."));return;}
        const status=await sb.getSupabaseStatus();
        if(!status?.authenticated || String(status.role)!=="admin"){
          await sb.signOut();
          show("تم رفض الدخول: الحساب لا يملك صلاحية المدير.");
          return;
        }
        show("تم التحقق من حساب المدير. جاري فتح لوحة الإدارة…",true);
        setTimeout(()=>window.location.href="./index.html?admin=1",250);
      }catch(error){
        try{await sb.signOut();}catch{}
        show("تعذر إكمال تسجيل دخول الإدارة.");
      }finally{
        btn.disabled=false;btn.textContent="دخول الإدارة";
      }
    });
  }catch(error){show("تعذر تشغيل بوابة الإدارة.");}
}

async function adminDashboard(){
  const sb=await import("./supabase-v30.js?v=498");
  let roster={ok:false,payload:{summary:{},students:[],groups:[],courses:[]}};
  let results={ok:false,payload:{summary:{},exams:[],groups:[],students:[],recent:[]}};
  let live={ok:false,payload:{activeCount:0,attempts:[]}};
  try{roster=await sb.fetchTrainerStudentRoster("","");}catch{}
  try{results=await sb.fetchTrainerResultsSummary("");}catch{}
  try{live=await sb.fetchTrainerLiveExamMonitor();}catch{}
  const rs=roster.payload||{}, summary=results.payload?.summary||{};
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";
  const groups=Array.isArray(rs.groups)?rs.groups:[];
  const students=Array.isArray(rs.students)?rs.students:[];
  const recent=Array.isArray(results.payload?.recent)?results.payload.recent:[];
  const active=Number(live.payload?.activeCount||0);
  return '<section class="student-hero home-hero">'+
    '<div class="student-hero-copy"><span class="eyebrow">V3.97 • إدارة المنصة</span>'+
    '<h1>مرحبًا '+esc(name)+' 👋</h1>'+
    '<p>لوحة الإدارة المركزية لمنصة IPv4 Academy. من هنا تتابع المتدربين والاختبارات والنتائج والتحليلات.</p>'+
    '<div class="admin-core-actions"><button class="admin-core-action admin-core-action-students" data-page="students"><span class="admin-core-icon">👥</span><span class="admin-core-copy"><strong>إدارة المتدربين</strong><small>المتدربون والمجموعات وملفات Student 360</small></span><span class="admin-core-arrow">←</span></button><button class="admin-core-action admin-core-action-results" data-page="results"><span class="admin-core-icon">📊</span><span class="admin-core-copy"><strong>عرض النتائج</strong><small>النتائج الرسمية والأداء ونسب الاجتياز</small></span><span class="admin-core-arrow">←</span></button><button class="admin-core-action admin-core-action-exams" data-page="exams"><span class="admin-core-icon">📝</span><span class="admin-core-copy"><strong>فحص الاختبارات</strong><small>الجاهزية والنشر والاختبارات الحالية</small></span><span class="admin-core-arrow">←</span></button></div></div><div class="student-hero-side"><div class="hero-mini-label">المراقبة الحية</div>'+
    '<div class="hero-level">'+active+'</div><div class="muted">اختبارات قيد التنفيذ</div></div></section>'+
    '<div class="student-grid-4 home-kpis">'+
    card("المتدربون",Number(summary.students||students.length||0),"ملفات لها نتائج")+
    card("المجموعات",groups.length,"المجموعات المسجلة")+
    card("الاختبارات",Number(summary.exams||0),"لها نتائج رسمية")+
    card("النتائج",Number(summary.submitted_attempts||0),"محاولة مسلّمة")+
    '</div>'+
    '<div class="section-title"><h3>إجراءات المدير</h3><span class="badge purple">Central Admin</span></div>'+
    '<div class="action-grid" style="margin-bottom:14px">'+
      '<div class="action-card"><strong>إدارة المستخدمين</strong><span class="muted">الأدوار، المجموعات، حالة الحساب وإعادة تعيين كلمة المرور.</span><div style="margin-top:10px"><button class="btn btn-soft" data-page="users">فتح مركز المستخدمين</button></div></div>'+
    '</div>'+
    '<div class="action-grid">'+
      '<div class="action-card"><strong>إدارة المتدربين</strong><span class="muted">عرض المتدربين والمجموعات وStudent 360.</span><div style="margin-top:10px"><button class="btn btn-soft" data-page="students">فتح</button></div></div>'+
      '<div class="action-card"><strong>إدارة الاختبارات</strong><span class="muted">الاختبارات المنشورة وبنك الأسئلة وفحص الجاهزية.</span><div style="margin-top:10px"><button class="btn btn-soft" data-page="exams">فتح</button></div></div>'+
      '<div class="action-card"><strong>مركز النتائج</strong><span class="muted">النتائج الرسمية والمراقبة الحية والتحليل.</span><div style="margin-top:10px"><button class="btn btn-soft" data-page="results">فتح</button></div></div>'+
      '<div class="action-card"><strong>التحليلات</strong><span class="muted">مؤشرات التعلم وأداء المجموعات والمتدربين.</span><div style="margin-top:10px"><button class="btn btn-soft" data-page="analytics">فتح</button></div></div>'+
    '</div>'+
    '<div class="section-title"><h3>آخر النتائج</h3><span class="badge green">'+recent.length+' نتيجة</span></div>'+
    '<div class="card"><div class="table-scroll"><table class="table trainer-results-table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>'+
    (recent.length?recent.slice(0,8).map(function(x){return '<tr><td><strong>'+esc(x.studentName||"متدرب")+'</strong></td><td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td></tr>';}).join(""):'<tr><td colspan="5"><div class="empty">لا توجد نتائج مركزية بعد.</div></td></tr>')+
    '</tbody></table></div></div>';
}

async function home(){
  var mastery={ok:false,summary:{overall:65,lessonProgress:68,examAvg:0,assessmentAvg:0},topics:[],recommendation:null};
  try{
    var sb=await import("./supabase-v30.js?v=498");
    mastery=await sb.fetchStudentMastery("");
  }catch{}
  var s=mastery.summary||{};
  var overall=Number(s.overall||0),lessonProgress=Number(s.lessonProgress||0);
  var topics=Array.isArray(mastery.topics)?mastery.topics:[];
  var rec=mastery.recommendation;
  var topTopic=topics[0]?.topic||"Subnetting";
  var topAccuracy=Number(topics[0]?.accuracy||0);
  var nextPage=rec?.page||"review";
  return '<section class="student-hero home-hero"><div class="student-hero-copy">'+
    '<span class="eyebrow">V3.69 • التقدم الذكي</span><h1>أهلًا بك في IPv4 Academy 👋</h1>'+
    '<p>المنصة تجمع تقدم الدروس ونتائج الاختبارات وتحدد لك الخطوة التالية تلقائيًا.</p>'+
    '<div class="hero-actions"><button class="btn btn-white" data-page="'+nextPage+'">✦ '+(rec?.action||"ابدأ المراجعة")+'</button>'+
    '<button class="btn btn-outline-white" data-page="level">🎯 اختبار تحديد المستوى</button></div></div>'+
    '<div class="student-hero-side"><div class="hero-mini-label">الإتقان العام</div><div class="hero-level">'+overall+'%</div>'+
    '<div class="progress hero-progress"><span style="width:'+overall+'%"></span></div>'+
    '<div class="hero-progress-row"><span>المؤشر الموحد</span><span>'+Number(s.examAvg||0)+'% اختبارات</span></div></div></section>'+
    '<div class="home-utility-grid"><div class="card home-utility-card notification-utility"><div class="home-utility-icon">🔔</div>'+
    '<div><span class="eyebrow purple">مركز المتابعة</span><h3>الخطوة التالية</h3><p class="muted">'+esc(rec?.reason||"تابع التعلم ثم نفّذ اختبارًا لرفع دقة المؤشر.")+'</p></div>'+
    '<button class="btn btn-purple" data-page="'+nextPage+'">فتح</button></div>'+
    '<div class="card home-utility-card"><div class="home-utility-icon green">✓</div>'+
    '<div><span class="eyebrow green">أولوية التحسين</span><h3>'+esc(topTopic)+'</h3><p class="muted">الدقة الحالية '+topAccuracy+'% وفق النتائج المركزية.</p></div>'+
    '<button class="btn btn-green" data-page="review">راجع الآن</button></div></div>'+
    '<div class="student-grid-4 home-kpis">'+
    card("تقدم الدروس",lessonProgress+"%","المحتوى المكتمل")+
    card("الإتقان العام",overall+"%","المؤشر الموحد")+
    card("متوسط الاختبارات",Number(s.examAvg||0)+"%",Number(s.examAttempts||0)+" محاولة")+
    card("تقييمات الدروس",Number(s.assessmentAvg||0)+"%","Assessment")+
    '</div>'+
    '<div class="section-title"><h3>خريطة الإتقان المركزية</h3><span class="badge purple">V3.69 Smart Progress</span></div>'+
    '<div class="card mastery-grid">'+
    (topics.length?topics.slice(0,6).map(function(x){var v=Number(x.accuracy||0);var cls=v<50?"red":v<70?"orange":"green";return '<div class="mastery-item"><div><strong>'+esc(x.topic)+'</strong><span class="badge '+cls+'">'+v+'%</span></div><div class="progress"><span style="width:'+v+'%"></span></div><small>'+esc(x.status||"")+'</small></div>';}).join(""):'<div class="empty">بعد أول اختبار مركزي ستظهر خريطة الإتقان هنا.</div>')+
    '</div>'+
    '<div class="section-title"><h3>التقدم</h3><button class="link-btn" data-page="progress">عرض التفاصيل</button></div>'+
    '<div class="card"><div class="learning-path"><div class="path-item current"><div class="path-dot">1</div><div class="path-content"><div class="path-top"><strong>التعلم → التدريب → الاختبار → المراجعة</strong><span class="badge purple">ذكي</span></div><div class="muted">كل نتيجة جديدة تعيد حساب مستوى الإتقان والتوصية القادمة.</div><div class="progress"><span style="width:'+overall+'%"></span></div></div></div></div></div>';
}
function placeholder(title,desc){
  return '<div class="page-intro"><span class="eyebrow blue">IPv4 Academy</span><h2>'+title+'</h2><p>'+desc+'</p></div>'+
    '<div class="card"><h3>هذه الشاشة جاهزة للتطوير</h3><p class="muted">تم تثبيت التشغيل الأساسي أولًا لمنع الشاشة البيضاء. يمكن الآن تشغيل المكونات المتقدمة من داخل الشاشة نفسها.</p>'+
    '<div style="margin-top:15px"><button class="btn btn-primary" data-page="home">العودة للرئيسية</button></div></div>';
}

function errorView(error){
  return '<div class="card" style="border-right:4px solid var(--red)"><h3>تعذر تحميل هذه الشاشة</h3>'+
    '<p class="muted">الرئيسية تعمل، لكن المكون المطلوب يحتاج إصلاحًا مستقلًا.</p>'+
    '<pre style="direction:ltr;white-space:pre-wrap">'+esc(error&&error.message?error.message:error)+'</pre>'+
    '<button class="btn btn-primary" data-page="home">العودة للرئيسية</button></div>';
}

function shell(content){
  return '<div class="app-shell">'+sidebar()+'<main class="main">'+topbar()+'<div class="container">'+content+'</div></main></div>';
}

async function loadPage(){
  const sbStatus=window.__IPV4_SUPABASE_STATUS__||{};
  if(state.authMode==="reset"){
    const auth=await import("./auth-v72.js?v=505");
    return auth.authView("reset");
  }
  if(sbStatus.configured && !sbStatus.authenticated){
    const auth=await import("./auth-v72.js?v=507");
    return auth.authView(state.authMode||"login",sbStatus.message&&sbStatus.message!=="Supabase مهيأ — يلزم تسجيل الدخول"?sbStatus.message:"");
  }
  if(state.role==="student" && state.page==="home"){
    var student100=await import("./student-dashboard-v100.js?v=521");
    return await student100.studentDashboardV100();
  }
  if(state.role==="admin" && state.page==="adash"){
    var admin106=await import("./admin-dashboard-v106.js?v=507");
    return await admin106.adminDashboardV106();
  }
  if(state.role==="admin" && state.page==="users"){
    var userManagement=await import("./user-management-v94.js?v=505");
    return await userManagement.userManagementView();
  }

  try{
    if(state.role==="student" && (state.page==="course" || state.page==="lesson-content" || state.page==="lesson-assessment")){
      try{
        var courseSync=await import("./course-supabase-v39.js?v=520");
        await courseSync.syncMyActiveCoursesToLocal();
      }catch(e){}
      var learning=await import("./course-learning-v38.js?v=520");
      if(state.page==="course") return learning.learnerCourse();
      if(state.page==="lesson-assessment") return learning.assessmentView();
      return learning.lessonPage();
    }

    if(state.page==="notifications"){
      var centralNotifications=await import("./notifications-v64.js?v=498");
      return centralNotifications.notificationsV64View(state.role);
    }

    if((state.role==="trainer" || state.role==="admin") && window.__IPV4_SUPABASE_STATUS__?.configured && !(
      window.__IPV4_SUPABASE_STATUS__?.authenticated &&
      ["trainer","admin"].includes(String(window.__IPV4_SUPABASE_STATUS__?.role||""))
    )){
      return '<div class="page-intro"><span class="eyebrow red">V3.82 • الصلاحيات</span><h2>الوصول إلى مركز المدرب مقيد</h2><p>يلزم تسجيل الدخول بحساب مدرب أو مدير للوصول إلى بيانات المتدربين والتحليلات.</p></div>'+
        '<div class="card" style="border-right:4px solid var(--red)"><h3>تسجيل الدخول مطلوب</h3><p class="muted">واجهة المدرب محمية الآن عند تشغيل Supabase. المحتوى العام للمتدرب يبقى متاحًا.</p><button class="btn btn-primary" data-page="home">العودة لمساحة المتدرب</button></div>';
    }

    if((state.role==="trainer" || state.role==="admin") && state.page==="analytics"){
      var centralAnalytics=await import("./trainer-analytics-v63.js?v=498");
      return centralAnalytics.trainerAnalyticsView(state.analyticsCourse||"");
    }

    if((state.role==="trainer" || state.role==="admin") && state.page==="interventions"){
      var interventions=await import("./intervention-v31.js?v=498");
      return interventions.interventionCenterView();
    }

    if((state.role==="trainer" || state.role==="admin") && state.page==="qbaudit"){
      var qbaudit=await import("./question-bank-audit-v74.js?v=498");
      return await qbaudit.questionBankAuditView();
    }
    if((state.role==="trainer" || state.role==="admin") && state.page==="examcheck"){
      var e2e=await import("./exam-e2e-v77.js?v=498");
      return await e2e.examE2EView();
    }

    if((state.role==="trainer" || state.role==="admin") && (state.page==="students" || state.page==="groups")){
      if(state.page==="groups"){
        var groupManagement=await import("./group-management-v110.js?v=519");
        return await groupManagement.groupManagementView();
      }
      if(state.role==="admin"){
        var adminRoster=await import("./trainer-students-v71.js?v=519");
        return await adminRoster.trainerStudentsView(state.filter||"",state.group||"");
      }
      var rosterV71=await import("./trainer-students-v71.js?v=519");
      return await rosterV71.trainerStudentsView(state.filter||"",state.group||"");
    }

    if((state.role==="trainer" || state.role==="admin") && ["students","groups","courses","qbaudit","examcheck","exams","results","labs","analytics","tdash","adash","student360","audit","qintel","questions"].indexOf(state.page)>=0){
      if(state.page==="tdash"){
        var trainer101=await import("./trainer-dashboard-v101.js?v=506");
        return await trainer101.trainerDashboardV101();
      }
      var trainer=await import("./trainer-v22.js?v=498");
      if(state.page==="student360"){var s360=await import("./student360-v70.js?v=498");return await s360.student360View(state.studentId||"");}
      if(state.page==="results"){var results=await import("./results-center-v76.js?v=498");return results.resultsCenterView();}
      if(state.page==="qintel"){var qi=await import("./question-intelligence-v35.js?v=498");return qi.questionIntelligenceView();}
      return trainer.getTrainerView(state.page,state.filter||"",state.studentId,state.group||"");
    }

    if(state.role==="student" && (state.page==="review" || state.page==="review-session")){
      var smartReview=await import("./smart-review-v38.js?v=498");
      return await smartReview.smartReviewPage();
    }

    if(state.role==="student"){
      if(state.page==="labs"){var labCenter=await import("./lab-center-v37.js?v=498");return labCenter.labCenterView();}
      var student=await import("./student.js?v=498");
      student.studentState.page=state.page;
      return await student.studentPage();
    }

    return placeholder("مركز المدرب","اختر قسمًا من القائمة.");
  }catch(error){
    return errorView(error);
  }
}


async function syncSupabaseRuntime(){
  try{
    var sb=await import("./supabase-v30.js?v=498");
    await sb.installAuthStateListener();
    const params=new URLSearchParams(window.location.search);
    const adminLoginMode=params.get("admin")==="login";
    const adminPortal=params.get("admin")==="1";
    if(adminLoginMode){
      try{ await sb.signOut(); }catch{}
      window.__IPV4_SUPABASE_STATUS__={configured:true,authenticated:false,role:null};
      state.role="student";
      state.page="auth";
      return {status:window.__IPV4_SUPABASE_STATUS__};
    }
    var result=await sb.syncAllFromSupabase();
    window.__IPV4_SUPABASE_STATUS__=result.status||window.__IPV4_SUPABASE_STATUS__||{configured:false,authenticated:false};
    if(adminPortal){
      if(!window.__IPV4_SUPABASE_STATUS__.authenticated){
        window.location.replace("./?admin=login");
        return result;
      }
      const role=String(window.__IPV4_SUPABASE_STATUS__.role||"");
      if(role!=="admin"){
        try{await sb.signOut();}catch{}
        window.location.replace("./?admin=login&denied=1");
        return result;
      }
      state.role="admin";
      state.page="adash";
    }else if(window.__IPV4_SUPABASE_STATUS__.authenticated){
      const actualRole=String(window.__IPV4_SUPABASE_STATUS__.role||"student");
      const rememberedRole=String(state.role||"");
      const rememberedPage=String(state.page||"");
      state.role=(actualRole==="admin"?"admin":actualRole==="trainer"?"trainer":"student");

      const allowed=state.role==="admin"?ADMIN_PAGES:state.role==="trainer"?TRAINER_PAGES:STUDENT_PAGES;
      const canRestore=rememberedRole===state.role && allowed.includes(rememberedPage);
      if(canRestore) state.page=rememberedPage;
      else if(state.role==="admin") state.page="adash";
      else if(state.role==="trainer") state.page="tdash";
      else state.page="home";
      normalizeRolePage();
    }
    return result;
  }catch(error){
    const previous=window.__IPV4_SUPABASE_STATUS__;
    window.__IPV4_SUPABASE_STATUS__={...(previous||{}),configured:previous?.configured!==false,authenticated:previous?.authenticated!==false,role:state.role,name:previous?.name||((state.role==="trainer")?"المدرب":state.role==="admin"?"المدير":"المتدرب"),message:"تعذر تحديث بيانات الحساب مؤقتًا.",error:String(error&&error.message||error)};
    normalizeRolePage();
    return null;
  }
}
async function render(){
  var app=document.getElementById("app");
  if(!app){
    document.body.innerHTML='<div style="padding:30px;direction:rtl;font-family:Tahoma"><h2>تعذر العثور على مساحة التطبيق</h2></div>';
    return;
  }

  // نرسم الهيكل فورًا أولًا، ثم نملأ المحتوى. هذا يمنع الشاشة البيضاء أثناء التحميل.
  app.innerHTML=shell('<div class="card"><h3>جاري تحميل الشاشة…</h3><p class="muted">IPv4 Academy</p></div>');

  await syncSupabaseRuntime();
  const adminLoginMode=new URLSearchParams(window.location.search).get("admin")==="login";
  if(adminLoginMode && !window.__IPV4_SUPABASE_STATUS__?.authenticated){
    app.innerHTML=adminPortalLoginView();
    await bindAdminPortalLogin();
    return;
  }
  var content=await loadPage();
  const authOnly=state.authMode==="reset" || (window.__IPV4_SUPABASE_STATUS__?.configured !== false && !window.__IPV4_SUPABASE_STATUS__?.authenticated);
  app.innerHTML=authOnly?content:shell(content||placeholder("صفحة فارغة","لا يوجد محتوى لهذه الشاشة."));
  bind();
}

window.addEventListener("ipv4-course-progress-sync",function(){
  render().catch(function(error){
    const app=document.getElementById("app");
    if(app){app.innerHTML=shell(errorView(error));bind();}
  });
});

window.addEventListener("ipv4-auth-mode",function(event){
  state.authMode=event.detail?.mode||"login";
  render().catch(function(error){document.getElementById("app").innerHTML=errorView(error);bind();});
});

window.addEventListener("ipv4-auth-success",async function(event){
  state.authMode="login";
  state.filter="";state.group="";state.studentId=null;
  try{
    const role=String(event.detail?.role||"student");
    state.role=role==="admin"?"admin":role==="trainer"?"trainer":"student";
    state.page=state.role==="admin"?"adash":state.role==="trainer"?"tdash":"home";
    window.__IPV4_AUTH_ROUTING__=false;
    await render();
  }catch(error){
    window.__IPV4_AUTH_ROUTING__=false;
    const app=document.getElementById("app");
    if(app){app.innerHTML=errorView(error);bind();}
  }
});

window.addEventListener("ipv4-auth-password-updated",async function(){
  try{const m=await import("./supabase-v30.js?v=498");await m.signOut();}catch{}
  state.authMode="login";state.page="auth";window.location.hash="";clearNavState();
  render().catch(function(error){document.getElementById("app").innerHTML=errorView(error);bind();});
});

window.addEventListener("ipv4-auth-state",function(event){
  const e=event.detail?.event;
  if(e==="PASSWORD_RECOVERY") state.authMode="reset";
  else if(e==="SIGNED_OUT"){state.authMode="login";state.page="auth";}
  else if(e==="SIGNED_IN"||e==="INITIAL_SESSION"){
    if(state.authMode!=="reset")state.authMode="login";
    if(e==="INITIAL_SESSION") return;
    if(window.__IPV4_AUTH_ROUTING__) return;
  }
  setTimeout(function(){render().catch(function(error){document.getElementById("app").innerHTML=errorView(error);bind();});},0);
});

window.addEventListener("ipv4-course-switch",function(){
  render().catch(function(error){
    const app=document.getElementById("app");
    if(app){app.innerHTML=shell(errorView(error));bind();}
  });
});

function bind(){
  if(state.authMode==="reset" || (window.__IPV4_SUPABASE_STATUS__?.configured && !window.__IPV4_SUPABASE_STATUS__?.authenticated)){
    import("./auth-v72.js?v=507").then(function(m){if(typeof m.bindAuth==="function")m.bindAuth();}).catch(function(){});
  }
  import("./notifications-v64.js?v=498").then(function(m){
    if(typeof m.bindCentralNotifications==="function")m.bindCentralNotifications();
  }).catch(function(){});
  document.querySelectorAll("[data-lab-page]").forEach(function(btn){
    btn.addEventListener("click",function(){
      var target=btn.getAttribute("data-lab-page")||"labs";
      state.role="student";
      state.page=target==="subnet"?"subnet-lab":target==="flsm"?"flsm":target==="vlsm"?"vlsm":"labs";
      render().catch(function(error){document.getElementById("app").innerHTML=shell(errorView(error));bind();});
    });
  });

  document.querySelectorAll("[data-smart-review-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./smart-review-v38.js?v=498");
        var result=await m.handleSmartReviewAction(btn);
        state.role="student";
        state.page="review";
        if(result&&result.message) window.alert(result.message);
        await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error));bind();
      }
    });
  });

  if(state.role==="admin" && state.page==="users"){
    import("./user-management-v94.js?v=505").then(function(m){if(typeof m.bindUsers==="function")m.bindUsers();}).catch(function(){});
  }

  document.querySelectorAll("[data-page]").forEach(function(btn){
    btn.addEventListener("click",function(){
      const target=btn.getAttribute("data-page");
      if(state.role==="trainer" && target==="courses"){
        try{
          localStorage.removeItem("ipv4AcademyV36Course");
          localStorage.removeItem("ipv4AcademyV36Unit");
          localStorage.removeItem("ipv4AcademyV36Lesson");
          localStorage.removeItem("ipv4AcademyV36UnitForm");
        }catch(e){}
      }
      state.page=target;
      normalizeRolePage();
      render().catch(function(error){
        document.getElementById("app").innerHTML=shell(errorView(error));
        bind();
      });
    });
  });

  var logout=document.getElementById("auth-logout");
  if(logout) logout.addEventListener("click",async function(){
    try{
      const m=await import("./supabase-v30.js?v=498");
      const result=await m.signOut();
      if(!result.ok) throw new Error(result.error||result.reason||"تعذر تسجيل الخروج");
      clearNavState();
      window.location.reload();
    }catch(error){
      window.alert(String(error&&error.message||error));
    }
  });

  var refresh=document.getElementById("hard-refresh");
  if(refresh) refresh.addEventListener("click",function(){ location.reload(); });

  document.querySelectorAll("[data-trainer-page]").forEach(function(btn){
    btn.addEventListener("click",function(){
      state.role="trainer";
      state.page=btn.getAttribute("data-trainer-page")||"tdash";
      state.filter=btn.getAttribute("data-risk")||"";
      state.group=btn.getAttribute("data-group")||"";
      normalizeRolePage();
      render();
    });
  });

  document.querySelectorAll("[data-student-id]").forEach(function(btn){
    btn.addEventListener("click",function(){
      state.role="trainer";
      state.page="student360";
      state.studentId=btn.getAttribute("data-student-id")||null;
      persistNavState();
      state.filter="";
      render();
    });
  });

  document.querySelectorAll("[data-group-filter]").forEach(function(btn){
    btn.addEventListener("click",function(){
      state.role="trainer";
      state.page="groups";
      state.group=btn.getAttribute("data-group-filter")||"1";
      persistNavState();
      document.querySelectorAll("[data-group-panel]").forEach(function(panel){
        panel.hidden=panel.getAttribute("data-group-panel")!==state.group;
      });
      document.querySelectorAll("[data-group-filter]").forEach(function(x){x.classList.toggle("active",x.getAttribute("data-group-filter")===state.group);});
    });
  });

  document.querySelectorAll("[data-trainer-risk-chip]").forEach(function(btn){
    btn.addEventListener("click",function(){
      state.role="trainer";
      state.page="students";
      state.filter=btn.getAttribute("data-trainer-risk-chip")||"";
      persistNavState();
      state.studentId=null;
      render();
    });
  });

  var analyticsCourse=document.getElementById("v63-course-filter");
  analyticsCourse&&analyticsCourse.addEventListener("change",function(){
    state.analyticsCourse=analyticsCourse.value||"";
    render();
  });
  document.querySelectorAll("[data-v63-refresh]").forEach(function(btn){
    btn.addEventListener("click",function(){render();});
  });

  var trainerSearch=document.getElementById("trainer-search");
  var trainerRisk=document.getElementById("trainer-risk");
  var trainerGroup=document.getElementById("trainer-group");

  function applyStudentDomFilters(){
    var q=(trainerSearch&&trainerSearch.value||"").trim().toLowerCase();
    var risk=(trainerRisk&&trainerRisk.value||"").trim();
    var group=(trainerGroup&&trainerGroup.value||"").trim();
    document.querySelectorAll(".trainer-table tbody tr").forEach(function(row){
      var text=(row.innerText||"").toLowerCase();
      var okQ=!q||text.indexOf(q)>=0;
      var okRisk=!risk||text.indexOf(risk.toLowerCase())>=0;
      var okGroup=!group||text.indexOf(group)>=0;
      row.style.display=okQ&&okRisk&&okGroup?"":"none";
    });
  }
  trainerSearch&&trainerSearch.addEventListener("input",applyStudentDomFilters);
  trainerRisk&&trainerRisk.addEventListener("change",function(){
    if(trainerRisk.value){state.filter=trainerRisk.value;} else {state.filter="";}
    applyStudentDomFilters();
  });
  trainerGroup&&trainerGroup.addEventListener("change",function(){ state.group=trainerGroup.value||""; applyStudentDomFilters(); });

  document.querySelectorAll("[data-360-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./student360-v70.js?v=498");
        var result=m.handleStudent360Action(btn);
        if(result&&result.rerender) await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error)); bind();
      }
    });
  });

  document.querySelectorAll("[data-intervention-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./intervention-v31.js?v=498");
        var result=m.handleInterventionAction(btn);
        if(result&&result.studentId){
          state.role="trainer";
          state.page="student360";
          state.studentId=result.studentId;
          state.filter="";
        }
        if(result&&result.rerender) await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error)); bind();
      }
    });
  });

  document.querySelectorAll("[data-intervention-filter]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./intervention-v31.js?v=498");
        m.setInterventionFilter(btn.getAttribute("data-intervention-filter")||"open");
        await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error)); bind();
      }
    });
  });

  var qbankSearch=document.getElementById("qbank-search");
  var qbankTopic=document.getElementById("qbank-topic");
  var qbankDifficulty=document.getElementById("qbank-difficulty");
  var qbankStatus=document.getElementById("qbank-status");
  function applyQbankDomFilters(){
    var q=(qbankSearch&&qbankSearch.value||"").trim().toLowerCase();
    var topic=(qbankTopic&&qbankTopic.value||"").trim();
    var diff=(qbankDifficulty&&qbankDifficulty.value||"").trim();
    var status=(qbankStatus&&qbankStatus.value||"").trim();
    document.querySelectorAll("[data-qbank-row]").forEach(function(row){
      var text=(row.getAttribute("data-qbank-text")||"").toLowerCase();
      var okQ=!q||text.indexOf(q)>=0;
      var okTopic=!topic||row.getAttribute("data-qbank-topic")===topic;
      var okDiff=!diff||row.getAttribute("data-qbank-diff")===diff;
      var button=row.querySelector('[data-q-action="toggle"]');
      var isActive=button && button.textContent.indexOf("تعطيل")>=0;
      var okStatus=!status||(status==="active"?isActive:!isActive);
      row.style.display=okQ&&okTopic&&okDiff&&okStatus?"":"none";
    });
  }
  qbankSearch&&qbankSearch.addEventListener("input",function(){
    import("./question-bank-v32.js?v=498").then(function(m){m.updateFilter("search",qbankSearch.value);});
    applyQbankDomFilters();
  });
  qbankTopic&&qbankTopic.addEventListener("change",async function(){
    try{var m=await import("./question-bank-v32.js?v=498");m.updateFilter("topic",qbankTopic.value);await render();}catch(error){document.getElementById("app").innerHTML=shell(errorView(error));bind();}
  });
  qbankDifficulty&&qbankDifficulty.addEventListener("change",async function(){
    try{var m=await import("./question-bank-v32.js?v=498");m.updateFilter("difficulty",qbankDifficulty.value);await render();}catch(error){document.getElementById("app").innerHTML=shell(errorView(error));bind();}
  });
  qbankStatus&&qbankStatus.addEventListener("change",async function(){
    try{var m=await import("./question-bank-v32.js?v=498");m.updateFilter("status",qbankStatus.value);await render();}catch(error){document.getElementById("app").innerHTML=shell(errorView(error));bind();}
  });
  document.querySelectorAll("[data-q-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./question-bank-v32.js?v=498");
        var result=m.handleQuestionBankAction(btn);
        if(result&&result.export){
          var fmt=result.export;
          var mime=fmt==="xml"?"application/xml;charset=utf-8":fmt==="aiken"?"text/plain;charset=utf-8":"application/json;charset=utf-8";
          var ext=fmt==="xml"?"xml":fmt==="aiken"?"aiken":"json";
          var blob=new Blob([m.getExportData(fmt)],{type:mime});
          var url=URL.createObjectURL(blob);
          var a=document.createElement("a");
          a.href=url;
          a.download="ipv4-academy-question-bank-v3.24."+ext;
          document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
          return;
        }
        if(result&&result.openImport){
          var format=result.openImport;
          var input=document.getElementById("qbank-import-"+format+"-file");
          input?.click();
          return;
        }
        if(result&&result.message){window.alert(result.message);}
        try{
          var sb=await import("./supabase-v30.js?v=498");
          if(typeof sb.syncLocalQuestionsToSupabase==="function") await sb.syncLocalQuestionsToSupabase(m.getQuestionBank());
        }catch(syncError){window.__IPV4_SUPABASE_LAST_ERROR__=String(syncError&&syncError.message||syncError)}
        if(result&&result.rerender) await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error));bind();
      }
    });
  });

  document.querySelectorAll("#qbank-import-json-file,#qbank-import-xml-file,#qbank-import-aiken-file").forEach(function(qbankImport){
    qbankImport.addEventListener("change",function(event){
      var file=event.target.files&&event.target.files[0];
      if(!file)return;
      var reader=new FileReader();
      reader.onload=async function(){
        try{
          var m=await import("./question-bank-v32.js?v=498");
          var format=event.target.id.indexOf("xml")>=0?"xml":event.target.id.indexOf("aiken")>=0?"aiken":"json";
          var result=m.importQuestionBankText(String(reader.result||""),format);
          if(result&&result.ok&&result.rows){
            await render();
          }else{
            window.alert(result.message||"تعذر معالجة الملف.");
          }
        }catch(error){
          document.getElementById("app").innerHTML=shell(errorView(error));bind();
        }
        event.target.value="";
      };
      reader.readAsText(file,"utf-8");
    });
  });

  var examSettings=document.getElementById("trainer-exam-settings-form");
  if(examSettings) examSettings.addEventListener("submit",async function(event){
    event.preventDefault();
    try{
      var m=await import("./exam-v23.js?v=498");
      var cfg=m.saveTrainerExamConfigFromForm(event.currentTarget);
      try{var sb=await import("./supabase-v30.js?v=498");await sb.syncTrainerExamToSupabase(cfg);}catch(syncError){window.__IPV4_SUPABASE_LAST_ERROR__=String(syncError&&syncError.message||syncError)}
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  var examQuestionSettings=document.getElementById("trainer-exam-settings-form-questions");
  if(examQuestionSettings) examQuestionSettings.addEventListener("submit",async function(event){
    event.preventDefault();
    try{
      var m=await import("./exam-v23.js?v=498");
      var cfg=m.saveTrainerExamBuilderFromForm(event.currentTarget);
      var msg=document.getElementById("exam-question-msg");
      if(msg) msg.textContent="تم بناء الاختبار بـ "+cfg.questionIds.length+" سؤال.";
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  document.getElementById("publish-trainer-exam")?.addEventListener("click",async function(){
    try{
      var m=await import("./exam-v23.js?v=498");
      if(examQuestionSettings) m.saveTrainerExamBuilderFromForm(examQuestionSettings);
      var publishedCfg=m.publishTrainerExam(true);
      try{var sb=await import("./supabase-v30.js?v=498");await sb.syncTrainerExamToSupabase(publishedCfg);}catch(syncError){window.__IPV4_SUPABASE_LAST_ERROR__=String(syncError&&syncError.message||syncError)}
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  document.getElementById("unpublish-trainer-exam")?.addEventListener("click",async function(){
    try{
      var m=await import("./exam-v23.js?v=498");
      var unpublishedCfg=m.publishTrainerExam(false);
      try{var sb=await import("./supabase-v30.js?v=498");await sb.syncTrainerExamToSupabase(unpublishedCfg);}catch(syncError){window.__IPV4_SUPABASE_LAST_ERROR__=String(syncError&&syncError.message||syncError)}
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  document.getElementById("reset-trainer-exam")?.addEventListener("click",async function(){
    try{
      var m=await import("./exam-v23.js?v=498");
      m.resetTrainerExamConfig();
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  document.querySelectorAll("#start-exam,#recover-exam,#exam-prev,#exam-next,#submit-exam,#exam-review-back,#exam-review-submit,[data-exam-answer],[data-exam-jump],[data-exam-review-jump],[data-exam-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./exam-v23.js?v=498");
        var result;
        if(btn.id==="start-exam") result=await m.handleExamAction(btn);
        else if(btn.id==="exam-prev") result=m.handleExamAction(btn);
        else if(btn.id==="exam-next") result=m.handleExamAction(btn);
        else if(btn.id==="submit-exam") result=m.handleExamAction(btn);
        else result=m.handleExamAction(btn);
        if(result&&result.blocked){
          if(result.message) window.alert(result.message);
          return;
        }
        if(result&&result.openReview){
          await render();
          return;
        }
        if(result&&result.review){
          if(state.role==="student"){state.page="review";normalizeRolePage();await render();}return;
        }
        if(result&&result.rerender) await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error)); bind();
      }
    });
  });

  document.querySelectorAll("[data-exam-result-filter]").forEach(function(btn){
    btn.addEventListener("click",function(){
      var filter=btn.getAttribute("data-exam-result-filter")||"all";
      document.querySelectorAll("[data-exam-result-filter]").forEach(function(x){x.classList.toggle("active",x===btn);});
      document.querySelectorAll(".exam-results-table tbody tr").forEach(function(row){
        var ok=filter==="all"||row.getAttribute("data-exam-result-status")===filter;
        row.style.display=ok?"":"none";
      });
    });
  });


  import("./results-center-v76.js?v=498").then(function(m){m.bindResultsV76();}).catch(function(){});
  document.querySelectorAll("#v76-student-search,#v76-results-search").forEach(function(el){
    el.addEventListener("input",function(){
      import("./results-center-v76.js?v=498").then(function(m){m.bindResultsV76();}).catch(function(){});
    });
  });

  document.querySelectorAll("[data-results-export]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      var m=await import("./results-center-v76.js?v=498");
      var blob=new Blob(["\uFEFF"+m.getResultsCsvV76()],{type:"text/csv;charset=utf-8"});
      var url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url;a.download="ipv4-academy-results-v3.76.csv";
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    });
  });

  document.querySelectorAll("[data-results-detail],[data-results-detail-close]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./results-center-v76.js?v=498");
        var result=await m.handleResultsV76Action(btn);
        if(result&&result.rerender) await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error));bind();
      }
    });
  });

  document.querySelectorAll("[data-results-refresh]").forEach(function(btn){
    btn.addEventListener("click",function(){render();});
  });
  window.addEventListener("ipv4-e2e-refresh",function(){render();});
  if((state.role==="trainer" || state.role==="admin") && state.page==="examcheck") import("./exam-e2e-v77.js?v=498").then(function(m){m.bindExamE2E();}).catch(function(){});

  document.querySelectorAll("#qintel-status-filter,#qintel-topic-filter,#qintel-difficulty-filter").forEach(function(el){
    el.addEventListener("change",async function(){var m=await import("./question-intelligence-v35.js?v=498");m.filterQuestionIntelligence();});
  });
  document.querySelectorAll("[data-qintel-export]").forEach(function(btn){
    btn.addEventListener("click",async function(){var m=await import("./question-intelligence-v35.js?v=498");var blob=new Blob(["\\uFEFF"+m.getQuestionIntelligenceJson()],{type:"application/json;charset=utf-8"});var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ipv4-academy-question-intelligence-v3.35.json";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);});
  });

  document.querySelectorAll("[data-course-action],[data-course-editor-action],[data-lesson-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./course-manager-v36.js?v=498");
        var result;
        if(btn.hasAttribute("data-course-action")) result=m.handleCourseAction(btn);
        else if(btn.hasAttribute("data-course-editor-action")) result=m.handleCourseEditorAction(btn);
        else result=m.handleLessonAction(btn);
        if(result && result.rerender) await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error)); bind();
      }
    });
  });

  document.querySelectorAll("[data-course-learning-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./course-learning-v38.js?v=498");
        var result=m.handleLearningAction(btn);
        if(result && result.page) state.page=result.page;
        if(result && result.rerender) await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error)); bind();
      }
    });
  });

  var assessment=document.getElementById("lesson-assessment-form");
  if(assessment) assessment.addEventListener("submit",async function(event){
    event.preventDefault();
    try{
      var m=await import("./course-learning-v38.js?v=498");
      var result=m.submitLessonAssessment(event.currentTarget);
      if(result && result.rerender) await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });
}

window.addEventListener("unhandledrejection",function(event){
  var app=document.getElementById("app");
  if(app && !app.innerHTML.trim()) app.innerHTML=shell(errorView(event.reason||"خطأ غير معروف"));
});

window.addEventListener("error",function(event){
  var app=document.getElementById("app");
  if(app && !app.innerHTML.trim()) app.innerHTML=shell(errorView(event.error||event.message||"خطأ غير معروف"));
});

render().catch(function(error){
  var app=document.getElementById("app");
  if(app) {
    app.innerHTML='<div style="padding:30px;direction:rtl;font-family:Tahoma">'+
      '<div class="card"><h2>تعذر تشغيل المنصة</h2>'+
      '<p>تم إيقاف الشاشة البيضاء. ظهر سبب الخطأ أدناه.</p>'+
      '<pre style="direction:ltr;white-space:pre-wrap">'+esc(error&&error.message?error.message:error)+'</pre>'+
      '</div></div>';
  }
});