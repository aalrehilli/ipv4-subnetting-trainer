import {fetchTrainerLearningSignals} from "./supabase-v30.js?v=470";

const KEY="ipv4AcademyV31Interventions";

const demo=[
  {id:"i1",studentId:4,name:"خالد علي",group:"3",risk:"مرتفع",topic:"Subnet Mask",score:39,reason:"انخفاض الإتقان مع توقف النشاط منذ 3 أيام.",action:"جلسة علاجية + متابعة فردية",status:"open",priority:1,createdAt:Date.now()-3*86400000},
  {id:"i2",studentId:2,name:"محمد خالد",group:"1",risk:"متوسط",topic:"Prefix",score:51,reason:"أخطاء متكررة رغم إكمال المحتوى الأساسي.",action:"تدريب مخصص ثم مراجعة بعد 48 ساعة",status:"assigned",priority:2,createdAt:Date.now()-2*86400000,assignedAt:Date.now()-1*86400000,dueAt:Date.now()+86400000,assignedTo:"المدرب"},
  {id:"i3",studentId:6,name:"عبدالرحمن سعد",group:"1",risk:"متوسط",topic:"Magic Number",score:48,reason:"الإتقان أقل من المستوى المطلوب للانتقال إلى FLSM.",action:"تدريب قصير مستهدف",status:"open",priority:2,createdAt:Date.now()-86400000},
  {id:"i4",studentId:1,name:"أحمد محمد",group:"1",risk:"منخفض",topic:"VLSM",score:64,reason:"تحسن واضح ويحتاج قرار انتقال بدل تدخل علاجي.",action:"تشجيع الانتقال إلى التحدي التالي",status:"done",priority:3,createdAt:Date.now()-6*86400000,assignedAt:Date.now()-5*86400000,completedAt:Date.now()-3*86400000,outcome:"تم تنفيذ التدريب والانتقال للتحدي التالي",assignedTo:"المدرب"}
];

function read(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||"null");
    return Array.isArray(raw)&&raw.length?raw:demo.map(x=>({...x}));
  }catch{return demo.map(x=>({...x}))}
}
function write(list){localStorage.setItem(KEY,JSON.stringify(list));return list}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function riskTone(v){return v==="مرتفع"?"red":v==="متوسط"?"orange":"green"}
const FILTER_KEY="ipv4AcademyV31InterventionFilter";
function getFilter(){return localStorage.getItem(FILTER_KEY)||"open"}
export function setInterventionFilter(filter){localStorage.setItem(FILTER_KEY,filter||"open")}

function fmtDate(ts){
  if(!ts)return "—";
  try{return new Date(ts).toLocaleDateString("ar-SA",{day:"2-digit",month:"short"})}catch{return "—"}
}
function fmtDateTime(ts){
  if(!ts)return "—";
  try{return new Date(ts).toLocaleString("ar-SA",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return "—"}
}
function isOverdue(item){
  return item.status!=="done" && item.dueAt && item.dueAt<Date.now();
}
function statusTone(status){
  if(status==="done")return "green";
  if(status==="assigned")return "purple";
  return "orange";
}
function statusText(status){
  if(status==="done")return "مغلقة";
  if(status==="assigned")return "قيد المتابعة";
  return "مفتوحة";
}

export function getInterventions(){
  const list=read();
  if(!localStorage.getItem(KEY))write(list);
  return list.sort((a,b)=>{
    if(isOverdue(a)!==isOverdue(b))return isOverdue(a)?-1:1;
    if(a.status!==b.status)return a.status==="open"?-1:b.status==="open"?1:0;
    return (a.priority||9)-(b.priority||9);
  });
}

export function createIntervention(data){
  const list=getInterventions();
  const now=Date.now();
  const item={
    id:"i"+now,
    studentId:Number(data.studentId),
    name:data.name||"متدرب",
    group:String(data.group||""),
    risk:data.risk||"متوسط",
    topic:data.topic||"مراجعة",
    score:Number(data.score||0),
    reason:data.reason||"تم إنشاء التدخل من Student 360.",
    action:data.action||"تدريب مستهدف",
    status:"open",
    priority:Number(data.priority||2),
    createdAt:now,
    assignedTo:"",
    dueAt:0,
    trainerNote:"",
    outcome:""
  };
  list.push(item);
  write(list);
  return item;
}

export function getOpenInterventions(){
  return getInterventions().filter(x=>x.status==="open");
}

export function handleInterventionAction(target){
  const id=target.dataset.interventionId;
  const action=target.dataset.interventionAction;
  if(action==="filter"){setInterventionFilter(target.dataset.interventionFilter||"open");return {rerender:true}}

  const list=getInterventions();
  const item=list.find(x=>x.id===id);
  if(!item)return {rerender:true};

  if(action==="done"){
    item.status="done";
    item.completedAt=Date.now();
    item.outcome=(target.dataset.outcome||"تمت معالجة التدخل ومراجعة حالة المتدرب.").trim();
  }
  if(action==="assign"){
    item.status="assigned";
    item.assignedAt=item.assignedAt||Date.now();
    item.assignedTo=item.assignedTo||"المدرب";
    item.dueAt= item.dueAt || (Date.now()+48*60*60*1000);
  }
  if(action==="reopen"){
    item.status="open";
    delete item.completedAt;
    item.outcome="";
    item.dueAt=0;
  }
  if(action==="extend"){
    item.status="assigned";
    item.dueAt=Date.now()+48*60*60*1000;
    item.assignedAt=item.assignedAt||Date.now();
    item.assignedTo=item.assignedTo||"المدرب";
  }
  if(action==="save-note"){
    const value=document.getElementById("intervention-note-"+id)?.value||"";
    item.trainerNote=value.trim();
  }
  write(list);
  return {rerender:true,studentId:action==="student360"?item.studentId:null};
}

function statusBadge(status){
  return '<span class="badge '+statusTone(status)+'">'+statusText(status)+'</span>';
}

function row(item){
  const disabled=item.status==="done";
  const overdue=isOverdue(item);
  return '<article class="intervention-item '+item.status+' '+(overdue?"overdue":"")+'">'+
    '<div class="intervention-priority '+riskTone(item.risk)+'">'+item.priority+'</div>'+
    '<div class="intervention-main">'+
      '<div class="intervention-head"><div><strong>'+esc(item.name)+'</strong><span class="muted">المجموعة '+esc(item.group)+'</span></div><div class="intervention-status-stack">'+statusBadge(item.status)+(overdue?'<span class="badge red">متأخر</span>':"")+'</div></div>'+
      '<div class="intervention-facts"><span><b>الخطر:</b> <em class="badge '+riskTone(item.risk)+'">'+esc(item.risk)+'</em></span><span><b>الموضوع:</b> '+esc(item.topic)+'</span><span><b>الإتقان:</b> '+item.score+'%</span><span><b>الإنشاء:</b> '+fmtDate(item.createdAt)+'</span></div>'+
      '<p>'+esc(item.reason)+'</p>'+
      '<div class="intervention-recommendation"><strong>الإجراء:</strong><span>'+esc(item.action)+'</span></div>'+
      '<div class="intervention-meta-grid"><div><span>المسؤول</span><strong>'+esc(item.assignedTo||"غير معيّن")+'</strong></div><div><span>موعد المتابعة</span><strong>'+fmtDateTime(item.dueAt)+'</strong></div><div><span>آخر تحديث</span><strong>'+fmtDateTime(item.completedAt||item.assignedAt||item.createdAt)+'</strong></div></div>'+
      (item.outcome?'<div class="intervention-outcome"><strong>النتيجة:</strong> '+esc(item.outcome)+'</div>':"")+
      '<div class="intervention-note-inline"><label>ملاحظة المتابعة</label><textarea id="intervention-note-'+esc(item.id)+'" rows="2" placeholder="اكتب نتيجة المتابعة أو ملاحظة للمدرب...">'+esc(item.trainerNote||"")+'</textarea><button class="btn btn-soft mini-btn" data-intervention-action="save-note" data-intervention-id="'+esc(item.id)+'">حفظ الملاحظة</button></div>'+
      '<div class="intervention-actions">'+
        '<button class="btn btn-soft mini-btn" data-intervention-action="student360" data-intervention-id="'+esc(item.id)+'">Student 360</button>'+
        (disabled
          ? '<button class="btn btn-soft mini-btn" data-intervention-action="reopen" data-intervention-id="'+esc(item.id)+'">إعادة فتح</button>'
          : '<button class="btn btn-purple mini-btn" data-intervention-action="assign" data-intervention-id="'+esc(item.id)+'">'+(item.status==="assigned"?"تحديث الموعد":"تعيين متابعة")+'</button><button class="btn btn-green mini-btn" data-intervention-action="done" data-intervention-id="'+esc(item.id)+'" data-outcome="تمت معالجة التدخل ومراجعة حالة المتدرب.">إغلاق التدخل</button>')+
      '</div>'+
    '</div>'+
  '</article>';
}

export async function interventionCenterView(){
  const central=await fetchTrainerLearningSignals().catch(()=>({ok:false}));
  const signalTopics=central.ok?central.topics:[];
  const signalStudents=central.ok?central.students:[];
  const all=getInterventions();
  const filter=getFilter();
  const list=filter==="all"?all:all.filter(x=>x.status===filter);
  const totalOpen=all.filter(x=>x.status==="open").length;
  const totalAssigned=all.filter(x=>x.status==="assigned").length;
  const totalDone=all.filter(x=>x.status==="done").length;
  const totalOverdue=all.filter(isOverdue).length;
  const avgScore=all.length?Math.round(all.reduce((a,x)=>a+Number(x.score||0),0)/all.length):0;
  return '<div class="page-intro with-action"><div><span class="eyebrow red">V3.68 • مركز التدخل</span><h2>مركز التدخل والمتابعة</h2><p>إدارة دورة التدخل كاملة: اكتشاف → تعيين → متابعة → نتيجة → إغلاق.</p></div><div class="intervention-head-actions"><span class="badge red">'+totalOpen+' مفتوحة</span><button class="btn btn-primary" data-trainer-page="students">إدارة المتدربين</button></div></div>'+
    '<div class="student-grid-4 intervention-kpis">'+
      '<div class="card trainer-kpi"><div class="muted">مفتوحة</div><div class="kpi-value">'+totalOpen+'</div><div class="muted">تحتاج إجراء</div></div>'+
      '<div class="card trainer-kpi"><div class="muted">قيد المتابعة</div><div class="kpi-value">'+totalAssigned+'</div><div class="muted">لها موعد متابعة</div></div>'+
      '<div class="card trainer-kpi"><div class="muted">متأخرة</div><div class="kpi-value" style="color:var(--red)">'+totalOverdue+'</div><div class="muted">تجاوزت الموعد</div></div>'+
      '<div class="card trainer-kpi"><div class="muted">مغلقة</div><div class="kpi-value">'+totalDone+'</div><div class="muted">متوسط الإتقان عند الإنشاء '+avgScore+'%</div></div>'+
    '</div>'+
    '<div class="card intervention-workflow v314-workflow"><div><b>1</b><span>اكتشاف</span><small>نقطة ضعف</small></div><div class="workflow-arrow">←</div><div><b>2</b><span>تعيين</span><small>مسؤول + موعد</small></div><div class="workflow-arrow">←</div><div><b>3</b><span>متابعة</span><small>ملاحظة + قياس</small></div><div class="workflow-arrow">←</div><div><b>4</b><span>إغلاق</span><small>نتيجة واضحة</small></div></div>'+
    (central.ok?'<section class="card" style="margin-bottom:14px;border-right:4px solid var(--purple)"><div class="section-title"><div><span class="eyebrow purple">V3.68 • إشارات النتائج</span><h3>الحالات المستخرجة من الاختبارات المركزية</h3><p class="muted">إشارات تحليلية من النتائج المركزية تساعد المدرب على تحديد أولوية التدخل.</p></div><span class="badge purple">'+signalStudents.length+' متدرب</span></div><div class="grid-2"><div><h4>أضعف الموضوعات</h4>'+
      (signalTopics.length?signalTopics.slice(0,6).map(t=>'<div class="stat-row"><span>'+esc(t.topic)+'</span><strong>'+Number(t.accuracy||0)+'%</strong></div><div class="progress"><span style="width:'+Number(t.accuracy||0)+'%"></span></div>').join(""):'<div class="empty">لا توجد نتائج مركزية.</div>')+
      '</div><div><h4>أولوية المتدربين</h4>'+
      (signalStudents.length?signalStudents.slice(0,6).map((s,i)=>'<div class="risk-row"><div class="risk-rank">'+(i+1)+'</div><div class="risk-person"><strong>'+esc(s.student_name||"متدرب")+'</strong><span class="muted">المجموعة '+esc(s.group_no||"—")+'</span></div><span class="badge '+(Number(s.avg_percent||0)<60?"red":"orange")+'">'+Number(s.avg_percent||0)+'%</span><div class="risk-topic"><span class="muted">'+Number(s.attempts||0)+' محاولات</span></div></div>').join(""):'<div class="empty">لا توجد محاولات مركزية بعد.</div>')+
      '</div></div></section>':'')+
    '<div class="section-title"><h3>التدخلات</h3><div class="filter-chips">'+
      '<button class="filter-chip '+(filter==="open"?"active":"")+'" data-intervention-filter="open">مفتوحة ('+totalOpen+')</button>'+
      '<button class="filter-chip '+(filter==="assigned"?"active":"")+'" data-intervention-filter="assigned">قيد المتابعة ('+totalAssigned+')</button>'+
      '<button class="filter-chip '+(filter==="done"?"active":"")+'" data-intervention-filter="done">مغلقة ('+totalDone+')</button>'+
      '<button class="filter-chip '+(filter==="all"?"active":"")+'" data-intervention-filter="all">الكل ('+all.length+')</button>'+
    '</div></div>'+
    '<div class="intervention-list">'+(list.length?list.map(row).join(""):'<div class="card empty"><h3>لا توجد تدخلات</h3><p class="muted">غيّر الفلتر أو أنشئ تدخلًا جديدًا من Student 360.</p></div>')+'</div>';
}
