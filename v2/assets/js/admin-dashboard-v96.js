import {fetchTrainerStudentRoster,fetchTrainerResultsSummary,fetchTrainerLiveExamMonitor,fetchAdminUsers} from "./supabase-v30.js?v=500";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function fmt(value){
  if(value===null||value===undefined||value==="")return "—";
  try{return new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));}catch{return "—";}
}
function pct(v){return Math.max(0,Math.min(100,Number(v||0)));}

function kpi(icon,title,value,sub,cls=""){
  return '<div class="admin96-kpi card '+cls+'"><div class="admin96-kpi-top"><span class="admin96-kpi-icon">'+icon+'</span><span class="muted">'+title+'</span></div><strong>'+value+'</strong><small>'+sub+'</small></div>';
}
function action(icon,title,desc,page,cls=""){
  return '<button class="admin96-action '+cls+'" data-page="'+page+'"><span class="admin96-action-icon">'+icon+'</span><span><strong>'+title+'</strong><small>'+desc+'</small></span><span class="admin96-action-arrow">←</span></button>';
}

export async function adminDashboardV96(){
  const results=await fetchTrainerResultsSummary("").catch(()=>({ok:false}));
  const roster=await fetchTrainerStudentRoster("","").catch(()=>({ok:false}));
  const live=await fetchTrainerLiveExamMonitor().catch(()=>({ok:false}));
  const users=await fetchAdminUsers().catch(()=>({ok:false}));

  const rs=roster.payload||{};
  const rr=results.payload||{};
  const us=users.payload||{};
  const sum=rr.summary||{};
  const userSum=us.summary||{};
  const students=Array.isArray(rs.students)?rs.students:[];
  const groups=Array.isArray(rs.groups)?rs.groups:[];
  const recent=Array.isArray(rr.recent)?rr.recent:[];
  const exams=Array.isArray(rr.exams)?rr.exams:[];
  const usersRows=Array.isArray(us.users)?us.users:[];
  const attempts=Array.isArray(live.payload?.attempts)?live.payload.attempts:[];
  const active=Number(live.payload?.activeCount||0);
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";

  const avg=Number(sum.avg_percent||sum.average_percent||0);
  const pass=Number(sum.pass_rate||0);
  const topExam=exams.slice().sort((a,b)=>Number(b.avgPercent||0)-Number(a.avgPercent||0))[0];
  const newest=usersRows.slice().sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))).slice(0,5);

  return '<div class="admin96-page">'+
    '<section class="admin96-hero">'+
      '<div class="admin96-hero-main">'+
        '<div class="eyebrow">V3.96 • مركز الإدارة الموحد</div>'+
        '<h1>مرحبًا '+esc(name)+' 👋</h1>'+
        '<p>من مكان واحد تدير الحسابات، المجموعات، المقررات، الاختبارات والنتائج، وتراقب التشغيل لحظة بلحظة.</p>'+
        '<div class="admin96-hero-actions">'+
          '<button class="btn btn-white" data-page="users">👥 إدارة المستخدمين</button>'+
          '<button class="btn btn-outline-white" data-page="exams">📝 الاختبارات</button>'+
          '<button class="btn btn-outline-white" data-page="results">📊 النتائج</button>'+
        '</div>'+
      '</div>'+
      '<div class="admin96-health">'+
        '<div class="admin96-health-title">حالة المنصة</div>'+
        '<div class="admin96-health-status"><span class="admin96-pulse"></span>متصلة</div>'+
        '<div class="admin96-health-grid"><div><strong>'+Number(userSum.active||0)+'</strong><small>حساب نشط</small></div><div><strong>'+active+'</strong><small>اختبار مباشر</small></div></div>'+
        '<small class="admin96-health-note">آخر مزامنة: '+fmt(new Date())+'</small>'+
      '</div>'+
    '</section>'+

    '<div class="admin96-kpis">'+
      kpi("👥","المستخدمون",Number(userSum.total||0),"إجمالي الحسابات")+
      kpi("🧑‍🎓","المتدربون",Number(userSum.students||students.length||0),"حسابات المتدربين","blue")+
      kpi("👨‍🏫","المدربون",Number(userSum.trainers||0),"حسابات التدريب","purple")+
      kpi("📝","الاختبارات",Number(sum.exams||exams.length||0),"اختبارات لها نتائج","orange")+
      kpi("✅","متوسط الأداء",Math.round(avg)+"%","متوسط النتائج","green")+
      kpi("🎯","نسبة الاجتياز",Math.round(pass)+"%","من النتائج الرسمية","blue")+
    '</div>'+

    '<div class="admin96-section-head"><div><span class="eyebrow blue">الوصول السريع</span><h3>مراكز الإدارة</h3></div><span class="badge purple">Central Control</span></div>'+
    '<div class="admin96-actions">'+
      action("👥","إدارة المستخدمين","الأدوار والمجموعات وحالة الحسابات","users","primary")+
      action("🧑‍🎓","المتدربون","الملفات والمجموعات وStudent 360","students")+
      action("📚","المقررات","إدارة المحتوى والمسارات التدريبية","courses")+
      action("🧠","بنك الأسئلة","المحتوى والتدقيق والجودة","questions")+
      action("📝","الاختبارات","إنشاء ونشر وفحص الجاهزية","exams")+
      action("📊","مركز النتائج","النتائج الرسمية والمراقبة الحية","results")+
      action("📈","التحليلات","أداء المجموعات والمتدربين","analytics")+
      action("🔔","الإشعارات","التواصل والتنبيهات المركزية","notifications")+
    '</div>'+

    '<div class="admin96-grid-2">'+
      '<div class="card admin96-panel">'+
        '<div class="admin96-panel-head"><div><span class="eyebrow orange">Live</span><h3>المراقبة الحية</h3></div><span class="badge '+(active?"orange":"green")+'">'+active+' قيد التنفيذ</span></div>'+
        (attempts.length?
          '<div class="admin96-live-list">'+attempts.slice(0,5).map(x=>{
            const left=Number(x.remainingSeconds||0);
            const total=Math.max(1,Number(x.durationMinutes||1)*60);
            return '<div class="admin96-live-row"><div><strong>'+esc(x.studentName||"متدرب")+'</strong><small>'+esc(x.title||"اختبار")+' • المجموعة '+esc(x.groupNo||"—")+'</small></div><strong class="'+(left<=60?"admin96-danger":"")+'">'+(left>0?Math.ceil(left/60)+" د":"قرب الانتهاء")+'</strong><div class="admin96-mini-progress"><span style="width:'+pct(left/total*100)+'%"></span></div></div>';
          }).join("")+'</div>'
        :'<div class="admin96-empty">لا توجد اختبارات قيد التنفيذ حاليًا.</div>')+
      '</div>'+
      '<div class="card admin96-panel">'+
        '<div class="admin96-panel-head"><div><span class="eyebrow green">Performance</span><h3>ملخص الأداء</h3></div><span class="badge green">مباشر</span></div>'+
        '<div class="admin96-performance"><div class="admin96-score-ring"><strong>'+Math.round(avg)+'%</strong><small>المتوسط</small></div><div class="admin96-performance-stats"><div><span>نسبة الاجتياز</span><strong>'+Math.round(pass)+'%</strong></div><div><span>المحاولات</span><strong>'+Number(sum.submitted_attempts||0)+'</strong></div><div><span>أفضل اختبار</span><strong>'+esc(topExam?.title||"—")+'</strong></div></div></div>'+
      '</div>'+
    '</div>'+

    '<div class="admin96-grid-2">'+
      '<div class="card admin96-panel"><div class="admin96-panel-head"><div><span class="eyebrow purple">Users</span><h3>أحدث الحسابات</h3></div><button class="btn btn-soft mini-btn" data-page="users">عرض الكل</button></div>'+
        '<div class="admin96-user-list">'+newest.map(u=>'<div class="admin96-user-row"><div class="admin96-avatar">'+esc((u.fullName||u.email||"م").slice(0,2))+'</div><div><strong>'+esc(u.fullName||"بدون اسم")+'</strong><small>'+esc(u.email||"")+' • '+(u.role==="admin"?"مدير":u.role==="trainer"?"مدرب":"متدرب")+'</small></div><span class="badge '+(u.isActive?"green":"red")+'">'+(u.isActive?"نشط":"غير نشط")+'</span></div>').join("")+'</div>'+
      '</div>'+
      '<div class="card admin96-panel"><div class="admin96-panel-head"><div><span class="eyebrow blue">Results</span><h3>آخر النتائج</h3></div><button class="btn btn-soft mini-btn" data-page="results">مركز النتائج</button></div>'+
        '<div class="table-scroll"><table class="table admin96-table"><thead><tr><th>المتدرب</th><th>الاختبار</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody>'+
        (recent.length?recent.slice(0,6).map(x=>'<tr><td><strong>'+esc(x.studentName||"متدرب")+'</strong><small class="muted">'+esc(x.groupNo||"—")+'</small></td><td>'+esc(x.title||"اختبار")+'</td><td><strong>'+Number(x.percent||0)+'%</strong></td><td><span class="badge '+(x.passed?"green":"orange")+'">'+(x.passed?"ناجح":"غير مجتاز")+'</span></td></tr>').join(""):'<tr><td colspan="4"><div class="empty">لا توجد نتائج بعد.</div></td></tr>')+
        '</tbody></table></div>'+
      '</div>'+
    '</div>'+

    '<div class="admin96-footer-grid">'+
      '<div class="card admin96-mini-panel"><span class="eyebrow">Groups</span><strong>'+groups.length+'</strong><small>مجموعات مسجلة</small><button class="btn btn-soft" data-page="groups">إدارة المجموعات</button></div>'+
      '<div class="card admin96-mini-panel"><span class="eyebrow">Inactive</span><strong>'+Number(userSum.inactive||0)+'</strong><small>حسابات غير نشطة</small><button class="btn btn-soft" data-page="users">مراجعة الحسابات</button></div>'+
      '<div class="card admin96-mini-panel"><span class="eyebrow">Published</span><strong>'+Number(sum.published_exams||sum.exams||0)+'</strong><small>اختبارات منشورة</small><button class="btn btn-soft" data-page="exams">إدارة الاختبارات</button></div>'+
      '<div class="card admin96-mini-panel"><span class="eyebrow">Question Bank</span><strong>'+Number(sum.questions||0)+'</strong><small>سؤال مركزي</small><button class="btn btn-soft" data-page="questions">فتح البنك</button></div>'+
    '</div>'+
    '</div>';
}

export function bindAdminDashboardV96(){
  document.querySelectorAll(".admin96-page [data-page]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const ev=new Event("click");
      // Keep the global navigation contract: boot-v40 binds data-page buttons after rendering.
      // This listener intentionally does nothing beyond allowing normal bubbling.
    });
  });
}
