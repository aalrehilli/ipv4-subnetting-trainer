const KEY="ipv4AcademyV31Interventions";

const demo=[
  {id:"i1",studentId:4,name:"خالد علي",group:"3",risk:"مرتفع",topic:"Subnet Mask",score:39,reason:"انخفاض الإتقان مع توقف النشاط منذ 3 أيام.",action:"جلسة علاجية + متابعة فردية",status:"open",priority:1},
  {id:"i2",studentId:2,name:"محمد خالد",group:"1",risk:"متوسط",topic:"Prefix",score:51,reason:"أخطاء متكررة رغم إكمال المحتوى الأساسي.",action:"تدريب مخصص ثم مراجعة بعد 48 ساعة",status:"open",priority:2},
  {id:"i3",studentId:6,name:"عبدالرحمن سعد",group:"1",risk:"متوسط",topic:"Magic Number",score:48,reason:"الإتقان أقل من المستوى المطلوب للانتقال إلى FLSM.",action:"تدريب قصير مستهدف",status:"open",priority:2},
  {id:"i4",studentId:1,name:"أحمد محمد",group:"1",risk:"منخفض",topic:"VLSM",score:64,reason:"تحسن واضح ويحتاج قرار انتقال بدل تدخل علاجي.",action:"تشجيع الانتقال إلى التحدي التالي",status:"open",priority:3}
];

function read(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||"null");
    return Array.isArray(raw)&&raw.length?raw:demo.map(x=>({...x}));
  }catch{return demo.map(x=>({...x}))}
}
function write(list){localStorage.setItem(KEY,JSON.stringify(list));return list}
function esc(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function riskTone(v){return v==="مرتفع"?"red":v==="متوسط"?"orange":"green"}
const FILTER_KEY="ipv4AcademyV31InterventionFilter";
function getFilter(){return localStorage.getItem(FILTER_KEY)||"open"}
export function setInterventionFilter(filter){localStorage.setItem(FILTER_KEY,filter||"open")}

export function getInterventions(){
  const list=read();
  if(!localStorage.getItem(KEY))write(list);
  return list.sort((a,b)=>a.status===b.status?a.priority-b.priority:(a.status==="open"?-1:1));
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
  if(action==="done"){item.status="done";item.completedAt=Date.now();}
  if(action==="assign"){item.status="assigned";item.assignedAt=Date.now();}
  if(action==="reopen"){item.status="open";delete item.completedAt;delete item.assignedAt;}
  write(list);
  return {rerender:true,studentId:action==="student360"?item.studentId:null};
}

function statusBadge(status){
  if(status==="done")return '<span class="badge green">تمت المعالجة</span>';
  if(status==="assigned")return '<span class="badge purple">تم التعيين</span>';
  return '<span class="badge orange">بانتظار الإجراء</span>';
}

function row(item){
  const disabled=item.status==="done";
  return '<article class="intervention-item '+item.status+'">'+
    '<div class="intervention-priority '+riskTone(item.risk)+'">'+item.priority+'</div>'+
    '<div class="intervention-main">'+
      '<div class="intervention-head"><div><strong>'+esc(item.name)+'</strong><span class="muted">المجموعة '+esc(item.group)+'</span></div><div>'+statusBadge(item.status)+'</div></div>'+
      '<div class="intervention-facts"><span><b>الخطر:</b> <em class="badge '+riskTone(item.risk)+'">'+esc(item.risk)+'</em></span><span><b>الموضوع:</b> '+esc(item.topic)+'</span><span><b>الإتقان:</b> '+item.score+'%</span></div>'+
      '<p>'+esc(item.reason)+'</p>'+
      '<div class="intervention-recommendation"><strong>الإجراء المقترح:</strong><span>'+esc(item.action)+'</span></div>'+
      '<div class="intervention-actions">'+
        '<button class="btn btn-soft mini-btn" data-intervention-action="student360" data-intervention-id="'+esc(item.id)+'">Student 360</button>'+
        (disabled
          ? '<button class="btn btn-soft mini-btn" data-intervention-action="reopen" data-intervention-id="'+esc(item.id)+'">إعادة فتح</button>'
          : '<button class="btn btn-purple mini-btn" data-intervention-action="assign" data-intervention-id="'+esc(item.id)+'">تعيين متابعة</button><button class="btn btn-green mini-btn" data-intervention-action="done" data-intervention-id="'+esc(item.id)+'">تمت المعالجة</button>')+
      '</div>'+
    '</div>'+
  '</article>';
}

export function interventionCenterView(){
  const all=getInterventions();
  const filter=getFilter();
  const list=filter==="all"?all:all.filter(x=>x.status===filter);
  const open=list.filter(x=>x.status==="open").length;
  const assigned=list.filter(x=>x.status==="assigned").length;
  const done=list.filter(x=>x.status==="done").length;
  return '<div class="page-intro with-action"><div><span class="eyebrow red">V3.1 • التدخلات</span><h2>مركز التدخل واتخاذ القرار</h2><p>حوّل تنبيهات المدرب إلى إجراء واضح، ثم تابع حالة كل تدخل حتى الإغلاق.</p></div><span class="badge red">'+open+' تحتاج إجراء</span></div>'+
    '<div class="student-grid-4 intervention-kpis">'+
      '<div class="card trainer-kpi"><div class="muted">تحتاج إجراء</div><div class="kpi-value">'+open+'</div><div class="muted">أولوية الآن</div></div>'+
      '<div class="card trainer-kpi"><div class="muted">تم التعيين</div><div class="kpi-value">'+assigned+'</div><div class="muted">قيد المتابعة</div></div>'+
      '<div class="card trainer-kpi"><div class="muted">تمت المعالجة</div><div class="kpi-value">'+done+'</div><div class="muted">مغلقة</div></div>'+
      '<div class="card trainer-kpi"><div class="muted">المنهج</div><div class="kpi-value" style="font-size:20px">تنبيه → إجراء</div><div class="muted">→ متابعة → إغلاق</div></div>'+
    '</div>'+
    '<div class="card intervention-workflow"><div><b>1</b><span>اكتشاف</span></div><div class="workflow-arrow">←</div><div><b>2</b><span>قرار</span></div><div class="workflow-arrow">←</div><div><b>3</b><span>متابعة</span></div><div class="workflow-arrow">←</div><div><b>4</b><span>إغلاق</span></div></div>'+
    '<div class="section-title"><h3>قائمة التدخلات</h3><div class="filter-chips">'+
'<button class="filter-chip '+(filter==="open"?"active":"")+'" data-intervention-action="filter" data-intervention-filter="open">مفتوحة</button>'+
'<button class="filter-chip '+(filter==="assigned"?"active":"")+'" data-intervention-action="filter" data-intervention-filter="assigned">قيد المتابعة</button>'+
'<button class="filter-chip '+(filter==="done"?"active":"")+'" data-intervention-action="filter" data-intervention-filter="done">مغلقة</button>'+
'<button class="filter-chip '+(filter==="all"?"active":"")+'" data-intervention-action="filter" data-intervention-filter="all">الكل</button></div></div>'+
    '<div class="intervention-list">'+list.map(row).join("")+'</div>';
}
