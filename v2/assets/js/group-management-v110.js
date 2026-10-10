import {
  adminGroups,adminTrainers,adminCreateGroup,adminAssignGroupTrainer,
  trainerGroups,trainerGroupMembers,trainerAvailableStudents,
  trainerAddStudentToGroup,trainerRemoveStudentFromGroup,
  trainerAssignCourseToGroup,trainerRemoveCourseFromGroup,trainerGroupCourses,publishedCourses
} from "./supabase-v30.js?v=516";

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function injectStyle(){
  if(document.getElementById("group-management-v110-style"))return;
  const s=document.createElement("style");
  s.id="group-management-v110-style";
  s.textContent=".gm110-page{display:grid;gap:16px}.gm110-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;flex-wrap:wrap}.gm110-hero h2{margin:4px 0 8px}.gm110-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.gm110-kpi{padding:18px}.gm110-kpi span{display:block;color:#71869b;font-size:13px}.gm110-kpi strong{display:block;font-size:28px;margin-top:7px}.gm110-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.gm110-card{padding:18px}.gm110-card h3{margin:0 0 8px}.gm110-form{display:grid;gap:12px}.gm110-form-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.gm110-field label{display:block;font-weight:800;font-size:13px;margin-bottom:6px}.gm110-field input,.gm110-field select{width:100%;height:44px;border:1px solid #cbdbea;border-radius:10px;padding:0 11px;background:#fff}.gm110-table-wrap{overflow:auto}.gm110-table{width:100%;border-collapse:collapse}.gm110-table th,.gm110-table td{padding:11px 9px;border-bottom:1px solid #e7eef5;text-align:right;white-space:nowrap}.gm110-table th{font-size:12px;color:#71869b;background:#f7fbff}.gm110-list{display:grid;gap:8px;max-height:360px;overflow:auto}.gm110-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid #e4ecf4;border-radius:12px;background:#fbfdff}.gm110-person strong,.gm110-person small{display:block}.gm110-person small{color:#71869b;margin-top:3px}.gm110-group-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.gm110-group-card{padding:14px;cursor:pointer;text-align:right}.gm110-group-card.active{outline:2px solid #5aa7e8;box-shadow:0 8px 28px rgba(24,93,150,.10)}.gm110-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.gm110-note{padding:11px 12px;border-radius:10px;background:#f4f9fd;color:#5d7287;line-height:1.7}@media(max-width:1100px){.gm110-layout{grid-template-columns:1fr}.gm110-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.gm110-form-grid{grid-template-columns:1fr}.gm110-group-list{grid-template-columns:1fr}}";
  document.head.appendChild(s);
}

async function adminView(){
  const [g,t]=await Promise.all([adminGroups(),adminTrainers()]);
  if(!g.ok)return '<div class="card"><h3>تعذر تحميل المجموعات</h3><p class="muted">'+esc(g.error||g.reason||"")+'</p></div>';
  const groups=g.groups||[], trainers=t.trainers||[];
  const assigned=groups.filter(x=>x.trainer_id).length;
  return '<div class="gm110-page">'+
    '<div class="gm110-hero"><div><span class="eyebrow purple">V4.11 • إدارة المجموعات</span><h2>المجموعات تحت إدارة المدير</h2><p class="muted">المدير ينشئ المجموعة ويحدد المدرب المسؤول عنها. بعد ذلك يدير المدرب المتدربين والمقررات داخل مجموعته.</p></div><span class="badge blue">المدير</span></div>'+
    '<div class="gm110-kpis">'+
      '<div class="card gm110-kpi"><span>إجمالي المجموعات</span><strong>'+groups.length+'</strong></div>'+
      '<div class="card gm110-kpi"><span>مجموعات لديها مدرب</span><strong>'+assigned+'</strong></div>'+
      '<div class="card gm110-kpi"><span>بدون مدرب</span><strong>'+(groups.length-assigned)+'</strong></div>'+
      '<div class="card gm110-kpi"><span>المدربون النشطون</span><strong>'+trainers.length+'</strong></div>'+
    '</div>'+
    '<div class="gm110-layout">'+
      '<section class="card gm110-card"><h3>إنشاء مجموعة جديدة</h3><p class="muted">أنشئ المجموعة ثم عيّن لها مدربًا مباشرة.</p>'+
        '<form id="gm-admin-create" class="gm110-form"><div class="gm110-form-grid">'+
          '<div class="gm110-field"><label>رقم المجموعة</label><input name="group_no" placeholder="مثال: 101" required></div>'+
          '<div class="gm110-field"><label>اسم المجموعة</label><input name="group_name" placeholder="مثال: شبكات 101" required></div>'+
          '<div class="gm110-field"><label>المدرب المسؤول</label><select name="trainer_id"><option value="">-- بدون تعيين --</option>'+trainers.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.full_name)+'</option>').join('')+'</select></div>'+
        '</div><button class="btn btn-primary" type="submit">إنشاء المجموعة</button></form>'+
      '</section>'+
      '<section class="card gm110-card"><h3>آلية إدارة المجموعات</h3><div class="gm110-note"><strong>مدير ← مجموعة ← مدرب ← متدربون ← مقررات مفعلة</strong><br>المدير ينشئ المجموعة ويعيّن المدرب. المدرب لا يرى إلا مجموعاته، ويضيف متدربيه ويحدد المقرر المنشور الذي يفعّل لأعضاء المجموعة.</div></section>'+
    '</div>'+
    '<section class="card gm110-card"><div class="section-title"><div><h3>المجموعات الحالية</h3><p class="muted">يمكن للمدير تغيير المدرب في أي وقت.</p></div><span class="badge green">'+groups.length+' مجموعة</span></div>'+
      '<div class="gm110-table-wrap"><table class="gm110-table"><thead><tr><th>المجموعة</th><th>المدرب</th><th>المتدربون</th><th>المقررات</th><th>تغيير المدرب</th></tr></thead><tbody>'+
      (groups.length?groups.map(x=>'<tr><td><strong>'+esc(x.group_no)+'</strong><small style="display:block;color:#71869b">'+esc(x.group_name)+'</small></td><td>'+esc(x.trainer_name||"غير معيّن")+'</td><td>'+Number(x.student_count||0)+'</td><td>'+Number(x.course_count||0)+'</td><td><select data-gm-admin-trainer="'+esc(x.id)+'"><option value="">-- بدون مدرب --</option>'+trainers.map(tn=>'<option value="'+esc(tn.id)+'" '+(String(tn.id)===String(x.trainer_id||"")?"selected":"")+'>'+esc(tn.full_name)+'</option>').join('')+'</select></td></tr>').join(''):'<tr><td colspan="5"><div class="empty">لا توجد مجموعات حتى الآن.</div></td></tr>')+
      '</tbody></table></div></section>'+
  '</div>';
}

async function trainerView(){
  const [g,students,courses]=await Promise.all([trainerGroups(),trainerAvailableStudents(),publishedCourses()]);
  if(!g.ok)return '<div class="card"><h3>تعذر تحميل مجموعات المدرب</h3><p class="muted">'+esc(g.error||g.reason||"")+'</p></div>';
  const groups=g.groups||[], available=students.students||[], allCourses=courses.courses||[];
  const selectedId=window.__IPV4_GROUP_SELECTED__||groups[0]?.id||"";
  return '<div class="gm110-page">'+
    '<div class="gm110-hero"><div><span class="eyebrow blue">V4.11 • مركز مجموعات المدرب</span><h2>مجموعاتي</h2><p class="muted">المدير يملك إنشاء المجموعات وتعيين المدربين. أنت تدير أعضاء مجموعتك وتفعيل المقرر لهم.</p></div><span class="badge green">'+groups.length+' مجموعات</span></div>'+
    '<div class="gm110-group-list">'+
      (groups.length?groups.map(x=>'<button type="button" class="card gm110-group-card '+(String(x.id)===String(selectedId)?'active':'')+'" data-gm-select-group="'+esc(x.id)+'"><span class="eyebrow purple">المجموعة</span><h3 style="margin:5px 0">'+esc(x.group_no)+'</h3><div class="muted">'+esc(x.group_name)+'</div><div class="gm110-actions"><span class="badge">'+Number(x.student_count||0)+' متدرب</span><span class="badge green">'+Number(x.course_count||0)+' مقرر</span></div></button>').join(''):'<div class="card gm110-card"><h3>لا توجد مجموعات مسندة لك</h3><p class="muted">سيظهر هنا أي مجموعة يعيّنها المدير لك.</p></div>')+
    '</div>'+
    (selectedId?await trainerGroupPanel(selectedId,available,allCourses):'')+
  '</div>';
}

async function trainerGroupPanel(groupId,available,allCourses){
  const [m,c]=await Promise.all([trainerGroupMembers(groupId),trainerGroupCourses(groupId)]);
  if(!m.ok)return '<section class="card gm110-card"><h3>تعذر تحميل المجموعة</h3><p class="muted">'+esc(m.error||m.reason||"")+'</p></section>';
  const members=m.members||[], assigned=c.courses||[];
  const assignedIds=new Set(assigned.map(x=>String(x.id)));
  return '<section class="gm110-layout">'+
    '<div class="card gm110-card">'+
      '<div class="section-title"><div><span class="eyebrow blue">أعضاء المجموعة</span><h3>المتدربون داخل المجموعة</h3></div><span class="badge">'+members.length+' متدرب</span></div>'+
      '<div class="gm110-form-grid" style="grid-template-columns:1fr auto">'+
        '<div class="gm110-field"><label>إضافة متدرب</label><select id="gm-add-student"><option value="">-- اختر متدربًا --</option>'+available.filter(x=>!members.some(m=>String(m.id)===String(x.id))).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.full_name)+' — '+esc(x.student_id||"بدون رقم")+'</option>').join('')+'</select></div>'+
        '<div style="display:flex;align-items:end"><button class="btn btn-primary" type="button" data-gm-add-student="'+esc(groupId)+'">إضافة للمجموعة</button></div>'+
      '</div>'+
      '<div class="gm110-list" style="margin-top:14px">'+
        (members.length?members.map(x=>'<div class="gm110-row"><div class="gm110-person"><strong>'+esc(x.full_name)+'</strong><small>'+esc(x.student_id||"بدون رقم")+' • المجموعة '+esc(x.group_no||"—")+'</small></div><button type="button" class="btn btn-soft mini-btn" data-gm-remove-student="'+esc(groupId)+'" data-student-id="'+esc(x.id)+'">إزالة</button></div>').join(''):'<div class="gm110-note">لم تتم إضافة متدربين لهذه المجموعة بعد.</div>')+
      '</div>'+
    '</div>'+
    '<div class="card gm110-card">'+
      '<div class="section-title"><div><span class="eyebrow purple">المقرر</span><h3>تفعيل المقرر للمجموعة</h3></div><span class="badge green">'+assigned.length+' مفعل</span></div>'+
      '<div class="gm110-form-grid" style="grid-template-columns:1fr auto">'+
        '<div class="gm110-field"><label>مقرر منشور</label><select id="gm-course-select"><option value="">-- اختر مقررًا --</option>'+allCourses.filter(x=>!assignedIds.has(String(x.id))).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+' — '+esc(x.code||"")+'</option>').join('')+'</select></div>'+
        '<div style="display:flex;align-items:end"><button class="btn btn-primary" type="button" data-gm-assign-course="'+esc(groupId)+'">تفعيل للمجموعة</button></div>'+
      '</div>'+
      '<div class="gm110-note" style="margin-top:12px">عند إضافة متدرب إلى المجموعة، يحصل تلقائيًا على جميع المقررات المفعلة للمجموعة. وعند تفعيل مقرر جديد للمجموعة يصبح متاحًا لجميع أعضائها.</div>'+
      '<div class="gm110-list" style="margin-top:14px">'+
        (assigned.length?assigned.map(x=>'<div class="gm110-row"><div class="gm110-person"><strong>'+esc(x.title)+'</strong><small>'+esc(x.code||"")+' • مقرر منشور</small></div><button type="button" class="btn btn-soft mini-btn" data-gm-remove-course="'+esc(groupId)+'" data-course-id="'+esc(x.id)+'">إلغاء التفعيل</button></div>').join(''):'<div class="gm110-note">لا توجد مقررات مفعلة لهذه المجموعة بعد.</div>')+
      '</div>'+
    '</div>'+
  '</section>';
}

export async function groupManagementView(){
  injectStyle();
  const role=String(window.__IPV4_SUPABASE_STATUS__?.role||"");
  return role==="admin"?await adminView():await trainerView();
}

export async function bindGroupManagement(){
  injectStyle();
  const create=document.getElementById("gm-admin-create");
  if(create&&!create.__gm){
    create.__gm=true;
    create.addEventListener("submit",async e=>{
      e.preventDefault();
      const fd=new FormData(create);
      const r=await adminCreateGroup(fd.get("group_no"),fd.get("group_name"),fd.get("trainer_id")||null);
      if(!r.ok){alert(r.error||r.reason||"تعذر إنشاء المجموعة");return;}
      await window.__IPV4_RENDER__?.();
    });
  }
  document.querySelectorAll("[data-gm-admin-trainer]").forEach(sel=>{
    if(sel.__gm)return; sel.__gm=true;
    sel.addEventListener("change",async()=>{
      const r=await adminAssignGroupTrainer(sel.getAttribute("data-gm-admin-trainer"),sel.value||null);
      if(!r.ok){alert(r.error||r.reason||"تعذر تغيير المدرب");return;}
      await window.__IPV4_RENDER__?.();
    });
  });
  document.querySelectorAll("[data-gm-select-group]").forEach(btn=>{
    if(btn.__gm)return; btn.__gm=true;
    btn.addEventListener("click",async()=>{
      window.__IPV4_GROUP_SELECTED__=btn.getAttribute("data-gm-select-group")||"";
      await window.__IPV4_RENDER__?.();
    });
  });
  document.querySelectorAll("[data-gm-add-student]").forEach(btn=>{
    if(btn.__gm)return; btn.__gm=true;
    btn.addEventListener("click",async()=>{
      const select=document.getElementById("gm-add-student");
      const studentId=select?.value||"";
      if(!studentId){alert("اختر متدربًا أولًا.");return;}
      const r=await trainerAddStudentToGroup(btn.getAttribute("data-gm-add-student"),studentId);
      if(!r.ok){alert(r.error||r.reason||"تعذر إضافة المتدرب");return;}
      await window.__IPV4_RENDER__?.();
    });
  });
  document.querySelectorAll("[data-gm-remove-student]").forEach(btn=>{
    if(btn.__gm)return; btn.__gm=true;
    btn.addEventListener("click",async()=>{
      const r=await trainerRemoveStudentFromGroup(btn.getAttribute("data-gm-remove-student"),btn.getAttribute("data-student-id"));
      if(!r.ok){alert(r.error||r.reason||"تعذر إزالة المتدرب");return;}
      await window.__IPV4_RENDER__?.();
    });
  });
  document.querySelectorAll("[data-gm-remove-course]").forEach(btn=>{
    if(btn.__gm)return; btn.__gm=true;
    btn.addEventListener("click",async()=>{
      const r=await trainerRemoveCourseFromGroup(btn.getAttribute("data-gm-remove-course"),btn.getAttribute("data-course-id"));
      if(!r.ok){alert(r.error||r.reason||"تعذر إلغاء تفعيل المقرر");return;}
      await window.__IPV4_RENDER__?.();
    });
  });
  document.querySelectorAll("[data-gm-assign-course]").forEach(btn=>{
    if(btn.__gm)return; btn.__gm=true;
    btn.addEventListener("click",async()=>{
      const select=document.getElementById("gm-course-select");
      const courseId=select?.value||"";
      if(!courseId){alert("اختر مقررًا أولًا.");return;}
      const r=await trainerAssignCourseToGroup(btn.getAttribute("data-gm-assign-course"),courseId);
      if(!r.ok){alert(r.error||r.reason||"تعذر تفعيل المقرر");return;}
      await window.__IPV4_RENDER__?.();
    });
  });
}
