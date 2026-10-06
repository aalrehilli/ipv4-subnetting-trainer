/* IPv4 Subnetting Trainer — V68 Advanced Analytics */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=v=>typeof window.esc==="function"?window.esc(v):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const roleOK=()=>window.db && window.profile && ["trainer","admin"].includes(window.profile.role);

  const state={attempts:[],exams:[],profiles:[],exercise:[],answers:[],questions:[],lessons:[],progress:[],filters:{},charts:{}};

  function styles(){
    if($("v68AnalyticsStyles"))return;
    const s=document.createElement("style");s.id="v68AnalyticsStyles";
    s.textContent=
      ".v68-wrap{margin-top:18px}.v68-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.v68-head h3{margin:0}.v68-filters{display:grid;grid-template-columns:repeat(6,minmax(120px,1fr));gap:10px;margin-top:14px}.v68-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:14px 0}.v68-kpi{background:linear-gradient(135deg,#f8fbff,#fff);border:1px solid #dce8f2;border-radius:14px;padding:13px}.v68-kpi .l{font-size:12px;color:#65788a}.v68-kpi .v{font-size:25px;font-weight:800;color:#0759a5;margin-top:4px}.v68-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.v68-panel{background:#fff;border:1px solid #dce8f2;border-radius:14px;padding:14px;margin-top:14px}.v68-panel h4{margin:0 0 10px;color:#0759a5}.v68-chart{position:relative;min-height:280px}.v68-chart canvas{max-height:320px}.v68-table{overflow:auto}.v68-table table{min-width:760px}.v68-bad{color:#b3261e;font-weight:800}.v68-good{color:#168a46;font-weight:800}.v68-muted{color:#65788a}.v68-actions{display:flex;gap:8px;flex-wrap:wrap}.v68-note{padding:10px;border-radius:10px;background:#f7fbff;border:1px solid #dce8f2;margin-top:10px}.v68-mini{font-size:12px;color:#65788a}.v68-risk-row{background:#fff6f6}.v68-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.v68-tabs button{padding:8px 11px;border:1px solid #ccdbe8;background:#fff;border-radius:8px;cursor:pointer}.v68-tabs button.active{background:#0759a5;color:#fff}.v68-section[hidden]{display:none}.v68-pagination{display:flex;justify-content:center;gap:8px;align-items:center;margin-top:10px}.v68-details summary{cursor:pointer;font-weight:800;color:#0759a5}.v68-details{margin-top:12px}.v68-pill{display:inline-block;padding:4px 8px;border-radius:20px;background:#eef6ff;font-size:12px;margin:2px}.v68-danger{background:#fff0f0;color:#b3261e}.v68-success{background:#eefaf1;color:#168a46}@media(max-width:1050px){.v68-filters{grid-template-columns:repeat(3,1fr)}.v68-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.v68-filters,.v68-kpis,.v68-grid2{grid-template-columns:1fr}.v68-chart{min-height:230px}}";
    document.head.appendChild(s);
  }

  async function allRows(table,select,decorate){
    let offset=0,all=[];
    while(true){
      let q=window.db.from(table).select(select).range(offset,offset+999);
      if(decorate)q=decorate(q);
      const r=await q;
      if(r.error)throw r.error;
      const rows=r.data||[];all.push(...rows);
      if(rows.length<1000)break;
      offset+=1000;if(offset>20000)break;
    }
    return all;
  }

  async function loadData(){
    const [attempts,exams,profiles,exercise,answers,lessons,progress]=await Promise.all([
      allRows("attempts","id,student_id,exam_id,percentage,score,correct_answers,total_questions,started_at,submitted_at,created_at,trainer_exams(title,topic,group_name,difficulty)"),
      allRows("trainer_exams","id,title,topic,group_name,difficulty,question_count,duration_minutes,is_active,created_at"),
      allRows("profiles","id,full_name,student_id,group_name,role,created_at",q=>q.eq("role","student")),
      allRows("exercise_attempts","id,student_id,score,is_correct,borrowed_bits_answer,prefix_answer,subnet_mask_answer,magic_number_answer,hosts_answer,created_at"),
      allRows("attempt_answers","attempt_id,question_id,selected_answer,correct_answer,is_correct"),
      allRows("course_lessons","id,lesson_no,title,is_active"),
      allRows("lesson_progress","user_id,lesson_id,completed,practice_completed,practice_score,completed_at,practice_completed_at")
    ]);
    const qids=[...new Set(answers.map(x=>x.question_id).filter(Boolean))];
    let questions=[];
    for(let i=0;i<qids.length;i+=500){
      const ids=qids.slice(i,i+500),r=await window.db.from("trainer_questions").select("id,question_text,topic,difficulty").in("id",ids);
      if(r.error)throw r.error;questions.push(...(r.data||[]));
    }
    Object.assign(state,{attempts,exams,profiles,exercise,answers,questions,lessons,progress});
  }

  function setup(){
    const host=$("trainerAnalyticsArea");
    if(!host)return;
    if($("v68Analytics"))return;
    const box=document.createElement("div");box.id="v68Analytics";box.className="v68-wrap";
    box.innerHTML=
      '<div class="v68-panel">'+
      '<div class="v68-head"><div><span class="badge">V68 • Advanced Data Center</span><h3>📊 مركز التحليلات المتقدم</h3><div class="v68-mini">تحليل تاريخي قابل للفلترة: المتدربون، الشعب، الاختبارات، الموضوعات، الأسئلة، النشاط والتقدم الدراسي.</div></div><div class="v68-actions"><button class="primary" id="v68Refresh">🔄 تحديث البيانات</button><button class="primary green" id="v68Csv">⬇️ CSV</button></div></div>'+
      '<div class="v68-filters">'+
      '<div><label>من تاريخ</label><input type="date" id="v68From"></div>'+
      '<div><label>إلى تاريخ</label><input type="date" id="v68To"></div>'+
      '<div><label>الشعبة</label><select id="v68Group"><option value="">كل الشعب</option></select></div>'+
      '<div><label>الموضوع</label><select id="v68Topic"><option value="">كل الموضوعات</option></select></div>'+
      '<div><label>الاختبار</label><select id="v68Exam"><option value="">كل الاختبارات</option></select></div>'+
      '<div><label>النشاط</label><select id="v68Activity"><option value="all">الكل</option><option value="exam">اختبارات</option><option value="practice">تمارين</option></select></div>'+
      '</div>'+
      '<div class="v68-kpis" id="v68Kpis"></div>'+
      '<div class="v68-tabs">'+
      '<button class="active" data-v68tab="overview">📊 نظرة عامة</button><button data-v68tab="students">👥 المتدربون</button><button data-v68tab="groups">🏫 الشعب</button><button data-v68tab="topics">📚 الموضوعات</button><button data-v68tab="questions">🧠 الأسئلة</button><button data-v68tab="trend">📈 الاتجاه الزمني</button>'+
      '</div>'+
      '<div id="v68Overview" class="v68-section"></div><div id="v68Students" class="v68-section" hidden></div><div id="v68Groups" class="v68-section" hidden></div><div id="v68Topics" class="v68-section" hidden></div><div id="v68Questions" class="v68-section" hidden></div><div id="v68Trend" class="v68-section" hidden></div>'+
      '</div>';
    host.prepend(box);
    ["v68From","v68To","v68Group","v68Topic","v68Exam","v68Activity"].forEach(id=>$(id).addEventListener("change",renderAll));
    $("v68Refresh").onclick=async()=>{await refresh();};
    $("v68Csv").onclick=exportCSV;
    box.querySelectorAll("[data-v68tab]").forEach(b=>b.onclick=()=>switchTab(b.dataset.v68tab));
    // default: previous 30 days
    const to=new Date(),from=new Date(Date.now()-29*86400000);
    $("v68To").value=to.toISOString().slice(0,10);$("v68From").value=from.toISOString().slice(0,10);
  }

  function switchTab(tab){
    document.querySelectorAll("#v68Analytics [data-v68tab]").forEach(b=>b.classList.toggle("active",b.dataset.v68tab===tab));
    ["Overview","Students","Groups","Topics","Questions","Trend"].forEach(x=>{const el=$("v68"+x);if(el)el.hidden=(x.toLowerCase()!==tab);});
  }

  function filters(){
    return {from:$("v68From")?.value||"",to:$("v68To")?.value||"",group:$("v68Group")?.value||"",topic:$("v68Topic")?.value||"",exam:$("v68Exam")?.value||"",activity:$("v68Activity")?.value||"all"};
  }

  function inDate(date,f){
    if(!date)return false;const d=new Date(date);if(Number.isNaN(d.getTime()))return false;
    if(f.from&&d<new Date(f.from+"T00:00:00"))return false;
    if(f.to&&d>new Date(f.to+"T23:59:59"))return false;
    return true;
  }

  function filtered(){
    const f=filters();
    const A=state.attempts.filter(x=>{
      const t=x.trainer_exams||{};
      return inDate(x.submitted_at||x.created_at,f)&&(!f.group||t.group_name===f.group)&&(!f.topic||t.topic===f.topic)&&(!f.exam||x.exam_id===f.exam)&&f.activity!=="practice";
    });
    const E=state.exercise.filter(x=>inDate(x.created_at,f)&&(!f.group||state.profiles.find(p=>p.id===x.student_id)?.group_name===f.group)&&f.activity!=="exam");
    return {A,E,f};
  }

  function populate(){
    const groups=[...new Set(state.profiles.map(x=>x.group_name).filter(Boolean))].sort();
    $("v68Group").innerHTML='<option value="">كل الشعب</option>'+groups.map(x=>'<option>'+esc(x)+'</option>').join("");
    const topics=[...new Set(state.exams.map(x=>x.topic).filter(Boolean))].sort();
    $("v68Topic").innerHTML='<option value="">كل الموضوعات</option>'+topics.map(x=>'<option>'+esc(x)+'</option>').join("");
    const ex=state.exams.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    $("v68Exam").innerHTML='<option value="">كل الاختبارات</option>'+ex.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+'</option>').join("");
  }

  function kp(label,value,sub){
    return '<div class="v68-kpi"><div class="l">'+esc(label)+'</div><div class="v">'+esc(value)+'</div><div class="v68-mini">'+esc(sub||"")+'</div></div>';
  }

  function renderKpis(D){
    const ids=new Set([...D.A.map(x=>x.student_id),...D.E.map(x=>x.student_id)]);
    const scores=D.A.map(x=>Number(x.percentage||0));
    const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
    const pass=scores.length?Math.round(scores.filter(x=>x>=60).length/scores.length*100):0;
    const active=new Set([...D.A.map(x=>x.student_id),...D.E.map(x=>x.student_id)]);
    const risk=scores.filter(x=>x<60).length;
    const practice=D.E.length;
    const practiceRate=practice?Math.round(D.E.filter(x=>x.is_correct).length/practice*100):0;
    $("v68Kpis").innerHTML=[
      kp("المتدربون النشطون",ids.size,"ضمن الفترة"),
      kp("محاولات الاختبارات",D.A.length,"كل الاختبارات المحددة"),
      kp("متوسط الدرجات",avg+"%","اختبارات"),
      kp("نسبة النجاح",pass+"%","60% فأعلى"),
      kp("محاولات التمارين",practice,"كل التمارين المحددة"),
      kp("دقة التمارين",practiceRate+"%","إجابات صحيحة")
    ].join("");
  }

  function chart(id,type,labels,datasets,opts){
    const el=$(id);if(!el||typeof Chart==="undefined")return;
    if(state.charts[id]){try{state.charts[id].destroy();}catch(_e){}}
    state.charts[id]=new Chart(el,{type,data:{labels,datasets},options:Object.assign({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}}},opts||{})});
  }

  function canvas(id){return '<div class="v68-chart"><canvas id="'+id+'"></canvas></div>';}

  function renderOverview(D){
    const A=D.A,E=D.E;
    const byScore=[[0,39],[40,59],[60,69],[70,79],[80,89],[90,100]].map(r=>A.filter(x=>Number(x.percentage||0)>=r[0]&&Number(x.percentage||0)<=r[1]).length);
    const top=A.slice().sort((a,b)=>Number(b.percentage||0)-Number(a.percentage||0)).slice(0,12);
    const pm=new Map(state.profiles.map(p=>[p.id,p]));
    $("v68Overview").innerHTML=
      '<div class="v68-grid2"><div class="v68-panel"><h4>📌 توزيع الدرجات</h4>'+canvas("v68ScoreDist")+'</div><div class="v68-panel"><h4>🏆 أعلى النتائج</h4><div class="v68-table"><table><tr><th>المتدرب</th><th>الاختبار</th><th>الدرجة</th></tr>'+top.map(x=>{const p=pm.get(x.student_id)||{};return '<tr><td>'+esc(p.full_name||"—")+'</td><td>'+esc(x.trainer_exams?.title||"—")+'</td><td class="v68-good">'+Number(x.percentage||0)+'%</td></tr>';}).join("")+'</table></div></div></div>'+
      '<div class="v68-panel"><h4>⚠️ نتائج أقل من 60%</h4><div class="v68-table"><table><tr><th>المتدرب</th><th>الشعبة</th><th>الاختبار</th><th>الدرجة</th><th>التاريخ</th></tr>'+A.filter(x=>Number(x.percentage||0)<60).sort((a,b)=>Number(a.percentage||0)-Number(b.percentage||0)).slice(0,30).map(x=>{const p=pm.get(x.student_id)||{};return '<tr class="v68-risk-row"><td>'+esc(p.full_name||"—")+'</td><td>'+esc(p.group_name||"—")+'</td><td>'+esc(x.trainer_exams?.title||"—")+'</td><td class="v68-bad">'+Number(x.percentage||0)+'%</td><td>'+new Date(x.submitted_at||x.created_at).toLocaleDateString("ar-SA")+'</td></tr>';}).join("")+'</table></div></div>'+
      '<details class="v68-details v68-panel"><summary>📦 ملخص نشاط المقرر</summary><div id="v68CourseBox" style="margin-top:12px"></div></details>';
    chart("v68ScoreDist","bar",["0–39","40–59","60–69","70–79","80–89","90–100"],[{label:"عدد المحاولات",data:byScore}],{scales:{y:{beginAtZero:true,ticks:{precision:0}}}});
    renderCourseSummary();
  }

  async function renderCourseSummary(){
    const box=$("v68CourseBox");if(!box)return;
    const total=state.lessons.filter(x=>x.is_active!==false).length;
    const done=state.progress.filter(x=>x.completed).length;
    const practiceDone=state.progress.filter(x=>x.practice_completed).length;
    const users=new Set(state.progress.map(x=>x.user_id)).size;
    const avgCompletion=users&&total?Math.round(done/(users*total)*100):0;
    box.innerHTML='<div class="v68-kpis">'+kp("الدروس",total,"نشطة")+kp("حالات إكمال الدروس",done,"كل المتدربين")+kp("حالات إكمال التمارين",practiceDone,"كل المتدربين")+kp("متوسط إكمال المقرر",avgCompletion+"%","تقديري حسب السجل")+'</div>';
  }

  function renderStudents(D){
    const pm=new Map(state.profiles.map(p=>[p.id,p]));
    const m=new Map();
    D.A.forEach(x=>{const o=m.get(x.student_id)||{id:x.student_id,exam:[],practice:[]};o.exam.push(Number(x.percentage||0));m.set(x.student_id,o);});
    D.E.forEach(x=>{const o=m.get(x.student_id)||{id:x.student_id,exam:[],practice:[]};o.practice.push(Number(x.score||0));m.set(x.student_id,o);});
    const rows=[...m.values()].map(o=>{const p=pm.get(o.id)||{};const eAvg=o.exam.length?Math.round(o.exam.reduce((a,b)=>a+b,0)/o.exam.length):null;const best=o.exam.length?Math.max(...o.exam):null;return{p,examCount:o.exam.length,practiceCount:o.practice.length,avg:eAvg,best,practice:o.practice.length?Math.round(o.practice.reduce((a,b)=>a+b,0)/o.practice.length):null};}).sort((a,b)=>(a.avg??-1)-(b.avg??-1));
    $("v68Students").innerHTML='<div class="v68-panel"><h4>👥 ترتيب المتدربين</h4><div class="v68-mini">مرتبة من الأقل إلى الأعلى لتسهيل اكتشاف الحالات التي تحتاج تدخلًا.</div><div class="v68-table" style="margin-top:10px"><table><tr><th>المتدرب</th><th>الشعبة</th><th>الاختبارات</th><th>متوسط</th><th>أفضل</th><th>التمارين</th></tr>'+rows.slice(0,100).map(o=>'<tr class="'+((o.avg??100)<60?"v68-risk-row":"")+'"><td><b>'+esc(o.p.full_name||"—")+'</b><div class="v68-mini">'+esc(o.p.student_id||"")+'</div></td><td>'+esc(o.p.group_name||"—")+'</td><td>'+o.examCount+'</td><td>'+(o.avg==null?"—":(o.avg+"%"))+'</td><td>'+(o.best==null?"—":(o.best+"%"))+'</td><td>'+(o.practice==null?"—":(o.practice+"%"))+'</td></tr>').join("")+'</table></div></div>';
  }

  function renderGroups(D){
    const pm=new Map(state.profiles.map(p=>[p.id,p])),m=new Map();
    D.A.forEach(x=>{const g=(x.trainer_exams?.group_name||pm.get(x.student_id)?.group_name||"غير محدد");const o=m.get(g)||{n:0,sum:0,pass:0};o.n++;o.sum+=Number(x.percentage||0);if(Number(x.percentage||0)>=60)o.pass++;m.set(g,o);});
    const rows=[...m.entries()].map(([g,o])=>({g,n:o.n,avg:Math.round(o.sum/o.n),pass:Math.round(o.pass/o.n*100)})).sort((a,b)=>b.avg-a.avg);
    $("v68Groups").innerHTML='<div class="v68-panel"><h4>🏫 مقارنة الشعب</h4><div class="v68-table"><table><tr><th>الشعبة</th><th>المحاولات</th><th>المتوسط</th><th>نسبة النجاح</th><th>التقييم</th></tr>'+rows.map(x=>'<tr><td>'+esc(x.g)+'</td><td>'+x.n+'</td><td>'+x.avg+'%</td><td>'+x.pass+'%</td><td>'+(x.avg>=80?'<span class="v68-pill v68-success">قوية</span>':x.avg>=60?'<span class="v68-pill">متوسطة</span>':'<span class="v68-pill v68-danger">تحتاج تدخل</span>')+'</td></tr>').join("")+'</table></div></div><div class="v68-panel"><h4>📊 مقارنة الأداء</h4>'+canvas("v68GroupsChart")+'</div>';
    chart("v68GroupsChart","bar",rows.map(x=>x.g),[{label:"المتوسط %",data:rows.map(x=>x.avg)},{label:"النجاح %",data:rows.map(x=>x.pass)}],{scales:{y:{beginAtZero:true,max:100}}});
  }

  function renderTopics(D){
    const m=new Map();
    D.A.forEach(x=>{const t=x.trainer_exams?.topic||"غير مصنف";const o=m.get(t)||{n:0,sum:0,pass:0};o.n++;o.sum+=Number(x.percentage||0);if(Number(x.percentage||0)>=60)o.pass++;m.set(t,o);});
    const rows=[...m.entries()].map(([t,o])=>({t,n:o.n,avg:Math.round(o.sum/o.n),pass:Math.round(o.pass/o.n*100)})).sort((a,b)=>a.avg-b.avg);
    $("v68Topics").innerHTML='<div class="v68-panel"><h4>📚 أداء الموضوعات</h4><div class="v68-table"><table><tr><th>الموضوع</th><th>المحاولات</th><th>المتوسط</th><th>النجاح</th><th>الأولوية</th></tr>'+rows.map(x=>'<tr><td>'+esc(x.t)+'</td><td>'+x.n+'</td><td>'+x.avg+'%</td><td>'+x.pass+'%</td><td>'+(x.avg<60?'<span class="v68-pill v68-danger">أولوية عالية</span>':x.avg<75?'<span class="v68-pill">مراجعة</span>':'<span class="v68-pill v68-success">مستقر</span>')+'</td></tr>').join("")+'</table></div></div><div class="v68-panel"><h4>📈 المتوسط حسب الموضوع</h4>'+canvas("v68TopicsChart")+'</div>';
    chart("v68TopicsChart","bar",rows.map(x=>x.t),[{label:"المتوسط %",data:rows.map(x=>x.avg)}],{scales:{y:{beginAtZero:true,max:100}}});
  }

  function renderQuestions(D){
    const qm=new Map(state.questions.map(q=>[q.id,q])),m=new Map();
    state.answers.forEach(a=>{
      const attempt=state.attempts.find(t=>t.id===a.attempt_id);if(!attempt||!inDate(attempt.submitted_at||attempt.created_at,D.f))return;
      const q=qm.get(a.question_id)||{};const o=m.get(a.question_id)||{text:q.question_text||"سؤال",topic:q.topic||"غير مصنف",difficulty:q.difficulty||"—",n:0,wrong:0};
      o.n++;if(!a.is_correct)o.wrong++;m.set(a.question_id,o);
    });
    const rows=[...m.values()].map(o=>({...o,error:o.n?Math.round(o.wrong/o.n*100):0})).sort((a,b)=>b.error-a.error);
    $("v68Questions").innerHTML='<div class="v68-panel"><h4>🧠 تحليل جودة الأسئلة ونقاط الضعف</h4><div class="v68-note">هذه القائمة تساعد المدرب على اكتشاف سؤال صعب جدًا أو موضوع يسبب أخطاء متكررة.</div><div class="v68-table" style="margin-top:10px"><table><tr><th>#</th><th>السؤال</th><th>الموضوع</th><th>المستوى</th><th>محاولات</th><th>أخطاء</th><th>نسبة الخطأ</th></tr>'+rows.slice(0,50).map((x,i)=>'<tr class="'+(x.error>=70?"v68-risk-row":"")+'"><td>'+(i+1)+'</td><td style="text-align:right">'+esc(x.text)+'</td><td>'+esc(x.topic)+'</td><td>'+esc(x.difficulty)+'</td><td>'+x.n+'</td><td>'+x.wrong+'</td><td>'+(x.error>=70?'<b class="v68-bad">'+x.error+'%</b>':x.error+'%')+'</td></tr>').join("")+'</table></div></div>'+canvas("v68QuestionChart");
    chart("v68QuestionChart","bar",rows.slice(0,15).map((x,i)=>"س"+(i+1)),[{label:"نسبة الخطأ %",data:rows.slice(0,15).map(x=>x.error)}],{indexAxis:"y",scales:{x:{beginAtZero:true,max:100}}});
  }

  function renderTrend(D){
    const days=new Map();
    D.A.forEach(x=>{const k=(x.submitted_at||x.created_at).slice(0,10);const o=days.get(k)||{n:0,sum:0,pass:0};o.n++;o.sum+=Number(x.percentage||0);if(Number(x.percentage||0)>=60)o.pass++;days.set(k,o);});
    const rows=[...days.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
    $("v68Trend").innerHTML='<div class="v68-grid2"><div class="v68-panel"><h4>📈 عدد المحاولات يوميًا</h4>'+canvas("v68TrendAttempts")+'</div><div class="v68-panel"><h4>🎯 متوسط الدرجات يوميًا</h4>'+canvas("v68TrendAvg")+'</div></div><div class="v68-panel"><h4>🕒 أحدث النشاطات</h4><div class="v68-table"><table><tr><th>التاريخ</th><th>المحاولات</th><th>المتوسط</th><th>النجاح</th></tr>'+rows.slice(-60).reverse().map(([d,o])=>'<tr><td>'+d+'</td><td>'+o.n+'</td><td>'+Math.round(o.sum/o.n)+'%</td><td>'+Math.round(o.pass/o.n*100)+'%</td></tr>').join("")+'</table></div></div>';
    chart("v68TrendAttempts","line",rows.map(x=>x[0]),[{label:"المحاولات",data:rows.map(x=>x[1].n)}],{});
    chart("v68TrendAvg","line",rows.map(x=>x[0]),[{label:"المتوسط %",data:rows.map(x=>Math.round(x[1].sum/x[1].n))}],{scales:{y:{beginAtZero:true,max:100}}});
  }

  function renderAll(){
    if(!state.attempts.length&&!state.exercise.length){ $("v68Kpis").innerHTML='<div class="v68-note">لا توجد بيانات كافية بعد.</div>'; return; }
    const D=filtered();state.filters=D.f;renderKpis(D);renderOverview(D);renderStudents(D);renderGroups(D);renderTopics(D);renderQuestions(D);renderTrend(D);
  }

  async function refresh(){
    if(!roleOK())return;
    styles();setup();
    $("v68Kpis").innerHTML='<div class="v68-note">⏳ جارٍ تحميل كمية البيانات...</div>';
    try{await loadData();populate();renderAll();$("v68Status")?.remove();}catch(e){
      $("v68Kpis").innerHTML='<div class="bad">❌ تعذر تحميل مركز التحليلات V68: '+esc(e?.message||String(e))+'</div>';
    }
  }

  function exportCSV(){
    const D=filtered(),pm=new Map(state.profiles.map(p=>[p.id,p]));
    const rows=[["نوع النشاط","المتدرب","رقم المتدرب","الشعبة","العنوان","الموضوع","الدرجة","التاريخ"]];
    D.A.forEach(x=>{const p=pm.get(x.student_id)||{};rows.push(["اختبار",p.full_name||"",p.student_id||"",p.group_name||"",x.trainer_exams?.title||"",x.trainer_exams?.topic||"",x.percentage||0,x.submitted_at||""]);});
    D.E.forEach(x=>{const p=pm.get(x.student_id)||{};rows.push(["تمرين",p.full_name||"",p.student_id||"",p.group_name||"","تمرين Subnetting","",x.score||0,x.created_at||""]);});
    const csv="\ufeff"+rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="trainer_v68_analytics.csv";a.click();
  }

  async function hook(){
    if(!roleOK())return;
    styles();setup();
    if(typeof window.trainerTab==="function"&&!window.trainerTab.__v68){
      const old=window.trainerTab;
      const wrap=function(tab,btn){const r=old.apply(this,arguments);if(tab==="analytics")setTimeout(refresh,150);return r;};
      wrap.__v68=true;window.trainerTab=wrap;
    }
    if(typeof window.loadTrainerAnalytics==="function"&&!window.loadTrainerAnalytics.__v68){
      const old=window.loadTrainerAnalytics;
      const wrap=async function(){const r=await old.apply(this,arguments);setTimeout(refresh,150);return r;};
      wrap.__v68=true;window.loadTrainerAnalytics=wrap;
    }
  }
  window.v68RefreshAnalytics=refresh;
  window.addEventListener("DOMContentLoaded",()=>setTimeout(hook,700));
  setTimeout(hook,1500);
})();