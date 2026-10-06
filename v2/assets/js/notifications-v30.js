import {getLearningSnapshot,getSmartRecommendation} from "./smart-engine-v28.js";

const KEY="ipv4AcademyV30Notifications";
const VERSION="v30";

function now(){return Date.now()}
function uid(role,type,subject=""){return [VERSION,role,type,subject].join(":")}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function write(list){localStorage.setItem(KEY,JSON.stringify(list.slice(0,60)));return list}
function esc(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function icon(type){return type==="danger"?"!":type==="success"?"✓":type==="warning"?"⚠":"✦"}
function tone(type){return type==="danger"?"red":type==="success"?"green":type==="warning"?"orange":"purple"}
function pageFor(item){return item.page||""}
const FILTER_KEY="ipv4AcademyV30NotificationFilter";
function getFilter(role){return localStorage.getItem(FILTER_KEY+":"+role)||"all"}
export function setNotificationFilter(role,filter){localStorage.setItem(FILTER_KEY+":"+role,filter||"all")}

export function getNotifications(role="student"){
  const list=read();
  return list.filter(x=>x.role===role).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
}

export function getUnreadCount(role="student"){
  return getNotifications(role).filter(x=>!x.read).length;
}

function add(list,item){
  if(list.some(x=>x.id===item.id))return;
  list.push(item);
}

export function syncSmartNotifications(role="student"){
  const list=read();
  const stamp=now();
  if(role==="student"){
    const snapshot=getLearningSnapshot();
    const recommendation=getSmartRecommendation();
    const weak=snapshot.weak?.[0];
    if(weak){
      add(list,{
        id:uid("student","weak-topic",weak.topic),
        role,
        type:weak.score<50?"danger":"warning",
        title:"مراجعة مطلوبة",
        body:"المحرك الذكي يرشح "+weak.topic+" كأولوية الآن، وإتقانك الحالي "+weak.score+"%.",
        page:"review",
        action:"ابدأ المراجعة",
        createdAt:stamp,
        read:false
      });
    }
    const exam=localStorage.getItem("ipv4AcademyV23ExamResult");
    if(exam){
      add(list,{
        id:uid("student","exam-ready"),
        role,
        type:"success",
        title:"نتيجة الاختبار جاهزة",
        body:"تم تسجيل آخر نتيجة اختبار، ويمكنك الانتقال إلى التحليل والمراجعة الذكية.",
        page:"exams",
        action:"عرض النتيجة",
        createdAt:stamp-1000,
        read:false
      });
    }
    const strong=(snapshot.strong||[])[0];
    if(strong && strong.score>=80){
      add(list,{
        id:uid("student","ready",strong.topic),
        role,
        type:"success",
        title:"أنت جاهز للخطوة التالية",
        body:"إتقانك في "+strong.topic+" وصل إلى "+strong.score+"%. التوصية الحالية: "+recommendation.title+".",
        page:recommendation.page||"course",
        action:"متابعة المسار",
        createdAt:stamp-2000,
        read:false
      });
    }
    if(!list.some(x=>x.role==="student"&&x.type==="info")){
      add(list,{
        id:uid("student","welcome"),
        role,
        type:"info",
        title:"مرحبًا بك في مركز المتابعة",
        body:"ستظهر هنا أهم التنبيهات التعليمية بدل تشتيتك بكثرة الإشعارات.",
        page:"progress",
        action:"عرض التقدم",
        createdAt:stamp-3000,
        read:false
      });
    }
  }else{
    const risky="خالد علي";
    add(list,{
      id:uid("trainer","risk",risky),
      role,
      type:"danger",
      title:"متدرب يحتاج تدخلًا",
      body:risky+" في المجموعة 3: التقدم 47% ومتوسط الأداء 42% وآخر نشاط قبل 3 أيام.",
      page:"students",
      action:"فتح قائمة المتابعة",
      studentId:4,
      createdAt:stamp,
      read:false
    });
    add(list,{
      id:uid("trainer","topic","VLSM"),
      role,
      type:"warning",
      title:"VLSM يحتاج تدخّلًا",
      body:"إتقان الموضوع في لوحة المتابعة منخفض، ويستحق جلسة علاجية قصيرة قبل الانتقال.",
      page:"analytics",
      action:"عرض التحليلات",
      createdAt:stamp-1000,
      read:false
    });
    add(list,{
      id:uid("trainer","improved","أحمد محمد"),
      role,
      type:"success",
      title:"تحسن ملحوظ",
      body:"أحمد محمد سجّل اتجاهًا إيجابيًا قدره +8% وأصبح قريبًا من مرحلة الانتقال التالية.",
      page:"students",
      action:"فتح Student 360",
      studentId:1,
      createdAt:stamp-2000,
      read:false
    });
    add(list,{
      id:uid("trainer","review","محمد خالد"),
      role,
      type:"warning",
      title:"متابعة مجدولة",
      body:"محمد خالد في مستوى متوسط ويحتاج تدريب Prefix ومراجعة بعد 48 ساعة.",
      page:"students",
      action:"فتح قائمة المتابعة",
      studentId:2,
      createdAt:stamp-3000,
      read:false
    });
    if(localStorage.getItem("ipv4AcademyV23ExamResult")){
      add(list,{
        id:uid("trainer","exam-published"),
        role,
        type:"info",
        title:"تم تسجيل نتيجة اختبار",
        body:"هناك محاولة اختبار جديدة متاحة للتحليل في لوحة الاختبارات.",
        page:"exams",
        action:"عرض الاختبار",
        createdAt:stamp-4000,
        read:false
      });
    }
  }
  return write(list);
}

export function markNotificationRead(id){
  const list=read().map(x=>x.id===id?{...x,read:true,readAt:now()}:x);
  return write(list);
}

export function resetNotifications(){localStorage.removeItem(KEY)}

export function markAllNotificationsRead(role){
  const list=read().map(x=>x.role===role?{...x,read:true,readAt:now()}:x);
  return write(list);
}

export function handleNotificationAction(target,role="student"){
  const action=target.dataset.notificationAction;
  const id=target.dataset.notificationId;
  if(action==="filter"){setNotificationFilter(role,target.dataset.notificationFilter||"all");return {rerender:true}}
  if(action==="read"&&id)markNotificationRead(id);
  if(action==="all-read")markAllNotificationsRead(role);
  const list=syncSmartNotifications(role);
  const item=id?list.find(x=>x.id===id):null;
  return {rerender:true,page:pageFor(item)};
}

function emptyState(){
  return '<div class="card notification-empty"><div class="notification-empty-icon">✓</div><h3>لا توجد إشعارات جديدة</h3><p class="muted">ستظهر هنا التنبيهات التي تحتاج انتباهك أو خطوة تالية واضحة.</p></div>';
}

function itemHtml(item){
  return '<article class="notification-item '+(item.read?"read":"unread")+'">'+
    '<div class="notification-icon '+tone(item.type)+'">'+icon(item.type)+'</div>'+
    '<div class="notification-body"><div class="notification-top"><div><strong>'+esc(item.title)+'</strong><span class="badge '+tone(item.type)+'">'+(item.read?"مقروء":"جديد")+'</span></div><small>'+new Date(item.createdAt).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})+'</small></div>'+
    '<p>'+esc(item.body)+'</p>'+
    '<div class="notification-actions">'+
    '<button class="btn btn-soft mini-btn" data-notification-action="read" data-notification-id="'+esc(item.id)+'">'+(item.read?"✓ تم الاطلاع":"تعليم كمقروء")+'</button>'+
    (item.page?'<button class="btn btn-primary mini-btn" data-notification-action="read" data-notification-id="'+esc(item.id)+'" data-notification-page="'+esc(item.page)+'" data-notification-student="'+(item.studentId||"") +'">'+esc(item.action||"فتح")+'</button>':"")+
    '</div></div></article>';
}

export function notificationsPage(role="student"){
  syncSmartNotifications(role);
  const all=getNotifications(role);
  const filter=getFilter(role);
  const list=filter==="all"?all:filter==="unread"?all.filter(x=>!x.read):all.filter(x=>x.type==="danger"||x.type==="warning");
  const unread=all.filter(x=>!x.read).length;
  const title=role==="student"?"مركز إشعاراتك":"مركز إشعارات المدرب";
  const desc=role==="student"
    ?"تنبيهات مختصرة مرتبطة بأدائك، نتائجك، والخطوة التعليمية التالية."
    :"تنبيهات تقودك مباشرة إلى الطلاب أو الموضوعات التي تحتاج قرارًا.";
  return '<div class="page-intro with-action"><div><span class="eyebrow '+(role==="student"?"purple":"orange")+'">10 • الإشعارات</span><h2>'+title+'</h2><p>'+desc+'</p></div>'+
    '<div class="notification-page-actions"><span class="badge '+(unread?"red":"green")+'">'+unread+' غير مقروء</span><button class="btn btn-soft" data-notification-action="all-read">تعليم الكل كمقروء</button></div></div>'+
    '<div class="notification-summary-grid">'+
      '<div class="card"><div class="muted">إجمالي التنبيهات</div><div class="kpi-value">'+list.length+'</div><div class="muted">مرتبطة بالرحلة الحالية</div></div>'+
      '<div class="card"><div class="muted">تحتاج إجراء</div><div class="kpi-value">'+unread+'</div><div class="muted">ابدأ بالأعلى أهمية</div></div>'+
      '<div class="card"><div class="muted">الفكرة</div><div class="kpi-value" style="font-size:20px">تنبيه → قرار</div><div class="muted">بدون إزعاج غير ضروري</div></div>'+
    '</div>'+
    '<div class="section-title"><h3>الأحدث</h3><div class="filter-chips">'+
'<button class="filter-chip '+(filter==="all"?"active":"")+'" data-notification-filter="all">الكل</button>'+
'<button class="filter-chip '+(filter==="unread"?"active":"")+'" data-notification-filter="unread">غير مقروء</button>'+
'<button class="filter-chip '+(filter==="important"?"active":"")+'" data-notification-filter="important">مهم</button></div></div>'+
    '<div class="notification-list">'+(list.length?list.map(itemHtml).join(""):emptyState())+'</div>';
}

export function notificationBell(role="student"){
  syncSmartNotifications(role);
  const count=getUnreadCount(role);
  const list=getNotifications(role).slice(0,4);
  const preview=list.length?list.map(item=>'<button class="notification-pop-item '+(!item.read?"unread":"")+'" data-notification-action="read" data-notification-id="'+esc(item.id)+'"><span class="notification-pop-dot '+tone(item.type)+'">'+icon(item.type)+'</span><span><strong>'+esc(item.title)+'</strong><small>'+esc(item.body)+'</small></span></button>').join(""):'<div class="notification-pop-empty">لا توجد إشعارات</div>';
  return '<div class="notification-center"><button class="notification-bell" id="notification-bell" aria-label="الإشعارات"><span>🔔</span>'+(count?'<b>'+count+'</b>':'')+'</button><div class="notification-popover" id="notification-popover"><div class="notification-pop-head"><strong>الإشعارات</strong><span>'+count+' غير مقروء</span></div><div class="notification-pop-list">'+preview+'</div><div class="notification-pop-foot"><button class="link-btn" data-page="notifications">عرض الكل</button></div></div></div>';
}
