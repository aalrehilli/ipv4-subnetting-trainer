const CORE_CHECKS=[
  {name:"صفحة المقرر",path:"./course-learning-v38.js?v=431",exports:["learnerCourse","lessonPage","assessmentView","handleLearningAction","submitLessonAssessment"]},
  {name:"محرك الاختبارات",path:"./exam-v23.js?v=430",exports:["examPage","handleExamAction","getTrainerExamConfig","saveTrainerExamBuilderFromForm","getExamPreviewQuestions","getExamAttempts","getQuestionAnalytics"]},
  {name:"بنك الأسئلة",path:"./question-bank-v24.js?v=430",exports:["questionBankView","refreshBank","getQuestionBank","handleQuestionBankAction"]},
  {name:"لوحة المدرب",path:"./trainer-v22.js?v=430",exports:["getTrainerView"]},
  {name:"منصة المتدرب",path:"./student.js?v=430",exports:["studentPage"]},
  {name:"المختبر Subnetting",path:"./subnet-lab-v25.js",exports:["labPage"]},
  {name:"المختبر FLSM",path:"./flsm-v26.js",exports:["flsmPage"]},
  {name:"المختبر VLSM",path:"./vlsm-v27.js",exports:["vlsmPage"]},
  {name:"المحرك الذكي",path:"./smart-engine-v28.js",exports:["getLearningSnapshot","getSmartRecommendation","getWeakTopics"]},
  {name:"الإشعارات",path:"./notifications-v30.js",exports:["notificationsPage","getUnreadCount"]},
  {name:"Supabase",path:"./supabase-v30.js?v=430",exports:["isSupabaseConfigured","getSupabaseStatus","syncAllFromSupabase","syncTrainerExamToSupabase","persistAttemptToSupabase"]}
];

const exportNames=content=>{
  const names=new Set();
  for(const m of content.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z0-9_$]+)/g))names.add(m[1]);
  for(const m of content.matchAll(/export\s*\{([^}]+)\}/g)){
    m[1].split(",").map(x=>x.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach(x=>names.add(x));
  }
  return names;
};

async function auditModule(item){
  const url=new URL(item.path,import.meta.url).href;
  try{
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)return {...item,status:"error",message:"HTTP "+response.status,missing:item.exports};
    const text=await response.text();
    const names=exportNames(text);
    const missing=item.exports.filter(x=>!names.has(x));
    return {
      ...item,
      status:missing.length?"warning":"ok",
      message:missing.length?"توجد صادرات ناقصة":"عقد التصدير سليم",
      found:item.exports.filter(x=>names.has(x)),
      missing
    };
  }catch(error){
    return {...item,status:"error",message:String(error&&error.message||error),missing:item.exports};
  }
}

function checkSupabase(){
  const s=window.__IPV4_SUPABASE_STATUS__;
  if(!s)return {status:"info",message:"لم يتم تشغيل فحص Supabase بعد"};
  if(s.authenticated)return {status:"ok",message:"Supabase متصل والمستخدم مسجل"};
  if(s.configured)return {status:"warning",message:s.message||"Supabase مهيأ لكن لا توجد جلسة"};
  return {status:"info",message:"Supabase غير مهيأ — الوضع المحلي يعمل"};
}

function checkStorage(){
  const checks=[
    ["بنك الأسئلة", "ipv4AcademyV24QuestionBank"],
    ["إعدادات الاختبار", "ipv4AcademyV317ExamConfig"],
    ["نتائج الاختبارات", "ipv4AcademyV327Attempts"],
    ["تقدم المقرر", "ipv4AcademyV37Done"]
  ];
  return checks.map(([label,key])=>{
    let exists=false;
    try{exists=localStorage.getItem(key)!==null}catch{}
    return {label,status:exists?"ok":"info",message:exists?"موجود":"لا توجد بيانات بعد"};
  });
}

export async function runPlatformAudit(){
  const results=[];
  for(const item of CORE_CHECKS)results.push(await auditModule(item));
  return {
    timestamp:Date.now(),
    modules:results,
    supabase:checkSupabase(),
    storage:checkStorage(),
    summary:{
      ok:results.filter(x=>x.status==="ok").length,
      warning:results.filter(x=>x.status==="warning").length,
      error:results.filter(x=>x.status==="error").length,
      total:results.length
    }
  };
}

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const statusLabel=s=>s==="ok"?"سليم":s==="warning"?"تحذير":s==="error"?"خطأ":"معلومات";
const statusClass=s=>s==="ok"?"green":s==="warning"?"orange":s==="error"?"red":"blue";

export async function auditView(){
  const report=await runPlatformAudit();
  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow purple">V3.31 • تدقيق المنصة</span><h2>مركز صحة النظام</h2><p>فحص عقود الوحدات ومسارات التشغيل والتخزين المحلي وحالة Supabase قبل الانتقال للمرحلة التالية.</p></div>
    <div><span class="badge ${report.summary.error?"red":report.summary.warning?"orange":"green"}">${report.summary.ok}/${report.summary.total} وحدات سليمة</span></div>
  </div>

  <div class="student-grid-4">
    <div class="card trainer-kpi"><div class="muted">وحدات سليمة</div><div class="kpi-value">${report.summary.ok}</div><div class="muted">عقد التصدير صحيح</div></div>
    <div class="card trainer-kpi"><div class="muted">تحذيرات</div><div class="kpi-value">${report.summary.warning}</div><div class="muted">تحتاج مراجعة</div></div>
    <div class="card trainer-kpi"><div class="muted">أخطاء</div><div class="kpi-value">${report.summary.error}</div><div class="muted">تعطل وظيفة محتملة</div></div>
    <div class="card trainer-kpi"><div class="muted">آخر فحص</div><div class="kpi-value">الآن</div><div class="muted">${new Date(report.timestamp).toLocaleTimeString("ar-SA")}</div></div>
  </div>

  <div class="section-title"><h3>فحص الوحدات الأساسية</h3><span class="badge blue">Contract Audit</span></div>
  <div class="card" style="display:grid;gap:8px">
    ${report.modules.map(x=>`
      <div style="display:grid;grid-template-columns:190px 100px 1fr;gap:10px;align-items:center;padding:10px;border:1px solid #edf2f5;border-radius:10px;background:#fff">
        <strong>${esc(x.name)}</strong>
        <span class="badge ${statusClass(x.status)}">${statusLabel(x.status)}</span>
        <div class="muted">${esc(x.message)}${x.missing?.length?'<div style="margin-top:4px;color:#b31d1d">ناقص: '+esc(x.missing.join("، "))+'</div>':""}</div>
      </div>
    `).join("")}
  </div>

  <div class="section-title"><h3>حالة البيانات</h3><span class="badge purple">Data Layer</span></div>
  <div class="card">
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
      ${report.storage.map(x=>'<div style="padding:10px;background:#f7f9fb;border-radius:10px"><strong style="display:block;font-size:11px">'+esc(x.label)+'</strong><span class="badge '+statusClass(x.status)+'" style="margin-top:5px">'+statusLabel(x.status)+'</span><small class="muted" style="display:block;margin-top:4px">'+esc(x.message)+'</small></div>').join("")}
    </div>
  </div>

  <div class="card" style="margin-top:12px;background:#f5f9fc;border-right:4px solid var(--purple)">
    <strong>Supabase</strong>
    <p class="muted" style="margin:5px 0 0">${esc(report.supabase.message)}</p>
  </div>

  <div class="card" style="margin-top:12px">
    <strong>قاعدة V3.31</strong>
    <p class="muted" style="margin:5px 0 0;line-height:1.8">لا ننتقل إلى الحسابات حتى تكون عقود الوحدات الأساسية سليمة. أي تحذير هنا يعالج أولًا، ثم ينتقل البناء إلى بنك الأسئلة ومحرك الاختبارات ومركز النتائج بشكل متسلسل.</p>
  </div>
  `;
}
