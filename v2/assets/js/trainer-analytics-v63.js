import {getSupabaseConfig,fetchTrainerLearningSignals} from "./supabase-v30.js?v=470";

let clientPromise=null;

const esc=v=>String(v==null?"":v)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

async function client(){
  if(clientPromise)return clientPromise;
  clientPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function(m){
    const c=getSupabaseConfig();
    if(!c.url||!c.anonKey)return null;
    return m.createClient(c.url,c.anonKey);
  }).catch(function(){return null;});
  return clientPromise;
}

async function loadAnalytics(courseId){
  const c=await client();
  if(!c)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const session=await c.auth.getSession();
  if(!session?.data?.session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {data,error}=await c.rpc("academy_trainer_analytics",{
    p_course_id:courseId?String(courseId):null
  });
  if(error)return {ok:false,error:String(error.message||error)};
  const payload=data||{};
  return {
    ok:true,
    summary:payload.summary||{},
    courses:Array.isArray(payload.courses)?payload.courses:[],
    groups:Array.isArray(payload.groups)?payload.groups:[],
    students:Array.isArray(payload.students)?payload.students:[]
  };
}

function tone(value){
  const n=Number(value||0);
  return n<50?"red":n<70?"orange":"green";
}
function riskTone(r){return r==="مرتفع"?"red":r==="متوسط"?"orange":"green";}

function metrics(s){
  const total=Number(s.total_students||0);
  const active=Number(s.active_7d||0);
  const high=Number(s.high_risk||0);
  const medium=Number(s.medium_risk||0);
  return '<div class="trainer-analytics-kpis">'+
    '<div class="card analytics-kpi"><span>المتدربون</span><strong>'+total+'</strong><small>سجلات نشطة</small></div>'+
    '<div class="card analytics-kpi success"><span>متوسط الإكمال</span><strong>'+Number(s.avg_progress||0)+'%</strong><small>عبر المقررات المنشورة</small></div>'+
    '<div class="card analytics-kpi"><span>متوسط التقييم</span><strong>'+Number(s.avg_score||0)+'%</strong><small>التقييمات المركزية</small></div>'+
    '<div class="card analytics-kpi danger"><span>عالي الخطورة</span><strong>'+high+'</strong><small>تدخل مباشر</small></div>'+
    '<div class="card analytics-kpi warning"><span>قيد المتابعة</span><strong>'+medium+'</strong><small>تدخل قريب</small></div>'+
    '<div class="card analytics-kpi"><span>نشطون خلال 7 أيام</span><strong>'+active+'</strong><small>آخر نشاط مركزي</small></div>'+
  '</div>';
}

function courseTable(rows){
  if(!rows.length)return '<div class="empty">لا توجد مقررات منشورة مع بيانات طلابية بعد.</div>';
  return '<div class="table-scroll"><table class="table trainer-table"><thead><tr><th>المقرر</th><th>المتدربون</th><th>الإكمال</th><th>التقييم</th><th>عالي الخطورة</th><th>نشطون 7 أيام</th></tr></thead><tbody>'+
    rows.map(r=>'<tr><td><strong>'+esc(r.title||"مقرر")+'</strong></td><td>'+Number(r.students||0)+'</td><td><strong>'+Number(r.avg_progress||0)+'%</strong><div class="progress"><span style="width:'+Number(r.avg_progress||0)+'%"></span></div></td><td><strong>'+Number(r.avg_score||0)+'%</strong></td><td><span class="badge '+(Number(r.high_risk||0)?"red":"green")+'">'+Number(r.high_risk||0)+'</span></td><td>'+Number(r.active_7d||0)+'</td></tr>').join("")+
    '</tbody></table></div>';
}

function groupTable(rows){
  if(!rows.length)return '<div class="empty">لا توجد مجموعات مرتبطة بالمقررات المنشورة.</div>';
  return '<div class="table-scroll"><table class="table trainer-table"><thead><tr><th>المجموعة</th><th>المتدربون</th><th>الإكمال</th><th>التقييم</th><th>عالي الخطورة</th><th>نشاط 7 أيام</th></tr></thead><tbody>'+
    rows.map(r=>'<tr><td><strong>المجموعة '+esc(r.group_no||"—")+'</strong></td><td>'+Number(r.students||0)+'</td><td><strong>'+Number(r.avg_progress||0)+'%</strong><div class="progress"><span style="width:'+Number(r.avg_progress||0)+'%"></span></div></td><td><strong>'+Number(r.avg_score||0)+'%</strong></td><td><span class="badge '+(Number(r.high_risk||0)?"red":"green")+'">'+Number(r.high_risk||0)+'</span></td><td>'+Number(r.active_7d||0)+'</td></tr>').join("")+
    '</tbody></table></div>';
}

function riskStudents(rows){
  if(!rows.length)return '<div class="empty"><h3>لا توجد حالات تحتاج تدخلًا</h3><p class="muted">ممتاز. لا توجد فجوات حرجة في البيانات المركزية الحالية.</p></div>';
  return rows.slice(0,12).map((r,i)=>'<div class="risk-row">'+
    '<div class="risk-rank">'+(i+1)+'</div>'+
    '<div class="risk-person"><strong>'+esc(r.student_name||"متدرب")+'</strong><span class="muted">المجموعة '+esc(r.group_no||"—")+' • '+Number(r.courses||0)+' مقررات</span></div>'+
    '<span class="badge '+riskTone(r.risk)+'">'+esc(r.risk||"—")+'</span>'+
    '<div class="risk-topic"><strong>'+Number(r.avg_progress||0)+'% إكمال</strong><span class="muted">متوسط التقييم '+Number(r.avg_score||0)+'%</span></div>'+
    '<div class="risk-topic"><strong>'+esc(r.last_activity?new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium"}).format(new Date(r.last_activity)):"لا يوجد")+'</strong><span class="muted">آخر نشاط</span></div>'+
  '</div>').join("");
}

export async function trainerAnalyticsView(courseId=""){
  const [local,signals]=await Promise.all([loadAnalytics(courseId||""),fetchTrainerLearningSignals().catch(()=>({ok:false}))]);
  if(!local.ok){
    const label=local.reason==="AUTH_REQUIRED"?"تسجيل الدخول بحساب مدرب/مدير مطلوب":"تعذر الاتصال بالبيانات المركزية";
    return '<div class="page-intro"><span class="eyebrow purple">V3.68 • التحليلات المركزية</span><h2>مركز التحليلات</h2><p>'+label+'</p></div>'+
      '<div class="card"><h3>التحليلات المركزية غير متاحة</h3><p class="muted">'+esc(local.error||local.reason||"تعذر تحميل البيانات.")+'</p></div>';
  }

  const courses=local.courses;
  const signalTopics=signals?.ok?signals.topics:[];
  const signalSummary=signals?.ok?signals.summary:{};
  const signalSection='<section class="card" style="margin-top:14px"><div class="section-title"><div><span class="eyebrow orange">V3.68 • ذكاء النتائج</span><h3>إشارة الاختبارات المركزية</h3><p class="muted">تحليل مباشر لنتائج الاختبارات المسجلة مركزيًا.</p></div><span class="badge blue">'+Number(signalSummary.attempts||0)+' محاولة</span></div>'+
    '<div class="trainer-analytics-kpis"><div class="card analytics-kpi"><span>متوسط الاختبارات</span><strong>'+Number(signalSummary.avg_percent||0)+'%</strong><small>'+Number(signalSummary.passed||0)+' ناجحة</small></div><div class="card analytics-kpi"><span>متدربون اختبروا</span><strong>'+Number(signalSummary.students||0)+'</strong><small>من النتائج المركزية</small></div></div>'+
    '<div class="table-scroll"><table class="table trainer-table"><thead><tr><th>الموضوع</th><th>الدقة</th><th>الإجابات</th><th>الحالة</th></tr></thead><tbody>'+
    (signalTopics.length?signalTopics.slice(0,10).map(t=>'<tr><td><strong>'+esc(t.topic)+'</strong></td><td><strong>'+Number(t.accuracy||0)+'%</strong></td><td>'+Number(t.responses||0)+'</td><td><span class="badge '+tone(t.accuracy)+'">'+(Number(t.accuracy||0)<70?'يحتاج تدريب':'جيد')+'</span></td></tr>').join(""):'<tr><td colspan="4"><div class="empty">لا توجد نتائج اختبارات مركزية بعد.</div></td></tr>')+
    '</tbody></table></div></section>';

  return '<div class="page-intro with-action">'+
    '<div><span class="eyebrow purple">V3.68 • التحليلات المركزية</span><h2>لوحة تحليلات المدرب</h2><p>صورة مركزية لجميع المقررات والمجموعات والمتدربين، مبنية على بيانات Supabase الحالية.</p></div>'+
    '<div class="trainer-analytics-head-actions"><span class="badge green">Supabase • مباشر</span><button class="btn btn-soft" data-trainer-page="tdash">لوحة المدرب</button></div>'+
  '</div>'+
  '<section class="card" style="margin-bottom:14px"><div class="section-title"><div><h3>نطاق التحليل</h3><p class="muted">اختر مقررًا لمقارنة أدائه أو اعرض جميع المقررات.</p></div><button class="btn btn-primary mini-btn" data-v63-refresh>تحديث</button></div>'+
  '<div class="lesson-form-grid"><label>المقرر<select id="v63-course-filter"><option value="">جميع المقررات المنشورة</option>'+courses.map(c=>'<option value="'+esc(c.course_id)+'">'+esc(c.title)+'</option>').join("")+'</select></label><div class="muted" style="align-self:end">المصدر: academy_course_lesson_progress</div></div></section>'+
  '<div id="v68-analytics-body">'+metrics(local.summary)+
  +signalSection
  '<div class="grid-2" style="margin-top:14px"><section class="card"><div class="section-title"><div><h3>المقررات</h3><span class="badge blue">'+courses.length+' مقرر</span></div></div>'+courseTable(courses)+'</section>'+
  '<section class="card"><div class="section-title"><div><h3>المجموعات</h3><span class="badge purple">'+local.groups.length+' مجموعة</span></div></div>'+groupTable(local.groups)+'</section></div>'+
  '<section class="card" style="margin-top:14px"><div class="section-title"><div><span class="eyebrow red">أولوية المدرب</span><h3>المتدربون الذين يحتاجون متابعة</h3><p class="muted">يتم ترتيبهم حسب مستوى الخطورة ومتوسط الإكمال.</p></div><span class="badge red">'+local.students.length+' حالة</span></div><div class="risk-list">'+riskStudents(local.students)+'</div></section>'+
  '<div class="card" style="margin-top:14px"><strong>V3.68:</strong> تم تحويل التحليلات من بيانات Demo إلى بيانات مركزية من Supabase للمقررات المنشورة وتقدم الدروس.</div></div>'+
  '<script></script>';
}

export async function loadAndMountAnalytics(container,initialCourseId=""){
  if(!container)return;
  container.innerHTML='<div class="card"><p class="muted">جاري تحميل التحليلات المركزية…</p></div>';
  let selected=String(initialCourseId||"");
  async function draw(){
    const r=await loadAnalytics(selected);
    if(!r.ok){
      container.innerHTML='<div class="card"><h3>تعذر تحميل التحليلات</h3><p class="muted">'+esc(r.error||r.reason||"تعذر الاتصال.")+'</p></div>';
      return;
    }
    container.innerHTML=metrics(r.summary)+
      '<div class="grid-2" style="margin-top:14px"><section class="card"><div class="section-title"><h3>المقررات</h3><span class="badge blue">'+r.courses.length+' مقرر</span></div>'+courseTable(r.courses)+'</section>'+
      '<section class="card"><div class="section-title"><h3>المجموعات</h3><span class="badge purple">'+r.groups.length+' مجموعة</span></div>'+groupTable(r.groups)+'</section></div>'+
      '<section class="card" style="margin-top:14px"><div class="section-title"><div><span class="eyebrow red">أولوية المدرب</span><h3>المتدربون الذين يحتاجون متابعة</h3></div><span class="badge red">'+r.students.length+' حالة</span></div><div class="risk-list">'+riskStudents(r.students)+'</div></section>';
  }
  await draw();
}