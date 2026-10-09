import {fetchExamE2EReadiness} from "./supabase-v30.js?v=480";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function statusBadge(ready){
  return ready?'<span class="badge green">جاهز</span>':'<span class="badge red">محجوب</span>';
}

export async function examE2EView(){
  const r=await fetchExamE2EReadiness();
  if(!r.ok){
    return '<div class="page-intro"><span class="eyebrow red">V3.78 • فحص دورة الاختبار</span><h2>تعذر تشغيل الفحص</h2><p>يلزم حساب مدرب أو مدير متصل بـ Supabase.</p></div>'+
      '<div class="card" style="border-right:4px solid var(--red)"><strong>المصدر المركزي غير متاح</strong><p class="muted">'+esc(r.error||r.reason||"خطأ غير معروف")+'</p></div>';
  }
  const p=r.payload||{},s=p.summary||{},exams=Array.isArray(p.exams)?p.exams:[];
  return '<div class="page-intro with-action"><div><span class="eyebrow purple">V3.78 • فحص دورة الاختبار</span><h2>فحص الاختبار من البداية إلى النهاية</h2><p>تحقق مركزي قبل إجراء أول اختبار حقيقي: عدد الأسئلة، عدم التكرار، سلامة MCQ، جاهزية الاختبار ومحاولات الاختبار.</p></div>'+
    '<div><span class="badge green">Supabase • مباشر</span><button class="btn btn-soft" data-e2e-refresh>إعادة الفحص</button></div></div>'+
    '<div class="trainer-results-kpis">'+
      '<div class="card exam-admin-kpi"><span>الاختبارات المنشورة</span><strong>'+Number(s.publishedExams||0)+'</strong><small>في النظام</small></div>'+
      '<div class="card exam-admin-kpi success"><span>جاهزة</span><strong>'+Number(s.readyExams||0)+'</strong><small>يمكن بدءها</small></div>'+
      '<div class="card exam-admin-kpi warning"><span>محجوبة</span><strong>'+Number(s.blockedExams||0)+'</strong><small>لن يسمح لها النظام</small></div>'+
      '<div class="card exam-admin-kpi purple"><span>المحاولات المركزية</span><strong>'+Number(s.centralAttempts||0)+'</strong><small>حاليًا</small></div>'+
    '</div>'+
    '<div class="card"><div class="section-title"><div><h3>نتيجة فحص كل اختبار</h3><span class="muted">V3.78 يستخدم نفس شروط الجاهزية التي يعتمد عليها بدء الاختبار</span></div></div>'+
      '<div class="table-scroll"><table class="table trainer-results-table"><thead><tr><th>الاختبار</th><th>الأسئلة</th><th>المعلن</th><th>المميز</th><th>الجاهز</th><th>الحالة</th></tr></thead><tbody>'+
        (exams.length?exams.map(e=>'<tr><td><strong>'+esc(e.title||"اختبار")+'</strong></td><td>'+Number(e.questionCount||0)+'</td><td>'+Number(e.declaredCount||0)+'</td><td>'+Number(e.distinctCount||0)+'</td><td>'+Number(e.readyCount||0)+'</td><td>'+statusBadge(e.ready)+'</td></tr>').join(""):'<tr><td colspan="6"><div class="empty">لا توجد اختبارات منشورة.</div></td></tr>')+
      '</tbody></table></div></div>'+
    '<div class="card trainer-note-card"><strong>مسار التشغيل الفعلي:</strong><p class="muted">حساب المتدرب يبدأ المحاولة مركزيًا → يحصل على مجموعة الأسئلة في نفس العملية الذرية → يجيب → يرسل الإجابات → يحسب الخادم الدرجة → تظهر النتيجة في مركز النتائج وStudent 360.</p></div>';
}
export function bindExamE2E(){
  document.querySelectorAll("[data-e2e-refresh]").forEach(btn=>btn.addEventListener("click",()=>window.dispatchEvent(new CustomEvent("ipv4-e2e-refresh"))));
}
