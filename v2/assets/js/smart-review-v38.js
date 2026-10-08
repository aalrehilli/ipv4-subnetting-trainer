import {getQuestionBank} from "./question-bank-v32.js?v=438";
import {getQuestionAnalytics} from "./exam-v23.js?v=438";
import {savePractice} from "./demo-data.js";

const SESSION_KEY="ipv4AcademySmartReviewV38";
const HISTORY_KEY="ipv4AcademySmartReviewHistoryV38";
const TOPICS=["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"];

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const diffLabel=d=>d==="hard"?"متقدم":d==="medium"?"متوسط":"سهل";
const diffClass=d=>d==="hard"?"red":d==="medium"?"orange":"green";

function read(key,fallback){
  try{const x=JSON.parse(localStorage.getItem(key)||"null");return x??fallback}catch{return fallback}
}
function save(key,value){localStorage.setItem(key,JSON.stringify(value))}
function analytics(){return getQuestionAnalytics("")}
function plan(){
  const bank=getQuestionBank().filter(q=>q.active!==false);
  const stats=analytics().filter(x=>x.total>0);
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

  const selected=[];
  const used=new Set();
  weakTopics.forEach(t=>{
    ranked.filter(q=>q.topic===t.topic&&!used.has(Number(q.id))).slice(0,2).forEach(q=>{used.add(Number(q.id));selected.push(q)});
  });
  ranked.filter(q=>!used.has(Number(q.id))).slice(0,Math.max(0,8-selected.length)).forEach(q=>{used.add(Number(q.id));selected.push(q)});
  return {questions:selected.slice(0,10),weakTopics,questionStats:stats};
}
function session(){return read(SESSION_KEY,null)}
function history(){return read(HISTORY_KEY,[])}
function saveSession(x){save(SESSION_KEY,x)}
function clearSession(){localStorage.removeItem(SESSION_KEY)}

export function getSmartReviewPlan(){
  const p=plan();
  return {
    topics:p.weakTopics.slice(0,3),
    questions:p.questions,
    count:p.questions.length,
    estimatedMinutes:Math.max(5,Math.ceil(p.questions.length*1.5))
  };
}

export function smartReviewOverview(){
  const p=getSmartReviewPlan();
  const h=history();
  const critical=p.questions.filter(x=>x.accuracy<50&&x.uses>=3).length;
  const recent=h[0];
  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow purple">V3.38 • Smart Review</span><h2>المراجعة الذكية</h2><p>جلسة مراجعة تُبنى من أخطائك الفعلية، وتبدأ من الأسئلة التي تحتاج تدخلًا أكثر.</p></div>
    <div><span class="badge purple">${p.count} أسئلة مقترحة</span></div>
  </div>
  <div class="smart-review-kpis">
    <div class="card exam-admin-kpi"><span>أولوية 1</span><strong>${p.topics[0]?.accuracy??0}%</strong><small>${esc(p.topics[0]?.topic||"لا توجد بيانات")}</small></div>
    <div class="card exam-admin-kpi warning"><span>أسئلة حرجة</span><strong>${critical}</strong><small>دقة أقل من 50% مع بيانات كافية</small></div>
    <div class="card exam-admin-kpi purple"><span>حجم الجلسة</span><strong>${p.count}</strong><small>حوالي ${p.estimatedMinutes} دقائق</small></div>
    <div class="card exam-admin-kpi success"><span>آخر جلسة</span><strong>${recent?.percent??0}%</strong><small>${recent?"آخر نتيجة مراجعة":"لم تبدأ بعد"}</small></div>
  </div>
  <div class="card smart-review-hero">
    <div><span class="eyebrow blue">الخطة الشخصية</span><h3>ابدأ من الأضعف، لا من البداية</h3><p class="muted">يتم اختيار الأسئلة حسب الموضوع الأضعف، ودقة السؤال، وعدد مرات استخدامه. بعدها تُعاد النتيجة لتعرف هل تحسن الأداء.</p></div>
    <button class="btn btn-purple" data-smart-review-action="start">ابدأ جلسة المراجعة</button>
  </div>
  <div class="grid-2">
    <div class="card"><div class="section-title"><h3>أولوية الموضوعات</h3><span class="badge orange">حسب الأداء</span></div>
      ${p.topics.length?p.topics.slice(0,6).map((x,i)=>'<div class="smart-review-topic-row"><div><strong>'+(i+1)+'. '+esc(x.topic)+'</strong><small>'+x.total+' إجابة</small></div><div class="progress"><span style="width:'+x.accuracy+'%"></span></div><b>'+x.accuracy+'%</b></div>').join(""):'<div class="empty">لا توجد بيانات كافية. ابدأ بالتدريب والاختبارات أولًا.</div>'}
    </div>
    <div class="card"><div class="section-title"><h3>لماذا هذه الأسئلة؟</h3><span class="badge blue">Smart Selection</span></div>
      ${p.questions.slice(0,6).map((q,i)=>'<div class="smart-review-question-row"><span>'+(i+1)+'</span><div><strong>'+esc(q.q)+'</strong><small>'+esc(q.topic)+' • '+diffLabel(q.difficulty)+' • دقة '+q.accuracy+'%</small></div><b>'+q.accuracy+'%</b></div>').join("")||'<div class="empty">سيُبنى بنك المراجعة بعد توفر محاولات.</div>'}
    </div>
  </div>
  <div class="card smart-rule"><strong>قاعدة V3.38:</strong><p class="muted">المراجعة لا تعيد تشغيل كل الأسئلة. هدفها معالجة أضعف مهارة ثم قياس التحسن، مع الاحتفاظ بسجل الجلسات.</p></div>
  `;
}

function sessionPage(){
  const s=session();
  if(!s||!Array.isArray(s.questionIds)||!s.questionIds.length)return smartReviewOverview();
  const bank=getQuestionBank();
  const q=bank.find(x=>Number(x.id)===Number(s.questionIds[s.index]));
  if(!q)return smartReviewOverview();
  const selected=s.answers?.[q.id];
  const answered=s.questionIds.filter(id=>s.answers?.[id]!==undefined).length;
  const pct=Math.round(s.index/s.questionIds.length*100);
  const selectedIndex=selected?.selected;
  const done=selected!==undefined && selected!==null;
  return `
  <div class="practice-top"><div><span class="eyebrow purple">V3.38 • جلسة مراجعة ذكية</span><h2>سؤال مستهدف</h2><p>ركز على المهارة الحالية، ثم انتقل للسؤال التالي.</p></div><div class="practice-counter">سؤال ${s.index+1} / ${s.questionIds.length}</div></div>
  <div class="card practice-progress"><div class="progress"><span style="width:${pct}%"></span></div><div class="smart-review-session-meta"><span>تمت الإجابة: ${answered}/${s.questionIds.length}</span><span>الموضوع: ${esc(q.topic)}</span></div></div>
  <div class="practice-layout">
    <div class="card question-card smart-review-question-card">
      <div class="question-meta"><span class="badge">${esc(q.topic)}</span><span class="badge ${diffClass(q.difficulty)}">${diffLabel(q.difficulty)}</span><span class="badge blue">${q.skill?esc(q.skill):"مراجعة مركزة"}</span></div>
      <h2>${esc(q.q)}</h2>
      <div class="answer-grid">
        ${(q.opts||q.options||[]).map((o,i)=>'<button class="answer-option '+(done&&Number(selectedIndex)===i?"selected":"")+'" data-smart-review-action="answer" data-answer-index="'+i+'" '+(done?"disabled":"")+'><span>'+String.fromCharCode(65+i)+'</span>'+esc(o)+'</button>').join("")}
      </div>
      ${done?'<div class="smart-review-feedback '+(selected.correct?"correct":"wrong")+'"><strong>'+(selected.correct?"✅ إجابة صحيحة":"❌ إجابة غير صحيحة")+'</strong><p>'+(selected.correct?"أحسنت، ثبتت المهارة في هذا السؤال.":"الإجابة الصحيحة هي "+String.fromCharCode(65+Number(q.a))+". راجع التفسير قبل الانتقال.")+'</p><small>'+esc(q.why||"لم يُسجل تفسير للسؤال بعد.")+'</small></div>':""}
      <div class="exam-controls">
        <button class="btn btn-soft" data-smart-review-action="exit">الخروج</button>
        ${done?'<button class="btn btn-primary" data-smart-review-action="'+(s.index===s.questionIds.length-1?"finish":"next")+'">'+(s.index===s.questionIds.length-1?"إنهاء الجلسة":"السؤال التالي")+'</button>':""}
      </div>
    </div>
    <aside class="card tip-card"><span class="eyebrow orange">هدف الجلسة</span><h3>${esc(s.focusTopic||q.topic)}</h3><p class="muted">السؤال مختار لأنه من أكثر نقاط التحسين أولوية في بياناتك الحالية.</p><div class="tip-rule">💡 بعد إنهاء الجلسة ستظهر نسبة التحسن ومقارنة النتيجة.</div></aside>
  </div>`;
}

export function startSmartReview(){
  const p=getSmartReviewPlan();
  if(!p.questions.length)return {ok:false,message:"لا توجد أسئلة نشطة لبناء جلسة المراجعة."};
  const s={id:"SR-"+Date.now(),questionIds:p.questions.map(q=>Number(q.id)),index:0,answers:{},focusTopic:p.topics[0]?.topic||p.questions[0].topic,startedAt:Date.now(),count:p.questions.length};
  saveSession(s);
  return {ok:true,rerender:true};
}
export function handleSmartReviewAction(target){
  const action=target.dataset.smartReviewAction;
  if(action==="start")return startSmartReview();
  const s=session();
  if(!s)return {rerender:true};
  if(action==="exit"){clearSession();return {rerender:true}};
  if(action==="answer"){
    const bank=getQuestionBank();
    const q=bank.find(x=>Number(x.id)===Number(s.questionIds[s.index]));
    if(!q)return {rerender:true};
    const idx=Number(target.dataset.answerIndex);
    const correct=idx===Number(q.a);
    s.answers[q.id]={selected:idx,correct,at:Date.now()};
    try{
      const p=JSON.parse(localStorage.getItem("ipv4AcademyV2Practice")||"{}");
      p.answers=p.answers||[];
      p.answers.push({questionId:Number(q.id),topic:q.topic,correct,at:Date.now(),source:"smart-review-v38"});
      savePractice(p);
    }catch{}
    saveSession(s);
    return {rerender:true};
  }
  if(action==="next"){s.index++;saveSession(s);return {rerender:true}};
  if(action==="finish"){
    const answers=Object.values(s.answers||{});
    const score=answers.length?Math.round(answers.filter(x=>x.correct).length/answers.length*100):0;
    const record={id:s.id,focusTopic:s.focusTopic,startedAt:s.startedAt,finishedAt:Date.now(),total:s.questionIds.length,answered:answers.length,correct:answers.filter(x=>x.correct).length,percent:score};
    const h=history();h.unshift(record);save(HISTORY_KEY,h.slice(0,50));clearSession();
    return {rerender:true,completed:record};
  }
  return null;
}

export function smartReviewPage(){
  return session()?sessionPage():smartReviewOverview();
}
