import {getTrainerExamSummary,getTrainerExamConfig,saveTrainerExamConfigFromForm,saveTrainerExamQuestionsFromForm,saveTrainerExamBuilderFromForm,publishTrainerExam,getExamPreviewQuestions,getExamAttempts,getQuestionAnalytics,resetTrainerExamConfig} from "./exam-v23.js?v=434";
import {questions} from "./demo-data.js";
import {questionBankView,refreshBank} from "./question-bank-v32.js?v=434";
import {student360View} from "./student360-v29.js";
import {notificationsPage,getUnreadCount} from "./notifications-v30.js";
import {interventionCenterView,getOpenInterventions} from "./intervention-v31.js";
import {courseManagerView} from "./course-manager-v36.js?v=403";
import {auditView} from "./system-audit-v31.js?v=434";

const students=[
  {id:1,name:"أحمد محمد",group:"1",progress:84,avg:88,last:"اليوم",risk:"منخفض",topic:"VLSM",weakness:64,activity:"نشط",trend:"+8%"},
  {id:2,name:"محمد خالد",group:"1",progress:62,avg:58,last:"أمس",risk:"متوسط",topic:"Prefix",weakness:51,activity:"متوسط",trend:"-3%"},
  {id:3,name:"سارة عبدالله",group:"2",progress:91,avg:94,last:"اليوم",risk:"منخفض",topic:"—",weakness:88,activity:"نشط",trend:"+5%"},
  {id:4,name:"خالد علي",group:"3",progress:47,avg:42,last:"قبل 3 أيام",risk:"مرتفع",topic:"Subnet Mask",weakness:39,activity:"متوقف",trend:"-14%"},
  {id:5,name:"نورة سالم",group:"2",progress:73,avg:69,last:"أمس",risk:"متوسط",topic:"Binary",weakness:56,activity:"متوسط",trend:"+2%"},
  {id:6,name:"عبدالرحمن سعد",group:"1",progress:58,avg:61,last:"اليوم",risk:"متوسط",topic:"Magic Number",weakness:48,activity:"نشط",trend:"+1%"}
];

const actions={
  high:"إرسال متابعة فردية + تكليف مراجعة موضوع الضعف",
  medium:"تعيين تدريب مخصص ومراجعة بعد 48 ساعة",
  low:"متابعة عادية وتشجيع الاستمرار"
};

const fmtRisk=r=>r==="مرتفع"?"red":r==="متوسط"?"orange":"green";
const esc=v=>String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function stat(label,value,sub=""){
  return '<div class="card trainer-kpi"><div class="muted">'+label+'</div><div class="kpi-value">'+value+'</div><div class="muted">'+sub+'</div></div>';
}

function riskStudents(){
  return students.filter(s=>s.risk!=="منخفض").sort((a,b)=>a.progress-b.progress);
}

function trainerDashboard(){
  const risk=riskStudents();
  const total=students.length;
  const avgProgress=Math.round(students.reduce((a,s)=>a+s.progress,0)/total);
  const active=students.filter(s=>s.activity==="نشط").length;
  const high=risk.filter(s=>s.risk==="مرتفع").length;
  const medium=risk.filter(s=>s.risk==="متوسط").length;
  const topStudent=[...students].sort((a,b)=>b.progress-a.progress)[0];
  const focus=[["VLSM",48,"مرتفع"],["Subnet Mask",56,"مرتفع"],["Prefix",61,"متوسط"],["Binary",72,"جيد"]];

  return `
  <div class="trainer-v311-hero">
    <div class="trainer-v311-hero-main">
      <span class="eyebrow">مركز قيادة المدرب • V3.11</span>
      <h1>صورة واضحة لما يحتاج قرارًا الآن</h1>
      <p>ابدأ بالأولوية، افتح المتدرب، ثم انتقل مباشرة إلى الإجراء المناسب.</p>
      <div class="trainer-v311-actions">
        <button class="btn btn-white" data-trainer-page="students" data-risk="مرتفع">طلاب عالي الخطورة</button>
        <button class="btn btn-outline-white" data-trainer-page="courses">إدارة المقرر</button>
        <button class="btn btn-outline-white" data-trainer-page="exams">متابعة الاختبارات</button>
      </div>
    </div>
    <div class="trainer-v311-priority">
      <span>أولوية اليوم</span>
      <strong>${risk.length}</strong>
      <small>${high} مرتفع • ${medium} متوسط</small>
      <button class="btn btn-white mini-btn" data-trainer-page="interventions">فتح مركز التدخل</button>
    </div>
  </div>

  <div class="trainer-v311-summary">
    <div class="card trainer-v311-summary-card">
      <div class="summary-icon">👥</div>
      <div><span class="muted">المتدربون</span><strong>${total}</strong><small>${active} نشط اليوم</small></div>
    </div>
    <div class="card trainer-v311-summary-card">
      <div class="summary-icon green">↗</div>
      <div><span class="muted">متوسط التقدم</span><strong>${avgProgress}%</strong><small>الاتجاه العام مستقر</small></div>
    </div>
    <div class="card trainer-v311-summary-card">
      <div class="summary-icon orange">⚠</div>
      <div><span class="muted">عالي الخطورة</span><strong>${high}</strong><small>يحتاج تدخلًا مباشرًا</small></div>
    </div>
    <div class="card trainer-v311-summary-card">
      <div class="summary-icon purple">★</div>
      <div><span class="muted">الأفضل حاليًا</span><strong>${topStudent.name}</strong><small>${topStudent.progress}% تقدم</small></div>
    </div>
  </div>

  <div class="trainer-utility-grid">
    <div class="card trainer-utility-card notification-utility">
      <div class="home-utility-icon">🔔</div>
      <div><span class="eyebrow orange">مركز المتابعة</span><h3>الإشعارات والتحديثات</h3><p class="muted">تابع ما تغير منذ آخر دخول للوحة المدرب.</p></div>
      <button class="btn btn-orange" data-trainer-page="notifications">فتح الإشعارات</button>
    </div>
    <div class="card trainer-utility-card intervention-utility">
      <div class="home-utility-icon red">!</div>
      <div><span class="eyebrow red">إجراء مباشر</span><h3>مركز التدخل</h3><p class="muted">هناك <strong>${getOpenInterventions().length}</strong> تدخلات تحتاج قرارًا أو متابعة.</p></div>
      <button class="btn btn-danger" data-trainer-page="interventions">فتح مركز التدخل</button>
    </div>
  </div>

  <div class="section-title"><h3>القرار التالي</h3><span class="badge red">أولوية</span></div>
  <div class="trainer-v311-focus-grid">
    <div class="card trainer-focus-card urgent">
      <div class="focus-head"><span class="badge red">تدخل الآن</span><strong>4 متدربين</strong></div>
      <h3>Subnet Mask وMagic Number</h3>
      <p class="muted">المتوسط أقل من 50% مع تكرار الأخطاء.</p>
      <div class="focus-metric"><span>الإتقان</span><strong>46%</strong></div>
      <button class="btn btn-danger" data-trainer-page="students" data-risk="مرتفع">عرض الطلاب</button>
    </div>
    <div class="card trainer-focus-card">
      <div class="focus-head"><span class="badge orange">مراجعة</span><strong>3 متدربين</strong></div>
      <h3>Prefix</h3>
      <p class="muted">يحتاجون تدريبًا موجّهًا قبل الانتقال.</p>
      <div class="focus-metric"><span>الإتقان</span><strong>61%</strong></div>
      <button class="btn btn-orange" data-trainer-page="students" data-risk="متوسط">فتح قائمة المتابعة</button>
    </div>
    <div class="card trainer-focus-card success">
      <div class="focus-head"><span class="badge green">جاهزون</span><strong>12 متدربًا</strong></div>
      <h3>الانتقال إلى FLSM</h3>
      <p class="muted">حققوا مستوى يسمح بالانتقال للمحور التالي.</p>
      <div class="focus-metric"><span>الجاهزية</span><strong>≥ 70%</strong></div>
      <button class="btn btn-green" data-trainer-page="students" data-risk="منخفض">عرض الجاهزين</button>
    </div>
  </div>

  <div class="section-title"><h3>المقرر والاختبارات</h3></div>
  <div class="grid-2">
    <div class="card trainer-v311-module-card">
      <div class="module-card-head"><div><span class="eyebrow blue">المقرر الحالي</span><h3>IPv4 Fundamentals</h3></div><span class="badge green">منشور</span></div>
      <div class="module-progress"><div><span>تقدم الطلاب</span><strong>68%</strong></div><div class="progress"><span style="width:68%"></span></div></div>
      <div class="module-stats"><span><b>3</b> وحدات</span><span><b>12</b> درسًا</span><span><b>24</b> نشاطًا</span><span><b>78%</b> نجاح</span></div>
      <div class="module-actions"><button class="btn btn-primary" data-trainer-page="courses">فتح المقرر</button><button class="btn btn-soft" data-trainer-page="questions">بنك الأسئلة</button></div>
    </div>
    <div class="card trainer-v311-module-card">
      <div class="module-card-head"><div><span class="eyebrow orange">الاختبار التالي</span><h3>IPv4 & Binary</h3></div><span class="badge orange">جاهز</span></div>
      <div class="exam-mini"><div><span>الأسئلة</span><strong>10</strong></div><div><span>المدة</span><strong>5 د</strong></div><div><span>النجاح</span><strong>60%</strong></div></div>
      <div class="exam-status"><span>آخر متوسط</span><strong>78%</strong><span class="muted">لا توجد مشكلة تشغيلية</span></div>
      <div class="module-actions"><button class="btn btn-orange" data-trainer-page="exams">فتح إدارة الاختبار</button><button class="btn btn-soft" data-trainer-page="analytics">التحليلات</button></div>
    </div>
  </div>

  <div class="section-title"><h3>لوحة نقاط الضعف</h3><button class="link-btn" data-trainer-page="analytics">عرض التحليلات</button></div>
  <div class="card trainer-v311-weakness">
    ${focus.map(x=>`<div class="weakness-row"><div class="weakness-name"><strong>${x[0]}</strong><span class="badge ${x[2]==="مرتفع"?"red":x[2]==="متوسط"?"orange":"green"}">${x[2]}</span></div><div class="progress"><span style="width:${x[1]}%"></span></div><strong class="weakness-percent">${x[1]}%</strong></div>`).join("")}
  </div>

  <div class="section-title"><h3>أهم المتدربين للمتابعة</h3><button class="link-btn" data-trainer-page="students">جميع المتدربين</button></div>
  <div class="card risk-list trainer-v311-risk-list">
    ${risk.slice(0,5).map((s,i)=>`
      <div class="risk-row">
        <div class="risk-rank">${i+1}</div>
        <div class="risk-person"><strong>${s.name}</strong><span class="muted">المجموعة ${s.group} • ${s.last}</span></div>
        <span class="badge ${fmtRisk(s.risk)}">${s.risk}</span>
        <div class="risk-topic"><strong>${s.topic}</strong><span class="muted">إتقان ${s.weakness}%</span></div>
        <button class="btn btn-soft mini-btn" data-student-id="${s.id}">Student 360</button>
      </div>`).join("")}
  </div>

  <div class="section-title"><h3>النشاط الأسبوعي</h3></div>
  <div class="grid-2">
    <div class="card"><h3>أداء الموضوعات</h3>
      ${[["IPv4",84],["Binary",72],["Prefix",61],["Subnet Mask",56],["FLSM",69],["VLSM",48]].map(x=>`<div class="topic-bar"><div><span>${x[0]}</span><b>${x[1]}%</b></div><div class="progress"><span style="width:${x[1]}%"></span></div></div>`).join("")}
    </div>
    <div class="card"><h3>النشاط خلال الأسبوع</h3>
      <div class="weekly-bars trainer-bars">${[42,58,51,70,63,88,76].map((v,i)=>`<div><span style="height:${v}%"></span><small>${["أ","ح","ن","ث","ر","خ","ج"][i]}</small></div>`).join("")}</div>
      <div class="muted" style="margin-top:8px">أفضل يوم: الخميس • أعلى نشاط: 88%</div>
    </div>
  </div>
  `;
}
function studentsPage(filter="",group=""){
  const total=students.length;
  const high=students.filter(s=>s.risk==="مرتفع").length;
  const medium=students.filter(s=>s.risk==="متوسط").length;
  const low=students.filter(s=>s.risk==="منخفض").length;
  const active=students.filter(s=>s.activity==="نشط").length;
  let rows=students.filter(s=>(!filter||s.risk===filter)&&(!group||String(s.group)===String(group)));

  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow blue">01 • المتدربون</span><h2>إدارة المتدربين</h2><p>ابحث وصفِّ المتدربين ثم افتح ملف Student 360 لاتخاذ قرار واضح.</p></div>
    <div class="trainer-students-header-actions">
      <span class="badge">${rows.length} معروض</span>
      <button class="btn btn-primary" data-trainer-page="tdash">لوحة المدرب</button>
    </div>
  </div>

  <div class="trainer-students-summary">
    <div class="card trainer-student-stat"><span>إجمالي المتدربين</span><strong>${total}</strong><small>كل السجلات</small></div>
    <div class="card trainer-student-stat"><span>نشطون اليوم</span><strong>${active}</strong><small>نشاط حديث</small></div>
    <div class="card trainer-student-stat danger"><span>عالي الخطورة</span><strong>${high}</strong><small>تدخل مباشر</small></div>
    <div class="card trainer-student-stat warning"><span>متوسط الخطورة</span><strong>${medium}</strong><small>متابعة</small></div>
    <div class="card trainer-student-stat success"><span>منخفض الخطورة</span><strong>${low}</strong><small>جاهزون غالبًا</small></div>
  </div>

  <div class="card trainer-student-toolbar">
    <div class="trainer-student-search">
      <label>بحث سريع</label>
      <input id="trainer-search" placeholder="اكتب اسم المتدرب أو الموضوع..." aria-label="بحث المتدربين">
    </div>
    <div>
      <label>الحالة</label>
      <select id="trainer-risk"><option value="">كل الحالات</option><option value="مرتفع" ${filter==="مرتفع"?"selected":""}>مرتفع</option><option value="متوسط" ${filter==="متوسط"?"selected":""}>متوسط</option><option value="منخفض" ${filter==="منخفض"?"selected":""}>منخفض</option></select>
    </div>
    <div>
      <label>المجموعة</label>
      <select id="trainer-group"><option value="">كل المجموعات</option><option value="1" ${group==="1"?"selected":""}>المجموعة 1</option><option value="2" ${group==="2"?"selected":""}>المجموعة 2</option><option value="3" ${group==="3"?"selected":""}>المجموعة 3</option></select>
    </div>
    <div class="trainer-filter-actions">
      <button class="filter-chip ${filter==="مرتفع"?"active":""}" data-trainer-risk-chip="مرتفع">عالي الخطورة</button>
      <button class="filter-chip ${filter==="متوسط"?"active":""}" data-trainer-risk-chip="متوسط">متوسط</button>
      <button class="filter-chip ${filter==="منخفض"?"active":""}" data-trainer-risk-chip="منخفض">جاهزون</button>
      <button class="filter-chip ${!filter?"active":""}" data-trainer-risk-chip="">الكل</button>
    </div>
  </div>

  <div class="card trainer-student-table-card">
    <div class="trainer-table-head">
      <div><strong>قائمة المتدربين</strong><span class="muted">بيانات العرض التجريبي</span></div>
      <span class="badge green">${rows.length} نتيجة</span>
    </div>
    <div class="table-scroll"><table class="table trainer-table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>التقدم</th><th>المتوسط</th><th>نقطة الضعف</th><th>الحالة</th><th>آخر نشاط</th><th>الإجراء</th></tr></thead><tbody>
      ${rows.map(s=>`<tr>
        <td><div class="trainer-student-name"><div class="student-mini-avatar">${s.name.slice(0,1)}</div><div><strong>${s.name}</strong><small>${s.activity}</small></div></div></td>
        <td><span class="badge">${s.group}</span></td>
        <td><div class="trainer-progress-cell"><div class="progress"><span style="width:${s.progress}%"></span></div><small>${s.progress}%</small></div></td>
        <td><strong>${s.avg}%</strong></td>
        <td><span class="badge ${s.topic==="—"?"green":"orange"}">${s.topic}</span></td>
        <td><span class="badge ${fmtRisk(s.risk)}">${s.risk}</span></td>
        <td><small class="muted">${s.last}</small></td>
        <td><button class="btn btn-soft mini-btn" data-student-id="${s.id}">فتح الملف 360</button></td>
      </tr>`).join("")}
    </tbody></table></div>
    ${rows.length===0?'<div class="empty">لا توجد نتائج مطابقة للفلاتر الحالية.</div>':""}
  </div>

  <div class="section-title"><h3>إجراءات سريعة للمدرب</h3></div>
  <div class="trainer-student-actions-grid">
    <button class="action-card" data-trainer-page="students" data-risk="مرتفع"><strong>متابعة عالية الأولوية</strong><span class="muted">${high} متدربين يحتاجون تدخلًا</span></button>
    <button class="action-card" data-trainer-page="interventions"><strong>مركز التدخل</strong><span class="muted">حوّل التنبيهات إلى إجراءات</span></button>
    <button class="action-card" data-trainer-page="analytics"><strong>تحليلات الأداء</strong><span class="muted">اعرف أكثر الموضوعات ضعفًا</span></button>
    <button class="action-card" data-trainer-page="groups"><strong>مقارنة المجموعات</strong><span class="muted">قارن الأداء قبل التدخل الجماعي</span></button>
  </div>
  `;
}
function student360(id){ return student360View(id); }

export function getTrainerView(page="tdash",filter="",id=null,group=""){
  if(page==="results")return resultsCenterPage();
  if(page==="students")return studentsPage(filter,group);
  if(page==="interventions")return interventionCenterView();
  if(page==="audit")return auditView();
  if(page==="notifications")return notificationsPage("trainer");
  if(page==="student360")return student360(id);
  if(page==="groups"){
    const groups=[1,2,3].map(g=>{
      const list=students.filter(s=>String(s.group)===String(g));
      const avg=Math.round(list.reduce((a,s)=>a+s.avg,0)/Math.max(1,list.length));
      const progress=Math.round(list.reduce((a,s)=>a+s.progress,0)/Math.max(1,list.length));
      const high=list.filter(s=>s.risk==="مرتفع").length;
      const med=list.filter(s=>s.risk==="متوسط").length;
      const active=list.filter(s=>s.activity==="نشط").length;
      return {id:String(g),list,avg,progress,high,med,active};
    });
    const best=[...groups].sort((a,b)=>b.avg-a.avg)[0];
    const riskGroup=[...groups].sort((a,b)=>(b.high*2+b.med)-(a.high*2+a.med))[0];
    return `
    <div class="page-intro with-action"><div><span class="eyebrow blue">02 • المجموعات</span><h2>إدارة المجموعات</h2><p>قارن أداء المجموعات، راقب المخاطر، ثم افتح طلاب المجموعة لاتخاذ إجراء.</p></div><div class="group-head-actions"><span class="badge blue">3 مجموعات</span><button class="btn btn-primary" data-trainer-page="students">قائمة المتدربين</button></div></div>

    <div class="trainer-group-summary">
      <div class="card group-summary-card"><span>أفضل مجموعة</span><strong>المجموعة ${best.id}</strong><small>${best.avg}% متوسط الأداء</small></div>
      <div class="card group-summary-card danger"><span>أعلى مخاطرة</span><strong>المجموعة ${riskGroup.id}</strong><small>${riskGroup.high} عالي • ${riskGroup.med} متوسط</small></div>
      <div class="card group-summary-card success"><span>نشاط اليوم</span><strong>${Math.round(groups.reduce((a,g)=>a+g.active,0)/students.length*100)}%</strong><small>من إجمالي المتدربين</small></div>
      <div class="card group-summary-card"><span>إجمالي المتدربين</span><strong>${students.length}</strong><small>3 مجموعات</small></div>
    </div>

    <div class="group-selector">
      ${groups.map(g=>'<button class="group-selector-btn '+(g.id==="1"?"active":"")+'" data-group-filter="'+g.id+'"><span>المجموعة '+g.id+'</span><strong>'+g.avg+'%</strong><small>'+g.list.length+' متدربين</small></button>').join("")}
    </div>

    <div class="trainer-group-panels">
      ${groups.map(g=>'<div class="card trainer-group-panel" data-group-panel="'+g.id+'" '+(g.id==="1"?"":"hidden")+'>        <div class="group-panel-head"><div><span class="eyebrow blue">المجموعة '+g.id+'</span><h3>نظرة عامة</h3></div><div class="group-panel-actions"><span class="badge '+(g.high?"red":"green")+'">'+(g.high?g.high+" عالي الخطورة":"لا يوجد عالي الخطورة")+'</span><button class="btn btn-primary mini-btn" data-trainer-page="students" data-group="'+g.id+'">فتح طلاب المجموعة</button></div></div>        <div class="group-metrics"><div><span>متوسط الأداء</span><strong>'+g.avg+'%</strong></div><div><span>متوسط التقدم</span><strong>'+g.progress+'%</strong></div><div><span>نشطون</span><strong>'+g.active+'</strong></div><div><span>متوسط الخطورة</span><strong>'+(g.high+g.med)+'</strong></div></div>        <div class="section-title"><h3>متدربو المجموعة</h3></div>        <div class="group-student-list">'+g.list.map(s=>'<div class="group-student-row"><div class="student-mini-avatar">'+s.name.slice(0,1)+'</div><div><strong>'+s.name+'</strong><small>'+s.topic+' • '+s.last+'</small></div><span class="badge '+fmtRisk(s.risk)+'">'+s.risk+'</span><strong>'+s.avg+'%</strong><button class="btn btn-soft mini-btn" data-student-id="'+s.id+'">360</button></div>').join("")+'</div>      </div>').join("")}
    </div>

    <div class="section-title"><h3>مقارنة الأداء</h3><span class="badge purple">Group Analytics</span></div>
    <div class="card group-comparison-table"><div class="group-comparison-row head"><span>المجموعة</span><span>الأداء</span><span>التقدم</span><span>عالي الخطورة</span><span>إجراء</span></div>
      ${groups.map(g=>'<div class="group-comparison-row"><strong>المجموعة '+g.id+'</strong><span>'+g.avg+'%</span><span>'+g.progress+'%</span><span class="badge '+(g.high?"red":"green")+'">'+g.high+'</span><button class="btn btn-soft mini-btn" data-group-filter="'+g.id+'">عرض المجموعة</button></div>').join("")}
    </div>
    `;
  }
  if(page==="courses")return courseManagerView();
  if(page==="questions")return questionBankView();
  if(page==="exams"){
    const r=getTrainerExamSummary();
    const cfg=getTrainerExamConfig();
    const bankQuestions=refreshBank();
    const limitText=cfg.attemptsLimit===0?"غير محدود":String(cfg.attemptsLimit);
    const topics=questions.filter(q=>cfg.questionIds.includes(q.id));
    const last=r.lastResult;
    const weak=last?[...last.topics].sort((a,b)=>a.percent-b.percent)[0]:null;

    const actualAttempts=getExamAttempts(cfg.title);
    const questionAnalytics=getQuestionAnalytics(cfg.title);
    const passCount=actualAttempts.filter(x=>x.passed).length;
    const avgResults=actualAttempts.length?Math.round(actualAttempts.reduce((sum,x)=>sum+x.percent,0)/actualAttempts.length):0;
    const highest=actualAttempts.length?[...actualAttempts].sort((x,y)=>y.percent-x.percent)[0]:null;
    const lowest=actualAttempts.length?[...actualAttempts].sort((x,y)=>x.percent-y.percent)[0]:null;
    const latestAttempt=actualAttempts[0]||null;
    const hardestQuestion=questionAnalytics.filter(x=>x.total>0).sort((x,y)=>x.accuracy-y.accuracy)[0]||null;
    const easiestQuestion=questionAnalytics.filter(x=>x.total>0).sort((x,y)=>y.accuracy-x.accuracy)[0]||null;
    return `
    <div class="page-intro with-action">
      <div><span class="eyebrow orange">05 • الاختبارات</span><h2>إدارة الاختبارات ونتائج المتدربين</h2><p>أنشئ الاختبار، راقب الإعدادات، ثم راجع نتائج جميع المتدربين واتخذ الإجراء المناسب.</p><small class="muted">${window.__IPV4_SUPABASE_STATUS__?.message||"Supabase غير متصل — البيانات المحلية تعمل كنسخة احتياطية."}</small></div>
      <div class="trainer-exam-head-actions"><span class="badge purple">V3.35</span><span class="badge" data-supabase-status>Supabase</span><button class="btn btn-soft" data-trainer-page="analytics">التحليلات</button></div>
    </div>

    <div class="trainer-exam-kpis">
      <div class="card exam-admin-kpi"><span>المحاولات الحقيقية</span><strong>${actualAttempts.length}</strong><small>نتائج مسجلة</small></div>
      <div class="card exam-admin-kpi"><span>الأسئلة المحددة</span><strong>${cfg.questionIds.length}</strong><small>من ${bankQuestions.length} في البنك</small></div>
      <div class="card exam-admin-kpi"><span>المدة</span><strong>${cfg.durationMin} د</strong><small>لكل محاولة</small></div>
      <div class="card exam-admin-kpi warning"><span>نسبة النجاح</span><strong>${cfg.passPercent}%</strong><small>حد الاجتياز</small></div>
      <div class="card exam-admin-kpi success"><span>متوسط النتائج</span><strong>${avgResults}%</strong><small>${passCount}/${actualAttempts.length} ناجح</small></div>
      <div class="card exam-admin-kpi purple"><span>أعلى نتيجة</span><strong>${highest?highest.percent:0}%</strong><small>${highest?esc(highest.studentName):"—"}</small></div>
    </div>

    <div class="grid-2 trainer-exam-main-grid">
      <div class="card">
        <div class="exam-admin-card-head"><div><span class="eyebrow blue">إعدادات الاختبار</span><h3>خصائص الاختبار</h3></div><span class="badge blue">بيانات فعلية</span></div>
        <form id="trainer-exam-settings-form" class="exam-settings-form">
          <label>اسم الاختبار<input name="title" value="${esc(cfg.title)}"></label>
          <div class="exam-setting-grid">
            <label>المدة بالدقائق<input type="number" name="durationMin" min="1" max="60" value="${cfg.durationMin}"></label>
            <label>نسبة النجاح %<input type="number" name="passPercent" min="0" max="100" value="${cfg.passPercent}"></label>
          </div>
          <label>عدد المحاولات لكل متدرب
            <select name="attemptsLimit">
              <option value="1" ${cfg.attemptsLimit===1?"selected":""}>محاولة واحدة</option>
              <option value="2" ${cfg.attemptsLimit===2?"selected":""}>محاولتان</option>
              <option value="3" ${cfg.attemptsLimit===3?"selected":""}>3 محاولات</option>
              <option value="0" ${cfg.attemptsLimit===0?"selected":""}>غير محدود</option>
            </select>
          </label>
          <div class="exam-settings-actions">
            <button class="btn btn-primary" type="submit">حفظ إعدادات الاختبار</button>
            <button class="btn btn-soft" type="button" id="reset-trainer-exam">إعادة الإعدادات الافتراضية</button>
            <span id="exam-settings-msg" class="muted"></span>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="exam-admin-card-head"><div><span class="eyebrow purple">آخر نتيجة</span><h3>آخر محاولة مسجلة</h3></div><button class="btn btn-soft mini-btn" data-trainer-page="students">المتدربون</button></div>
        ${last
          ? '<div class="last-exam-result-card"><strong>'+last.percent+'%</strong><span class="badge '+(last.passed?"green":"orange")+'">'+(last.passed?"ناجح":"يحتاج مراجعة")+'</span><p class="muted">'+last.score+'/'+last.total+' إجابات صحيحة • '+(weak?"أضعف موضوع: "+esc(weak.topic):"")+'</p></div>'
          : '<div class="empty"><h3>لا توجد نتيجة فعلية بعد</h3><p class="muted">سيظهر آخر اختبار فعلي هنا بعد تجربة المتدرب.</p></div>'}
        <div class="stat-row"><span>أدنى نتيجة في القائمة</span><b>${lowest?lowest.percent:0}% • ${lowest?esc(lowest.studentName):"—"}</b></div>
        <div class="stat-row"><span>المحاولات المسجلة فعليًا</span><b>${actualAttempts.length}</b></div>
      </div>
    </div>

    <div class="section-title"><h3>النتائج الحقيقية</h3><div class="exam-result-filter">
      <button class="filter-chip active" data-exam-result-filter="all">الكل</button>
      <button class="filter-chip" data-exam-result-filter="passed">ناجح</button>
      <button class="filter-chip" data-exam-result-filter="review">يحتاج مراجعة</button>
      <button class="filter-chip" data-exam-result-filter="stopped">متوقف</button>
    </div></div>
    <div class="card exam-results-table-card">
      <div class="exam-results-toolbar"><div><strong>${actualAttempts.length} محاولة</strong><span class="muted">نتائج مسجلة فعليًا</span></div><span class="badge green">${passCount} ناجح</span></div>
      <div class="table-scroll">
      <table class="table exam-results-table"><thead><tr><th>المتدرب</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th><th>المحاولة</th><th>الوقت</th><th>التسليم</th><th>التحليل</th></tr></thead><tbody>
      ${actualAttempts.map(x=>{
        const mins=Math.floor((x.durationSec||0)/60),secs=String((x.durationSec||0)%60).padStart(2,"0");
        return '<tr data-exam-result-status="'+(x.passed?"passed":"review")+'"><td><div class="trainer-student-name"><div class="student-mini-avatar">'+esc((x.studentName||"م").slice(0,1))+'</div><div><strong>'+esc(x.studentName||"—")+'</strong><small>المجموعة '+esc(x.group||"1")+'</small></div></div></td><td><small>'+esc(x.exam)+'</small></td><td><strong class="exam-score-value">'+x.percent+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"يحتاج مراجعة")+'</span></td><td>'+x.attemptNo+'</td><td>'+mins+':'+secs+'</td><td><span class="badge">'+(x.autoSubmitted?"تلقائي":"يدوي")+'</span></td><td><span class="muted">تحليل السؤال بالأسفل</span></td></tr>';
      }).join("") || '<tr><td colspan="8"><div class="empty">لا توجد نتائج فعلية بعد. أكمل المتدرب اختبارًا منشورًا لتظهر النتيجة هنا.</div></td></tr>'}
      </tbody></table></div>
    </div>


    <div class="section-title"><h3>منشئ الاختبار الاحترافي</h3><div class="exam-result-filter"><span class="badge blue">${cfg.questionIds.length} سؤال</span><span class="badge ${cfg.published?"green":"orange"}">${cfg.published?"منشور":"مسودة"}</span></div></div>
    <form id="trainer-exam-settings-form-questions" class="card exam-question-builder v325-builder">
      <div class="exam-builder-head"><div><strong>أنشئ الاختبار من بنك الأسئلة</strong><span class="muted">اختر يدويًا أو دع المنصة تبني مجموعة عشوائية حسب الموضوع والصعوبة.</span></div><span class="badge">${bankQuestions.length} سؤال نشط</span></div>

      <div class="exam-v325-grid">
        <label>طريقة الاختيار
          <select name="selectionMode">
            <option value="manual" ${cfg.selectionMode==="manual"?"selected":""}>اختيار يدوي</option>
            <option value="random" ${cfg.selectionMode==="random"?"selected":""}>اختيار عشوائي ذكي</option>
          </select>
        </label>
        <label>عدد الأسئلة
          <input type="number" name="questionCount" min="1" max="100" value="${cfg.questionCount||Math.min(10,Math.max(1,bankQuestions.length))}">
        </label>
        <label>مستوى الصعوبة
          <select name="difficultyMode">
            <option value="all" ${cfg.difficultyMode==="all"?"selected":""}>كل المستويات</option>
            <option value="easy" ${cfg.difficultyMode==="easy"?"selected":""}>سهل فقط</option>
            <option value="medium" ${cfg.difficultyMode==="medium"?"selected":""}>متوسط فقط</option>
            <option value="hard" ${cfg.difficultyMode==="hard"?"selected":""}>متقدم فقط</option>
          </select>
        </label>
        <div class="exam-builder-status"><span>الحالة</span><strong>${cfg.published?"منشور للمتدربين":"مسودة غير منشورة"}</strong></div>
      </div>

      <div class="exam-topic-targets">
        <div class="section-title"><h4>توزيع الأسئلة حسب الموضوع</h4><span class="muted">يستخدم مع الاختيار العشوائي.</span></div>
        <div class="exam-topic-target-grid">
          ${["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"].map(t=>'<label><span>'+t+'</span><input type="number" min="0" max="100" data-topic-target="'+t+'" value="'+(cfg.topicTargets?.[t]||0)+'"></label>').join("")}
        </div>
      </div>

      <div class="exam-builder-preview-bar">
        <div><strong>المجموعة الحالية</strong><span class="muted">${cfg.selectionMode==="random"?"مبنية من قواعد الاختيار الحالية":"مختارة يدويًا"}</span></div>
        <div class="exam-builder-actions">
          <button class="btn btn-primary" type="submit">حفظ وبناء الاختبار</button>
          <button class="btn btn-green" type="button" id="publish-trainer-exam">${cfg.published?"تحديث النشر":"نشر للمتدربين"}</button>
          <button class="btn btn-soft" type="button" id="unpublish-trainer-exam">إلغاء النشر</button>
        </div>
        <span id="exam-question-msg" class="muted"></span>
      </div>

      <div class="exam-manual-picker-head"><strong>الاختيار اليدوي</strong><span class="muted">يستخدم عند اختيار «يدوي» ويمكن مراجعته حتى مع الوضع العشوائي.</span></div>
      <div class="exam-question-picker">
        ${bankQuestions.map(q=>'<label class="exam-pick-card"><input type="checkbox" name="questionIds" value="'+q.id+'" '+(cfg.questionIds.includes(Number(q.id))?"checked":"")+'><div><div><strong>#'+q.id+' • '+esc(q.topic)+'</strong><span class="badge '+(q.difficulty==="hard"?"red":q.difficulty==="medium"?"orange":"green")+'">'+(q.difficulty==="hard"?"متقدم":q.difficulty==="medium"?"متوسط":"سهل")+'</span></div><p>'+esc(q.q)+'</p></div></label>').join("")}
      </div>
    </form>

    <div class="card exam-preview-card">
      <div class="section-title"><h3>معاينة الاختبار</h3><span class="badge purple">${getExamPreviewQuestions().length} سؤال</span></div>
      <div class="exam-preview-meta">
        <div><span>الاختبار</span><strong>${esc(cfg.title)}</strong></div>
        <div><span>المدة</span><strong>${cfg.durationMin} دقيقة</strong></div>
        <div><span>النجاح</span><strong>${cfg.passPercent}%</strong></div>
        <div><span>المحاولات</span><strong>${limitText}</strong></div>
      </div>
      <div class="exam-preview-list">${getExamPreviewQuestions().slice(0,8).map((q,i)=>'<div class="exam-preview-item"><b>'+(i+1)+'</b><span>'+esc(q.q)+'</span><em>'+esc(q.topic)+'</em></div>').join("") || '<div class="empty">لا توجد أسئلة محددة بعد.</div>'}</div>
      ${getExamPreviewQuestions().length>8?'<div class="qbank-import-more">يظهر أول 8 أسئلة فقط في المعاينة، وسيظهر كامل الاختبار للمتدرب.</div>':''}
    </div>

    <div class="section-title"><h3>V3.29 • تحليل مستوى كل سؤال وربط بنك الأسئلة</h3><span class="badge purple">${questionAnalytics.filter(x=>x.total>0).length} سؤال تم تحليله</span></div>
    <div class="card question-analytics-summary">
      <div><span>أصعب سؤال</span><strong>${hardestQuestion?hardestQuestion.accuracy:0}%</strong><small>${hardestQuestion?esc(hardestQuestion.question):"لا توجد محاولات بعد"}</small></div>
      <div><span>أفضل سؤال</span><strong>${easiestQuestion?easiestQuestion.accuracy:0}%</strong><small>${easiestQuestion?esc(easiestQuestion.question):"لا توجد محاولات بعد"}</small></div>
      <div><span>إجمالي المحاولات</span><strong>${actualAttempts.length}</strong><small>مصدر التحليل الحالي</small></div>
    </div>
    <div class="card question-analytics-table-card"><div class="table-scroll"><table class="table question-analytics-table"><thead><tr><th>#</th><th>السؤال</th><th>الموضوع</th><th>المستوى</th><th>المحاولات</th><th>صحيح</th><th>خطأ</th><th>بدون إجابة</th><th>الدقة</th></tr></thead><tbody>
      ${questionAnalytics.map(x=>'<tr class="'+(x.total===0?"no-data":x.accuracy<50?"critical":x.accuracy<70?"needs-review":"good")+'"><td><strong>#'+x.id+'</strong></td><td><div class="question-analytics-q">'+esc(x.question)+'</div></td><td>'+esc(x.topic)+'</td><td><span class="badge '+(x.difficulty==="hard"?"red":x.difficulty==="medium"?"orange":"green")+'">'+(x.difficulty==="hard"?"متقدم":x.difficulty==="medium"?"متوسط":"سهل")+'</span></td><td>'+x.total+'</td><td>'+x.correct+'</td><td>'+x.wrong+'</td><td>'+x.unanswered+'</td><td><strong class="question-accuracy">'+x.accuracy+'%</strong><div class="progress"><span style="width:'+x.accuracy+'%"></span></div></td></tr>').join("")}
      </tbody></table></div><div class="question-analytics-legend"><span><b class="dot green"></b> ≥ 70% جيد</span><span><b class="dot orange"></b> 50–69% يحتاج مراجعة</span><span><b class="dot red"></b> أقل من 50% حرج</span></div></div>
    <div class="section-title"><h3>تحليل آخر نتيجة</h3><button class="link-btn" data-trainer-page="analytics">فتح التحليلات</button></div>
    <div class="card exam-result-topics">
      ${last?last.topics.map(x=>'<div class="exam-result-topic-row"><strong>'+esc(x.topic)+'</strong><div class="progress"><span style="width:'+x.percent+'%"></span></div><span>'+x.percent+'%</span></div>').join(""):'<div class="empty">بعد أول محاولة سيظهر أداء كل موضوع هنا.</div>'}
    </div>

    <div class="card exam-admin-note"><strong>V3.35:</strong> بنك الأسئلة النهائي هو المصدر المركزي للاختبارات والتحليلات، وتُقرأ إحصائيات الأسئلة من المحاولات المسجلة.</div>
    `;
  }
  if(page==="labs")return '<div class="page-intro"><span class="eyebrow green">06 • المختبرات</span><h2>المختبرات العملية</h2><p>تابع استخدام الطلاب للمختبرات.</p></div><div class="grid-3"><div class="card"><h3>Subnetting Lab</h3><div class="kpi-value">34</div><div class="muted">محاولة هذا الأسبوع</div></div><div class="card"><h3>IOS Lab</h3><div class="kpi-value">18</div><div class="muted">محاولة هذا الأسبوع</div></div><div class="card"><h3>Packet Tracer</h3><div class="kpi-value">21</div><div class="muted">محاولة هذا الأسبوع</div></div></div>';
  if(page==="analytics"){
    const r=getTrainerExamSummary();
    const interventions=getOpenInterventions();
    const total=students.length;
    const avgProgress=Math.round(students.reduce((a,s)=>a+s.progress,0)/total);
    const avgScore=Math.round(students.reduce((a,s)=>a+s.avg,0)/total);
    const high=students.filter(s=>s.risk==="مرتفع").length;
    const medium=students.filter(s=>s.risk==="متوسط").length;
    const active=Math.round(students.filter(s=>s.activity==="نشط").length/total*100);
    const topics=[["IPv4",84],["Binary",72],["Prefix",61],["Subnet Mask",56],["FLSM",69],["VLSM",48]];
    const weak=topics.filter(x=>x[1]<70).sort((a,b)=>a[1]-b[1]);
    const ready=students.filter(s=>s.progress>=70&&s.avg>=70).length;
    const trend=[62,66,69,65,72,76,78];
    const severity=Math.max(0,Math.min(100,Math.round((high*100+medium*55)/Math.max(1,total))));
    return `
    <div class="page-intro with-action">
      <div><span class="eyebrow purple">08 • التحليلات</span><h2>مركز التحليلات واتخاذ القرار</h2><p>حوّل بيانات المتدربين والاختبارات والتدخلات إلى قرارات تدريبية واضحة.</p></div>
      <div class="trainer-analytics-head-actions">
        <span class="badge purple">V3.15</span>
        <button class="btn btn-soft" data-trainer-page="tdash">لوحة المدرب</button>
      </div>
    </div>

    <div class="trainer-analytics-kpis">
      <div class="card analytics-kpi"><span>متوسط التقدم</span><strong>${avgProgress}%</strong><small>جميع المتدربين</small></div>
      <div class="card analytics-kpi"><span>متوسط الأداء</span><strong>${avgScore}%</strong><small>متوسط الاختبارات</small></div>
      <div class="card analytics-kpi danger"><span>عالي الخطورة</span><strong>${high}</strong><small>تدخل مباشر</small></div>
      <div class="card analytics-kpi warning"><span>قيد المتابعة</span><strong>${interventions.length}</strong><small>تدخلات مفتوحة</small></div>
      <div class="card analytics-kpi success"><span>جاهزون</span><strong>${ready}</strong><small>للانتقال للمحور التالي</small></div>
    </div>

    <div class="trainer-analytics-grid">
      <div class="card analytics-chart-card">
        <div class="analytics-card-head"><div><span class="eyebrow blue">اتجاه الأداء</span><h3>متوسط الأداء خلال الأسابيع</h3></div><span class="badge green">+6%</span></div>
        <div class="analytics-bars">${trend.map((v,i)=>'<div class="analytics-bar-item"><div class="analytics-bar"><span style="height:'+v+'%"></span></div><small>أسبوع '+(i+1)+'</small><b>'+v+'%</b></div>').join("")}</div>
      </div>
      <div class="card analytics-chart-card">
        <div class="analytics-card-head"><div><span class="eyebrow red">مؤشر المخاطر</span><h3>توزيع الحالات</h3></div><span class="badge red">'+severity+'%</span></div>
        <div class="risk-meter"><div class="risk-meter-track"><span style="width:'+severity+'%"></span></div><div class="risk-meter-labels"><span>منخفض</span><span>متوسط</span><span>مرتفع</span></div></div>
        <div class="analytics-risk-grid"><div><strong>'+high+'</strong><span>مرتفع</span></div><div><strong>'+medium+'</strong><span>متوسط</span></div><div><strong>'+(total-high-medium)+'</strong><span>منخفض</span></div></div>
      </div>
    </div>

    <div class="section-title"><h3>الموضوعات التي تحتاج تدخلًا</h3><button class="link-btn" data-trainer-page="students" data-risk="مرتفع">فتح الطلاب</button></div>
    <div class="card analytics-topic-list">
      ${topics.map(x=>'<div class="analytics-topic-row"><div class="analytics-topic-name"><strong>'+x[0]+'</strong><span class="badge '+(x[1]<50?"red":x[1]<70?"orange":"green")+'">'+(x[1]<50?"حرج":x[1]<70?"يحتاج تدريب":"جيد")+'</span></div><div class="progress"><span style="width:'+x[1]+'%"></span></div><strong class="analytics-topic-value">'+x[1]+'%</strong><button class="btn btn-soft mini-btn" data-trainer-page="students" data-risk="'+(x[1]<50?"مرتفع":x[1]<70?"متوسط":"منخفض")+'">عرض</button></div>').join("")}
    </div>

    <div class="trainer-analytics-grid">
      <div class="card analytics-action-card">
        <div class="analytics-card-head"><div><span class="eyebrow orange">الاختبارات</span><h3>آخر نتيجة مسجلة</h3></div><button class="btn btn-soft mini-btn" data-trainer-page="exams">إدارة الاختبارات</button></div>
        <div class="analytics-exam-score"><strong>${r.lastResult?r.lastResult.percent+"%":"—"}</strong><span>${r.lastResult?(r.lastResult.passed?"ناجح":"يحتاج مراجعة"):"لم يسجل بعد"}</span></div>
        <div class="stat-row"><span>عدد المحاولات</span><b>${r.attempts||0}</b></div>
        <div class="stat-row"><span>أفضل موضوع</span><b>${r.lastResult?[...r.lastResult.topics].sort((a,b)=>b.percent-a.percent)[0]?.topic||"—":"—"}</b></div>
        <div class="stat-row"><span>أضعف موضوع</span><b>${r.lastResult?[...r.lastResult.topics].sort((a,b)=>a.percent-b.percent)[0]?.topic||"—":"—"}</b></div>
      </div>
      <div class="card analytics-action-card">
        <div class="analytics-card-head"><div><span class="eyebrow red">التدخلات</span><h3>حالة الإجراءات</h3></div><button class="btn btn-soft mini-btn" data-trainer-page="interventions">مركز التدخل</button></div>
        <div class="analytics-intervention-score"><strong>${interventions.length}</strong><span>تدخلات مفتوحة</span></div>
        <div class="stat-row"><span>أعلى أولوية</span><b>${interventions.filter(x=>x.priority===1).length}</b></div>
        <div class="stat-row"><span>أقل من 50%</span><b>${interventions.filter(x=>Number(x.score)<50).length}</b></div>
        <div class="stat-row"><span>أكثر موضوع تكرارًا</span><b>${weak[0]?.[0]||"—"}</b></div>
      </div>
    </div>

    <div class="section-title"><h3>جدول القرار</h3><span class="badge">Priority Matrix</span></div>
    <div class="card analytics-decision-table">
      <div class="analytics-decision-row head"><span>الأولوية</span><span>الحالة</span><span>المؤشر</span><span>القرار</span><span>الإجراء</span></div>
      <div class="analytics-decision-row"><strong class="badge red">1</strong><span>عالية</span><span>VLSM • 48%</span><strong>جلسة علاجية</strong><button class="btn btn-danger mini-btn" data-trainer-page="students" data-risk="مرتفع">تنفيذ</button></div>
      <div class="analytics-decision-row"><strong class="badge orange">2</strong><span>متوسطة</span><span>Subnet Mask • 56%</span><strong>تدريب مخصص</strong><button class="btn btn-orange mini-btn" data-trainer-page="students" data-risk="متوسط">تنفيذ</button></div>
      <div class="analytics-decision-row"><strong class="badge green">3</strong><span>جيدة</span><span>جاهزية • '+ready+' متدربين</span><strong>رفع مستوى الصعوبة</strong><button class="btn btn-green mini-btn" data-trainer-page="students" data-risk="منخفض">عرض</button></div>
    </div>

    <div class="card analytics-footer-note"><strong>ملاحظة:</strong> أرقام V3.15 الحالية مبنية على بيانات العرض داخل المنصة، وسيتم استبدالها ببيانات Supabase عند تفعيل طبقة البيانات الفعلية.</div>
    `;
  }
  return trainerDashboard();
}
