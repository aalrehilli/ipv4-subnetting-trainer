const state={page:'home',role:'student'};
const student={name:'المتدرب',level:'مبتدئ',progress:18,score:76,streak:4};
const trainer={name:'المدرب',students:42,active:31,passRate:78,atRisk:7};
const steps=[
  ['1','ابدأ من مستواي','اختبار تحديد المستوى'],
  ['2','تعلّم','IPv4 وBinary'],
  ['3','تدرّب','تمارين قصيرة'],
  ['4','اختبر','اختبار تحصيلي'],
  ['5','حسّن','مراجعة ذكية']
];

function el(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild}
function render(){
  document.getElementById('app').innerHTML=state.role==='student'?studentShell():trainerShell();
  bind();
}
function studentShell(){
  return el(`<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • منصة التدريب</small></div></div>
      <nav class="nav">
        ${['home','level','course','practice','exams','labs','progress','certificate'].map((p,i)=>`<button class="${state.page===p?'active':''}" data-page="${p}">${['الرئيسية','ابدأ من مستواي','المقرر','التدريب','الاختبارات','المختبرات','التقدم','الشهادة'][i]}</button>`).join('')}
      </nav>
      <div class="sidebar-footer">Learn → Practice → Assess → Analyze → Improve</div>
    </aside>
    <main class="main"><header class="topbar"><div class="topbar-title">لوحة المتدرب</div><div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض المدرب</button><div class="avatar">م</div></div></header><div class="container"><section class="page active">${studentPage()}</section></div></main>
  </div>`
  )
}
function trainerShell(){
  return el(`<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">IP</div><div class="brand-text"><h1>IPv4 Academy</h1><small>V2 • مركز المدرب</small></div></div>
      <nav class="nav">
        ${['tdash','students','groups','courses','questions','exams','labs','analytics'].map((p,i)=>`<button class="${state.page===p?'active':''}" data-page="${p}">${['الرئيسية','المتدربون','المجموعات','المقررات','بنك الأسئلة','الاختبارات','المختبرات','التحليلات'][i]}</button>`).join('')}
      </nav>
      <div class="sidebar-footer">Trainer Command Center • V2</div>
    </aside>
    <main class="main"><header class="topbar"><div class="topbar-title">مركز المدرب</div><div class="topbar-actions"><button class="btn btn-soft" id="switch-role">عرض المتدرب</button><div class="avatar">د</div></div></header><div class="container"><section class="page active">${trainerPage()}</section></div></main>
  </div>`
  )
}
function studentPage(){
  if(state.page==='level') return `<div class="hero"><div><h2>ابدأ من مستواك الحقيقي</h2><p>اختبار قصير يحدد نقاط القوة والضعف ثم يبني لك مساراً تدريبياً واضحاً.</p><div class="hero-actions"><button class="btn btn-white">بدء اختبار تحديد المستوى</button></div></div><div class="card" style="background:#ffffff18;color:#fff;border-color:#ffffff33"><b>مقترح اليوم</b><p>راجع Binary ثم انتقل إلى Prefix Length.</p></div></div>`;
  if(state.page==='practice') return `<div class="section-title"><h3>التدريب الذكي</h3><span class="badge green">4 أيام متتالية</span></div><div class="grid-3"><div class="card"><h3>Binary</h3><p class="muted">تحويل ثنائي ↔ عشري</p><div class="progress"><span style="width:72%"></span></div><p>72%</p><button class="btn btn-primary">ابدأ التمرين</button></div><div class="card"><h3>Prefix</h3><p class="muted">التعرف على /24 /25 /26...</p><div class="progress"><span style="width:48%"></span></div><p>48%</p><button class="btn btn-primary">ابدأ التمرين</button></div><div class="card"><h3>Subnet Mask</h3><p class="muted">إيجاد القناع والـ Magic Number</p><div class="progress"><span style="width:31%"></span></div><p>31%</p><button class="btn btn-primary">ابدأ التمرين</button></div></div>`;
  if(state.page==='exams') return `<div class="section-title"><h3>الاختبارات</h3><span class="badge">3 اختبارات متاحة</span></div><div class="grid-3"><div class="card"><h3>اختبار IPv4 الأساسي</h3><p class="muted">20 سؤال • 20 دقيقة</p><span class="badge orange">غير مجتاز</span><div style="margin-top:12px"><button class="btn btn-orange">بدء الاختبار</button></div></div><div class="card"><h3>Binary & Prefix</h3><p class="muted">15 سؤال • 15 دقيقة</p><span class="badge green">متاح</span><div style="margin-top:12px"><button class="btn btn-primary">بدء الاختبار</button></div></div><div class="card"><h3>FLSM</h3><p class="muted">25 سؤال • 25 دقيقة</p><span class="badge">قريباً</span></div></div>`;
  if(state.page==='progress') return `<div class="grid-4"><div class="card"><div class="muted">التقدم</div><div class="kpi-value">${student.progress}%</div></div><div class="card"><div class="muted">المتوسط</div><div class="kpi-value">${student.score}%</div></div><div class="card"><div class="muted">أيام متتالية</div><div class="kpi-value">${student.streak}</div></div><div class="card"><div class="muted">نقاط تحتاج مراجعة</div><div class="kpi-value">3</div></div></div><div class="card" style="margin-top:14px"><h3>مسار التعلم</h3><div class="path">${steps.map((s,i)=>`<div class="path-step ${i<1?'done':''}"><div class="num">${s[0]}</div><strong>${s[1]}</strong><div class="muted">${s[2]}</div></div>`).join('')}</div></div>`;
  if(state.page==='certificate') return `<div class="card" style="text-align:center;padding:40px"><div class="badge green">جاهزية الشهادة 42%</div><h2 style="color:var(--primary-2)">الشهادة الذكية</h2><p class="muted">ستُفعّل تلقائياً عند استيفاء متطلبات المقرر والاختبار النهائي.</p></div>`;
  return `<section class="hero"><div><div class="badge" style="background:#ffffff22;color:#fff">رحلتك اليوم</div><h2>مرحباً ${student.name} 👋</h2><p>الهدف ليس حفظ خطوات Subnetting؛ الهدف أن تتقنها وتستطيع تطبيقها في موقف عملي.</p><div class="hero-actions"><button class="btn btn-white" data-page="level">ابدأ من مستواي</button><button class="btn btn-soft" data-page="practice">تدريب سريع</button></div></div><div class="card" style="background:#ffffff16;border-color:#ffffff30;color:#fff"><div class="muted" style="color:#d9edff">المستوى الحالي</div><div style="font-size:32px;font-weight:900;margin:8px 0">مبتدئ</div><div class="progress"><span style="width:${student.progress}%"></span></div><p style="margin:8px 0 0">${student.progress}% من المسار الأساسي</p></div></section>
  <div class="section-title"><h3>نظرة سريعة</h3></div><div class="grid-4"><div class="card"><div class="muted">التقدم</div><div class="kpi-value">${student.progress}%</div></div><div class="card"><div class="muted">متوسط الاختبارات</div><div class="kpi-value">${student.score}%</div></div><div class="card"><div class="muted">الممارسة المتتالية</div><div class="kpi-value">${student.streak}</div></div><div class="card"><div class="muted">تحتاج مراجعة</div><div class="kpi-value">3</div></div></div>
  <div class="section-title"><h3>المسار التعليمي</h3></div><div class="path">${steps.map((s,i)=>`<div class="path-step ${i===0?'done':''}"><div class="num">${s[0]}</div><strong>${s[1]}</strong><div class="muted">${s[2]}</div></div>`).join('')}</div>
  <div class="section-title"><h3>ماذا تفعل الآن؟</h3></div><div class="action-grid"><div class="action-card"><strong>1. تحديد المستوى</strong><span class="muted">اعرف نقطة البداية</span><div style="margin-top:10px"><button class="btn btn-primary" data-page="level">ابدأ</button></div></div><div class="action-card"><strong>2. مراجعة ذكية</strong><span class="muted">3 نقاط ضعيفة مقترحة</span><div style="margin-top:10px"><button class="btn btn-purple" data-page="practice">راجع</button></div></div><div class="action-card"><strong>3. اختبار قصير</strong><span class="muted">15 سؤالاً</span><div style="margin-top:10px"><button class="btn btn-orange" data-page="exams">اختبر</button></div></div><div class="action-card"><strong>4. المختبر</strong><span class="muted">تطبيق عملي</span><div style="margin-top:10px"><button class="btn btn-green" data-page="labs">افتح</button></div></div></div>`;
}
function trainerPage(){
  if(state.page==='students') return `<div class="section-title"><h3>المتدربون</h3><span class="badge">${trainer.students} متدرب</span></div><div class="card"><table class="table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>التقدم</th><th>الحالة</th></tr></thead><tbody><tr><td>أحمد</td><td>1</td><td>84%</td><td><span class="badge green">مستقر</span></td></tr><tr><td>محمد</td><td>1</td><td>62%</td><td><span class="badge orange">يحتاج متابعة</span></td></tr><tr><td>سارة</td><td>2</td><td>91%</td><td><span class="badge green">ممتاز</span></td></tr></tbody></table></div>`;
  if(state.page==='analytics') return `<div class="section-title"><h3>التحليلات</h3><span class="badge">V2 Analytics Engine</span></div><div class="grid-4"><div class="card"><div class="muted">المتدربون النشطون</div><div class="kpi-value">${trainer.active}</div></div><div class="card"><div class="muted">محاولات الاختبارات</div><div class="kpi-value">186</div></div><div class="card"><div class="muted">نسبة النجاح</div><div class="kpi-value">${trainer.passRate}%</div></div><div class="card"><div class="muted">يحتاجون تدخل</div><div class="kpi-value">${trainer.atRisk}</div></div></div><div class="grid-2" style="margin-top:14px"><div class="card"><h3>أكثر الموضوعات ضعفاً</h3><div class="stat-row"><span>VLSM</span><b>48%</b></div><div class="stat-row"><span>Binary</span><b>61%</b></div><div class="stat-row"><span>Magic Number</span><b>64%</b></div></div><div class="card"><h3>أعلى مجموعتين</h3><div class="stat-row"><span>المجموعة 2</span><b>84%</b></div><div class="stat-row"><span>المجموعة 1</span><b>77%</b></div></div></div>`;
  return `<section class="hero"><div><div class="badge" style="background:#ffffff22;color:#fff">Trainer Command Center</div><h2>صورة واحدة لاتخاذ القرار</h2><p>لا نريد عشر شاشات للتقارير. نريد أن تعرف: من يحتاج المساعدة؟ في ماذا؟ وماذا يجب أن نفعل الآن؟</p><div class="hero-actions"><button class="btn btn-white" data-page="students">إدارة المتدربين</button><button class="btn btn-soft" data-page="analytics">فتح التحليلات</button></div></div><div class="card" style="background:#ffffff16;border-color:#ffffff30;color:#fff"><div class="muted" style="color:#d9edff">المؤشر الأهم</div><div style="font-size:42px;font-weight:900">${trainer.atRisk}</div><p>متدربون يحتاجون متابعة</p></div></section><div class="section-title"><h3>مؤشرات اليوم</h3></div><div class="grid-4"><div class="card"><div class="muted">إجمالي المتدربين</div><div class="kpi-value">${trainer.students}</div></div><div class="card"><div class="muted">النشطون</div><div class="kpi-value">${trainer.active}</div></div><div class="card"><div class="muted">نسبة النجاح</div><div class="kpi-value">${trainer.passRate}%</div></div><div class="card"><div class="muted">تحتاج متابعة</div><div class="kpi-value">${trainer.atRisk}</div></div></div><div class="section-title"><h3>إجراءات المدرب</h3></div><div class="action-grid"><div class="action-card"><strong>المتدربون</strong><span class="muted">بحث، مجموعات، حالة</span><div style="margin-top:10px"><button class="btn btn-primary" data-page="students">فتح</button></div></div><div class="action-card"><strong>بنك الأسئلة</strong><span class="muted">بناء ومراجعة الأسئلة</span><div style="margin-top:10px"><button class="btn btn-purple">فتح</button></div></div><div class="action-card"><strong>الاختبارات</strong><span class="muted">إنشاء وجدولة وتصحيح</span><div style="margin-top:10px"><button class="btn btn-orange" data-page="exams">فتح</button></div></div><div class="action-card"><strong>التحليلات</strong><span class="muted">أداء، موضوعات، مخاطر</span><div style="margin-top:10px"><button class="btn btn-green" data-page="analytics">فتح</button></div></div></div>`;
}
function bind(){
 document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{state.page=b.dataset.page;render()}));
 const sw=document.getElementById('switch-role'); if(sw) sw.addEventListener('click',()=>{state.role=state.role==='student'?'trainer':'student';state.page=state.role==='student'?'home':'tdash';render()});
}
render();
