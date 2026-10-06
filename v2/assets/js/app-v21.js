import {studentPage,studentState,handleStudentAction,resetDemoData} from "./student.js";
import {getTrainerView} from "./trainer-v22.js";
import {handleExamAction} from "./exam-v23.js";
import {handleQuestionBankAction,updateFilter,questionBankView} from "./question-bank-v24.js";
import {handleLabAction} from "./subnet-lab-v25.js";

const state={role:"student",page:"home"};
const studentNav=[["home","الرئيسية"],["level","ابدأ من مستواي"],["course","المقرر"],["practice","التدريب"],["exams","الاختبارات"],["review","المراجعة الذكية"],["labs","المختبرات"],["progress","التقدم"],["achievements","الإنجازات"],["certificate","الشهادة"]];
const trainerNav=[["tdash","الرئيسية"],["students","المتدربون"],["groups","المجموعات"],["courses","المقررات"],["questions","بنك الأسئلة"],["exams","الاختبارات"],["labs","المختبرات"],["analytics","التحليلات"]];

const esc=(v)=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function nav(items){
  return items.map(([id,label])=>'<button class="'+(state.page===id?"active":"")+'" data-page="'+id+'">'+label+'</button>').join("");
}

function trainerPage(){ return getTrainerView(state.page); }

function viewToHtml(view){
  if(view===null||view===undefined) return "";
  if(typeof view==="string") return view;
  if(view instanceof HTMLElement) return view.outerHTML;
  if(view instanceof DocumentFragment){const box=document.createElement("div");box.appendChild(view.cloneNode(true));return box.innerHTML}
  return String(view);
}

function render(){
  if(state.role==="student")studentState.page=state.page;
  const view=state.role==="student"?studentPage():trainerPage();
  const app=document.getElementById("app");
  app.innerHTML='<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • Demo Preview</small></div></div><nav class="nav">'+nav(state.role==="student"?studentNav:trainerNav)+'</nav><div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div></aside><main class="main"><header class="topbar"><div class="topbar-title">'+(state.role==="student"?"مساحة المتدرب":"مركز المدرب")+' <span class="badge" style="margin-right:8px">وضع تجريبي</span></div><div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض '+(state.role==="student"?"المدرب":"المتدرب")+'</button><button class="btn btn-ghost" id="reset-demo">إعادة التجربة</button><div class="avatar">'+(state.role==="student"?"م":"د")+'</div></div></header><div class="container">'+viewToHtml(view)+'</div></main></div>';
  bind();
}

function bind(){
  document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>{state.page=b.dataset.page;render()}));
  document.querySelectorAll("[data-trainer-page]").forEach(b=>b.addEventListener("click",()=>{state.page=b.dataset.trainerPage;render()}));
  document.querySelectorAll("[data-student-id]").forEach(b=>b.addEventListener("click",()=>{state.page="student360";b.dataset.page="student360";renderStudent360(b.dataset.studentId)}));
  document.getElementById("switch-role")?.addEventListener("click",()=>{state.role=state.role==="student"?"trainer":"student";state.page=state.role==="student"?"home":"tdash";render()});
  document.getElementById("reset-demo")?.addEventListener("click",()=>{resetDemoData();state.role="student";state.page="home";render()});
  document.querySelectorAll("[data-lesson]").forEach(b=>b.addEventListener("click",()=>{handleStudentAction(b);state.page="practice";studentState.page="practice";render()}));
  document.querySelectorAll("[data-answer]").forEach(b=>b.addEventListener("click",()=>answer(b)));
  document.querySelectorAll("[data-exam-answer]").forEach(b=>b.addEventListener("click",()=>examAction(b)));
  document.querySelectorAll("[data-exam-jump]").forEach(b=>b.addEventListener("click",()=>examAction(b)));
  document.getElementById("start-exam")?.addEventListener("click",()=>examAction(document.getElementById("start-exam")));
  document.getElementById("exam-prev")?.addEventListener("click",()=>examAction(document.getElementById("exam-prev")));
  document.getElementById("exam-next")?.addEventListener("click",()=>examAction(document.getElementById("exam-next")));
  document.getElementById("submit-exam")?.addEventListener("click",()=>examAction(document.getElementById("submit-exam")));
  document.querySelectorAll("[data-exam-action]").forEach(b=>b.addEventListener("click",()=>examAction(b)));
  document.querySelectorAll("[data-q-action]").forEach(b=>b.addEventListener("click",()=>questionBankAction(b)));
  document.getElementById("qbank-search")?.addEventListener("change",e=>{updateFilter("search",e.target.value.trim());render()});
  document.getElementById("qbank-topic")?.addEventListener("change",e=>{updateFilter("topic",e.target.value);render()});
  document.getElementById("qbank-difficulty")?.addEventListener("change",e=>{updateFilter("difficulty",e.target.value);render()});
  document.getElementById("start-smart-review")?.addEventListener("click",()=>{handleStudentAction(document.getElementById("start-smart-review"));state.page="practice";render()});
  document.getElementById("restart-practice")?.addEventListener("click",()=>{handleStudentAction(document.getElementById("restart-practice"));state.page="practice";render()});
  document.getElementById("check-subnet-lab")?.addEventListener("click",()=>labAction(document.getElementById("check-subnet-lab")));
  document.getElementById("show-subnet-solution")?.addEventListener("click",()=>labAction(document.getElementById("show-subnet-solution")));
  document.getElementById("new-subnet-challenge")?.addEventListener("click",()=>labAction(document.getElementById("new-subnet-challenge")));
  document.getElementById("trainer-search")?.addEventListener("input",applyTrainerFilters);
  document.getElementById("trainer-risk")?.addEventListener("change",applyTrainerFilters);
  document.getElementById("trainer-group")?.addEventListener("change",applyTrainerFilters);
}
function renderStudent360(id){
  const view=getTrainerView("student360","",id);
  document.getElementById("app").innerHTML='<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • Demo Preview</small></div></div><nav class="nav">'+nav(trainerNav)+'</nav><div class="sidebar-footer">Trainer Command Center • V2.2</div></aside><main class="main"><header class="topbar"><div class="topbar-title">مركز المدرب <span class="badge" style="margin-right:8px">وضع تجريبي</span></div><div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض المتدرب</button><button class="btn btn-ghost" id="reset-demo">إعادة التجربة</button><div class="avatar">د</div></div></header><div class="container">'+view+'</div></main></div>';
  bind();
}
function applyTrainerFilters(){
  const q=(document.getElementById("trainer-search")?.value||"").trim();
  const risk=document.getElementById("trainer-risk")?.value||"";
  const group=document.getElementById("trainer-group")?.value||"";
  const rows=document.querySelectorAll(".trainer-table tbody tr");
  rows.forEach(row=>{
    const text=row.innerText||"";
    const okText=!q||text.includes(q);
    const okRisk=!risk||text.includes(risk);
    const okGroup=!group||text.includes(group);
    row.style.display=okText&&okRisk&&okGroup?"":"none";
  });
}

function labAction(button){
  const result=handleLabAction(button);
  if(result?.rerender)render();
}

function questionBankAction(button){
  const result=handleQuestionBankAction(button);
  if(result?.rerender){render();return}
}

function examAction(button){
  const result=handleExamAction(button);
  if(!result)return;
  if(result.openSubmit){
    const submit={id:"submit-exam",dataset:{}};
    handleExamAction(submit);
    render();
    return;
  }
  if(result.review){
    state.role="student";state.page="review";studentState.page="review";render();
    return;
  }
  if(result.rerender){render()}
}

function answer(button){
  const result=handleStudentAction(button);
  if(!result)return;
  document.querySelectorAll(".answer-option").forEach(x=>{x.disabled=true;if(Number(x.dataset.answer)===result.q.a)x.classList.add("correct")});
  button.classList.add(result.ok?"selected-correct":"selected-wrong");
  const box=document.getElementById("question-feedback");
  if(!box)return;
  box.innerHTML='<div class="'+(result.ok?"good":"bad")+'"><strong>'+(result.ok?"إجابة صحيحة ✅":"إجابة غير صحيحة ❌")+'</strong><div style="margin-top:7px">'+esc(result.q.why)+'</div></div><button class="btn btn-primary" id="next-question">'+(studentState.practice.index===studentState.practice.ids.length-1?"عرض النتيجة":"السؤال التالي")+'</button>';
  box.querySelector("#next-question").addEventListener("click",()=>{if(studentState.practice.index===studentState.practice.ids.length-1)studentState.practice.done=true;else studentState.practice.index++;render()});
}

render();
