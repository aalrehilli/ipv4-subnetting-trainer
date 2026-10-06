const KEY="ipv4AcademyV36Courses";
const ACTIVE_COURSE="ipv4AcademyV37Course";
const ACTIVE_LESSON="ipv4AcademyV37Lesson";
const DONE="ipv4AcademyV37Done";
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const read=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||"null");return Array.isArray(a)?a:[];}catch{return[]}};
const done=()=>{try{const a=JSON.parse(localStorage.getItem(DONE)||"[]");return Array.isArray(a)?a:[]}catch{return[]}};
const saveDone=a=>localStorage.setItem(DONE,JSON.stringify(a));
const publishedCourses=()=>read().filter(c=>c.status==="published");
const activeCourse=()=>publishedCourses().find(c=>c.id===Number(localStorage.getItem(ACTIVE_COURSE)||0))||publishedCourses()[0]||null;
const lessonKey=(c,u,l)=>c.id+"-"+u.id+"-"+l.id;
const isDone=(c,u,l)=>done().includes(lessonKey(c,u,l));
const allLessons=c=>c.units.flatMap(u=>u.lessons.map(l=>({course:c,unit:u,lesson:l}))).filter(x=>x.lesson.status==="published");
const coursePct=c=>{const a=allLessons(c);if(!a.length)return 0;return Math.round(a.filter(x=>isDone(c,x.unit,x.lesson)).length/a.length*100)};
const typeLabel=t=>({video:"فيديو",lesson:"شرح",practice:"تدريب",interactive:"تفاعلي",lab:"مختبر"})[t]||"شرح";

export function courseLearningPage(){
  const c=activeCourse();
  if(!c)return '<div class="card empty"><h3>لا يوجد مقرر منشور</h3><p class="muted">سيظهر المقرر هنا بعد نشره من مركز المدرب.</p></div>';
  localStorage.setItem(ACTIVE_COURSE,String(c.id));
  const pct=coursePct(c);
  return '<div class="page-intro with-action"><div><span class="eyebrow blue">02 • المقرر</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.description||"مسارك التعليمي")+'</p></div><span class="badge '+(pct>=80?"green":pct>=40?"orange":"purple")+'">'+pct+'% مكتمل</span></div>'+
  '<div class="card learner-course-hero"><div><strong>رحلتك داخل المقرر</strong><p class="muted">ابدأ بالدروس المنشورة، وعند الإكمال تنتقل للدرس التالي.</p></div><div class="progress"><span style="width:'+pct+'%"></span></div><div class="learner-course-stats"><span>'+c.units.length+' وحدات</span><span>'+allLessons(c).length+' درس منشور</span><span>'+c.students+' متدرب</span></div></div>'+
  '<div class="learner-unit-list">'+c.units.map((u,i)=>{const ls=u.lessons.filter(l=>l.status==="published");return '<section class="card learner-unit"><div class="learner-unit-head"><div><span class="unit-number">'+(i+1)+'</span><div><h3>'+esc(u.title)+'</h3><span class="muted">'+ls.length+' دروس منشورة</span></div></div><span class="badge '+(u.status==="published"?"green":"orange")+'">'+(u.status==="published"?"متاحة":"قيد الإعداد")+'</span></div>'+(ls.length?'<div class="learner-lesson-list">'+ls.map((l,j)=>'<article class="learner-lesson '+(isDone(c,u,l)?"completed":"")+'"><div class="lesson-number">'+(j+1)+'</div><div class="lesson-main"><div class="lesson-title-row"><h3>'+esc(l.title)+'</h3><span class="lesson-type">'+typeLabel(l.type)+'</span></div><p class="muted">'+esc(l.description||"")+'</p><div class="lesson-meta"><span>⏱ '+l.duration+' دقيقة</span><span>'+((l.questions||"").split(",").map(q=>q.trim()).filter(Boolean).length)+' أسئلة</span><span>'+((l.lab||"")||"بدون مختبر")+'</span></div></div><button class="btn '+(isDone(c,u,l)?"btn-green":"btn-primary")+'" data-course-learning-action="open-lesson" data-course="'+c.id+'" data-unit="'+u.id+'" data-lesson="'+l.id+'">'+(isDone(c,u,l)?"مراجعة":"ابدأ الدرس")+'</button></article>').join("")+'</div>':'<div class="learner-empty">هذه الوحدة لم تُنشر دروسها بعد.</div>')+'</section>'}).join("")+'</div>';
}

export function lessonLearningPage(){
  const c=activeCourse(),u=c?.units.find(x=>x.id===Number(localStorage.getItem(ACTIVE_LESSON)?.split("-")[1]||0)),lid=Number(localStorage.getItem(ACTIVE_LESSON)?.split("-")[2]||0),l=u?.lessons.find(x=>x.id===lid);
  if(!c||!u||!l)return courseLearningPage();
  const completed=isDone(c,u,l);
  return '<div class="page-intro with-action"><div><span class="eyebrow purple">02 • محتوى الدرس</span><h2>'+esc(l.title)+'</h2><p>'+esc(l.description||"")+'</p></div><button class="btn btn-soft" data-course-learning-action="back-course">← العودة للمقرر</button></div>'+
  '<div class="lesson-learning-layout"><main class="card lesson-learning-main"><div class="lesson-learning-meta"><span class="badge purple">'+typeLabel(l.type)+'</span><span class="badge">'+l.duration+' دقيقة</span><span class="badge '+(completed?"green":"orange")+'">'+(completed?"مكتمل":"قيد الدراسة")+'</span></div>'+
  (l.mediaType!=="none"&&l.resource?'<div class="lesson-media-placeholder"><strong>الوسائط</strong><p class="muted">'+esc(l.mediaType)+' • <a href="'+esc(l.resource)+'" target="_blank" rel="noopener">فتح المحتوى</a></p></div>':'')+
  '<section class="lesson-learning-section"><span class="eyebrow blue">أهداف الدرس</span><div class="learning-text">'+esc(l.objectives||"لم تُحدد أهداف بعد.")+'</div></section>'+
  '<section class="lesson-learning-section"><span class="eyebrow blue">المحتوى التعليمي</span><div class="learning-text">'+esc(l.content||"لم تتم إضافة المحتوى التعليمي لهذا الدرس بعد.").replaceAll("\n","<br>")+'</div></section>'+
  (l.attachments?'<section class="lesson-learning-section"><span class="eyebrow blue">المرفقات</span><div class="attachment-list">'+l.attachments.split(",").map(x=>x.trim()).filter(Boolean).map((x,i)=>'<a class="attachment-link" href="'+esc(x)+'" target="_blank" rel="noopener">📎 ملف/رابط '+(i+1)+'</a>').join("")+'</div></section>':'')+
  '<div class="lesson-learning-actions"><button class="btn '+(completed?"btn-soft":"btn-green")+'" data-course-learning-action="complete-lesson" data-course="'+c.id+'" data-unit="'+u.id+'" data-lesson="'+l.id+'">'+(completed?"تم إكمال الدرس ✓":"إكمال الدرس ✓")+'</button><button class="btn btn-primary" data-course-learning-action="next-lesson" data-course="'+c.id+'" data-unit="'+u.id+'" data-lesson="'+l.id+'">الدرس التالي →</button></div></main>'+
  '<aside class="card lesson-learning-side"><div class="section-title"><h3>ملخص</h3><span class="badge purple">V3.7</span></div><div class="stat-row"><span>الأسئلة المرتبطة</span><b>'+((l.questions||"").split(",").map(q=>q.trim()).filter(Boolean).length)+'</b></div><div class="stat-row"><span>المختبر</span><b>'+esc(l.lab||"بدون")+'</b></div><div class="stat-row"><span>التقدم</span><b>'+coursePct(c)+'%</b></div><div class="progress"><span style="width:'+coursePct(c)+'%"></span></div>'+(l.questions?'<button class="btn btn-soft full" data-course-learning-action="open-practice" style="margin-top:12px">ابدأ تدريب الدرس</button>':"")+'</aside></div>';
}

export function handleLearningAction(t){
  const a=t.dataset.courseLearningAction,c=activeCourse();
  if(!c)return{page:"course",rerender:true};
  if(a==="open-lesson"){localStorage.setItem(ACTIVE_COURSE,String(t.dataset.course));localStorage.setItem(ACTIVE_LESSON,t.dataset.course+"-"+t.dataset.unit+"-"+t.dataset.lesson);return{page:"lesson-content",rerender:true};}
  if(a==="back-course"){localStorage.removeItem(ACTIVE_LESSON);return{page:"course",rerender:true};}
  if(a==="complete-lesson"){const key=t.dataset.course+"-"+t.dataset.unit+"-"+t.dataset.lesson;const d=done();if(!d.includes(key))d.push(key);saveDone(d);return{page:"lesson-content",rerender:true};}
  if(a==="next-lesson"){const all=allLessons(c),idx=all.findIndex(x=>lessonKey(c,x.unit,x.lesson)===t.dataset.course+"-"+t.dataset.unit+"-"+t.dataset.lesson);const n=all[idx+1];if(n){localStorage.setItem(ACTIVE_LESSON,lessonKey(c,n.unit,n.lesson));return{page:"lesson-content",rerender:true};}return{page:"course",rerender:true};}
  if(a==="open-practice")return{page:"practice",rerender:true};
  return{rerender:true};
}
