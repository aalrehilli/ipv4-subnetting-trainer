import {fetchQuestionBankAudit} from "./supabase-v30.js?v=477";

const esc=v=>String(v==null?"":v)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function kpi(title,value,sub,cls=""){
  return '<div class="card trainer-kpi '+cls+'"><div class="muted">'+esc(title)+'</div><div class="kpi-value">'+esc(value)+'</div><div class="muted">'+esc(sub)+'</div></div>';
}

function issueBadge(issue){
  if(String(issue||"").includes("غير مدعوم"))return "red";
  if(String(issue||"").includes("الإجابة"))return "orange";
  return "red";
}

export async function questionBankAuditView(){
  const remote=await fetchQuestionBankAudit();
  if(!remote.ok){
    return '<div class="page-intro"><span class="eyebrow red">V3.75 • تدقيق بنك الأسئلة</span><h2>تعذر تشغيل التدقيق</h2><p class="muted">يجب استخدام حساب مدرب أو مدير للوصول إلى التدقيق المركزي.</p></div>'+
      '<div class="card"><strong>'+esc(remote.error||remote.reason||"خطأ غير معروف")+'</strong></div>';
  }

  const p=remote.payload||{}, s=p.summary||{};
  const topics=Array.isArray(p.topics)?p.topics:[];
  const diffs=Array.isArray(p.difficulties)?p.difficulties:[];
  const issues=Array.isArray(p.issues)?p.issues:[];
  const mcqReady=Number(s.mcqReady||0),mcqActive=Number(s.mcqActive||0);
  const readiness=mcqActive?Math.round(mcqReady/mcqActive*100):0;

  return '<div class="page-intro with-action">'+
    '<div><span class="eyebrow purple">V3.75 • جودة المحتوى</span><h2>تدقيق واعتماد بنك الأسئلة • جاهز للإنتاج</h2>'+
    '<p>المراجعة الآن مركزية. لا يتم حذف أو تعديل أي سؤال تلقائيًا؛ الشاشة تحدد فقط ما هو جاهز وما يحتاج مراجعة.</p></div>'+
    '<div><span class="badge green">Supabase • مباشر</span><span class="badge">آخر تدقيق: '+esc(p.generatedAt||"الآن")+'</span></div>'+
  '</div>'+
  '<div class="student-grid-4 qbank-kpis">'+
    kpi("إجمالي الأسئلة",s.total||0,"كل الأنواع")+
    kpi("نشطة",s.active||0,"متاحة حاليًا")+
    kpi("MCQ جاهزة",mcqReady+"/"+mcqActive,readiness+"% جاهزية","success")+
    kpi("تحتاج مراجعة",s.needsReview||0,"لا تُعتمد قبل المراجعة","danger")+
  '</div>'+
  '<div class="grid-2" style="margin-top:14px">'+
    '<section class="card"><div class="section-title"><div><span class="eyebrow blue">الأنواع</span><h3>جاهزية بنك الأسئلة</h3></div></div>'+
      '<div class="stat-row"><span>MCQ</span><b>'+Number(s.mcqReady||0)+' / '+Number(s.mcqActive||0)+'</b></div>'+
      '<div class="progress"><span style="width:'+readiness+'%"></span></div>'+
      '<div class="stat-row"><span>أسئلة قصيرة</span><b>'+Number(s.shortReady||0)+' / '+Number(s.shortActive||0)+'</b></div>'+
      '<div class="note">الأسئلة القصيرة موجودة في البنك ويمكن اعتمادها للمسار القصير، لكنها ليست ضمن محرك الاختبارات متعدد الخيارات الحالي.</div>'+
    '</section>'+
    '<section class="card"><div class="section-title"><div><span class="eyebrow orange">التكرار</span><h3>فحص التكرار</h3></div></div>'+
      '<div class="stat-row"><span>مجموعات مكررة</span><b>'+Number(s.duplicateGroups||0)+'</b></div>'+
      '<div class="stat-row"><span>أسئلة ضمن مجموعات مكررة</span><b>'+Number(s.duplicateQuestions||0)+'</b></div>'+
      '<div class="note">'+(Number(s.duplicateGroups||0)?"هناك أسئلة متشابهة تحتاج مراجعة يدوية قبل الإطلاق.":"لا توجد مجموعات تكرار مكتشفة نصيًا.")+'</div>'+
    '</section>'+
  '</div>'+
  '<div class="grid-2" style="margin-top:14px">'+
    '<section class="card"><div class="section-title"><div><span class="eyebrow blue">الموضوعات</span><h3>توزيع الجودة</h3></div></div>'+
      (topics.length?topics.map(t=>'<div class="stat-row"><span>'+esc(t.topic)+'</span><b>'+Number(t.ready||0)+' / '+Number(t.active||0)+'</b></div>').join(""):'<div class="empty">لا توجد بيانات.</div>')+
    '</section>'+
    '<section class="card"><div class="section-title"><div><span class="eyebrow purple">الصعوبة</span><h3>توزيع الصعوبة</h3></div></div>'+
      (diffs.length?diffs.map(t=>'<div class="stat-row"><span>'+esc(t.difficulty||"—")+'</span><b>'+Number(t.ready||0)+' / '+Number(t.active||0)+'</b></div>').join(""):'<div class="empty">لا توجد بيانات.</div>')+
    '</section>'+
  '</div>'+
  '<section class="card" style="margin-top:14px"><div class="section-title"><div><span class="eyebrow red">قائمة المراجعة</span><h3>الأسئلة التي تحتاج تدخلًا</h3>'+
    '<p class="muted">لا يتم تعديل هذه الأسئلة تلقائيًا حفاظًا على المحتوى التعليمي.</p></div><span class="badge red">'+issues.length+' سؤال</span></div>'+
    (issues.length?'<div class="table-scroll"><table class="table"><thead><tr><th>السؤال</th><th>النوع</th><th>الموضوع</th><th>الصعوبة</th><th>المشكلة</th><th>الحالة</th></tr></thead><tbody>'+
      issues.map(x=>'<tr><td style="text-align:right"><strong>'+esc(x.text||"")+'</strong><small class="muted"><br>'+esc(x.id||"")+'</small></td>'+
        '<td><span class="badge">'+esc(x.type||"—")+'</span></td>'+
        '<td>'+esc(x.topic||"—")+'</td>'+
        '<td>'+esc(x.difficulty||"—")+'</td>'+
        '<td><span class="badge '+issueBadge(x.issue)+'">'+esc(x.issue||"—")+'</span></td>'+
        '<td><span class="badge '+(x.active?"red":"green")+'">'+(x.active?"مراجعة مطلوبة":"معطل")+'</span></td></tr>').join("")+
      '</tbody></table></div>':
      '<div class="empty"><h3>بنك الأسئلة نظيف ✅</h3><p>لا توجد مشكلات بنيوية مكتشفة.</p></div>')+
  '</section>'+
  '<div class="card" style="margin-top:14px;border-right:4px solid var(--primary)"><strong>قرار V3.75</strong>'+
    '<p class="muted">'+(readiness===100&&Number(s.duplicateGroups||0)===0?"البنك متعدد الخيارات جاهز بنيويًا للإطلاق، مع استمرار المراجعة التعليمية اليدوية للصياغة.":"البنك لم يصل بعد إلى الجاهزية الكاملة للاختبارات متعددة الخيارات؛ أصلح عناصر قائمة المراجعة أولًا.")+'</p></div>';
}
