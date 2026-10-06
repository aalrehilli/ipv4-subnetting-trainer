const KEY="ipv4AcademyV27Vlsm";
const state={challenge:null,answers:{},checked:false,score:0,attempts:loadAttempts()};

const scenarios=[
 {base:"192.168.50.0/24",departments:[["الإدارة",50],["المبيعات",25],["الدعم الفني",12],["التدريب",6]]},
 {base:"192.168.60.0/24",departments:[["المعهد",70],["المعامل",30],["الإدارة",12],["الضيوف",6]]},
 {base:"192.168.70.0/24",departments:[["المقر الرئيسي",90],["الفروع",40],["المالية",20],["الدعم",10]]}
];

function ipToInt(ip){
 const p=String(ip).trim().split(".").map(Number);
 if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255))return null;
 return (((p[0]<<24)>>>0)+(p[1]<<16)+(p[2]<<8)+p[3])>>>0;
}
function intToIp(n){n=n>>>0;return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join(".")}
function prefixForHosts(hosts){let bits=0;while((2**bits-2)<hosts)bits++;return 32-bits}
function maskFromPrefix(p){return p===0?"0.0.0.0":intToIp((0xffffffff<<(32-p))>>>0)}
function buildSolution(s){
 let cursor=ipToInt(s.base.split("/")[0]);
 return s.departments.slice().sort((a,b)=>b[1]-a[1]).map(([name,hosts])=>{
   const prefix=prefixForHosts(hosts),size=2**(32-prefix);
   const network=cursor;const broadcast=(cursor+size-1)>>>0;
   const out={name,hosts,prefix,size,mask:maskFromPrefix(prefix),network:intToIp(network),first:intToIp(network+1),last:intToIp(broadcast-1),broadcast:intToIp(broadcast)};
   cursor=broadcast+1;return out;
 });
}
function makeChallenge(){
 const scenario=scenarios[Math.floor(Math.random()*scenarios.length)];
 state.challenge={...scenario,solution:buildSolution(scenario)};
 state.answers={};state.checked=false;state.score=0;
}
function loadAttempts(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function saveAttempts(){localStorage.setItem(KEY,JSON.stringify(state.attempts.slice(-15)))}
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function cell(i,k,label,placeholder){
 const v=state.answers[i]?.[k]||"";
 let mark="";
 if(state.checked){
   const target=state.challenge.solution[i];
   const ok=String(v).trim()===String(target?.[k]??"").trim();
   mark=ok?'<span class="lab-ok">✓</span>':'<span class="lab-bad">✕</span>';
 }
 return '<div class="vlsm-cell"><label>'+label+'</label><div class="vlsm-input-wrap"><input data-vlsm-row="'+i+'" data-vlsm-key="'+k+'" value="'+esc(v)+'" placeholder="'+placeholder+'" autocomplete="off">'+mark+'</div></div>';
}
function row(s,i){
 return '<div class="vlsm-row"><div class="vlsm-dept"><strong>'+esc(s.name)+'</strong><span>'+s.hosts+' hosts</span></div><div class="vlsm-req">? <small>الحجم</small></div>'+cell(i,"prefix","Prefix","/26") + cell(i,"network","Network","192.168.50.0") + cell(i,"first","First Host","192.168.50.1") + cell(i,"last","Last Host","192.168.50.62") + cell(i,"broadcast","Broadcast","192.168.50.63")+'</div>';
}
function read(){
 document.querySelectorAll("[data-vlsm-row]").forEach(el=>{
   const i=Number(el.dataset.vlsmRow),k=el.dataset.vlsmKey;
   state.answers[i]=state.answers[i]||{};state.answers[i][k]=el.value.trim();
 });
}
function compare(){
 let score=0,total=state.challenge.solution.length*5;
 state.challenge.solution.forEach((s,i)=>{
   ["prefix","network","first","last","broadcast"].forEach(k=>{
     let entered=state.answers[i]?.[k]||"";
     if(k==="prefix") entered=entered.replace("/","");
     const expected=k==="prefix"?String(s.prefix):String(s[k]);
     if(entered===expected)score++;
   });
 });
 return {score,total,percent:Math.round(score/total*100)};
}
function check(){
 read();
 const r=compare();
 state.score=r.score;state.checked=true;
 const result={challenge:state.challenge.base,score:r.score,total:r.total,percent:r.percent,departments:state.challenge.departments.length,at:Date.now()};
 state.attempts.unshift(result);saveAttempts();
}
function networkMathHint(){
 const highest=state.challenge.solution[0];
 return "ابدأ بأكبر احتياج: "+highest.name+" ("+highest.hosts+" جهازًا) ← Prefix /"+highest.prefix+" ← Block Size "+highest.size+". ثم انتقل للعنوان التالي.";
}
export function vlsmPage(){
 if(!state.challenge)makeChallenge();
 const c=state.challenge;
 const pct=state.checked?Math.round(state.score/(c.solution.length*5)*100):0;
 const totalHosts=c.departments.reduce((s,x)=>s+x[1],0);
 const allocated=c.solution.reduce((s,x)=>s+x.size,0);
 const waste=256-allocated;
 return `
 <div class="page-intro with-action"><div><span class="eyebrow purple">VLSM Challenge • V2.7</span><h2>صمّم شبكة حسب الاحتياج</h2><p>في VLSM لا نستخدم نفس حجم الشبكة للجميع. وزّع العناوين من الأكبر إلى الأصغر.</p></div><span class="badge ${state.checked?(pct>=80?"green":"orange"):""}">${state.checked?pct+"%":"سيناريو واقعي"}</span></div>
 <div class="vlsm-hero"><div><span class="eyebrow">الشبكة الأساسية</span><div class="vlsm-base">${c.base}</div><p>الاحتياج الكلي: <strong>${totalHosts} جهازًا</strong> • التخصيص المتوقع: <strong>${allocated} عنوانًا</strong></p></div><div class="vlsm-facts"><div><span>الأقسام</span><b>${c.departments.length}</b></div><div><span>المضيفون</span><b>${totalHosts}</b></div><div><span>هدر العناوين</span><b>${waste}</b></div></div></div>

 <div class="card vlsm-brief"><h3>المتطلبات</h3><div class="vlsm-req-grid">${c.departments.map(d=>'<div><strong>'+esc(d[0])+'</strong><span>'+d[1]+' hosts</span></div>').join("")}</div><div class="lab-feedback"><strong>طريقة التفكير:</strong> ${networkMathHint()}</div></div>

 <div class="card vlsm-card"><div class="flsm-table-head"><h3>أنشئ خطة العناوين</h3><span class="muted">5 إجابات لكل قسم</span></div>
 <div class="vlsm-table">
  <div class="vlsm-header"><span>القسم</span><span>الحجم</span><span>Prefix</span><span>Network</span><span>First</span><span>Last</span><span>Broadcast</span></div>
  ${c.solution.map(row).join("")}
 </div>
 <div class="flsm-actions"><button class="btn btn-purple" id="check-vlsm">تحقق من الحل</button><button class="btn btn-soft" id="show-vlsm-solution">إظهار الحل</button><button class="btn btn-primary" id="new-vlsm">سيناريو جديد</button></div>
 ${state.checked?'<div class="lab-solution-summary">النتيجة '+state.score+'/'+(c.solution.length*5)+' ('+pct+'%). تم التحقق من توزيع الشبكات، ويمكنك الآن الانتقال إلى سيناريو أصعب.</div>':""}
 </div>

 <div class="card vlsm-method"><h3>قاعدة VLSM</h3><div class="vlsm-method-grid"><div><b>1</b><span>رتّب الاحتياجات من الأكبر إلى الأصغر.</span></div><div><b>2</b><span>احسب Prefix المناسب لكل احتياج.</span></div><div><b>3</b><span>احسب Block Size لكل شبكة.</span></div><div><b>4</b><span>ابدأ من Network الأساسية.</span></div><div><b>5</b><span>تحقق من عدم وجود تداخل.</span></div></div></div>

 <div class="section-title"><h3>محاولاتك الأخيرة</h3><span class="badge">${state.attempts.length}</span></div>
 <div class="card flsm-history">${state.attempts.length?state.attempts.slice(0,5).map(x=>'<div class="lab-history-row"><div><strong>'+x.challenge+'</strong><span class="muted">• '+x.departments+' أقسام</span></div><span class="badge '+(x.percent>=80?"green":x.percent>=60?"orange":"red")+'">'+x.percent+'%</span></div>').join(""):'<div class="empty">لا توجد محاولات بعد.</div>'}</div>
 `;
}
export function handleVlsmAction(target){
 if(target.id==="check-vlsm"){check();return{rerender:true}}
 if(target.id==="show-vlsm-solution"){
   state.challenge.solution.forEach((s,i)=>{state.answers[i]={prefix:String(s.prefix),network:s.network,first:s.first,last:s.last,broadcast:s.broadcast}});
   state.checked=true;state.score=state.challenge.solution.length*5;return{rerender:true}
 }
 if(target.id==="new-vlsm"){makeChallenge();return{rerender:true}}
 return null;
}
