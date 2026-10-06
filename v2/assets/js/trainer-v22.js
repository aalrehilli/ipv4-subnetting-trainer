import {getTrainerExamSummary} from "./exam-v23.js";
import {questionBankView} from "./question-bank-v24.js";
import {student360View} from "./student360-v29.js";
import {notificationsPage,getUnreadCount} from "./notifications-v30.js";
import {interventionCenterView,getOpenInterventions} from "./intervention-v31.js";
import {courseManagerView} from "./course-manager-v36.js?v=403";

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
function studentsPage(filter=""){
  let rows=filter?students.filter(s=>s.risk===filter):students;
  return `
  <div class="page-intro with-action"><div><span class="eyebrow blue">01 • المتدربون</span><h2>إدارة المتدربين</h2><p>ابحث، صفِّ، ثم افتح ملف المتدرب لاتخاذ الإجراء.</p></div><span class="badge">${rows.length} معروض</span></div>
  <div class="card trainer-filters">
    <input id="trainer-search" placeholder="ابحث باسم المتدرب..." aria-label="بحث">
    <select id="trainer-risk"><option value="">كل الحالات</option><option value="مرتفع" ${filter==="مرتفع"?"selected":""}>مرتفع</option><option value="متوسط" ${filter==="متوسط"?"selected":""}>متوسط</option><option value="منخفض" ${filter==="منخفض"?"selected":""}>منخفض</option></select>
    <select id="trainer-group"><option value="">كل المجموعات</option><option>1</option><option>2</option><option>3</option></select>
  </div>
  <div class="card" style="padding:10px"><table class="table trainer-table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>التقدم</th><th>المتوسط</th><th>نقطة الضعف</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${rows.map(s=>`<tr><td><strong>${s.name}</strong><div class="muted">${s.activity}</div></td><td>${s.group}</td><td><div class="progress table-progress"><span style="width:${s.progress}%"></span></div><small>${s.progress}%</small></td><td><strong>${s.avg}%</strong></td><td><span class="badge ${s.topic==="—"?"green":"orange"}">${s.topic}</span></td><td><span class="badge ${fmtRisk(s.risk)}">${s.risk}</span></td><td><button class="btn btn-soft mini-btn" data-student-id="${s.id}">360</button></td></tr>`).join("")}
  </tbody></table></div>`;
}

function student360(id){ return student360View(id); }

export function getTrainerView(page="tdash",filter="",id=null){
  if(page==="students")return studentsPage(filter);
  if(page==="interventions")return interventionCenterView();
  if(page==="notifications")return notificationsPage("trainer");
  if(page==="student360")return student360(id);
  if(page==="groups")return `
    <div class="page-intro"><span class="eyebrow blue">02 • المجموعات</span><h2>المجموعات</h2><p>قارن الأداء قبل اتخاذ تدخل جماعي.</p></div>
    <div class="grid-3"><div class="card"><h3>المجموعة 1</h3><div class="kpi-value">77%</div><div class="muted">21 متدرب • 4 يحتاج متابعة</div></div><div class="card"><h3>المجموعة 2</h3><div class="kpi-value">84%</div><div class="muted">16 متدرب • أداء مستقر</div></div><div class="card"><h3>المجموعة 3</h3><div class="kpi-value">69%</div><div class="muted">5 متدربين • 2 يحتاج متابعة</div></div></div>
    <div class="card" style="margin-top:14px"><h3>أبرز الفروقات</h3><div class="stat-row"><span>أفضل مجموعة</span><b>المجموعة 2 • 84%</b></div><div class="stat-row"><span>أعلى مخاطرة</span><b>المجموعة 3</b></div></div>`;
  if(page==="courses")return courseManagerView();
  if(page==="questions")return questionBankView();
  if(page==="exams"){
    const r=getTrainerExamSummary();
    return `
    <div class="page-intro with-action"><div><span class="eyebrow orange">05 • الاختبارات</span><h2>إدارة الاختبارات</h2><p>أنشئ الاختبار، راقب المحاولات، ثم انتقل من النتيجة إلى تحليل الموضوعات.</p></div><span class="badge ${r.attempts?"green":""}">${r.attempts?r.attempts+" محاولة مسجلة":"لا توجد محاولات بعد"}</span></div>
    <div class="student-grid-4">
      <div class="card trainer-kpi"><div class="muted">الاختبار</div><div class="kpi-value" style="font-size:19px">IPv4 & Binary</div><div class="muted">10 أسئلة • 5 دقائق Demo</div></div>
      <div class="card trainer-kpi"><div class="muted">آخر متوسط</div><div class="kpi-value">${r.avg?r.avg+"%":"—"}</div><div class="muted">آخر محاولة</div></div>
      <div class="card trainer-kpi"><div class="muted">حالة النجاح</div><div class="kpi-value">${r.attempts?(r.lastResult.passed?"✅":"↗"):"—"}</div><div class="muted">${r.attempts?(r.lastResult.passed?"ناجح":"يحتاج مراجعة"):"بانتظار محاولة"}</div></div>
      <div class="card trainer-kpi"><div class="muted">الحالة</div><div class="kpi-value" style="font-size:20px">${r.attempts?"مُستخدم":"جاهز"}</div><div class="muted">وضع العرض</div></div>
    </div>
    <div class="grid-2" style="margin-top:14px">
      <div class="card"><h3>إعداد الاختبار</h3><div class="stat-row"><span>الأسئلة</span><b>10</b></div><div class="stat-row"><span>المدة</span><b>5 دقائق</b></div><div class="stat-row"><span>النجاح</span><b>60%</b></div><div class="stat-row"><span>التصحيح</span><b>فوري في Demo</b></div><button class="btn btn-primary" data-demo-action="preview-exam" style="margin-top:12px">معاينة الاختبار</button></div>
      <div class="card"><h3>أداء الموضوعات</h3>${r.lastResult?r.lastResult.topics.map(x=>`<div class="topic-bar"><div><span>${x.topic}</span><b>${x.percent}%</b></div><div class="progress"><span style="width:${x.percent}%"></span></div></div>`).join(""):'<div class="empty">بعد أول محاولة ستظهر هنا خريطة الأداء حسب الموضوع.</div>'}</div>
    </div>
    <div class="section-title"><h3>ما الذي سيأتي بعد Demo؟</h3></div>
    <div class="card"><div class="stat-row"><span>بنك الأسئلة</span><b>سحب عشوائي + تصنيف</b></div><div class="stat-row"><span>المحاولات</span><b>حدود ومحاولات حسب الطالب</b></div><div class="stat-row"><span>التصحيح</span><b>Server-authoritative</b></div><div class="stat-row"><span>التحليل</span><b>Student 360 + Trainer Analytics</b></div></div>`;
  }
  if(page==="labs")return '<div class="page-intro"><span class="eyebrow green">06 • المختبرات</span><h2>المختبرات العملية</h2><p>تابع استخدام الطلاب للمختبرات.</p></div><div class="grid-3"><div class="card"><h3>Subnetting Lab</h3><div class="kpi-value">34</div><div class="muted">محاولة هذا الأسبوع</div></div><div class="card"><h3>IOS Lab</h3><div class="kpi-value">18</div><div class="muted">محاولة هذا الأسبوع</div></div><div class="card"><h3>Packet Tracer</h3><div class="kpi-value">21</div><div class="muted">محاولة هذا الأسبوع</div></div></div>';
  if(page==="analytics")return `
    <div class="page-intro"><span class="eyebrow purple">07 • التحليلات</span><h2>التحليلات واتخاذ القرار</h2><p>التحليل ليس أرقامًا فقط؛ كل مؤشر يجب أن يقود إلى إجراء.</p></div>
    <div class="student-grid-4">${stat("متوسط التقدم","71%","جميع الطلاب")}${stat("متوسط الاختبارات","78%","هذا الشهر")}${stat("دقة التدريب","74%","آخر 30 يومًا")}${stat("طلاب معرضون للخطر","7","تحتاج تدخل")}</div>
    <div class="grid-2" style="margin-top:14px"><div class="card"><h3>الموضوعات التي تحتاج تدخلًا</h3>${[["VLSM",48],["Subnet Mask",56],["Prefix",61],["Binary",72]].map(x=>`<div class="topic-bar"><div><span>${x[0]}</span><b>${x[1]}%</b></div><div class="progress"><span style="width:${x[1]}%"></span></div></div>`).join("")}</div><div class="card"><h3>ماذا نفعل الآن؟</h3><div class="stat-row"><span>الجلسة الجماعية التالية</span><b>VLSM</b></div><div class="stat-row"><span>طلاب متابعة فردية</span><b>7</b></div><div class="stat-row"><span>طلاب جاهزون للانتقال</span><b>12</b></div></div></div>`;
  return trainerDashboard();
}
