import {getQuestionBank} from "./question-bank-v32.js?v=470";
import {getQuestionAnalytics} from "./exam-v23.js?v=470";
import {savePractice} from "./demo-data.js";
import {fetchStudentSmartReviewPlan,checkStudentSmartReviewAnswer} from "./supabase-v30.js?v=470";

const SESSION_KEY="ipv4AcademySmartReviewV38";
const HISTORY_KEY="ipv4AcademySmartReviewHistoryV38";
const PLAN_KEY="ipv4AcademySmartReviewCentralV368";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const diffLabel=d=>d==="hard"?"متقدم":d==="medium"?"متوسط":"سهل";
const diffClass=d=>d==="hard"?"red":d==="medium"?"orange":"green";

function read(key,fallback){
  try{const x=JSON.parse(localStorage.getItem(key)||"null");return x??fallback}catch{return fallback}
}
function save(key,value){localStorage.setItem(key,JSON.stringify(value))}
function localPlan(){
  const bank=getQuestionBank().filter(q=>q.active!==false);
  const stats=getQuestionAnalytics("").filter(x=>x.total>0);
  const byId=new Map(stats.map(x=>[Number(x.id),x]));
  const topicScore={};
  stats.forEach(x=>{
    const cur=topicScore[x.topic]||{total:0,correct:0};
    cur.total+=x.total;cur.correct+=x.correct;topicScore[x.topic]=cur;
  });
  const weakTopics=Object.entries(topicScore).map(([topic,x])=>({topic,accuracy:x.total?Math.round(x.correct/x.total*100):0,total:x.total})).sort((a,b)=>a.accuracy-b.accuracy);
  const ranked=bank.map(q=>{
    const s=byId.get(Number(q.id));
    const acc=s?.accuracy??0;
    const uses=s?.total??0;
    const weakness=(100-acc)+(uses<3?15:0)+(q.difficulty==="hard"?5:0);
    return {...q,accuracy:acc,uses,priority:Math.round(weakness)};
  }).filter(q=>q.q).sort((a,b)=>b.priority-a.priority);
  const selected=[]; const used=new Set();
  weakTopics.forEach(t=>ranked.filter(q=>q.topic===t.topic&&!used.has(Number(q.id))).slice(0,2).forEach(q=>{used.add(Number(q.id));selected.push(q)}));
  ranked.filter(q=>!used.has(Number(q.id))).slice(0,Math.max(0,8-selected.length)).forEach(q=>{used.add(Number(q.id));selected.push(q)});
  return {source:"local",questions:selected.slice(0,10),weakTopics,questionStats:stats};
}

async function loadPlan(force=false){
  if(!force){
    const cached=read(PLAN_KEY,null);
    if(cached&&Array.isArray(cached.questions)&&Array.isArray(cached.topics))return cached;
  }
  try{
    const central=await fetchStudentSmartReviewPlan(10);
    if(central.ok&&central.questions.length){
      const p={source:"central",questions:central.questions,weakTopics:central.topics,questionStats:[]};
      save(PLAN_KEY,p);
      return p;
    }
  }catch{}
  const fallback=localPlan();
  save(PLAN_KEY,fallback);
  return fallback;
}

function session(){return read(SESSION_KEY,null)}
function history(){return read(HISTORY_KEY,[])}
function saveSession(x){save(SESSION_KEY,x)}
function clearSession(){localStorage.removeItem(SESSION_KEY)}

export async function getSmartReviewPlan(){
  const p=await loadPlan();
  return {topics:p.weakTopics.slice(0,3),questions:p.questions,count:p.questions.length,estimatedMinutes:Math.max(5,Math.ceil(p.questions.length*1.5)),source:p.source};
}

export async function smartReviewOverview(){
  const p=await getSmartReviewPlan();
  const h=history();
  const critical=p.questions.filter(x=>Number(x.accuracy||0)<50&&Number(x.uses||0)>=3).length;
  const recent=h[0];
  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow purple">V3.68 • Smart Review</span><h2>المراجعة الذكية</h2><p>الخطة تُبنى الآن من نتائج الاختبارات المركزية عند توفرها، ثم تُرتب حسب أضعف الموضوعات والأسئلة.</p></div>
    <div><span class="badge purple">${p.count} أسئلة مقترحة</span></div>
  </div>
  <div class="smart-review-kpis">
    <div class="card exam-admin-kpi"><span>أولوية 1</span><strong>${p.topics[0]?.accuracy??0}%</strong><small>${esc(p.topics[0]?.topic||"لا توجد بيانات")}</small></div>
    <div class="card exam-admin-kpi warning"><span>أسئلة حرجة</span><strong>${critical}</strong><small>أداؤها أقل من 50%</small></div>
    <div class="card exam-admin-kpi purple"><span>حجم الجلسة</span><strong>${p.count}</strong><small>حوالي ${p.estimatedMinutes} دقائق</small></div>
    <div class="card exam-admin-kpi success"><span>آخر جلسة</span><strong>${recent?.percent??0}%</strong><small>${recent?"آخر نتيجة مراجعة":"لم تبدأ بعد"}</small></div>
  </div>
  <div class="card smart-review-hero">
    <div><span class="eyebrow blue">المصدر</span><h3>${p.source==="central"?"بيانات الاختبارات المركزية":"بيانات الجهاز المحلية"}</h3><p class="muted">${p.source==="central"?"تم بناء الخطة من إجاباتك الفعلية المسجلة في Supabase.":"سيتم التحول تلقائيًا إلى النتائج المركزية بعد توفر محاولة اختبار مسجلة."}</p></div>
    <button class="btn btn-purple" data-smart-review-action="start">ابدأ جلسة المراجعة</button>
  </div>
  <div class="grid-2">
    <div class="card"><div class="section-title"><h3>أولوية الموضوعات</h3><span class="badge orange">حسب الأداء</span></div>
      ${p.topics.length?p.topics.slice(0,6).map((x,i)=>'<div class="smart-review-topic-row"><div><strong>'+(i+1)+'. '+esc(x.topic)+'</strong><small>'+Number(x.total||0)+' إجابة</small></div><div class="progress"><span style="width:'+Number(x.accuracy||0)+'%"></span></div><b>'+Number(x.accuracy||0)+'%</b></div>').join(""):'<div class="empty">لا توجد بيانات كافية بعد.</div>'}
    </div>
    <div class="card"><div class="section-title"><h3>لماذا هذه الأسئلة؟</h3><span class="badge blue">Smart Selection</span></div>
      ${p.questions.slice(0,6).map((q,i)=>'<div class="smart-review-question-row"><span>'+(i+1)+'</span><div><strong>'+esc(q.q)+'</strong><small>'+esc(q.topic||"")+' • '+diffLabel(q.difficulty)+' • دقة '+Number(q.accuracy||0)+'%</small></div><b>'+Number(q.accuracy||0)+'%</b></div>').join("")||'<div class="empty">سيُبنى بنك المراجعة بعد توفر محاولات.</div>'}
    </div>
  </div>
  <div class="card smart-rule"><strong>V3.68:</strong><p class="muted">الإجابة الصحيحة لا تُرسل إلى المتصفح مع خطة المراجعة؛ يتم التحقق منها مركزيًا عند اختيار المتدرب لإجابته.</p></div>`;
}

function currentQuestion(){
  const s=session();
  if(!s)return null;
  return Array.isArray(s.questions)?s.questions[s.index]:null;
}

function sessionPage(){
  const s=session();
  const q=currentQuestion();
  if(!s||!q)return smartReviewOverview();
  const selected=s.answers?.[String(q.id)];
  const answered=s.questions.filter(x=>s.answers?.[String(x.id)]!==undefined).length;
  const pct=Math.round(s.index/s.questions.length*100);
  const selectedIndex=selected?.selected;
  const done=selected!==undefined && selected!==null;
  return `
  <div class="practice-top"><div><span class="eyebrow purple">V3.68 • جلسة مراجعة ذكية</span><h2>سؤال مستهدف</h2><p>الإجابة والتحقق من صحتها يتمان مع المحرك المركزي.</p></div><div class="practice-counter">سؤال ${s.index+1} / ${s.questions.length}</div></div>
  <div class="card practice-progress"><div class="progress"><span style="width:${pct}%"></span></div><div class="smart-review-session-meta"><span>تمت الإجابة: ${answered}/${s.questions.length}</span><span>الموضوع: ${esc(q.topic||"مراجعة")}</span></div></div>
  <div class="practice-layout">
    <div class="card question-card smart-review-question-card">
      <div class="question-meta"><span class="badge">${esc(q.topic||"")}</span><span class="badge ${diffClass(q.difficulty)}">${diffLabel(q.difficulty)}</span><span class="badge blue">مراجعة مركزة</span></div>
      <h2>${esc(q.q)}</h2>
      <div class="answer-grid">
        ${(q.opts||[]).map((o,i)=>'<button class="answer-option '+(done&&Number(selectedIndex)===i?"selected":"")+'" data-smart-review-action="answer" data-answer-index="'+i+'" '+(done?"disabled":"")+'><span>'+String.fromCharCode(65+i)+'</span>'+esc(typeof o==="string"?o:(o?.text||""))+'</button>').join("")}
      </div>
      ${done?'<div class="smart-review-feedback '+(selected.correct?"correct":"wrong")+'"><strong>'+(selected.correct?"✅ إجابة صحيحة":"❌ إجابة غير صحيحة")+'</strong><p>'+(selected.correct?"أحسنت، ثبتت المهارة في هذا السؤال.":"راجع الإجابة الصحيحة ثم أعد المحاولة في جلسة لاحقة.")+'</p><small>'+esc(selected.correctLetter?"الإجابة الصحيحة: "+selected.correctLetter:"تم التحقق مركزيًا.")+'</small></div>':""}
      <div class="exam-controls">
        <button class="btn btn-soft" data-smart-review-action="exit">الخروج</button>
        ${done?'<button class="btn btn-primary" data-smart-review-action="'+(s.index===s.questions.length-1?"finish":"next")+'">'+(s.index===s.questions.length-1?"إنهاء الجلسة":"السؤال التالي")+'</button>':""}
      </div>
    </div>
    <aside class="card tip-card"><span class="eyebrow orange">هدف الجلسة</span><h3>${esc(s.focusTopic||q.topic||"مراجعة")}</h3><p class="muted">الخطة جاءت من البيانات المركزية عند توفرها، والنتيجة تُتحقق في الخادم.</p></aside>
  </div>`;
}

export async function startSmartReview(){
  const p=await getSmartReviewPlan();
  if(!p.questions.length)return {ok:false,message:"لا توجد أسئلة نشطة لبناء جلسة المراجعة."};
  const s={id:"SR-"+Date.now(),questions:p.questions,index:0,answers:{},focusTopic:p.topics[0]?.topic||p.questions[0].topic||"مراجعة",startedAt:Date.now(),count:p.questions.length,source:p.source};
  saveSession(s);
  return {ok:true,rerender:true};
}

export async function handleSmartReviewAction(target){
  const action=target.dataset.smartReviewAction;
  if(action==="start")return await startSmartReview();
  const s=session();
  if(!s)return {rerender:true};
  if(action==="exit"){clearSession();return {rerender:true}}
  if(action==="answer"){
    const q=currentQuestion();
    if(!q)return {rerender:true};
    const idx=Number(target.dataset.answerIndex);
    let check=null;
    if(s.source==="central"){
      const r=await checkStudentSmartReviewAnswer(q.id,idx);
      if(!r.ok)return {message:r.error||r.reason||"تعذر التحقق المركزي من الإجابة."};
      check=r.data||{};
    }else{
      const bank=getQuestionBank();
      const local=bank.find(x=>Number(x.id)===Number(q.id));
      check={correct:idx===Number(local?.a),correctIndex:Number(local?.a??-1),correctLetter:Number.isFinite(Number(local?.a))?String.fromCharCode(65+Number(local.a)):""};
    }
    s.answers[String(q.id)]={selected:idx,correct:check.correct===true,correctLetter:check.correctLetter||"",at:Date.now()};
    try{
      const p=read("ipv4AcademyV2Practice",{});
      p.answers=p.answers||[];
      p.answers.push({questionId:String(q.id),topic:q.topic,correct:check.correct===true,at:Date.now(),source:"smart-review-v38"});
      savePractice(p);
    }catch{}
    saveSession(s);
    return {rerender:true};
  }
  if(action==="next"){s.index++;saveSession(s);return {rerender:true}}
  if(action==="finish"){
    const answers=Object.values(s.answers||{});
    const score=answers.length?Math.round(answers.filter(x=>x.correct).length/answers.length*100):0;
    const record={id:s.id,focusTopic:s.focusTopic,startedAt:s.startedAt,finishedAt:Date.now(),total:s.questions.length,answered:answers.length,correct:answers.filter(x=>x.correct).length,percent:score,source:s.source};
    const h=history();h.unshift(record);save(HISTORY_KEY,h.slice(0,50));clearSession();
    return {rerender:true,completed:record};
  }
  return null;
}

export async function smartReviewPage(){
  return session()?sessionPage():await smartReviewOverview();
}
