const state={role:"student",page:"home"};

const studentNav=[
  ["home","الرئيسية"],["level","ابدأ من مستواي"],["course","المقرر"],["practice","التدريب"],
  ["exams","الاختبارات"],["review","المراجعة الذكية"],["labs","المختبرات"],["progress","التقدم"],
  ["notifications","الإشعارات"],["achievements","الإنجازات"],["certificate","الشهادة"]
];

const trainerNav=[
  ["tdash","الرئيسية"],["students","المتدربون"],["groups","المجموعات"],["courses","المقررات"],
  ["questions","بنك الأسئلة"],["exams","الاختبارات"],["labs","المختبرات"],["analytics","التحليلات"],
  ["interventions","مركز التدخل"],["notifications","الإشعارات"]
];

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function card(title,value,sub=""){
  return '<div class="card student-stat"><div class="muted">'+title+'</div><div class="kpi-value">'+value+'</div><div class="muted">'+sub+'</div></div>';
}

function sidebar(){
  const items=state.role==="student"?studentNav:trainerNav;
  return '<aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • V3.2</small></div></div>'+
    '<nav class="nav">'+items.map(([id,label])=>'<button class="'+(state.page===id?"active":"")+'" data-page="'+id+'">'+label+'</button>').join("")+'</nav>'+
    '<div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div></aside>';
}

function topbar(){
  return '<header class="topbar"><div class="topbar-title">'+(state.role==="student"?"مساحة المتدرب":"مركز المدرب")+' <span class="badge" style="margin-right:8px">وضع تجريبي</span></div>'+
    '<div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض '+(state.role==="student"?"المدرب":"المتدرب")+'</button><button class="btn btn-ghost" id="hard-refresh">تحديث</button><div class="avatar">'+(state.role==="student"?"م":"د")+'</div></div></header>';
}

function studentHome(){
  return '<section class="student-hero home-hero"><div class="student-hero-copy"><span class="eyebrow">رحلتك التعليمية • V3.2</span><h1>أهلًا بك في IPv4 Academy 👋</h1><p>منصة تدريب عملية تجمع التعلم والتدريب والاختبارات والتحليل في مسار واحد.</p><div class="hero-actions"><button class="btn btn-white" data-page="review">✦ المراجعة الذكية</button><button class="btn btn-outline-white" data-page="level">🎯 اختبار تحديد المستوى</button></div></div><div class="student-hero-side"><div class="hero-mini-label">الإتقان العام</div><div class="hero-level">65%</div><div class="progress hero-progress"><span style="width:65%"></span></div><div class="hero-progress-row"><span>IPv4 & Subnetting</span><span>320 XP</span></div></div></section>'+
    '<div class="home-utility-grid"><div class="card home-utility-card notification-utility"><div class="home-utility-icon">🔔</div><div><span class="eyebrow purple">V3.2</span><h3>مركز الإشعارات الذكي</h3><p class="muted">تنبيهات مرتبطة بأدائك والخطوة التالية.</p></div><button class="btn btn-purple" data-page="notifications">فتح الإشعارات</button></div><div class="card home-utility-card"><div class="home-utility-icon green">✓</div><div><span class="eyebrow green">الخطوة التالية</span><h3>راجع VLSM</h3><p class="muted">الموضوع يحتاج تدريبًا إضافيًا قبل الانتقال.</p></div><button class="btn btn-green" data-page="review">ابدأ الآن</button></div></div>'+
    '<div class="student-grid-4 home-kpis">'+card("تقدم المقرر","68%","+6% هذا الأسبوع")+card("الإتقان العام","65%","Smart Engine")+card("سلسلة التعلم","4 أيام","استمر غدًا")+card("نقاط الخبرة","320 XP","الهدف التالي 500")+'</div>'+
    '<div class="section-title"><h3>خريطة الإتقان</h3><span class="badge purple">Smart Learning</span></div>'+
    '<div class="card mastery-grid">'+["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"].map((x,i)=>{const v=[84,72,58,46,62,42][i];return '<div class="mastery-item"><div><strong>'+x+'</strong><span class="badge '+(v<50?"red":v<70?"orange":"green")+'">'+v+'%</span></div><div class="progress"><span style="width:'+v+'%"></span></div><small>'+ (v<50?"يحتاج تدخل":v<70?"يحتاج تدريب":"جيد") +'</small></div>'}).join("")+'</div>'+
    '<div class="section-title"><h3>المسار التدريبي</h3></div><div class="card"><div class="learning-path"><div class="path-item completed"><div class="path-dot">✓</div><div class="path-content"><div class="path-top"><strong>أساسيات IPv4</strong><span class="badge green">مكتمل</span></div><div class="muted">فهم العناوين وأساسيات الشبكات.</div><div class="progress"><span style="width:100%"></span></div></div></div><div class="path-item current"><div class="path-dot">2</div><div class="path-content"><div class="path-top"><strong>Binary وPrefix</strong><span class="badge orange">أنت هنا</span></div><div class="muted">اربط التحويل الثنائي بالـPrefix.</div><div class="progress"><span style="width:72%"></span></div></div></div><div class="path-item"><div class="path-dot">3</div><div class="path-content"><div class="path-top"><strong>Subnetting</strong><span class="badge">قادم</span></div><div class="muted">Network وFirst Host وLast Host وBroadcast.</div><div class="progress"><span style="width:20%"></span></div></div></div></div></div>';
}

function simplePage(title,eyebrow,desc,actions){
  return '<div class="page-intro"><span class="eyebrow blue">'+eyebrow+'</span><h2>'+title+'</h2><p>'+desc+'</p></div><div class="card"><div class="section-title"><h3>وضع V3.2</h3></div><p class="muted">هذه الشاشة تعمل الآن كواجهة مستقرة، ويمكن ربطها بالمكونات المتقدمة تدريجيًا.</p><div class="hero-actions" style="margin-top:15px">'+actions.map(x=>'<button class="btn '+(x[1]||"btn-primary")+'" data-page="'+x[0]+'">'+x[2]+'</button>').join("")+'</div></div>';
}

async function loadStudentPage(){
  const m=await import("./student.js?v=350");
  m.studentState.page=state.page;
  return m.studentPage();
}

async function loadAdvanced(page){
  try{
    if(page==="notifications"){
      const m=await import("./notifications-v30.js?v=340");
      return m.notificationsPage(state.role);
    }
    if(page==="interventions"){
      const m=await import("./intervention-v31.js?v=340");
      return m.interventionCenterView();
    }
    if(page==="student360"){
      const m=await import("./student360-v29.js?v=340");
      return m.student360View(4);
    }
    if(state.role==="trainer" && ["students","groups","courses","questions","exams","labs","analytics","tdash"].includes(page)){
      const m=await import("./trainer-v22.js?v=340");
      return m.getTrainerView(page);
    }
  }catch(error){
    return '<div class="card" style="border-right:4px solid var(--red)"><h3>تعذر تحميل هذه الشاشة</h3><p class="muted">تم تشغيل الصفحة الرئيسية بنجاح، لكن المكون المتقدم يحتاج إصلاحًا مستقلًا.</p><pre style="direction:ltr;white-space:pre-wrap">'+esc(error?.message||error)+'</pre></div>';
  }
  return null;
}

async function render(){
  const app=document.getElementById("app");
  let view;
  if(state.role==="student" && state.page==="home")view=studentHome();
  else if(state.page==="notifications")view=await loadAdvanced("notifications");
  else if(state.role==="trainer" && state.page==="interventions")view=await loadAdvanced("interventions");
  else if(state.role==="trainer")view=await loadAdvanced(state.page);
  else if(state.role==="student")view=await loadStudentPage();
  else view=simplePage("الشاشة التدريبية","V3.3","اختر قسمًا من القائمة للمتابعة.",[["tdash","btn-primary","الرئيسية"]]);

  app.innerHTML='<div class="app-shell">'+sidebar()+'<main class="main">'+topbar()+'<div class="container">'+(view||"")+'</div></main></div>';
  bind();
}

function bind(){
  document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",async()=>{state.page=btn.dataset.page;await render()}));
  document.getElementById("switch-role")?.addEventListener("click",async()=>{state.role=state.role==="student"?"trainer":"student";state.page=state.role==="student"?"home":"tdash";await render()});
  document.getElementById("hard-refresh")?.addEventListener("click",()=>location.reload());
}

window.addEventListener("error",event=>{
  const app=document.getElementById("app");
  if(!app?.innerHTML.trim()){
    app.innerHTML='<div style="padding:30px;direction:rtl"><div class="card"><h2>حدث خطأ أثناء التشغيل</h2><pre style="direction:ltr;white-space:pre-wrap">'+esc(event.error?.message||event.message||"خطأ غير معروف")+'</pre></div></div>';
  }
});

render().catch(error=>{
  document.getElementById("app").innerHTML='<div style="padding:30px;direction:rtl"><div class="card"><h2>تعذر تشغيل المنصة</h2><p>تم منع الشاشة البيضاء وسيظهر سبب الخطأ هنا.</p><pre style="direction:ltr;white-space:pre-wrap">'+esc(error?.message||error)+'</pre></div></div>';
});
