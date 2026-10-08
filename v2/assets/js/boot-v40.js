const state={role:"student",page:"home",filter:"",group:"",studentId:null};

const studentNav=[
  ["home","الرئيسية"],["level","ابدأ من مستواي"],["course","المقرر"],["practice","التدريب"],
  ["exams","الاختبارات"],["review","المراجعة الذكية"],["labs","المختبرات"],["progress","التقدم"],
  ["notifications","الإشعارات"],["achievements","الإنجازات"],["certificate","الشهادة"]
];

const trainerNav=[
  ["tdash","الرئيسية"],["students","المتدربون"],["groups","المجموعات"],["courses","المقررات"],
  ["questions","بنك الأسئلة"],["exams","الاختبارات"],["results","مركز النتائج"],["qintel","ذكاء السؤال"],["labs","المختبرات"],["analytics","التحليلات"],
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
  const items=state.role==="student"?studentNav:trainerNav;
  return '<aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • V3.48 Stable</small></div></div>'+
    '<nav class="nav">'+items.map(function(item){
      return '<button class="'+(state.page===item[0]?"active":"")+'" data-page="'+item[0]+'">'+item[1]+'</button>';
    }).join("")+'</nav>'+
    '<div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div></aside>';
}

function topbar(){
  return '<header class="topbar"><div class="topbar-title">'+(state.role==="student"?"مساحة المتدرب":"مركز المدرب")+
    ' <span class="badge" style="margin-right:8px">نسخة مستقرة</span></div>'+
    '<div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض '+
    (state.role==="student"?"المدرب":"المتدرب")+
    '</button><button class="btn btn-ghost" id="hard-refresh">تحديث</button>'+
    '<div class="avatar">'+(state.role==="student"?"م":"د")+'</div></div></header>';
}

function home(){
  return '<section class="student-hero home-hero"><div class="student-hero-copy">'+
    '<span class="eyebrow">IPv4 Academy • منصة التدريب الشبكي</span>'+
    '<h1>أهلًا بك في IPv4 Academy 👋</h1>'+
    '<p>منصة تدريب عملية تجمع التعلم والتدريب والاختبارات والتحليل في مسار واحد.</p>'+
    '<div class="hero-actions"><button class="btn btn-white" data-page="review">✦ المراجعة الذكية</button>'+
    '<button class="btn btn-outline-white" data-page="level">🎯 اختبار تحديد المستوى</button></div></div>'+
    '<div class="student-hero-side"><div class="hero-mini-label">الإتقان العام</div><div class="hero-level">65%</div>'+
    '<div class="progress hero-progress"><span style="width:65%"></span></div>'+
    '<div class="hero-progress-row"><span>IPv4 & Subnetting</span><span>320 XP</span></div></div></section>'+
    '<div class="home-utility-grid"><div class="card home-utility-card notification-utility"><div class="home-utility-icon">🔔</div>'+
    '<div><span class="eyebrow purple">تنبيهات</span><h3>مركز الإشعارات</h3><p class="muted">تابع نتائجك وخطواتك القادمة.</p></div>'+
    '<button class="btn btn-purple" data-page="notifications">فتح الإشعارات</button></div>'+
    '<div class="card home-utility-card"><div class="home-utility-icon green">✓</div>'+
    '<div><span class="eyebrow green">الخطوة التالية</span><h3>راجع VLSM</h3><p class="muted">الموضوع يحتاج تدريبًا إضافيًا.</p></div>'+
    '<button class="btn btn-green" data-page="review">ابدأ الآن</button></div></div>'+
    '<div class="student-grid-4 home-kpis">'+
    card("تقدم المقرر","68%","+6% هذا الأسبوع")+
    card("الإتقان العام","65%","Smart Engine")+
    card("سلسلة التعلم","4 أيام","استمر غدًا")+
    card("نقاط الخبرة","320 XP","الهدف التالي 500")+
    '</div>'+
    '<div class="section-title"><h3>خريطة الإتقان</h3><span class="badge purple">Smart Learning</span></div>'+
    '<div class="card mastery-grid">'+
    ["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"].map(function(x,i){
      var v=[84,72,58,46,62,42][i];
      var cls=v<50?"red":(v<70?"orange":"green");
      var txt=v<50?"يحتاج تدخل":(v<70?"يحتاج تدريب":"جيد");
      return '<div class="mastery-item"><div><strong>'+x+'</strong><span class="badge '+cls+'">'+v+'%</span></div>'+
        '<div class="progress"><span style="width:'+v+'%"></span></div><small>'+txt+'</small></div>';
    }).join("")+'</div>'+
    '<div class="section-title"><h3>المسار التدريبي</h3></div>'+
    '<div class="card"><div class="learning-path">'+
    '<div class="path-item completed"><div class="path-dot">✓</div><div class="path-content"><div class="path-top"><strong>أساسيات IPv4</strong><span class="badge green">مكتمل</span></div><div class="muted">فهم العناوين وأساسيات الشبكات.</div><div class="progress"><span style="width:100%"></span></div></div></div>'+
    '<div class="path-item current"><div class="path-dot">2</div><div class="path-content"><div class="path-top"><strong>Binary وPrefix</strong><span class="badge orange">أنت هنا</span></div><div class="muted">اربط التحويل الثنائي بالـPrefix.</div><div class="progress"><span style="width:72%"></span></div></div></div>'+
    '<div class="path-item"><div class="path-dot">3</div><div class="path-content"><div class="path-top"><strong>Subnetting</strong><span class="badge">قادم</span></div><div class="muted">Network وFirst Host وLast Host وBroadcast.</div><div class="progress"><span style="width:20%"></span></div></div></div>'+
    '</div></div>';
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
  if(state.role==="student" && state.page==="home") return home();

  try{
    if(state.role==="student" && (state.page==="course" || state.page==="lesson-content" || state.page==="lesson-assessment")){
      var learning=await import("./course-learning-v38.js?v=448");
      if(state.page==="course") return learning.learnerCourse();
      if(state.page==="lesson-assessment") return learning.assessmentView();
      return learning.lessonPage();
    }

    if(state.page==="notifications"){
      var notifications=await import("./notifications-v30.js?v=448");
      return notifications.notificationsPage(state.role);
    }

    if(state.role==="trainer" && state.page==="interventions"){
      var interventions=await import("./intervention-v31.js?v=448");
      return interventions.interventionCenterView();
    }

    if(state.role==="trainer" && ["students","groups","courses","questions","exams","results","labs","analytics","tdash","student360","audit","qintel"].indexOf(state.page)>=0){
      if(state.page==="tdash"){var finalDash=await import("./trainer-dashboard-v36.js?v=448");return finalDash.trainerDashboardView();}
      var trainer=await import("./trainer-v22.js?v=448");
      if(state.page==="results"){var results=await import("./results-center-v34.js?v=448");return results.resultsCenterView();}
      if(state.page==="qintel"){var qi=await import("./question-intelligence-v35.js?v=448");return qi.questionIntelligenceView();}
      return trainer.getTrainerView(state.page,state.filter||"",state.studentId,state.group||"");
    }

    if(state.role==="student" && (state.page==="review" || state.page==="review-session")){
      var smartReview=await import("./smart-review-v38.js?v=448");
      return smartReview.smartReviewPage();
    }

    if(state.role==="student"){
      if(state.page==="labs"){var labCenter=await import("./lab-center-v37.js?v=448");return labCenter.labCenterView();}
      var student=await import("./student.js?v=448");
      student.studentState.page=state.page;
      return student.studentPage();
    }

    return placeholder("مركز المدرب","اختر قسمًا من القائمة.");
  }catch(error){
    return errorView(error);
  }
}


async function syncSupabaseRuntime(){
  try{
    var sb=await import("./supabase-v30.js?v=448");
    var result=await sb.syncAllFromSupabase();
    window.__IPV4_SUPABASE_STATUS__=result.status||window.__IPV4_SUPABASE_STATUS__||{configured:false,authenticated:false};
    return result;
  }catch(error){
    window.__IPV4_SUPABASE_STATUS__={configured:false,authenticated:false,message:"تعذر مزامنة Supabase",error:String(error&&error.message||error)};
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
  var content=await loadPage();
  app.innerHTML=shell(content||placeholder("صفحة فارغة","لا يوجد محتوى لهذه الشاشة."));
  bind();
}

window.addEventListener("ipv4-course-switch",function(){
  render().catch(function(error){
    const app=document.getElementById("app");
    if(app){app.innerHTML=shell(errorView(error));bind();}
  });
});

function bind(){
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
        var m=await import("./smart-review-v38.js?v=448");
        var result=m.handleSmartReviewAction(btn);
        state.role="student";
        state.page="review";
        if(result&&result.message) window.alert(result.message);
        await render();
      }catch(error){
        document.getElementById("app").innerHTML=shell(errorView(error));bind();
      }
    });
  });

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
      render().catch(function(error){
        document.getElementById("app").innerHTML=shell(errorView(error));
        bind();
      });
    });
  });

  var sw=document.getElementById("switch-role");
  if(sw) sw.addEventListener("click",function(){
    state.role=state.role==="student"?"trainer":"student";
    state.page=state.role==="student"?"home":"tdash";
    state.filter="";
    state.group="";
    state.studentId=null;
    render();
  });

  var refresh=document.getElementById("hard-refresh");
  if(refresh) refresh.addEventListener("click",function(){ location.reload(); });

  document.querySelectorAll("[data-trainer-page]").forEach(function(btn){
    btn.addEventListener("click",function(){
      state.role="trainer";
      state.page=btn.getAttribute("data-trainer-page")||"tdash";
      state.filter=btn.getAttribute("data-risk")||"";
      state.group=btn.getAttribute("data-group")||"";
      render();
    });
  });

  document.querySelectorAll("[data-student-id]").forEach(function(btn){
    btn.addEventListener("click",function(){
      state.role="trainer";
      state.page="student360";
      state.studentId=Number(btn.getAttribute("data-student-id")||0)||null;
      state.filter="";
      render();
    });
  });

  document.querySelectorAll("[data-group-filter]").forEach(function(btn){
    btn.addEventListener("click",function(){
      state.role="trainer";
      state.page="groups";
      state.group=btn.getAttribute("data-group-filter")||"1";
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
      state.studentId=null;
      render();
    });
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
        var m=await import("./student360-v29.js?v=448");
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
        var m=await import("./intervention-v31.js?v=448");
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
        var m=await import("./intervention-v31.js?v=448");
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
    import("./question-bank-v32.js?v=448").then(function(m){m.updateFilter("search",qbankSearch.value);});
    applyQbankDomFilters();
  });
  qbankTopic&&qbankTopic.addEventListener("change",async function(){
    try{var m=await import("./question-bank-v32.js?v=448");m.updateFilter("topic",qbankTopic.value);await render();}catch(error){document.getElementById("app").innerHTML=shell(errorView(error));bind();}
  });
  qbankDifficulty&&qbankDifficulty.addEventListener("change",async function(){
    try{var m=await import("./question-bank-v32.js?v=448");m.updateFilter("difficulty",qbankDifficulty.value);await render();}catch(error){document.getElementById("app").innerHTML=shell(errorView(error));bind();}
  });
  qbankStatus&&qbankStatus.addEventListener("change",async function(){
    try{var m=await import("./question-bank-v32.js?v=448");m.updateFilter("status",qbankStatus.value);await render();}catch(error){document.getElementById("app").innerHTML=shell(errorView(error));bind();}
  });
  document.querySelectorAll("[data-q-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./question-bank-v32.js?v=448");
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
          var sb=await import("./supabase-v30.js?v=448");
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
          var m=await import("./question-bank-v32.js?v=448");
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
      var m=await import("./exam-v23.js?v=448");
      var cfg=m.saveTrainerExamConfigFromForm(event.currentTarget);
      try{var sb=await import("./supabase-v30.js?v=448");await sb.syncTrainerExamToSupabase(cfg);}catch(syncError){window.__IPV4_SUPABASE_LAST_ERROR__=String(syncError&&syncError.message||syncError)}
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  var examQuestionSettings=document.getElementById("trainer-exam-settings-form-questions");
  if(examQuestionSettings) examQuestionSettings.addEventListener("submit",async function(event){
    event.preventDefault();
    try{
      var m=await import("./exam-v23.js?v=448");
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
      var m=await import("./exam-v23.js?v=448");
      if(examQuestionSettings) m.saveTrainerExamBuilderFromForm(examQuestionSettings);
      var publishedCfg=m.publishTrainerExam(true);
      try{var sb=await import("./supabase-v30.js?v=448");await sb.syncTrainerExamToSupabase(publishedCfg);}catch(syncError){window.__IPV4_SUPABASE_LAST_ERROR__=String(syncError&&syncError.message||syncError)}
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  document.getElementById("unpublish-trainer-exam")?.addEventListener("click",async function(){
    try{
      var m=await import("./exam-v23.js?v=448");
      var unpublishedCfg=m.publishTrainerExam(false);
      try{var sb=await import("./supabase-v30.js?v=448");await sb.syncTrainerExamToSupabase(unpublishedCfg);}catch(syncError){window.__IPV4_SUPABASE_LAST_ERROR__=String(syncError&&syncError.message||syncError)}
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  document.getElementById("reset-trainer-exam")?.addEventListener("click",async function(){
    try{
      var m=await import("./exam-v23.js?v=448");
      m.resetTrainerExamConfig();
      await render();
    }catch(error){
      document.getElementById("app").innerHTML=shell(errorView(error)); bind();
    }
  });

  document.querySelectorAll("#start-exam,#exam-prev,#exam-next,#submit-exam,#exam-review-back,#exam-review-submit,[data-exam-answer],[data-exam-jump],[data-exam-review-jump],[data-exam-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./exam-v23.js?v=448");
        var result;
        if(btn.id==="start-exam") result=m.handleExamAction(btn);
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
          state.role="student";state.page="review";await render();return;
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


  document.querySelectorAll("#results-search,#results-exam-filter,#results-status-filter,#results-group-filter").forEach(function(el){
    el.addEventListener("input",async function(){
      var m=await import("./results-center-v34.js?v=448");
      m.filterResultsDom();
    });
    el.addEventListener("change",async function(){
      var m=await import("./results-center-v34.js?v=448");
      m.filterResultsDom();
    });
  });
  document.querySelectorAll("[data-results-export]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      var m=await import("./results-center-v34.js?v=448");
      var blob=new Blob(["\uFEFF"+m.getResultsCsv()],{type:"text/csv;charset=utf-8"});
      var url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url;a.download="ipv4-academy-results-v3.34.csv";
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    });
  });

  document.querySelectorAll("#qintel-status-filter,#qintel-topic-filter,#qintel-difficulty-filter").forEach(function(el){
    el.addEventListener("change",async function(){var m=await import("./question-intelligence-v35.js?v=448");m.filterQuestionIntelligence();});
  });
  document.querySelectorAll("[data-qintel-export]").forEach(function(btn){
    btn.addEventListener("click",async function(){var m=await import("./question-intelligence-v35.js?v=448");var blob=new Blob(["\\uFEFF"+m.getQuestionIntelligenceJson()],{type:"application/json;charset=utf-8"});var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ipv4-academy-question-intelligence-v3.35.json";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);});
  });

  document.querySelectorAll("[data-course-action],[data-course-editor-action],[data-lesson-action]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      try{
        var m=await import("./course-manager-v36.js?v=412");
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
        var m=await import("./course-learning-v38.js?v=412");
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
      var m=await import("./course-learning-v38.js?v=412");
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