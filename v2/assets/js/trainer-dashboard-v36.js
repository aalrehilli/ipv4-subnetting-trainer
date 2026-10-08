import {getExamAttempts,getQuestionAnalytics} from "./exam-v23.js?v=435";
import {getQuestionBankStats} from "./question-bank-v32.js?v=435";
import {getSupabaseStatus} from "./supabase-v30.js?v=435";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function loadCourses(){
  try{
    const x=JSON.parse(localStorage.getItem("ipv4AcademyV36Courses")||"[]");
    return Array.isArray(x)?x:[];
  }catch{return[]}
}
function dashboardData(){
  const attempts=getExamAttempts("");
  const analytics=getQuestionAnalytics("");
  const bank=getQuestionBankStats();
  const passed=attempts.filter(x=>x.passed).length;
  const avg=attempts.length?Math.round(attempts.reduce((s,x)=>s+Number(x.percent||0),0)/attempts.length):0;
  const students=[...new Map(attempts.map(x=>[String(x.studentId||x.studentName),x])).values()];
  const weakTopics=[...new Map(analytics.filter(x=>x.total>0).reduce((m,x)=>{
    const cur=m.get(x.topic)||{topic:x.topic,total:0,correct:0};
    cur.total+=x.total;cur.correct+=x.correct;m.set(x.topic,cur);return m;
  },new Map()).values()].map(x=>({...x,accuracy:x.total?Math.round(x.correct/x.total*100):0})).sort((a,b)=>a.accuracy-b.accuracy);
  const criticalQuestions=analytics.filter(x=>x.total>=3&&x.accuracy<50).sort((a,b)=>a.accuracy-b.accuracy);
  const latest=attempts.slice(0,5);
  const courses=loadCourses();
  const publishedCourses=courses.filter(x=>x.status==="published");
  const supabase=window.__IPV4_SUPABASE_STATUS__||{configured:false,authenticated:false,message:"Supabase غير مهيأ"};
  return {attempts,passed,avg,students,analytics,bank,weakTopics,criticalQuestions,latest,publishedCourses,supabase};
}

export async function trainerDashboardView(){
  const d=dashboardData();
  const passRate=d.attempts.length?Math.round(d.passed/d.attempts.length*100):0;
  const attention=d.weakTopics.filter(x=>x.accuracy<60).length;
  const activeQuestions=d.bank.active;
  const latest=d.latest[0];
  const supaClass=d.supabase.authenticated?"green":d.supabase.configured?"orange":"blue";
  const supaText=d.supabase.authenticated?"متصل ومسجل":d.supabase.configured?"مهيأ — بانتظار الدخول":"وضع محلي";
  return '<div class="page-intro with-action"><div><span class="eyebrow blue">V3.36 • لوحة المدرب النهائية</span><h2>مركز قيادة المدرب</h2><p>لوحة واحدة للقرار: المتدربون، الاختبارات، بنك الأسئلة، جودة المحتوى، والتنبيهات التشغيلية.</p></div><div class="trainer-exam-head-actions"><span class="badge '+supaClass+'">'+supaText+'</span><button class="btn btn-soft" data-trainer-page="audit">فحص المنصة</button></div></div>'+
  '<div class="trainer-v36-kpis"><div class="card trainer-v311-summary-card"><div class="summary-icon">👥</div><div><span class="muted">المتدربون</span><strong>'+d.students.length+'</strong><small>ظهروا في نتائج فعلية</small></div></div>'+
  '<div class="card trainer-v311-summary-card"><div class="summary-icon green">✓</div><div><span class="muted">متوسط النتائج</span><strong>'+d.avg+'%</strong><small>'+d.passed+' من '+d.attempts.length+' ناجح</small></div></div>'+
  '<div class="card trainer-v311-summary-card"><div class="summary-icon orange">⚠</div><div><span class="muted">موضوعات تحتاج تدخل</span><strong>'+attention+'</strong><small>أقل من 60%</small></div></div>'+
  '<div class="card trainer-v311-summary-card"><div class="summary-icon purple">Q</div><div><span class="muted">جودة البنك</span><strong>'+activeQuestions+'</strong><small>'+d.bank.needsReview+' سؤال يحتاج مراجعة</small></div></div>'+
  '<div class="card trainer-v311-summary-card"><div class="summary-icon blue">↗</div><div><span class="muted">نسبة النجاح</span><strong>'+passRate+'%</strong><small>من كل المحاولات</small></div></div></div>'+
  '<div class="trainer-v36-command-grid"><div class="card trainer-command-card primary"><div><span class="eyebrow blue">تشغيل</span><h3>إدارة الاختبارات</h3><p class="muted">أنشئ اختبارًا، انشره، وراجع المحاولات.</p></div><button class="btn btn-primary" data-trainer-page="exams">فتح الاختبارات</button></div><div class="card trainer-command-card"><div><span class="eyebrow purple">النتائج</span><h3>مركز النتائج</h3><p class="muted">'+d.attempts.length+' محاولة مسجلة حاليًا.</p></div><button class="btn btn-purple" data-trainer-page="results">فتح النتائج</button></div><div class="card trainer-command-card"><div><span class="eyebrow orange">الجودة</span><h3>ذكاء السؤال</h3><p class="muted">'+d.criticalQuestions.length+' سؤالًا حرجًا يحتاج مراجعة.</p></div><button class="btn btn-orange" data-trainer-page="qintel">فتح الذكاء</button></div><div class="card trainer-command-card"><div><span class="eyebrow green">المحتوى</span><h3>بنك الأسئلة</h3><p class="muted">'+d.bank.total+' سؤالًا في المصدر المركزي.</p></div><button class="btn btn-green" data-trainer-page="questions">فتح البنك</button></div></div>'+
  '<div class="grid-2 trainer-v36-main-grid"><div><div class="section-title"><h3>نقاط الضعف الحالية</h3><button class="link-btn" data-trainer-page="analytics">التحليلات</button></div><div class="card trainer-v36-topic-list">'+
  (d.weakTopics.length?d.weakTopics.slice(0,6).map(x=>'<div class="weakness-row"><div class="weakness-name"><strong>'+esc(x.topic)+'</strong><span class="badge '+(x.accuracy<50?"red":x.accuracy<70?"orange":"green")+'">'+(x.accuracy<50?"حرج":x.accuracy<70?"مراجعة":"جيد")+'</span></div><div class="progress"><span style="width:'+x.accuracy+'%"></span></div><strong class="weakness-percent">'+x.accuracy+'%</strong></div>').join(""):'<div class="empty">لا توجد بيانات كافية بعد.</div>')+
  '</div></div><div><div class="section-title"><h3>آخر المحاولات</h3><button class="link-btn" data-trainer-page="results">كل النتائج</button></div><div class="card trainer-v36-latest">'+
  (d.latest.length?d.latest.map(x=>'<div class="risk-row"><div class="risk-person"><strong>'+esc(x.studentName||"—")+'</strong><span class="muted">'+esc(x.exam||"—")+' • المحاولة '+x.attemptNo+'</span></div><span class="badge '+(x.passed?"green":"orange")+'">'+x.percent+'% • '+(x.passed?"ناجح":"مراجعة")+'</span><small class="muted">'+new Date(x.submittedAt).toLocaleDateString("ar-SA")+'</small></div>').join(""):'<div class="empty">لا توجد محاولات بعد.</div>')+
  '</div></div></div>'+
  '<div class="grid-2"><div class="card"><div class="section-title"><h3>الأولويات</h3><span class="badge red">'+d.criticalQuestions.length+' حرج</span></div>'+
  (d.criticalQuestions.slice(0,5).map(x=>'<div class="stat-row"><span>#'+x.id+' • '+esc(x.topic)+'</span><b>'+x.accuracy+'%</b></div>').join("")||'<div class="empty">لا توجد أسئلة حرجة.</div>')+
  '</div><div class="card"><div class="section-title"><h3>حالة المحتوى</h3><span class="badge green">'+d.publishedCourses.length+' مقرر منشور</span></div><div class="stat-row"><span>بنك الأسئلة</span><b>'+d.bank.active+'/'+d.bank.total+'</b></div><div class="stat-row"><span>أسئلة غير مكتملة البيانات</span><b>'+d.bank.unlinked+'</b></div><div class="stat-row"><span>المقررات المنشورة</span><b>'+d.publishedCourses.length+'</b></div><div class="stat-row"><span>Supabase</span><b>'+supaText+'</b></div></div></div>'+
  '<div class="card trainer-v36-note"><strong>V3.36:</strong> هذه اللوحة تعتمد على البيانات المتوفرة فعليًا في طبقة النتائج وبنك الأسئلة، ولا تعرض أرقام طلاب أو نسبًا ثابتة كبيانات Demo. عند تفعيل الحسابات وSupabase ستصبح نفس المؤشرات مرتبطة بالمؤسسة والطلاب الحقيقيين.</div>';
}
