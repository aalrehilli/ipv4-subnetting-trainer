const KEY="ipv4AcademyV25SubnetLab";

const state={
  challenge:null,
  answers:{network:"",first:"",last:"",broadcast:"",mask:"",hosts:""},
  checked:false,
  score:0,
  attempts:loadAttempts()
};

function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function ipToInt(ip){
  const p=String(ip).trim().split(".").map(Number);
  if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255))return null;
  return (((p[0]<<24)>>>0)+(p[1]<<16)+(p[2]<<8)+p[3])>>>0;
}
function intToIp(n){
  n=n>>>0;
  return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join(".");
}
function maskFromPrefix(prefix){
  if(prefix===0)return "0.0.0.0";
  return intToIp((0xffffffff<<(32-prefix))>>>0);
}
function calculate(ip,prefix){
  const value=ipToInt(ip);
  const mask=prefix===0?0:((0xffffffff<<(32-prefix))>>>0);
  const network=(value&mask)>>>0;
  const broadcast=(network|(~mask>>>0))>>>0;
  const total=2**(32-prefix);
  const usable=prefix>=31?total:Math.max(0,total-2);
  return {
    network:intToIp(network),
    first:prefix>=31?intToIp(network):intToIp(network+1),
    last:prefix>=31?intToIp(broadcast):intToIp(broadcast-1),
    broadcast:intToIp(broadcast),
    mask:maskFromPrefix(prefix),
    total,
    hosts:usable
  };
}
function loadAttempts(){
  try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}
}
function saveAttempts(){localStorage.setItem(KEY,JSON.stringify(state.attempts.slice(-20)))}
function newChallenge(){
  const prefix=rand(25,30);
  const third=rand(1,220);
  const host=rand(1,254);
  const ip="192.168."+third+"."+host;
  state.challenge={ip,prefix,full:ip+"/"+prefix,solution:calculate(ip,prefix)};
  state.answers={network:"",first:"",last:"",broadcast:"",mask:"",hosts:""};
  state.checked=false;
  state.score=0;
}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}

function inputRow(key,label,placeholder){
  const value=state.answers[key]||"";
  let status="";
  if(state.checked){
    const ok=normalize(key,value)===normalize(key,state.challenge.solution[key]);
    status=ok?'<span class="lab-ok">✓ صحيح</span>':'<span class="lab-bad">✕ راجع</span>';
  }
  return '<div class="lab-field"><label>'+label+'</label><div class="lab-input-wrap"><input id="lab-'+key+'" value="'+esc(value)+'" placeholder="'+placeholder+'" autocomplete="off">'+status+'</div></div>';
}
function normalize(key,v){
  const text=String(v??"").trim();
  if(key==="hosts")return String(parseInt(text,10));
  return text;
}
function guidance(){
  const s=state.challenge.solution;
  if(!state.checked)return "احسب Network وBroadcast أولاً، ثم اشتق أول وآخر Host والقناع وعدد المضيفين.";
  const wrong=Object.keys(state.answers).filter(k=>normalize(k,state.answers[k])!==normalize(k,s[k]));
  if(!wrong.length)return "ممتاز. جميع الخانات صحيحة. حاول تنفيذ السؤال التالي بزمن أقل.";
  return "ابدأ من الخانة التي أخطأت فيها: القناع ↔ حجم البلوك ↔ Network ↔ Broadcast.";
}

export function labPage(){
  if(!state.challenge)newChallenge();
  const s=state.challenge.solution;
  const a=state.attempts;
  const last=a[0];
  const percent=state.checked?Math.round(state.score/6*100):0;
  return `
  <div class="page-intro"><span class="eyebrow green">06 • المختبرات</span><h2>مختبر Subnetting التفاعلي</h2><p>حل المسألة بنفسك. المنصة ستصحح كل خانة وتشرح لك أين الخطأ.</p></div>

  <div class="lab-challenge-hero">
    <div><span class="eyebrow">التحدي الحالي</span><div class="challenge-ip">${state.challenge.full}</div><p>حدد كل معلومات الشبكة لهذا العنوان.</p></div>
    <div class="challenge-meta"><span>6 عناصر</span><span>مستوى متوسط</span><span>FLSM</span></div>
  </div>

  <div class="lab-layout">
    <div class="card subnet-lab-card">
      <div class="lab-section-title"><h3>حل المسألة</h3><span class="badge">${state.checked?percent+"%":"لم يتم التصحيح"}</span></div>
      <div class="lab-grid">
        ${inputRow("network","Network Address","مثال: 192.168.10.128")}
        ${inputRow("first","First Host","مثال: 192.168.10.129")}
        ${inputRow("last","Last Host","مثال: 192.168.10.190")}
        ${inputRow("broadcast","Broadcast","مثال: 192.168.10.191")}
        ${inputRow("mask","Subnet Mask","مثال: 255.255.255.192")}
        ${inputRow("hosts","Usable Hosts","مثال: 62")}
      </div>
      <div class="lab-actions">
        <button class="btn btn-green" id="check-subnet-lab">تحقق من الحل</button>
        <button class="btn btn-soft" id="show-subnet-solution">إظهار الحل</button>
        <button class="btn btn-primary" id="new-subnet-challenge">سؤال جديد</button>
      </div>
      <div class="lab-feedback"><strong>التوجيه:</strong> ${guidance()}</div>
      ${state.checked?'<div class="lab-solution-summary"><strong>الحل الصحيح:</strong> '+s.network+' • '+s.first+' • '+s.last+' • '+s.broadcast+' • '+s.mask+' • '+s.hosts+' مضيفًا قابلًا للاستخدام</div>':""}
    </div>

    <aside class="card lab-guide-card">
      <span class="eyebrow blue">طريقة الحل</span>
      <h3>6 خطوات</h3>
      <div class="lab-step"><b>1</b><span>حدد الـ Prefix</span></div>
      <div class="lab-step"><b>2</b><span>حوّل إلى Subnet Mask</span></div>
      <div class="lab-step"><b>3</b><span>احسب Magic Number / Block Size</span></div>
      <div class="lab-step"><b>4</b><span>حدد Network</span></div>
      <div class="lab-step"><b>5</b><span>حدد Broadcast ثم أول وآخر Host</span></div>
      <div class="lab-step"><b>6</b><span>احسب عدد المضيفين</span></div>
      <div class="tip-rule"><strong>قاعدة:</strong> عدد العناوين = 2<sup>عدد بتات الـHost</sup>.</div>
    </aside>
  </div>

  <div class="section-title"><h3>نتائجك الأخيرة</h3><span class="badge">${a.length} محاولة محفوظة</span></div>
  <div class="card lab-history">
    ${a.length?a.slice(0,5).map(x=>'<div class="lab-history-row"><div><strong>'+x.challenge+'</strong><span class="muted">• '+x.percent+'%</span></div><span class="badge '+(x.percent>=80?"green":x.percent>=60?"orange":"red")+'">'+x.score+'/6</span></div>').join(""):'<div class="empty">ستظهر نتائجك هنا بعد أول محاولة.</div>'}
  </div>
  `;
}

function readAnswers(){
  ["network","first","last","broadcast","mask","hosts"].forEach(k=>{
    const el=document.getElementById("lab-"+k);
    if(el)state.answers[k]=el.value.trim();
  });
}
function check(){
  readAnswers();
  const keys=["network","first","last","broadcast","mask","hosts"];
  state.score=keys.reduce((sum,k)=>sum+(normalize(k,state.answers[k])===normalize(k,state.challenge.solution[k])?1:0),0);
  state.checked=true;
  const result={challenge:state.challenge.full,score:state.score,percent:Math.round(state.score/6*100),at:Date.now()};
  state.attempts.unshift(result);
  saveAttempts();
  return result;
}

export function handleLabAction(target){
  if(target.id==="check-subnet-lab"){check();return {rerender:true}}
  if(target.id==="show-subnet-solution"){
    Object.assign(state.answers,state.challenge.solution);
    state.checked=true;
    state.score=6;
    return {rerender:true}
  }
  if(target.id==="new-subnet-challenge"){newChallenge();return {rerender:true}}
  return null;
}

export function resetLab(){
  state.challenge=null;
  state.answers={network:"",first:"",last:"",broadcast:"",mask:"",hosts:""};
  state.checked=false;
}
