import {getQuestionAnalytics} from "./exam-v23.js?v=434";
import {getQuestionBankStats} from "./question-bank-v32.js?v=434";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function levelLabel(d){return d==="hard"?"متقدم":d==="medium"?"متوسط":"سهل"}
function intelligence(x){
  const uses=Number(x.total||0),acc=Number(x.accuracy||0);
  const wrongRatio=uses?Math.round((x.wrong||0)/uses*100):0;
  let status="مستقر",cls="green",recommendation="أبقِ السؤال مع متابعة الأداء.";
  if(uses<3){status="بيانات قليلة";cls="blue";recommendation="اجمع محاولات إضافية قبل اتخاذ قرار نهائي."}
  else if(acc<40){status="حرج";cls="red";recommendation="راجع صياغة السؤال والخيارات والتفسير."}
  else if(acc<60){status="يحتاج مراجعة";cls="orange";recommendation="راجع المشتتات وحدد سبب الخطأ الأكثر تكرارًا."}
  else if(acc<75){status="مراقبة";cls="purple";recommendation="تابع أداء السؤال مع زيادة حجم البيانات."}
  else if(acc>=90&&uses>=5){status="سهل جدًا";cls="blue";recommendation="تحقق من أن مستوى السؤال يتوافق مع الهدف التدريبي."}
  return {status,cls,recommendation,wrongRatio,score:Math.max(0,Math.min(100,Math.round(acc*0.75+Math.min(uses,10)*2.5)))};
}
export function questionIntelligenceView(){
  const analytics=getQuestionAnalytics("");
  const bank=getQuestionBankStats();
  const rows=analytics.map(x=>{
    const iq=intelligence(x);
    const wrongOptions=(x.options||[]).filter(o=>Number(o.count)>0&&Number(o.index)!==Number(x.correctAnswer)).sort((a,b)=>b.count-a.count);
    const topWrong=wrongOptions[0];
    return {x,iq,topWrong};
  });
  const critical=rows.filter(r=>r.iq.status==="حرج").length;
  const review=rows.filter(r=>r.iq.status==="يحتاج مراجعة").length;
  const lowData=rows.filter(r=>r.iq.status==="بيانات قليلة").length;
  const easy=rows.filter(r=>r.iq.status==="سهل جدًا").length;
  return '<div class="page-intro with-action"><div><span class="eyebrow purple">V3.35 • ذكاء السؤال</span><h2>ذكاء بنك الأسئلة</h2><p>حوّل إحصائيات كل سؤال إلى قرار: إبقاء، مراقبة، مراجعة أو إعادة صياغة.</p></div><div class="trainer-exam-head-actions"><span class="badge purple">'+rows.length+' سؤال</span><button class="btn btn-soft" data-qintel-export>تصدير التحليل</button></div></div>'+
  '<div class="qintel-kpis"><div class="card exam-admin-kpi"><span>حرج</span><strong>'+critical+'</strong><small>أقل من 40%</small></div><div class="card exam-admin-kpi warning"><span>يحتاج مراجعة</span><strong>'+review+'</strong><small>40–59%</small></div><div class="card exam-admin-kpi"><span>بيانات قليلة</span><strong>'+lowData+'</strong><small>أقل من 3 محاولات</small></div><div class="card exam-admin-kpi purple"><span>سهل جدًا</span><strong>'+easy+'</strong><small>90% فأعلى</small></div><div class="card exam-admin-kpi success"><span>أسئلة البنك</span><strong>'+bank.active+'</strong><small>نشطة من '+bank.total+'</small></div></div>'+
  '<div class="card qintel-note"><strong>كيف يعمل المؤشر؟</strong><p>هذا مؤشر قرار تدريبي وليس اختبارًا إحصائيًا معياريًا. يعتمد على دقة السؤال، عدد المحاولات، ونمط الإجابات الخاطئة لتحديد الإجراء المقترح.</p></div>'+
  '<div class="card qintel-filter-card"><div class="trainer-results-filters"><label>حالة السؤال<select id="qintel-status-filter"><option value="">الكل</option><option value="critical">حرج</option><option value="review">يحتاج مراجعة</option><option value="lowdata">بيانات قليلة</option><option value="monitor">مراقبة</option><option value="easy">سهل جدًا</option><option value="stable">مستقر</option></select></label><label>الموضوع<select id="qintel-topic-filter"><option value="">كل الموضوعات</option>'+[...new Set(rows.map(r=>r.x.topic))].map(t=>'<option>'+esc(t)+'</option>').join("")+'</select></label><label>الصعوبة<select id="qintel-difficulty-filter"><option value="">كل المستويات</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">متقدم</option></select></label></div></div>'+
  '<div class="card question-intelligence-table"><div class="table-scroll"><table class="table"><thead><tr><th>السؤال</th><th>الموضوع</th><th>المستوى</th><th>المحاولات</th><th>الدقة</th><th>أكثر خطأ</th><th>حالة الذكاء</th><th>التوصية</th></tr></thead><tbody>'+
  rows.map(r=>'<tr data-qintel-row data-status="'+(r.iq.status==="حرج"?"critical":r.iq.status==="يحتاج مراجعة"?"review":r.iq.status==="بيانات قليلة"?"lowdata":r.iq.status==="مراقبة"?"monitor":r.iq.status==="سهل جدًا"?"easy":"stable")+'" data-topic="'+esc(r.x.topic)+'" data-difficulty="'+esc(r.x.difficulty)+'"><td><strong>#'+r.x.id+'</strong><div class="question-analytics-q">'+esc(r.x.question)+'</div></td><td>'+esc(r.x.topic)+'</td><td><span class="badge '+(r.x.difficulty==="hard"?"red":r.x.difficulty==="medium"?"orange":"green")+'">'+levelLabel(r.x.difficulty)+'</span></td><td>'+r.x.total+'</td><td><strong class="question-accuracy">'+r.x.accuracy+'%</strong><div class="progress"><span style="width:'+r.x.accuracy+'%"></span></div></td><td>'+ (r.topWrong?esc(r.topWrong.text):"—") +'</td><td><span class="badge '+r.iq.cls+'">'+r.iq.status+'</span></td><td><small>'+esc(r.iq.recommendation)+'</small></td></tr>').join("")+
  '</tbody></table></div></div>'+
  '<div class="grid-2 qintel-bottom"><div class="card"><h3>أسئلة تستحق تدخلًا</h3>'+rows.filter(r=>r.iq.status==="حرج"||r.iq.status==="يحتاج مراجعة").slice(0,6).map(r=>'<div class="stat-row"><span>#'+r.x.id+' • '+esc(r.x.topic)+'</span><b>'+r.x.accuracy+'%</b></div>').join("")||'<div class="empty">لا توجد أسئلة حرجة حاليًا.</div>'+'</div><div class="card"><h3>قرار الجودة</h3><p class="muted">راجع الأسئلة الحرجة أولًا، ثم الأسئلة سهلة جدًا، وبعدها الأسئلة التي لا تزال بياناتها قليلة.</p><div class="smart-rule"><strong>الهدف</strong><p>السؤال الجيد يقيس المهارة المقصودة ويميز مستوى المتدربين بدل أن يكون مجرد سؤال سهل أو غامض.</p></div></div></div>';
}
export function filterQuestionIntelligence(){
  const status=document.getElementById("qintel-status-filter")?.value||"";
  const topic=document.getElementById("qintel-topic-filter")?.value||"";
  const diff=document.getElementById("qintel-difficulty-filter")?.value||"";
  document.querySelectorAll("[data-qintel-row]").forEach(row=>{
    const ok=(!status||row.getAttribute("data-status")===status)&&(!topic||row.getAttribute("data-topic")===topic)&&(!diff||row.getAttribute("data-difficulty")===diff);
    row.style.display=ok?"":"none";
  });
}
export function getQuestionIntelligenceJson(){
  return JSON.stringify(getQuestionAnalytics("").map(x=>({id:x.id,question:x.question,topic:x.topic,difficulty:x.difficulty,attempts:x.total,accuracy:x.accuracy,correct:x.correct,wrong:x.wrong,unanswered:x.unanswered,options:x.options,intelligence:intelligence(x)})),null,2);
}
