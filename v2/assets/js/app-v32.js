import {studentPage,studentState,handleStudentAction,resetDemoData} from "./student.js";
import {getTrainerView} from "./trainer-v22.js";
import {handleExamAction} from "./exam-v23.js";
import {handleQuestionBankAction,updateFilter} from "./question-bank-v24.js";
import {handleLabAction} from "./subnet-lab-v25.js";
import {handleFlsmAction} from "./flsm-v26.js";
import {handleVlsmAction} from "./vlsm-v27.js";
import {handleStudent360Action} from "./student360-v29.js";
import {notificationBell,handleNotificationAction,resetNotifications} from "./notifications-v30.js";
import {handleInterventionAction} from "./intervention-v31.js";

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

const esc=v=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function nav(items){
  return items.map(([id,label])=>
    '<button class="'+(state.page===id?"active":"")+'" data-page="'+id+'">'+label+'</button>'
  ).join("");
}

function viewToHtml(view){
  if(view==null)return "";
  if(typeof view==="string")return view;
  if(view instanceof HTMLElement)return view.outerHTML;
  if(view instanceof DocumentFragment){
    const box=document.createElement("div");
    box.appendChild(view.cloneNode(true));
    return box.innerHTML;
  }
  return String(view);
}

function shell(view,title,role){
  return '<div class="app-shell">'+
    '<aside class="sidebar">'+
      '<div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • Demo Preview</small></div></div>'+
      '<nav class="nav">'+nav(role==="student"?studentNav:trainerNav)+'</nav>'+
      '<div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div>'+
    '</aside>'+
    '<main class="main">'+
      '<header class="topbar">'+
        '<div class="topbar-title">'+title+' <span class="badge" style="margin-right:8px">وضع تجريبي</span></div>'+
        '<div class="topbar-actions">'+notificationBell(role)+
          '<button class="btn btn-soft" id="switch-role">عرض '+(role==="student"?"المدرب":"المتدرب")+'</button>'+
          '<button class="btn btn-ghost" id="reset-demo">إعادة التجربة</button>'+
          '<div class="avatar">'+(role==="student"?"م":"د")+'</div>'+
        '</div>'+
      '</header>'+
      '<div class="container">'+viewToHtml(view)+'</div>'+
    '</main>'+
  '</div>';
}

function render(){
  const role=state.role;
  if(role==="student")studentState.page=state.page;
  const view=role==="student"?studentPage():getTrainerView(state.page);
  document.getElementById("app").innerHTML=shell(view,role==="student"?"مساحة المتدرب":"مركز المدرب",role);
  bind();
}

function renderStudent360(id){
  const view=getTrainerView("student360","",id);
  document.getElementById("app").innerHTML=shell(view,"مركز المدرب","trainer");
  bind();
}

function bind(){
  document.querySelectorAll("[data-page]").forEach(btn=>{
    btn.addEventListener("click",()=>{state.page=btn.dataset.page;render()});
  });
  document.querySelectorAll("[data-trainer-page]").forEach(btn=>{
    btn.addEventListener("click",()=>{state.page=btn.dataset.trainerPage;render()});
  });
  document.querySelectorAll("[data-student-id]").forEach(btn=>{
    btn.addEventListener("click",()=>{state.role="trainer";state.page="student360";renderStudent360(btn.dataset.studentId)});
  });
  document.querySelectorAll("[data-360-action]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const result=handleStudent360Action(btn);
      if(result?.rerender)renderStudent360(btn.dataset.studentId);
    });
  });
  document.querySelectorAll("[data-intervention-action]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const result=handleInterventionAction(btn);
      if(result?.studentId){state.role="trainer";state.page="student360";renderStudent360(result.studentId);return}
      if(result?.rerender)render();
    });
  });
  document.getElementById("switch-role")?.addEventListener("click",()=>{
    state.role=state.role==="student"?"trainer":"student";
    state.page=state.role==="student"?"home":"tdash";
    render();
  });
  document.getElementById("reset-demo")?.addEventListener("click",()=>{
    resetDemoData();
    resetNotifications();
    state.role="student";
    state.page="home";
    render();
  });
  document.getElementById("notification-bell")?.addEventListener("click",event=>{
    event.stopPropagation();
    document.getElementById("notification-popover")?.classList.toggle("open");
  });
  document.querySelectorAll("[data-notification-action]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const result=handleNotificationAction(btn,state.role);
      const targetPage=btn.dataset.notificationPage||result?.page||"notifications";
      state.page=targetPage;
      render();
    });
  });

  document.querySelectorAll("[data-lesson]").forEach(btn=>{
    btn.addEventListener("click",()=>{handleStudentAction(btn);state.page="practice";studentState.page="practice";render()});
  });
  document.querySelectorAll("[data-answer]").forEach(btn=>btn.addEventListener("click",()=>answer(btn)));

  document.querySelectorAll("[data-exam-answer],[data-exam-jump],[data-exam-action]").forEach(btn=>{
    btn.addEventListener("click",()=>examAction(btn));
  });
  document.getElementById("start-exam")?.addEventListener("click",()=>examAction(document.getElementById("start-exam")));
  document.getElementById("exam-prev")?.addEventListener("click",()=>examAction(document.getElementById("exam-prev")));
  document.getElementById("exam-next")?.addEventListener("click",()=>examAction(document.getElementById("exam-next")));
  document.getElementById("submit-exam")?.addEventListener("click",()=>examAction(document.getElementById("submit-exam")));

  document.querySelectorAll("[data-q-action]").forEach(btn=>btn.addEventListener("click",()=>questionBankAction(btn)));
  document.getElementById("qbank-search")?.addEventListener("change",e=>{updateFilter("search",e.target.value.trim());render()});
  document.getElementById("qbank-topic")?.addEventListener("change",e=>{updateFilter("topic",e.target.value);render()});
  document.getElementById("qbank-difficulty")?.addEventListener("change",e=>{updateFilter("difficulty",e.target.value);render()});

  document.getElementById("start-smart-review")?.addEventListener("click",()=>{
    handleStudentAction(document.getElementById("start-smart-review"));
    state.page="practice";
    render();
  });
  document.getElementById("restart-practice")?.addEventListener("click",()=>{
    handleStudentAction(document.getElementById("restart-practice"));
    state.page="practice";
    render();
  });

  document.getElementById("check-subnet-lab")?.addEventListener("click",()=>labAction(document.getElementById("check-subnet-lab")));
  document.getElementById("show-subnet-solution")?.addEventListener("click",()=>labAction(document.getElementById("show-subnet-solution")));
  document.getElementById("new-subnet-challenge")?.addEventListener("click",()=>labAction(document.getElementById("new-subnet-challenge")));
  document.querySelectorAll("[data-lab-page]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const target=btn.dataset.labPage;
      state.page=target==="subnet"?"subnet-lab":target==="flsm"?"flsm":"vlsm";
      studentState.page=state.page;
      render();
    });
  });
  document.getElementById("check-flsm")?.addEventListener("click",()=>flsmAction(document.getElementById("check-flsm")));
  document.getElementById("show-flsm-solution")?.addEventListener("click",()=>flsmAction(document.getElementById("show-flsm-solution")));
  document.getElementById("new-flsm")?.addEventListener("click",()=>flsmAction(document.getElementById("new-flsm")));
  document.getElementById("check-vlsm")?.addEventListener("click",()=>vlsmAction(document.getElementById("check-vlsm")));
  document.getElementById("show-vlsm-solution")?.addEventListener("click",()=>vlsmAction(document.getElementById("show-vlsm-solution")));
  document.getElementById("new-vlsm")?.addEventListener("click",()=>vlsmAction(document.getElementById("new-vlsm")));

  document.getElementById("trainer-search")?.addEventListener("input",applyTrainerFilters);
  document.getElementById("trainer-risk")?.addEventListener("change",applyTrainerFilters);
  document.getElementById("trainer-group")?.addEventListener("change",applyTrainerFilters);
}

function answer(button){
  const result=handleStudentAction(button);
  if(!result)return;
  document.querySelectorAll(".answer-option").forEach(x=>{
    x.disabled=true;
    if(Number(x.dataset.answer)===result.q.a)x.classList.add("correct");
  });
  button.classList.add(result.ok?"selected-correct":"selected-wrong");
  const box=document.getElementById("question-feedback");
  if(!box)return;
  box.innerHTML='<div class="'+(result.ok?"good":"bad")+'"><strong>'+(result.ok?"إجابة صحيحة ✅":"إجابة غير صحيحة ❌")+'</strong><div style="margin-top:7px">'+esc(result.q.why)+'</div></div>'+
    '<button class="btn btn-primary" id="next-question">'+
    (studentState.practice.index===studentState.practice.ids.length-1?"عرض النتيجة":"السؤال التالي")+
    '</button>';
  box.querySelector("#next-question").addEventListener("click",()=>{
    if(studentState.practice.index===studentState.practice.ids.length-1)studentState.practice.done=true;
    else studentState.practice.index++;
    render();
  });
}

function examAction(button){
  const result=handleExamAction(button);
  if(!result)return;
  if(result.openSubmit){
    handleExamAction({id:"submit-exam",dataset:{}});
    render();
    return;
  }
  if(result.review){
    state.role="student";
    state.page="review";
    studentState.page="review";
    render();
    return;
  }
  if(result.rerender)render();
}

function labAction(button){
  const result=handleLabAction(button);
  if(result?.rerender)render();
}
function flsmAction(button){
  const result=handleFlsmAction(button);
  if(result?.rerender)render();
}
function vlsmAction(button){
  const result=handleVlsmAction(button);
  if(result?.rerender)render();
}
function questionBankAction(button){
  const result=handleQuestionBankAction(button);
  if(result?.rerender)render();
}
function applyTrainerFilters(){
  const q=(document.getElementById("trainer-search")?.value||"").trim();
  const risk=document.getElementById("trainer-risk")?.value||"";
  const group=document.getElementById("trainer-group")?.value||"";
  document.querySelectorAll(".trainer-table tbody tr").forEach(row=>{
    const text=row.innerText||"";
    row.style.display=(!q||text.includes(q))&&(!risk||text.includes(risk))&&(!group||text.includes(group))?"":"none";
  });
}

render();
