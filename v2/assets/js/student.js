import {lessons,questions,defaultStudent,defaultActivity,loadStudent,saveStudent,resetDemo,loadPractice,savePractice} from "./demo-data.js";
import {examPage,getLastWeakTopics} from "./exam-v23.js?v=430";
import {labPage} from "./subnet-lab-v25.js";
import {flsmPage} from "./flsm-v26.js";
import {vlsmPage} from "./vlsm-v27.js";
import {getLearningSnapshot,getSmartRecommendation,getWeakTopics} from "./smart-engine-v28.js";
import {notificationsPage,getUnreadCount} from "./notifications-v30.js";

let student=loadStudent();

const esc=(v)=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const levelClass=(p)=>p>=80?"green":p>=60?"orange":"red";

export const studentState={page:"home",practice:{ids:questions.map(q=>q.id),index:0,score:0,done:false,review:false},modal:null};

function statCard(label,value,sub=""){return `<div class="card student-stat"><div class="muted">${label}</div><div class="kpi-value">${value}</div><div class="muted">${sub}</div></div>`}

function pathHtml(){
  return `<div class="learning-path">${lessons.map((l,i)=>`
    <div class="path-item ${l.status}">
      <div class="path-line">${i<lessons.length-1?'<span></span>':''}</div>
      <div class="path-dot">${l.status==="completed"?"✓":i+1}</div>
      <div class="path-content">
        <div class="path-top"><strong>${l.title}</strong><span class="badge ${l.status==="completed"?"green":l.status==="current"?"orange":""}">${l.status==="completed"?"مكتمل":l.status==="current"?"أنت هنا":"قادم"}</span></div>
        <div class="muted">${l.desc}</div>
        <div class="path-meta"><span>${l.time}</span><span>${l.progress}%</span></div>
        <div class="progress"><span style="width:${l.progress}%"></span></div>
      </div>
    </div>`).join("")}</div>`
}

function home(){
  const snapshot=getLearningSnapshot();
  const recommendation=getSmartRecommendation();
  const ready=recommendation.topic||snapshot.weak[0]?.topic||"Binary";
  const next=lessons.find(l=>l.status==="current")||lessons[0];
  return `
  <section class="student-hero home-hero">
    <div class="student-hero-copy">
      <span class="eyebrow">رحلتك التعليمية • Smart Engine</span>
      <h1>أهلًا ${esc(student.name)} 👋</h1>
      <p>المنصة حللت أداءك وتقترح الآن: <strong>${esc(recommendation.title)}</strong>.</p>
      <div class="hero-actions">
        <button class="btn btn-white" data-page="review">✦ ابدأ الخطوة المقترحة</button>
        <button class="btn btn-outline-white" data-page="level">🎯 إعادة تحديد المستوى</button>
      </div>
    </div>
    <div class="student-hero-side">
      <div class="hero-mini-label">إتقانك الحالي</div>
      <div class="hero-level">${snapshot.scores[ready]??0}%</div>
      <div class="progress hero-progress"><span style="width:${snapshot.scores[ready]??0}%"></span></div>
      <div class="hero-progress-row"><span>${esc(ready)}</span><span>${student.xp} XP</span></div>
    </div>
  </section>

  <div class="home-utility-grid"><div class="card home-utility-card notification-utility"><div class="home-utility-icon">🔔</div><div><span class="eyebrow purple">مركز المتابعة</span><h3>مركز الإشعارات الذكي</h3><p class="muted">لديك <strong>${getUnreadCount("student")}</strong> إشعارًا يحتاج انتباهك أو يقودك للخطوة التالية.</p></div><button class="btn btn-purple" data-page="notifications">فتح الإشعارات</button></div><div class="card home-utility-card"><div class="home-utility-icon green">✓</div><div><span class="eyebrow green">تعلم → ممارسة</span><h3>الخطوة التالية</h3><p class="muted">${esc(recommendation.title)}</p></div><button class="btn btn-green" data-page="${recommendation.page}">ابدأ الآن</button></div></div>\n\n  <div class="student-grid-4 home-kpis">
    ${statCard("تقدم المقرر",student.progress+"%","+6% هذا الأسبوع")}
    ${statCard("إتقان عام",Math.round(Object.values(snapshot.scores).reduce((a,b)=>a+b,0)/Object.keys(snapshot.scores).length)+"%","محرك التعلم")}
    ${statCard("سلسلة التعلم",student.streak+" أيام","استمر غدًا")}
    ${statCard("نقاط الخبرة",student.xp+" XP","الهدف التالي 500")}
  </div>

  <div class="section-title"><h3>خطوتك المقترحة الآن</h3><span class="badge purple">Smart Learning</span></div>
  <div class="smart-next-card card">
    <div class="smart-next-icon">✦</div>
    <div><span class="eyebrow purple">توصية شخصية</span><h3>${esc(recommendation.title)}</h3><p class="muted">${esc(recommendation.reason)}</p></div>
    <button class="btn btn-purple" data-page="${recommendation.page}">ابدأ الآن</button>
  </div>

  <div class="section-title"><h3>ابدأ من هنا</h3><span class="badge orange">المسار الذكي</span></div>
  <div class="home-start-grid">
    <div class="start-card level-start"><div class="start-icon">🎯</div><div class="start-body"><span class="eyebrow orange">التشخيص</span><h3>اختبار تحديد المستوى</h3><p>استخدمه عند بداية المقرر أو عندما تريد إعادة قياس مستواك.</p></div><button class="btn btn-orange" data-page="level">ابدأ</button></div>
    <div class="start-card review-start"><div class="start-icon purple">✦</div><div class="start-body"><span class="eyebrow purple">التحسين</span><h3>المراجعة الذكية</h3><p>ركز على ${esc(ready)} بدل إعادة كل المحتوى.</p></div><button class="btn btn-purple" data-page="review">راجع</button></div>
    <div class="start-card course-start"><div class="start-icon">▶</div><div class="start-body"><span class="eyebrow blue">التعلم</span><h3>${esc(next.title)}</h3><p>استمر في المسار بعد معالجة نقطة الضعف الحالية.</p></div><button class="btn btn-primary" data-page="course">متابعة</button></div>
  </div>

  <div class="section-title"><h3>خريطة الإتقان</h3><button class="link-btn" data-page="progress">التفاصيل</button></div>
  <div class="card mastery-grid">${snapshot.ranked.map(x=>`<div class="mastery-item"><div><strong>${x.topic}</strong><span class="badge ${x.score<50?"red":x.score<70?"orange":"green"}">${x.score}%</span></div><div class="progress"><span style="width:${x.score}%"></span></div><small>${x.level}</small></div>`).join("")}</div>

  <div class="section-title"><h3>مسار تعلمك</h3></div>
  <div class="card">${pathHtml()}</div>

  <div class="home-note"><strong>💡 لماذا هذه التوصية؟</strong><span>${esc(recommendation.reason)}</span></div>
  `
}
function levelPage(){
  const areas=[
    ["IPv4","قوي","84%","تعرف الأساسيات جيدًا"],
    ["Binary","جيد","72%","تحتاج تدريب سرعة"],
    ["Prefix","متوسط","58%","هذا هو التركيز الحالي"],
    ["Subnet Mask","يحتاج تدريب","46%","مراجعة اليوم مفيدة"]
  ];
  return `
  <div class="page-intro"><span class="eyebrow blue">01 • التشخيص</span><h2>اعرف مستواك قبل أن تبدأ</h2><p>هذه الشاشة تمثل فكرة V2: المنصة لا تفترض مستواك، بل تقيسه ثم تقترح الطريق التالي.</p></div>
  <div class="diagnostic-hero card"><div><h3>اختبار تحديد المستوى</h3><p class="muted">12 سؤالًا • 8 دقائق • بدون درجات نهائية</p><div class="diagnostic-points"><span>✓ IPv4</span><span>✓ Binary</span><span>✓ Prefix</span><span>✓ Subnetting</span></div></div><button class="btn btn-primary" data-page="practice">ابدأ التشخيص</button></div>
  <div class="section-title"><h3>الصورة الحالية (Demo)</h3></div>
  <div class="grid-2">${areas.map(a=>`<div class="card skill-card"><div class="skill-head"><strong>${a[0]}</strong><span class="badge ${levelClass(parseInt(a[2]))}">${a[1]}</span></div><div class="skill-value">${a[2]}</div><div class="progress"><span style="width:${a[2]}"></span></div><div class="muted">${a[3]}</div></div>`).join("")}</div>
  `
}

function coursePage(){
  const pct=Math.round(lessons.reduce((s,l)=>s+l.progress,0)/(lessons.length));
  return `
  <div class="page-intro with-action"><div><span class="eyebrow blue">02 • المقرر</span><h2>IPv4 & Subnetting Fundamentals</h2><p>المسار الأساسي الذي ينقل المتدرب من المفهوم إلى التطبيق.</p></div><div class="course-summary"><strong>${pct}%</strong><span>إجمالي التقدم</span></div></div>
  <div class="card course-overview"><div><strong>الهدف النهائي</strong><p class="muted">تستطيع حل مسألة Subnetting كاملة دون الاعتماد على الحفظ الأعمى.</p></div><div class="progress"><span style="width:${pct}%"></span></div><div class="course-stats"><span>6 وحدات</span><span>132 دقيقة</span><span>40+ سؤالًا</span></div></div>
  <div class="lesson-list">${lessons.map((l,i)=>`
    <article class="lesson-card ${l.status}">
      <div class="lesson-number">${i+1}</div>
      <div class="lesson-main"><div class="lesson-title-row"><h3>${l.title}</h3><span class="badge ${l.status==="completed"?"green":l.status==="current"?"orange":""}">${l.status==="completed"?"مكتمل":l.status==="current"?"قيد الدراسة":"مقفل"}</span></div><p class="muted">${l.desc}</p><div class="lesson-meta"><span>⏱ ${l.time}</span><span>${l.progress}%</span></div><div class="progress"><span style="width:${l.progress}%"></span></div></div>
      <button class="btn ${l.status==="locked"?"btn-soft":"btn-primary"}" ${l.status==="locked"?"disabled":""} data-lesson="${l.id}">${l.status==="completed"?"مراجعة":l.status==="current"?"متابعة":"مغلق"}</button>
    </article>`).join("")}</div>
  `
}

function practicePage(review=false){
  if(studentState.practice.done){
    const total=questions.length;
    const percent=Math.round(studentState.practice.score/total*100);
    return `<div class="result-screen"><div class="result-icon">${percent>=80?"🏆":percent>=60?"✅":"↗"}</div><span class="badge ${percent>=80?"green":percent>=60?"orange":"red"}">اكتمل التدريب</span><h2>${studentState.practice.score} / ${total}</h2><p>نتيجتك ${percent}%. ${percent>=80?"ممتاز، استمر بهذا المستوى.":"النتيجة جيدة، لكن توجد نقاط تستحق المراجعة."}</p><div class="result-actions"><button class="btn btn-primary" id="restart-practice">إعادة التدريب</button><button class="btn btn-purple" data-page="review">المراجعة الذكية</button><button class="btn btn-soft" data-page="progress">عرض التقدم</button></div></div>`
  }
  const q=questions.find(x=>x.id===studentState.practice.ids[studentState.practice.index]);
  const pct=Math.round(studentState.practice.index/studentState.practice.ids.length*100);
  return `
  <div class="practice-top"><div><span class="eyebrow blue">${review?"05 • مراجعة ذكية":"03 • التدريب"}</span><h2>${review?"مراجعة مركزة":"تدريب سريع"}</h2><p>حل السؤال ثم شاهد سبب الإجابة، وليس النتيجة فقط.</p></div><div class="practice-counter">سؤال ${studentState.practice.index+1} / ${studentState.practice.ids.length}</div></div>
  <div class="card practice-progress"><div class="progress"><span style="width:${pct}%"></span></div></div>
  <div class="practice-layout"><div class="card question-card"><div class="question-meta"><span class="badge">${q.topic}</span><span class="badge ${q.difficulty==="hard"?"red":q.difficulty==="medium"?"orange":"green"}">${q.difficulty==="hard"?"متقدم":q.difficulty==="medium"?"متوسط":"سهل"}</span></div><h2>${q.q}</h2><div class="answer-grid">${q.opts.map((o,i)=>`<button class="answer-option" data-answer="${i}"><span>${String.fromCharCode(65+i)}</span>${o}</button>`).join("")}</div><div id="question-feedback"></div></div>
    <aside class="card tip-card"><span class="eyebrow purple">لماذا؟</span><h3>فكر قبل الاختيار</h3><p class="muted">حاول حل السؤال ذهنيًا ثم اختر. بعد الإجابة ستظهر لك قاعدة مختصرة تساعدك في الأسئلة التالية.</p><div class="tip-rule">💡 لا تحفظ الـ Magic Number؛ افهم كيف نصل إليه.</div></aside></div>
  `
}

function examsPage(){ return examPage(); }
function labsPage(){
 return `
 <div class="page-intro"><span class="eyebrow green">06 • المختبرات</span><h2>المختبرات العملية</h2><p>انتقل من المفهوم إلى الحل العملي، وكل مختبر يبني مهارة مختلفة.</p></div>
 <div class="lab-hub-grid">
   <div class="hub-card hub-primary"><div class="hub-icon">⌘</div><span class="badge green">متاح الآن</span><h3>Subnetting Challenge</h3><p>حل شبكة واحدة وحدد Network وHosts وBroadcast وSubnet Mask.</p><div class="hub-meta"><span>6 عناصر</span><span>متوسط</span></div><button class="btn btn-green" data-lab-page="subnet">فتح المختبر</button></div>
   <div class="hub-card hub-purple"><div class="hub-icon">4</div><span class="badge purple">V2.6</span><h3>FLSM Challenge</h3><p>قسّم شبكة /24 إلى 4 أو 8 شبكات متساوية ثم احسب بيانات كل Subnet.</p><div class="hub-meta"><span>4–8 Subnets</span><span>متوسط</span></div><button class="btn btn-purple" data-lab-page="flsm">ابدأ التحدي</button></div>
   <div class="hub-card"><div class="hub-icon orange">01</div><span class="badge orange">قريبًا</span><h3>Binary Speed Lab</h3><p>تدريب سريع على التحويل بين Binary وDecimal وربط البتات بالـPrefix.</p><div class="hub-meta"><span>سرعة</span><span>مبتدئ</span></div><button class="btn btn-soft" disabled>قريبًا</button></div>
   <div class="hub-card"><div class="hub-icon green">↗</div><span class="badge">المرحلة التالية</span><h3>Packet Tracer</h3><p>سيناريوهات شبكات عملية تتدرج من IPv4 إلى Routing وSwitching.</p><div class="hub-meta"><span>عملي</span><span>متقدم</span></div><button class="btn btn-soft" disabled>لاحقًا</button></div>
 <div class="hub-card hub-vlsm"><div class="hub-icon">V</div><span class="badge purple">V2.7</span><h3>VLSM Challenge</h3><p>وزّع شبكة على أقسام باحتياجات مختلفة من الأكبر إلى الأصغر، بدون تداخل.</p><div class="hub-meta"><span>سيناريو واقعي</span><span>متقدم</span></div><button class="btn btn-purple" data-lab-page="vlsm">ابدأ التحدي</button></div>
 </div>
 <div class="lab-hub-note"><strong>منهج المختبرات:</strong><span>كل مختبر يعطي نتيجة، ويحفظ المحاولة، ويغذي التقدم والمراجعة الذكية في النسخة النهائية.</span></div>`
}

function progressPage(){
 const snapshot=getLearningSnapshot();
 const completed=lessons.filter(l=>l.progress===100).length;
 const overall=Math.round(Object.values(snapshot.scores).reduce((a,b)=>a+b,0)/Object.keys(snapshot.scores).length);
 return `
 <div class="page-intro"><span class="eyebrow blue">07 • التقدم</span><h2>لوحة إتقانك</h2><p>التقدم هنا لا يعتمد على إكمال الدروس فقط؛ بل على مستوى الإتقان الفعلي.</p></div>
 <div class="student-grid-4">${statCard("إكمال المقرر",student.progress+"%",completed+" من "+lessons.length+" وحدات")}${statCard("الإتقان العام",overall+"%","Smart Engine")}${statCard("سلسلة التعلم",student.streak+" أيام","أفضل سلسلة 7")}${statCard("XP",student.xp,"الهدف التالي 500")}</div>
 <div class="section-title"><h3>الإتقان حسب الموضوع</h3><span class="badge purple">يُحدّث تلقائيًا</span></div>
 <div class="card mastery-grid large">${snapshot.ranked.map(x=>`<div class="mastery-item"><div><strong>${x.topic}</strong><span class="badge ${x.score<50?"red":x.score<70?"orange":"green"}">${x.score}%</span></div><div class="progress"><span style="width:${x.score}%"></span></div><small>${x.level}</small></div>`).join("")}</div>
 <div class="section-title"><h3>مسار التعلم</h3></div><div class="card">${pathHtml()}</div>
 <div class="grid-2" style="margin-top:14px"><div class="card"><h3>أعلى نقاط القوة</h3>${snapshot.strong.slice(0,3).map(x=>`<div class="stat-row"><span>${x.topic}</span><strong>${x.score}%</strong></div>`).join("")||'<div class="empty">سيظهر هنا أعلى أداء بعد تسجيل المحاولات.</div>'}</div><div class="card"><h3>أولوية التحسين</h3>${snapshot.weak.map(x=>`<div class="stat-row"><span>${x.topic}</span><strong>${x.score}%</strong></div>`).join("")||'<div class="empty">لا توجد نقاط ضعف حرجة حاليًا.</div>'}</div></div>`
}
function reviewPage(){
 const snapshot=getLearningSnapshot();
 const topics=snapshot.weak.length?snapshot.weak.map(x=>x.topic):getWeakTopics();
 const focus=topics[0]||"Binary";
 return `
 <div class="page-intro"><span class="eyebrow purple">05 • المراجعة الذكية</span><h2>مراجعة مبنية على أدائك</h2><p>المحرك جمع نتائج التدريب والاختبارات والمختبرات ورتب لك أهم نقاط الضعف.</p></div>
 <div class="review-focus card"><div class="review-score"><strong>${topics.length}</strong><span>أولويات</span></div><div><h3>ابدأ بـ ${esc(focus)}</h3><p class="muted">أداؤك الحالي في هذا الموضوع ${snapshot.scores[focus]}%، لذلك وضعه المحرك في أعلى القائمة.</p></div><button class="btn btn-purple" id="start-smart-review">ابدأ التدريب المستهدف</button></div>
 <div class="grid-3" style="margin-top:14px">${snapshot.ranked.slice(0,3).map((x,i)=>`<div class="card review-topic"><div class="review-num">${i+1}</div><h3>${esc(x.topic)}</h3><div class="progress"><span style="width:${x.score}%"></span></div><p class="muted">الإتقان الحالي: ${x.score}%</p><span class="badge ${x.score<50?"red":x.score<70?"orange":"green"}">${x.level}</span></div>`).join("")}</div>
 <div class="card smart-rule"><strong>المحرك الذكي</strong><p class="muted">كل نتيجة جديدة تعيد ترتيب الأولويات. عندما يرتفع إتقان موضوع، تنتقل التوصية تلقائيًا إلى الموضوع التالي.</p></div>`
}
function achievementsPage(){
 const all=["أول خطوة","4 أيام متتالية","إكمال وحدتين","500 XP","80% في اختبار","إتقان Binary","خبير Subnetting"];
 return `
 <div class="page-intro"><span class="eyebrow orange">08 • الإنجازات</span><h2>تقدمك له معنى</h2><p>الإنجازات تشجع الاستمرارية بدون أن تصبح هي الهدف الرئيسي.</p></div>
 <div class="achievement-grid">${all.map((a,i)=>`<div class="achievement-card ${i<2?"earned":""}"><div class="achievement-big">${i<2?"🏅":"🔒"}</div><h3>${a}</h3><p class="muted">${i<2?"تم الحصول عليه":"لم يتحقق بعد"}</p></div>`).join("")}</div>`
}

function certificatePage(){
 return `
 <div class="page-intro"><span class="eyebrow green">09 • الشهادة</span><h2>الشهادة الذكية</h2><p>لا تُمنح الشهادة لمجرد إنهاء صفحات؛ بل بعد استيفاء معايير الإتقان.</p></div>
 <div class="certificate-card card"><div class="certificate-title">IPv4 Academy</div><div class="certificate-sub">شهادة إتقان أساسيات IPv4 وSubnetting</div><div class="certificate-name">${esc(student.name)}</div><div class="certificate-ready">جاهزية الشهادة <strong>42%</strong></div><div class="certificate-reqs"><div><b>✓</b><span>إكمال المقرر</span><strong>18%</strong></div><div><b>✓</b><span>الاختبار النهائي</span><strong>غير مكتمل</strong></div><div><b>✓</b><span>المختبر العملي</span><strong>غير مكتمل</strong></div><div><b>✓</b><span>حد الإتقان</span><strong>80%</strong></div></div></div>`
}

export function studentPage(){
  if(studentState.page==="level") return levelPage();
  if(studentState.page==="course") return coursePage();
  if(studentState.page==="practice") return practicePage(false);
  if(studentState.page==="subnet-lab") return labPage();
  if(studentState.page==="flsm") return flsmPage();
  if(studentState.page==="vlsm") return vlsmPage();
  if(studentState.page==="review") return reviewPage();
  if(studentState.page==="exams") return examsPage();
  if(studentState.page==="labs") return labsPage();
  if(studentState.page==="progress") return progressPage();
  if(studentState.page==="notifications") return notificationsPage("student");
  if(studentState.page==="achievements") return achievementsPage();
  if(studentState.page==="certificate") return certificatePage();
  return home();
}

export function refreshStudent(){student=loadStudent();return student}

export function handleStudentAction(target){
  if(target.dataset.answer!==undefined) return answerQuestion(Number(target.dataset.answer));
  if(target.id==="restart-practice"){studentState.practice={ids:questions.map(q=>q.id),index:0,score:0,done:false,review:false};return {rerender:true}}
  if(target.id==="start-smart-review"){
    const topics=getWeakTopics();
    const ids=topics.length?questions.filter(q=>topics.includes(q.topic)).map(q=>q.id):questions.slice(0,5).map(q=>q.id);
    studentState.practice={ids,index:0,score:0,done:false,review:true};
    studentState.page="practice";
    return {rerender:true}
  }
  if(target.dataset.lesson){const l=lessons.find(x=>x.id===Number(target.dataset.lesson));if(l && l.status!=="locked"){studentState.page="practice";return {rerender:true,message:"تم فتح تدريب الدرس: "+l.title}}}
  return null;
}

function answerQuestion(answer){
  const idx=studentState.practice.index;
  const q=questions.find(x=>x.id===studentState.practice.ids[idx]);
  const ok=answer===q.a;
  if(ok) studentState.practice.score++;
  const p=loadPractice();
  p.answers=p.answers||[];
  p.answers.push({questionId:q.id,topic:q.topic,correct:ok,at:Date.now()});
  savePractice(p);
  if(ok && !student.badges.includes("إجابة صحيحة")) student.badges.push("إجابة صحيحة");
  saveStudent(student);
  return {ok,q};
}

export function currentStudent(){return student}
export function getFeedback(){return null}
export function getQuestion(){return questions[studentState.practice.ids[studentState.practice.index]]}
export function resetDemoData(){resetDemo();student=loadStudent();studentState.page="home";studentState.practice={ids:questions.map(q=>q.id),index:0,score:0,done:false,review:false}}
