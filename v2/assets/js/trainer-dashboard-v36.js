import {getExamAttempts,getQuestionAnalytics} from "./exam-v23.js?v=435";
import {getQuestionBankStats} from "./question-bank-v32.js?v=435";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function loadCourses(){
  try{
    const x=JSON.parse(localStorage.getItem("ipv4AcademyV36Courses")||"[]");
    return Array.isArray(x)?x:[];
  }catch{return []}
}
export function trainerDashboardView(){
  const attempts=getExamAttempts("");
  const analytics=getQuestionAnalytics("");
  const bank=getQuestionBankStats();
  const passed=attempts.filter(x=>x.passed).length;
  const avg=attempts.length?Math.round(attempts.reduce((s,x)=>s+Number(x.percent||0),0)/attempts.length):0;
  const students=[...new Set(attempts.map(x=>String(x.studentId||x.studentName)).filter(Boolean))];
  const weakTopics=[...analytics.filter(x=>x.total>0).reduce((m,x)=>{
    const cur=m.get(x.topic)||{topic:x.topic,total:0,correct:0};
    cur.total+=x.total;cur.correct+=x.correct;m.set(x.topic,cur);return m;
  },new Map()).values()].map(x=>({...x,accuracy:x.total?Math.round(x.correct/x.total*100):0})).sort((a,b)=>a.accuracy-b.accuracy);
  const criticalQuestions=analytics.filter(x=>x.total>=3&&x.accuracy<50).sort((a,b)=>a.accuracy-b.accuracy);
  const latest=attempts.slice(0,5);
  const publishedCourses=loadCourses().filter(x=>x.status==="published");
  const supabase=window.__IPV4_SUPABASE_STATUS__||{configured:false,authenticated:false,message:"Supabase غير مهيأ"};
  const supaClass=supabase.authenticated?"green":supabase.configured?"orange":"blue";
  const supaText=supabase.authenticated?"متصل ومسجل":supabase.configured?"مهيأ — بانتظار الدخول":"وضع محلي";
  const passRate=attempts.length?Math.round(passed/attempts.length*100):0;
  const attention=weakTopics.filter(x=>x.accuracy<60).length;

  const weaknessHtml=weakTopics.length?weakTopics.slice(0,6).map(x=>`
    <div class="weakness-row">
      <div class="weakness-name"><strong>${esc(x.topic)}</strong><span class="badge ${x.accuracy<50?"red":x.accuracy<70?"orange":"green"}">${x.accuracy<50?"حرج":x.accuracy<70?"مراجعة":"جيد"}</span></div>
      <div class="progress"><span style="width:${x.accuracy}%"></span></div>
      <strong class="weakness-percent">${x.accuracy}%</strong>
    </div>`).join(""):'<div class="empty">لا توجد بيانات كافية بعد.</div>';

  const latestHtml=latest.length?latest.map(x=>`
    <div class="risk-row">
      <div class="risk-person"><strong>${esc(x.studentName||"—")}</strong><span class="muted">${esc(x.exam||"—")} • المحاولة ${x.attemptNo}</span></div>
      <span class="badge ${x.passed?"green":"orange"}">${x.percent}% • ${x.passed?"ناجح":"مراجعة"}</span>
      <small class="muted">${new Date(x.submittedAt).toLocaleDateString("ar-SA")}</small>
    </div>`).join(""):'<div class="empty">لا توجد محاولات بعد.</div>';

  const criticalHtml=criticalQuestions.length?criticalQuestions.slice(0,5).map(x=>`
    <div class="stat-row"><span>#${x.id} • ${esc(x.topic)}</span><b>${x.accuracy}%</b></div>`).join(""):'<div class="empty">لا توجد أسئلة حرجة.</div>';

  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow blue">V3.36 • لوحة المدرب النهائية</span><h2>مركز قيادة المدرب</h2><p>لوحة واحدة للقرار: المتدربون، الاختبارات، بنك الأسئلة، جودة المحتوى، والتنبيهات التشغيلية.</p></div>
    <div class="trainer-exam-head-actions"><span class="badge ${supaClass}">${supaText}</span><button class="btn btn-soft" data-trainer-page="audit">فحص المنصة</button></div>
  </div>

  <div class="trainer-v36-kpis">
    <div class="card trainer-v311-summary-card"><div class="summary-icon">👥</div><div><span class="muted">المتدربون</span><strong>${students.length}</strong><small>من النتائج الفعلية</small></div></div>
    <div class="card trainer-v311-summary-card"><div class="summary-icon green">✓</div><div><span class="muted">متوسط النتائج</span><strong>${avg}%</strong><small>${passed} من ${attempts.length} ناجح</small></div></div>
    <div class="card trainer-v311-summary-card"><div class="summary-icon orange">⚠</div><div><span class="muted">موضوعات تحتاج تدخل</span><strong>${attention}</strong><small>أقل من 60%</small></div></div>
    <div class="card trainer-v311-summary-card"><div class="summary-icon purple">Q</div><div><span class="muted">الأسئلة النشطة</span><strong>${bank.active}</strong><small>${bank.needsReview} تحتاج مراجعة</small></div></div>
    <div class="card trainer-v311-summary-card"><div class="summary-icon blue">↗</div><div><span class="muted">نسبة النجاح</span><strong>${passRate}%</strong><small>من كل المحاولات</small></div></div>
  </div>

  <div class="trainer-v36-command-grid">
    <div class="card trainer-command-card primary"><div><span class="eyebrow blue">تشغيل</span><h3>إدارة الاختبارات</h3><p class="muted">أنشئ الاختبار وانشره وراجع المحاولات.</p></div><button class="btn btn-primary" data-trainer-page="exams">فتح الاختبارات</button></div>
    <div class="card trainer-command-card"><div><span class="eyebrow purple">النتائج</span><h3>مركز النتائج</h3><p class="muted">${attempts.length} محاولة مسجلة حاليًا.</p></div><button class="btn btn-purple" data-trainer-page="results">فتح النتائج</button></div>
    <div class="card trainer-command-card"><div><span class="eyebrow orange">الجودة</span><h3>ذكاء السؤال</h3><p class="muted">${criticalQuestions.length} سؤال حرج.</p></div><button class="btn btn-orange" data-trainer-page="qintel">فتح الذكاء</button></div>
    <div class="card trainer-command-card"><div><span class="eyebrow green">المحتوى</span><h3>بنك الأسئلة</h3><p class="muted">${bank.total} سؤال في المصدر المركزي.</p></div><button class="btn btn-green" data-trainer-page="questions">فتح البنك</button></div>
  </div>

  <div class="grid-2 trainer-v36-main-grid">
    <div>
      <div class="section-title"><h3>نقاط الضعف الحالية</h3><button class="link-btn" data-trainer-page="analytics">التحليلات</button></div>
      <div class="card trainer-v36-topic-list">${weaknessHtml}</div>
    </div>
    <div>
      <div class="section-title"><h3>آخر المحاولات</h3><button class="link-btn" data-trainer-page="results">كل النتائج</button></div>
      <div class="card trainer-v36-latest">${latestHtml}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card"><div class="section-title"><h3>الأولويات</h3><span class="badge red">${criticalQuestions.length} حرج</span></div>${criticalHtml}</div>
    <div class="card">
      <div class="section-title"><h3>حالة المحتوى</h3><span class="badge green">${publishedCourses.length} مقرر منشور</span></div>
      <div class="stat-row"><span>بنك الأسئلة</span><b>${bank.active}/${bank.total}</b></div>
      <div class="stat-row"><span>أسئلة غير مكتملة البيانات</span><b>${bank.unlinked}</b></div>
      <div class="stat-row"><span>المقررات المنشورة</span><b>${publishedCourses.length}</b></div>
      <div class="stat-row"><span>Supabase</span><b>${supaText}</b></div>
    </div>
  </div>

  <div class="card trainer-v36-note"><strong>V3.36:</strong> المؤشرات هنا تعتمد على النتائج وبنك الأسئلة المتوفرين فعليًا، ولا تستخدم أرقام طلاب ثابتة من Demo.</div>
  `;
}
