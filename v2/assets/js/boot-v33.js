const state={role:"student",page:"home"};
let mod={};

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

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

function nav(items){
  return items.map(([id,label])=>'<button class="'+(state.page===id?"active":"")+'" data-page="'+id+'">'+label+'</button>').join("");
}

function shell(view,title){
  const role=state.role;
  return '<div class="app-shell">'+
    '<aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • Preview</small></div></div>'+
    '<nav class="nav">'+nav(role==="student"?studentNav:trainerNav)+'</nav>'+
    '<div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div></aside>'+
    '<main class="main"><header class="topbar"><div class="topbar-title">'+title+' <span class="badge" style="margin-right:8px">وضع تجريبي</span></div>'+
    '<div class="topbar-actions">'+(mod.notifications?.notificationBell?mod.notifications.notificationBell(role):"")+
    '<button class="btn btn-soft" id="switch-role">عرض '+(role==="student"?"المدرب":"المتدرب")+'</button>'+
    '<button class="btn btn-ghost" id="reset-demo">إعادة التجربة</button><div class="avatar">'+(role==="student"?"م":"د")+'</div></div></header>'+
    '<div class="container">'+(typeof view==="string"?view:String(view??""))+'</div></main></div>';
}

function showError(error){
  const message=error?.message||String(error);
  document.getElementById("app").innerHTML='<div style="padding:40px;font-family:Arial;direction:rtl"><div style="max-width:900px;margin:auto;background:#fff0ef;border:1px solid #f0c5c2;border-radius:18px;padding:25px"><h2 style="color:#ac312a">تعذر تشغيل المنصة</h2><p>حدث خطأ أثناء تحميل أحد مكونات V2.</p><pre style="direction:ltr;white-space:pre-wrap;background:#fff;padding:15px;border-radius:10px;overflow:auto">'+esc(message)+'</pre><button onclick="location.reload()" style="padding:10px 16px;border:0;border-radius:9px;cursor:pointer">إعادة المحاولة</button></div></div>';
}

async function loadStudentModules(){
  const [student,notifications]=await Promise.all([
    import("./student.js?v=330"),
    import("./notifications-v30.js?v=330")
  ]);
  mod.student=student;
  mod.notifications=notifications;
}

async function loadTrainerModules(){
  const [trainer,notifications,intervention]=await Promise.all([
    import("./trainer-v22.js?v=330"),
    import("./notifications-v30.js?v=330"),
    import("./intervention-v31.js?v=330")
  ]);
  mod.trainer=trainer;
  mod.notifications=notifications;
  mod.intervention=intervention;
}

async function render(){
  try{
    if(state.role==="student"){
      if(!mod.student)await loadStudentModules();
      mod.student.studentState.page=state.page;
      const view=mod.student.studentPage();
      document.getElementById("app").innerHTML=shell(view,"مساحة المتدرب");
    }else{
      if(!mod.trainer)await loadTrainerModules();
      const view=mod.trainer.getTrainerView(state.page);
      document.getElementById("app").innerHTML=shell(view,"مركز المدرب");
    }
    bind();
  }catch(error){showError(error)}
}

function bind(){
  document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",async()=>{
    state.page=btn.dataset.page;
    await render();
  }));
  document.querySelectorAll("[data-trainer-page]").forEach(btn=>btn.addEventListener("click",async()=>{
    state.page=btn.dataset.trainerPage;
    await render();
  }));
  document.getElementById("switch-role")?.addEventListener("click",async()=>{
    state.role=state.role==="student"?"trainer":"student";
    state.page=state.role==="student"?"home":"tdash";
    await render();
  });
  document.getElementById("reset-demo")?.addEventListener("click",()=>{
    try{mod.student?.resetDemoData?.()}catch{}
    try{mod.notifications?.resetNotifications?.()}catch{}
    state.role="student";state.page="home";location.reload();
  });
  document.getElementById("notification-bell")?.addEventListener("click",e=>{
    e.stopPropagation();
    document.getElementById("notification-popover")?.classList.toggle("open");
  });
  document.querySelectorAll("[data-notification-action]").forEach(btn=>btn.addEventListener("click",async()=>{
    try{
      const result=mod.notifications?.handleNotificationAction?.(btn,state.role);
      state.page=btn.dataset.notificationPage||result?.page||"notifications";
      await render();
    }catch(error){showError(error)}
  }));
  document.querySelectorAll("[data-intervention-action]").forEach(btn=>btn.addEventListener("click",async()=>{
    try{
      const result=mod.intervention?.handleInterventionAction?.(btn);
      if(result?.studentId){
        state.page="student360";
      }else if(result?.rerender){
        await render();
      }
    }catch(error){showError(error)}
  }));
}

window.addEventListener("error",event=>{
  if(!document.getElementById("app")?.innerHTML)showError(event.error||event.message);
});

render();
