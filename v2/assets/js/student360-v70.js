import {fetchTrainerStudent360} from "./supabase-v30.js?v=472";
import {getInterventions,createIntervention} from "./intervention-v31.js";

const KEY="ipv4AcademyV29Trainer360";
let noteStore={};
try{noteStore=JSON.parse(localStorage.getItem(KEY)||"{}")}catch{}
function saveNotes(){localStorage.setItem(KEY,JSON.stringify(noteStore))}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function riskClass(r){return r==="مرتفع"?"red":r==="متوسط"?"orange":"green"}
function interventionCard(item){
  if(!item)return '<div class="empty student360-empty-mini">لا يوجد تدخل محلي مسجل حاليًا.</div>';
  const tone=item.status==="done"?"green":item.status==="assigned"?"purple":"orange";
  const label=item.status==="done"?"تمت المعالجة":item.status==="assigned"?"قيد المتابعة":"مفتوح";
  return '<div class="student360-intervention-card '+item.status+'"><div><span class="badge '+tone+'">'+label+'</span></div><strong>'+esc(item.action||"تدخل")+'</strong><p class="muted">'+esc(item.reason||"")+'</p><div class="student360-intervention-meta"><span>الموضوع: <b>'+esc(item.topic||"")+'</b></span><span>الإتقان: <b>'+Number(item.score||0)+'%</b></span></div></div>';
}
function existingIntervention(studentKey){return getInterventions().find(x=>String(x.studentId)===String(studentKey))||null}

function centralView(data){
  const p=data.profile||{},s=data.summary||{},topics=data.topics||[],courses=data.courses||[],attempts=data.attempts||[];
  const risk=data.risk||"منخفض",weak=topics[0],key=p.studentId||p.id||"";
  const last=s.lastActivity?new Date(s.lastActivity):null;
  const lastText=last?last.toLocaleString("ar-SA",{dateStyle:"medium",timeStyle:"short"}):"لا يوجد نشاط مركزي بعد";
  const activityTone=!last?"orange":(Date.now()-last.getTime()<7*86400000?"green":"red");
  const localIntervention=existingIntervention(key);
  const decision=weak?(risk==="مرتفع"?"جلسة علاجية فردية + إعادة قياس خلال 48 ساعة":risk==="متوسط"?"تدريب مستهدف + مراجعة خلال 48 ساعة":"متابعة عادية والسماح بالتقدم"):"بانتظار أول نتيجة مركزية";
  const topicHtml=topics.map(t=>'<div class="mastery-360-row"><div><strong>'+esc(t.topic)+'</strong><span class="badge '+(Number(t.accuracy||0)<50?"red":Number(t.accuracy||0)<70?"orange":"green")+'">'+Number(t.accuracy||0)+'%</span></div><div class="progress"><span style="width:'+Number(t.accuracy||0)+'%"></span></div><small>'+esc(t.status||"")+' • '+Number(t.attempts||0)+' إجابة</small></div>').join("");
  const courseHtml=courses.map(x=>'<div class="card"><div class="section-title"><div><h3>'+esc(x.title||"مقرر")+'</h3><span class="muted">'+Number(x.completedLessons||0)+' / '+Number(x.totalLessons||0)+' دروس</span></div><strong>'+Number(x.mastery||0)+'%</strong></div><div class="progress"><span style="width:'+Number(x.mastery||0)+'%"></span></div><div class="course-stats"><span>الدروس '+Number(x.lessonProgress||0)+'%</span><span>الاختبارات '+Number(x.examAvg||0)+'%</span><span>التقييم '+Number(x.assessmentAvg||0)+'%</span></div></div>').join("");
  const attemptHtml=attempts.slice(0,8).map(a=>'<tr><td>'+esc(a.title||"اختبار")+'</td><td>'+Number(a.attemptNo||1)+'</td><td><strong>'+Number(a.percent||0)+'%</strong></td><td><span class="badge '+(a.passed?"green":"orange")+'">'+(a.passed?"ناجح":"يحتاج مراجعة")+'</span></td><td>'+esc(a.submittedAt?new Date(a.submittedAt).toLocaleString("ar-SA",{dateStyle:"short",timeStyle:"short"}):"—")+'</td></tr>').join("");
  return '<div class="page-intro with-action"><div><span class="eyebrow purple">Student 360 • V3.70</span><h2>'+esc(p.name||"متدرب")+'</h2><p>رقم المتدرب '+esc(p.studentId||"—")+' • المجموعة '+esc(p.groupNo||"—")+' • آخر نشاط '+esc(lastText)+'</p></div><div class="student360-head-actions"><span class="badge '+riskClass(risk)+'">'+esc(risk)+'</span><button class="btn btn-soft" data-trainer-page="students">رجوع للمتدربين</button><button class="btn btn-primary" data-trainer-page="interventions">مركز التدخل</button></div></div>'+
  '<div class="student360-banner"><div class="student360-profile"><div class="student360-avatar">'+esc((p.name||"م").slice(0,1))+'</div><div><span class="muted">ملف المتدرب المركزي</span><h3>'+esc(p.name||"متدرب")+'</h3><p>البيانات الرسمية من Supabase: الإتقان، الدروس، الاختبارات والنشاط.</p><div class="student360-tags"><span class="badge">المجموعة '+esc(p.groupNo||"—")+'</span><span class="badge '+riskClass(risk)+'">'+esc(risk)+'</span><span class="badge '+activityTone+'">'+(last?"نشاط حديث":"لا يوجد نشاط")+'</span></div></div></div><div class="student360-risk"><span class="badge '+riskClass(risk)+'">'+esc(risk)+'</span><strong>'+Number(s.overall||0)+'%</strong><small>الإتقان الموحد</small></div></div>'+
  '<div class="student360-kpis"><div class="card student-stat"><div class="muted">الإتقان العام</div><div class="kpi-value">'+Number(s.overall||0)+'%</div><div class="muted">مؤشر موحد</div></div><div class="card student-stat"><div class="muted">تقدم الدروس</div><div class="kpi-value">'+Number(s.lessonProgress||0)+'%</div><div class="muted">المحتوى</div></div><div class="card student-stat"><div class="muted">متوسط الاختبارات</div><div class="kpi-value">'+Number(s.examAvg||0)+'%</div><div class="muted">'+Number(s.examAttempts||0)+' محاولة</div></div><div class="card student-stat"><div class="muted">آخر نشاط</div><div class="kpi-value" style="font-size:17px">'+esc(last?last.toLocaleDateString("ar-SA"):"—")+'</div><div class="muted">النشاط المركزي</div></div></div>'+
  '<div class="section-title"><h3>القرار المقترح</h3><span class="badge purple">Decision Engine</span></div><div class="student360-decision card"><div class="decision-main"><span class="eyebrow '+riskClass(risk)+'">مبني على البيانات</span><h2>'+esc(decision)+'</h2><p class="muted">'+(weak?'أضعف موضوع: <strong>'+esc(weak.topic)+'</strong> عند <strong>'+Number(weak.accuracy||0)+'%</strong>.':'لا توجد نتائج اختبار مركزية كافية بعد.')+'</p></div><div class="decision-actions"><button class="btn btn-purple" data-360-action="assign" data-student-id="'+esc(key)+'">تنفيذ القرار</button></div></div>'+
  '<div class="section-title"><h3>خريطة الإتقان حسب الموضوع</h3><span class="badge purple">Central Mastery</span></div><div class="card mastery-360">'+(topicHtml||'<div class="empty">لا توجد إجابات مركزية بعد.</div>')+'</div>'+
  '<div class="section-title"><h3>إتقان المقررات</h3><span class="badge blue">'+courses.length+' مقرر</span></div><div class="grid-2">'+(courseHtml||'<div class="card empty">لا توجد بيانات مقررات مركزية بعد.</div>')+'</div>'+
  '<div class="section-title"><h3>سجل الاختبارات</h3><span class="badge">'+attempts.length+' محاولة</span></div><div class="card"><div class="table-scroll"><table class="table trainer-results-table"><thead><tr><th>الاختبار</th><th>المحاولة</th><th>النتيجة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>'+(attemptHtml||'<tr><td colspan="5"><div class="empty">لا توجد محاولات مركزية بعد.</div></td></tr>')+'</tbody></table></div></div>'+
  '<div class="grid-2"><div class="card"><div class="section-card-head"><h3>النشاط والحضور</h3><span class="badge '+activityTone+'">'+(last?"نشاط مسجل":"غير متوفر")+'</span></div><div class="analysis-box"><strong>آخر نشاط</strong><p class="muted">'+esc(lastText)+'</p></div><div class="analysis-box"><strong>الحضور</strong><p class="muted">لا يوجد مصدر حضور مركزي حاليًا؛ لن يتم عرض نسبة مصطنعة.</p></div></div>'+
  '<div class="card"><div class="section-card-head"><h3>التدخل</h3><span class="badge '+(localIntervention?"orange":"green")+'">'+(localIntervention?"محلي":"لا يوجد")+'</span></div>'+interventionCard(localIntervention)+'</div></div>'+
  '<div class="card trainer-note-card"><div class="section-card-head"><h3>ملاحظة المدرب</h3><span class="muted">محلية حاليًا</span></div><textarea id="trainer-note-'+esc(key)+'" rows="4">'+esc(localIntervention?.trainerNote||"")+'</textarea><div class="trainer-note-actions"><button class="btn btn-primary" data-360-action="save-note" data-student-id="'+esc(key)+'">حفظ الملاحظة</button></div></div>';
}
export async function student360View(id){
  const central=await fetchTrainerStudent360(String(id)).catch(()=>({ok:false}));
  if(central.ok)return centralView(central);
  return '<div class="page-intro"><span class="eyebrow purple">Student 360 • V3.70</span><h2>لا يوجد ملف مركزي لهذا المتدرب</h2><p>المعرف الحالي لا يرتبط بحساب متدرب مركزي في Supabase.</p></div><div class="card"><h3>تمت حماية البيانات</h3><p class="muted">لم يتم عرض البيانات التجريبية على أنها بيانات حقيقية.</p><button class="btn btn-primary" data-trainer-page="students">العودة للمتدربين</button></div>';
}
export function handleStudent360Action(target){
  const id=String(target.dataset.studentId||"");
  const action=target.dataset["360Action"];
  if(action==="save-note"){
    const value=document.getElementById("trainer-note-"+id)?.value||"";
    noteStore[id]=value.trim();
    saveNotes();
    return {rerender:true}
  }
  if(action==="assign"){
    const item=createIntervention({studentId:id,name:"المتدرب",group:"",risk:"متوسط",topic:"مراجعة",score:50,reason:"تم إنشاء التدخل من Student 360 المركزي.",action:"تدريب مستهدف",priority:2});
    noteStore[id]="تم إنشاء التدخل: "+item.action;
    saveNotes();
    return {rerender:true}
  }
  return null
}
