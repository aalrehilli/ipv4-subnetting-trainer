import {getSupabaseConfig} from "./supabase-v30.js?v=464";

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

function icon(type){return type==="danger"?"!":type==="success"?"✓":type==="warning"?"⚠":"✦";}
function tone(type){return type==="danger"?"red":type==="success"?"green":type==="warning"?"orange":"purple";}

async function studentRows(){
  const c=await client(); if(!c)return {ok:false,reason:"Supabase غير مهيأ"};
  const session=await c.auth.getSession(); if(!session?.data?.session)return {ok:false,reason:"تسجيل الدخول مطلوب"};
  const {data,error}=await c.from("student_notifications")
    .select("id,title,message,notification_type,created_at,read_at,dedupe_key")
    .eq("user_id",session.data.session.user.id)
    .order("created_at",{ascending:false}).limit(60);
  if(error)return {ok:false,error:error.message};
  return {ok:true,rows:data||[]};
}

async function trainerRows(){
  const c=await client(); if(!c)return {ok:false,reason:"Supabase غير مهيأ"};
  const session=await c.auth.getSession(); if(!session?.data?.session)return {ok:false,reason:"تسجيل الدخول مطلوب"};
  const profile=await c.from("profiles").select("role").eq("id",session.data.session.user.id).maybeSingle();
  if(!["trainer","admin"].includes(String(profile.data?.role||"")))return {ok:false,reason:"صلاحية المدرب مطلوبة"};
  const {data,error}=await c.rpc("academy_trainer_analytics",{p_course_id:null});
  if(error)return {ok:false,error:error.message};
  const students=Array.isArray(data?.students)?data.students:[];
  const rows=[];
  students.slice(0,12).forEach(function(s,i){
    rows.push({
      id:"risk:"+s.student_id,
      type:s.risk==="مرتفع"?"danger":"warning",
      title:"متدرب يحتاج متابعة",
      message:(s.student_name||"متدرب")+" — المجموعة "+(s.group_no||"—")+"، الإكمال "+Number(s.avg_progress||0)+"%، التقييم "+Number(s.avg_score||0)+"%.",
      created_at:s.last_activity||new Date().toISOString(),
      read_at:null,
      page:"students"
    });
  });
  return {ok:true,rows};
}

async function markRead(id){
  const c=await client(); if(!c)return;
  const session=await c.auth.getSession(); if(!session?.data?.session)return;
  await c.from("student_notifications").update({read_at:new Date().toISOString()})
    .eq("id",id).eq("user_id",session.data.session.user.id);
}

export async function notificationsV64View(role){
  const result=role==="student"?await studentRows():await trainerRows();
  if(!result.ok){
    return '<div class="page-intro"><span class="eyebrow '+(role==="student"?"purple":"orange")+'">V3.64 • الإشعارات المركزية</span><h2>مركز الإشعارات</h2><p>'+esc(result.reason||result.error||"تعذر تحميل الإشعارات.")+'</p></div>'+
      '<div class="card"><h3>البيانات المركزية غير متاحة</h3><p class="muted">تحقق من تسجيل الدخول والاتصال بـSupabase.</p></div>';
  }

  const rows=result.rows||[];
  const unread=rows.filter(x=>!x.read_at).length;
  return '<div class="page-intro with-action"><div><span class="eyebrow '+(role==="student"?"purple":"orange")+'">V3.64 • الإشعارات المركزية</span><h2>'+(role==="student"?"مركز إشعاراتك":"مركز إشعارات المدرب")+'</h2><p>إشعارات مبنية على البيانات المركزية الحالية وليست على Demo.</p></div><div><span class="badge '+(unread?"red":"green")+'">'+unread+' غير مقروء</span></div></div>'+
    '<div class="notification-summary-grid"><div class="card"><div class="muted">الإجمالي</div><div class="kpi-value">'+rows.length+'</div><div class="muted">إشعارات حالية</div></div><div class="card"><div class="muted">غير مقروء</div><div class="kpi-value">'+unread+'</div><div class="muted">تحتاج انتباهًا</div></div><div class="card"><div class="muted">المصدر</div><div class="kpi-value" style="font-size:20px">Supabase</div><div class="muted">مركزي</div></div></div>'+
    '<div class="section-title"><h3>الأحدث</h3><button class="btn btn-soft" data-v64-notification-refresh>تحديث</button></div>'+
    '<div class="notification-list">'+(rows.length?rows.map(function(x){
      const t=x.notification_type||x.type||"info";
      return '<article class="notification-item '+(x.read_at?"read":"unread")+'"><div class="notification-icon '+tone(t)+'">'+icon(t)+'</div><div class="notification-body"><div class="notification-top"><div><strong>'+esc(x.title||"تنبيه")+'</strong><span class="badge '+tone(t)+'">'+(x.read_at?"مقروء":"جديد")+'</span></div><small>'+new Date(x.created_at||Date.now()).toLocaleString("ar-SA",{dateStyle:"medium",timeStyle:"short"})+'</small></div><p>'+esc(x.message||"")+'</p>'+(role==="student"&&x.id?'<div class="notification-actions"><button class="btn btn-soft mini-btn" data-v64-read="'+esc(x.id)+'">'+(x.read_at?"تم الاطلاع":"تعليم كمقروء")+'</button></div>':"")+'</div></article>';
    }).join(""):'<div class="card notification-empty"><div class="notification-empty-icon">✓</div><h3>لا توجد إشعارات</h3><p class="muted">لا توجد تنبيهات مركزية حالية.</p></div>')+'</div>';
}

export function bindCentralNotifications(){
  document.querySelectorAll("[data-v64-read]").forEach(function(btn){
    btn.addEventListener("click",async function(){
      await markRead(btn.getAttribute("data-v64-read"));
      location.reload();
    });
  });
  document.querySelectorAll("[data-v64-notification-refresh]").forEach(function(btn){
    btn.addEventListener("click",function(){location.reload();});
  });
}
