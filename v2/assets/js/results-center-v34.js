import {getExamAttempts} from "./exam-v23.js?v=434";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function attempts(){
  return getExamAttempts("");
}
function unique(list,key){
  return [...new Set(list.map(x=>String(x?.[key]??"")).filter(Boolean))];
}
function dateText(ts){
  try{return new Date(ts).toLocaleString("ar-SA",{dateStyle:"short",timeStyle:"short"})}catch{return "—"}
}
export function resultsCenterView(){
  const list=attempts();
  const passed=list.filter(x=>x.passed).length;
  const avg=list.length?Math.round(list.reduce((s,x)=>s+Number(x.percent||0),0)/list.length):0;
  const students=new Set(list.map(x=>x.studentId||x.studentName)).size;
  const exams=new Set(list.map(x=>x.exam)).size;
  const examOptions=unique(list,"exam").map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");
  const groupOptions=unique(list,"group").sort().map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");
  const rows=list.map(x=>{
    const mins=Math.floor((x.durationSec||0)/60),secs=String((x.durationSec||0)%60).padStart(2,"0");
    return '<tr data-results-row data-student="'+esc(x.studentName||"")+'" data-exam="'+esc(x.exam||"")+'" data-status="'+(x.passed?"passed":"review")+'" data-group="'+esc(x.group||"1")+'"><td><strong>'+esc(x.studentName||"—")+'</strong></td><td>'+esc(x.group||"1")+'</td><td><small>'+esc(x.exam||"—")+'</small></td><td><strong class="exam-score-value">'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"يحتاج مراجعة")+'</span></td><td>'+Number(x.attemptNo||1)+'</td><td>'+mins+':'+secs+'</td><td>'+ (x.autoSubmitted?"تلقائي":"يدوي") +'</td><td><small>'+dateText(x.submittedAt)+'</small></td></tr>';
  }).join("");
  return '<div class="page-intro with-action"><div><span class="eyebrow purple">V3.34 • مركز النتائج</span><h2>مركز النتائج الحقيقي</h2><p>جميع المحاولات المسجلة للطلاب مع البحث والتصفية والتصدير.</p></div><div class="trainer-exam-head-actions"><span class="badge blue">'+list.length+' محاولة</span><button class="btn btn-soft" data-results-export>تصدير CSV</button></div></div>'+
  '<div class="trainer-results-kpis"><div class="card exam-admin-kpi"><span>المحاولات</span><strong>'+list.length+'</strong><small>إجمالي التسجيلات</small></div><div class="card exam-admin-kpi success"><span>ناجح</span><strong>'+passed+'</strong><small>'+ (list.length?Math.round(passed/list.length*100):0) +'% من المحاولات</small></div><div class="card exam-admin-kpi"><span>متوسط النتائج</span><strong>'+avg+'%</strong><small>جميع الاختبارات</small></div><div class="card exam-admin-kpi purple"><span>المتدربون</span><strong>'+students+'</strong><small>ظهروا في النتائج</small></div><div class="card exam-admin-kpi warning"><span>الاختبارات</span><strong>'+exams+'</strong><small>لها محاولات مسجلة</small></div></div>'+
  '<div class="card trainer-results-filter-card"><div class="trainer-results-filters"><label>بحث المتدرب<input id="results-search" placeholder="اسم المتدرب..."></label><label>الاختبار<select id="results-exam-filter"><option value="">كل الاختبارات</option>'+examOptions+'</select></label><label>الحالة<select id="results-status-filter"><option value="">كل الحالات</option><option value="passed">ناجح</option><option value="review">يحتاج مراجعة</option></select></label><label>المجموعة<select id="results-group-filter"><option value="">كل المجموعات</option>'+groupOptions+'</select></label></div></div>'+
  '<div class="card exam-results-table-card"><div class="exam-results-toolbar"><div><strong>'+list.length+' محاولة</strong><span class="muted">البيانات الحالية من طبقة النتائج</span></div><span class="badge green">'+passed+' ناجح</span></div><div class="table-scroll"><table class="table exam-results-table trainer-results-table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th><th>المحاولة</th><th>المدة</th><th>التسليم</th><th>التاريخ</th></tr></thead><tbody>'+(rows||'<tr><td colspan="9"><div class="empty">لا توجد نتائج فعلية بعد.</div></td></tr>')+'</tbody></table></div></div>'+
  '<div class="card trainer-results-note"><strong>V3.34:</strong> لا توجد بيانات طلاب تجريبية في هذه الصفحة؛ تظهر المحاولات التي سجلها محرك الاختبار فقط، ومع Supabase تصبح النتائج مشتركة بين الأجهزة.</div>';
}
export function filterResultsDom(){
  const search=(document.getElementById("results-search")?.value||"").trim().toLowerCase();
  const exam=document.getElementById("results-exam-filter")?.value||"";
  const status=document.getElementById("results-status-filter")?.value||"";
  const group=document.getElementById("results-group-filter")?.value||"";
  document.querySelectorAll("[data-results-row]").forEach(row=>{
    const ok=(search===""||(row.getAttribute("data-student")||"").toLowerCase().includes(search))&&(!exam||row.getAttribute("data-exam")===exam)&&(!status||row.getAttribute("data-status")===status)&&(!group||row.getAttribute("data-group")===group);
    row.style.display=ok?"":"none";
  });
}
export function getResultsCsv(){
  const rows=attempts().map(x=>[x.studentName||"",x.group||"",x.exam||"",x.percent||0,x.passed?"ناجح":"يحتاج مراجعة",x.attemptNo||1,x.durationSec||0,x.autoSubmitted?"تلقائي":"يدوي",dateText(x.submittedAt)]);
  return [["المتدرب","المجموعة","الاختبار","النتيجة","الحالة","المحاولة","المدة بالثواني","نوع التسليم","التاريخ"],...rows].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n");
}
