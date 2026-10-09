import {fetchCentralTrainerExamResults,fetchCentralExamResultDetail,fetchTrainerResultsSummary,fetchTrainerLiveExamMonitor} from "./supabase-v30.js?v=481";

let resultRows=[];
let dashboard={summary:{},exams:[],groups:[],students:[],recent:[]};
let liveTimer=null;
let liveData={activeCount:0,attempts:[],finalizedExpired:0,generatedAt:null};

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const dateText=ts=>{try{return ts?new Date(ts).toLocaleString("ar-SA",{dateStyle:"short",timeStyle:"short"}):"—"}catch{return "—"}};
const durationText=sec=>{sec=Math.max(0,Number(sec||0));return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")};
const badge=x=>x.passed?'<span class="badge green">ناجح</span>':'<span class="badge red">غير مجتاز</span>';

function kpi(title,value,sub,tone=""){
  return '<div class="card exam-admin-kpi '+tone+'"><span>'+esc(title)+'</span><strong>'+esc(value)+'</strong><small>'+esc(sub)+'</small></div>';
}

function summaryCards(s){
  const total=Number(s.total_attempts||0), submitted=Number(s.submitted_attempts||0), passed=Number(s.passed_attempts||0);
  const passRate=submitted?Math.round(passed/submitted*100):0;
  return '<div class="trainer-results-kpis">'+
    kpi("كل المحاولات",total,"مركزية")+
    kpi("المحاولات المسلّمة",submitted,"نتائج رسمية","purple")+
    kpi("متوسط الدرجات",Number(s.avg_percent||0)+"%","المحاولات المسلّمة","success")+
    kpi("نسبة الاجتياز",passRate+"%",passed+" من "+submitted,"success")+
    kpi("المتدربون",Number(s.students||0),"لهم نتائج")+
    kpi("الاختبارات",Number(s.exams||0),"في السجل")+
    '</div>';
}

function liveMonitorMarkup(data=liveData){
  const items=Array.isArray(data.attempts)?data.attempts:[];
  if(!items.length){
    return '<div class="card live-exam-empty"><div><span class="eyebrow green">المراقبة الحية</span><h3>لا توجد اختبارات قيد التنفيذ</h3><p class="muted">عند بدء متدرب للاختبار سيظهر هنا الوقت المتبقي وحالة الإجابات مباشرة.</p></div><span class="badge green">جاهز</span></div>';
  }
  return '<div class="card live-exam-monitor-card" id="results-live-monitor">'+
    '<div class="section-title"><div><span class="eyebrow orange">V3.80 • Live Monitoring</span><h3>الاختبارات قيد التنفيذ</h3><span class="muted">تحديث تلقائي كل 10 ثوانٍ</span></div><div class="trainer-exam-head-actions"><span class="badge orange">'+items.length+' قيد التنفيذ</span><button class="btn btn-soft mini-btn" data-live-refresh>تحديث الآن</button></div></div>'+
    '<div class="live-exam-list">'+items.map(function(x){
      const left=Math.max(0,Number(x.remainingSeconds||0));
      const total=Math.max(1,Number(x.durationMinutes||1)*60);
      const pct=Math.max(0,Math.min(100,Math.round(left/total*100)));
      const answered=Number(x.answeredCount||0), totalQ=Number(x.questionCount||0);
      return '<div class="live-exam-row">'+
        '<div class="live-exam-main"><div><strong>'+esc(x.studentName||"متدرب")+'</strong><small>'+esc(x.studentCode||"")+' • المجموعة '+esc(x.groupNo||"—")+'</small></div><span class="badge purple">'+esc(x.title||"اختبار")+'</span></div>'+
        '<div class="live-exam-meta"><span>المحاولة '+Number(x.attemptNo||1)+'</span><span>أجاب '+answered+'/'+totalQ+'</span><span>بدأ '+dateText(x.startedAt)+'</span><strong class="'+(left<=60?"live-danger":"")+'">'+durationText(left)+'</strong></div>'+
        '<div class="progress live-exam-progress"><span style="width:'+pct+'%"></span></div>'+
        '</div>';
    }).join("")+'</div></div>';
}

async function refreshLiveMonitor(){
  const r=await fetchTrainerLiveExamMonitor().catch(()=>({ok:false}));
  if(!r.ok)return;
  liveData=r.payload||{activeCount:0,attempts:[],finalizedExpired:0,generatedAt:null};
  const host=document.getElementById("results-live-monitor-host");
  if(host)host.innerHTML=liveMonitorMarkup(liveData);
}

function startLiveMonitor(){
  if(liveTimer)clearInterval(liveTimer);
  liveTimer=setInterval(function(){
    if(!document.getElementById("results-live-monitor-host")){
      clearInterval(liveTimer);liveTimer=null;return;
    }
    refreshLiveMonitor().catch(()=>{});
  },10000);
}

function examTable(){
  const rows=dashboard.exams.map(x=>
    '<tr data-v76-exam-row data-exam-name="'+esc(x.title||"")+'">'+
    '<td><strong>'+esc(x.title||"اختبار")+'</strong><small class="muted">'+Number(x.questionCount||0)+' سؤال</small></td>'+
    '<td>'+Number(x.attempts||0)+'</td><td>'+Number(x.avgPercent||0)+'%</td>'+
    '<td>'+Number(x.passRate||0)+'%</td><td>'+dateText(x.lastSubmission)+'</td></tr>').join("");
  return '<div class="card"><div class="section-title"><div><h3>تحليل الاختبارات</h3><span class="muted">متوسط النتيجة ونسبة الاجتياز لكل اختبار</span></div><span class="badge purple">'+dashboard.exams.length+' اختبار</span></div>'+
  '<div class="table-scroll"><table class="table trainer-results-table"><thead><tr><th>الاختبار</th><th>المحاولات</th><th>المتوسط</th><th>الاجتياز</th><th>آخر نتيجة</th></tr></thead><tbody>'+
  (rows||'<tr><td colspan="5"><div class="empty">لا توجد نتائج اختبارات بعد.</div></td></tr>')+'</tbody></table></div></div>';
}

function groupCards(){
  if(!dashboard.groups.length)return '<div class="card empty">لا توجد مجموعات لها نتائج مركزية حتى الآن.</div>';
  return '<div class="grid-3">'+dashboard.groups.map(g=>
    '<div class="card"><div class="section-title"><div><span class="eyebrow blue">المجموعة</span><h3>'+esc(g.groupNo||"—")+'</h3></div><span class="badge">'+Number(g.students||0)+' متدرب</span></div>'+
    '<div class="stat-row"><span>المتوسط</span><strong>'+Number(g.avgPercent||0)+'%</strong></div>'+
    '<div class="progress"><span style="width:'+Number(g.avgPercent||0)+'%"></span></div>'+
    '<div class="stat-row"><span>نسبة الاجتياز</span><strong>'+Number(g.passRate||0)+'%</strong></div>'+
    '<div class="stat-row"><span>المحاولات</span><strong>'+Number(g.attempts||0)+'</strong></div></div>').join("")+'</div>';
}

function studentTable(){
  const rows=dashboard.students.map(s=>
    '<tr data-v76-student-row data-student-text="'+esc([s.name,s.studentCode,s.groupNo].join(" "))+'">'+
    '<td><strong>'+esc(s.name||"متدرب")+'</strong><small class="muted">'+esc(s.studentCode||"")+" • المجموعة "+esc(s.groupNo||"—")+'</small></td>'+
    '<td>'+Number(s.attempts||0)+'</td><td><strong>'+Number(s.avgPercent||0)+'%</strong></td>'+
    '<td>'+Number(s.bestPercent||0)+'%</td><td>'+Number(s.passed||0)+'</td>'+
    '<td><small>'+dateText(s.lastSubmission)+'</small></td>'+
    '<td><button class="btn btn-soft mini-btn" data-student-id="'+esc(s.studentId||"")+'">Student 360</button></td></tr>').join("");
  return '<div class="card"><div class="section-title"><div><h3>ملخص المتدربين</h3><span class="muted">مرتبط مباشرة بملفات profiles وStudent 360</span></div><span class="badge blue">'+dashboard.students.length+' متدرب</span></div>'+
  '<div class="trainer-student-toolbar" style="margin:0 0 12px"><div class="trainer-student-search"><label>بحث</label><input id="v76-student-search" placeholder="اسم أو رقم المتدرب أو المجموعة..."></div></div>'+
  '<div class="table-scroll"><table class="table trainer-table"><thead><tr><th>المتدرب</th><th>المحاولات</th><th>المتوسط</th><th>الأفضل</th><th>النجاح</th><th>آخر نتيجة</th><th></th></tr></thead><tbody>'+
  (rows||'<tr><td colspan="7"><div class="empty">لا توجد نتائج مركزية بعد.</div></td></tr>')+'</tbody></table></div></div>';
}

function recentTable(){
  const rows=dashboard.recent.map(x=>
    '<tr data-v76-recent-row data-v76-recent-search="'+esc([x.studentName,x.studentCode,x.groupNo,x.title].join(" "))+'">'+
    '<td><strong>'+esc(x.studentName||"متدرب")+'</strong><small class="muted">'+esc(x.studentCode||"")+'</small></td>'+
    '<td>'+esc(x.groupNo||"—")+'</td><td>'+esc(x.title||"اختبار")+'</td>'+
    '<td><strong>'+Number(x.percent||0)+'%</strong><small class="muted">'+Number(x.score||0)+' / '+Number(x.total||0)+'</small></td>'+
    '<td>'+badge(x)+'</td><td>'+durationText(x.durationSec)+'</td><td>'+dateText(x.submittedAt)+'</td>'+
    '<td><button class="btn btn-soft mini-btn" data-results-detail="'+esc(x.id||"")+'">التفاصيل</button></td></tr>').join("");
  return '<div class="card"><div class="section-title"><div><h3>آخر النتائج</h3><span class="muted">حتى 30 محاولة مركزية حديثة</span></div><span class="badge green">'+dashboard.recent.length+' نتيجة</span></div>'+
    '<div class="trainer-student-toolbar" style="margin:0 0 12px"><div class="trainer-student-search"><label>بحث النتائج</label><input id="v76-results-search" placeholder="متدرب أو اختبار أو مجموعة..."></div></div>'+
    '<div class="table-scroll"><table class="table trainer-results-table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th><th>المدة</th><th>التاريخ</th><th></th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="8"><div class="empty">لا توجد نتائج فعلية بعد.</div></td></tr>')+'</tbody></table></div></div>';
}

export async function resultsCenterView(){
  const [summaryRes,rowsRes]=await Promise.all([
    fetchTrainerResultsSummary("").catch(()=>({ok:false})),
    fetchCentralTrainerExamResults({}).catch(()=>({ok:false}))
  ]);
  if(!summaryRes.ok && !rowsRes.ok){
    return '<div class="page-intro"><span class="eyebrow red">V3.80 • مركز النتائج</span><h2>تعذر تحميل النتائج المركزية</h2><p>يلزم حساب مدرب أو مدير واتصال Supabase صالح.</p></div><div class="card" style="border-right:4px solid var(--red)"><strong>المصدر المركزي غير متاح</strong><p class="muted">'+esc(summaryRes.error||rowsRes.error||summaryRes.reason||rowsRes.reason||"خطأ غير معروف")+'</p></div>';
  }
  dashboard=summaryRes.ok?summaryRes.payload:{summary:{},exams:[],groups:[],students:[],recent:[]};
  const liveRes=await fetchTrainerLiveExamMonitor().catch(()=>({ok:false}));
  liveData=liveRes.ok?liveRes.payload:{activeCount:0,attempts:[],finalizedExpired:0,generatedAt:null};
  resultRows=rowsRes.ok?rowsRes.rows:[];
  const s=dashboard.summary||{};
  return '<div class="page-intro with-action">'+
    '<div><span class="eyebrow purple">V3.80 • مركز النتائج الموحد</span><h2>مركز النتائج + Student 360</h2><p>النتيجة الرسمية، تحليل الاختبار، مقارنة المجموعات وربط مباشر بملف المتدرب المركزي.</p></div>'+
    '<div class="trainer-exam-head-actions"><span class="badge green">Supabase • مباشر</span><button class="btn btn-soft" data-results-refresh>تحديث</button><button class="btn btn-soft" data-results-export>تصدير CSV</button></div></div>'+
    summaryCards(s)+
    '<div class="section-title"><h3>المراقبة الحية</h3><span class="badge orange">'+Number(dashboard.summary?.in_progress_attempts||0)+' قيد التنفيذ</span></div>'+
    '<div id="results-live-monitor-host">'+liveMonitorMarkup(liveData)+'</div>'+
    '<div class="section-title"><h3>أداء الاختبارات</h3><span class="badge purple">Central Results</span></div>'+
    examTable()+
    '<div class="section-title"><h3>أداء المجموعات</h3><span class="badge blue">'+dashboard.groups.length+' مجموعات</span></div>'+
    groupCards()+
    '<div class="section-title"><h3>أداء المتدربين</h3><span class="badge green">Student 360</span></div>'+
    studentTable()+
    '<div class="section-title"><h3>النشاط الأخير</h3><span class="badge">'+dashboard.recent.length+' نتيجة</span></div>'+
    recentTable()+
    '<div id="results-detail-panel"></div>'+
    '<div class="card trainer-results-note"><strong>V3.80:</strong> النتائج الرسمية تأتي من <code>academy_exam_attempts</code>، وملف Student 360 يعتمد على الهوية المركزية نفسها.</div>';
}

function applySearches(){
  const sq=(document.getElementById("v76-student-search")?.value||"").trim().toLowerCase();
  document.querySelectorAll("[data-v76-student-row]").forEach(row=>{
    row.style.display=!sq||(row.getAttribute("data-student-text")||"").toLowerCase().includes(sq)?"":"none";
  });
  const rq=(document.getElementById("v76-results-search")?.value||"").trim().toLowerCase();
  document.querySelectorAll("[data-v76-recent-row]").forEach(row=>{
    row.style.display=!rq||(row.getAttribute("data-v76-recent-search")||"").toLowerCase().includes(rq)?"":"none";
  });
}

export function bindResultsV76(){
  document.getElementById("v76-student-search")?.addEventListener("input",applySearches);
  document.getElementById("v76-results-search")?.addEventListener("input",applySearches);
}

export async function showResultDetailV76(attemptId){
  const panel=document.getElementById("results-detail-panel");
  if(!panel)return;
  panel.innerHTML='<div class="card"><p class="muted">جاري تحميل تفاصيل المحاولة…</p></div>';
  const r=await fetchCentralExamResultDetail(attemptId);
  if(!r.ok){panel.innerHTML='<div class="card" style="border-right:4px solid var(--red)"><strong>تعذر تحميل التفاصيل</strong><p class="muted">'+esc(r.error||r.reason||"خطأ غير معروف")+'</p></div>';return;}
  const d=r.data||{},a=d.attempt||{},topics=Array.isArray(d.topics)?d.topics:[],answers=Array.isArray(d.answers)?d.answers:[];
  const student=resultRows.find(x=>String(x.id)===String(attemptId));
  const studentId=student?.studentId||"";
  panel.innerHTML='<div class="card" style="margin-top:16px">'+
    '<div class="section-title"><div><span class="eyebrow purple">تفاصيل النتيجة • V3.80</span><h3>'+esc(a.title||"اختبار")+'</h3><p class="muted">'+esc(student?.studentName||"متدرب")+'</p></div><div><button class="btn btn-primary" '+(studentId?'data-student-id="'+esc(studentId)+'"':'disabled')+'>فتح Student 360</button> <button class="btn btn-soft" data-results-detail-close>إغلاق</button></div></div>'+
    '<div class="trainer-results-kpis" style="margin-top:0">'+
    kpi("النتيجة",Number(a.percent||0)+"%",Number(a.score||0)+" / "+Number(a.total||0))+
    kpi("الحالة",a.passed?"ناجح":"غير مجتاز","المحاولة "+Number(a.attemptNo||1),a.passed?"success":"warning")+
    kpi("المدة",durationText(a.durationSec),dateText(a.submittedAt))+
    '</div>'+
    '<div class="section-title"><h3>الأداء حسب الموضوع</h3></div>'+
    '<div class="mastery-grid">'+topics.map(t=>'<div class="mastery-item"><div><strong>'+esc(t.topic||"غير محدد")+'</strong><span class="badge '+(Number(t.percent||0)<50?"red":Number(t.percent||0)<70?"orange":"green")+'">'+Number(t.percent||0)+'%</span></div><div class="progress"><span style="width:'+Math.max(0,Math.min(100,Number(t.percent||0)))+'%"></span></div><small>'+Number(t.correct||0)+' صحيحة من '+Number(t.total||0)+'</small></div>').join("")+'</div>'+
    '<div class="section-title"><h3>تفاصيل الإجابات</h3></div>'+
    '<div class="table-scroll"><table class="table trainer-results-table"><thead><tr><th>#</th><th>السؤال</th><th>الموضوع</th><th>الإجابة</th><th>الصحيح</th></tr></thead><tbody>'+
    answers.map(x=>'<tr><td>'+Number(x.questionOrder||0)+'</td><td>'+esc(x.question||"سؤال")+'</td><td>'+esc(x.topic||"")+'</td><td>'+esc(String(x.selected??"—"))+'</td><td><span class="badge '+(x.isCorrect?"green":"red")+'">'+(x.isCorrect?"صحيح":"خطأ")+'</span></td></tr>').join("")+
    '</tbody></table></div></div>';
}

export async function handleResultsV76Action(btn){
  if(btn.hasAttribute("data-live-refresh")){ await refreshLiveMonitor(); return {rerender:false}; }
  if(btn.hasAttribute("data-results-detail")){
    await showResultDetailV76(btn.getAttribute("data-results-detail")||"");
    return {rerender:false};
  }
  if(btn.hasAttribute("data-results-detail-close")){
    document.getElementById("results-detail-panel")?.replaceChildren();
    return {rerender:false};
  }
  if(btn.hasAttribute("data-results-refresh"))return {rerender:true};
  return null;
}

export function getResultsCsvV76(){
  const rows=dashboard.recent.map(x=>[
    x.studentName||"",x.studentCode||"",x.groupNo||"",x.title||"",x.percent||0,
    x.passed?"ناجح":"غير مجتاز",x.attemptNo||1,x.durationSec||0,dateText(x.submittedAt)
  ]);
  return [["المتدرب","رقم المتدرب","المجموعة","الاختبار","النتيجة","الحالة","المحاولة","المدة بالثواني","التاريخ"],
    ...rows].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n");
}
