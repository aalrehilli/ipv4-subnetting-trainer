import {fetchTrainerStudentRoster,fetchTrainerResultsSummary,fetchTrainerLiveExamMonitor,fetchTrainerLearningSignals} from "./supabase-v30.js?v=505";

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const pct=v=>Math.max(0,Math.min(100,Number(v||0)));
const n=v=>Number(v||0);

function stat(icon,title,value,sub,cls=""){
  return '<div class="trainer101-stat card '+cls+'"><div class="trainer101-stat-top"><span class="trainer101-stat-icon">'+icon+'</span><span class="muted">'+title+'</span></div><strong>'+value+'</strong><small>'+sub+'</small></div>';
}
function quick(icon,title,desc,page,mode="page"){
  const attr=mode==="student"?'data-student-id="'+esc(page)+'"':'data-trainer-page="'+esc(page)+'"';
  return '<button class="trainer101-quick" '+attr+'><span class="trainer101-quick-icon">'+icon+'</span><span><strong>'+title+'</strong><small>'+desc+'</small></span><span class="trainer101-arrow">←</span></button>';
}
function date(v){
  if(!v)return "—";
  try{return new Intl.DateTimeFormat("ar-SA",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v));}catch{return "—";}
}

export async function trainerDashboardV101(){
  const roster=await fetchTrainerStudentRoster("","").catch(()=>({ok:false}));
  const results=await fetchTrainerResultsSummary("").catch(()=>({ok:false}));
  const live=await fetchTrainerLiveExamMonitor().catch(()=>({ok:false}));
  const signals=await fetchTrainerLearningSignals().catch(()=>({ok:false}));

  const rs=roster.payload||{};
  const rr=results.payload||{};
  const ls=signals||{};
  const students=Array.isArray(rs.students)?rs.students:[];
  const groups=Array.isArray(rs.groups)?rs.groups:[];
  const recent=Array.isArray(rr.recent)?rr.recent:[];
  const exams=Array.isArray(rr.exams)?rr.exams:[];
  const attempts=Array.isArray(live.payload?.attempts)?live.payload.attempts:[];
  const high=students.filter(s=>s.risk==="مرتفع");
  const medium=students.filter(s=>s.risk==="متوسط");
  const active=n(live.payload?.activeCount);
  const summary=rr.summary||rs.summary||{};
  const signalSummary=ls.summary||{};
  const avg=pct(summary.avg_percent||summary.average_percent||summary.avg_score);
  const pass=pct(summary.pass_rate);
  const progress=pct(summary.avg_progress||rs.summary?.avg_progress);
  const active7=n(summary.active_7d||rs.summary?.active_7d);
  const topRisk=[...high,...medium].slice(0,5);
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدرب";

  return '<div class="trainer101-page">'+
    '<section class="trainer101-hero">'+
      '<div class="trainer101-hero-main">'+
        '<div class="trainer101-eyebrow">V4.01 • مركز قيادة المدرب</div>'+
        '<h1>مرحبًا '+esc(name)+' 👨‍🏫</h1>'+
        '<p>كل ما تحتاجه لمتابعة المتدربين، اكتشاف حالات التعثر، وإدارة الاختبارات والنتائج من شاشة واحدة.</p>'+
        '<div class="trainer101-hero-actions">'+
          quick("👥","المتدربون","القائمة الكاملة وStudent 360","students")+
          quick("📝","الاختبارات","إنشاء ونشر وفحص الجاهزية","exams")+
          quick("📊","النتائج","النتائج الرسمية والتحليل","results")+
          quick("📈","التحليلات","أداء المجموعات والمتدربين","analytics")+
        '</div>'+
      '</div>'+
      '<div class="trainer101-live-summary">'+
        '<div><span>الاختبارات المباشرة</span><strong>'+active+'</strong><small>محاولات قيد التنفيذ</small></div>'+
        '<div class="trainer101-live-dot '+(active?"on":"")+'"></div>'+
        '<div class="trainer101-live-meta"><span>نشاط 7 أيام</span><strong>'+active7+'</strong><span>نسبة الاجتياز</span><strong>'+Math.round(pass)+'%</strong></div>'+
      '</div>'+
    '</section>'+

    '<div class="trainer101-stats">'+
      stat("👥","المتدربون",n(summary.students||rs.summary?.total_students||students.length),"إجمالي المتدربين","blue")+
      stat("📚","متوسط الإكمال",Math.round(progress)+"%","تقدم المقررات","green")+
      stat("🎯","متوسط الأداء",Math.round(avg)+"%","متوسط النتائج","purple")+
      stat("⚠️","عالي الخطورة",high.length,"تدخل مباشر","red")+
      stat("🟠","متوسط الخطورة",medium.length,"متابعة قريبة","orange")+
      stat("🧪","الاختبارات المباشرة",active,"محاولات حالية","blue")+
    '</div>'+

    '<div class="trainer101-grid">'+
      '<section class="card trainer101-panel">'+
        '<div class="trainer101-head"><div><span class="trainer101-eyebrow blue">الخطوة الأهم</span><h3>حالات تحتاج قرارًا</h3></div><span class="badge red">'+(high.length+medium.length)+' حالة</span></div>'+
        (topRisk.length?'<div class="trainer101-risk-list">'+topRisk.map((s,i)=>{
          const r=s.risk==="مرتفع"?"red":"orange";
          const mastery=n(s.mastery), prog=n(s.progress), score=n(s.examAvg||s.avgScore);
          return '<div class="trainer101-risk-row"><span class="trainer101-rank">'+(i+1)+'</span><div class="trainer101-person"><strong>'+esc(s.name||s.student_name||"متدرب")+'</strong><small>المجموعة '+esc(s.group||s.group_no||"—")+' • '+esc(s.weakTopic||"لا توجد نقطة ضعف محددة")+'</small></div><div class="trainer101-risk-metrics"><span>'+mastery+'% إتقان</span><span>'+prog+'% تقدم</span><span>'+score+'% اختبار</span></div><span class="badge '+r+'">'+esc(s.risk)+'</span><button class="btn btn-soft mini-btn" data-student-id="'+esc(s.id||s.student_id||"")+'">Student 360</button></div>';
        }).join("")+'</div>':'<div class="trainer101-empty">لا توجد حالات مرتفعة أو متوسطة الخطورة حاليًا.</div>')+
        '<div class="trainer101-panel-footer"><button class="btn btn-soft" data-trainer-page="interventions">فتح مركز التدخل</button><button class="link-btn" data-trainer-page="students">عرض جميع المتدربين</button></div>'+
      '</section>'+

      '<section class="card trainer101-panel">'+
        '<div class="trainer101-head"><div><span class="trainer101-eyebrow orange">LIVE</span><h3>المراقبة الحية</h3></div><span class="badge '+(active?"orange":"green")+'">'+active+' نشط</span></div>'+
        (attempts.length?'<div class="trainer101-live-list">'+attempts.slice(0,5).map(a=>{
          const left=n(a.remainingSeconds||a.remaining_seconds);
          const dur=Math.max(60,n(a.durationMinutes||a.duration_minutes)*60);
          return '<div class="trainer101-live-row"><div><strong>'+esc(a.studentName||a.student_name||"متدرب")+'</strong><small>'+esc(a.title||a.examTitle||"اختبار")+' • المجموعة '+esc(a.groupNo||a.group_no||"—")+'</small></div><strong class="'+(left<=60?"trainer101-danger":"")+'">'+(left?Math.ceil(left/60)+" د":"قرب الانتهاء")+'</strong><div class="trainer101-progress"><span style="width:'+pct(left/dur*100)+'%"></span></div></div>';
        }).join("")+'</div>':'<div class="trainer101-empty">لا توجد اختبارات قيد التنفيذ حاليًا.</div>')+
        '<div class="trainer101-panel-footer"><button class="btn btn-orange" data-trainer-page="results">مركز النتائج</button><button class="link-btn" data-trainer-page="examcheck">فحص الاختبار</button></div>'+
      '</section>'+
    '</div>'+

    '<div class="trainer101-grid">'+
      '<section class="card trainer101-panel">'+
        '<div class="trainer101-head"><div><span class="trainer101-eyebrow purple">GROUPS</span><h3>ملخص المجموعات</h3></div><button class="link-btn" data-trainer-page="groups">إدارة المجموعات</button></div>'+
        (groups.length?'<div class="trainer101-groups">'+groups.slice(0,6).map(g=>{
          const v=pct(g.avg_mastery||g.avg_progress);
          return '<div class="trainer101-group-row"><div><strong>المجموعة '+esc(g.group_no||"—")+'</strong><small>'+n(g.students)+' متدرب</small></div><div class="trainer101-group-meter"><div class="progress"><span style="width:'+v+'%"></span></div><strong>'+Math.round(v)+'%</strong></div></div>';
        }).join("")+'</div>':'<div class="trainer101-empty">لا توجد بيانات مجموعات حاليًا.</div>')+
      '</section>'+

      '<section class="card trainer101-panel">'+
        '<div class="trainer101-head"><div><span class="trainer101-eyebrow green">RESULTS</span><h3>آخر النتائج</h3></div><button class="link-btn" data-trainer-page="results">عرض الكل</button></div>'+
        (recent.length?'<div class="trainer101-results">'+recent.slice(0,6).map(r=>{
          const p=pct(r.percent??r.score); const passed=!!r.passed;
          return '<div class="trainer101-result-row"><div><strong>'+esc(r.studentName||r.student_name||"متدرب")+'</strong><small>'+esc(r.title||r.exam||"اختبار")+' • '+date(r.submittedAt||r.submitted_at)+'</small></div><strong>'+Math.round(p)+'%</strong><span class="badge '+(passed?"green":"orange")+'">'+(passed?"ناجح":"غير مجتاز")+'</span></div>';
        }).join("")+'</div>':'<div class="trainer101-empty">لا توجد نتائج حديثة.</div>')+
      '</section>'+
    '</div>'+

    '<section class="trainer101-footer-actions">'+
      '<div class="card trainer101-mini"><span class="trainer101-eyebrow blue">QUESTION BANK</span><strong>'+n(signalSummary.questions||0)+'</strong><small>أسئلة مركزية</small><button class="btn btn-soft" data-trainer-page="questions">فتح بنك الأسئلة</button></div>'+
      '<div class="card trainer101-mini"><span class="trainer101-eyebrow purple">COURSES</span><strong>'+n(signalSummary.courses||groups.length)+'</strong><small>مؤشرات المقررات والمجموعات</small><button class="btn btn-soft" data-trainer-page="courses">إدارة المقررات</button></div>'+
      '<div class="card trainer101-mini"><span class="trainer101-eyebrow orange">SMART</span><strong>'+n(high.length+medium.length)+'</strong><small>حالات تحتاج تدخلًا</small><button class="btn btn-soft" data-trainer-page="interventions">مركز التدخل</button></div>'+
      '<div class="card trainer101-mini"><span class="trainer101-eyebrow green">NOTIFICATIONS</span><strong>↗</strong><small>إرسال تنبيه للمتدربين</small><button class="btn btn-soft" data-trainer-page="notifications">الإشعارات</button></div>'+
    '</section>'+
  '</div>';
}
