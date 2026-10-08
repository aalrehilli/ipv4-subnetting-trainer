import {getSupabaseConfig} from "./supabase-v30.js?v=465";

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
async function rpc(name,args){
  const c=await client();
  if(!c)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const session=await c.auth.getSession();
  if(!session?.data?.session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {data,error}=await c.rpc(name,args||{});
  if(error)return {ok:false,error:error.message};
  return {ok:true,data};
}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function activeCourseId(courseId){return String(courseId||"");}

export async function listCourseExams(courseId){
  const r=await rpc("academy_course_exams",{p_course_id:activeCourseId(courseId)});
  return r.ok?{ok:true,rows:Array.isArray(r.data)?r.data:[]}:r;
}

export async function saveCourseExam(exam){
  return rpc("academy_save_course_exam",{p_exam:exam});
}

export async function deleteCourseExam(id){
  return rpc("academy_delete_course_exam",{p_id:id});
}

export async function listQuestionLinks(courseId){
  const r=await rpc("academy_course_question_links",{p_course_id:activeCourseId(courseId)});
  return r.ok?{ok:true,rows:Array.isArray(r.data)?r.data:[]}:r;
}

export async function saveQuestionLink(link){
  return rpc("academy_save_course_question_link",{p_link:link});
}

function examRow(e,stats){
  const published=e.published===true;
  const s=stats||{count:0,avg:0,passed:0};
  return '<div class="card v41-exam-row">'+
    '<div><span class="badge '+(published?"green":"orange")+'">'+(published?"منشور":"مسودة")+'</span><h3>'+esc(e.title)+'</h3>'+
    '<p class="muted">'+Number(e.durationMinutes||10)+' دقيقة • '+Number(e.questionCount||0)+' سؤال • اجتياز '+Number(e.passPercent||0)+'% • '+(Number(e.attemptsLimit||0)===0?"محاولات غير محدودة":Number(e.attemptsLimit)+" محاولة")+'</p>'+
    '<small class="muted">المحاولات: '+s.count+' • متوسط: '+s.avg+'% • الناجحون: '+s.passed+'</small></div>'+
    '<div class="v41-exam-actions"><button class="btn btn-soft mini-btn" data-v41-delete-exam="'+esc(e.id)+'">حذف</button><button class="btn btn-primary mini-btn" data-v41-edit-exam="'+esc(e.id)+'">تعديل</button></div>'+
  '</div>';
}

function examFormHtml(exam){
  const e=exam||{};
  const ids=Array.isArray(e.questionIds)?e.questionIds.join(","):"";
  return '<form class="card v41-exam-form" data-v41-exam-form data-v41-exam-id="'+esc(e.id||"")+'">'+
      '<div class="grid-2">'+
      '<label>عنوان الاختبار<input name="title" required value="'+esc(e.title||"")+'" placeholder="اختبار الوحدة الأولى"></label>'+
      '<label>المدة بالدقائق<input name="durationMinutes" type="number" min="1" max="180" value="'+Number(e.durationMinutes||10)+'"></label>'+
      '<label>نسبة الاجتياز<input name="passPercent" type="number" min="0" max="100" value="'+Number(e.passPercent||60)+'"></label>'+
      '<label>عدد المحاولات<input name="attemptsLimit" type="number" min="0" value="'+Number(e.attemptsLimit===undefined?1:e.attemptsLimit)+'"></label>'+
      '<label>طريقة اختيار الأسئلة<select name="selectionMode"><option value="manual" '+(e.selectionMode==="manual"||!e.selectionMode?"selected":"")+'>يدوي</option><option value="random" '+(e.selectionMode==="random"?"selected":"")+'>عشوائي</option></select></label>'+
      '<label>عدد الأسئلة<input name="questionCount" type="number" min="1" max="100" value="'+Number(e.questionCount||10)+'"></label>'+
      '<label>الصعوبة<select name="difficultyMode"><option value="all" '+(e.difficultyMode==="all"||!e.difficultyMode?"selected":"")+'>الكل</option><option value="easy" '+(e.difficultyMode==="easy"?"selected":"")+'>سهل</option><option value="medium" '+(e.difficultyMode==="medium"?"selected":"")+'>متوسط</option><option value="hard" '+(e.difficultyMode==="hard"?"selected":"")+'>متقدم</option></select></label>'+
      '<label>حالة النشر<select name="published"><option value="false" '+(e.published===true?"":"selected")+'>مسودة</option><option value="true" '+(e.published===true?"selected":"")+'>منشور</option></select></label>'+
      '</div>'+
      '<label style="display:block;margin-top:10px">معرفات الأسئلة<input name="questionIds" value="'+esc(ids)+'" placeholder="1,2,3,4"></label>'+
      '<div class="course-form-actions"><button class="btn btn-primary" type="submit">حفظ الاختبار</button><button class="btn btn-soft" type="button" data-v41-cancel>إلغاء</button></div>'+
      '</form>';
}

export async function mountCourseAssessments(container,course){
  if(!container||!course)return;
  container.innerHTML='<section class="card v41-assessments"><div class="section-title"><div><span class="eyebrow orange">V3.41 • الاختبارات والأسئلة</span><h3>اختبارات المقرر</h3><p class="muted">اربط الاختبار بالمقرر أو الوحدة أو الدرس.</p></div><button class="btn btn-primary" data-v41-new-exam>+ اختبار جديد</button></div><div data-v41-exam-list><p class="muted">جاري تحميل الاختبارات…</p></div></section>';

  let result=await listCourseExams(course.id);
  let rows=result.ok?result.rows:[];
  let statsByExam={};

  async function refreshStats(){
    statsByExam={};
    const all=await Promise.all(rows.map(async function(e){
      try{
        const r=await listCourseExamAttempts(course.id,e.id);
        if(!r.ok||!Array.isArray(r.data))return;
        const a=r.data;
        statsByExam[String(e.id)]={
          count:a.length,
          avg:a.length?Math.round(a.reduce(function(s,x){return s+Number(x.percent||0);},0)/a.length):0,
          passed:a.filter(function(x){return x.passed===true;}).length
        };
      }catch(error){}
    }));
    return all;
  }

  function renderRows(){
    const list=container.querySelector("[data-v41-exam-list]");
    if(!list)return;
    list.innerHTML=rows.length?rows.map(function(e){return examRow(e,statsByExam[String(e.id)]);}).join(""):'<div class="empty">لا توجد اختبارات مرتبطة بهذا المقرر بعد.</div>';
  }

  refreshStats().then(renderRows).catch(renderRows);

  async function openExamForm(exam){
    const box=container.querySelector("[data-v41-exam-list]");
    if(!box)return;
    box.innerHTML=examFormHtml(exam);
    const form=box.querySelector("[data-v41-exam-form]");
    form.addEventListener("submit",async function(ev){
      ev.preventDefault();
      const d=new FormData(form);
      const payload={
        id:String(form.getAttribute("data-v41-exam-id")||"")||undefined,
        courseId:String(course.id),
        title:String(d.get("title")||"").trim(),
        durationMinutes:Number(d.get("durationMinutes")||10),
        passPercent:Number(d.get("passPercent")||60),
        attemptsLimit:Number(d.get("attemptsLimit")||1),
        selectionMode:String(d.get("selectionMode")||"manual"),
        questionCount:Number(d.get("questionCount")||10),
        difficultyMode:String(d.get("difficultyMode")||"all"),
        published:String(d.get("published"))==="true",
        questionIds:String(d.get("questionIds")||"").split(",").map(function(x){return x.trim();}).filter(Boolean)
      };
      const saved=await saveCourseExam(payload);
      if(!saved.ok){window.alert(saved.error||saved.reason||"تعذر حفظ الاختبار.");return;}
      const latest=await listCourseExams(course.id);
      rows=latest.ok?latest.rows:rows;
      await refreshStats();
      renderRows();
    });
    form.querySelector("[data-v41-cancel]")?.addEventListener("click",renderRows);
  }

  const newBtn=container.querySelector("[data-v41-new-exam]");
  newBtn&&newBtn.addEventListener("click",function(){openExamForm(null);});

  container.addEventListener("click",async function(ev){
    const edit=ev.target.closest("[data-v41-edit-exam]");
    if(edit){
      const exam=rows.find(function(x){return String(x.id)===String(edit.getAttribute("data-v41-edit-exam"));});
      if(exam)openExamForm(exam);
      return;
    }
    const del=ev.target.closest("[data-v41-delete-exam]");
    if(del){
      if(!window.confirm("هل تريد حذف الاختبار؟"))return;
      const r=await deleteCourseExam(del.getAttribute("data-v41-delete-exam"));
      if(r.ok){
        const latest=await listCourseExams(course.id);
        rows=latest.ok?latest.rows:rows;
        await refreshStats();
        renderRows();
      }else window.alert(r.error||r.reason||"تعذر الحذف.");
    }
  });
}


export function prepareExamForStudent(exam){
  const cfg={
    title:String(exam.title||"اختبار المقرر"),
    questionIds:Array.isArray(exam.questionIds)?exam.questionIds.map(Number).filter(Number.isFinite):[],
    durationMin:Number(exam.durationMinutes||10),
    passPercent:Number(exam.passPercent||60),
    attemptsLimit:Number(exam.attemptsLimit||0),
    selectionMode:exam.selectionMode==="random"?"random":"manual",
    questionCount:Number(exam.questionCount||10),
    difficultyMode:exam.difficultyMode||"all",
    topicTargets:exam.topicTargets||{},
    published:true,
    updatedAt:Date.now(),
    shuffleQuestions:true,
    shuffleOptions:true,
    version:341
  };
  localStorage.setItem("ipv4AcademyV317ExamConfig",JSON.stringify(cfg));
  localStorage.setItem("ipv4AcademyV341CourseExamId",String(exam.id||""));
  localStorage.setItem("ipv4AcademyV341CourseId",String(exam.courseId||""));
  localStorage.setItem("ipv4AcademyV341UnitId",String(exam.unitId||""));
  localStorage.setItem("ipv4AcademyV341LessonId",String(exam.lessonId||""));
  return cfg;
}

export async function mountStudentCourseExams(container,courseId){
  if(!container)return;
  const result=await listCourseExams(courseId);
  if(!result.ok){
    container.innerHTML='<div class="card"><span class="badge orange">الاختبارات</span><p class="muted">تعذر تحميل الاختبارات المركزية.</p></div>';
    return;
  }
  const rows=(result.rows||[]).filter(function(x){return x.published===true;});
  container.innerHTML='<section class="card v41-student-exams">'+
    '<div class="section-title"><div><span class="eyebrow orange">اختبارات المقرر</span><h3>اختبارات مرتبطة بهذا المقرر</h3><p class="muted">ابدأ الاختبار من داخل مسارك التعليمي مباشرة.</p></div><span class="badge orange">'+rows.length+' اختبار</span></div>'+
    (rows.length?'<div class="v41-student-exam-list">'+rows.map(function(x){
      return '<article class="v41-student-exam-row"><div><h3>'+esc(x.title)+'</h3><p class="muted">'+Number(x.questionCount||0)+' سؤال • '+Number(x.durationMinutes||10)+' دقيقة • اجتياز '+Number(x.passPercent||60)+'%</p></div><button class="btn btn-orange" data-v41-start-student-exam="'+esc(x.id)+'">بدء الاختبار</button></article>';
    }).join("")+'</div>':'<div class="empty">لا توجد اختبارات منشورة لهذا المقرر حاليًا.</div>')+
  '</section>';

  container.addEventListener("click",function(ev){
    const btn=ev.target.closest("[data-v41-start-student-exam]");
    if(!btn)return;
    const exam=rows.find(function(x){return String(x.id)===String(btn.getAttribute("data-v41-start-student-exam"));});
    if(!exam)return;
    prepareExamForStudent(exam);
    document.querySelectorAll("[data-page]").forEach(function(x){
      if(x.getAttribute("data-page")==="exams"){x.click();}
    });
  });
}


export async function persistCourseExamAttempt(result){
  const attemptId=localStorage.getItem("ipv4AcademyV365Attempt")||"";
  if(!attemptId)return {ok:false,reason:"NO_CENTRAL_ATTEMPT"};
  const m=await import("./supabase-v30.js?v=465");
  return m.recordUnifiedExamAttempt({
    attemptId:String(attemptId),
    score:Number(result.score||0),
    total:Number(result.total||0),
    percent:Number(result.percent||0),
    passed:!!result.passed,
    durationSec:Number(result.durationSec||0),
    autoSubmitted:!!result.autoSubmitted,
    questionResults:Array.isArray(result.questionResults)?result.questionResults:[]
  });
}

export async function listCourseExamAttempts(courseId,examId){
  return rpc("academy_course_exam_attempts",{
    p_course_id:String(courseId||""),
    p_exam_id:examId||null
  });
}
