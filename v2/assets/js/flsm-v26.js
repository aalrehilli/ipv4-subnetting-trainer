const KEY="ipv4AcademyV26Flsm";
const state={challenge:null,answers:{},checked:false,score:0,attempts:loadAttempts()};

function ipToInt(ip){
  const p=String(ip).trim().split(".").map(Number);
  if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255))return null;
  return (((p[0]<<24)>>>0)+(p[1]<<16)+(p[2]<<8)+p[3])>>>0;
}
function intToIp(n){n=n>>>0;return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join(".")}
function maskFromPrefix(p){return p===0?"0.0.0.0":intToIp((0xffffffff<<(32-p))>>>0)}
function makeChallenge(){
  const octet=10+Math.floor(Math.random()*180);
  const count=Math.random()<.5?4:8;
  const newPrefix=count===4?26:27;
  const base="192.168."+octet+".0/24";
  const step=2**(32-newPrefix);
  const subs=[];
  const baseInt=ipToInt(base.split("/")[0]);
  for(let i=0;i<count;i++){
    const n=(baseInt+i*step)>>>0;
    const b=(n+step-1)>>>0;
    subs.push({network:intToIp(n),first:intToIp(n+1),last:intToIp(b-1),broadcast:intToIp(b)});
  }
  state.challenge={base,count,prefix:newPrefix,mask:maskFromPrefix(newPrefix),block:step,subs};
  state.answers={};state.checked=false;state.score=0;
}
function loadAttempts(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function saveAttempts(){localStorage.setItem(KEY,JSON.stringify(state.attempts.slice(-15)))}
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

function field(i,k,label){
  const v=state.answers[i]?.[k]||"";
  let mark="";
  if(state.checked){
    mark=v.trim()===state.challenge.subs[i][k]?'<span class="lab-ok">✓</span>':'<span class="lab-bad">✕</span>';
  }
  return '<div class="flsm-cell"><label>'+label+'</label><div class="flsm-input-wrap"><input data-flsm-row="'+i+'" data-flsm-key="'+k+'" value="'+esc(v)+'" placeholder="'+label+'">'+mark+'</div></div>';
}
function row(i,s){
  return '<div class="flsm-row"><div class="flsm-index">'+(i+1)+'</div><div class="flsm-net"><strong>Subnet '+(i+1)+'</strong><span>بعد التقسيم</span></div>'+
    field(i,"network","Network")+
    field(i,"first","First Host")+
    field(i,"last","Last Host")+
    field(i,"broadcast","Broadcast")+
    '</div>';
}
function check(){
  document.querySelectorAll("[data-flsm-row]").forEach(el=>{
    const i=Number(el.dataset.flsmRow),k=el.dataset.flsmKey;
    state.answers[i]=state.answers[i]||{};
    state.answers[i][k]=el.value.trim();
  });
  let score=0,total=state.challenge.count*4;
  state.challenge.subs.forEach((s,i)=>["network","first","last","broadcast"].forEach(k=>{if(state.answers[i]?.[k]===s[k])score++}));
  state.score=score;state.checked=true;
  const result={challenge:state.challenge.base,subnets:state.challenge.count,prefix:state.challenge.prefix,score,total,percent:Math.round(score/total*100),at:Date.now()};
  state.attempts.unshift(result);saveAttempts();
}
export function flsmPage(){
  if(!state.challenge)makeChallenge();
  const c=state.challenge;
  const pct=state.checked?Math.round(state.score/(c.count*4)*100):0;
  return `
  <div class="page-intro with-action"><div><span class="eyebrow green">FLSM Challenge • V2.6</span><h2>قسّم الشبكة إلى Subnets متساوية</h2><p>ابدأ من شبكة واحدة، ثم ابنِ جميع الشبكات الناتجة وحدد بيانات كل Subnet.</p></div><span class="badge">${state.checked?pct+"%":"سيناريو عملي"}</span></div>
  <div class="flsm-hero"><div><span class="eyebrow">المهمة</span><div class="flsm-base">${c.base}</div><p>قسّمها إلى <strong>${c.count} شبكات متساوية</strong> باستخدام <strong>/${c.prefix}</strong>.</p></div><div class="flsm-facts"><div><span>Prefix</span><b>/${c.prefix}</b></div><div><span>Mask</span><b>${c.mask}</b></div><div><span>Block Size</span><b>${c.block}</b></div></div></div>
  <div class="card flsm-card">
    <div class="flsm-table-head"><h3>جدول الشبكات</h3><span class="muted">${c.count} Subnets × 4 قيم</span></div>
    <div class="flsm-table">
      <div class="flsm-header"><span>#</span><span>Subnet</span><span>Network</span><span>First Host</span><span>Last Host</span><span>Broadcast</span></div>
      ${c.subs.map((s,i)=>row(i,s)).join("")}
    </div>
    <div class="flsm-actions"><button class="btn btn-green" id="check-flsm">تحقق من الحل</button><button class="btn btn-soft" id="show-flsm-solution">إظهار الحل</button><button class="btn btn-primary" id="new-flsm">تحدي جديد</button></div>
    <div class="lab-feedback"><strong>التوجيه:</strong> بعد تحديد الـPrefix الجديد، استخدم Block Size للانتقال من Network إلى Network التالية.</div>
    ${state.checked?'<div class="lab-solution-summary">النتيجة: '+state.score+' من '+(c.count*4)+' ('+pct+'%). عدد العناوين في كل Subnet = '+c.block+'، والمضيفون القابلون للاستخدام = '+Math.max(0,c.block-2)+'.</div>':""}
  </div>
  <div class="card flsm-method"><h3>قاعدة FLSM</h3><div class="flsm-method-grid"><div><b>1</b><span>حدد عدد الشبكات المطلوبة.</span></div><div><b>2</b><span>استخرج عدد البتات المستعارة.</span></div><div><b>3</b><span>حدد Prefix وMask الجديد.</span></div><div><b>4</b><span>احسب Block Size.</span></div><div><b>5</b><span>أنشئ الشبكات بالتتابع.</span></div></div></div>
  <div class="section-title"><h3>محاولاتك الأخيرة</h3><span class="badge">${state.attempts.length} محفوظة</span></div>
  <div class="card flsm-history">${state.attempts.length?state.attempts.slice(0,5).map(x=>'<div class="lab-history-row"><div><strong>'+x.challenge+'</strong><span class="muted">• /'+x.prefix+' • '+x.subnets+' شبكات</span></div><span class="badge '+(x.percent>=80?"green":x.percent>=60?"orange":"red")+'">'+x.percent+'%</span></div>').join(""):'<div class="empty">لا توجد محاولات بعد.</div>'}</div>
  `;
}
export function handleFlsmAction(target){
  if(target.id==="check-flsm"){check();return{rerender:true}}
  if(target.id==="show-flsm-solution"){state.challenge.subs.forEach((s,i)=>{state.answers[i]={...s}});state.checked=true;state.score=state.challenge.count*4;return{rerender:true}}
  if(target.id==="new-flsm"){makeChallenge();return{rerender:true}}
  return null;
}
