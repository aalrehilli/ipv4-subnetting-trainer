import {getSupabaseConfig} from "./supabase-v30.js?v=473";
import {getQuestionBankStats} from "./question-bank-v32.js?v=473";

let clientPromise=null;
const esc=v=>String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

async function client(){
  if(clientPromise)return clientPromise;
  clientPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function(m){
    const c=getSupabaseConfig();
    if(!c.url||!c.anonKey)return null;
    return m.createClient(c.url,c.anonKey);
  }).catch(function(){return null;});
  return clientPromise;
}

async function central(){
  const c=await client();
  if(!c)return {ok:false};
  const session=await c.auth.getSession();
  if(!session?.data?.session)return {ok:false};
  const {data,error}=await c.rpc("academy_trainer_analytics",{p_course_id:null});
  if(error)return {ok:false,error:error.message};
  return {ok:true,payload:data||{}};
}

function metric(title,value,sub,cls){
  return '<div class="card trainer-v311-summary-card '+(cls||"")+'"><div><span class="muted">'+title+'</span><strong>'+value+'</strong><small>'+sub+'</small></div></div>';
}

export async function trainerDashboardView(){
  const localBank=getQuestionBankStats();
  const remote=await central();
  const s=remote.ok?(remote.payload.summary||{}):{};
  const courses=remote.ok?(remote.payload.courses||[]):[];
  const groups=remote.ok?(remote.payload.groups||[]):[];
  const students=remote.ok?(remote.payload.students||[]):[];
  const source=remote.ok;
  const total=Number(s.total_students||0);
  const high=Number(s.high_risk||0);
  const medium=Number(s.medium_risk||0);
  const progress=Number(s.avg_progress||0);
  const score=Number(s.avg_score||0);
  const active=Number(s.active_7d||0);
  const topRisk=students.slice(0,5);

  return '<div class="page-intro with-action">'+
    '<div><span class="eyebrow blue">V3.71 • لوحة المدرب المركزية</span><h2>مركز قيادة المدرب</h2><p>اللوحة الآن تقرأ مؤشرات المتدربين من البيانات المركزية عند توفرها، مع الاحتفاظ بالبنك المحلي كنسخة تشغيلية.</p></div>'+
    '<div class="trainer-exam-head-actions"><span class="badge '+(source?"green":"orange")+'">'+(source?"Supabase • مباشر":"بيانات محلية")+'</span><button class="btn btn-soft" data-trainer-page="analytics">التحليلات الكاملة</button></div>'+
  '</div>'+
  '<div class="trainer-v36-kpis">'+
    metric("المتدربون",source?total:"—",source?"من السجلات المركزية":"تسجيل الدخول مطلوب")+
    metric("متوسط الإكمال",source?progress+"%":"—",source?"المقررات المنشورة":"—","success")+
    metric("متوسط التقييم",source?score+"%":"—",source?"التقييمات المركزية":"—")+
    metric("عالي الخطورة",source?high:"—",source?"تحتاج تدخلًا مباشرًا":"—","danger")+
    metric("نشطون 7 أيام",source?active:"—",source?"آخر نشاط مسجل":"—")+
  '</div>'+
  '<div class="grid-2" style="margin-top:14px">'+
    '<section class="card"><div class="section-title"><div><span class="eyebrow blue">المقررات</span><h3>أداء المقررات</h3></div><span class="badge blue">'+courses.length+' منشور</span></div>'+
      (courses.length?courses.map(c=>'<div class="stat-row"><span>'+esc(c.title||"مقرر")+'</span><b>'+Number(c.avg_progress||0)+'%</b></div><div class="progress"><span style="width:'+Number(c.avg_progress||0)+'%"></span></div>').join(""):'<div class="empty">لا توجد بيانات مركزية للمقررات المنشورة.</div>')+
    '</section>'+
    '<section class="card"><div class="section-title"><div><span class="eyebrow purple">المجموعات</span><h3>مقارنة المجموعات</h3></div><span class="badge purple">'+groups.length+' مجموعة</span></div>'+
      (groups.length?groups.slice(0,8).map(g=>'<div class="stat-row"><span>المجموعة '+esc(g.group_no||"—")+'</span><b>'+Number(g.avg_progress||0)+'% • '+Number(g.avg_score||0)+'%</b></div>').join(""):'<div class="empty">لا توجد مجموعات مرتبطة ببيانات المقرر.</div>')+
    '</section>'+
  '</div>'+
  '<section class="card" style="margin-top:14px"><div class="section-title"><div><span class="eyebrow red">أولوية اليوم</span><h3>أعلى حالات الخطورة</h3><p class="muted">مرتبة من البيانات المركزية حسب الخطورة ومتوسط الإكمال.</p></div><span class="badge red">'+high+' عالي الخطورة • '+medium+' متوسط</span></div>'+
    (topRisk.length?'<div class="risk-list">'+topRisk.map((r,i)=>'<div class="risk-row"><div class="risk-rank">'+(i+1)+'</div><div class="risk-person"><strong>'+esc(r.student_name||"متدرب")+'</strong><span class="muted">المجموعة '+esc(r.group_no||"—")+'</span></div><span class="badge '+(r.risk==="مرتفع"?"red":"orange")+'">'+esc(r.risk||"—")+'</span><div class="risk-topic"><strong>'+Number(r.avg_progress||0)+'% إكمال</strong><span class="muted">'+Number(r.avg_score||0)+'% تقييم</span></div><button class="btn btn-soft mini-btn" data-student-id="'+esc(r.student_id)+'">Student 360</button></div>').join("")+'</div>':'<div class="empty"><h3>لا توجد حالات خطرة حاليًا</h3><p class="muted">ستظهر هنا تلقائيًا عند توفر تقدم مركزي.</p></div>')+
  '</section>'+
  '<div class="grid-3" style="margin-top:14px">'+
    '<div class="card"><span class="muted">بنك الأسئلة</span><strong style="display:block;font-size:28px">'+localBank.active+'</strong><small class="muted">'+localBank.needsReview+' تحتاج مراجعة</small></div>'+
    '<div class="card"><span class="muted">مؤشر المتابعة</span><strong style="display:block;font-size:28px">'+(source?high+medium:"—")+'</strong><small class="muted">حالات تحتاج قرارًا</small></div>'+
    '<div class="card"><span class="muted">المصدر</span><strong style="display:block;font-size:22px">'+(source?"Supabase":"محلي")+'</strong><small class="muted">'+(source?"مركزي ومتزامن":"بعد تسجيل الدخول يصبح مركزيًا")+'</small></div>'+
  '</div>';
}
