const state={page:'home',role:'student',practiceIndex:0,practiceScore:0,practiceDone:false,toast:''};
const student={name:'المتدرب',level:'مبتدئ',progress:18,score:76,streak:4};
const trainer={name:'المدرب',students:42,active:31,passRate:78,atRisk:7};
const steps=[
  ['1','ابدأ من مستواي','اختبار تحديد المستوى'],
  ['2','تعلّم','IPv4 وBinary'],
  ['3','تدرّب','تمارين قصيرة'],
  ['4','اختبر','اختبار تحصيلي'],
  ['5','حسّن','مراجعة ذكية']
];
const lessons=[
  {id:1,title:'مقدمة في IPv4',desc:'فهم العنوان IPv4 وأجزاءه الأساسية',time:'12 دقيقة',done:true},
  {id:2,title:'أنظمة الترقيم',desc:'تحويل Binary وDecimal بطريقة سهلة',time:'18 دقيقة',done:true},
  {id:3,title:'Prefix Length',desc:'فهم /24 و /25 و /26 وغيرها',time:'20 دقيقة',done:false},
  {id:4,title:'Subnet Mask',desc:'استخراج القناع وMagic Number',time:'22 دقيقة',done:false},
  {id:5,title:'FLSM',desc:'تقسيم الشبكة إلى شبكات متساوية',time:'28 دقيقة',done:false},
  {id:6,title:'VLSM',desc:'تقسيم الشبكة حسب احتياج الأجهزة',time:'32 دقيقة',done:false}
];
const practiceQuestions=[
  {q:'ما القيمة العشرية للعدد الثنائي 00001010؟',opts:['8','10','12','14'],a:1,topic:'Binary'},
  {q:'ما القناع المناسب للبادئة /24؟',opts:['255.0.0.0','255.255.0.0','255.255.255.0','255.255.255.128'],a:2,topic:'Prefix'},
  {q:'كم عدد العناوين في شبكة /26؟',opts:['32','64','128','256'],a:1,topic:'Subnetting'},
  {q:'ما قيمة الـ Magic Number في /26؟',opts:['16','32','64','128'],a:1,topic:'Subnet Mask'},
  {q:'أي عنوان يمثل شبكة /24 صحيحة؟',opts:['192.168.10.0','192.168.10.1','192.168.10.255','192.168.10.256'],a:0,topic:'IPv4'}
];

function el(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild}
function render(){
  document.getElementById('app').innerHTML=state.role==='student'?studentShell():trainerShell();
  bind();
}
function navButton(p,label){return '<button class="'+(state.page===p?'active':'')+'" data-page="'+p+'">'+label+'</button>'}
function studentShell(){
  return el('<div class="app-shell">'+
    '<aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • منصة التدريب</small></div></div>'+
    '<nav class="nav">'+
    navButton('home','الرئيسية')+navButton('level','ابدأ من مستواي')+navButton('course','المقرر')+navButton('practice','التدريب')+navButton('exams','الاختبارات')+navButton('labs','المختبرات')+navButton('progress','التقدم')+navButton('certificate','الشهادة')+
    '</nav><div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div></aside>'+
    '<main class="main"><header class="topbar"><div class="topbar-title">لوحة المتدرب</div><div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض المدرب <span style="font-size:11px">(تجريبي)</span></button><div class="avatar">م</div></div></header><div class="container"><section class="page active">'+studentPage()+'</section></div></main></div>');
}
function trainerShell(){
  return el('<div class="app-shell">'+
    '<aside class="sidebar"><div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • مركز المدرب</small></div></div>'+
    '<nav class="nav">'+
    navButton('tdash','الرئيسية')+navButton('students','المتدربون')+navButton('groups','المجموعات')+navButton('courses','المقررات')+navButton('questions','بنك الأسئلة')+navButton('exams','الاختبارات')+navButton('labs','المختبرات')+navButton('analytics','التحليلات')+
    '</nav><div class="sidebar-footer">Trainer Command Center • V2</div></aside>'+
    '<main class="main"><header class="topbar"><div class="topbar-title">مركز المدرب</div><div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض المتدرب</button><div class="avatar">د</div></div></header><div class="container"><section class="page active">'+trainerPage()+'</section></div></main></div>');
}
function studentPage(){
  if(state.page==='level') return levelPage();
  if(state.page==='course') return coursePage();
  if(state.page==='practice') return practicePage();
  if(state.page==='exams') return examsPage();
  if(state.page==='labs') return labsPage();
  if(state.page==='progress') return progressPage();
  if(state.page==='certificate') return certificatePage();
  return homePage();
}
function homePage(){
 return '<section class="hero"><div><div class="badge" style="background:#ffffff22;color:#fff">رحلتك اليوم</div><h2>مرحباً '+student.name+' 👋</h2><p>الهدف ليس حفظ خطوات Subnetting؛ الهدف أن تتقنها وتستطيع تطبيقها في موقف عملي.</p><div class="hero-actions"><button class="btn btn-white" data-page="level">ابدأ من مستواي</button><button class="btn btn-soft" data-page="practice">تدريب سريع</button></div></div><div class="card" style="background:#ffffff16;border-color:#ffffff30;color:#fff"><div class="muted" style="color:#d9edff">المستوى الحالي</div><div style="font-size:32px;font-weight:900;margin:8px 0">مبتدئ</div><div class="progress"><span style="width:'+student.progress+'%"></span></div><p style="margin:8px 0 0">'+student.progress+'% من المسار الأساسي</p></div></section>'+
 '<div class="section-title"><h3>نظرة سريعة</h3></div><div class="grid-4"><div class="card"><div class="muted">التقدم</div><div class="kpi-value">'+student.progress+'%</div></div><div class="card"><div class="muted">متوسط الاختبارات</div><div class="kpi-value">'+student.score+'%</div></div><div class="card"><div class="muted">الممارسة المتتالية</div><div class="kpi-value">'+student.streak+'</div></div><div class="card"><div class="muted">تحتاج مراجعة</div><div class="kpi-value">3</div></div></div>'+
 '<div class="section-title"><h3>المسار التعليمي</h3></div><div class="path">'+steps.map((s,i)=>'<div class="path-step '+(i===0?'done':'')+'"><div class="num">'+s[0]+'</div><strong>'+s[1]+'</strong><div class="muted">'+s[2]+'</div></div>').join('')+'</div>'+
 '<div class="section-title"><h3>ماذا تفعل الآن؟</h3></div><div class="action-grid"><div class="action-card"><strong>1. تحديد المستوى</strong><span class="muted">اعرف نقطة البداية</span><div style="margin-top:10px"><button class="btn btn-primary" data-page="level">ابدأ</button></div></div><div class="action-card"><strong>2. مراجعة ذكية</strong><span class="muted">3 نقاط ضعف مقترحة</span><div style="margin-top:10px"><button class="btn btn-purple" data-page="practice">راجع</button></div></div><div class="action-card"><strong>3. اختبار قصير</strong><span class="muted">15 سؤالاً</span><div style="margin-top:10px"><button class="btn btn-orange" data-page="exams">اختبر</button></div></div><div class="action-card"><strong>4. المختبر</strong><span class="muted">تطبيق عملي</span><div style="margin-top:10px"><button class="btn btn-green" data-page="labs">افتح</button></div></div></div>';
}
function levelPage(){
 return '<div class="hero"><div><h2>ابدأ من مستواك الحقيقي</h2><p>اختبار قصير يحدد نقاط القوة والضعف ثم يبني لك مساراً تدريبياً واضحاً.</p><div class="hero-actions"><button class="btn btn-white" data-page="practice">ابدأ الاختبار التشخيصي</button></div></div><div class="card" style="background:#ffffff18;color:#fff;border-color:#ffffff33"><b>مقترح اليوم</b><p>راجع Binary ثم انتقل إلى Prefix Length.</p></div></div><div class="section-title"><h3>كيف يعمل تحديد المستوى؟</h3></div><div class="grid-3"><div class="card"><h3>1. قياس</h3><p class="muted">أسئلة قصيرة في IPv4 وBinary وPrefix.</p></div><div class="card"><h3>2. تشخيص</h3><p class="muted">تحديد الموضوعات التي تحتاج تدريباً.</p></div><div class="card"><h3>3. مسار شخصي</h3><p class="muted">اقتراح الخطوة التالية دون تخمين.</p></div></div>';
}
function coursePage(){
 return '<div class="section-title"><h3>المقرر الأساسي</h3><span class="badge">'+lessons.filter(x=>x.done).length+'/'+lessons.length+' دروس مكتملة</span></div><div class="grid-2">'+lessons.map(l=>'<div class="card"><div style="display:flex;justify-content:space-between;gap:10px"><div><h3>'+l.title+'</h3><p class="muted">'+l.desc+'</p></div><span class="badge '+(l.done?'green':'')+'">'+(l.done?'مكتمل':'متاح')+'</span></div><div class="stat-row"><span>المدة</span><b>'+l.time+'</b></div><div style="margin-top:12px"><button class="btn '+(l.done?'btn-soft':'btn-primary')+'" data-lesson="'+l.id+'">'+(l.done?'مراجعة الدرس':'ابدأ الدرس')+'</button></div></div>').join('')+'</div>';
}
function practicePage(){
 if(state.practiceDone) return '<div class="card" style="text-align:center;padding:36px"><div class="badge green">اكتمل التدريب</div><h2 style="color:var(--primary-2)">نتيجتك '+state.practiceScore+'/'+practiceQuestions.length+'</h2><p class="muted">الخطوة التالية: مراجعة الأخطاء ثم إعادة المحاولة.</p><button class="btn btn-primary" id="restart-practice">إعادة التدريب</button> <button class="btn btn-purple" data-page="progress">عرض التقدم</button></div>';
 const q=practiceQuestions[state.practiceIndex];
 return '<div class="section-title"><h3>التدريب القصير</h3><span class="badge">سؤال '+(state.practiceIndex+1)+' من '+practiceQuestions.length+'</span></div><div class="card"><div class="muted">'+q.topic+'</div><h2 style="color:var(--primary-2);margin:12px 0 18px">'+q.q+'</h2><div class="grid-2">'+q.opts.map((o,i)=>'<button class="btn btn-soft practice-option" data-answer="'+i+'" style="text-align:right;padding:15px;border-radius:13px">'+String.fromCharCode(65+i)+'. '+o+'</button>').join('')+'</div><div id="practice-feedback" style="margin-top:16px"></div></div>';
}
function examsPage(){
 return '<div class="section-title"><h3>الاختبارات</h3><span class="badge">3 اختبارات</span></div><div class="grid-3"><div class="card"><h3>اختبار IPv4 الأساسي</h3><p class="muted">20 سؤال • 20 دقيقة</p><span class="badge orange">تشخيصي</span><div style="margin-top:12px"><button class="btn btn-orange" data-page="practice">بدء</button></div></div><div class="card"><h3>Binary & Prefix</h3><p class="muted">15 سؤال • 15 دقيقة</p><span class="badge green">متاح</span><div style="margin-top:12px"><button class="btn btn-primary" data-page="practice">بدء</button></div></div><div class="card"><h3>FLSM</h3><p class="muted">25 سؤال • 25 دقيقة</p><span class="badge">قريباً</span></div></div>';
}
function labsPage(){
 return '<div class="section-title"><h3>المختبرات</h3><span class="badge green">تعلم بالممارسة</span></div><div class="grid-3"><div class="card"><h3>Subnetting Lab</h3><p class="muted">قسّم شبكة /24 إلى شبكات أصغر وحدد Network/Broadcast/Hosts.</p><button class="btn btn-green">فتح المختبر</button></div><div class="card"><h3>Binary Lab</h3><p class="muted">تدريب تفاعلي على تمثيل IPv4 بالثنائي.</p><button class="btn btn-green">فتح المختبر</button></div><div class="card"><h3>Packet Tracer</h3><p class="muted">المختبر العملي سيُربط في مرحلة الربط مع النظام.</p><span class="badge orange">المرحلة التالية</span></div></div>';
}
function progressPage(){
 return '<div class="grid-4"><div class="card"><div class="muted">التقدم</div><div class="kpi-value">'+student.progress+'%</div></div><div class="card"><div class="muted">المتوسط</div><div class="kpi-value">'+student.score+'%</div></div><div class="card"><div class="muted">أيام متتالية</div><div class="kpi-value">'+student.streak+'</div></div><div class="card"><div class="muted">تحتاج مراجعة</div><div class="kpi-value">3</div></div></div><div class="card" style="margin-top:14px"><h3>مسار التعلم</h3><div class="path">'+steps.map((s,i)=>'<div class="path-step '+(i<2?'done':'')+'"><div class="num">'+s[0]+'</div><strong>'+s[1]+'</strong><div class="muted">'+s[2]+'</div></div>').join('')+'</div></div>';
}
function certificatePage(){
 return '<div class="card" style="text-align:center;padding:40px"><div class="badge green">جاهزية الشهادة 42%</div><h2 style="color:var(--primary-2)">الشهادة الذكية</h2><p class="muted">ستُفعّل تلقائياً عند استيفاء متطلبات المقرر والاختبار النهائي.</p></div>';
}
function trainerPage(){
 if(state.page==='students') return '<div class="section-title"><h3>المتدربون</h3><span class="badge">'+trainer.students+' متدرب</span></div><div class="card"><table class="table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>التقدم</th><th>الحالة</th></tr></thead><tbody><tr><td>أحمد</td><td>1</td><td>84%</td><td><span class="badge green">مستقر</span></td></tr><tr><td>محمد</td><td>1</td><td>62%</td><td><span class="badge orange">يحتاج متابعة</span></td></tr><tr><td>سارة</td><td>2</td><td>91%</td><td><span class="badge green">ممتاز</span></td></tr></tbody></table></div>';
 if(state.page==='groups') return '<div class="section-title"><h3>المجموعات</h3><span class="badge">V2</span></div><div class="grid-3"><div class="card"><h3>المجموعة 1</h3><div class="kpi-value">77%</div><div class="muted">متوسط الأداء • 21 متدرب</div></div><div class="card"><h3>المجموعة 2</h3><div class="kpi-value">84%</div><div class="muted">متوسط الأداء • 16 متدرب</div></div><div class="card"><h3>المجموعة 3</h3><div class="kpi-value">69%</div><div class="muted">متوسط الأداء • 5 متدربين</div></div></div>';
 if(state.page==='courses') return '<div class="section-title"><h3>إدارة المقرر</h3></div><div class="grid-2"><div class="card"><h3>IPv4 Fundamentals</h3><p class="muted">6 دروس • 42 سؤالاً</p><span class="badge green">منشور</span></div><div class="card"><h3>Subnetting Mastery</h3><p class="muted">8 دروس • 60 سؤالاً</p><span class="badge orange">مسودة</span></div></div>';
 if(state.page==='questions') return '<div class="section-title"><h3>بنك الأسئلة</h3><span class="badge">102 سؤال</span></div><div class="grid-4"><div class="card"><div class="muted">Binary</div><div class="kpi-value">28</div></div><div class="card"><div class="muted">Prefix</div><div class="kpi-value">21</div></div><div class="card"><div class="muted">FLSM</div><div class="kpi-value">31</div></div><div class="card"><div class="muted">VLSM</div><div class="kpi-value">22</div></div></div>';
 if(state.page==='exams') return '<div class="section-title"><h3>إدارة الاختبارات</h3><span class="badge">4 اختبارات</span></div><div class="card"><table class="table"><thead><tr><th>الاختبار</th><th>الحالة</th><th>المحاولات</th><th>متوسط</th></tr></thead><tbody><tr><td>IPv4 الأساسي</td><td><span class="badge green">مفتوح</span></td><td>66</td><td>76%</td></tr><tr><td>Binary & Prefix</td><td><span class="badge orange">مجدول</span></td><td>41</td><td>71%</td></tr></tbody></table></div>';
 if(state.page==='labs') return '<div class="section-title"><h3>المختبرات العملية</h3></div><div class="grid-3"><div class="card"><h3>Subnetting Lab</h3><p class="muted">34 محاولة هذا الأسبوع</p></div><div class="card"><h3>IOS Lab</h3><p class="muted">18 محاولة هذا الأسبوع</p></div><div class="card"><h3>Packet Tracer</h3><p class="muted">21 محاولة هذا الأسبوع</p></div></div>';
 if(state.page==='analytics') return '<div class="section-title"><h3>التحليلات</h3><span class="badge">V2 Analytics Engine</span></div><div class="grid-4"><div class="card"><div class="muted">النشطون</div><div class="kpi-value">'+trainer.active+'</div></div><div class="card"><div class="muted">المحاولات</div><div class="kpi-value">186</div></div><div class="card"><div class="muted">النجاح</div><div class="kpi-value">'+trainer.passRate+'%</div></div><div class="card"><div class="muted">تحتاج تدخل</div><div class="kpi-value">'+trainer.atRisk+'</div></div></div><div class="grid-2" style="margin-top:14px"><div class="card"><h3>أكثر الموضوعات ضعفاً</h3><div class="stat-row"><span>VLSM</span><b>48%</b></div><div class="stat-row"><span>Binary</span><b>61%</b></div><div class="stat-row"><span>Magic Number</span><b>64%</b></div></div><div class="card"><h3>أعلى المجموعات</h3><div class="stat-row"><span>المجموعة 2</span><b>84%</b></div><div class="stat-row"><span>المجموعة 1</span><b>77%</b></div></div></div>';
 return '<section class="hero"><div><div class="badge" style="background:#ffffff22;color:#fff">Trainer Command Center</div><h2>صورة واحدة لاتخاذ القرار</h2><p>لا نريد عشر شاشات للتقارير. نريد أن تعرف: من يحتاج المساعدة؟ في ماذا؟ وماذا يجب أن نفعل الآن؟</p><div class="hero-actions"><button class="btn btn-white" data-page="students">إدارة المتدربين</button><button class="btn btn-soft" data-page="analytics">فتح التحليلات</button></div></div><div class="card" style="background:#ffffff16;border-color:#ffffff30;color:#fff"><div class="muted" style="color:#d9edff">المؤشر الأهم</div><div style="font-size:42px;font-weight:900">'+trainer.atRisk+'</div><p>متدربون يحتاجون متابعة</p></div></section><div class="section-title"><h3>مؤشرات اليوم</h3></div><div class="grid-4"><div class="card"><div class="muted">إجمالي المتدربين</div><div class="kpi-value">'+trainer.students+'</div></div><div class="card"><div class="muted">النشطون</div><div class="kpi-value">'+trainer.active+'</div></div><div class="card"><div class="muted">نسبة النجاح</div><div class="kpi-value">'+trainer.passRate+'%</div></div><div class="card"><div class="muted">تحتاج متابعة</div><div class="kpi-value">'+trainer.atRisk+'</div></div></div><div class="section-title"><h3>إجراءات المدرب</h3></div><div class="action-grid"><div class="action-card"><strong>المتدربون</strong><span class="muted">بحث، مجموعات، حالة</span><div style="margin-top:10px"><button class="btn btn-primary" data-page="students">فتح</button></div></div><div class="action-card"><strong>بنك الأسئلة</strong><span class="muted">بناء ومراجعة الأسئلة</span><div style="margin-top:10px"><button class="btn btn-purple" data-page="questions">فتح</button></div></div><div class="action-card"><strong>الاختبارات</strong><span class="muted">إنشاء وجدولة وتصحيح</span><div style="margin-top:10px"><button class="btn btn-orange" data-page="exams">فتح</button></div></div><div class="action-card"><strong>التحليلات</strong><span class="muted">أداء، موضوعات، مخاطر</span><div style="margin-top:10px"><button class="btn btn-green" data-page="analytics">فتح</button></div></div></div>';
}
function bind(){
 document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{state.page=b.dataset.page;render()}));
 document.querySelectorAll('[data-lesson]').forEach(b=>b.addEventListener('click',()=>{alert('سيتم ربط محتوى الدرس بقاعدة البيانات في المرحلة التالية. الدرس رقم '+b.dataset.lesson);}));
 const sw=document.getElementById('switch-role'); if(sw) sw.addEventListener('click',()=>{state.role=state.role==='student'?'trainer':'student';state.page=state.role==='student'?'home':'tdash';render()});
 document.querySelectorAll('.practice-option').forEach(b=>b.addEventListener('click',()=>answerPractice(Number(b.dataset.answer))));
 const restart=document.getElementById('restart-practice'); if(restart) restart.addEventListener('click',()=>{state.practiceIndex=0;state.practiceScore=0;state.practiceDone=false;render()});
}
function answerPractice(answer){
 const q=practiceQuestions[state.practiceIndex];
 document.querySelectorAll('.practice-option').forEach(b=>b.disabled=true);
 const feedback=document.getElementById('practice-feedback');
 const ok=answer===q.a;
 if(ok) state.practiceScore++;
 feedback.innerHTML='<div class="'+(ok?'good':'bad')+'">'+(ok?'إجابة صحيحة ✅':'إجابة غير صحيحة ❌')+'<div style="margin-top:6px">الإجابة الصحيحة: '+q.opts[q.a]+'</div></div><button class="btn btn-primary" id="next-practice" style="margin-top:10px">'+(state.practiceIndex===practiceQuestions.length-1?'عرض النتيجة':'السؤال التالي')+'</button>';
 document.getElementById('next-practice').addEventListener('click',()=>{if(state.practiceIndex===practiceQuestions.length-1){state.practiceDone=true}else{state.practiceIndex++}render()});
}
render();
