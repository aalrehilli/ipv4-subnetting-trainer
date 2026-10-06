const KEY="ipv4AcademyV34Courses";
const ACTIVE="ipv4AcademyV34ActiveCourse";

const seed=[
  {id:1,title:"IPv4 Fundamentals",code:"IPV4-101",description:"أساسيات IPv4 والعناوين والقواعد اللازمة لفهم Subnetting.",status:"published",units:6,lessons:18,questions:40,progress:84,students:42,updated:"اليوم",owner:"قسم الحاسب"},
  {id:2,title:"Subnetting Mastery",code:"SUB-201",description:"من Prefix وMask إلى FLSM وVLSM وحل المسائل العملية.",status:"draft",units:8,lessons:24,questions:60,progress:42,students:0,updated:"أمس",owner:"قسم الحاسب"},
  {id:3,title:"CCNA Network Essentials",code:"NET-301",description:"مسار تأسيسي للشبكات مع تطبيقات Ethernet وARP وRouting.",status:"draft",units:10,lessons:30,questions:80,progress:0,students:0,updated:"هذا الأسبوع",owner:"قسم الحاسب"}
];

function read(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY)||"null");
    return Array.isArray(x)&&x.length?x:seed.map(v=>({...v}));
  }catch{return seed.map(v=>({...v}))}
}
function write(list){localStorage.setItem(KEY,JSON.stringify(list));return list}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function statusLabel(s){return s==="published"?"منشور":s==="archived"?"مؤرشف":"مسودة"}
function statusTone(s){return s==="published"?"green":s==="archived"?"red":"orange"}

export function getCourses(){
  const list=read();
  if(!localStorage.getItem(KEY))write(list);
  return list;
}

function nextId(list){return list.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1}

export function handleCourseAction(target){
  const action=target.dataset.courseAction;
  const id=Number(target.dataset.courseId);
  const list=getCourses();
  if(action==="new")return {rerender:true,newCourse:true};
  if(action==="close-form")return {rerender:true};
  if(action==="back"){localStorage.removeItem(ACTIVE);return {rerender:true};}
  if(action==="edit"){localStorage.setItem(ACTIVE,String(id));return {rerender:true};}
  if(action==="publish"){
    const item=list.find(x=>x.id===id);
    if(item){item.status="published";item.updated="الآن";}
  }else if(action==="draft"){
    const item=list.find(x=>x.id===id);
    if(item){item.status="draft";item.updated="الآن";}
  }else if(action==="archive"){
    const item=list.find(x=>x.id===id);
    if(item){item.status="archived";item.updated="الآن";}
  }else if(action==="delete"){
    write(list.filter(x=>x.id!==id));
    return {rerender:true};
  }else if(action==="duplicate"){
    const item=list.find(x=>x.id===id);
    if(item){
      const copy={...item,id:nextId(list),title:item.title+" — نسخة",code:item.code+"-COPY",status:"draft",students:0,progress:0,updated:"الآن"};
      write([copy,...list]);
    }
    return {rerender:true};
  }
  write(list);
  return {rerender:true};
}

export function handleCourseForm(form){
  const data=new FormData(form);
  const title=String(data.get("title")||"").trim();
  const code=String(data.get("code")||"").trim();
  const description=String(data.get("description")||"").trim();
  if(!title||!code)return {ok:false,message:"اكتب اسم المقرر ورمز المقرر."};
  const list=getCourses();
  list.unshift({id:nextId(list),title,code,description,status:"draft",units:0,lessons:0,questions:0,progress:0,students:0,updated:"الآن",owner:"المدرب"});
  write(list);
  return {ok:true};
}

function kpi(label,value,sub){
  return '<div class="card trainer-kpi"><div class="muted">'+label+'</div><div class="kpi-value">'+value+'</div><div class="muted">'+sub+'</div></div>';
}

function courseCard(c){
  return '<article class="course-manager-card '+c.status+'" data-course-item-status="'+c.status+'">'+
    '<div class="course-manager-top"><span class="course-code">'+esc(c.code)+'</span><span class="badge '+statusTone(c.status)+'">'+statusLabel(c.status)+'</span></div>'+
    '<h3>'+esc(c.title)+'</h3>'+
    '<p>'+esc(c.description)+'</p>'+
    '<div class="course-manager-stats"><span><b>'+c.units+'</b> وحدات</span><span><b>'+c.lessons+'</b> درس</span><span><b>'+c.questions+'</b> سؤال</span><span><b>'+c.students+'</b> متدرب</span></div>'+
    '<div class="course-manager-progress"><div><span>اكتمال المحتوى</span><strong>'+c.progress+'%</strong></div><div class="progress"><span style="width:'+c.progress+'%"></span></div></div>'+
    '<div class="course-manager-actions">'+
      '<button class="btn btn-primary mini-btn" data-course-action="edit" data-course-id="'+c.id+'">إدارة الوحدات</button>'+
      '<button class="btn btn-soft mini-btn" data-course-action="duplicate" data-course-id="'+c.id+'">نسخ</button>'+
      (c.status==="published"?'<button class="btn btn-soft mini-btn" data-course-action="draft" data-course-id="'+c.id+'">تحويل لمسودة</button>':'<button class="btn btn-green mini-btn" data-course-action="publish" data-course-id="'+c.id+'">نشر</button>')+
      '<button class="btn btn-ghost mini-btn danger-text" data-course-action="delete" data-course-id="'+c.id+'">حذف</button>'+
    '</div>'+
  '</article>';
}

function defaultUnits(course){
  const count=Math.max(1,Number(course.units)||3);
  const names=["مقدمة ومفاهيم أساسية","IPv4 والعناوين","Binary وPrefix","Subnetting","FLSM","VLSM","Routing Basics","مراجعة وتقييم","مختبر عملي","المشروع الختامي"];
  const lessons=Math.max(2,Math.round((Number(course.lessons)||count*3)/count));
  return Array.from({length:count},(_,i)=>({id:i+1,title:names[i]||("الوحدة "+(i+1)),lessons,status:i===0?"published":"draft"}));
}
function courseEditor(course){
  const units=defaultUnits(course);
  return '<div class="page-intro with-action"><div><span class="eyebrow blue">03 • إدارة المقرر</span><h2>'+esc(course.title)+'</h2><p>'+esc(course.description)+'</p></div><button class="btn btn-soft" data-course-action="back">← العودة إلى المقررات</button></div>'+
  '<div class="student-grid-4 course-editor-kpis">'+
  kpi("الوحدات",units.length,"مرتبة داخل المسار")+
  kpi("الدروس",course.lessons,"إجمالي الدروس")+
  kpi("الأسئلة",course.questions,"مرتبطة بالتقييم")+
  kpi("الحالة",statusLabel(course.status),"حالة النشر")+
  '</div>'+
  '<div class="card course-editor-hero"><div><span class="eyebrow purple">بناء المسار</span><h3>هيكل المقرر</h3><p class="muted">رتّب الوحدات والدروس، ثم اربط بنك الأسئلة والاختبارات والمختبرات.</p></div><button class="btn btn-primary" data-course-editor-action="add-unit">+ وحدة جديدة</button></div>'+
  '<div class="course-unit-list">'+units.map((u,i)=>'<article class="course-unit-row"><div class="unit-number">'+(i+1)+'</div><div class="unit-main"><div><strong>'+esc(u.title)+'</strong><span class="badge '+(u.status==="published"?"green":"orange")+'">'+(u.status==="published"?"منشورة":"مسودة")+'</span></div><p class="muted">'+u.lessons+' دروس • '+Math.max(5,Math.round((course.questions||30)/units.length))+' أسئلة تقريبًا</p></div><button class="btn btn-soft mini-btn" data-course-editor-action="open-unit" data-course-unit="'+u.id+'">إدارة الوحدة</button></article>').join("")+'</div>'+
  '<div class="grid-2"><div class="card"><h3>ربط التقييم</h3><div class="stat-row"><span>بنك الأسئلة</span><b>'+course.questions+' سؤال</b></div><div class="stat-row"><span>الاختبارات</span><b>ربط لاحق</b></div><div class="stat-row"><span>المختبرات</span><b>Subnetting / FLSM / VLSM</b></div></div><div class="card"><h3>جاهزية النشر</h3><div class="progress"><span style="width:'+course.progress+'%"></span></div><p class="muted" style="margin-top:8px">'+course.progress+'% من المحتوى مكتمل.</p><button class="btn btn-green" data-course-action="'+(course.status==="published"?"draft":"publish")+'" data-course-id="'+course.id+'">'+(course.status==="published"?"إرجاع لمسودة":"نشر المقرر")+'</button></div></div>';
}

function builderPreview(){
  return '<div class="card course-builder-preview"><div class="section-title"><h3>بنية المقرر</h3><span class="badge purple">خطة V3.4</span></div>'+
    '<div class="course-builder-steps">'+
    '<div><b>1</b><strong>المقرر</strong><span>الاسم والوصف والنشر</span></div>'+
    '<div><b>2</b><strong>الوحدات</strong><span>ترتيب وحدات المسار</span></div>'+
    '<div><b>3</b><strong>الدروس</strong><span>محتوى ومدة كل درس</span></div>'+
    '<div><b>4</b><strong>التقييم</strong><span>ربط بنك الأسئلة والاختبارات</span></div>'+
    '</div>'+
    '<div class="course-manager-note"><strong>قاعدة التصميم:</strong> المقرر هو المصدر الرئيسي؛ الوحدات والدروس والاختبارات والمختبرات ترتبط به بدل إنشاء محتوى منفصل.</div>'+
  '</div>';
}

export function courseManagerView(){
  const courses=getCourses();
  const activeId=Number(localStorage.getItem(ACTIVE)||0);
  const active=courses.find(x=>x.id===activeId);
  if(active)return courseEditor(active);
  const published=courses.filter(x=>x.status==="published").length;
  const drafts=courses.filter(x=>x.status==="draft").length;
  const students=courses.reduce((s,x)=>s+(Number(x.students)||0),0);
  return '<div class="page-intro with-action"><div><span class="eyebrow blue">03 • المقررات</span><h2>إدارة المقررات والمسارات</h2><p>أنشئ المقرر، نظّم الوحدات والدروس، ثم انشره للمتدربين من مركز واحد.</p></div><button class="btn btn-primary" data-course-action="new">+ مقرر جديد</button></div>'+
    '<div class="student-grid-4 course-manager-kpis">'+
      kpi("إجمالي المقررات",courses.length,"المسارات الحالية")+
      kpi("منشورة",published,"جاهزة للمتدربين")+
      kpi("مسودات",drafts,"تحتاج إعدادًا")+
      kpi("المتدربون المرتبطون",students,"في المقررات المنشورة")+
    '</div>'+
    '<div class="course-manager-toolbar card"><div><strong>دورة حياة المقرر</strong><span class="muted">مسودة → مراجعة → نشر → أرشفة</span></div><div class="course-manager-tabs"><button class="filter-chip active" data-course-status="all">الكل</button><button class="filter-chip" data-course-status="published">منشور</button><button class="filter-chip" data-course-status="draft">مسودة</button><button class="filter-chip" data-course-status="archived">مؤرشف</button></div></div>'+
    '<div id="course-builder" class="course-builder" hidden>'+
      '<div class="card"><div class="section-title"><h3>إنشاء مقرر جديد</h3><button class="btn btn-ghost mini-btn" data-course-action="close-form">إغلاق</button></div>'+
      '<form id="new-course-form" class="course-form"><label>اسم المقرر<input name="title" placeholder="مثال: مبادئ شبكات الحاسب" required></label><label>رمز المقرر<input name="code" placeholder="مثال: NET-101" required></label><label>الوصف<textarea name="description" rows="3" placeholder="وصف مختصر للمسار"></textarea></label><div class="course-form-actions"><button class="btn btn-primary" type="submit">إنشاء كمسودة</button><span id="course-form-msg" class="muted"></span></div></form></div>'+
    '</div>'+
    '<div id="course-manager-list" class="course-manager-list">'+courses.map(courseCard).join("")+'</div>'+
    builderPreview();
}

export function filterCourses(status){
  return getCourses().filter(x=>status==="all"||x.status===status);
}
