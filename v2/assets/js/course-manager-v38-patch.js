/* IPv4 Academy V3.57 — Universal course navigator */
(function(){
  "use strict";

  const COURSES_KEY="ipv4AcademyV36Courses";
  const BACKUP_KEY="ipv4AcademyV38AllCourses";
  const NEW_KEY="ipv4AcademyV36NewCourseForm";
  const ACTIVE_KEY="ipv4AcademyV36Course";
  const GROUPS=["1","2","3","4","5","6"];

  const esc=function(v){
    return String(v==null?"":v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  };

  function readCourses(){
    try{
      const a=JSON.parse(localStorage.getItem(COURSES_KEY)||"[]");
      return Array.isArray(a)?a:[];
    }catch(e){return [];}
  }

  function migrateCourseSchema(list){
    const now=Date.now();
    return (Array.isArray(list)?list:[]).map(function(c,index){
      c=c||{};
      c.visibility=c.visibility==="hidden"?"hidden":c.visibility==="groups"?"groups":"all";
      c.visibleGroups=Array.isArray(c.visibleGroups)&&c.visibleGroups.length
        ? Array.from(new Set(c.visibleGroups.map(String)))
        : GROUPS.slice();
      c.units=Array.isArray(c.units)?c.units:[];
      c.units=c.units.map(function(u,ui){
        u=u||{};
        u.id=Number(u.id)||ui+1;
        u.status=u.status==="published"?"published":"draft";
        u.lessons=Array.isArray(u.lessons)?u.lessons:[];
        u.lessons=u.lessons.map(function(l,li){
          l=l||{};
          l.id=Number(l.id)||li+1;
          l.status=l.status==="published"?"published":"draft";
          l.duration=Number(l.duration)||20;
          l.type=l.type||"lesson";
          return l;
        });
        return u;
      });
      c.updatedAt=Number(c.updatedAt)||now;
      return c;
    });
  }

  function writeCourses(a){
    const normalized=migrateCourseSchema(a||[]);
    localStorage.setItem(COURSES_KEY,JSON.stringify(normalized));
    localStorage.setItem(BACKUP_KEY,JSON.stringify(normalized));
    return normalized;
  }

  function allCourses(){

    try{
      const a=JSON.parse(localStorage.getItem(BACKUP_KEY)||"null");
      if(Array.isArray(a)&&a.length)return a;
    }catch(e){}
    return migrateCourseSchema(readCourses());
  }

  function studentGroup(){
    const remote=window.__IPV4_SUPABASE_STATUS__||{};
    if(remote.group!==undefined && remote.group!==null && String(remote.group).trim()) return String(remote.group).trim();
    try{
      const s=JSON.parse(localStorage.getItem("ipv4AcademyV2DemoStudent")||"null");
      if(s&&s.group!==undefined&&s.group!==null&&String(s.group).trim()) return String(s.group).trim();
    }catch(e){}
    return String(localStorage.getItem("ipv4AcademyStudentGroup")||"1").trim()||"1";
  }

  function courseVisible(c,group){
    const mode=c&&c.visibility;
    if(mode==="hidden")return false;
    if(mode==="groups"){
      const groups=Array.isArray(c.visibleGroups)?c.visibleGroups.map(String):[];
      return !!group && groups.indexOf(String(group))>=0;
    }
    return true;
  }

  function captureAll(){
    const current=readCourses();
    if(!current.length)return;
    try{
      const existing=JSON.parse(localStorage.getItem(BACKUP_KEY)||"null");
      if(Array.isArray(existing)&&existing.length&&!trainerMode())return;
    }catch(e){}
    localStorage.setItem(BACKUP_KEY,JSON.stringify(migrateCourseSchema(current)));
  }

  function restoreAll(){
    const a=migrateCourseSchema(allCourses());
    if(a.length) writeCourses(a);
  }

  function filterForStudent(){
    const a=migrateCourseSchema(allCourses());
    if(!a.length)return;
    const group=studentGroup();
    const visible=a.filter(function(c){return c&&c.status==="published"&&courseVisible(c,group);});
    localStorage.setItem(COURSES_KEY,JSON.stringify(visible));
  }

  function activeCourse(){
    const id=Number(localStorage.getItem(ACTIVE_KEY)||0);
    return allCourses().find(function(c){return Number(c.id)===id;})||null;
  }

  function trainerMode(){
    const title=document.querySelector(".topbar-title");
    return !!(title&&String(title.textContent||"").indexOf("مركز المدرب")>=0);
  }

  function courseNavButton(){
    return document.querySelector('.sidebar [data-page="courses"]');
  }

  function rerenderCourses(){
    const btn=courseNavButton();
    if(btn){
      btn.click();
      return;
    }
    window.location.hash="courses";
  }

  function visibilityText(c){
    if(c.visibility==="hidden")return "مخفي عن الجميع";
    if(c.visibility==="groups")return "المجموعات: "+((c.visibleGroups||[]).join("، ")||"—");
    return "جميع المجموعات";
  }

  function visibilityTone(c){
    if(c.visibility==="hidden")return "red";
    if(c.visibility==="groups")return "purple";
    return "green";
  }

  function addCourseVisibilityBadge(){
    document.querySelectorAll(".course-manager-card").forEach(function(card){
      if(card.querySelector("[data-v38-visibility-badge]"))return;
      const edit=card.querySelector('[data-course-action="edit"]');
      const top=card.querySelector(".course-manager-top");
      if(!edit||!top)return;
      const course=allCourses().find(function(x){return String(x.id)===String(edit.getAttribute("data-course-id"));});
      if(!course)return;
      const badge=document.createElement("span");
      badge.className="badge "+visibilityTone(course);
      badge.setAttribute("data-v38-visibility-badge","1");
      badge.textContent=visibilityText(course);
      top.appendChild(badge);
    });
  }

  function visibilityHtml(c){
    const mode=c.visibility||"all";
    const selected=Array.isArray(c.visibleGroups)?c.visibleGroups.map(String):GROUPS.slice();
    const groups=GROUPS.map(function(g){
      return '<label class="card" style="padding:11px;display:flex;align-items:center;gap:8px;margin:0;cursor:pointer;min-height:44px">'+
        '<input type="checkbox" name="visibleGroups" value="'+g+'" '+(selected.indexOf(g)>=0?"checked":"")+'>'+
        '<span>المجموعة '+g+'</span></label>';
    }).join("");

    return '<section class="card v38-course-visibility" data-v38-visibility>'+
      '<div class="section-title">'+
        '<div><span class="eyebrow purple">V3.46 • ظهور المقرر</span><h3>من يستطيع رؤية هذا المقرر؟</h3>'+
        '<p class="muted">يمكنك نشر المقرر ثم عرضه لجميع المجموعات أو لمجموعات محددة، أو إخفاؤه عن الجميع دون حذف المحتوى.</p></div>'+
        '<span class="badge '+visibilityTone(c)+'">'+esc(visibilityText(c))+'</span>'+
      '</div>'+
      '<form data-course-visibility-form>'+
        '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">'+
          '<label class="card" style="padding:12px;margin:0;cursor:pointer"><input type="radio" name="visibility" value="all" '+(mode==="all"?"checked":"")+'><strong style="display:block;margin-top:6px">جميع المجموعات</strong><small class="muted">متاح للجميع.</small></label>'+
          '<label class="card" style="padding:12px;margin:0;cursor:pointer"><input type="radio" name="visibility" value="groups" '+(mode==="groups"?"checked":"")+'><strong style="display:block;margin-top:6px">مجموعات محددة</strong><small class="muted">فقط للمجموعات المختارة.</small></label>'+
          '<label class="card" style="padding:12px;margin:0;cursor:pointer"><input type="radio" name="visibility" value="hidden" '+(mode==="hidden"?"checked":"")+'><strong style="display:block;margin-top:6px">مخفي</strong><small class="muted">لا يظهر للمتدربين.</small></label>'+
        '</div>'+
        '<div style="margin-top:14px">'+
          '<div class="muted" style="margin-bottom:8px;font-weight:800">المجموعات المستهدفة</div>'+
          '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">'+groups+'</div>'+
        '</div>'+
        '<div class="course-form-actions"><button class="btn btn-primary" type="submit">حفظ إعدادات الظهور</button><span class="muted">الحالة الحالية: '+(c.status==="published"?"منشور":"مسودة")+'</span></div>'+
      '</form>'+
    '</section>';
  }

  function addUniversalCourseNavigator(){
    if(!trainerMode() || document.querySelector("[data-v47-course-switcher]"))return;
    const c=activeCourse();
    if(!c)return;
    const list=migrateCourseSchema(allCourses());
    const html='<section class="card" data-v47-course-switcher style="margin:0 0 14px;padding:14px 16px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">'+
        '<div><span class="eyebrow blue">V3.47 • المقرر الحالي</span><strong style="display:block;font-size:18px;margin-top:4px">'+esc(c.title)+'</strong></div>'+
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
          '<select data-v47-course-select class="course-selector" style="min-width:260px">'+
            list.map(function(x){return '<option value="'+esc(x.id)+'" '+(Number(x.id)===Number(c.id)?"selected":"")+'>'+esc(x.title)+' — '+esc(x.code||"")+'</option>';}).join("")+
          '</select>'+
          '<button class="btn btn-soft mini-btn" data-v47-course-list>كل المقررات</button>'+
        '</div>'+
      '</div>'+
    '</section>';
    const anchor=document.querySelector(".page-intro");
    if(anchor)anchor.insertAdjacentHTML("beforebegin",html);
    const select=document.querySelector("[data-v47-course-select]");
    if(select&&!select.__v47){
      select.__v47=true;
      select.addEventListener("change",function(){
        const id=select.value;
        localStorage.setItem(ACTIVE_KEY,String(id));
        localStorage.removeItem("ipv4AcademyV36Unit");
        localStorage.removeItem("ipv4AcademyV36Lesson");
        localStorage.removeItem("ipv4AcademyV36UnitForm");
        const nav=courseNavButton();
        if(nav)nav.click();
      });
    }
    const allBtn=document.querySelector("[data-v47-course-list]");
    if(allBtn&&!allBtn.__v47){
      allBtn.__v47=true;
      allBtn.addEventListener("click",function(){
        localStorage.removeItem(ACTIVE_KEY);
        localStorage.removeItem("ipv4AcademyV36Unit");
        localStorage.removeItem("ipv4AcademyV36Lesson");
        localStorage.removeItem("ipv4AcademyV36UnitForm");
        const nav=courseNavButton();
        if(nav)nav.click();
      });
    }
  }

  function enhanceCourseEditor(){
    const hero=document.querySelector(".course-editor-hero");
    if(!hero)return;
    const c=activeCourse();
    if(!c)return;

    if(!document.querySelector("[data-v46-course-overview]")){
      const lessons=c.units.reduce(function(n,u){return n+(Array.isArray(u.lessons)?u.lessons.length:0);},0);
      hero.insertAdjacentHTML("afterend",
        '<section class="card" data-v46-course-overview style="margin-top:14px">'+
          '<div class="section-title"><div><span class="eyebrow blue">V3.46 • إدارة موحدة</span><h3>'+esc(c.title)+'</h3>'+
          '<p class="muted">هذه الأدوات مطبقة على جميع المقررات، وليست على مقرر واحد فقط.</p></div>'+
          '<span class="badge '+visibilityTone(c)+'">'+esc(visibilityText(c))+'</span></div>'+
          '<div class="grid-3">'+
            '<div><div class="muted">الوحدات</div><strong>'+c.units.length+'</strong></div>'+
            '<div><div class="muted">الدروس</div><strong>'+lessons+'</strong></div>'+
            '<div><div class="muted">الحالة</div><strong>'+esc(c.status==="published"?"منشور":c.status==="archived"?"مؤرشف":"مسودة")+'</strong></div>'+
          '</div>'+
        '</section>'
      );
    }

    if(document.querySelector("[data-v38-visibility]"))return;
    hero.insertAdjacentHTML("afterend",visibilityHtml(c));
    const visibility=document.querySelector("[data-v38-visibility]");
    if(visibility && !document.querySelector("[data-v40-roster]")){
      visibility.insertAdjacentHTML("afterend",'<div data-v40-roster data-v40-course-id="'+esc(c.id)+'" style="margin-top:14px"></div>');
      const box=document.querySelector("[data-v40-roster]");
      import("./course-roster-v40.js?v=457").then(function(m){
        if(typeof m.mountCourseRoster==="function")return m.mountCourseRoster(box,String(c.id));
      }).then(function(){
        return import("./course-assessments-v41.js?v=457");
      }).then(function(m){
        if(typeof m.mountCourseAssessments==="function"){
          const assessments=document.createElement("div");
          assessments.setAttribute("data-v41-assessments","1");
          assessments.style.marginTop="14px";
          box.parentElement.appendChild(assessments);
          m.mountCourseAssessments(assessments,c);
        }
      }).catch(function(error){
        if(box)box.innerHTML+='<div class="card" style="margin-top:12px"><p class="muted">تعذر تحميل مكونات المقرر: '+esc(error&&error.message||error)+'</p></div>';
      });
    }
  }

  function ensureNewCourseBuilder(){
    const builder=document.getElementById("course-builder");
    if(!builder)return;
    if(localStorage.getItem(NEW_KEY)==="1"){
      builder.hidden=false;
      if(!builder.querySelector("[data-v38-close-course-form]")){
        const title=builder.querySelector(".section-title");
        if(title){
          const b=document.createElement("button");
          b.type="button";
          b.className="btn btn-ghost mini-btn";
          b.textContent="إلغاء";
          b.setAttribute("data-v38-close-course-form","1");
          title.appendChild(b);
        }
      }
    }
  }

  function filterCourseCards(){
    document.querySelectorAll("[data-course-status]").forEach(function(btn){
      if(btn.__v38Bound)return;
      btn.__v38Bound=true;
      btn.addEventListener("click",function(){
        const status=btn.getAttribute("data-course-status")||"all";
        document.querySelectorAll("[data-course-status]").forEach(function(x){x.classList.toggle("active",x===btn);});
        document.querySelectorAll("[data-course-item-status]").forEach(function(row){
          row.style.display=status==="all"||row.getAttribute("data-course-item-status")===status?"":"none";
        });
      });
    });
  }

  async function manager(){
    return import("./course-manager-v36.js?v=457");
  }

  document.addEventListener("click",function(event){
    const btn=event.target.closest("[data-course-action]");
    if(btn&&btn.getAttribute("data-course-action")==="new"){
      localStorage.setItem(NEW_KEY,"1");
      setTimeout(ensureNewCourseBuilder,0);
    }
    if(btn&&btn.getAttribute("data-course-action")==="close-form"){
      localStorage.removeItem(NEW_KEY);
    }
    const close=event.target.closest("[data-v38-close-course-form]");
    if(close){
      localStorage.removeItem(NEW_KEY);
      const builder=document.getElementById("course-builder");
      if(builder)builder.hidden=true;
    }
    const action=event.target.closest("[data-course-action]");
    if(action&&trainerMode()){
      setTimeout(function(){captureAll();},120);
    }
  },true);

  document.addEventListener("submit",async function(event){
    const form=event.target;
    if(!form)return;

    if(form.id==="new-course-form"){
      event.preventDefault();
      event.stopPropagation();
      try{
        const m=await manager();
        const result=m.handleCourseForm(form);
        if(result&&result.ok)rerenderCourses();
        else if(result&&result.message)window.alert(result.message);
      }catch(error){window.alert(String(error&&error.message||error));}
      return;
    }

    if(form.matches("[data-unit-form]")){
      event.preventDefault();
      event.stopPropagation();
      try{
        const m=await manager();
        const result=m.handleUnitForm(form);
        if(result&&result.ok)rerenderCourses();
        else if(result&&result.message)window.alert(result.message);
      }catch(error){window.alert(String(error&&error.message||error));}
      return;
    }

    if(form.matches("[data-lesson-form]")){
      event.preventDefault();
      event.stopPropagation();
      try{
        const m=await manager();
        const result=m.handleLessonForm(form);
        if(result&&result.ok)rerenderCourses();
        else if(result&&result.message)window.alert(result.message);
      }catch(error){window.alert(String(error&&error.message||error));}
      return;
    }

    if(form.matches("[data-course-visibility-form]")){
      event.preventDefault();
      event.stopPropagation();
      const c=activeCourse();
      if(!c)return;
      const data=new FormData(form);
      const mode=String(data.get("visibility")||"all");
      const groups=Array.from(new Set(data.getAll("visibleGroups").map(String).filter(Boolean)));
      if(mode==="groups"&&!groups.length){
        window.alert("اختر مجموعة واحدة على الأقل عند تحديد الظهور حسب المجموعة.");
        return;
      }
      const all=allCourses();
      const found=all.find(function(x){return Number(x.id)===Number(c.id);});
      if(!found)return;
      found.visibility=mode==="hidden"?"hidden":mode==="groups"?"groups":"all";
      found.visibleGroups=groups.length?groups:GROUPS.slice();
      localStorage.setItem(BACKUP_KEY,JSON.stringify(all));
      writeCourses(all);
      rerenderCourses();
    }
  },true);

  let centralRole="";
  let centralReady=false;
  let centralBusy=false;

  async function syncCentralRole(){
    const role=trainerMode()?"trainer":"student";
    if(role!==centralRole){
      centralRole=role;
      centralReady=false;
    }
    if(centralBusy||centralReady)return;
    centralBusy=true;
    try{
      const m=await import("./course-supabase-v39.js?v=457");
      if(role==="trainer"){
        const result=await m.pullCentralCourses({preserveOnEmpty:true});
        centralReady=true;
        if(result.ok&&result.count){
          const btn=document.querySelector('.sidebar [data-page="courses"]');
          if(btn)btn.click();
        }
      }else{
        const result=await m.pullCentralCourses();
        centralReady=true;
        if(result.ok){
          const btn=document.querySelector('.sidebar [data-page="course"]');
          if(btn)btn.click();
        }
      }
    }catch(e){
      centralReady=true;
    }finally{
      centralBusy=false;
    }
  }

  async function syncMode(){
    if(trainerMode()){
      restoreAll();
      ensureNewCourseBuilder();
      addCourseVisibilityBadge();
      addUniversalCourseNavigator();
      enhanceCourseEditor();
      filterCourseCards();
      if(centralReady){
        try{
          const m=await import("./course-supabase-v39.js?v=457");
          await m.syncTrainerCourses();
        }catch(e){}
      }
    }else{
      filterForStudent();
    }
    syncCentralRole();
  }

  async function bootstrap(){
    try{
      if(!readCourses().length){
        const m=await manager();
        if(typeof m.getCourses==="function")m.getCourses();
      }
    }catch(e){}
    const normalized=migrateCourseSchema(readCourses());
    if(normalized.length) writeCourses(normalized);
    captureAll();
    syncMode();
  }

  let queued=false;
  function observe(){
    if(queued)return;
    queued=true;
    setTimeout(function(){
      queued=false;
      syncMode();
    },60);
  }

  const root=document.getElementById("app")||document.body;
  new MutationObserver(observe).observe(root,{subtree:true,childList:true});
  window.addEventListener("storage",observe);

  bootstrap();
})();
