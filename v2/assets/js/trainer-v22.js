import {getTrainerExamSummary} from "./exam-v23.js";

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
  return `
  <div class="trainer-command-hero">
    <div><span class="eyebrow">Trainer Command Center • V2.2</span><h1>اتخذ القرار من شاشة واحدة</h1>
      <p>بدل البحث داخل التقارير، ابدأ بالطلاب الذين يحتاجون تدخلاً، ثم نفّذ الإجراء المناسب مباشرة.</p>
    </div>
    <div class="command-priority"><span>أولوية اليوم</span><strong>${risk.length}</strong><small>متدربين يحتاجون متابعة</small></div>
  </div>

  <div class="student-grid-4 trainer-kpis">
    ${stat("إجمالي المتدربين","42","6 مجموعات")}
    ${stat("النشطون اليوم","31","74% من الإجمالي")}
    ${stat("نسبة النجاح","78%","+4% عن الأسبوع الماضي")}
    ${stat("عالي المخاطر","7","يحتاجون تدخلًا")}
  </div>

  <div class="section-title"><h3>ماذا يحتاج انتباهك الآن؟</h3><span class="badge red">أولوية</span></div>
  <div class="intervention-grid">
    <div class="card intervention-card urgent"><div class="intervention-icon">!</div><div><strong>4 متدربين</strong><h3>ضعف في Subnet Mask / Magic Number</h3><p class="muted">متوسط الإتقان أقل من 50% في المجموعة المعنية.</p></div><button class="btn btn-danger" data-trainer-page="students" data-risk="مرتفع">عرض الطلاب</button></div>
    <div class="card intervention-card"><div class="intervention-icon purple">✦</div><div><strong>3 متدربين</strong><h3>يحتاجون مراجعة Prefix</h3><p class="muted">الأخطاء تتكرر رغم إكمال الدروس الأساسية.</p></div><button class="btn btn-purple" data-trainer-page="students" data-risk="متوسط">عرض الطلاب</button></div>
    <div class="card intervention-card"><div class="intervention-icon green">✓</div><div><strong>5 متدربين</strong><h3>جاهزون للانتقال إلى FLSM</h3><p class="muted">حققوا مستوى إتقان يسمح بالانتقال للموضوع التالي.</p></div><button class="btn btn-green" data-trainer-page="students" data-risk="منخفض">عرض الطلاب</button></div>
  </div>

  <div class="section-title"><h3>قائمة المتابعة</h3><button class="link-btn" data-trainer-page="students">عرض جميع المتدربين</button></div>
  <div class="card risk-list">
    ${risk.slice(0,4).map((s,i)=>`
      <div class="risk-row">
        <div class="risk-rank">${i+1}</div>
        <div class="risk-person"><strong>${s.name}</strong><span class="muted">المجموعة ${s.group} • آخر نشاط: ${s.last}</span></div>
        <span class="badge ${fmtRisk(s.risk)}">${s.risk}</span>
        <div class="risk-topic"><strong>${s.topic}</strong><span class="muted">إتقان ${s.weakness}%</span></div>
        <button class="btn btn-soft mini-btn" data-student-id="${s.id}">Student 360</button>
      </div>`).join("")}
  </div>

  <div class="section-title"><h3>مؤشرات المقرر</h3></div>
  <div class="grid-2">
    <div class="card"><h3>أداء الموضوعات</h3>
      ${[["IPv4",84],["Binary",72],["Prefix",61],["Subnet Mask",56],["FLSM",69],["VLSM",48]].map(x=>`<div class="topic-bar"><div><span>${x[0]}</span><b>${x[1]}%</b></div><div class="progress"><span style="width:${x[1]}%"></span></div></div>`).join("")}
    </div>
    <div class="card"><h3>النشاط خلال الأسبوع</h3>
      <div class="weekly-bars trainer-bars">${[42,58,51,70,63,88,76].map((v,i)=>`<div><span style="height:${v}%"></span><small>${["أ","ح","ن","ث","ر","خ","ج"][i]}</small></div>`).join("")}</div>
      <div class="muted" style="margin-top:8px">أفضل يوم: الخميس</div>
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

function student360(id){
  const s=students.find(x=>x.id===Number(id))||students[0];
  const topics=[["IPv4",91],["Binary",72],["Prefix",58],["Subnet Mask",s.weakness],["FLSM",66],["VLSM",42]];
  return `
  <div class="page-intro with-action"><div><span class="eyebrow purple">Student 360</span><h2>${s.name}</h2><p>المجموعة ${s.group} • آخر نشاط ${s.last}</p></div><button class="btn btn-soft" data-trainer-page="students">رجوع للمتدربين</button></div>
  <div class="student360-head card"><div class="student360-avatar">${s.name.slice(0,1)}</div><div class="student360-main"><h3>${s.name}</h3><div class="muted">التقدم ${s.progress}% • متوسط الأداء ${s.avg}% • الاتجاه ${s.trend}</div><div class="progress" style="margin-top:10px"><span style="width:${s.progress}%"></span></div></div><div><span class="badge ${fmtRisk(s.risk)}">${s.risk}</span><div class="muted" style="margin-top:8px">أولوية: ${s.topic}</div></div></div>
  <div class="student-grid-4">${stat("التقدم",s.progress+"%","من المقرر")}${stat("المتوسط",s.avg+"%","آخر المحاولات")}${stat("نقطة الضعف",s.weakness+"%",s.topic)}${stat("النشاط",s.activity,"آخر: "+s.last)}</div>
  <div class="grid-2" style="margin-top:14px">
    <div class="card"><h3>خريطة الإتقان</h3>${topics.map(x=>`<div class="topic-bar"><div><span>${x[0]}</span><b>${x[1]}%</b></div><div class="progress"><span style="width:${x[1]}%"></span></div></div>`).join("")}</div>
    <div class="card"><h3>التحليل</h3><div class="analysis-box"><strong>المشكلة الرئيسية</strong><p class="muted">${s.topic==="—"?"لا توجد نقطة ضعف حرجة حاليًا.":"أداء "+s.topic+" أقل من المستوى المطلوب ويظهر كموضوع متكرر في الأخطاء."}</p></div><div class="analysis-box"><strong>الإجراء المقترح</strong><p class="muted">${s.risk==="مرتفع"?actions.high:s.risk==="متوسط"?actions.medium:actions.low}</p></div><button class="btn btn-purple" data-demo-action="assign-review">تعيين مراجعة ذكية</button> <button class="btn btn-soft" data-demo-action="add-note">إضافة ملاحظة</button></div>
  </div>
  <div class="card intervention-log"><h3>آخر الأحداث</h3><div class="stat-row"><span>حل Binary Practice</span><b>80%</b></div><div class="stat-row"><span>اختبار Prefix</span><b>58%</b></div><div class="stat-row"><span>درس Subnet Mask</span><b>مكتمل</b></div></div>
  `;
}

export function getTrainerView(page="tdash",filter="",id=null){
  if(page==="students")return studentsPage(filter);
  if(page==="student360")return student360(id);
  if(page==="groups")return `
    <div class="page-intro"><span class="eyebrow blue">02 • المجموعات</span><h2>المجموعات</h2><p>قارن الأداء قبل اتخاذ تدخل جماعي.</p></div>
    <div class="grid-3"><div class="card"><h3>المجموعة 1</h3><div class="kpi-value">77%</div><div class="muted">21 متدرب • 4 يحتاج متابعة</div></div><div class="card"><h3>المجموعة 2</h3><div class="kpi-value">84%</div><div class="muted">16 متدرب • أداء مستقر</div></div><div class="card"><h3>المجموعة 3</h3><div class="kpi-value">69%</div><div class="muted">5 متدربين • 2 يحتاج متابعة</div></div></div>
    <div class="card" style="margin-top:14px"><h3>أبرز الفروقات</h3><div class="stat-row"><span>أفضل مجموعة</span><b>المجموعة 2 • 84%</b></div><div class="stat-row"><span>أعلى مخاطرة</span><b>المجموعة 3</b></div></div>`;
  if(page==="courses")return '<div class="page-intro"><span class="eyebrow blue">03 • المقررات</span><h2>إدارة المحتوى</h2><p>محتوى متصل بمسار الطالب.</p></div><div class="grid-2"><div class="card"><h3>IPv4 Fundamentals</h3><p class="muted">6 وحدات • 40+ سؤالًا</p><span class="badge green">منشور</span></div><div class="card"><h3>Subnetting Mastery</h3><p class="muted">8 وحدات • 60 سؤالًا</p><span class="badge orange">مسودة</span></div></div>';
  if(page==="questions")return '<div class="page-intro"><span class="eyebrow purple">04 • بنك الأسئلة</span><h2>بنك الأسئلة</h2><p>102 سؤالًا مصنفة حسب الموضوع والصعوبة.</p></div><div class="student-grid-4"><div class="card"><div class="muted">IPv4</div><div class="kpi-value">20</div></div><div class="card"><div class="muted">Binary</div><div class="kpi-value">28</div></div><div class="card"><div class="muted">Prefix</div><div class="kpi-value">21</div></div><div class="card"><div class="muted">VLSM</div><div class="kpi-value">22</div></div></div>';
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
