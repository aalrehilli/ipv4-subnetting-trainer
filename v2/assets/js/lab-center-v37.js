import {getWeakTopics} from "./smart-engine-v28.js?v=435";

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function readAttempts(key){
  try{
    const x=JSON.parse(localStorage.getItem(key)||"[]");
    return Array.isArray(x)?x:[];
  }catch{return []}
}
function labStats(){
  const subnet=readAttempts("ipv4AcademyV25SubnetLab");
  const flsm=readAttempts("ipv4AcademyV26Flsm");
  const vlsm=readAttempts("ipv4AcademyV27Vlsm");
  const lastOf=a=>a[0]||null;
  const avg=a=>a.length?Math.round(a.reduce((s,x)=>s+Number(x.percent||0),0)/a.length):0;
  return {
    subnet:{attempts:subnet.length,avg:avg(subnet),last:lastOf(subnet)},
    flsm:{attempts:flsm.length,avg:avg(flsm),last:lastOf(flsm)},
    vlsm:{attempts:vlsm.length,avg:avg(vlsm),last:lastOf(vlsm)}
  };
}
function card(id,title,desc,badge,cls,action,stats,meta){
  const last=stats.last;
  return '<div class="lab-v37-card '+cls+'"><div class="lab-v37-icon">'+(id==="subnet"?"⌘":id==="flsm"?"4":"V")+'</div><div class="lab-v37-card-head"><span class="badge '+cls+'">'+badge+'</span><span class="muted">'+stats.attempts+' محاولة</span></div><h3>'+title+'</h3><p>'+desc+'</p><div class="lab-v37-meta"><span>'+meta[0]+'</span><span>'+meta[1]+'</span></div><div class="lab-v37-metrics"><div><small>متوسطك</small><strong>'+stats.avg+'%</strong></div><div><small>آخر نتيجة</small><strong>'+ (last?Number(last.percent||0)+"%":"—") +'</strong></div></div><button class="btn btn-'+(id==="vlsm"?"purple":id==="flsm"?"purple":"green")+'" data-lab-page="'+action+'">'+(stats.attempts?"استمرار التدريب":"ابدأ المختبر")+'</button></div>';
}
export function labCenterView(){
  const s=labStats();
  const totalAttempts=s.subnet.attempts+s.flsm.attempts+s.vlsm.attempts;
  const weak=getWeakTopics();
  const best=[["Subnetting",s.subnet.avg],["FLSM",s.flsm.avg],["VLSM",s.vlsm.avg]].sort((a,b)=>a[1]-b[1])[0];
  const completed=[s.subnet,s.flsm,s.vlsm].filter(x=>x.attempts>0).length;
  return '<div class="page-intro with-action"><div><span class="eyebrow green">V3.37 • المختبرات</span><h2>مركز المختبرات العملية</h2><p>تعلّم بالحساب، نفّذ الحل، شاهد الأخطاء، ثم أعد القياس. كل مختبر يحتفظ بمحاولاته محليًا في هذه المرحلة.</p></div><span class="badge green">'+completed+'/3 مختبرات مستخدمة</span></div>'+
  '<div class="trainer-v36-kpis lab-v37-kpis"><div class="card trainer-v311-summary-card"><div class="summary-icon">⌘</div><div><span class="muted">إجمالي المحاولات</span><strong>'+totalAttempts+'</strong><small>في المختبرات الثلاثة</small></div></div><div class="card trainer-v311-summary-card"><div class="summary-icon green">✓</div><div><span class="muted">أفضل مختبر</span><strong>'+Math.max(s.subnet.avg,s.flsm.avg,s.vlsm.avg)+'%</strong><small>أعلى متوسط أداء</small></div></div><div class="card trainer-v311-summary-card"><div class="summary-icon orange">!</div><div><span class="muted">أولوية التحسين</span><strong>'+best[0]+'</strong><small>'+best[1]+'% متوسط</small></div></div><div class="card trainer-v311-summary-card"><div class="summary-icon purple">✦</div><div><span class="muted">نقاط الضعف</span><strong>'+Math.min(3,weak.length)+'</strong><small>موضوعات تحتاج مراجعة</small></div></div></div>'+
  '<div class="section-title"><h3>اختر المختبر</h3><span class="badge blue">Hands-on Learning</span></div>'+
  '<div class="lab-v37-grid">'+
  card("subnet","Subnetting Challenge","احسب Network وFirst Host وLast Host وBroadcast وSubnet Mask وعدد المضيفين.", "متاح الآن","green","subnet",s.subnet,["6 عناصر","متوسط"])+
  card("flsm","FLSM Challenge","قسّم /24 إلى 4 أو 8 شبكات متساوية وحدد بيانات كل شبكة.", "متاح الآن","purple","flsm",s.flsm,["4–8 Subnets","متوسط"])+
  card("vlsm","VLSM Challenge","وزّع العناوين حسب احتياج الأقسام من الأكبر إلى الأصغر بدون تداخل.", "متاح الآن","purple","vlsm",s.vlsm,["سيناريو واقعي","متقدم"])+
  '<div class="lab-v37-card lab-v37-disabled"><div class="lab-v37-icon">01</div><div class="lab-v37-card-head"><span class="badge orange">المرحلة التالية</span></div><h3>Binary Speed Lab</h3><p>تحويل Binary ↔ Decimal وربط البتات بالـPrefix مع مؤقت للسرعة.</p><div class="lab-v37-meta"><span>سرعة</span><span>مبتدئ</span></div><div class="lab-v37-metrics"><div><small>الحالة</small><strong>قريبًا</strong></div><div><small>المهارة</small><strong>Binary</strong></div></div><button class="btn btn-soft" disabled>قريبًا</button></div>'+
  '<div class="lab-v37-card lab-v37-disabled"><div class="lab-v37-icon">PT</div><div class="lab-v37-card-head"><span class="badge">لاحقًا</span></div><h3>Packet Tracer</h3><p>سيناريوهات عملية تشمل IPv4 وSwitching وRouting وCLI.</p><div class="lab-v37-meta"><span>عملي</span><span>متقدم</span></div><div class="lab-v37-metrics"><div><small>الحالة</small><strong>مخطط</strong></div><div><small>المسار</small><strong>IOS</strong></div></div><button class="btn btn-soft" disabled>لاحقًا</button></div>'+
  '</div>'+
  '<div class="section-title"><h3>منهج المختبرات</h3></div>'+
  '<div class="grid-3 lab-v37-flow"><div class="card"><b>1. افهم</b><p class="muted">اقرأ القاعدة أو الخطوات.</p></div><div class="card"><b>2. نفّذ</b><p class="muted">أدخل الحل بنفسك واحصل على تصحيح فوري.</p></div><div class="card"><b>3. أعد القياس</b><p class="muted">أعد التحدي حتى يصبح الأداء ثابتًا.</p></div></div>'+
  '<div class="card lab-v37-note"><strong>V3.37:</strong> تم توحيد واجهة المختبرات في مركز واحد. نتائج المختبرات الحالية محفوظة محليًا، وسيتم ربطها بحساب المتدرب وSupabase في مرحلة الحسابات.</div>';
}
