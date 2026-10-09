import {getExamAttempts} from "./exam-v23.js?v=470";
import {fetchCentralTrainerExamResults,fetchCentralExamResultDetail} from "./supabase-v30.js?v=470";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function localAttempts(){
  try{return getExamAttempts("").map(x=>({
    id:String(x.id||""),
    examId:"",
    title:x.exam||"اختبار",
    courseId:"",
    studentId:x.studentId||"",
    studentName:x.studentName||"متدرب",
    studentCode:"",
    groupNo:x.group||"",
    attemptNo:Number(x.attemptNo||1),
    status:"submitted",
    score:Number(x.score||0),
    total:Number(x.total||0),
    percent:Number(x.percent||0),
    passed:x.passed===true,
    durationSec:Number(x.durationSec||0),
    autoSubmitted:x.autoSubmitted===true,
    startedAt:null,
    submittedAt:x.submittedAt?new Date(x.submittedAt).toISOString():null,
    resultsPublished:true
  }));
  }catch{return []}
}

let cache=[];

function dateText(ts){
  try{return ts?new Date(ts).toLocaleString("ar-SA",{dateStyle:"short",timeStyle:"short"}):"—"}catch{return "—"}
}
function durationText(sec){
  sec=Math.max(0,Number(sec||0));
  return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");
}
function unique(list,key){
  return [...new Set(list.map(x=>String(x?.[key]??"")).filter(Boolean))];
}
function statusLabel(x){
  if(x.status==="in_progress")return '<span class="badge orange">قيد التنفيذ</span>';
  if(x.passed)return '<span class="badge green">ناجح</span>';
  return '<span class="badge red">يحتاج مراجعة</span>';
}

export async function resultsCenterView(){
  const remote=await fetchCentralTrainerExamResults({}).catch(()=>({ok:false}));
  const central=remote?.ok?remote.rows:[];
  cache=central.length?central:localAttempts();

  const list=cache;
  const submitted=list.filter(x=>x.status==="submitted");
  const passed=submitted.filter(x=>x.passed).length;
  const avg=submitted.length?Math.round(submitted.reduce((s,x)=>s+Number(x.percent||0),0)/submitted.length):0;
  const students=new Set(list.map(x=>x.studentId).filter(Boolean)).size;
  const exams=new Set(list.map(x=>x.examId||x.title)).size;
  const examOptions=unique(list,"title").sort().map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");
  const groupOptions=unique(list,"groupNo").sort().map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");

  const rows=list.map(x=>{
    const dataStatus=x.status==="submitted"?(x.passed?"passed":"review"):"inprogress";
    return '<tr data-results-row data-student="'+esc(x.studentName||"")+'" data-exam="'+esc(x.title||"")+'" data-status="'+dataStatus+'" data-group="'+esc(x.groupNo||"")+'">'+
      '<td><strong>'+esc(x.studentName||"—")+'</strong><small class="muted">'+esc(x.studentCode||"")+'</small></td>'+
      '<td>'+esc(x.groupNo||"—")+'</td>'+
      '<td><small>'+esc(x.title||"—")+'</small></td>'+
      '<td><strong class="exam-score-value">'+Number(x.percent||0)+'%</strong><small class="muted">'+Number(x.score||0)+' / '+Number(x.total||0)+'</small></td>'+
      '<td>'+statusLabel(x)+'</td>'+
      '<td>'+Number(x.attemptNo||1)+'</td>'+
      '<td>'+durationText(x.durationSec)+'</td>'+
      '<td><small>'+dateText(x.submittedAt)+'</small></td>'+
      '<td><button class="btn btn-soft" data-results-detail="'+esc(x.id)+'">التفاصيل</button></td>'+
      '</tr>';
  }).join("");

  const sourceNote=central.length
    ? "البيانات الحالية من Supabase المركزي."
    : "تعذر الوصول إلى النتائج المركزية؛ تم عرض البيانات المحلية المتاحة مؤقتًا.";

  return '<div class="page-intro with-action">'+
    '<div><span class="eyebrow purple">V3.67 • مركز النتائج</span><h2>مركز النتائج المركزي</h2><p>النتيجة الرسمية محفوظة في الخادم، مع تصفية حسب المتدرب والمجموعة والاختبار وعرض تفاصيل المحاولة.</p></div>'+
    '<div class="trainer-exam-head-actions"><span class="badge blue">'+list.length+' محاولة</span><button class="btn btn-soft" data-results-refresh>تحديث النتائج</button><button class="btn btn-soft" data-results-export>تصدير CSV</button></div>'+
  '</div>'+
  '<div class="trainer-results-kpis">'+
    '<div class="card exam-admin-kpi"><span>المحاولات</span><strong>'+list.length+'</strong><small>مركزية</small></div>'+
    '<div class="card exam-admin-kpi success"><span>ناجح</span><strong>'+passed+'</strong><small>'+(submitted.length?Math.round(passed/submitted.length*100):0)+'% من المسلّمة</small></div>'+
    '<div class="card exam-admin-kpi"><span>متوسط النتائج</span><strong>'+avg+'%</strong><small>المحاولات المسلّمة</small></div>'+
    '<div class="card exam-admin-kpi purple"><span>المتدربون</span><strong>'+students+'</strong><small>لهم محاولات</small></div>'+
    '<div class="card exam-admin-kpi warning"><span>الاختبارات</span><strong>'+exams+'</strong><small>ظهرت في السجل</small></div>'+
  '</div>'+
  '<div class="card trainer-results-filter-card"><div class="trainer-results-filters">'+
    '<label>بحث المتدرب<input id="results-search" placeholder="اسم أو رقم المتدرب..."></label>'+
    '<label>الاختبار<select id="results-exam-filter"><option value="">كل الاختبارات</option>'+examOptions+'</select></label>'+
    '<label>الحالة<select id="results-status-filter"><option value="">كل الحالات</option><option value="passed">ناجح</option><option value="review">يحتاج مراجعة</option><option value="inprogress">قيد التنفيذ</option></select></label>'+
    '<label>المجموعة<select id="results-group-filter"><option value="">كل المجموعات</option>'+groupOptions+'</select></label>'+
  '</div></div>'+
  '<div class="card exam-results-table-card"><div class="exam-results-toolbar"><div><strong>'+list.length+' محاولة</strong><span class="muted"> '+sourceNote+'</span></div><span class="badge green">'+passed+' ناجح</span></div>'+
  '<div class="table-scroll"><table class="table exam-results-table trainer-results-table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th><th>المحاولة</th><th>المدة</th><th>التاريخ</th><th></th></tr></thead><tbody>'+
  (rows||'<tr><td colspan="9"><div class="empty">لا توجد نتائج فعلية بعد.</div></td></tr>')+
  '</tbody></table></div></div>'+
  '<div id="results-detail-panel"></div>'+
  '<div class="card trainer-results-note"><strong>V3.67:</strong> التصحيح الرسمي من الخادم، ومركز النتائج يقرأ المحاولات المركزية بدل الاعتماد على بيانات الجهاز المحلي.</div>';
}

export function filterResultsDom(){
  const search=(document.getElementById("results-search")?.value||"").trim().toLowerCase();
  const exam=document.getElementById("results-exam-filter")?.value||"";
  const status=document.getElementById("results-status-filter")?.value||"";
  const group=document.getElementById("results-group-filter")?.value||"";
  document.querySelectorAll("[data-results-row]").forEach(row=>{
    const ok=(search===""||(row.getAttribute("data-student")||"").toLowerCase().includes(search))&&
      (!exam||row.getAttribute("data-exam")===exam)&&
      (!status||row.getAttribute("data-status")===status)&&
      (!group||row.getAttribute("data-group")===group);
    row.style.display=ok?"":"none";
  });
}

export async function showResultDetail(attemptId){
  const panel=document.getElementById("results-detail-panel");
  if(!panel)return;
  panel.innerHTML='<div class="card"><p class="muted">جاري تحميل تفاصيل المحاولة…</p></div>';
  const r=await fetchCentralExamResultDetail(attemptId);
  if(!r.ok){panel.innerHTML='<div class="card" style="border-right:4px solid var(--red)"><strong>تعذر تحميل التفاصيل</strong><p class="muted">'+esc(r.error||r.reason||"خطأ غير معروف")+'</p></div>';return;}
  const d=r.data||{}, a=d.attempt||{};
  const topics=Array.isArray(d.topics)?d.topics:[];
  const answers=Array.isArray(d.answers)?d.answers:[];
  panel.innerHTML=
    '<div class="card" style="margin-top:16px">'+
      '<div class="section-title"><div><span class="eyebrow purple">تفاصيل المحاولة</span><h3>'+esc(a.title||"اختبار")+'</h3></div><button class="btn btn-soft" data-results-detail-close>إغلاق</button></div>'+
      '<div class="trainer-results-kpis" style="margin-top:0">'+
        '<div class="card exam-admin-kpi"><span>النتيجة</span><strong>'+Number(a.percent||0)+'%</strong><small>'+Number(a.score||0)+' / '+Number(a.total||0)+'</small></div>'+
        '<div class="card exam-admin-kpi"><span>الحالة</span><strong style="font-size:20px">'+(a.passed?"ناجح":"مراجعة")+'</strong><small>المحاولة '+Number(a.attemptNo||1)+'</small></div>'+
        '<div class="card exam-admin-kpi"><span>المدة</span><strong style="font-size:20px">'+durationText(a.durationSec)+'</strong><small>'+dateText(a.submittedAt)+'</small></div>'+
      '</div>'+
      '<div class="section-title"><h3>تحليل الموضوعات</h3></div>'+
      '<div class="mastery-grid">'+topics.map(t=>'<div class="mastery-item"><div><strong>'+esc(t.topic||"غير محدد")+'</strong><span class="badge '+(Number(t.percent)<70?"orange":"green")+'">'+Number(t.percent||0)+'%</span></div><div class="progress"><span style="width:'+Math.max(0,Math.min(100,Number(t.percent||0)))+'%"></span></div><small>'+Number(t.correct||0)+' صحيحة من '+Number(t.total||0)+'</small></div>').join("")+'</div>'+
      '<div class="section-title"><h3>تفاصيل الإجابات</h3></div>'+
      '<div class="table-scroll"><table class="table trainer-results-table"><thead><tr><th>#</th><th>السؤال</th><th>الموضوع</th><th>الإجابة</th><th>الصحيح</th></tr></thead><tbody>'+
        answers.map(x=>'<tr><td>'+Number(x.questionOrder||0)+'</td><td>'+esc(x.question||"سؤال")+'</td><td>'+esc(x.topic||"")+'</td><td>'+esc(JSON.stringify(x.selected))+'</td><td><span class="badge '+(x.isCorrect?"green":"red")+'">'+(x.isCorrect?"صحيح":"خطأ")+'</span></td></tr>').join("")+
      '</tbody></table></div>'+
    '</div>';
  panel.querySelector("[data-results-detail-close]")?.addEventListener("click",function(){
    panel.innerHTML="";
  });

}

export async function handleResultsDetailClick(btn){
  if(btn.hasAttribute("data-results-detail")){
    await showResultDetail(btn.getAttribute("data-results-detail")||"");
    return {rerender:false};
  }
  if(btn.hasAttribute("data-results-detail-close")){
    const panel=document.getElementById("results-detail-panel");
    if(panel)panel.innerHTML="";
    return {rerender:false};
  }
  if(btn.hasAttribute("data-results-refresh"))return {rerender:true};
  return null;
}

export function getResultsCsv(){
  const rows=(cache||[]).map(x=>[x.studentName||"",x.studentCode||"",x.groupNo||"",x.title||"",x.percent||0,x.passed?"ناجح":x.status==="in_progress"?"قيد التنفيذ":"يحتاج مراجعة",x.attemptNo||1,x.durationSec||0,dateText(x.submittedAt)]);
  return [["المتدرب","رقم المتدرب","المجموعة","الاختبار","النتيجة","الحالة","المحاولة","المدة بالثواني","التاريخ"],...rows].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n");
}
