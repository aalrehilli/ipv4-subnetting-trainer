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
  return '<aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • V3.7</small></div></div>'+
    '<nav class="nav">'+items.map(([id,label])=>'<button class="'+(state.page===id?"active":"")+'" data-page="'+id+'">'+label+'</button>').join("")+'</nav>'+
    '<div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div></aside>';
}

function topbar(){
  return '<header class="topbar"><div class="topbar-title">'+(state.role==="student"?"مساحة المتدرب":"مركز المدرب")+' <span class="badge" style="margin-right:8px">وضع تجريبي</span></div>'+
    '<div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض '+(state.role==="student"?"المدرب":"المتدرب")+'</button><button class="btn btn-ghost" id="hard-refresh">تحديث</button><div class="avatar">'+(state.role==="student"?"م":"د")+'</div></div></header>';
}

function studentHome(){
  return '<section class="student-hero home-hero"><div class="student-hero-copy"><span class="eyebrow">رحلتك التعليمية • V3.7</span><h1>أهلًا بك في IPv4 Academy 👋</h1><p>منصة تدريب عملية تجمع التعلم والتدريب والاختبارات والتحليل في مسار واحد.</p><div class="hero-actions"><button class="btn btn-white" data-page="review">✦ المراجعة الذكية</button><button class="btn btn-outline-white" data-page="level">🎯 اختبار تحديد المستوى</button></div></div><div class="student-hero-side"><div class="hero-mini-label">الإتقان العام</div><div class="hero-level">65%</div><div class="progress hero-progress"><span style="width:65%"></span></div><div class="hero-progress-row"><span>IPv4 & Subnetting</span><span>320 XP</span></div></div></section>'+
    '<div class="home-utility-grid"><div class="card home-utility-card notification-utility"><div class="home-utility-icon">🔔</div><div><span class="eyebrow purple">V3.7</span><h3>مركز الإشعارات الذكي</h3><p class="muted">تنبيهات مرتبطة بأدائك والخطوة التالية.</p></div><button class="btn btn-purple" data-page="notifications">فتح الإشعارات</button></div><div class="card home-utility-card"><div class="home-utility-icon green">✓</div><div><span class="eyebrow green">الخطوة التالية</span><h3>راجع VLSM</h3><p class="muted">الموضوع يحتاج تدريبًا إضافيًا قبل الانتقال.</p></div><button class="btn btn-green" data-page="review">ابدأ الآن</button></div></div>'+
    '<div class="student-grid-4 home-kpis">'+card("تقدم المقرر","68%","+6% هذا الأسبوع")+card("الإتقان العام","65%","Smart Engine")+card("سلسلة التعلم","4 أيام","استمر غدًا")+card("نقاط الخبرة","320 XP","الهدف التالي 500")+'</div>'+
    '<div class="section-title"><h3>خريطة الإتقان</h3><span class="badge purple">Smart Learning</span></div>'+
    '<div class="card mastery-grid">'+["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"].map((x,i)=>{const v=[84,72,58,46,62,42][i];return '<div class="mastery-item"><div><strong>'+x+'</strong><span class="badge '+(v<50?"red":v<70?"orange":"green")+'">'+v+'%</span></div><div class="progress"><span style="width:'+v+'%"></span></div><small>'+ (v<50?"يحتاج تدخل":v<70?"يحتاج تدريب":"جيد") +'</small></div>'}).join("")+'</div>'+
    '<div class="section-title"><h3>المسار التدريبي</h3></div><div class="card"><div class="learning-path"><div class="path-item completed"><div class="path-dot">✓</div><div class="path-content"><div class="path-top"><strong>أساسيات IPv4</strong><span class="badge green">مكتمل</span></div><div class="muted">فهم العناوين وأساسيات الشبكات.</div><div class="progress"><span style="width:100%"></span></div></div></div><div class="path-item current"><div class="path-dot">2</div><div class="path-content"><div class="path-top"><strong>Binary وPrefix</strong><span class="badge orange">أنت هنا</span></div><div class="muted">اربط التحويل الثنائي بالـPrefix.</div><div class="progress"><span style="width:72%"></span></div></div></div><div class="path-item"><div class="path-dot">3</div><div class="path-content"><div class="path-top"><strong>Subnetting</strong><span class="badge">قادم</span></div><div class="muted">Network وFirst Host وLast Host وBroadcast.</div><div class="progress"><span style="width:20%"></span></div></div></div></div></div>';
}

function simplePage(title,eyebrow,desc,actions){
  return '<div class="page-intro"><span class="eyebrow blue">'+eyebrow+'</span><h2>'+title+'</h2><p>'+desc+'</p></div><div class="card"><div class="section-title"><h3>وضع V3.7</h3></div><p class="muted">هذه الشاشة تعمل الآن كواجهة مستقرة، ويمكن ربطها بالمكونات المتقدمة تدريجيًا.</p><div class="hero-actions" style="margin-top:15px">'+actions.map(x=>'<button class="btn '+(x[1]||"btn-primary")+'" data-page="'+x[0]+'">'+x[2]+'</button>').join("")+'</div></div>';
}

async function loadStudentPage(){
  if(state.page==="course"||state.page==="lesson-content"){
    const m=await import("./course-learning-v37.js?v=405");
    return state.page==="course"?m.courseLearningPage():m.lessonLearningPage();
  }
  const m=await import("./student.js?v=404");
  m.studentState.page=state.page;
  return m.studentPage();
}

async function loadAdvanced(page){
  try{
    if(page==="notifications"){
      const m=await import("./notifications-v30.js?v=404");
      return m.notificationsPage(state.role);
    }
    if(page==="interventions"){
      const m=await import("./intervention-v31.js?v=404");
      return m.interventionCenterView();
    }
    if(page==="student360"){
      const m=await import("./student360-v29.js?v=404");
      return m.student360View(4);
    }
    if(state.role==="trainer" && ["students","groups","courses","questions","exams","labs","analytics","tdash"].includes(page)){
      const m=await import("./trainer-v22.js?v=401");
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
  else view=simplePage("الشاشة التدريبية","V3.7","اختر قسمًا من القائمة للمتابعة.",[["tdash","btn-primary","الرئيسية"]]);

  app.innerHTML='<div class="app-shell">'+sidebar()+'<main class="main">'+topbar()+'<div class="container">'+(view||"")+'</div></main></div>';
  bind();
}

function bind(){
  document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",async()=>{state.page=btn.dataset.page;await render()}));
  document.getElementById("switch-role")?.addEventListener("click",async()=>{state.role=state.role==="student"?"trainer":"student";state.page=state.role==="student"?"home":"tdash";await render()});
  document.getElementById("hard-refresh")?.addEventListener("click",()=>location.reload());

  document.querySelectorAll("[data-course-action]").forEach(btn=>btn.addEventListener("click",async()=>{
    try{
      const m=await import("./course-manager-v36.js?v=404");
      const action=btn.dataset.courseAction;
      if(action==="new"){
        const form=document.getElementById("course-builder");
        if(form)form.hidden=false;
        return;
      }
      if(action==="close-form"){
        const form=document.getElementById("course-builder");
        if(form)form.hidden=true;
        return;
      }
      const result=m.handleCourseAction(btn);
      if(result?.rerender)await render();
    }catch(error){showError(error)}
  }));
  document.getElementById("new-course-form")?.addEventListener("submit",async event=>{
    event.preventDefault();
    try{
      const m=await import("./course-manager-v36.js?v=404");
      const result=m.handleCourseForm(event.currentTarget);
      const msg=document.getElementById("course-form-msg");
      if(!result.ok){
        if(msg)msg.textContent=result.message;
        return;
      }
      await render();
    }catch(error){showError(error)}
  });
  document.querySelectorAll("[data-course-status]").forEach(btn=>btn.addEventListener("click",()=>{
    const status=btn.dataset.courseStatus;
    document.querySelectorAll("[data-course-status]").forEach(x=>x.classList.toggle("active",x===btn));
    document.querySelectorAll("[data-course-item-status]").forEach(card=>{
      card.style.display=status==="all"||card.dataset.courseItemStatus===status?"":"none";
    });
  }));

  document.querySelectorAll("[data-lesson]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./student.js?v=404");m.handleStudentAction(btn);state.page="practice";await render()}catch(error){showError(error)}}));
  document.getElementById("start-smart-review")?.addEventListener("click",async()=>{try{const m=await import("./student.js?v=404");m.handleStudentAction(document.getElementById("start-smart-review"));state.page="practice";await render()}catch(error){showError(error)}});
  document.getElementById("restart-practice")?.addEventListener("click",async()=>{try{const m=await import("./student.js?v=404");m.handleStudentAction(document.getElementById("restart-practice"));state.page="practice";await render()}catch(error){showError(error)}});
  document.getElementById("start-exam")?.addEventListener("click",async()=>{try{const m=await import("./exam-v23.js?v=404");const result=m.handleExamAction(document.getElementById("start-exam"));if(result?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("exam-prev")?.addEventListener("click",async()=>{try{const m=await import("./exam-v23.js?v=404");if(m.handleExamAction(document.getElementById("exam-prev"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("exam-next")?.addEventListener("click",async()=>{try{const m=await import("./exam-v23.js?v=404");if(m.handleExamAction(document.getElementById("exam-next"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("submit-exam")?.addEventListener("click",async()=>{try{const m=await import("./exam-v23.js?v=404");m.handleExamAction(document.getElementById("submit-exam"));await render()}catch(error){showError(error)}});
  document.getElementById("qbank-search")?.addEventListener("change",async e=>{try{const m=await import("./question-bank-v24.js?v=404");m.updateFilter("search",e.target.value.trim());await render()}catch(error){showError(error)}});
  document.getElementById("qbank-topic")?.addEventListener("change",async e=>{try{const m=await import("./question-bank-v24.js?v=404");m.updateFilter("topic",e.target.value);await render()}catch(error){showError(error)}});
  document.getElementById("qbank-difficulty")?.addEventListener("change",async e=>{try{const m=await import("./question-bank-v24.js?v=404");m.updateFilter("difficulty",e.target.value);await render()}catch(error){showError(error)}});
  document.querySelectorAll("[data-lab-page]").forEach(btn=>btn.addEventListener("click",async()=>{state.page=btn.dataset.labPage==="subnet"?"subnet-lab":btn.dataset.labPage==="flsm"?"flsm":"vlsm";await render()}));

  document.querySelectorAll("[data-student-id]").forEach(btn=>btn.addEventListener("click",async()=>{state.role="trainer";state.page="student360";await render()}));
  document.querySelectorAll("[data-course-editor-action]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./course-manager-v36.js?v=404");const result=m.handleCourseEditorAction(btn);if(result?.rerender)await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-lesson-action]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./course-manager-v36.js?v=404");const result=m.handleLessonAction(btn);if(result?.rerender)await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-unit-form]").forEach(form=>form.addEventListener("submit",async event=>{event.preventDefault();try{const m=await import("./course-manager-v36.js?v=404");const result=m.handleUnitForm(event.currentTarget);const msg=form.querySelector("[data-unit-form-msg]");if(!result.ok){if(msg)msg.textContent=result.message;return;}if(result.rerender)await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-lesson-form]").forEach(form=>form.addEventListener("submit",async event=>{event.preventDefault();try{const m=await import("./course-manager-v36.js?v=404");const result=m.handleLessonForm(event.currentTarget);const msg=form.querySelector("[data-lesson-form-msg]");if(!result.ok){if(msg)msg.textContent=result.message;return;}if(result.rerender)await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-lesson-preview]").forEach(btn=>btn.addEventListener("click",()=>{const form=btn.closest("form");if(!form)return;const data=new FormData(form);const preview=document.createElement("div");preview.className="card lesson-preview-render";preview.innerHTML="<div class=\"section-title\"><h3>معاينة الدرس للمتدرب</h3><span class=\"badge purple\">V3.7</span></div><div class=\"lesson-preview-body\"><h2>"+esc(data.get("title")||"درس بدون عنوان")+"</h2><p class=\"muted\">"+esc(data.get("description")||"")+"</p><div class=\"lesson-objectives\"><strong>أهداف الدرس</strong><p>"+esc(data.get("objectives")||"لم تتم إضافة أهداف بعد.")+"</p></div><div class=\"lesson-content-render\">"+esc(data.get("content")||"لم تتم إضافة المحتوى التعليمي بعد.").replaceAll("\\n","<br>")+"</div><div class=\"stat-row\"><span>المدة</span><b>"+esc(data.get("duration")||"")+" دقيقة</b></div></div>";document.querySelector(".lesson-preview-render")?.remove();form.closest(".lesson-editor-layout")?.insertAdjacentElement("afterend",preview)}));
  document.querySelectorAll("[data-course-learning-action]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./course-learning-v37.js?v=405");const result=m.handleLearningAction(btn);if(result?.page)state.page=result.page;if(result?.rerender)await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-360-action]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./student360-v29.js?v=404");const result=m.handleStudent360Action(btn);if(result?.rerender)await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-intervention-action]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./intervention-v31.js?v=404");const result=m.handleInterventionAction(btn);if(result?.studentId){state.role="trainer";state.page="student360"}if(result?.rerender)await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-notification-action]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./notifications-v30.js?v=404");const result=m.handleNotificationAction(btn,state.role);state.page=btn.dataset.notificationPage||result?.page||"notifications";await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-intervention-filter]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./intervention-v31.js?v=404");m.setInterventionFilter(btn.dataset.interventionFilter||"open");await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-notification-filter]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./notifications-v30.js?v=404");m.setNotificationFilter(state.role,btn.dataset.notificationFilter||"all");await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-lesson]").forEach(btn=>btn.addEventListener("click",async()=>{state.page="practice";await render()}));
  document.querySelectorAll("[data-answer]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./student.js?v=404");const result=m.handleStudentAction(btn);if(!result)return;document.querySelectorAll(".answer-option").forEach(x=>{x.disabled=true;if(Number(x.dataset.answer)===result.q.a)x.classList.add("correct")});btn.classList.add(result.ok?"selected-correct":"selected-wrong");const box=document.getElementById("question-feedback");if(box)box.innerHTML="<div class=\""+(result.ok?"good":"bad")+"\"><strong>"+(result.ok?"إجابة صحيحة ✅":"إجابة غير صحيحة ❌")+"</strong><div style=\"margin-top:7px\">"+result.q.why+"</div></div><button class=\"btn btn-primary\" data-next-question>السؤال التالي</button>";document.querySelector("[data-next-question]")?.addEventListener("click",async()=>{if(m.studentState.practice.index===m.studentState.practice.ids.length-1)m.studentState.practice.done=true;else m.studentState.practice.index++;await render()})}catch(error){showError(error)}}));
  document.querySelectorAll("[data-exam-answer],[data-exam-jump],[data-exam-action]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./exam-v23.js?v=404");const result=m.handleExamAction(btn);if(result?.openSubmit){m.handleExamAction({id:"submit-exam",dataset:{}});await render();return}if(result?.review){state.role="student";state.page="review";await render();return}if(result?.rerender)await render()}catch(error){showError(error)}}));
  document.querySelectorAll("[data-q-action]").forEach(btn=>btn.addEventListener("click",async()=>{try{const m=await import("./question-bank-v24.js?v=404");if(m.handleQuestionBankAction(btn)?.rerender)await render()}catch(error){showError(error)}}));
  document.getElementById("check-subnet-lab")?.addEventListener("click",async()=>{try{const m=await import("./subnet-lab-v25.js?v=404");if(m.handleLabAction(document.getElementById("check-subnet-lab"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("show-subnet-solution")?.addEventListener("click",async()=>{try{const m=await import("./subnet-lab-v25.js?v=404");if(m.handleLabAction(document.getElementById("show-subnet-solution"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("new-subnet-challenge")?.addEventListener("click",async()=>{try{const m=await import("./subnet-lab-v25.js?v=404");if(m.handleLabAction(document.getElementById("new-subnet-challenge"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("check-flsm")?.addEventListener("click",async()=>{try{const m=await import("./flsm-v26.js?v=404");if(m.handleFlsmAction(document.getElementById("check-flsm"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("show-flsm-solution")?.addEventListener("click",async()=>{try{const m=await import("./flsm-v26.js?v=404");if(m.handleFlsmAction(document.getElementById("show-flsm-solution"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("new-flsm")?.addEventListener("click",async()=>{try{const m=await import("./flsm-v26.js?v=404");if(m.handleFlsmAction(document.getElementById("new-flsm"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("check-vlsm")?.addEventListener("click",async()=>{try{const m=await import("./vlsm-v27.js?v=404");if(m.handleVlsmAction(document.getElementById("check-vlsm"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("show-vlsm-solution")?.addEventListener("click",async()=>{try{const m=await import("./vlsm-v27.js?v=404");if(m.handleVlsmAction(document.getElementById("show-vlsm-solution"))?.rerender)await render()}catch(error){showError(error)}});
  document.getElementById("new-vlsm")?.addEventListener("click",async()=>{try{const m=await import("./vlsm-v27.js?v=404");if(m.handleVlsmAction(document.getElementById("new-vlsm"))?.rerender)await render()}catch(error){showError(error)}});
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
