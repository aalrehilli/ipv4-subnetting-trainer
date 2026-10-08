import {questions as seedQuestions,loadStudent,saveStudent} from "./demo-data.js";
import {recordLessonProgress,syncPendingLessonProgress} from "./course-supabase-v39.js?v=459";
import {mountStudentCourseExams} from "./course-assessments-v41.js?v=459";

const KEY="ipv4AcademyV36Courses";
const ACTIVE_COURSE="ipv4AcademyV37Course";
const ACTIVE_LESSON="ipv4AcademyV37Lesson";
const DONE="ipv4AcademyV37Done";
const MODE="ipv4AcademyV38Mode";
const ATTEMPTS="ipv4AcademyV38LessonAttempts";
const PRACTICE="ipv4AcademyV2Practice";
const QBANK="ipv4AcademyV32QuestionBank";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const readCourses=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(a)?a:[]}catch{return[]}};
const done=()=>{try{const a=JSON.parse(localStorage.getItem(DONE)||"[]");return Array.isArray(a)?a:[]}catch{return[]}};
const saveDone=a=>localStorage.setItem(DONE,JSON.stringify(a));
const attempts=()=>{try{const a=JSON.parse(localStorage.getItem(ATTEMPTS)||"[]");return Array.isArray(a)?a:[]}catch{return[]}};
const saveAttempts=a=>localStorage.setItem(ATTEMPTS,JSON.stringify(a));
const publishedCourses=()=>readCourses().filter(c=>c.status==="published");
const activeCourse=()=>publishedCourses().find(c=>c.id===Number(localStorage.getItem(ACTIVE_COURSE)||0))||publishedCourses()[0]||null;
const activeLessonObj=()=>{const c=activeCourse();const raw=localStorage.getItem(ACTIVE_LESSON)||"";const p=raw.split("-");const u=c?.units.find(x=>x.id===Number(p[1]||0));const l=u?.lessons.find(x=>x.id===Number(p[2]||0));return c&&u&&l?{c,u,l}:null};
const lessonKey=(c,u,l)=>c.id+"-"+u.id+"-"+l.id;
const isDone=(c,u,l)=>done().includes(lessonKey(c,u,l));
const allLessons=c=>c.units.flatMap(u=>u.lessons.map(l=>({course:c,unit:u,lesson:l}))).filter(x=>x.lesson.status==="published");
const coursePct=c=>{const a=allLessons(c);if(!a.length)return 0;return Math.round(a.filter(x=>isDone(c,x.unit,x.lesson)).length/a.length*100)};
const typeLabel=t=>({video:"فيديو",lesson:"شرح",practice:"تدريب",interactive:"تفاعلي",lab:"مختبر"})[t]||"شرح";

function questionBank(){try{const a=JSON.parse(localStorage.getItem(QBANK)||"[]");return Array.isArray(a)?a:[]}catch{return[]}}
function resolveQuestion(ref){
  const s=String(ref||"").trim();
  if(!s)return null;
  const direct=questionBank().find(q=>String(q.id)===s);
  if(direct)return {id:String(direct.id),topic:direct.topic,difficulty:direct.difficulty,q:direct.q,opts:direct.options||direct.opts||[],a:Number(direct.a)||0,why:direct.why||""};
  const n=Number(s.replace(/\D/g,""));
  if(Number.isFinite(n)&&n>0){
    const seed=seedQuestions[n-1];
    if(seed)return {id:s,topic:seed.topic,difficulty:seed.difficulty,q:seed.q,opts:seed.opts,a:seed.a,why:seed.why};
  }
  return null;
}
function lessonQuestions(l){return String(l.questions||"").split(",").map(x=>resolveQuestion(x)).filter(Boolean).slice(0,5)}
function recordPractice(results){
  let practice={};
  try{practice=JSON.parse(localStorage.getItem(PRACTICE)||"{}")||{}}catch{practice={}};
  const answers=Array.isArray(practice.answers)?practice.answers:[];
  results.forEach(r=>answers.push({topic:r.topic,correct:r.correct,source:"lesson-assessment",questionId:r.id}));
  practice.answers=answers.slice(-200);
  practice.lastLessonAssessment=Date.now();
  localStorage.setItem(PRACTICE,JSON.stringify(practice));
}
function completeLesson(c,u,l){
  if(!c||!u||!l)return;
  const key=lessonKey(c,u,l),d=done();
  if(!d.includes(key))d.push(key);
  saveDone(d);
  recordLessonProgress(c.id,u.id,l.id,true,null,null).catch(function(){});
}

export function learnerCourse(){
  const c=activeCourse();
  syncPendingLessonProgress().catch(function(){});
  const available=publishedCourses();
  if(!c)return '<div class="card empty"><h3>لا يوجد مقرر منشور</h3><p class="muted">سيظهر المقرر هنا بعد نشره من مركز المدرب.</p></div>';
  localStorage.setItem(ACTIVE_COURSE,String(c.id));
  setTimeout(function(){
    const select=document.getElementById("v43-course-selector");
    if(select&&!select.__v43){
      select.__v43=true;
      select.addEventListener("change",function(){
        localStorage.setItem(ACTIVE_COURSE,String(select.value));
        localStorage.removeItem(ACTIVE_LESSON);
        localStorage.removeItem(MODE);
        window.dispatchEvent(new CustomEvent("ipv4-course-switch"));
      });
    }
  },0);
  const pct=coursePct(c);
  setTimeout(function(){
    const box=document.getElementById("v41-student-course-exams");
    if(box)mountStudentCourseExams(box,String(c.id)).catch(function(){});
  },0);
  return '<div class="page-intro with-action"><div><span class="eyebrow blue">02 • المقرر • V3.48</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.description||"مسارك التعليمي")+'</p></div><div style="display:flex;gap:8px;align-items:center"><select id="v43-course-selector" class="course-selector">'+available.map(function(x){return '<option value="'+esc(x.id)+'" '+(Number(x.id)===Number(c.id)?"selected":"")+'>'+esc(x.title)+'</option>';}).join("")+'</select><span class="badge '+(pct>=80?"green":pct>=40?"orange":"purple")+'">'+pct+'% مكتمل</span></div></div>'+
  '<div class="card learner-course-hero"><div><strong>رحلتك داخل المقرر</strong><p class="muted">تعلم → تدريب قصير → نتيجة → إتقان.</p></div><div class="progress"><span style="width:'+pct+'%"></span></div><div class="learner-course-stats"><span>'+c.units.length+' وحدات</span><span>'+allLessons(c).length+' درس منشور</span><span>'+c.students+' متدرب</span></div></div>'+
  '<div id="v41-student-course-exams" data-v41-student-course="'+esc(c.id)+'"></div>'+
  '<div class="learner-unit-list">'+c.units.map((u,i)=>{const ls=u.lessons.filter(l=>l.status==="published");return '<section class="card learner-unit"><div class="learner-unit-head"><div><span class="unit-number">'+(i+1)+'</span><div><h3>'+esc(u.title)+'</h3><span class="muted">'+ls.length+' دروس منشورة</span></div></div><span class="badge '+(u.status==="published"?"green":"orange")+'">'+(u.status==="published"?"متاحة":"قيد الإعداد")+'</span></div>'+(ls.length?'<div class="learner-lesson-list">'+ls.map((l,j)=>'<article class="learner-lesson '+(isDone(c,u,l)?"completed":"")+'"><div class="lesson-number">'+(j+1)+'</div><div class="lesson-main"><div class="lesson-title-row"><h3>'+esc(l.title)+'</h3><span class="lesson-type">'+typeLabel(l.type)+'</span></div><p class="muted">'+esc(l.description||"")+'</p><div class="lesson-meta"><span>⏱ '+l.duration+' دقيقة</span><span>'+lessonQuestions(l).length+' أسئلة قصيرة</span><span>'+((l.lab||"")||"بدون مختبر")+'</span></div></div><button class="btn '+(isDone(c,u,l)?"btn-green":"btn-primary")+'" data-course-learning-action="open-lesson" data-course="'+c.id+'" data-unit="'+u.id+'" data-lesson="'+l.id+'">'+(isDone(c,u,l)?"مراجعة":"ابدأ الدرس")+'</button></article>').join("")+'</div>':'<div class="learner-empty">هذه الوحدة لم تُنشر دروسها بعد.</div>')+'</section>'}).join("")+'</div>';
}

export function lessonPage(){
  const x=activeLessonObj();
  if(!x)return learnerCourse();
  const {c,u,l}=x,completed=isDone(c,u,l),qs=lessonQuestions(l);
  return '<div class="page-intro with-action"><div><span class="eyebrow purple">02 • محتوى الدرس • V3.49</span><h2>'+esc(l.title)+'</h2><p>'+esc(l.description||"")+'</p></div><button class="btn btn-soft" data-course-learning-action="back-course">← العودة للمقرر</button></div>'+
  '<div class="lesson-learning-layout"><main class="card lesson-learning-main"><div class="lesson-learning-meta"><span class="badge purple">'+typeLabel(l.type)+'</span><span class="badge">'+l.duration+' دقيقة</span><span class="badge '+(completed?"green":"orange")+'">'+(completed?"مكتمل":"قيد الدراسة")+'</span></div>'+
  (l.mediaType!=="none"&&l.resource?'<div class="lesson-media-placeholder"><strong>الوسائط</strong><p class="muted">'+esc(l.mediaType)+' • <a href="'+esc(l.resource)+'" target="_blank" rel="noopener">فتح المحتوى</a></p></div>':'')+
  '<section class="lesson-learning-section"><span class="eyebrow blue">أهداف الدرس</span><div class="learning-text">'+esc(l.objectives||"لم تُحدد أهداف بعد.")+'</div></section>'+
  '<section class="lesson-learning-section"><span class="eyebrow blue">المحتوى التعليمي</span><div class="learning-text">'+esc(l.content||"لم تتم إضافة المحتوى التعليمي لهذا الدرس بعد.").replaceAll("\n","<br>")+'</div></section>'+
  (l.attachments?'<section class="lesson-learning-section"><span class="eyebrow blue">المرفقات</span><div class="attachment-list">'+l.attachments.split(",").map((x,i)=>{x=x.trim();return x?'<a class="attachment-link" href="'+esc(x)+'" target="_blank" rel="noopener">📎 ملف/رابط '+(i+1)+'</a>':""}).join("")+'</div></section>':'')+
  '<section class="lesson-assessment-banner card"><div><span class="eyebrow orange">تقييم الدرس</span><h3>'+qs.length+' أسئلة قصيرة</h3><p class="muted">اختبر فهمك قبل الانتقال. النتيجة تغذي الإتقان والمراجعة الذكية.</p></div><button class="btn btn-orange" data-course-learning-action="open-assessment" data-course="'+c.id+'" data-unit="'+u.id+'" data-lesson="'+l.id+'">'+(qs.length?"ابدأ تقييم الدرس":"لا يوجد تقييم")+'</button></section>'+
  '<div class="lesson-learning-actions"><button class="btn '+(completed?"btn-soft":"btn-green")+'" data-course-learning-action="complete-lesson" data-course="'+c.id+'" data-unit="'+u.id+'" data-lesson="'+l.id+'">'+(completed?"تم إكمال الدرس ✓":"إكمال الدرس ✓")+'</button><button class="btn btn-primary" data-course-learning-action="next-lesson" data-course="'+c.id+'" data-unit="'+u.id+'" data-lesson="'+l.id+'">الدرس التالي →</button></div></main>'+
  '<aside class="card lesson-learning-side"><div class="section-title"><h3>ملخص الأداء</h3><span class="badge purple">Smart</span></div><div class="stat-row"><span>الأسئلة</span><b>'+qs.length+'</b></div><div class="stat-row"><span>المختبر</span><b>'+esc(l.lab||"بدون")+'</b></div><div class="stat-row"><span>تقدم المقرر</span><b>'+coursePct(c)+'%</b></div><div class="progress"><span style="width:'+coursePct(c)+'%"></span></div></aside></div>';
}

function assessmentPage(){
  const x=activeLessonObj();
  if(!x){localStorage.removeItem(MODE);return learnerCourse()}
  const qs=lessonQuestions(x.l);
  if(!qs.length){localStorage.removeItem(MODE);return lessonPage()}
  const result=assessmentResult();
  if(result){
    const passed=result.percent>=60;
    return '<div class="page-intro"><span class="eyebrow orange">03 • تقييم الدرس</span><h2>نتيجة تقييم '+esc(x.l.title)+'</h2><p>تم تسجيل النتيجة وإرسالها لمحرك المراجعة الذكية.</p></div><div class="lesson-assessment-result card"><div class="result-icon">'+(passed?"✅":"↗")+'</div><span class="badge '+(passed?"green":"orange")+'">'+(passed?"اجتياز":"يحتاج مراجعة")+'</span><h2>'+result.score+' / '+result.total+'</h2><p>النسبة: '+result.percent+'%</p><div class="result-topic-list">'+result.results.map(r=>'<div class="stat-row"><span>'+esc(r.topic)+'</span><b class="'+(r.correct?"good-text":"bad-text")+'">'+(r.correct?"صحيح":"يحتاج مراجعة")+'</b></div>').join("")+'</div><div class="result-actions"><button class="btn btn-purple" data-course-learning-action="retry-assessment">إعادة المحاولة</button><button class="btn btn-primary" data-course-learning-action="back-lesson">العودة للدرس</button><button class="btn btn-green" data-course-learning-action="go-review">المراجعة الذكية</button></div></div>';
  }
  return '<div class="page-intro"><span class="eyebrow orange">03 • تقييم الدرس</span><h2>اختبر فهمك</h2><p>أجب عن الأسئلة ثم اضغط إرسال النتيجة.</p></div><form id="lesson-assessment-form" class="lesson-assessment-form">'+qs.map((q,i)=>'<div class="card assessment-question"><div class="question-meta"><span class="badge">'+esc(q.topic)+'</span><span class="badge">'+(q.difficulty==="hard"?"متقدم":q.difficulty==="medium"?"متوسط":"سهل")+'</span></div><h3>'+(i+1)+'. '+esc(q.q)+'</h3><div class="assessment-options">'+q.opts.map((o,j)=>'<label><input type="radio" name="q-'+i+'" value="'+j+'"><span>'+String.fromCharCode(65+j)+'. '+esc(o)+'</span></label>').join("")+'</div></div>').join("")+'<div class="lesson-assessment-actions"><button class="btn btn-orange" type="submit">إرسال التقييم</button><button class="btn btn-soft" type="button" data-course-learning-action="back-lesson">إلغاء</button></div></form>';
}

function assessmentResult(){try{const a=JSON.parse(localStorage.getItem("ipv4AcademyV38LastResult")||"null");return a||null}catch{return null}}

function submitAssessment(form){
  const x=activeLessonObj();if(!x)return{ok:false};
  const qs=lessonQuestions(x.l),results=qs.map((q,i)=>{const el=form.querySelector('input[name="q-'+i+'"]:checked');const answer=el?Number(el.value):null;return{id:q.id,topic:q.topic,correct:answer===q.a,answer,q};});
  const score=results.filter(r=>r.correct).length,total=results.length,percent=Math.round(score/total*100),payload={score,total,percent,results,timestamp:Date.now(),lessonId:x.l.id,unitId:x.u.id,courseId:x.c.id};
  localStorage.setItem("ipv4AcademyV38LastResult",JSON.stringify(payload));
  recordLessonProgress(x.c.id,x.u.id,x.l.id,percent>=60,score,total).catch(function(){});
  saveAttempts([...attempts(),{...payload}].slice(-100));
  recordPractice(results);
  const s=loadStudent();s.xp=Number(s.xp||0)+(score*10);if(percent>=60)s.progress=Math.min(100,Number(s.progress||0)+1);saveStudent(s);
  if(percent>=60)completeLesson(x.c,x.u,x.l);
  return{ok:true,rerender:true};
}

function courseProgressPage(){return lessonPage()}

export function handleLearningAction(t){
  const a=t.dataset.courseLearningAction,c=activeCourse();
  if(!c)return{page:"course",rerender:true};
  if(a==="open-lesson"){localStorage.setItem(ACTIVE_COURSE,String(t.dataset.course));localStorage.setItem(ACTIVE_LESSON,t.dataset.course+"-"+t.dataset.unit+"-"+t.dataset.lesson);localStorage.removeItem("ipv4AcademyV38LastResult");localStorage.setItem(MODE,"lesson");return{page:"lesson-content",rerender:true};}
  if(a==="back-course"){localStorage.removeItem(ACTIVE_LESSON);localStorage.removeItem(MODE);localStorage.removeItem("ipv4AcademyV38LastResult");return{page:"course",rerender:true};}
  if(a==="complete-lesson"){completeLesson(c,c.units.find(u=>u.id===Number(t.dataset.unit)),c.units.find(u=>u.id===Number(t.dataset.unit))?.lessons.find(l=>l.id===Number(t.dataset.lesson)));return{page:"lesson-content",rerender:true};}
  if(a==="next-lesson"){const all=allLessons(c),key=t.dataset.course+"-"+t.dataset.unit+"-"+t.dataset.lesson,idx=all.findIndex(x=>lessonKey(c,x.unit,x.lesson)===key),n=all[idx+1];if(n){localStorage.setItem(ACTIVE_LESSON,lessonKey(c,n.unit,n.lesson));localStorage.removeItem("ipv4AcademyV38LastResult");localStorage.setItem(MODE,"lesson");return{page:"lesson-content",rerender:true}}localStorage.removeItem(MODE);return{page:"course",rerender:true}}
  if(a==="open-assessment"){localStorage.setItem(ACTIVE_LESSON,String(t.dataset.course)+"-"+String(t.dataset.unit)+"-"+String(t.dataset.lesson));localStorage.setItem(MODE,"assessment");localStorage.removeItem("ipv4AcademyV38LastResult");return{page:"lesson-assessment",rerender:true}}
  if(a==="retry-assessment"){localStorage.removeItem("ipv4AcademyV38LastResult");localStorage.setItem(MODE,"assessment");return{page:"lesson-assessment",rerender:true}}
  if(a==="back-lesson"){localStorage.removeItem(MODE);localStorage.removeItem("ipv4AcademyV38LastResult");return{page:"lesson-content",rerender:true}}
  if(a==="go-review"){localStorage.removeItem(MODE);return{page:"review",rerender:true}}
  return{rerender:true};
}

export function isAssessmentPage(){return localStorage.getItem(MODE)==="assessment"}
export function submitLessonAssessment(form){return submitAssessment(form)}
export function assessmentView(){return assessmentPage()}
