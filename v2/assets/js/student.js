import {lessons,questions,defaultStudent,defaultActivity,loadStudent,saveStudent,resetDemo,loadPractice,savePractice} from "./demo-data.js";
import {examPage,getLastWeakTopics} from "./exam-v23.js";
import {labPage} from "./subnet-lab-v25.js";

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
  const next=lessons.find(l=>l.status==="current")||lessons[0];
  const ready=student.reviewTopics[0]||"Binary";
  return `
  <section class="student-hero home-hero">
    <div class="student-hero-copy">
      <span class="eyebrow">رحلتك التعليمية • Demo</span>
      <h1>أهلًا ${esc(student.name)} 👋</h1>
      <p>المنصة رتبت لك الطريق. ابدأ من مستواك، ثم انتقل مباشرة إلى التدريب المناسب لك.</p>
      <div class="hero-actions">
        <button class="btn btn-white" data-page="level">🎯 اختبار تحديد المستوى</button>
        <button class="btn btn-outline-white" data-page="review">✦ المراجعة الذكية</button>
      </div>
    </div>
    <div class="student-hero-side">
      <div class="hero-mini-label">مستواك الحالي</div>
      <div class="hero-level">${student.level}</div>
      <div class="progress hero-progress"><span style="width:${student.progress}%"></span></div>
      <div class="hero-progress-row"><span>${student.progress}% من المسار</span><span>${student.xp} XP</span></div>
    </div>
  </section>

  <div class="student-grid-4 home-kpis">
    ${statCard("تقدم المقرر",student.progress+"%","+6% هذا الأسبوع")}
    ${statCard("متوسط الأداء",student.avgScore+"%","آخر المحاولات")}
    ${statCard("سلسلة التعلم",student.streak+" أيام","استمر غدًا")}
    ${statCard("نقاط الخبرة",student.xp+" XP","الهدف التالي 500")}
  </div>

  <div class="section-title"><h3>ابدأ من هنا</h3><span class="badge orange">3 خطوات فقط</span></div>
  <div class="home-start-grid">
    <div class="start-card level-start">
      <div class="start-icon">🎯</div>
      <div class="start-body">
        <span class="eyebrow orange">الخطوة 1</span>
        <h3>اختبار تحديد المستوى</h3>
        <p>اعرف مستواك الحقيقي في IPv4 وBinary وSubnetting.</p>
      </div>
      <button class="btn btn-orange" data-page="level">ابدأ الآن</button>
    </div>
    <div class="start-card review-start">
      <div class="start-icon purple">✦</div>
      <div class="start-body">
        <span class="eyebrow purple">الخطوة 2</span>
        <h3>المراجعة الذكية</h3>
        <p>راجع ${esc(ready)} وأهم النقاط التي تحتاج إلى تحسين.</p>
      </div>
      <button class="btn btn-purple" data-page="review">راجع الآن</button>
    </div>
    <div class="start-card course-start">
      <div class="start-icon">▶</div>
      <div class="start-body">
        <span class="eyebrow blue">الخطوة 3</span>
        <h3>تابع المقرر</h3>
        <p>أكمل من ${esc(next.title)} دون العودة إلى قوائم كثيرة.</p>
      </div>
      <button class="btn btn-primary" data-page="course">متابعة</button>
    </div>
  </div>

  <div class="section-title"><h3>مسار تعلمك</h3><button class="link-btn" data-page="progress">عرض التقدم الكامل</button></div>
  <div class="card">${pathHtml()}</div>

  <div class="section-title"><h3>آخر نشاط</h3><button class="link-btn" data-page="progress">السجل الكامل</button></div>
  <div class="card activity-list">${defaultActivity.map(a=>`<div class="activity-item"><div class="activity-dot"></div><div class="activity-main"><strong>${a.title}</strong><span class="muted">${a.type} • ${a.time}</span></div><span class="badge ${a.status.includes("%")?"":"green"}">${a.status}</span></div>`).join("")}</div>

  <div class="home-note"><strong>💡 نصيحة اليوم</strong><span>في Subnetting لا تحفظ النتائج فقط؛ اربط دائمًا بين Prefix وSubnet Mask وMagic Number.</span></div>
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
function labsPage(){ return labPage(); }
function progressPage(){
 const completed=lessons.filter(l=>l.progress===100).length;
 return `
 <div class="page-intro"><span class="eyebrow blue">07 • التقدم</span><h2>تقدمك من صفحة واحدة</h2><p>نقيس التعلم، التطبيق، والاختبارات معًا.</p></div>
 <div class="student-grid-4">${statCard("إكمال المقرر",student.progress+"%",completed+" من "+lessons.length+" وحدات")}${statCard("متوسط الدرجات",student.avgScore+"%","آخر 3 محاولات")}${statCard("سلسلة التعلم",student.streak+" أيام","أفضل سلسلة 7")}${statCard("XP",student.xp,"الهدف التالي 500")}</div>
 <div class="section-title"><h3>المسار</h3></div><div class="card">${pathHtml()}</div>
 <div class="grid-2" style="margin-top:14px"><div class="card"><h3>الأداء حسب الموضوع</h3>${[["IPv4",84],["Binary",72],["Prefix",58],["Subnet Mask",46]].map(x=>`<div class="stat-row"><span>${x[0]}</span><strong>${x[1]}%</strong></div>`).join("")}</div><div class="card"><h3>النشاط الأسبوعي</h3><div class="weekly-bars">${[35,55,40,75,50,88,62].map((v,i)=>`<div><span style="height:${v}%"></span><small>${["أ","ح","ن","ث","ر","خ","ج"][i]}</small></div>`).join("")}</div></div></div>`
}

function reviewPage(){
 const examWeak=getLastWeakTopics();
 const topics=examWeak.length?examWeak:student.reviewTopics;
 const scoreHints=topics.map((t,i)=>({Binary:72,Prefix:58,"Subnet Mask":46,FLSM:61,VLSM:42,IPv4:84}[t]??55));
 return `
 <div class="page-intro"><span class="eyebrow purple">05 • المراجعة الذكية</span><h2>مراجعة مبنية على نتيجتك</h2><p>${examWeak.length?"تم تحديث الأولويات اعتمادًا على آخر اختبار قمت به.":"نركز على ما يحتاجه مستواك الآن، ثم نقيس التحسن."}</p></div>
 <div class="review-focus card"><div class="review-score"><strong>${topics.length}</strong><span>موضوعات الأولوية</span></div><div><h3>أولوية اليوم</h3><p class="muted">ابدأ بـ <strong>${topics[0]||"Binary"}</strong> ثم انتقل إلى الموضوع التالي.</p></div><button class="btn btn-purple" id="start-smart-review">ابدأ التدريب المستهدف</button></div>
 <div class="grid-3" style="margin-top:14px">${topics.map((t,i)=>`<div class="card review-topic"><div class="review-num">${i+1}</div><h3>${t}</h3><div class="progress"><span style="width:${scoreHints[i]}%"></span></div><p class="muted">آخر مستوى مقاس: ${scoreHints[i]}%</p><button class="btn btn-soft" data-review-topic="${t}">تدريب مخصص</button></div>`).join("")}</div>
 <div class="card smart-rule"><strong>كيف نقرر نقطة الضعف؟</strong><p class="muted">تجمع المنصة بين نتائج الاختبارات، أخطاء الأسئلة، ودقة التدريب. عندما تتحسن النتيجة، تتغير الأولوية تلقائيًا.</p></div>`
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
  if(studentState.page==="review") return reviewPage();
  if(studentState.page==="exams") return examsPage();
  if(studentState.page==="labs") return labsPage();
  if(studentState.page==="progress") return progressPage();
  if(studentState.page==="achievements") return achievementsPage();
  if(studentState.page==="certificate") return certificatePage();
  return home();
}

export function refreshStudent(){student=loadStudent();return student}

export function handleStudentAction(target){
  if(target.dataset.answer!==undefined) return answerQuestion(Number(target.dataset.answer));
  if(target.id==="restart-practice"){studentState.practice={ids:questions.map(q=>q.id),index:0,score:0,done:false,review:false};return {rerender:true}}
  if(target.id==="start-smart-review"){
    const topics=getLastWeakTopics();
    const ids=topics.length?questions.filter(q=>topics.includes(q.topic)).map(q=>q.id):[5,3,8,9,4];
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
