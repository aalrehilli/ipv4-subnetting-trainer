import {fetchTrainerStudentRoster} from "./supabase-v30.js?v=473";

const esc=v=>String(v==null?"":v)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const riskClass=r=>{
  if(r==="مرتفع")return "red";
  if(r==="متوسط")return "orange";
  if(r==="منخفض")return "green";
  return "purple";
};

const fmtDate=v=>{
  if(!v)return "لا يوجد نشاط";
  try{return new Intl.DateTimeFormat("ar-SA",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v));}
  catch{return "—";}
};

function emptyState(title,desc){
  return '<div class="card" style="border-right:4px solid var(--blue)"><h3>'+esc(title)+'</h3><p class="muted">'+esc(desc)+'</p></div>';
}

export async function trainerStudentsView(filter="",group=""){
  const remote=await fetchTrainerStudentRoster("",group||"");
  if(!remote.ok){
    return '<div class="page-intro"><span class="eyebrow red">V3.71 • المتدربون المركزيون</span><h2>تعذر تحميل قائمة المتدربين</h2><p>يجب استخدام حساب مدرب أو مدير مع اتصال Supabase صالح.</p></div>'+
      '<div class="card" style="border-right:4px solid var(--red)"><strong>المصدر المركزي غير متاح</strong><p class="muted">'+esc(remote.error||remote.reason||"خطأ غير معروف")+'</p></div>';
  }
  const payload=remote.payload||{};
  const students=Array.isArray(payload.students)?payload.students:[];
  const summary=payload.summary||{};
  const groups=Array.isArray(payload.groups)?payload.groups:[];
  const visible=students.filter(s=>!filter||s.risk===filter);
  const total=Number(summary.total_students||students.length||0);

  return '<div class="page-intro with-action">'+
    '<div><span class="eyebrow blue">V3.71 • المتدربون المركزيون</span><h2>إدارة المتدربين</h2><p>هذه القائمة تقرأ مباشرة من ملفات المتدربين في Supabase، وكل زر Student 360 مرتبط بالهوية الحقيقية.</p></div>'+
    '<div class="trainer-students-header-actions"><span class="badge green">Supabase • مباشر</span><span class="badge">'+visible.length+' معروض</span></div>'+
  '</div>'+
  '<div class="trainer-students-summary">'+
    '<div class="card trainer-student-stat"><span>إجمالي المتدربين</span><strong>'+total+'</strong><small>الملفات الفعالة</small></div>'+
    '<div class="card trainer-student-stat"><span>نشطون 7 أيام</span><strong>'+Number(summary.active_7d||0)+'</strong><small>نشاط مركزي</small></div>'+
    '<div class="card trainer-student-stat danger"><span>عالي الخطورة</span><strong>'+Number(summary.high_risk||0)+'</strong><small>بحاجة إلى تدخل</small></div>'+
    '<div class="card trainer-student-stat warning"><span>متوسط الخطورة</span><strong>'+Number(summary.medium_risk||0)+'</strong><small>متابعة</small></div>'+
    '<div class="card trainer-student-stat success"><span>جديد</span><strong>'+Number(summary.new_students||0)+'</strong><small>لا توجد بيانات كافية بعد</small></div>'+
  '</div>'+
  '<div class="card trainer-student-toolbar">'+
    '<div class="trainer-student-search"><label>بحث سريع</label><input id="trainer-search" placeholder="اكتب اسم المتدرب أو رقم المتدرب أو الموضوع..." aria-label="بحث المتدربين"></div>'+
    '<div><label>الحالة</label><select id="trainer-risk"><option value="">كل الحالات</option><option value="مرتفع" '+(filter==="مرتفع"?"selected":"")+'>مرتفع</option><option value="متوسط" '+(filter==="متوسط"?"selected":"")+'>متوسط</option><option value="جديد" '+(filter==="جديد"?"selected":"")+'>جديد</option><option value="منخفض" '+(filter==="منخفض"?"selected":"")+'>منخفض</option></select></div>'+
    '<div><label>المجموعة</label><select id="trainer-group"><option value="">كل المجموعات</option>'+
      groups.map(g=>'<option value="'+esc(g.group_no)+'" '+(String(group)===String(g.group_no)?"selected":"")+'>'+esc(g.group_no==="—"?"بدون مجموعة":"المجموعة "+g.group_no)+'</option>').join("")+
    '</select></div>'+
    '<div class="trainer-filter-actions">'+
      '<button class="filter-chip '+(filter==="مرتفع"?"active":"")+'" data-trainer-risk-chip="مرتفع">عالي الخطورة</button>'+
      '<button class="filter-chip '+(filter==="متوسط"?"active":"")+'" data-trainer-risk-chip="متوسط">متوسط</button>'+
      '<button class="filter-chip '+(filter==="جديد"?"active":"")+'" data-trainer-risk-chip="جديد">جديد</button>'+
      '<button class="filter-chip '+(!filter?"active":"")+'" data-trainer-risk-chip="">الكل</button>'+
    '</div>'+
  '</div>'+
  '<div class="card trainer-student-table-card">'+
    '<div class="trainer-table-head"><div><strong>قائمة المتدربين الحقيقية</strong><span class="muted">المصدر: profiles + التقدم + الاختبارات المركزية</span></div><span class="badge green">'+visible.length+' نتيجة</span></div>'+
    '<div class="table-scroll"><table class="table trainer-table"><thead><tr><th>المتدرب</th><th>المجموعة</th><th>الإتقان</th><th>تقدم الدروس</th><th>الاختبارات</th><th>نقطة الضعف</th><th>الحالة</th><th>آخر نشاط</th><th>الإجراء</th></tr></thead><tbody>'+
    visible.map(s=>{
      const mastery=Number(s.mastery||0), progress=Number(s.progress||0), examAvg=Number(s.examAvg||0), weak=Number(s.weakAccuracy||0);
      return '<tr data-roster-row data-roster-search="'+esc([s.name,s.studentId,s.group,s.weakTopic].join(" "))+'">'+
        '<td><div class="trainer-student-name"><div class="student-mini-avatar">'+esc((s.name||"م").slice(0,1))+'</div><div><strong>'+esc(s.name||"متدرب")+'</strong><small>'+esc(s.studentId||"بدون رقم")+'</small></div></div></td>'+
        '<td><span class="badge">'+esc(s.group||"—")+'</span></td>'+
        '<td><div class="trainer-progress-cell"><div class="progress"><span style="width:'+mastery+'%"></span></div><small>'+mastery+'%</small></div></td>'+
        '<td><strong>'+progress+'%</strong></td>'+
        '<td><strong>'+examAvg+'%</strong><small class="muted"> '+Number(s.examAttempts||0)+' محاولة</small></td>'+
        '<td><span class="badge '+(weak<50&&s.weakTopic!=="—"?"red":weak<70&&s.weakTopic!=="—"?"orange":"green")+'">'+esc(s.weakTopic||"—")+'</span><small class="muted">'+(s.weakTopic!=="—"?weak+"% دقة":"لا نتائج بعد")+'</small></td>'+
        '<td><span class="badge '+riskClass(s.risk)+'">'+esc(s.risk||"—")+'</span><small class="muted">'+esc(s.activity||"—")+'</small></td>'+
        '<td><small class="muted">'+fmtDate(s.lastActivity)+'</small></td>'+
        '<td><button class="btn btn-soft mini-btn" data-student-id="'+esc(s.id)+'">فتح Student 360</button></td>'+
      '</tr>';
    }).join("")+
    '</tbody></table></div>'+
    (visible.length?"":'<div class="empty"><h3>لا توجد نتائج مطابقة</h3><p class="muted">جرّب تغيير الحالة أو المجموعة.</p></div>')+
  '</div>';
}

export async function trainerGroupsView(){
  const remote=await fetchTrainerStudentRoster();
  if(!remote.ok){
    return '<div class="page-intro"><span class="eyebrow red">V3.71 • المجموعات</span><h2>تعذر تحميل المجموعات</h2><p class="muted">'+esc(remote.error||remote.reason||"خطأ غير معروف")+'</p></div>';
  }
  const groups=Array.isArray(remote.payload?.groups)?remote.payload.groups:[];
  const total=Number(remote.payload?.summary?.total_students||0);
  if(!groups.length)return emptyState("لا توجد مجموعات مركزية","ستظهر المجموعات تلقائيًا عند ربط المتدربين ببيانات profiles.");
  return '<div class="page-intro with-action">'+
    '<div><span class="eyebrow purple">V3.71 • المجموعات المركزية</span><h2>مقارنة المجموعات</h2><p>المقارنة مبنية على المتدربين الحقيقيين في Supabase، وليست بيانات تجريبية.</p></div>'+
    '<div><span class="badge green">'+groups.length+' مجموعات</span><span class="badge">'+total+' متدرب</span></div>'+
  '</div>'+
  '<div class="grid-3">'+groups.map(g=>
    '<div class="card"><div class="section-title"><div><span class="eyebrow blue">المجموعة</span><h3>'+esc(g.group_no||"—")+'</h3></div><span class="badge purple">'+Number(g.students||0)+' متدرب</span></div>'+
      '<div class="stat-row"><span>الإتقان العام</span><b>'+Number(g.avg_mastery||0)+'%</b></div><div class="progress"><span style="width:'+Number(g.avg_mastery||0)+'%"></span></div>'+
      '<div class="stat-row"><span>تقدم الدروس</span><b>'+Number(g.avg_progress||0)+'%</b></div>'+
      '<div class="stat-row"><span>متوسط الاختبارات</span><b>'+Number(g.avg_exam||0)+'%</b></div>'+
      '<div class="stat-row"><span>عالي الخطورة</span><b>'+Number(g.high_risk||0)+'</b></div>'+
      '<div class="stat-row"><span>متوسط الخطورة</span><b>'+Number(g.medium_risk||0)+'</b></div>'+
      '<div class="stat-row"><span>الجدد</span><b>'+Number(g.new_students||0)+'</b></div>'+
      '<div class="module-actions" style="margin-top:12px"><button class="btn btn-primary" data-trainer-page="students" data-group="'+esc(g.group_no||"")+'">عرض المتدربين</button></div>'+
    '</div>'
  ).join("")+'</div>';
}
