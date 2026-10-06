import {getLearningSnapshot} from "./smart-engine-v28.js";
import {getInterventions,createIntervention} from "./intervention-v31.js";
import {getTrainerExamSummary} from "./exam-v23.js";

const KEY="ipv4AcademyV29Trainer360";
const profiles={
1:{id:1,name:"أحمد محمد",group:"1",progress:84,avg:88,risk:"منخفض",activity:"نشط",last:"اليوم",trend:"+8%",weakness:"VLSM",attendance:"96%",practice:34,exams:4,labs:9,note:"طالب منتظم وقريب من مستوى الإتقان."},
2:{id:2,name:"محمد خالد",group:"1",progress:62,avg:58,risk:"متوسط",activity:"متوسط",last:"أمس",trend:"-3%",weakness:"Prefix",attendance:"82%",practice:21,exams:3,labs:5,note:"يحتاج تثبيت Prefix قبل الانتقال إلى FLSM."},
3:{id:3,name:"سارة عبدالله",group:"2",progress:91,avg:94,risk:"منخفض",activity:"نشط",last:"اليوم",trend:"+5%",weakness:"—",attendance:"98%",practice:41,exams:5,labs:12,note:"جاهزة لمسار متقدم."},
4:{id:4,name:"خالد علي",group:"3",progress:47,avg:42,risk:"مرتفع",activity:"متوقف",last:"قبل 3 أيام",trend:"-14%",weakness:"Subnet Mask",attendance:"61%",practice:10,exams:2,labs:2,note:"يحتاج تدخلًا فرديًا سريعًا."},
5:{id:5,name:"نورة سالم",group:"2",progress:73,avg:69,risk:"متوسط",activity:"متوسط",last:"أمس",trend:"+2%",weakness:"Binary",attendance:"88%",practice:28,exams:3,labs:7,note:"تحسن ملحوظ مع استمرار التدريب."},
6:{id:6,name:"عبدالرحمن سعد",group:"1",progress:58,avg:61,risk:"متوسط",activity:"نشط",last:"اليوم",trend:"+1%",weakness:"Magic Number",attendance:"91%",practice:25,exams:3,labs:6,note:"يحتاج مراجعة قصيرة ومتكررة."}
};

let noteStore=loadNotes();
function loadNotes(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
function saveNotes(){localStorage.setItem(KEY,JSON.stringify(noteStore))}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function riskClass(r){return r==="مرتفع"?"red":r==="متوسط"?"orange":"green"}
function masteryFor(p){
 const base={IPv4:Math.min(100,p.avg+4),Binary:p.weakness==="Binary"?56:72,Prefix:p.weakness==="Prefix"?51:61,"Subnet Mask":p.weakness==="Subnet Mask"?39:56,FLSM:66,VLSM:p.weakness==="VLSM"?42:58};
 if(p.id===1){const engine=getLearningSnapshot();return Object.assign(base,engine.scores)}
 return base
}
function decisionFor(p,weakScore){
 return p.risk==="مرتفع"
  ? "جلسة علاجية فردية اليوم + إعادة قياس خلال 48 ساعة"
  : p.risk==="متوسط"
  ? "تدريب مستهدف + مراجعة ذكية خلال 48 ساعة"
  : weakScore<70
  ? "مراجعة قصيرة ثم إعادة القياس"
  : "السماح بالانتقال للمحتوى التالي";
}
function existingIntervention(studentId){
 return getInterventions().filter(x=>Number(x.studentId)===Number(studentId)).sort((a,b)=>a.status===b.status?a.priority-b.priority:(a.status==="open"?-1:1))[0]||null;
}
function statusText(status){
 if(status==="done") return ["تمت المعالجة","green"];
 if(status==="assigned") return ["قيد المتابعة","purple"];
 return ["مفتوح","orange"];
}
function interventionCard(item){
 if(!item) return '<div class="empty student360-empty-mini">لا يوجد تدخل مسجل حاليًا.</div>';
 const st=statusText(item.status);
 return '<div class="student360-intervention-card '+item.status+'"><div><span class="badge '+st[1]+'">'+st[0]+'</span><span class="muted"> #'+esc(item.id)+'</span></div>'+
   '<strong>'+esc(item.action)+'</strong><p class="muted">'+esc(item.reason)+'</p>'+
   '<div class="student360-intervention-meta"><span>الموضوع: <b>'+esc(item.topic)+'</b></span><span>الإتقان: <b>'+item.score+'%</b></span></div></div>';
}

export function student360View(id){
 const p=profiles[Number(id)]||profiles[1];
 const mastery=masteryFor(p);
 const ranked=Object.entries(mastery).map(x=>({topic:x[0],score:Math.max(0,Math.min(100,Math.round(x[1])))})).sort((a,b)=>a.score-b.score);
 const weak=ranked[0];
 const note=noteStore[p.id]||p.note;
 const decision=decisionFor(p,weak.score);
 const currentIntervention=existingIntervention(p.id);
 const exam=getTrainerExamSummary().lastResult;
 const examStatus=exam?exam.percent+"% • "+(exam.passed?"ناجح":"يحتاج مراجعة"):"لا توجد محاولة حديثة";
 const masteryHtml=ranked.map(x=>'<div class="mastery-360-row"><div><strong>'+esc(x.topic)+'</strong><span class="badge '+(x.score<50?"red":x.score<70?"orange":"green")+'">'+x.score+'%</span></div><div class="progress"><span style="width:'+x.score+'%"></span></div><small>'+(x.score>=80?"متقن":x.score>=65?"جيد":x.score>=50?"يحتاج تدريب":"يحتاج تدخل")+'</small></div>').join("");

 return '<div class="page-intro with-action"><div><span class="eyebrow purple">Student 360 • V3.13</span><h2>'+esc(p.name)+'</h2><p>المجموعة '+esc(p.group)+' • آخر نشاط '+esc(p.last)+' • الاتجاه '+esc(p.trend)+'</p></div><div class="student360-head-actions"><button class="btn btn-soft" data-trainer-page="students">رجوع للمتدربين</button><button class="btn btn-primary" data-trainer-page="interventions">مركز التدخل</button></div></div>'+
 '<div class="student360-banner"><div class="student360-profile"><div class="student360-avatar">'+esc(p.name.slice(0,1))+'</div><div><span class="muted">حالة المتدرب</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.note)+'</p><div class="student360-tags"><span class="badge">المجموعة '+esc(p.group)+'</span><span class="badge '+riskClass(p.risk)+'">'+esc(p.risk)+'</span><span class="badge '+(p.activity==="متوقف"?"red":"green")+'">'+esc(p.activity)+'</span></div></div></div><div class="student360-risk"><span class="badge '+riskClass(p.risk)+'">'+esc(p.risk)+'</span><strong>'+p.progress+'%</strong><small>تقدم المقرر</small></div></div>'+
 '<div class="student360-kpis"><div class="card student-stat"><div class="muted">متوسط الأداء</div><div class="kpi-value">'+p.avg+'%</div><div class="muted">متوسط الاختبارات</div></div><div class="card student-stat"><div class="muted">الحضور</div><div class="kpi-value">'+esc(p.attendance)+'</div><div class="muted">المؤشر الحالي</div></div><div class="card student-stat"><div class="muted">التدريبات</div><div class="kpi-value">'+p.practice+'</div><div class="muted">محاولة</div></div><div class="card student-stat"><div class="muted">آخر اختبار</div><div class="kpi-value" style="font-size:20px">'+esc(exam?exam.percent+"%":"—")+'</div><div class="muted">'+esc(exam?examStatus:"لم يسجل بعد")+'</div></div></div>'+
 '<div class="section-title"><h3>القرار المقترح</h3><span class="badge red">مبني على البيانات</span></div><div class="student360-decision card"><div class="decision-main"><span class="eyebrow '+(p.risk==="مرتفع"?"red":p.risk==="متوسط"?"orange":"green")+'">Decision Engine</span><h2>'+esc(decision)+'</h2><p class="muted">أضعف موضوع: <strong>'+esc(weak.topic)+'</strong> عند <strong>'+weak.score+'%</strong> • الخطر: <strong>'+esc(p.risk)+'</strong>.</p></div><div class="decision-actions"><button class="btn btn-purple" data-360-action="assign" data-student-id="'+p.id+'">تنفيذ القرار</button><button class="btn btn-soft" data-360-action="save-decision-note" data-student-id="'+p.id+'">إضافة القرار للملاحظة</button></div></div>'+
 '<div class="section-title"><h3>خريطة الإتقان</h3><span class="badge purple">Smart Engine</span></div><div class="card mastery-360">'+masteryHtml+'</div>'+
 '<div class="grid-2 student360-main-grid"><div class="card"><div class="section-card-head"><h3>تحليل المدرب</h3><span class="badge '+(weak.score<50?"red":weak.score<70?"orange":"green")+'">أضعف موضوع</span></div><div class="analysis-box"><strong>'+esc(weak.topic)+'</strong><p class="muted">'+weak.score+'% — '+(weak.score<50?"يحتاج تدخل":weak.score<70?"يحتاج تدريب":"مستوى جيد")+'</p></div><div class="analysis-box"><strong>سبب القرار</strong><p class="muted">توازن بين الأداء، النشاط، الحضور، والنتيجة الأخيرة.</p></div><div class="analysis-box"><strong>الخطوة التعليمية</strong><p class="muted">'+esc(decision)+'</p></div></div>'+
 '<div class="card"><div class="section-card-head"><h3>سجل التعلم</h3><span class="badge">آخر 4 أحداث</span></div><div class="timeline-360"><div><b>اليوم</b><span>تمرين '+esc(weak.topic)+'</span><strong>'+weak.score+'%</strong></div><div><b>أمس</b><span>مراجعة Prefix</span><strong>'+p.avg+'%</strong></div><div><b>قبل يومين</b><span>اختبار IPv4 & Binary</span><strong>'+p.avg+'%</strong></div><div><b>قبل 3 أيام</b><span>Subnetting Lab</span><strong>مكتمل</strong></div></div></div></div>'+
 '<div class="section-title"><h3>التدخل الحالي</h3><span class="badge '+(currentIntervention?"orange":"green")+'">'+(currentIntervention?"متابعة":"لا يوجد تدخل")+'</span></div><div class="card">'+interventionCard(currentIntervention)+'</div>'+
 '<div class="section-title"><h3>ملاحظة المدرب</h3><span class="muted">تُحفظ محليًا حتى ربط قاعدة البيانات</span></div><div class="card trainer-note-card"><textarea id="trainer-note-'+p.id+'" rows="4">'+esc(note)+'</textarea><div class="trainer-note-actions"><button class="btn btn-primary" data-360-action="save-note" data-student-id="'+p.id+'">حفظ الملاحظة</button><button class="btn btn-soft" data-360-action="save-decision-note" data-student-id="'+p.id+'">حفظ القرار مع الملاحظة</button></div></div>'+
 '<div class="section-title"><h3>إجراءات المدرب</h3></div><div class="student360-actions-grid"><button class="action-card" data-360-action="assign" data-student-id="'+p.id+'"><strong>تعيين التدخل</strong><span class="muted">إنشاء متابعة مرتبطة بنقطة الضعف</span></button><button class="action-card" data-trainer-page="analytics"><strong>تحليل الأداء</strong><span class="muted">الانتقال إلى التحليلات العامة</span></button><button class="action-card" data-trainer-page="exams"><strong>الاختبارات</strong><span class="muted">مراجعة نتيجة الاختبار</span></button><button class="action-card" data-trainer-page="students" data-risk="'+(p.risk==="منخفض"?"منخفض":p.risk)+'"><strong>قائمة المتدربين</strong><span class="muted">عودة مع الاحتفاظ بسياق المتابعة</span></button></div>';
}

export function handleStudent360Action(target){
 const id=Number(target.dataset.studentId);
 const p=profiles[id];
 const action=target.dataset["360Action"];
 if(!p)return null;
 if(action==="save-note"){
   const value=document.getElementById("trainer-note-"+id)?.value||"";
   noteStore[id]=value.trim()||p.note;
   saveNotes();
   return {rerender:true}
 }
 if(action==="save-decision-note"){
   const value=document.getElementById("trainer-note-"+id)?.value||"";
   noteStore[id]=(value.trim()?value.trim()+" — ":"")+"قرار المدرب: "+decisionFor(p,Math.min(...Object.values(masteryFor(p))))+" — "+new Date().toLocaleDateString("ar-SA");
   saveNotes();
   return {rerender:true}
 }
 if(action==="assign"){
   const mastery=masteryFor(p);
   const weak=Object.entries(mastery).sort((a,b)=>a[1]-b[1])[0];
   const created=createIntervention({
     studentId:p.id,name:p.name,group:p.group,risk:p.risk,topic:weak[0],score:Math.round(weak[1]),
     reason:"تم إنشاء التدخل من Student 360 بناءً على نقطة الضعف الحالية.",
     action:decisionFor(p,weak[1]),
     priority:p.risk==="مرتفع"?1:p.risk==="متوسط"?2:3
   });
   noteStore[id]="تم إنشاء التدخل: "+created.action+" — "+new Date().toLocaleDateString("ar-SA");
   saveNotes();
   return {rerender:true}
 }
 return null
}
