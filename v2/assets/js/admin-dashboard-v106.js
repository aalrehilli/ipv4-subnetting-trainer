import {fetchAdminUsers,fetchTrainerStudentRoster,fetchTrainerResultsSummary,fetchTrainerLiveExamMonitor} from "./supabase-v30.js?v=507";

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const n=v=>Number(v||0);
const pct=v=>Math.max(0,Math.min(100,Number(v||0)));

function stat(icon,title,value,sub,cls=""){
  return '<div class="admin106-stat card '+cls+'"><div class="admin106-stat-top"><span class="admin106-stat-icon">'+icon+'</span><span class="muted">'+title+'</span></div><strong>'+value+'</strong><small>'+sub+'</small></div>';
}
function action(icon,title,desc,page,cls=""){
  return '<button class="admin106-action '+cls+'" data-page="'+page+'"><span class="admin106-action-icon">'+icon+'</span><span><strong>'+title+'</strong><small>'+desc+'</small></span><span class="admin106-arrow">←</span></button>';
}

export async function adminDashboardV106(){
  const users=await fetchAdminUsers().catch(()=>({ok:false}));
  const roster=await fetchTrainerStudentRoster("","").catch(()=>({ok:false}));
  const results=await fetchTrainerResultsSummary("").catch(()=>({ok:false}));
  const live=await fetchTrainerLiveExamMonitor().catch(()=>({ok:false}));

  const us=users.payload||{};
  const rs=roster.payload||{};
  const rr=results.payload||{};
  const userSum=us.summary||{};
  const groups=Array.isArray(rs.groups)?rs.groups:[];
  const courses=Array.isArray(rs.courses)?rs.courses:[];
  const exams=Array.isArray(rr.exams)?rr.exams:[];
  const liveCount=n(live.payload?.activeCount);
  const recentUsers=(Array.isArray(us.users)?us.users:[]).slice().sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))).slice(0,5);
  const avg=pct(rr.summary?.avg_percent||rr.summary?.average_percent);
  const pass=pct(rr.summary?.pass_rate);
  const inactive=n(userSum.inactive);
  const name=window.__IPV4_SUPABASE_STATUS__?.name||"المدير";

  return '<div class="admin106-page">'+
    '<section class="admin106-hero">'+
      '<div class="admin106-hero-main">'+
        '<div class="admin106-eyebrow">V4.06 • مركز إدارة المنصة</div>'+
        '<h1>مرحبًا '+esc(name)+' 🛡️</h1>'+
        '<p>هذه لوحة المدير العامة: إدارة الحسابات والصلاحيات والمحتوى والتشغيل. متابعة أداء الطلاب التفصيلية تبقى ضمن لوحة المدرب.</p>'+
        '<div class="admin106-hero-actions">'+
          action("👥","المستخدمون","الحسابات والأدوار والصلاحيات","users","primary")+
          action("📚","المقررات","المحتوى والوحدات والدروس","courses")+
          action("🧠","جودة المحتوى","بنك الأسئلة والتدقيق","questions")+
          action("⚙️","التشغيل","الاختبارات والمراقبة","examcheck")+
        '</div>'+
      '</div>'+
      '<div class="admin106-control-card">'+
        '<span class="admin106-eyebrow">حالة الإدارة</span>'+
        '<strong>النظام متصل</strong>'+
        '<div class="admin106-control-grid"><div><b>'+n(userSum.total)+'</b><small>مستخدم</small></div><div><b>'+n(userSum.active)+'</b><small>نشط</small></div><div><b>'+n(userSum.admins)+'</b><small>مدير</small></div><div><b>'+liveCount+'</b><small>مباشر</small></div></div>'+
        '<span class="admin106-control-note">حسابات غير نشطة: '+inactive+'</span>'+
      '</div>'+
    '</section>'+

    '<div class="admin106-stats">'+
      stat("👥","إجمالي الحسابات",n(userSum.total),"كل المستخدمين","blue")+
      stat("🎓","المتدربون",n(userSum.students),"الحسابات التعليمية","green")+
      stat("👨‍🏫","المدربون",n(userSum.trainers),"حسابات التدريب","purple")+
      stat("🛡️","المديرون",n(userSum.admins),"حسابات الإدارة","orange")+
      stat("📚","المقررات",courses.length,"المقررات المتاحة","blue")+
      stat("📝","الاختبارات",n(rr.summary?.exams||exams.length),"اختبارات مركزية","orange")+
    '</div>'+

    '<div class="admin106-grid">'+
      '<section class="card admin106-panel">'+
        '<div class="admin106-head"><div><span class="admin106-eyebrow blue">إدارة المستخدمين</span><h3>حوكمة الحسابات</h3></div><span class="badge purple">ADMIN</span></div>'+
        '<div class="admin106-governance">'+
          '<div><span>نشط</span><strong>'+n(userSum.active)+'</strong><small>مسموح بالدخول</small></div>'+
          '<div><span>غير نشط</span><strong>'+inactive+'</strong><small>ممنوع من الدخول</small></div>'+
          '<div><span>مدربون</span><strong>'+n(userSum.trainers)+'</strong><small>صلاحية تدريب</small></div>'+
          '<div><span>مديرون</span><strong>'+n(userSum.admins)+'</strong><small>صلاحية إدارية</small></div>'+
        '</div>'+
        '<div class="admin106-panel-footer"><button class="btn btn-primary" data-page="users">فتح إدارة المستخدمين</button><button class="link-btn" data-page="groups">إدارة المجموعات</button></div>'+
      '</section>'+

      '<section class="card admin106-panel">'+
        '<div class="admin106-head"><div><span class="admin106-eyebrow orange">التشغيل</span><h3>مراقبة النظام</h3></div><span class="badge '+(liveCount?"orange":"green")+'">'+liveCount+' مباشر</span></div>'+
        '<div class="admin106-system-list">'+
          '<div><span>الاختبارات المباشرة</span><strong>'+liveCount+'</strong><small>محاولات جارية الآن</small></div>'+
          '<div><span>متوسط النتائج</span><strong>'+Math.round(avg)+'%</strong><small>للنتائج الرسمية</small></div>'+
          '<div><span>نسبة الاجتياز</span><strong>'+Math.round(pass)+'%</strong><small>من الاختبارات المنشورة</small></div>'+
          '<div><span>حالة الحسابات</span><strong>'+n(userSum.active)+' / '+n(userSum.total)+'</strong><small>نشط من الإجمالي</small></div>'+
        '</div>'+
        '<div class="admin106-panel-footer"><button class="btn btn-soft" data-page="examcheck">فحص الاختبارات</button><button class="link-btn" data-page="analytics">التحليلات</button></div>'+
      '</section>'+
    '</div>'+

    '<section class="card admin106-panel">'+
      '<div class="admin106-head"><div><span class="admin106-eyebrow purple">إدارة المحتوى</span><h3>المحتوى والتشغيل</h3></div><span class="badge blue">Central Content</span></div>'+
      '<div class="admin106-content-grid">'+
        action("📚","المقررات","إدارة هيكل المقررات والوحدات والدروس","courses")+
        action("🧠","بنك الأسئلة","إدارة الأسئلة والتصنيف والجودة","questions")+
        action("🔎","تدقيق البنك","كشف المشكلات قبل نشر الاختبارات","qbaudit")+
        action("📝","الاختبارات","إدارة إعدادات ونشر الاختبارات","exams")+
        action("📊","مركز النتائج","عرض النتائج الرسمية للنظام","results")+
        action("🔔","الإشعارات","إدارة التنبيهات المركزية","notifications")+
      '</div>'+
    '</section>'+

    '<div class="admin106-grid">'+
      '<section class="card admin106-panel">'+
        '<div class="admin106-head"><div><span class="admin106-eyebrow green">الحسابات الحديثة</span><h3>آخر المستخدمين</h3></div><button class="link-btn" data-page="users">عرض الكل</button></div>'+
        (recentUsers.length?'<div class="admin106-users">'+recentUsers.map(u=>{
          const role=u.role==="admin"?"مدير":u.role==="trainer"?"مدرب":"متدرب";
          return '<div class="admin106-user-row"><span class="admin106-avatar">'+esc((u.fullName||"م").slice(0,1))+'</span><div><strong>'+esc(u.fullName||"بدون اسم")+'</strong><small>'+role+' • مجموعة '+esc(u.groupNo||"—")+'</small></div><span class="badge '+(u.isActive?"green":"red")+'">'+(u.isActive?"نشط":"غير نشط")+'</span></div>';
        }).join("")+'</div>':'<div class="empty">لا توجد حسابات.</div>')+
      '</section>'+
      '<section class="card admin106-panel">'+
        '<div class="admin106-head"><div><span class="admin106-eyebrow blue">مؤشرات المنصة</span><h3>صورة تشغيلية سريعة</h3></div></div>'+
        '<div class="admin106-platform-meter"><div class="admin106-meter-ring" style="--p:'+Math.round(pct(userSum.total?n(userSum.active)/n(userSum.total)*100:0))+'%"><strong>'+Math.round(pct(userSum.total?n(userSum.active)/n(userSum.total)*100:0))+'%</strong><small>حسابات نشطة</small></div><div class="admin106-platform-notes"><div><span>المجموعات</span><strong>'+groups.length+'</strong></div><div><span>المتوسط العام</span><strong>'+Math.round(avg)+'%</strong></div><div><span>نسبة الاجتياز</span><strong>'+Math.round(pass)+'%</strong></div></div></div>'+
      '</section>'+
    '</div>'+
  '</div>';
}
