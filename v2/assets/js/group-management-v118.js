import {adminGroups,adminTrainers,adminCreateGroup,adminAssignGroupTrainer,adminUpdateGroup,adminDeleteGroup,trainerGroups,trainerGroupMembers,trainerAvailableStudents,trainerAddStudentToGroup,trainerRemoveStudentFromGroup,trainerAssignCourseToGroup,trainerRemoveCourseFromGroup,trainerGroupCourses,publishedCourses} from "./supabase-v30.js?v=526";

function esc(v){
  return String(v == null ? "" : v)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function addStyle(){
  if(document.getElementById("gm117-style")) return;
  var s=document.createElement("style");
  s.id="gm117-style";
  s.textContent=".gm117-actions{display:flex;gap:6px;flex-wrap:wrap}.gm117-btn{border:1px solid #cbdbea;background:#fff;border-radius:8px;padding:7px 10px;font-weight:800;cursor:pointer}.gm117-edit{color:#0b63ad}.gm117-publish{color:#15743b;background:#effaf3}.gm117-draft{color:#a55d00;background:#fff7e9}.gm117-delete{color:#b12d2d;background:#fff1f1}.gm117-table{width:100%;border-collapse:collapse}.gm117-table th,.gm117-table td{padding:12px 9px;border-bottom:1px solid #e7eef5;text-align:right}.gm117-table th{background:#f6faff;color:#667d92;font-size:13px}.gm117-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.gm117-stat{padding:16px}.gm117-stat span{display:block;color:#71869b}.gm117-stat strong{font-size:28px;display:block;margin-top:5px}.gm117-form{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end}.gm117-field label{display:block;font-weight:800;font-size:13px;margin-bottom:6px}.gm117-field input,.gm117-field select{width:100%;height:44px;border:1px solid #cad9e8;border-radius:10px;padding:0 10px}.gm117-note{padding:12px;background:#f4f9fd;border-radius:10px;line-height:1.7}@media(max-width:900px){.gm117-grid{grid-template-columns:1fr 1fr}.gm117-form{grid-template-columns:1fr 1fr}.gm117-form button{grid-column:1/-1}}@media(max-width:600px){.gm117-grid,.gm117-form{grid-template-columns:1fr}}";
  document.head.appendChild(s);
}

async function adminView(){
  var g=await adminGroups();
  var t=await adminTrainers();
  if(!g.ok) return '<div class="card"><h3>تعذر تحميل المجموعات</h3><p class="muted">'+esc(g.error||g.reason||"")+'</p></div>';
  var groups=g.groups||[];
  var trainers=t.trainers||[];
  window.__IPV4_GROUPS__=groups;

  var rows="";
  for(var i=0;i<groups.length;i++){
    var x=groups[i];
    var published=String(x.status)==="published";
    var trainerOptions='<option value="">بدون مدرب</option>';
    for(var j=0;j<trainers.length;j++){
      var tr=trainers[j];
      trainerOptions+='<option value="'+esc(tr.id)+'" '+(String(tr.id)===String(x.trainer_id||"")?"selected":"")+'>'+esc(tr.full_name)+'</option>';
    }
    rows+='<tr>'+
      '<td><strong>'+esc(x.group_no)+'</strong><small style="display:block;color:#71869b">'+esc(x.group_name)+'</small></td>'+
      '<td><span class="badge '+(published?"green":"orange")+'">'+(published?"منشورة":"مسودة")+'</span></td>'+
      '<td><select data-gm117-trainer="'+esc(x.id)+'">'+trainerOptions+'</select></td>'+
      '<td>'+Number(x.student_count||0)+'</td>'+
      '<td>'+Number(x.course_count||0)+'</td>'+
      '<td><div class="gm117-actions">'+
        '<button type="button" class="gm117-btn gm117-edit" data-gm117-edit="'+esc(x.id)+'">تعديل</button>'+
        (published?'<button type="button" class="gm117-btn gm117-draft" data-gm117-draft="'+esc(x.id)+'">مسودة</button>':'<button type="button" class="gm117-btn gm117-publish" data-gm117-publish="'+esc(x.id)+'">نشر</button>')+
        '<button type="button" class="gm117-btn gm117-delete" data-gm117-delete="'+esc(x.id)+'">حذف</button>'+
      '</div></td>'+
    '</tr>';
  }

  return '<div style="display:grid;gap:16px">'+
    '<div class="page-intro"><span class="eyebrow purple">V4.17 • إدارة المجموعات</span><h2>إدارة المجموعات</h2><p>إنشاء المجموعة وتعيين المدرب والتحكم في النشر والمسودة والحذف.</p></div>'+
    '<div class="gm117-grid">'+
      '<div class="card gm117-stat"><span>إجمالي المجموعات</span><strong>'+groups.length+'</strong></div>'+
      '<div class="card gm117-stat"><span>منشورة</span><strong>'+groups.filter(function(a){return String(a.status)==="published";}).length+'</strong></div>'+
      '<div class="card gm117-stat"><span>مسودات</span><strong>'+groups.filter(function(a){return String(a.status)!=="published";}).length+'</strong></div>'+
      '<div class="card gm117-stat"><span>المدربون</span><strong>'+trainers.length+'</strong></div>'+
    '</div>'+
    '<div class="card">'+
      '<h3>إنشاء مجموعة جديدة</h3>'+
      '<form id="gm117-create" class="gm117-form">'+
      '<div class="gm117-field"><label>رقم المجموعة</label><input name="group_no" placeholder="1001" required></div>'+
      '<div class="gm117-field"><label>اسم المجموعة</label><input name="group_name" placeholder="مبادئ شبكات" required></div>'+
      '<div class="gm117-field"><label>المدرب</label><select name="trainer_id"><option value="">بدون تعيين</option>'+trainers.map(function(a){return '<option value="'+esc(a.id)+'">'+esc(a.full_name)+'</option>';}).join("")+'</select></div>'+
      '<button type="submit" class="btn btn-primary">إنشاء المجموعة</button>'+
      '</form>'+
      '<div class="gm117-note" style="margin-top:12px">المجموعة الجديدة تبدأ كمسودة، ثم يمكن نشرها بعد مراجعة بياناتها.</div>'+
    '</div>'+
    '<div class="card">'+
      '<div class="section-title"><div><h3>المجموعات الحالية</h3></div><span class="badge green">'+groups.length+' مجموعة</span></div>'+
      '<div style="overflow:auto"><table class="gm117-table"><thead><tr><th>المجموعة</th><th>الحالة</th><th>المدرب</th><th>المتدربون</th><th>المقررات</th><th>التحكم</th></tr></thead><tbody>'+
      (rows||'<tr><td colspan="6">لا توجد مجموعات.</td></tr>')+
      '</tbody></table></div>'+
    '</div>'+
  '</div>';
}

async function trainerView(){
  var g=await trainerGroups();
  if(!g.ok) return '<div class="card"><h3>تعذر تحميل مجموعات المدرب</h3><p class="muted">'+esc(g.error||g.reason||"")+'</p></div>';
  var groups=g.groups||[];
  if(!groups.length) return '<div class="page-intro"><span class="eyebrow blue">V4.17</span><h2>مجموعاتي</h2><p>لا توجد مجموعة منشورة مسندة لك حاليًا.</p></div>';

  var id=window.__IPV4_GROUP_SELECTED__||groups[0].id;
  var mem=await trainerGroupMembers(id);
  var stu=await trainerAvailableStudents();
  var pc=await publishedCourses();
  var courses=await trainerGroupCourses(id);
  var members=mem.members||[];
  var available=stu.students||[];
  var assigned=courses.courses||[];

  var groupOptions=groups.map(function(a){return '<option value="'+esc(a.id)+'" '+(String(a.id)===String(id)?"selected":"")+'>'+esc(a.group_no)+' — '+esc(a.group_name)+'</option>';}).join("");
  var studentOptions=available.filter(function(a){return !members.some(function(m){return String(m.id)===String(a.id);});}).map(function(a){return '<option value="'+esc(a.id)+'">'+esc(a.full_name)+' — '+esc(a.student_id||"")+'</option>';}).join("");
  var courseOptions=(pc.courses||[]).filter(function(a){return !assigned.some(function(c){return String(c.id)===String(a.id);});}).map(function(a){return '<option value="'+esc(a.id)+'">'+esc(a.title)+'</option>';}).join("");

  var memberHtml=members.map(function(a){return '<div class="gm117-note" style="display:flex;justify-content:space-between;margin-bottom:8px"><span><strong>'+esc(a.full_name)+'</strong> — '+esc(a.student_id||"")+'</span><button type="button" class="gm117-btn gm117-delete" data-gm117-remove="'+esc(id)+'" data-student="'+esc(a.id)+'">إزالة</button></div>';}).join("");
  var courseHtml=assigned.map(function(a){return '<div class="gm117-note" style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>'+esc(a.title)+'</strong><button type="button" class="gm117-btn gm117-draft" data-gm117-unassign="'+esc(id)+'" data-course="'+esc(a.id)+'">إلغاء التفعيل</button></div>';}).join("");

  return '<div style="display:grid;gap:16px">'+
    '<div class="page-intro"><span class="eyebrow blue">V4.17 • مجموعات المدرب</span><h2>مجموعتي</h2></div>'+
    '<div class="card"><label style="font-weight:800">المجموعة</label><select data-gm117-select style="margin-top:7px">'+groupOptions+'</select></div>'+
    '<div class="card"><h3>المتدربون</h3><div class="gm117-form" style="grid-template-columns:1fr auto"><div class="gm117-field"><label>إضافة متدرب</label><select id="gm117-student"><option value="">اختر المتدرب</option>'+studentOptions+'</select></div><button type="button" class="btn btn-primary" data-gm117-add="'+esc(id)+'">إضافة</button></div><div style="margin-top:12px">'+(memberHtml||'<div class="gm117-note">لا يوجد متدربون.</div>')+'</div></div>'+
    '<div class="card"><h3>المقررات</h3><div class="gm117-form" style="grid-template-columns:1fr auto"><div class="gm117-field"><label>تفعيل مقرر</label><select id="gm117-course"><option value="">اختر المقرر</option>'+courseOptions+'</select></div><button type="button" class="btn btn-primary" data-gm117-assign="'+esc(id)+'">تفعيل</button></div><div style="margin-top:12px">'+(courseHtml||'<div class="gm117-note">لا توجد مقررات مفعلة.</div>')+'</div></div>'+
  '</div>';
}

export async function groupManagementView(){
  addStyle();
  var role=String(window.__IPV4_SUPABASE_STATUS__&&window.__IPV4_SUPABASE_STATUS__.role||"");
  if(role==="admin") return await adminView();
  return await trainerView();
}

export async function bindGroupManagement(){
  addStyle();
  function rerender(){
    if(window.__IPV4_RENDER__) return window.__IPV4_RENDER__();
    window.location.reload();
  }

  var create=document.getElementById("gm117-create");
  if(create && !create.__bound){
    create.__bound=true;
    create.addEventListener("submit",async function(e){
      e.preventDefault();
      var fd=new FormData(create);
      var r=await adminCreateGroup(fd.get("group_no"),fd.get("group_name"),fd.get("trainer_id")||null);
      if(!r.ok){alert(r.error||r.reason||"تعذر إنشاء المجموعة");return;}
      await rerender();
    });
  }

  document.querySelectorAll("[data-gm117-trainer]").forEach(function(el){
    if(el.__bound)return;
    el.__bound=true;
    el.addEventListener("change",async function(){
      var r=await adminAssignGroupTrainer(el.getAttribute("data-gm117-trainer"),el.value||null);
      if(!r.ok){alert(r.error||r.reason||"تعذر تغيير المدرب");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm117-edit]").forEach(function(btn){
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async function(){
      var id=btn.getAttribute("data-gm117-edit");
      var g=(window.__IPV4_GROUPS__||[]).find(function(a){return String(a.id)===String(id);});
      if(!g)return;
      var no=prompt("رقم المجموعة",g.group_no||"");
      if(no===null)return;
      var name=prompt("اسم المجموعة",g.group_name||"");
      if(name===null)return;
      var status=prompt("اكتب draft للمسودة أو published للنشر",g.status||"draft");
      if(status===null)return;
      status=String(status).toLowerCase()==="published"?"published":"draft";
      var trainer=prompt("معرف المدرب، أو اتركه فارغًا",g.trainer_id||"");
      if(trainer===null)return;
      var r=await adminUpdateGroup({groupId:id,groupNo:no,groupName:name,trainerId:String(trainer).trim()||null,status:status});
      if(!r.ok){alert(r.error||r.reason||"تعذر تعديل المجموعة");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm117-publish],[data-gm117-draft]").forEach(function(btn){
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async function(){
      var id=btn.getAttribute("data-gm117-publish")||btn.getAttribute("data-gm117-draft");
      var g=(window.__IPV4_GROUPS__||[]).find(function(a){return String(a.id)===String(id);});
      if(!g)return;
      var status=btn.hasAttribute("data-gm117-publish")?"published":"draft";
      var r=await adminUpdateGroup({groupId:id,groupNo:g.group_no,groupName:g.group_name,trainerId:g.trainer_id||null,status:status});
      if(!r.ok){alert(r.error||r.reason||"تعذر تغيير الحالة");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm117-delete]").forEach(function(btn){
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async function(){
      var id=btn.getAttribute("data-gm117-delete");
      if(!confirm("سيتم حذف المجموعة نهائيًا. هل أنت متأكد؟"))return;
      var r=await adminDeleteGroup(id);
      if(!r.ok){alert(r.error||r.reason||"تعذر حذف المجموعة");return;}
      await rerender();
    });
  });

  var select=document.querySelector("[data-gm117-select]");
  if(select && !select.__bound){
    select.__bound=true;
    select.addEventListener("change",function(){
      window.__IPV4_GROUP_SELECTED__=select.value||"";
      rerender();
    });
  }

  document.querySelectorAll("[data-gm117-add]").forEach(function(btn){
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async function(){
      var student=document.getElementById("gm117-student");
      var studentId=student?student.value:"";
      if(!studentId){alert("اختر متدربًا.");return;}
      var r=await trainerAddStudentToGroup(btn.getAttribute("data-gm117-add"),studentId);
      if(!r.ok){alert(r.error||r.reason||"تعذر إضافة المتدرب");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm117-remove]").forEach(function(btn){
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async function(){
      var r=await trainerRemoveStudentFromGroup(btn.getAttribute("data-gm117-remove"),btn.getAttribute("data-student"));
      if(!r.ok){alert(r.error||r.reason||"تعذر إزالة المتدرب");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm117-assign]").forEach(function(btn){
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async function(){
      var course=document.getElementById("gm117-course");
      var courseId=course?course.value:"";
      if(!courseId){alert("اختر المقرر.");return;}
      var r=await trainerAssignCourseToGroup(btn.getAttribute("data-gm117-assign"),courseId);
      if(!r.ok){alert(r.error||r.reason||"تعذر تفعيل المقرر");return;}
      await rerender();
    });
  });

  document.querySelectorAll("[data-gm117-unassign]").forEach(function(btn){
    if(btn.__bound)return;
    btn.__bound=true;
    btn.addEventListener("click",async function(){
      var r=await trainerRemoveCourseFromGroup(btn.getAttribute("data-gm117-unassign"),btn.getAttribute("data-course"));
      if(!r.ok){alert(r.error||r.reason||"تعذر إلغاء التفعيل");return;}
      await rerender();
    });
  });
}
