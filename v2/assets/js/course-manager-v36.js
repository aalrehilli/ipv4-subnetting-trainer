const KEY="ipv4AcademyV35Courses";
const ACTIVE="ipv4AcademyV35ActiveCourse";
const ACTIVE_UNIT="ipv4AcademyV35ActiveUnit";
const UNIT_FORM="ipv4AcademyV35AddUnit";
const ACTIVE_LESSON="ipv4AcademyV35ActiveLesson";

const seed=[
  {id:1,title:"IPv4 Fundamentals",code:"IPV4-101",description:"أساسيات IPv4 والعناوين والقواعد اللازمة لفهم Subnetting.",status:"published",students:42,updated:"اليوم",owner:"قسم الحاسب",
    units:[
      {id:1,title:"مقدمة ومفاهيم أساسية",status:"published",lessons:[
        {id:1,title:"ما هي الشبكة؟",duration:20,type:"video",status:"published",description:"مقدمة في الشبكات وأنواعها.",resource:"",questions:"",lab:""},
        {id:2,title:"عناوين IPv4",duration:25,type:"lesson",status:"published",description:"فهم عنوان IPv4 ومكوّناته.",resource:"",questions:"Q101,Q102",lab:""},
        {id:3,title:"Network وHost",duration:30,type:"interactive",status:"draft",description:"تمييز جزء الشبكة عن جزء المضيف.",resource:"",questions:"Q103",lab:"Subnetting Lab"}
      ]},
      {id:2,title:"IPv4 والعناوين",status:"draft",lessons:[
        {id:1,title:"التقسيم إلى أوكتت",duration:25,type:"lesson",status:"draft",description:"قراءة عنوان IPv4 على شكل أوكتت.",resource:"",questions:"",lab:""},
        {id:2,title:"Binary وDecimal",duration:30,type:"practice",status:"draft",description:"التحويل بين النظامين الثنائي والعشري.",resource:"",questions:"Q104,Q105",lab:""}
      ]},
      {id:3,title:"Binary وPrefix",status:"draft",lessons:[
        {id:1,title:"فهم الـPrefix",duration:25,type:"lesson",status:"draft",description:"ربط Prefix بقناع الشبكة.",resource:"",questions:"",lab:""},
        {id:2,title:"أقنعة الشبكات",duration:30,type:"practice",status:"draft",description:"تحديد Subnet Mask من Prefix.",resource:"",questions:"",lab:""}
      ]}
    ]},
  {id:2,title:"Subnetting Mastery",code:"SUB-201",description:"من Prefix وMask إلى FLSM وVLSM وحل المسائل العملية.",status:"draft",students:0,updated:"أمس",owner:"قسم الحاسب",
    units:[
      {id:1,title:"Prefix وSubnet Mask",status:"draft",lessons:[
        {id:1,title:"Magic Number",duration:30,type:"lesson",status:"draft",description:"استخدام Magic Number بسرعة.",resource:"",questions:"",lab:""},
        {id:2,title:"/25 إلى /30",duration:35,type:"practice",status:"draft",description:"حل أشهر أحجام الشبكات الصغيرة.",resource:"",questions:"",lab:""}
      ]},
      {id:2,title:"FLSM",status:"draft",lessons:[
        {id:1,title:"تقسيم الشبكة بالتساوي",duration:35,type:"lab",status:"draft",description:"حل سيناريو FLSM عملي.",resource:"",questions:"",lab:"FLSM Lab"}
      ]},
      {id:3,title:"VLSM",status:"draft",lessons:[
        {id:1,title:"توزيع العناوين حسب الحاجة",duration:40,type:"lab",status:"draft",description:"بناء مخطط VLSM واقعي.",resource:"",questions:"",lab:"VLSM Lab"}
      ]}
    ]},
  {id:3,title:"CCNA Network Essentials",code:"NET-301",description:"مسار تأسيسي للشبكات مع تطبيقات Ethernet وARP وRouting.",status:"draft",students:0,updated:"هذا الأسبوع",owner:"قسم الحاسب",
    units:[
      {id:1,title:"مقدمة في الشبكات",status:"draft",lessons:[]},
      {id:2,title:"Ethernet وSwitching",status:"draft",lessons:[]},
      {id:3,title:"ARP وIPv4",status:"draft",lessons:[]}
    ]}
];

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const clone=o=>JSON.parse(JSON.stringify(o));
const statusLabel=s=>s==="published"?"منشور":s==="archived"?"مؤرشف":"مسودة";
const statusTone=s=>s==="published"?"green":s==="archived"?"red":"orange";
const typeLabel=t=>({video:"فيديو",lesson:"شرح",practice:"تدريب",interactive:"تفاعلي",lab:"مختبر"})[t]||"شرح";

function nextId(items){return items.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1;}
function write(list){localStorage.setItem(KEY,JSON.stringify(list));return list;}
function normalizeLesson(l,i){
  return {...l,id:Number(l.id)||i+1,title:String(l.title||("الدرس "+(i+1))),duration:Number(l.duration)||20,type:l.type||"lesson",status:l.status==="published"?"published":"draft",description:String(l.description||""),content:String(l.content||""),objectives:String(l.objectives||""),resource:String(l.resource||""),attachments:String(l.attachments||""),questions:String(l.questions||""),lab:String(l.lab||""),mediaType:String(l.mediaType||"none")};
}
function normalizeUnit(u,i){
  const lessons=Array.isArray(u.lessons)?u.lessons:[];
  return {...u,id:Number(u.id)||i+1,title:String(u.title||("الوحدة "+(i+1))),status:u.status==="published"?"published":"draft",lessons:lessons.map(normalizeLesson)};
}
function legacyUnits(c){
  const count=Math.max(1,Number(c.units)||3);
  const names=["مقدمة ومفاهيم أساسية","IPv4 والعناوين","Binary وPrefix","Subnetting","FLSM","VLSM","Routing Basics","مراجعة وتقييم"];
  return Array.from({length:count},(_,i)=>({id:i+1,title:names[i]||("الوحدة "+(i+1)),status:i===0?"published":"draft",lessons:[]}));
}
function normalizeCourse(c){
  let units=Array.isArray(c.units)?c.units:legacyUnits(c);
  units=units.length?units.map(normalizeUnit):legacyUnits(c).map(normalizeUnit);
  return {...c,units,students:Number(c.students)||0};
}
function read(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||"null");
    if(Array.isArray(raw)&&raw.length){
      const list=raw.map(normalizeCourse);write(list);return list;
    }
  }catch{}
  return write(clone(seed));
}
function saveCourse(c){
  c.progress=courseProgress(c);
  c.updated="الآن";
  return write(read().map(x=>x.id===c.id?c:x));
}
function getActiveCourse(){
  return read().find(c=>c.id===Number(localStorage.getItem(ACTIVE)||0))||null;
}
function totalLessons(c){return c.units.reduce((n,u)=>n+u.lessons.length,0);}
function totalQuestions(c){return c.units.reduce((n,u)=>n+u.lessons.reduce((m,l)=>m+String(l.questions||"").split(",").map(x=>x.trim()).filter(Boolean).length,0),0);}
function courseProgress(c){
  const units=c.units||[], allLessons=totalLessons(c);
  if(!units.length)return 0;
  const publishedUnits=units.filter(u=>u.status==="published").length;
  const publishedLessons=units.reduce((n,u)=>n+u.lessons.filter(l=>l.status==="published").length,0);
  const unitPart=(publishedUnits/units.length)*35;
  const lessonPart=allLessons?((publishedLessons/allLessons)*65):0;
  return Math.round(Math.min(100,unitPart+lessonPart));
}

export function getCourses(){return read();}

export function handleCourseForm(form){
  const data=new FormData(form),title=String(data.get("title")||"").trim(),code=String(data.get("code")||"").trim(),description=String(data.get("description")||"").trim();
  if(!title||!code)return {ok:false,message:"اكتب اسم المقرر ورمز المقرر."};
  const list=read(),course={id:nextId(list),title,code,description,status:"draft",students:0,updated:"الآن",owner:"المدرب",units:[{id:1,title:"الوحدة الأولى",status:"draft",lessons:[]}]};
  course.progress=0;write([course,...list]);localStorage.setItem(ACTIVE,String(course.id));localStorage.removeItem(UNIT_FORM);return {ok:true,rerender:true};
}

export function handleCourseAction(target){
  const action=target.dataset.courseAction,id=Number(target.dataset.courseId),list=read();
  if(action==="new")return {rerender:true,newCourse:true};
  if(action==="close-form")return {rerender:true};
  if(action==="back"){localStorage.removeItem(ACTIVE);localStorage.removeItem(ACTIVE_UNIT);localStorage.removeItem(UNIT_FORM);localStorage.removeItem(ACTIVE_LESSON);return {rerender:true};}
  if(action==="edit"){localStorage.setItem(ACTIVE,String(id));localStorage.removeItem(ACTIVE_UNIT);localStorage.removeItem(UNIT_FORM);return {rerender:true};}
  const item=list.find(x=>x.id===id);
  if(item&&(action==="publish"||action==="draft"||action==="archive")){
    item.status=action==="publish"?"published":action==="archive"?"archived":"draft";item.updated="الآن";write(list);return {rerender:true};
  }
  if(action==="delete"){write(list.filter(x=>x.id!==id));if(id===Number(localStorage.getItem(ACTIVE)||0))localStorage.removeItem(ACTIVE);return {rerender:true};}
  if(action==="duplicate"&&item){
    const copy=clone(item);copy.id=nextId(list);copy.title+=" — نسخة";copy.code+="-COPY";copy.status="draft";copy.students=0;copy.progress=0;copy.updated="الآن";write([copy,...list]);return {rerender:true};
  }
  return {rerender:true};
}

export function handleCourseEditorAction(target){
  const action=target.dataset.courseEditorAction,course=getActiveCourse();
  if(!course)return {rerender:true};
  if(action==="open-unit"){localStorage.setItem(ACTIVE_UNIT,String(target.dataset.courseUnit));localStorage.removeItem(ACTIVE_LESSON);localStorage.removeItem(UNIT_FORM);return {rerender:true};}
  if(action==="back-course"){localStorage.removeItem(ACTIVE_UNIT);localStorage.removeItem(ACTIVE_LESSON);localStorage.removeItem(UNIT_FORM);return {rerender:true};}
  if(action==="add-unit"){localStorage.setItem(UNIT_FORM,"1");localStorage.removeItem(ACTIVE_UNIT);return {rerender:true};}
  if(action==="unit-publish"||action==="unit-draft"){
    const unit=course.units.find(u=>u.id===Number(target.dataset.courseUnit));
    if(unit){unit.status=action==="unit-publish"?"published":"draft";saveCourse(course);}
    return {rerender:true};
  }
  return {rerender:true};
}

export function handleUnitForm(form){
  const course=getActiveCourse();
  if(!course)return {ok:false,message:"المقرر غير موجود."};
  const data=new FormData(form),title=String(data.get("title")||"").trim(),mode=String(data.get("mode")||"new");
  if(!title)return {ok:false,message:"اكتب اسم الوحدة."};
  if(mode==="edit"){
    const unit=course.units.find(u=>u.id===Number(form.dataset.courseUnit));
    if(!unit)return {ok:false,message:"الوحدة غير موجودة."};
    unit.title=title;unit.status=data.get("status")==="published"?"published":"draft";
    saveCourse(course);return {ok:true,rerender:true};
  }
  const unit={id:nextId(course.units),title,status:data.get("status")==="published"?"published":"draft",lessons:[]};
  course.units.push(unit);saveCourse(course);localStorage.removeItem(UNIT_FORM);return {ok:true,rerender:true};
}

export function handleLessonAction(target){
  const course=getActiveCourse(),unit=course?.units.find(u=>u.id===Number(target.dataset.courseUnit));
  if(!course||!unit)return {rerender:true};
  const action=target.dataset.lessonAction,id=Number(target.dataset.lessonId);
  if(action==="new"){localStorage.setItem(ACTIVE_LESSON,"new");return {rerender:true};}
  if(action==="edit"){localStorage.setItem(ACTIVE_LESSON,String(id));return {rerender:true};}
  if(action==="back-lesson"){localStorage.removeItem(ACTIVE_LESSON);return {rerender:true};}
  if(action==="delete"){unit.lessons=unit.lessons.filter(l=>l.id!==id);saveCourse(course);return {rerender:true};}
  const lesson=unit.lessons.find(l=>l.id===id);
  if(action==="publish"||action==="draft"){if(lesson){lesson.status=action==="publish"?"published":"draft";saveCourse(course);}return {rerender:true};}
  if(action==="move-up"||action==="move-down"){
    const i=unit.lessons.findIndex(l=>l.id===id),j=action==="move-up"?i-1:i+1;
    if(i>=0&&j>=0&&j<unit.lessons.length)[unit.lessons[i],unit.lessons[j]]=[unit.lessons[j],unit.lessons[i]];
    saveCourse(course);return {rerender:true};
  }
  return {rerender:true};
}

export function handleLessonForm(form){
  const course=getActiveCourse(),unit=course?.units.find(u=>u.id===Number(form.dataset.courseUnit));
  if(!course||!unit)return {ok:false,message:"الوحدة غير موجودة."};
  const data=new FormData(form),title=String(data.get("title")||"").trim();
  if(!title)return {ok:false,message:"اكتب عنوان الدرس."};
  const payload={title,duration:Number(data.get("duration"))||20,type:String(data.get("type")||"lesson"),status:data.get("status")==="published"?"published":"draft",description:String(data.get("description")||"").trim(),content:String(data.get("content")||"").trim(),objectives:String(data.get("objectives")||"").trim(),resource:String(data.get("resource")||"").trim(),attachments:String(data.get("attachments")||"").trim(),questions:String(data.get("questions")||"").trim(),lab:String(data.get("lab")||"").trim(),mediaType:String(data.get("mediaType")||"none")};
  const lessonId=String(form.dataset.lessonId||"new");
  if(lessonId==="new")unit.lessons.push({id:nextId(unit.lessons),...payload});
  else{const lesson=unit.lessons.find(l=>l.id===Number(lessonId));if(!lesson)return {ok:false,message:"الدرس غير موجود."};Object.assign(lesson,payload);}
  saveCourse(course);localStorage.removeItem(ACTIVE_LESSON);return {ok:true,rerender:true};
}

function kpi(label,value,sub){return '<div class="card trainer-kpi"><div class="muted">'+label+'</div><div class="kpi-value">'+value+'</div><div class="muted">'+sub+'</div></div>';}

function courseCard(c){
  const lessons=totalLessons(c),questions=totalQuestions(c),progress=courseProgress(c);
  return '<article class="course-manager-card '+c.status+'" data-course-item-status="'+c.status+'"><div class="course-manager-top"><span class="course-code">'+esc(c.code)+'</span><span class="badge '+statusTone(c.status)+'">'+statusLabel(c.status)+'</span></div><h3>'+esc(c.title)+'</h3><p>'+esc(c.description)+'</p><div class="course-manager-stats"><span><b>'+c.units.length+'</b> وحدات</span><span><b>'+lessons+'</b> درس</span><span><b>'+questions+'</b> سؤال</span><span><b>'+c.students+'</b> متدرب</span></div><div class="course-manager-progress"><div><span>جاهزية المحتوى</span><strong>'+progress+'%</strong></div><div class="progress"><span style="width:'+progress+'%"></span></div></div><div class="course-manager-actions"><button class="btn btn-primary mini-btn" data-course-action="edit" data-course-id="'+c.id+'">إدارة الوحدات والدروس</button><button class="btn btn-soft mini-btn" data-course-action="duplicate" data-course-id="'+c.id+'">نسخ</button>'+(c.status==="published"?'<button class="btn btn-soft mini-btn" data-course-action="draft" data-course-id="'+c.id+'">تحويل لمسودة</button>':'<button class="btn btn-green mini-btn" data-course-action="publish" data-course-id="'+c.id+'">نشر</button>')+'<button class="btn btn-ghost mini-btn danger-text" data-course-action="delete" data-course-id="'+c.id+'">حذف</button></div></article>';
}

function lessonRow(l,unit){
  return '<div class="course-lesson-row"><div class="lesson-grip">☷</div><div class="lesson-main"><div><strong>'+esc(l.title)+'</strong><span class="badge '+(l.status==="published"?"green":"orange")+'">'+(l.status==="published"?"منشور":"مسودة")+'</span><span class="lesson-type">'+typeLabel(l.type)+'</span></div><p class="muted">'+l.duration+' دقيقة'+(l.questions?' • أسئلة: '+esc(l.questions):'')+(l.lab?' • مختبر: '+esc(l.lab):'')+'</p><div class="lesson-description">'+esc(l.description)+'</div></div><div class="lesson-actions"><button class="btn btn-ghost mini-btn" data-lesson-action="move-up" data-course-unit="'+unit.id+'" data-lesson-id="'+l.id+'">↑</button><button class="btn btn-ghost mini-btn" data-lesson-action="move-down" data-course-unit="'+unit.id+'" data-lesson-id="'+l.id+'">↓</button><button class="btn btn-soft mini-btn" data-lesson-action="edit" data-course-unit="'+unit.id+'" data-lesson-id="'+l.id+'">تعديل</button><button class="btn btn-soft mini-btn" data-lesson-action="'+(l.status==="published"?"draft":"publish")+'" data-course-unit="'+unit.id+'" data-lesson-id="'+l.id+'">'+(l.status==="published"?"مسودة":"نشر")+'</button><button class="btn btn-ghost mini-btn danger-text" data-lesson-action="delete" data-course-unit="'+unit.id+'" data-lesson-id="'+l.id+'">حذف</button></div></div>';
}

function lessonForm(unit,lesson){
  const l=lesson||{id:"new",title:"",duration:30,type:"lesson",status:"draft",description:"",content:"",objectives:"",resource:"",attachments:"",questions:"",lab:"",mediaType:"none"};
  return '<div class="card course-lesson-form-card"><div class="section-title"><h3>'+(lesson?"تعديل الدرس":"إضافة درس جديد")+'</h3></div><form class="course-lesson-form" data-lesson-form data-course-unit="'+unit.id+'" data-lesson-id="'+l.id+'"><div class="lesson-form-grid"><label>عنوان الدرس<input name="title" value="'+esc(l.title)+'" placeholder="مثال: حساب Network Address" required></label><label>المدة بالدقائق<input name="duration" type="number" min="5" max="300" value="'+l.duration+'"></label><label>نوع المحتوى<select name="type">'+["lesson","video","practice","interactive","lab"].map(x=>'<option value="'+x+'" '+(l.type===x?"selected":"")+'>'+typeLabel(x)+'</option>').join("")+'</select></label><label>الحالة<select name="status"><option value="draft" '+(l.status==="draft"?"selected":"")+'>مسودة</option><option value="published" '+(l.status==="published"?"selected":"")+'>منشور</option></select></label><label class="span-2">وصف الدرس<textarea name="description" rows="3" placeholder="هدف الدرس ومحتواه">'+esc(l.description)+'</textarea></label><label>رابط المحتوى<input name="resource" value="'+esc(l.resource)+'" placeholder="رابط فيديو أو ملف"></label><label>أسئلة بنك الأسئلة<input name="questions" value="'+esc(l.questions)+'" placeholder="Q101,Q102,Q103"></label><label>المختبر المرتبط<select name="lab"><option value="">بدون مختبر</option><option '+(l.lab==="Subnetting Lab"?"selected":"")+'>Subnetting Lab</option><option '+(l.lab==="FLSM Lab"?"selected":"")+'>FLSM Lab</option><option '+(l.lab==="VLSM Lab"?"selected":"")+'>VLSM Lab</option><option '+(l.lab==="IOS Lab"?"selected":"")+'>IOS Lab</option><option '+(l.lab==="Packet Tracer"?"selected":"")+'>Packet Tracer</option></select></label></div><div class="course-form-actions"><button class="btn btn-primary" type="submit">حفظ الدرس</button><span data-lesson-form-msg class="muted"></span></div></form></div>';
}

function lessonEditor(course,unit,lesson){
  const l=lesson||{id:"new",title:"",duration:30,type:"lesson",status:"draft",description:"",content:"",objectives:"",resource:"",attachments:"",questions:"",lab:"",mediaType:"none"};
  const title=lesson?"تحرير محتوى الدرس":"إضافة محتوى الدرس";
  return '<div class="page-intro with-action"><div><span class="eyebrow blue">03 • محرر الدرس</span><h2>'+title+'</h2><p>'+esc(l.title||"درس جديد")+'</p></div><div class="hero-actions"><button class="btn btn-soft" data-course-editor-action="back-lesson">← الوحدة</button></div></div>'+
  '<div class="lesson-editor-layout"><div class="card lesson-editor-main"><form class="course-lesson-form" data-lesson-form data-course-unit="'+unit.id+'" data-lesson-id="'+l.id+'">'+
    '<div class="lesson-editor-tabs"><span class="filter-chip active">المحتوى</span><span class="filter-chip">الوسائط</span><span class="filter-chip">التقييم</span><span class="filter-chip">المختبر</span></div>'+
    '<div class="lesson-form-grid"><label>عنوان الدرس<input name="title" value="'+esc(l.title)+'" required></label><label>المدة بالدقائق<input name="duration" type="number" min="5" max="300" value="'+l.duration+'"></label><label>نوع المحتوى<select name="type">'+["lesson","video","practice","interactive","lab"].map(x=>'<option value="'+x+'" '+(l.type===x?"selected":"")+">'+typeLabel(x)+"</option>").join("")+'</select></label><label>حالة النشر<select name="status"><option value="draft" '+(l.status==="draft"?"selected":"")+">مسودة</option><option value="published" '+(l.status==="published"?"selected":"")+">منشور</option></select></label>'+
    '<label class="span-2">أهداف الدرس<textarea name="objectives" rows="3" placeholder="مثال: يحدد المتدرب Network وBroadcast">'+esc(l.objectives)+'</textarea></label>'+
    '<label class="span-2">المحتوى التعليمي<textarea name="content" rows="10" placeholder="اكتب شرح الدرس خطوة بخطوة...">'+esc(l.content)+'</textarea></label>'+
    '<label class="span-2">وصف مختصر للدرس<textarea name="description" rows="3" placeholder="وصف يظهر في بطاقة الدرس">'+esc(l.description)+'</textarea></label>'+
    '<label>نوع الوسائط<select name="mediaType"><option value="none" '+(l.mediaType==="none"?"selected":"")+">بدون</option><option value="youtube" '+(l.mediaType==="youtube"?"selected":"")+">YouTube</option><option value="video" '+(l.mediaType==="video"?"selected":"")+">فيديو</option><option value="pdf" '+(l.mediaType==="pdf"?"selected":"")+">PDF</option><option value="link" '+(l.mediaType==="link"?"selected":"")+">رابط</option></select></label>'+
    '<label>رابط المحتوى<input name="resource" value="'+esc(l.resource)+'" placeholder="https://..."></label>'+
    '<label class="span-2">الملفات والمرفقات<input name="attachments" value="'+esc(l.attachments)+'" placeholder="روابط الملفات مفصولة بفاصلة"></label>'+
    '<label>أسئلة بنك الأسئلة<input name="questions" value="'+esc(l.questions)+'" placeholder="Q101,Q102,Q103"></label>'+
    '<label>المختبر المرتبط<select name="lab"><option value="">بدون مختبر</option><option '+(l.lab==="Subnetting Lab"?"selected":"")+">Subnetting Lab</option><option '+(l.lab==="FLSM Lab"?"selected":"")+">FLSM Lab</option><option '+(l.lab==="VLSM Lab"?"selected":"")+">VLSM Lab</option><option '+(l.lab==="IOS Lab"?"selected":"")+">IOS Lab</option><option '+(l.lab==="Packet Tracer"?"selected":"")+">Packet Tracer</option></select></label></div>'+
    '<div class="course-form-actions"><button class="btn btn-primary" type="submit">حفظ محتوى الدرس</button><button type="button" class="btn btn-soft" data-lesson-preview>معاينة للمتدرب</button><span data-lesson-form-msg class="muted"></span></div></form></div>'+
    '<aside class="card lesson-editor-side"><div class="section-title"><h3>ملخص الدرس</h3><span class="badge purple">V3.6</span></div><div class="lesson-preview-mini"><span class="lesson-type">'+typeLabel(l.type)+'</span><h3>'+esc(l.title||"عنوان الدرس")+'</h3><p>'+esc(l.description||"أضف وصفًا للدرس.")+'</p><div class="stat-row"><span>المدة</span><b>'+l.duration+' دقيقة</b></div><div class="stat-row"><span>الأسئلة</span><b>'+((l.questions||"").split(",").map(x=>x.trim()).filter(Boolean).length)+'</b></div><div class="stat-row"><span>المختبر</span><b>'+esc(l.lab||"بدون")+'</b></div></div></aside></div>';
}
function unitEditForm(unit){
  return '<div class="card unit-editor-form-wrap"><form class="unit-editor-form" data-unit-form data-course-unit="'+unit.id+'"><input type="hidden" name="mode" value="edit"><div class="lesson-form-grid"><label>اسم الوحدة<input name="title" value="'+esc(unit.title)+'" required></label><label>الحالة<select name="status"><option value="draft" '+(unit.status==="draft"?"selected":"")+'>مسودة</option><option value="published" '+(unit.status==="published"?"selected":"")+'>منشورة</option></select></label></div><div class="course-form-actions" style="margin-top:10px"><button class="btn btn-primary" type="submit">حفظ بيانات الوحدة</button><span data-unit-form-msg class="muted"></span></div></form></div>';
}

function newUnitForm(){
  return '<div class="card course-lesson-form-card"><div class="section-title"><h3>إضافة وحدة جديدة</h3></div><form class="unit-editor-form" data-unit-form><input type="hidden" name="mode" value="new"><div class="lesson-form-grid"><label>اسم الوحدة<input name="title" placeholder="مثال: Subnetting" required></label><label>الحالة<select name="status"><option value="draft">مسودة</option><option value="published">منشورة</option></select></label></div><div class="course-form-actions" style="margin-top:10px"><button class="btn btn-primary" type="submit">إضافة الوحدة</button><span data-unit-form-msg class="muted"></span></div></form></div>';
}

function unitEditor(course,unit){
  const activeLesson=localStorage.getItem(ACTIVE_LESSON);
  const lesson=activeLesson&&activeLesson!=="new"?unit.lessons.find(l=>l.id===Number(activeLesson)):null;
  if(activeLesson!==null)return lessonEditor(course,unit,lesson);
  return '<div class="page-intro with-action"><div><span class="eyebrow purple">03 • إدارة الوحدة</span><h2>'+esc(unit.title)+'</h2><p>أضف الدروس، حدّد نوع المحتوى، واربط بنك الأسئلة والمختبرات.</p></div><div class="hero-actions"><button class="btn btn-soft" data-course-editor-action="back-course">← المقرر</button><button class="btn btn-primary" data-lesson-action="new" data-course-unit="'+unit.id+'">+ درس جديد</button></div></div>'+
  '<div class="card unit-editor-summary"><div><strong>'+esc(course.title)+'</strong><span class="badge '+(unit.status==="published"?"green":"orange")+'">'+(unit.status==="published"?"منشورة":"مسودة")+'</span><span class="muted">'+unit.lessons.length+' دروس</span></div><div class="unit-summary-actions"><button class="btn btn-soft mini-btn" data-course-editor-action="'+(unit.status==="published"?"unit-draft":"unit-publish")+'" data-course-unit="'+unit.id+'">'+(unit.status==="published"?"تحويل لمسودة":"نشر الوحدة")+'</button></div></div>'+
  unitEditForm(unit)+
  (activeLesson!==null?(lessonForm(unit,activeLesson==="new"?null:lesson)):"")+
  (unit.lessons.length?'<div class="course-lessons-list">'+unit.lessons.map(l=>lessonRow(l,unit)).join("")+'</div>':'<div class="card course-empty"><strong>لا توجد دروس بعد</strong><p class="muted">أضف أول درس ثم اربطه بالأسئلة أو المختبر.</p></div>');
}

function courseEditor(course){
  const units=course.units;
  const addForm=localStorage.getItem(UNIT_FORM)==="1"?newUnitForm():"";
  return '<div class="page-intro with-action"><div><span class="eyebrow blue">03 • إدارة المقرر</span><h2>'+esc(course.title)+'</h2><p>'+esc(course.description)+'</p></div><button class="btn btn-soft" data-course-action="back">← العودة إلى المقررات</button></div>'+
  '<div class="student-grid-4 course-editor-kpis">'+kpi("الوحدات",units.length,"الوحدات الفعلية")+kpi("الدروس",totalLessons(course),"الدروس الفعلية")+kpi("الأسئلة المرتبطة",totalQuestions(course),"روابط بنك الأسئلة")+kpi("الجاهزية",courseProgress(course)+"%","حسب المحتوى المنشور")+'</div>'+
  '<div class="card course-editor-hero"><div><span class="eyebrow purple">بناء المسار • V3.5</span><h3>هيكل المقرر</h3><p class="muted">كل وحدة تحتوي على دروس فعلية يمكن تعديلها وترتيبها ونشرها.</p></div><button class="btn btn-primary" data-course-editor-action="add-unit">+ وحدة جديدة</button></div>'+
  addForm+
  '<div class="course-unit-list">'+units.map((u,i)=>'<article class="course-unit-row"><div class="unit-number">'+(i+1)+'</div><div class="unit-main"><div><strong>'+esc(u.title)+'</strong><span class="badge '+(u.status==="published"?"green":"orange")+'">'+(u.status==="published"?"منشورة":"مسودة")+'</span></div><p class="muted">'+u.lessons.length+' دروس • '+u.lessons.reduce((n,l)=>n+(String(l.questions||"").split(",").map(x=>x.trim()).filter(Boolean).length),0)+' أسئلة مرتبطة</p></div><div class="unit-row-actions"><button class="btn btn-soft mini-btn" data-course-editor-action="open-unit" data-course-unit="'+u.id+'">إدارة الوحدة</button></div></article>').join("")+'</div>'+
  '<div class="grid-2"><div class="card"><h3>ربط التقييم والمختبرات</h3><div class="stat-row"><span>الأسئلة المرتبطة</span><b>'+totalQuestions(course)+'</b></div><div class="stat-row"><span>المختبرات</span><b>Subnetting • FLSM • VLSM • IOS • Packet Tracer</b></div><div class="stat-row"><span>الحفظ</span><b>LocalStorage في V3.5</b></div></div><div class="card"><h3>جاهزية النشر</h3><div class="progress"><span style="width:'+courseProgress(course)+'%"></span></div><p class="muted" style="margin-top:8px">'+courseProgress(course)+'% من المحتوى منشور.</p><button class="btn btn-green" data-course-action="'+(course.status==="published"?"draft":"publish")+'" data-course-id="'+course.id+'">'+(course.status==="published"?"إرجاع لمسودة":"نشر المقرر")+'</button></div></div>';
}

export function courseManagerView(){
  const courses=read(),active=getActiveCourse(),activeUnitId=Number(localStorage.getItem(ACTIVE_UNIT)||0);
  if(active&&activeUnitId){const unit=active.units.find(u=>u.id===activeUnitId);if(unit)return unitEditor(active,unit);}
  if(active)return courseEditor(active);
  const published=courses.filter(x=>x.status==="published").length,drafts=courses.filter(x=>x.status==="draft").length,students=courses.reduce((s,x)=>s+(Number(x.students)||0),0);
  return '<div class="page-intro with-action"><div><span class="eyebrow blue">03 • المقررات</span><h2>إدارة المقررات</h2><p>أنشئ المقرر، ابنِ الوحدات والدروس، ثم اربط التقييم والمختبرات قبل النشر.</p></div><button class="btn btn-primary" data-course-action="new">+ مقرر جديد</button></div>'+
  '<div class="student-grid-4 course-manager-kpis">'+kpi("إجمالي المقررات",courses.length,"المسارات الحالية")+kpi("منشورة",published,"جاهزة للمتدربين")+kpi("مسودات",drafts,"تحتاج إعدادًا")+kpi("المتدربون المرتبطون",students,"في المقررات")+'</div>'+
  '<div class="course-manager-toolbar card"><div><strong>إدارة المحتوى</strong><span class="muted">مقرر → وحدات → دروس → تقييم → مختبر → نشر</span></div><div class="course-manager-tabs"><button class="filter-chip active" data-course-status="all">الكل</button><button class="filter-chip" data-course-status="published">منشور</button><button class="filter-chip" data-course-status="draft">مسودة</button><button class="filter-chip" data-course-status="archived">مؤرشف</button></div></div>'+
  '<div id="course-builder" class="course-builder" hidden><div class="card"><div class="section-title"><h3>إنشاء مقرر جديد</h3><button class="btn btn-ghost mini-btn" data-course-action="close-form">إغلاق</button></div><form id="new-course-form" class="course-form"><label>اسم المقرر<input name="title" placeholder="مثال: مبادئ شبكات الحاسب" required></label><label>رمز المقرر<input name="code" placeholder="مثال: NET-101" required></label><label>الوصف<textarea name="description" rows="3" placeholder="وصف مختصر للمسار"></textarea></label><div class="course-form-actions"><button class="btn btn-primary" type="submit">إنشاء والانتقال لبناء المقرر</button><span id="course-form-msg" class="muted"></span></div></form></div></div>'+
  '<div id="course-manager-list" class="course-manager-list">'+courses.map(courseCard).join("")+'</div>'+
  '<div class="card course-builder-preview"><div class="section-title"><h3>مسار بناء المقرر</h3><span class="badge purple">V3.5</span></div><div class="course-builder-steps"><div><b>1</b><strong>المقرر</strong><span>الاسم والوصف والحالة</span></div><div><b>2</b><strong>الوحدات</strong><span>إنشاء وتحرير الوحدات</span></div><div><b>3</b><strong>الدروس</strong><span>المحتوى والمدة والنوع</span></div><div><b>4</b><strong>التقييم والمختبر</strong><span>ربط الأسئلة والتطبيقات</span></div></div><div class="course-manager-note"><strong>V3.5:</strong> إدارة الوحدات والدروس أصبحت فعلية ومحفوظة محليًا، مع النشر والترتيب والربط بالتقييم والمختبر.</div></div>';
}
