import {getSupabaseConfig} from "./supabase-v30.js?v=456";

let clientPromise=null;

async function client(){
  if(clientPromise)return clientPromise;
  clientPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function(m){
    const c=getSupabaseConfig();
    if(!c.url||!c.anonKey)return null;
    return m.createClient(c.url,c.anonKey);
  }).catch(function(){return null;});
  return clientPromise;
}

function esc(v){
  return String(v==null?"":v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function riskClass(r){
  return r==="مرتفع"?"red":r==="متوسط"?"orange":"green";
}

function formatDate(value){
  if(!value)return "لا يوجد نشاط مسجل";
  try{
    return new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
  }catch(e){return String(value);}
}

async function roster(courseId,group){
  const c=await client();
  if(!c)return {ok:false,reason:"Supabase غير مهيأ"};
  const session=await c.auth.getSession();
  if(!session?.data?.session)return {ok:false,reason:"تسجيل الدخول مطلوب"};
  const {data,error}=await c.rpc("academy_course_student_roster",{
    p_course_id:String(courseId),
    p_group_no:group?String(group):null
  });
  if(error)return {ok:false,error:error.message};
  return {ok:true,rows:Array.isArray(data)?data:[]};
}

function rowHtml(r){
  const progress=Number(r.progress||0);
  const score=Number(r.avgScore||0);
  return '<tr>'+
    '<td><div class="trainer-student-name"><div class="student-mini-avatar">'+esc(String(r.name||"م").slice(0,1))+'</div><div><strong>'+esc(r.name||"متدرب")+'</strong><small>'+esc(r.completedLessons||0)+' / '+esc(r.totalLessons||0)+' درس</small></div></div></td>'+
    '<td><span class="badge">'+esc(r.group||"—")+'</span></td>'+
    '<td><div class="trainer-progress-cell"><div class="progress"><span style="width:'+progress+'%"></span></div><small>'+progress+'%</small></div></td>'+
    '<td><strong>'+score+'%</strong></td>'+
    '<td><span class="badge '+riskClass(r.risk)+'">'+esc(r.risk||"منخفض")+'</span></td>'+
    '<td><small class="muted">'+esc(formatDate(r.lastActivity))+'</small></td>'+
    '<td><button class="btn btn-soft mini-btn" data-student-id="'+esc(r.id)+'">فتح الملف 360</button></td>'+
  '</tr>';
}

function tableHtml(rows){
  if(!rows.length)return '<div class="empty">لا يوجد متدربون مطابقون لهذا الاختيار.</div>';
  return '<div class="table-scroll"><table class="table trainer-table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>إكمال المقرر</th><th>متوسط التقييم</th><th>الحالة</th><th>آخر نشاط</th><th>الإجراء</th></tr></thead><tbody>'+
    rows.map(rowHtml).join("")+
  '</tbody></table></div>';
}

function metrics(rows){
  const total=rows.length;
  const active=rows.filter(function(r){return r.lastActivity&&new Date(r.lastActivity)>=new Date(Date.now()-7*86400000);}).length;
  const high=rows.filter(function(r){return r.risk==="مرتفع";}).length;
  const avgProgress=total?Math.round(rows.reduce(function(a,r){return a+Number(r.progress||0);},0)/total):0;
  const avgScore=total?Math.round(rows.reduce(function(a,r){return a+Number(r.avgScore||0);},0)/total):0;
  return '<div class="trainer-students-summary">'+
    '<div class="card trainer-student-stat"><span>المتدربون</span><strong>'+total+'</strong><small>السجلات الحالية</small></div>'+
    '<div class="card trainer-student-stat success"><span>نشطون</span><strong>'+active+'</strong><small>آخر 7 أيام</small></div>'+
    '<div class="card trainer-student-stat danger"><span>يحتاجون تدخل</span><strong>'+high+'</strong><small>خطورة مرتفعة</small></div>'+
    '<div class="card trainer-student-stat"><span>متوسط الإكمال</span><strong>'+avgProgress+'%</strong><small>للمقرر</small></div>'+
    '<div class="card trainer-student-stat warning"><span>متوسط التقييم</span><strong>'+avgScore+'%</strong><small>من تقييمات الدروس</small></div>'+
  '</div>';
}

function groups(rows){
  return Array.from(new Set(rows.map(function(r){return String(r.group||"");}).filter(Boolean))).sort(function(a,b){return Number(a)-Number(b);});
}

function setupCard(configured){
  if(configured){
    return '<section class="card" data-v55-setup>'+
      '<div class="section-title"><div><span class="eyebrow green">V3.56 • اتصال البيانات</span><h3>Supabase متصل بالمشروع</h3>'+
      '<p class="muted">بيانات المشروع محفوظة. لإظهار متابعة المتدربين يلزم تسجيل الدخول بحساب مدرب/مدير.</p></div><span class="badge orange">يلزم تسجيل الدخول</span></div>'+
      '<form data-v55-auth-form>'+
        '<div class="lesson-form-grid">'+
          '<label>البريد الإلكتروني<input name="email" type="email" required placeholder="trainer@example.com" autocomplete="username"></label>'+
          '<label>كلمة المرور<input name="password" type="password" required placeholder="••••••••" autocomplete="current-password"></label>'+
        '</div>'+
        '<div class="course-form-actions"><button class="btn btn-primary" type="submit">تسجيل الدخول بالبريد</button><button class="btn btn-soft" type="button" data-v56-github-login>تسجيل الدخول عبر GitHub</button><span data-v55-auth-status class="muted"></span></div>'+
      '</form>'+
    '</section>';
  }
  return '<section class="card" data-v55-setup>'+
    '<div class="section-title"><div><span class="eyebrow orange">V3.55 • إعداد الاتصال</span><h3>Supabase غير مهيأ</h3>'+
    '<p class="muted">أدخل Project URL و Publishable/Anon Key مرة واحدة فقط ثم افحص الاتصال.</p></div><span class="badge orange">غير مهيأ</span></div>'+
    '<form data-v55-supabase-form>'+
      '<label>Supabase Project URL<input name="url" placeholder="https://xxxx.supabase.co" autocomplete="off"></label>'+
      '<label>Anon / Publishable Key<input name="anonKey" placeholder="sb_publishable_... أو eyJ..." autocomplete="off"></label>'+
      '<div class="course-form-actions"><button class="btn btn-primary" type="submit">حفظ وفحص الاتصال</button><span data-v55-status class="muted"></span></div>'+
    '</form>'+
  '</section>';
}

export async function mountCourseRoster(container,courseId){
  if(!container)return;
  container.innerHTML='<div class="card"><div class="section-title"><div><span class="eyebrow green">V3.40 • متدربو المقرر</span><h3>تحميل بيانات المتدربين…</h3></div></div><p class="muted">يتم جلب التقدم والنشاط من Supabase.</p></div>';
  const first=await roster(courseId,"");
  if(!first.ok){
    const configured=await (async function(){
      try{
        const m=await import("./supabase-v30.js?v=456");
        return m.isSupabaseConfigured();
      }catch(e){return false;}
    })();
    container.innerHTML=setupCard(configured)+
      '<div class="card"><div class="section-title"><h3>متدربو المقرر</h3><span class="badge '+(first.reason==="AUTH_REQUIRED"?"orange":"red")+'">'+
        esc(first.reason==="AUTH_REQUIRED"?"تسجيل الدخول مطلوب":"تعذر الاتصال")+
      '</span></div><p class="muted">'+esc(first.error||first.reason||"تعذر تحميل البيانات.")+'</p></div>';

    const cfgForm=container.querySelector("[data-v55-supabase-form]");
    if(cfgForm){
      cfgForm.addEventListener("submit",async function(event){
        event.preventDefault();
        const status=cfgForm.querySelector("[data-v55-status]");
        try{
          const data=new FormData(cfgForm);
          const m=await import("./supabase-v30.js?v=456");
          m.setSupabaseConfig(String(data.get("url")||"").trim(),String(data.get("anonKey")||"").trim());
          const state=await m.getSupabaseStatus();
          if(status)status.textContent=state.message||"تم الحفظ.";
          setTimeout(function(){mountCourseRoster(container,courseId);},250);
        }catch(error){ if(status)status.textContent=String(error&&error.message||error); }
      });
    }

    const github=container.querySelector("[data-v56-github-login]");
    if(github){
      github.addEventListener("click",async function(){
        const status=container.querySelector("[data-v55-auth-status]");
        if(status)status.textContent="جاري التحويل إلى GitHub…";
        try{
          const m=await import("./supabase-v30.js?v=456");
          const result=await m.signInWithGitHub();
          if(!result.ok && status)status.textContent=result.error||result.reason||"تعذر بدء تسجيل الدخول عبر GitHub.";
        }catch(error){
          if(status)status.textContent=String(error&&error.message||error);
        }
      });
    }

    const authForm=container.querySelector("[data-v55-auth-form]");
    if(authForm){
      authForm.addEventListener("submit",async function(event){
        event.preventDefault();
        const status=authForm.querySelector("[data-v55-auth-status]");
        if(status)status.textContent="جاري تسجيل الدخول…";
        try{
          const data=new FormData(authForm);
          const m=await import("./supabase-v30.js?v=456");
          const result=await m.signInWithPassword(String(data.get("email")||"").trim(),String(data.get("password")||""));
          if(!result.ok){
            if(status)status.textContent=result.error||result.reason||"تعذر تسجيل الدخول.";
            return;
          }
          if(status)status.textContent="تم تسجيل الدخول. جاري تحميل المتابعة…";
          setTimeout(function(){mountCourseRoster(container,courseId);},350);
        }catch(error){ if(status)status.textContent=String(error&&error.message||error); }
      });
    }
    return;
  }

  let allRows=first.rows||[];
  const gs=groups(allRows);
  const defaultGroup=container.getAttribute("data-v40-group")||"";
  container.innerHTML='<section class="card v40-course-roster-card">'+
    '<div class="section-title"><div><span class="eyebrow green">V3.40 • المتدربون داخل المقرر</span><h3>متابعة الإكمال والأداء</h3><p class="muted">هذه البيانات مركزية وتُحسب بحسب جلسة المتدرب ومجموعة المقرر.</p></div>'+
    '<button class="btn btn-soft mini-btn" data-v40-roster-refresh>تحديث</button></div>'+
    '<div class="trainer-student-toolbar">'+
      '<div><label>المجموعة</label><select data-v40-group><option value="">كل المجموعات</option>'+gs.map(function(g){return '<option value="'+esc(g)+'" '+(defaultGroup===g?"selected":"")+'>'+esc("المجموعة "+g)+'</option>';}).join("")+'</select></div>'+
      '<div class="muted" style="align-self:end">عدد المجموعات: '+gs.length+'</div>'+
    '</div>'+
    '<div data-v40-roster-body>'+metrics(allRows)+tableHtml(allRows)+'</div>'+
  '</section>';

  async function reload(group){
    const body=container.querySelector("[data-v40-roster-body]");
    if(!body)return;
    body.innerHTML='<p class="muted">جاري تحديث بيانات المتدربين…</p>';
    const result=await roster(courseId,group||"");
    if(!result.ok){
      body.innerHTML='<div class="empty">'+esc(result.error||result.reason||"تعذر التحديث.")+'</div>';
      return;
    }
    allRows=result.rows||[];
    body.innerHTML=metrics(allRows)+tableHtml(allRows);
  }

  const select=container.querySelector("[data-v40-group]");
  select&&select.addEventListener("change",function(){reload(select.value);});
  const refresh=container.querySelector("[data-v40-roster-refresh]");
  refresh&&refresh.addEventListener("click",function(){reload(select?select.value:"");});
}
