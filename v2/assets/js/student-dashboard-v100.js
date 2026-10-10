import {fetchStudentMastery,fetchStudentSmartReviewPlan,fetchStudentExamResults,fetchStudentActiveExam,fetchMyNotifications,getSupabaseStatus,myActiveCourses} from "./supabase-v30.js?v=521";

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const pct=v=>Math.max(0,Math.min(100,Number(v||0)));
const num=v=>Number(v||0);
const fmtDate=v=>{
  if(!v)return "—";
  try{return new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium"}).format(new Date(v));}catch{return "—";}
};

function stat(icon,title,value,sub,cls=""){
  return '<div class="student100-stat card '+cls+'"><div class="student100-stat-top"><span class="student100-stat-icon">'+icon+'</span><span class="muted">'+title+'</span></div><strong>'+value+'</strong><small>'+sub+'</small></div>';
}

function action(icon,title,desc,page,cls=""){
  return '<button class="student100-action '+cls+'" data-page="'+page+'"><span class="student100-action-icon">'+icon+'</span><span class="student100-action-copy"><strong>'+title+'</strong><small>'+desc+'</small></span><span class="student100-action-arrow">←</span></button>';
}

export async function studentDashboardV100(){
  const mastery=await fetchStudentMastery("").catch(()=>({ok:false}));
  const review=await fetchStudentSmartReviewPlan(5).catch(()=>({ok:false}));
  const results=await fetchStudentExamResults(5).catch(()=>({ok:false}));
  const active=await fetchStudentActiveExam().catch(()=>({ok:false}));
  const notifications=await fetchMyNotifications().catch(()=>({ok:false}));
  const activeCourses=await myActiveCourses().catch(()=>({ok:false,courses:[]}));
  const profileStatus=await getSupabaseStatus().catch(()=>({}));

  const s=mastery.summary||{};
  const topics=Array.isArray(mastery.topics)?mastery.topics:[];
  const rec=mastery.recommendation||{};
  const reviewTopics=Array.isArray(review.topics)?review.topics:[];
  const rows=Array.isArray(results.rows)?results.rows:[];
  const notes=Array.isArray(notifications.rows)?notifications.rows:[];
  const unread=notes.filter(x=>!x.read_at).length;
  const assignedCourses=Array.isArray(activeCourses.courses)?activeCourses.courses:[];
  const groupNo=String(profileStatus.group||"").trim();
  const activeExam=active.data||active.payload||null;

  const overall=pct(s.overall);
  const lesson=pct(s.lessonProgress);
  const examAvg=pct(s.examAvg);
  const assess=pct(s.assessmentAvg);
  const topTopic=topics.slice().sort((a,b)=>num(a.accuracy)-num(b.accuracy))[0];
  const nextPage=rec.page||"review";
  const nextAction=rec.action||"ابدأ المراجعة";
  const nextReason=rec.reason||"تابع التدريب ثم نفّذ اختبارًا لرفع مستوى الإتقان.";

  const activeTitle=activeExam?.title||activeExam?.exam_title||activeExam?.examTitle||"اختبار جارٍ";
  const activeRemaining=activeExam?.remainingSeconds??activeExam?.remaining_seconds??activeExam?.remaining;
  const activeExamExists=!!activeExam && (activeExam.id||activeExam.attemptId||activeExam.attempt_id||activeExam.title||activeExam.exam_title);

  return '<div class="student100-page">'+
    '<section class="student100-hero">'+
      '<div class="student100-hero-main">'+
        '<div class="student100-eyebrow">V4.00 • لوحة التعلم الشخصية</div>'+
        '<h1>أهلًا بك '+esc(window.__IPV4_SUPABASE_STATUS__?.name||"بك")+' 👋</h1>'+
        '<p>تابع تقدمك، راجع نقاط الضعف، وابدأ الخطوة التالية مباشرة من لوحة واحدة.</p>'+
        '<div class="student100-actions">'+
          action("🎯","ابدأ من مستواي","اختبار تحديد المستوى وقياس البداية","level","primary")+
          action("🧠","المراجعة الذكية","تدريب مخصص حسب نقاط الضعف","review")+
          action("📝","الاختبارات","الاختبارات المتاحة ونتائجك","exams")+
        '</div>'+
      '</div>'+
      '<div class="student100-score">'+
        '<span>الإتقان العام</span><strong>'+Math.round(overall)+'%</strong>'+
        '<div class="student100-ring" style="--p:'+overall+'%"></div>'+
        '<small>يتحدث مع كل نتيجة جديدة</small>'+
      '</div>'+
    '</section>'+

    (activeExamExists?
      '<section class="student100-live card">'+
        '<div><span class="student100-eyebrow orange">اختبار نشط الآن</span><h3>'+esc(activeTitle)+'</h3><p class="muted">لديك محاولة مفتوحة؛ يمكنك العودة لإكمال الاختبار.</p></div>'+
        '<div class="student100-live-right">'+(activeRemaining!=null?'<strong>'+Math.ceil(num(activeRemaining)/60)+' دقيقة</strong>':'<strong>مستمر</strong>')+
        '<button class="btn btn-orange" data-page="exams">متابعة الاختبار ←</button></div>'+
      '</section>':'')+

    '<section class="card student100-group-card" style="margin-bottom:16px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">'+
      '<div><span class="student100-eyebrow blue">المجموعة والمقرر</span><h3 style="margin:5px 0">مجموعة '+esc(groupNo||"غير معين")+'</h3><p class="muted" style="margin:0">'+(assignedCourses.length?("لديك "+assignedCourses.length+" مقررًا مفعلًا لمجموعتك."):"لا يوجد مقرر مفعل لك حاليًا. يفعّل المدرب المقرر لأعضاء المجموعة.")+'</p></div>'+
      '<div style="display:flex;gap:8px;align-items:center"><span class="badge '+(groupNo?"green":"orange")+'">'+(groupNo?"مرتبط بالمجموعة":"غير مرتبط")+'</span><span class="badge purple">'+assignedCourses.length+' مقرر مفعل</span><button class="btn btn-primary" data-page="course">فتح المقرر</button></div>'+
    '</section>'+
    '<div class="student100-stats">'+
      stat("📚","تقدم الدروس",Math.round(lesson)+"%","المحتوى المكتمل","green")+
      stat("🎯","متوسط الاختبارات",Math.round(examAvg)+"%",num(s.examAttempts)+" محاولة","blue")+
      stat("🧩","تقييمات الدروس",Math.round(assess)+"%","متوسط التقييمات","purple")+
      stat("🔔","الإشعارات",unread,"غير مقروءة","orange")+
    '</div>'+

    '<div class="student100-grid">'+
      '<section class="card student100-panel">'+
        '<div class="student100-head"><div><span class="student100-eyebrow purple">الخطة الذكية</span><h3>الخطوة التالية</h3></div><span class="badge purple">SMART</span></div>'+
        '<div class="student100-next">'+
          '<div class="student100-next-icon">✦</div>'+
          '<div><h3>'+esc(nextAction)+'</h3><p class="muted">'+esc(nextReason)+'</p></div>'+
          '<button class="btn btn-purple" data-page="'+nextPage+'">ابدأ الآن</button>'+
        '</div>'+
      '</section>'+
      '<section class="card student100-panel">'+
        '<div class="student100-head"><div><span class="student100-eyebrow orange">تنبيه تعلم</span><h3>أولوية التحسين</h3></div><span class="badge orange">'+(topTopic?Math.round(num(topTopic.accuracy))+"%":"—")+'</span></div>'+
        '<div class="student100-focus">'+
          '<div class="student100-focus-icon">⚡</div><div><strong>'+esc(topTopic?.topic||reviewTopics[0]?.topic||"ابدأ بالأساسيات")+'</strong><p class="muted">'+esc(topTopic?.status||reviewTopics[0]?.status||"نوصي بالبدء بالمراجعة الذكية.")+'</p></div>'+
          '<button class="btn btn-orange" data-page="review">راجع</button>'+
        '</div>'+
      '</section>'+
    '</div>'+

    '<div class="student100-section-title"><div><span class="student100-eyebrow blue">خريطة الإتقان</span><h3>المهارات الحالية</h3></div><button class="link-btn" data-page="progress">عرض التقدم</button></div>'+
    '<section class="card student100-topics">'+
      (topics.length?topics.slice().sort((a,b)=>num(a.accuracy)-num(b.accuracy)).slice(0,6).map(t=>{
        const v=pct(t.accuracy); const cls=v<50?"red":v<70?"orange":"green";
        return '<div class="student100-topic"><div class="student100-topic-head"><strong>'+esc(t.topic||"مهارة")+'</strong><span class="badge '+cls+'">'+Math.round(v)+'%</span></div><div class="progress"><span style="width:'+v+'%"></span></div><small>'+esc(t.status||"")+'</small></div>';
      }).join(""):'<div class="empty">بعد تنفيذ أول تدريب أو اختبار ستظهر خريطة الإتقان هنا.</div>')+
    '</section>'+

    '<div class="student100-section-title"><div><span class="student100-eyebrow green">النتائج</span><h3>آخر الاختبارات</h3></div><button class="link-btn" data-page="results">عرض النتائج</button></div>'+
    '<section class="card">'+
      (rows.length?'<div class="table-scroll"><table class="table student100-results"><thead><tr><th>الاختبار</th><th>النتيجة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>'+
        rows.map(r=>{
          const p=pct(r.percent??r.score); const passed=!!(r.passed??r.isPassed);
          return '<tr><td><strong>'+esc(r.title||r.exam||"اختبار")+'</strong></td><td><strong>'+Math.round(p)+'%</strong></td><td><span class="badge '+(passed?"green":"orange")+'">'+(passed?"ناجح":"غير مجتاز")+'</span></td><td>'+fmtDate(r.submittedAt||r.submitted_at||r.createdAt)+'</td></tr>';
        }).join("")+'</tbody></table></div>'
      :'<div class="empty">لا توجد نتائج مسجلة حتى الآن.</div>')+
    '</section>'+

    '<div class="student100-section-title"><div><span class="student100-eyebrow">المسار</span><h3>رحلتك التدريبية</h3></div></div>'+
    '<section class="student100-path">'+
      '<div class="student100-step done"><span>1</span><strong>التعلم</strong><small>المحتوى الأساسي</small></div>'+
      '<div class="student100-step current"><span>2</span><strong>التدريب</strong><small>حل وتمرين</small></div>'+
      '<div class="student100-step"><span>3</span><strong>الاختبار</strong><small>قياس المستوى</small></div>'+
      '<div class="student100-step"><span>4</span><strong>المراجعة</strong><small>تحسين الأخطاء</small></div>'+
    '</section>'+
  '</div>';
}
