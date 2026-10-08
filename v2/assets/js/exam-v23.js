import {questions,loadPractice,savePractice} from "./demo-data.js";
import {refreshBank} from "./question-bank-v24.js?v=427";

const EXAM_KEY="ipv4AcademyV23Exam";
const RESULT_KEY="ipv4AcademyV23ExamResult";
const WEAK_KEY="ipv4AcademyV23WeakTopics";
const EXAM_CONFIG_KEY="ipv4AcademyV317ExamConfig";
const EXAM_ATTEMPT_KEY="ipv4AcademyV317Attempts";
const DEFAULT_CONFIG={title:"IPv4 & Binary",questionIds:questions.map(q=>q.id),durationMin:5,passPercent:60,attemptsLimit:1,selectionMode:"manual",questionCount:10,difficultyMode:"all",topicTargets:{},published:false,updatedAt:null};
function availableQuestions(){return refreshBank().filter(q=>q.active!==false).map(q=>({...q,opts:Array.isArray(q.opts)?q.opts:[...(q.options||[])]}))}
function defaultQuestionIds(){return availableQuestions().map(q=>Number(q.id)).filter(Number.isFinite)}
function shuffle(list){
  const a=[...list];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function difficultyAllowed(q,mode){return mode==="all"||q.difficulty===mode}
function buildAutoQuestionIds(count,difficultyMode,targets){
  const pool=availableQuestions().filter(q=>difficultyAllowed(q,difficultyMode));
  const used=new Set(),picked=[];
  Object.entries(targets||{}).forEach(([topic,n])=>{
    const need=Math.max(0,Number(n)||0);
    if(!need)return;
    shuffle(pool.filter(q=>q.topic===topic&&!used.has(Number(q.id)))).slice(0,need).forEach(q=>{used.add(Number(q.id));picked.push(Number(q.id))});
  });
  if(picked.length<count){
    shuffle(pool.filter(q=>!used.has(Number(q.id)))).slice(0,Math.max(0,count-picked.length)).forEach(q=>{used.add(Number(q.id));picked.push(Number(q.id))});
  }
  return picked.slice(0,count);
}
export function getExamPreviewQuestions(){
  return selectedQuestions().map(q=>({...q,opts:Array.isArray(q.opts)?q.opts:[...(q.options||[])]}));
}
export function publishTrainerExam(published=true){
  const cfg=getExamConfig();
  const next={...cfg,published:!!published,updatedAt:Date.now()};
  localStorage.setItem(EXAM_CONFIG_KEY,JSON.stringify(next));
  return next;
}
export function saveTrainerExamBuilderFromForm(form){
  const current=getExamConfig();
  const mode=form.querySelector('[name="selectionMode"]')?.value||current.selectionMode;
  const count=Math.max(1,Math.min(100,Number(form.querySelector('[name="questionCount"]')?.value||current.questionCount||10)));
  const difficultyMode=form.querySelector('[name="difficultyMode"]')?.value||current.difficultyMode||"all";
  const targets={};
  form.querySelectorAll('[data-topic-target]').forEach(el=>{
    const v=Math.max(0,Math.min(100,Number(el.value)||0));
    if(v)targets[el.getAttribute('data-topic-target')]=v;
  });
  const manual=[...form.querySelectorAll('input[name="questionIds"]:checked')].map(x=>Number(x.value));
  const ids=mode==="random"?buildAutoQuestionIds(count,difficultyMode,targets):Array.from(new Set(manual)).filter(id=>availableQuestions().some(q=>Number(q.id)===id)).slice(0,100);
  const next={...current,selectionMode:mode,questionCount:count,difficultyMode,topicTargets:targets,questionIds:ids.length?ids:current.questionIds,updatedAt:Date.now()};
  localStorage.setItem(EXAM_CONFIG_KEY,JSON.stringify(next));
  return next;
}

function getExamConfig(){
  try{
    const saved=JSON.parse(localStorage.getItem(EXAM_CONFIG_KEY)||"null");
    if(!saved)return {...DEFAULT_CONFIG,questionIds:defaultQuestionIds()};
    const ids=Array.isArray(saved.questionIds)&&saved.questionIds.length?saved.questionIds.map(Number):defaultQuestionIds();
    return {...DEFAULT_CONFIG,...saved,questionIds:ids,topicTargets:saved.topicTargets||{}};
  }catch{return {...DEFAULT_CONFIG,questionIds:defaultQuestionIds()}}
}
export function saveTrainerExamConfigFromForm(form){
  const selected=[...form.querySelectorAll('input[name="questionIds"]:checked')].map(x=>Number(x.value));
  const current=getExamConfig();
  const ids=selected.length?selected:current.questionIds;
  const cfg={
    title:(form.querySelector('[name="title"]')?.value||DEFAULT_CONFIG.title).trim(),
    questionIds:ids.length?ids:DEFAULT_CONFIG.questionIds,
    durationMin:Number(form.querySelector('[name="durationMin"]')?.value||5),
    passPercent:Number(form.querySelector('[name="passPercent"]')?.value||60),
    attemptsLimit:Number(form.querySelector('[name="attemptsLimit"]')?.value||0)
  };
  const normalized={
    ...DEFAULT_CONFIG,
    ...current,
    ...cfg,
    selectionMode:current.selectionMode||"manual",
    questionCount:current.questionCount||10,
    difficultyMode:current.difficultyMode||"all",
    topicTargets:current.topicTargets||{},
    published:current.published===true,
    questionIds:Array.from(new Set(cfg.questionIds)).filter(id=>availableQuestions().some(q=>Number(q.id)===id)),
    durationMin:Math.max(1,Math.min(60,cfg.durationMin)),
    passPercent:Math.max(0,Math.min(100,cfg.passPercent)),
    attemptsLimit:Math.max(0,cfg.attemptsLimit),
    updatedAt:Date.now()
  };
  if(!normalized.questionIds.length)normalized.questionIds=defaultQuestionIds();
  localStorage.setItem(EXAM_CONFIG_KEY,JSON.stringify(normalized));
  return normalized;
}
export function saveTrainerExamQuestionsFromForm(form){
  const cfg=getExamConfig();
  const ids=[...form.querySelectorAll('input[name="questionIds"]:checked')].map(x=>Number(x.value));
  const valid=Array.from(new Set(ids)).filter(id=>availableQuestions().some(q=>Number(q.id)===id));
  const next={...cfg,questionIds:valid.length?valid:[...cfg.questionIds]};
  localStorage.setItem(EXAM_CONFIG_KEY,JSON.stringify(next));
  return next;
}
export function getTrainerExamConfig(){return getExamConfig()}
export function resetTrainerExamConfig(){localStorage.removeItem(EXAM_CONFIG_KEY);localStorage.removeItem(EXAM_ATTEMPT_KEY);localStorage.removeItem(RESULT_KEY);return getExamConfig()}
function getAttemptCount(){const n=Number(localStorage.getItem(EXAM_ATTEMPT_KEY)||0);return Number.isFinite(n)?n:0}
function incrementAttemptCount(){const n=getAttemptCount()+1;localStorage.setItem(EXAM_ATTEMPT_KEY,String(n));return n}
function selectedQuestions(){
  const cfg=getExamConfig();
  const source=availableQuestions();
  const list=cfg.questionIds.map(id=>source.find(q=>Number(q.id)===Number(id))).filter(Boolean);
  return list.length?list:questions.slice(0,10);
}

const state={
  mode:"intro",
  index:0,
  answers:{},
  startedAt:null,
  expiresAt:null,
  submitted:false,
  result:null
};

let timer=null;

function loadSaved(){
  try{return JSON.parse(localStorage.getItem(EXAM_KEY)||"null")}catch{return null}
}
function saveState(){
  localStorage.setItem(EXAM_KEY,JSON.stringify({
    mode:state.mode,index:state.index,answers:state.answers,
    startedAt:state.startedAt,expiresAt:state.expiresAt
  }));
}
function clearState(){
  localStorage.removeItem(EXAM_KEY);
  stopTimer();
}
function loadResult(){
  try{return JSON.parse(localStorage.getItem(RESULT_KEY)||"null")}catch{return null}
}
function esc(v){
  return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
function formatTime(sec){
  sec=Math.max(0,Math.floor(sec));
  const m=Math.floor(sec/60).toString().padStart(2,"0");
  const s=(sec%60).toString().padStart(2,"0");
  return m+":"+s;
}
function answeredCount(){return Object.keys(state.answers).length}
function currentQuestion(){return selectedQuestions()[state.index]}

function hydrate(){
  const saved=loadSaved();
  if(!saved)return;
  const valid=saved.expiresAt && saved.expiresAt>Date.now();
  if(saved.mode==="live" && valid){
    Object.assign(state,saved);
    ensureTimer();
  }else if(saved.mode==="live"&&!valid){
    Object.assign(state,saved);
    submitExam(true);
  }
}

function ensureTimer(){
  stopTimer();
  if(state.mode!=="live"||!state.expiresAt)return;
  timer=setInterval(()=>{
    const left=Math.max(0,Math.floor((state.expiresAt-Date.now())/1000));
    const el=document.getElementById("exam-timer");
    if(el){
      el.textContent=formatTime(left);
      el.classList.toggle("timer-danger",left<=60);
    }
    if(left<=0){
      stopTimer();
      submitExam(true);
      document.dispatchEvent(new CustomEvent("ipv4-exam-updated"));
    }
  },1000);
}
function stopTimer(){
  if(timer){clearInterval(timer);timer=null}
}
function startExam(){
  const cfg=getExamConfig();
  const attempts=getAttemptCount();
  if(cfg.attemptsLimit>0 && attempts>=cfg.attemptsLimit)return {blocked:true};
  state.mode="live";
  state.index=0;
  state.answers={};
  state.startedAt=Date.now();
  state.expiresAt=state.startedAt+getExamConfig().durationMin*60*1000;
  state.submitted=false;
  state.result=null;
  saveState();
  ensureTimer();
}
function answer(id){
  state.answers[String(currentQuestion().id)]=id;
  saveState();
}
function next(){
  if(state.index<selectedQuestions().length-1)state.index++;
  saveState();
}
function prev(){
  if(state.index>0)state.index--;
  saveState();
}
function scoreExam(){
  let correct=0;
  const topicMap={};
  selectedQuestions().forEach(q=>{
    const ok=Number(state.answers[q.id])===q.a;
    if(ok)correct++;
    if(!topicMap[q.topic])topicMap[q.topic]={correct:0,total:0};
    topicMap[q.topic].total++;
    if(ok)topicMap[q.topic].correct++;
  });
  const percent=Math.round(correct/selectedQuestions().length*100);
  const topics=Object.entries(topicMap).map(([topic,x])=>({topic,percent:Math.round(x.correct/x.total*100),correct:x.correct,total:x.total})).sort((a,b)=>a.percent-b.percent);
  return {
    exam:"IPv4 & Binary",
    score:correct,
    total:selectedQuestions().length,
    percent,
    passed:percent>=getExamConfig().passPercent,
    submittedAt:Date.now(),
    durationSec:Math.max(1,Math.round((Math.min(Date.now(),state.expiresAt)-state.startedAt)/1000)),
    topics
  };
}
function submitExam(auto=false){
  if(state.mode!=="live")return;
  const result=scoreExam();
  result.autoSubmitted=auto;
  state.result=result;
  state.mode="result";
  state.submitted=true;
  localStorage.setItem(RESULT_KEY,JSON.stringify(result));
  incrementAttemptCount();
  localStorage.setItem(WEAK_KEY,JSON.stringify(result.topics.filter(x=>x.percent<70).slice(0,3).map(x=>x.topic)));
  clearState();
  savePractice({
    ...loadPractice(),
    lastExam:{score:result.score,total:result.total,percent:result.percent,submittedAt:result.submittedAt}
  });
  document.dispatchEvent(new CustomEvent("ipv4-exam-updated"));
}
function resetExam(){
  clearState();
  state.mode="intro";
  state.index=0;
  state.answers={};
  state.startedAt=null;
  state.expiresAt=null;
  state.submitted=false;
  state.result=null;
}

function introPage(){
  const result=loadResult();
  const cfg=getExamConfig();
  const used=getAttemptCount();
  const limitText=cfg.attemptsLimit===0?"غير محدود":String(cfg.attemptsLimit);
  const blocked=cfg.attemptsLimit>0&&used>=cfg.attemptsLimit;
  return `
  <div class="page-intro"><span class="eyebrow orange">04 • الاختبارات</span><h2>${esc(cfg.title)}</h2><p>اختبار قصير يقيس فهمك للمفاهيم الأساسية قبل الانتقال إلى Subnetting المتقدم.</p></div>
  <div class="exam-start-layout">
    <div class="card exam-start-card">
      <div class="exam-start-icon">📝</div>
      <span class="badge orange">اختبار تجريبي</span>
      <h3>اختبر نفسك الآن</h3>
      <p class="muted">${selectedQuestions().length} أسئلة • ${cfg.durationMin} دقائق • نجاح من ${cfg.passPercent}% • المحاولات ${used}/${limitText}</p>
      <div class="exam-rules">
        <div>✓ لا توجد عقوبة على الرجوع بين الأسئلة</div>
        <div>✓ تستطيع مراجعة إجاباتك قبل التسليم</div>
        <div>✓ بعد التسليم سيظهر تحليل الأخطاء والموضوعات</div>
      </div>
      <button class="btn btn-primary" id="start-exam" ${blocked?"disabled":""}>${blocked?"استُنفدت المحاولات":"بدء الاختبار"}</button>
    </div>
    <div class="card exam-preview-card">
      <span class="eyebrow blue">آخر نتيجة</span>
      ${result?'<div class="last-result-score">'+result.percent+'%</div><div class="muted">'+(result.passed?"ناجح ✅":"يحتاج مراجعة")+' • '+result.score+'/'+result.total+'</div>':'<div class="last-result-empty">لم تبدأ الاختبار بعد</div>'}
      <div class="exam-preview-divider"></div>
      <h3>ما الذي سنقيسه؟</h3>
      <div class="mini-topic-list">
        ${["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"].map(x=>'<span>'+x+'</span>').join("")}
      </div>
    </div>
  </div>`;
}

function livePage(){
  const q=currentQuestion();
  const chosen=state.answers[q.id];
  const left=Math.max(0,Math.floor((state.expiresAt-Date.now())/1000));
  return `
  <div class="exam-live-head">
    <div><span class="eyebrow orange">الاختبار قيد التنفيذ</span><h2>IPv4 & Binary</h2><p class="muted">السؤال ${state.index+1} من ${selectedQuestions().length}</p></div>
    <div class="exam-timer-wrap"><span>الوقت المتبقي</span><strong id="exam-timer" class="${left<=60?"timer-danger":""}">${formatTime(left)}</strong></div>
  </div>
  <div class="exam-layout">
    <div class="card exam-question-card">
      <div class="question-meta"><span class="badge">${q.topic}</span><span class="badge ${q.difficulty==="hard"?"red":q.difficulty==="medium"?"orange":"green"}">${q.difficulty==="hard"?"متقدم":q.difficulty==="medium"?"متوسط":"سهل"}</span></div>
      <div class="exam-question-number">السؤال ${state.index+1}</div>
      <h2>${q.q}</h2>
      <div class="exam-answer-grid">
        ${q.opts.map((o,i)=>`<button class="exam-answer ${Number(chosen)===i?"selected":""}" data-exam-answer="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(o)}</button>`).join("")}
      </div>
      <div class="exam-controls">
        <button class="btn btn-soft" id="exam-prev" ${state.index===0?"disabled":""}>السابق</button>
        <button class="btn btn-primary" id="exam-next">${state.index===selectedQuestions().length-1?"مراجعة وتسليم":"التالي"}</button>
      </div>
    </div>
    <aside class="card exam-map-card">
      <h3>خريطة الأسئلة</h3>
      <div class="exam-question-map">
        ${selectedQuestions().map((x,i)=>`<button class="${i===state.index?"current":""} ${state.answers[x.id]!==undefined?"answered":""}" data-exam-jump="${i}">${i+1}</button>`).join("")}
      </div>
      <div class="exam-progress-info"><span>تمت الإجابة</span><strong>${answeredCount()}/${selectedQuestions().length}</strong></div>
      <div class="progress"><span style="width:${Math.round(answeredCount()/selectedQuestions().length*100)}%"></span></div>
      <div class="exam-submit-box"><p class="muted">يمكنك التسليم في أي وقت، وستظهر لك النتيجة والتحليل مباشرة.</p><button class="btn btn-orange" id="submit-exam">تسليم الاختبار</button></div>
    </aside>
  </div>`;
}

function resultPage(){
  const r=state.result||loadResult();
  if(!r)return introPage();
  const weak=r.topics.filter(x=>x.percent<70).slice(0,3);
  return `
  <div class="result-screen exam-result-screen">
    <div class="result-icon">${r.passed?"🏆":"↗"}</div>
    <span class="badge ${r.passed?"green":"orange"}">${r.passed?"ناجح":"يحتاج مراجعة"}</span>
    <h2>${r.percent}%</h2>
    <p>${r.score} إجابات صحيحة من ${r.total} • مدة المحاولة ${formatTime(r.durationSec)}</p>
    ${r.autoSubmitted?'<div class="auto-submit-note">انتهى الوقت وتم تسليم الاختبار تلقائيًا.</div>':""}
    <div class="result-topic-grid">
      ${r.topics.map(x=>`<div class="result-topic"><strong>${x.topic}</strong><span>${x.percent}%</span><div class="progress"><span style="width:${x.percent}%"></span></div></div>`).join("")}
    </div>
    <div class="exam-result-actions">
      <button class="btn btn-primary" data-exam-action="review-mistakes">مراجعة نقاط الضعف</button>
      <button class="btn btn-purple" data-exam-action="retry">إعادة الاختبار</button>
      <button class="btn btn-soft" data-page="progress">عرض التقدم</button>
    </div>
  </div>
  <div class="section-title"><h3>ماذا تفعل الآن؟</h3></div>
  <div class="grid-3 exam-next-actions">
    <div class="card"><h3>1. ${weak[0]?.topic||"استمر"}</h3><p class="muted">${weak[0]?"هذا أضعف موضوع في النتيجة الحالية.":"لم تظهر نقطة ضعف حرجة."}</p></div>
    <div class="card"><h3>2. مراجعة ذكية</h3><p class="muted">سيتحول الخطأ إلى تدريب مستهدف بدل إعادة دراسة كل المقرر.</p></div>
    <div class="card"><h3>3. أعد القياس</h3><p class="muted">بعد المراجعة، أعد الاختبار لتتأكد أن المستوى تحسن.</p></div>
  </div>`;
}

export function examPage(){
  if(!state.result && !state.submitted)hydrate();
  if(state.mode==="live")ensureTimer();
  if(state.mode==="result")return resultPage();
  if(state.mode==="live")return livePage();
  return introPage();
}

export function handleExamAction(target){
  if(target.id==="start-exam"){const started=startExam();return started?.blocked?{blocked:true}:{rerender:true}}
  if(target.dataset.examAnswer!==undefined){
    answer(Number(target.dataset.examAnswer));
    return {rerender:true}
  }
  if(target.id==="exam-prev"){prev();return {rerender:true}}
  if(target.id==="exam-next"){
    if(state.index===selectedQuestions().length-1){return {openSubmit:true}}
    next();return {rerender:true}
  }
  if(target.dataset.examJump!==undefined){state.index=Number(target.dataset.examJump);saveState();return {rerender:true}}
  if(target.id==="submit-exam"){submitExam(false);return {rerender:true}}
  if(target.dataset.examAction==="retry"){const started=startExam();return started?.blocked?{blocked:true}:{rerender:true}}
  if(target.dataset.examAction==="review-mistakes"){return {review:true}}
  return null;
}

export function submitFromReview(){submitExam(false)}
export function getLastWeakTopics(){
  try{return JSON.parse(localStorage.getItem(WEAK_KEY)||"[]")}catch{return []}
}

export function getTrainerExamSummary(){
  const r=loadResult();
  return {
    title:"IPv4 & Binary",
    status:r?"تم تنفيذ محاولات":"جاهز",
    attempts:r?1:0,
    avg:r?r.percent:0,
    pass:r?(r.passed?1:0):0,
    config:getExamConfig(),
    attemptsUsed:getAttemptCount(),
    lastResult:r
  };
}
