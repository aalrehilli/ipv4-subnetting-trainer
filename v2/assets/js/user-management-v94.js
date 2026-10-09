import {fetchAdminUsers, updateAdminUser, sendUserPasswordReset} from "./supabase-v30.js?v=505";

let state={summary:{},users:[],query:"",role:"all",status:"all",selectedId:""};

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function roleLabel(role){
  return role==="admin"?"مدير":role==="trainer"?"مدرب":"متدرب";
}
function roleBadge(role){
  const cls=role==="admin"?"purple":role==="trainer"?"blue":"";
  return '<span class="badge '+cls+'">'+roleLabel(role)+'</span>';
}
function statusBadge(active){
  return active?'<span class="badge green">نشط</span>':'<span class="badge red">غير نشط</span>';
}
function formatDate(value){
  if(!value)return "—";
  try{return new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));}catch{return "—";}
}
function initials(name,email){
  const s=String(name||email||"م").trim();
  return esc(s.slice(0,2));
}

function filteredUsers(){
  const q=state.query.trim().toLowerCase();
  return state.users.filter(u=>{
    const text=[u.fullName,u.email,u.studentId,u.groupNo].join(" ").toLowerCase();
    const roleOk=state.role==="all"||u.role===state.role;
    const statusOk=state.status==="all"||(state.status==="active"?u.isActive:!u.isActive);
    return roleOk&&statusOk&&(!q||text.includes(q));
  });
}

function summaryCards(){
  const s=state.summary||{};
  return '<div class="users-kpis">'+
    '<div class="card users-kpi"><span>إجمالي المستخدمين</span><strong>'+Number(s.total||0)+'</strong><small>الحسابات المرتبطة بالمنصة</small></div>'+
    '<div class="card users-kpi blue"><span>المتدربون</span><strong>'+Number(s.students||0)+'</strong><small>حسابات تعليمية</small></div>'+
    '<div class="card users-kpi purple"><span>المدربون</span><strong>'+Number(s.trainers||0)+'</strong><small>حسابات تدريب وإدارة محتوى</small></div>'+
    '<div class="card users-kpi orange"><span>المديرون</span><strong>'+Number(s.admins||0)+'</strong><small>صلاحيات الإدارة</small></div>'+
    '<div class="card users-kpi green"><span>النشطون</span><strong>'+Number(s.active||0)+'</strong><small>حسابات مسموح لها بالدخول</small></div>'+
    '<div class="card users-kpi"><span>مؤكد البريد</span><strong>'+Number(s.confirmed||0)+'</strong><small>حسابات تم تأكيد بريدها</small></div>'+
  '</div>';
}

function usersTable(){
  const rows=filteredUsers().map((u,i)=>
    '<tr data-user-row data-user-id="'+esc(u.id)+'">'+
      '<td><div class="user-cell"><div class="user-avatar">'+initials(u.fullName,u.email)+'</div><div><strong>'+esc(u.fullName||"بدون اسم")+'</strong><small>'+esc(u.email||"بدون بريد")+'</small></div></div></td>'+
      '<td>'+esc(u.studentId||"—")+'</td>'+
      '<td>'+esc(u.groupNo||"—")+'</td>'+
      '<td>'+roleBadge(u.role)+'</td>'+
      '<td>'+statusBadge(u.isActive)+'</td>'+
      '<td>'+(u.confirmed?'<span class="badge green">مؤكد</span>':'<span class="badge orange">غير مؤكد</span>')+'</td>'+
      '<td><small>'+formatDate(u.lastSignInAt)+'</small></td>'+
      '<td><button class="btn btn-soft mini-btn" data-user-edit="'+esc(u.id)+'">إدارة</button></td>'+
    '</tr>'
  ).join("");
  return '<div class="card users-table-card">'+
    '<div class="section-title"><div><h3>قائمة المستخدمين</h3><span class="muted">'+filteredUsers().length+' مستخدم مطابق للفلاتر</span></div><button class="btn btn-soft" data-users-refresh>تحديث</button></div>'+
    '<div class="users-toolbar">'+
      '<div class="trainer-student-search"><label>بحث شامل</label><input id="users-search" value="'+esc(state.query)+'" placeholder="اسم، بريد، رقم متدرب أو مجموعة..."></div>'+
      '<div><label>الدور</label><select id="users-role"><option value="all">كل الأدوار</option><option value="student" '+(state.role==="student"?"selected":"")+'>متدرب</option><option value="trainer" '+(state.role==="trainer"?"selected":"")+'>مدرب</option><option value="admin" '+(state.role==="admin"?"selected":"")+'>مدير</option></select></div>'+
      '<div><label>الحالة</label><select id="users-status"><option value="all">الكل</option><option value="active" '+(state.status==="active"?"selected":"")+'>نشط</option><option value="inactive" '+(state.status==="inactive"?"selected":"")+'>غير نشط</option></select></div>'+
    '</div>'+
    '<div class="table-scroll"><table class="table users-table"><thead><tr><th>المستخدم</th><th>الرقم</th><th>المجموعة</th><th>الدور</th><th>الحالة</th><th>البريد</th><th>آخر دخول</th><th></th></tr></thead><tbody>'+
      (rows||'<tr><td colspan="8"><div class="empty">لا توجد حسابات مطابقة.</div></td></tr>')+
    '</tbody></table></div></div>';
}

function editor(){
  const u=state.users.find(x=>String(x.id)===String(state.selectedId));
  if(!u)return '<div class="card users-empty-editor"><strong>اختر مستخدمًا من الجدول</strong><p class="muted">ستظهر هنا بيانات الحساب وخيارات الإدارة.</p></div>';
  return '<div class="card user-editor">'+
    '<div class="section-title"><div><span class="eyebrow purple">إدارة الحساب</span><h3>'+esc(u.fullName||"بدون اسم")+'</h3><p class="muted">'+esc(u.email||"")+'</p></div><div>'+roleBadge(u.role)+' '+statusBadge(u.isActive)+'</div></div>'+
    '<div class="user-editor-grid">'+
      '<div class="field"><label>الاسم الكامل</label><input id="ue-name" value="'+esc(u.fullName)+'"></div>'+
      '<div class="field"><label>رقم المتدرب</label><input id="ue-student-id" value="'+esc(u.studentId)+'"></div>'+
      '<div class="field"><label>رقم المجموعة</label><input id="ue-group" value="'+esc(u.groupNo)+'"></div>'+
      '<div class="field"><label>الدور</label><select id="ue-role"><option value="student" '+(u.role==="student"?"selected":"")+'>متدرب</option><option value="trainer" '+(u.role==="trainer"?"selected":"")+'>مدرب</option><option value="admin" '+(u.role==="admin"?"selected":"")+'>مدير</option></select></div>'+
      '<div class="field"><label>الحالة</label><select id="ue-active"><option value="true" '+(u.isActive?"selected":"")+'>نشط</option><option value="false" '+(!u.isActive?"selected":"")+'>غير نشط</option></select></div>'+
      '<div class="user-meta-panel"><span>الحساب</span><strong>'+esc(u.confirmed?"البريد مؤكد":"البريد غير مؤكد")+'</strong><small>آخر دخول: '+formatDate(u.lastSignInAt)+'</small><small>التسجيل: '+formatDate(u.createdAt)+'</small></div>'+
    '</div>'+
    '<div class="user-editor-actions">'+
      '<button class="btn btn-primary" data-user-save="'+esc(u.id)+'">حفظ التغييرات</button>'+
      '<button class="btn btn-soft" data-user-reset="'+esc(u.id)+'">إرسال إعادة تعيين كلمة المرور</button>'+
      '<button class="btn btn-danger" data-user-close>إغلاق</button>'+
    '</div>'+
    '<div id="users-message" class="users-message"></div>'+
  '</div>';
}

function view(){
  return '<div class="page-intro with-action">'+
    '<div><span class="eyebrow purple">V3.95 • إدارة المنصة</span><h2>إدارة المستخدمين</h2><p>مركز موحد لمتابعة الحسابات والأدوار والمجموعات وحالة الدخول، مع حماية خاصة بصلاحيات المدير.</p></div>'+
    '<div><span class="badge green">إدارة آمنة</span></div></div>'+
    summaryCards()+
    '<div class="users-layout">'+
      '<div>'+usersTable()+'</div>'+
      '<div id="user-editor-host">'+editor()+'</div>'+
    '</div>'+
    '<div class="card trainer-note-card"><strong>تنبيه:</strong><p class="muted">تعطيل الحساب يمنع تسجيل الدخول دون حذف السجل التعليمي. لا يمكن للمدير تعطيل نفسه أو سحب صلاحية آخر مدير نشط.</p></div>';
}

export async function userManagementView(){
  const r=await fetchAdminUsers();
  if(!r.ok){
    return '<div class="page-intro"><span class="eyebrow red">إدارة المستخدمين</span><h2>تعذر تحميل المستخدمين</h2><p>يلزم حساب مدير نشط للوصول إلى هذه الشاشة.</p></div>'+
      '<div class="card" style="border-right:4px solid var(--red)"><strong>الوصول مرفوض أو المصدر غير متاح</strong><p class="muted">'+esc(r.error||r.reason||"خطأ غير معروف")+'</p></div>';
  }
  const p=r.payload||{};
  state.summary=p.summary||{};
  state.users=Array.isArray(p.users)?p.users:[];
  state.selectedId=state.users.some(u=>String(u.id)===String(state.selectedId))?state.selectedId:"";
  return view();
}

function showMessage(text,ok=false){
  const el=document.getElementById("users-message");
  if(!el)return;
  el.className="users-message "+(ok?"ok":"error");
  el.textContent=text;
}

async function rerender(){
  const host=document.querySelector(".container");
  if(!host)return;
  host.innerHTML='<div class="card"><h3>جاري تحديث المستخدمين…</h3><p class="muted">IPv4 Academy</p></div>';
  const html=await userManagementView();
  host.innerHTML=html;
  bindUsers();
}

export function bindUsers(){
  const search=document.getElementById("users-search");
  if(search)search.addEventListener("input",e=>{state.query=e.target.value; const host=document.querySelector(".container"); if(host){host.innerHTML=view();bindUsers();}});
  const role=document.getElementById("users-role");
  if(role)role.addEventListener("change",e=>{state.role=e.target.value; const host=document.querySelector(".container"); if(host){host.innerHTML=view();bindUsers();}});
  const status=document.getElementById("users-status");
  if(status)status.addEventListener("change",e=>{state.status=e.target.value; const host=document.querySelector(".container"); if(host){host.innerHTML=view();bindUsers();}});
  document.querySelectorAll("[data-user-edit]").forEach(btn=>btn.addEventListener("click",()=>{
    state.selectedId=btn.getAttribute("data-user-edit")||"";
    const host=document.querySelector(".container"); if(host){host.innerHTML=view();bindUsers();}
    document.getElementById("user-editor-host")?.scrollIntoView({behavior:"smooth",block:"start"});
  }));
  document.querySelector("[data-user-close]")?.addEventListener("click",()=>{
    state.selectedId="";
    const host=document.querySelector(".container"); if(host){host.innerHTML=view();bindUsers();}
  });
  document.querySelector("[data-users-refresh]")?.addEventListener("click",()=>rerender().catch(()=>{}));
  document.querySelector("[data-user-save]")?.addEventListener("click",async function(event){
    const btn=event.currentTarget;
    const id=btn.getAttribute("data-user-save")||"";
    btn.disabled=true; btn.textContent="جاري الحفظ…";
    const result=await updateAdminUser({
      id,
      fullName:document.getElementById("ue-name")?.value||"",
      studentId:document.getElementById("ue-student-id")?.value||"",
      groupNo:document.getElementById("ue-group")?.value||"",
      role:document.getElementById("ue-role")?.value||"student",
      isActive:document.getElementById("ue-active")?.value==="true"
    });
    btn.disabled=false; btn.textContent="حفظ التغييرات";
    if(!result.ok){showMessage(result.error||result.reason||"تعذر حفظ التغييرات");return;}
    await rerender();
    const host=document.getElementById("user-editor-host");
    if(host){host.scrollIntoView({behavior:"smooth",block:"start"});}
  });
  document.querySelector("[data-user-reset]")?.addEventListener("click",async btn=>{
    const id=btn.getAttribute("data-user-reset")||"";
    const u=state.users.find(x=>String(x.id)===String(id));
    if(!u?.email){showMessage("لا يوجد بريد إلكتروني لهذا المستخدم.");return;}
    if(!confirm("إرسال رابط إعادة تعيين كلمة المرور إلى "+u.email+"؟"))return;
    btn.disabled=true;btn.textContent="جاري الإرسال…";
    const r=await sendUserPasswordReset(u.email);
    btn.disabled=false;btn.textContent="إرسال إعادة تعيين كلمة المرور";
    showMessage(r.ok?"تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني.":(r.error||"تعذر إرسال رسالة إعادة التعيين."),r.ok);
  });
}
