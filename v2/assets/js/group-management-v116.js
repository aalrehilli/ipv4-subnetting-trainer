import {
  adminGroups,
  adminTrainers,
  adminCreateGroup,
  adminAssignGroupTrainer,
  adminUpdateGroup,
  adminDeleteGroup,
  trainerGroups,
  trainerGroupMembers,
  trainerAvailableStudents,
  trainerAddStudentToGroup,
  trainerRemoveStudentFromGroup,
  trainerAssignCourseToGroup,
  trainerRemoveCourseFromGroup,
  trainerGroupCourses,
  publishedCourses
} from "./supabase-v30.js?v=525";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[m]));

function styleOnce(){
  if(document.getElementById("gm116-style")) return;
  const s=document.createElement("style");
  s.id="gm116-style";
  s.textContent=
    ".gm116{display:grid;gap:16px}.gm116 .card{padding:18px}.gm116-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.gm116-stat{padding:16px}.gm116-stat span{display:block;color:#71869b;font-size:13px}.gm116-stat strong{display:block;font-size:28px;margin-top:6px}.gm116-table{width:100%;border-collapse:collapse}.gm116-table th,.gm116-table td{padding:12px 10px;border-bottom:1px solid #e6eef6;text-align:right;vertical-align:middle}.gm116-table th{background:#f6faff;color:#63798e;font-size:13px}.gm116-actions{display:flex;gap:6px;flex-wrap:wrap}.gm116-btn{border:1px solid #cddcea;background:#fff;border-radius:9px;padding:7px 11px;font-weight:800;cursor:pointer}.gm116-edit{color:#0b63ad}.gm116-publish{color:#167642;background:#f0faf3}.gm116-draft{color:#a45c00;background:#fff7e9}.gm116-delete{color:#b42d2d;background:#fff1f1}.gm116-form{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end}.gm116-field label{display:block;font-weight:800;font-size:13px;margin-bottom:6px}.gm116-field input,.gm116-field select{width:100%;height:44px;border:1px solid #cad9e8;border-radius:10px;padding:0 10px;background:#fff}.gm116-note{background:#f3f8fc;border-radius:12px;padding:12px;line-height:1.8}.gm116-row-actions{display:flex;gap:6px;flex-wrap:wrap}.gm116-empty{text-align:center;padding:28px;color:#72879a}@media(max-width:1050px){.gm116-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gm116-form{grid-template-columns:1fr 1fr}.gm116-form button{grid-column:1/-1}}@media(max-width:700px){.gm116-grid{grid-template-columns:1fr}.gm116-form{grid-template-columns:1fr}.gm116-form button{grid-column:auto}}";
  document.head.appendChild(s);
}

async function adminView(){
  const [gr,tr] = await Promise.all([adminGroups(),adminTrainers()]);
  if(!gr.ok){
    return '<div class="card"><h3>تعذر تحميل المجموعات</h3><p class="muted">'+esc(gr.error||gr.reason||"خطأ غير معروف")+'</p></div>';
  }
  const groups=gr.groups||[];
  const trainers=tr.trainers||[];
  window.__IPV4_GROUPS__=groups;
  return '<div class="gm116">'+
    '<div class="page-intro"><span class="eyebrow purple">V4.16 • إدارة المجموعات</span><h2>إدارة المجموعات</h2><p>المدير ينشئ المجموعة ويحدد المدرب ويقرر متى تُنشر أو تبقى مسودة.</p></div>'+
    '<div class="gm116-grid">'+
      '<div class="card gm116-stat"><span>إجمالي المجموعات</span><strong>'+groups.length+'</strong></div>'+
      '<div class="card gm116-stat"><span>منشورة</span><strong>'+groups.filter(g=>g.status==="published").length+'</strong></div>'+
      '<div class="card gm116-stat"><span>مسودات</span><strong>'+groups.filter(g=>g.status!=="published").length+'</strong></div>'+
      '<div class="card gm116-stat"><span>المدربون النشطون</span><strong>'+trainers.length+'</strong></div>'+
    '</div>'+
    '<div class="card">'+
      '<div class="section-title"><div><h3>إنشاء مجموعة</h3><p class="muted">رقم المجموعة يجب أن يكون فريدًا.</p></div></div>'+
      '<form id="gm116-create" class="gm116-form">'+
        '<div class="gm116-field"><label>رقم المجموعة</label><input name="group_no" required placeholder="1001"></div>'+
        '<div class="gm116-field"><label>اسم المجموعة</label><input name="group_name" required placeholder="مبادئ شبكات"></div>'+
        '<div class="gm116-field"><label>المدرب</label><select name="trainer_id"><option value="">بدون تعيين</option>'+trainers.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.full_name)+'</option>').join("")+'</select></div>'+
        '<button class="btn btn-primary" type="submit">إنشاء المجموعة</button>'+
      '</form>'+
      '<div class="gm116-note" style="margin-top:12px">الحالة الافتراضية بعد الإنشاء: <strong>مسودة</strong>. انشرها بعد التأكد من الرقم والاسم والمدرب.</div>'+
    '</div>'+
    '<div class="card">'+
      '<div class="section-title"><div><h3>المجموعات الحالية</h3></div><span class="badge green">'+groups.length+' مجموعة</span></div>'+
      '<div style="overflow:auto"><table class="gm116-table"><thead><tr><th>المجموعة</th><th>الحالة</th><th>المدرب</th><th>المتدربون</th><th>المقررات</th><th>عناصر التحكم</th></tr></thead><tbody>'+
      (groups.length ? groups.map(g=>{
        const pub=g.status==="published";
        return '<tr>'+
          '<td><strong>'+esc(g.group_no)+'</strong><small style="display:block;color:#71869b">'+esc(g.group_name)+'</small></td>'+
          '<td><span class="badge '+(pub?"green":"orange")+'">'+(pub?"منشورة":"مسودة")+'</span></td>'+
          '<td><select data-gm116-trainer="'+esc(g.id)+'"><option value="">بدون مدرب</option>'+trainers.map(t=>'<option value="'+esc(t.id)+'" '+(String(t.id)===String(g.trainer_id||"")?"selected":"")+'>'+esc(t.full_name)+'</option>').join("")+'</select></td>'+
          '<td>'+Number(g.student_count||0)+'</td>'+
          '<td>'+Number(g.course_count||0)+'</td>'+
          '<td><div class="gm116-actions">'+
            '<button type="button" class="gm116-btn gm116-edit" data-gm116-edit="'+esc(g.id)+'">تعديل</button>'+
            (pub?'<button type="button" class="gm116-btn gm116-draft" data-gm116-draft="'+esc(g.id)+'">مسودة</button>':'<button type="button" class="gm116-btn gm116-publish" data-gm116-publish="'+esc(g.id)+'">نشر</button>')+
            '<button type="button" class="gm116-btn gm116-delete" data-gm116-delete="'+esc(g.id)+'">حذف</button>'+
          '</div></td>'+
        '</tr>';
      }).join("") : '<tr><td colspan="6" class="gm116-empty">لا توجد مجموعات.</td></tr>')+
      '</tbody></table></div>'+
    '</div>'+
  '</div>';
}

async function trainerView(){
  const [gr,st,co]=await Promise.all([trainerGroups(),trainerAvailableStudents(),publishedCourses()]);
  if(!gr.ok) return '<div class="card"><h3>تعذر تحميل مجموعات المدرب</h3><p class="muted">'+esc(gr.error||gr.reason||"")+'</p></div>';
  const groups=gr.groups||[];
  const available=st.students||[];
  const courses=co.courses||[];
  const selected=window.__IPV4_GROUP_SELECTED__ || groups[0]?.id || "";
  if(!selected){
    return '<div class="gm116"><div class="page-intro"><span class="eyebrow blue">V4.16 • مجموعات المدرب</span><h2>مجموعاتي</h2><p class="muted">لا توجد مجموعة منشورة مسندة لك حاليًا.</p></div></div>';
  }
  const [mr,cr]=await Promise.all([trainerGroupMembers(selected),trainerGroupCourses(selected)]);
  const members=mr.members||[];
  const assigned=cr.courses||[];
  return '<div class="gm116">'+
    '<div class="page-intro"><span class="eyebrow blue">V4.16 • مجموعات المدرب</span><h2>مجموعتي</h2><p>أضف المتدربين وفعّل المقرر المطلوب.</p></div>'+
    '<div class="card"><div class="section-title"><div><h3>المجموعة</h3></div><select data-gm116-select>'+groups.map(g=>'<option value="'+esc(g.id)+'" '+(String(g.id)===String(selected)?"selected":"")+'>'+esc(g.group_no)+' — '+esc(g.group_name)+'</option>').join("")+'</select></div></div>'+
    '<div class="card">'+
      '<h3>المتدربون</h3>'+
      '<div class="gm116-form" style="grid-template-columns:1fr auto">'+
        '<div class="gm116-field"><label>إضافة متدرب</label><select id="gm116-student"><option value="">اختر المتدرب</option>'+available.filter(x=>!members.some(m=>String(m.id)===String(x.id))).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.full_name)+' — '+esc(x.student_id||"")+'</option>').join("")+'</select></div>'+
        '<button type="button" class="btn btn-primary" data-gm116-add="'+esc(selected)+'">إضافة</button>'+
      '</div>'+
      '<div style="margin-top:14px">'+(members.length?members.map(m=>'<div class="gm116-note" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px"><span><strong>'+esc(m.full_name)+'</strong> — '+esc(m.student_id||"")+'</span><button type="button" class="gm116-btn gm116-delete" data-gm116-remove="'+esc(selected)+'" data-student="'+esc(m.id)+'">إزالة</button></div>').join(""):'<div class="gm116-note">لا يوجد متدربون في المجموعة.</div>')+'</div>'+
    '</div>'+
    '<div class="card"><h3>المقررات</h3>'+
      '<div class="gm116-form" style="grid-template-columns:1fr auto">'+
        '<div class="gm116-field"><label>تفعيل مقرر</label><select id="gm116-course"><option value="">اختر المقرر</option>'+courses.filter(c=>!assigned.some(a=>String(a.id)===String(c.id))).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.title)+'</option>').join("")+'</select></div>'+
        '<button type="button" class="btn btn-primary" data-gm116-assign="'+esc(selected)+'">تفعيل</button>'+
      '</div>'+
      '<div style="margin-top:14px">'+(assigned.length?assigned.map(c=>'<div class="gm116-note" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><span><strong>'+esc(c.title)+'</strong></span><button type="button" class="gm116-btn gm116-draft" data-gm116-unassign="'+esc(selected)+'" data-course="'+esc(c.id)+'">إلغاء التفعيل</button></div>').join(""):'<div class="gm116-note">لا توجد مقررات مفعلة.</div>')+'</div>'+
    '</div>'+
  '</div>';
}

export async function groupManagementView(){
  styleOnce();
  return String(window.__IPV4_SUPABASE_STATUS__?.role||"")==="admin" ? await adminView() : await trainerView();
}

export async function bindGroupManagement(){
  styleOnce();
  const rerender=()=>window.__IPV4_RENDER__ ? window.__IPV4_RENDER__() : location.reload();

  const create=document.getElementById("gm116-create");
  if(create && !create.__bound){
    create.__bound=true;
    create.addEventListener("submit",async e=>{
      e.preventDefault();
      const fd=new FormData(create);
      const r=await adminCreateGroup(fd.get("group_no"),fd.get("group_name"),fd.get("trainer_id")||null);
      if(!r.ok){alert(r.error||r.reason||"تعذر إنشاء المجموعة");return;}
      await rerender();
    });
  }

  document.querySelectorAll("[data-gm116-trainer]").forEach(el=>{
    if(el.__bound)return;
    el.__bound=true;
    el.addEventListener("change",async()=>{
      const r=await adminAssignGroupTrainer(el.getAttribute("data-gm116-trainer"),el.value||null);
      if(!r.ok){alert(r.error||r.reason||"تعذر تغيير المدرب");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm116-edit]").forEach(btn=>{
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async()=>{
      const id=btn.getAttribute("data-gm116-edit");
      const g=(window.__IPV4_GROUPS__||[]).find(x=>String(x.id)===String(id));
      if(!g)return;
      const no=prompt("رقم المجموعة",g.group_no||"");
      if(no===null)return;
      const name=prompt("اسم المجموعة",g.group_name||"");
      if(name===null)return;
      const status=(prompt("الحالة: draft للمسودة أو published للنشر",g.status||"draft")||"draft").toLowerCase();
      const trainer=prompt("معرّف المدرب (اتركه فارغًا لعدم التعيين)",g.trainer_id||"");
      if(trainer===null)return;
      const r=await adminUpdateGroup({groupId:id,groupNo:no,groupName:name,trainerId:trainer.trim()||null,status:status==="published"?"published":"draft"});
      if(!r.ok){alert(r.error||r.reason||"تعذر تعديل المجموعة");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm116-publish],[data-gm116-draft]").forEach(btn=>{
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async()=>{
      const id=btn.getAttribute("data-gm116-publish")||btn.getAttribute("data-gm116-draft");
      const g=(window.__IPV4_GROUPS__||[]).find(x=>String(x.id)===String(id));
      if(!g)return;
      const status=btn.hasAttribute("data-gm116-publish")?"published":"draft";
      const r=await adminUpdateGroup({groupId:id,groupNo:g.group_no,groupName:g.group_name,trainerId:g.trainer_id||null,status});
      if(!r.ok){alert(r.error||r.reason||"تعذر تغيير حالة المجموعة");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm116-delete]").forEach(btn=>{
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async()=>{
      const id=btn.getAttribute("data-gm116-delete");
      if(!confirm("سيتم حذف المجموعة وعضويتها وتخصيصات المقررات المرتبطة بها. هل أنت متأكد؟"))return;
      const r=await adminDeleteGroup(id);
      if(!r.ok){alert(r.error||r.reason||"تعذر حذف المجموعة");return;}
      await rerender();
    });
  });

  const groupSelect=document.querySelector("[data-gm116-select]");
  if(groupSelect && !groupSelect.__bound){
    groupSelect.__bound=true;
    groupSelect.addEventListener("change",()=>{
      window.__IPV4_GROUP_SELECTED__=groupSelect.value||"";
      rerender();
    });
  }

  document.querySelectorAll("[data-gm116-add]").forEach(btn=>{
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async()=>{
      const student=document.getElementById("gm116-student")?.value||"";
      if(!student){alert("اختر متدربًا.");return;}
      const r=await trainerAddStudentToGroup(btn.getAttribute("data-gm116-add"),student);
      if(!r.ok){alert(r.error||r.reason||"تعذر إضافة المتدرب");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm116-remove]").forEach(btn=>{
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async()=>{
      const r=await trainerRemoveStudentFromGroup(btn.getAttribute("data-gm116-remove"),btn.getAttribute("data-student"));
      if(!r.ok){alert(r.error||r.reason||"تعذر إزالة المتدرب");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm116-assign]").forEach(btn=>{
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async()=>{
      const course=document.getElementById("gm116-course")?.value||"";
      if(!course){alert("اختر مقررًا.");return;}
      const r=await trainerAssignCourseToGroup(btn.getAttribute("data-gm116-assign"),course);
      if(!r.ok){alert(r.error||r.reason||"تعذر تفعيل المقرر");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm116-unassign]").forEach(btn=>{
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async()=>{
      const r=await trainerRemoveCourseFromGroup(btn.getAttribute("data-gm116-unassign"),btn.getAttribute("data-course"));
      if(!r.ok){alert(r.error||r.reason||"تعذر إلغاء التفعيل");return;}
      await rerender();
    });
  });
}
