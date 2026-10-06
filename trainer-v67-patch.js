/* IPv4 Subnetting Trainer — V67 Trainer Dashboard Live Patch */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const safe=v=>typeof window.esc==="function"?window.esc(v):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const ready=()=>typeof window.db!=="undefined"&&window.db&&typeof window.profile!=="undefined"&&window.profile&&["trainer","admin"].includes(window.profile.role);

  function styles(){
    if($("v67Styles"))return;
    const s=document.createElement("style");s.id="v67Styles";
    s.textContent=
      "#trainerV67Live{margin-top:16px}"+
      ".v67-toolbar{display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:10px;align-items:end}"+
      ".v67-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}"+
      ".v67-kpi{background:linear-gradient(135deg,#f7fbff,#fff);border:1px solid #dce8f2;border-radius:14px;padding:14px}"+
      ".v67-kpi .label{color:#65788a;font-size:13px}.v67-kpi .value{font-size:28px;font-weight:800;color:#0759a5}"+
      ".v67-risk{color:#b3261e;font-weight:700}.v67-empty{padding:18px;text-align:center;color:#65788a}.v67-scroll{overflow:auto}"+
      "@media(max-width:1000px){.v67-toolbar{grid-template-columns:1fr 1fr}.v67-kpis{grid-template-columns:1fr 1fr}}"+
      "@media(max-width:600px){.v67-toolbar,.v67-kpis{grid-template-columns:1fr}.v67-kpi .value{font-size:23px}}";
    document.head.appendChild(s);
  }

  function panel(){
    const trainer=$("trainer"); if(!trainer||$("trainerV67Live"))return;
    const host=document.createElement("div");host.id="trainerV67Live";host.className="card";
    host.innerHTML=
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'+
        '<div><h3 style="margin:0">🎯 مركز قيادة المدرب — V67</h3><div class="muted">فلترة مباشرة للمتدربين وتحديد الحالات التي تحتاج متابعة.</div></div>'+
        '<button class="primary" id="v67Refresh">🔄 تحديث</button>'+
      '</div>'+
      '<div class="v67-toolbar" style="margin-top:14px">'+
        '<div><label>بحث</label><input id="v67Search" placeholder="اسم المتدرب أو الرقم"></div>'+
        '<div><label>الشعبة</label><select id="v67Group"><option value="">كل الشعب</option></select></div>'+
        '<div><label>النشاط</label><select id="v67Activity"><option value="all">كل الأنشطة</option><option value="exam">الاختبارات</option><option value="practice">التمارين</option></select></div>'+
        '<div><label>الحالة</label><select id="v67Status"><option value="all">الكل</option><option value="risk">يحتاج متابعة</option><option value="ok">أداؤه جيد</option><option value="new">لم يبدأ</option></select></div>'+
        '<button class="primary green" id="v67Export">⬇️ CSV</button>'+
      '</div>'+
      '<div id="v67Kpis" class="v67-kpis"></div><div id="v67Table" class="v67-scroll"></div>';
    const hero=trainer.querySelector(".hero"); hero?hero.insertAdjacentElement("afterend",host):trainer.prepend(host);
    ["v67Search","v67Group","v67Activity","v67Status"].forEach(id=>$(id).addEventListener("input",load));
    ["v67Group","v67Activity","v67Status"].forEach(id=>$(id).addEventListener("change",load));
    $("v67Refresh").onclick=load;$("v67Export").onclick=exportCsv;
  }

  async function data(){
    const [p,a,e]=await Promise.all([
      window.db.from("profiles").select("id,full_name,student_id,group_name,role,created_at").eq("role","student").order("created_at",{ascending:false}),
      window.db.from("attempts").select("id,student_id,percentage,submitted_at,exam_id,trainer_exams(title,topic,group_name)"),
      window.db.from("exercise_attempts").select("id,student_id,score,is_correct,created_at")
    ]);
    if(p.error)throw p.error;if(a.error)throw a.error;if(e.error)throw e.error;
    return {p:p.data||[],a:a.data||[],e:e.data||[]};
  }

  function build(d){
    const m=new Map(d.p.map(p=>[p.id,{id:p.id,name:p.full_name||"بدون اسم",sid:p.student_id||"",group:p.group_name||"",items:[]}]));
    d.a.forEach(x=>{const s=m.get(x.student_id);if(s)s.items.push({kind:"exam",score:Number(x.percentage||0),date:x.submitted_at,title:x.trainer_exams?.title||"اختبار"});});
    d.e.forEach(x=>{const s=m.get(x.student_id);if(s)s.items.push({kind:"practice",score:Number(x.score||0),date:x.created_at,title:"تمرين Subnetting"});});
    for(const s of m.values()){
      s.count=s.items.length;s.avg=s.count?Math.round(s.items.reduce((z,x)=>z+x.score,0)/s.count):0;
      s.last=s.items.reduce((z,x)=>!z||new Date(x.date)>new Date(z)?x.date:z,null);
      s.kinds=new Set(s.items.map(x=>x.kind));s.status=!s.count?"new":s.avg<60?"risk":"ok";
    }
    return [...m.values()];
  }

  function filter(m){
    const q=($("v67Search")?.value||"").trim().toLowerCase(),g=$("v67Group")?.value||"",k=$("v67Activity")?.value||"all",st=$("v67Status")?.value||"all";
    return m.filter(s=>(!q||`${s.name} ${s.sid}`.toLowerCase().includes(q))&&(!g||s.group===g)&&(!k||k==="all"||s.kinds.has(k))&&(!st||st==="all"||s.status===st));
  }

  function render(m,total){
    const active=m.filter(s=>s.last&&(Date.now()-new Date(s.last).getTime())<=604800000).length;
    const avg=m.length?Math.round(m.reduce((z,s)=>z+s.avg,0)/m.length):0,risk=m.filter(s=>s.status==="risk").length+ m.filter(s=>s.status==="new").length;
    $("v67Kpis").innerHTML=[
      ["إجمالي المتدربين",total],["نشطون خلال 7 أيام",active],["متوسط الأداء",avg+"%"],["يحتاجون متابعة",risk]
    ].map(x=>`<div class="v67-kpi"><div class="label">${safe(x[0])}</div><div class="value">${safe(x[1])}</div></div>`).join("");
    const rows=[...m].sort((a,b)=>a.avg-b.avg||a.count-b.count);
    $("v67Table").innerHTML=rows.length?`<table><tr><th>المتدرب</th><th>الرقم</th><th>الشعبة</th><th>المحاولات</th><th>المتوسط</th><th>آخر نشاط</th><th>الحالة</th><th>الإجراء</th></tr>${rows.map(s=>`<tr><td style="text-align:right"><b>${safe(s.name)}</b></td><td>${safe(s.sid||"—")}</td><td>${safe(s.group||"—")}</td><td>${s.count}</td><td>${s.avg}%</td><td>${s.last?new Date(s.last).toLocaleDateString("ar-SA"):"لم يبدأ"}</td><td class="${s.status==="risk"?"v67-risk":""}">${s.status==="new"?"🆕 لم يبدأ":s.status==="risk"?"⚠️ يحتاج متابعة":"✅ جيد"}</td><td><button class="primary" onclick="window.v67EditGroup('${safe(s.id)}','${safe(s.group)}')">✏️ الشعبة</button></td></tr>`).join("")}</table>`:"<div class='v67-empty'>لا توجد بيانات مطابقة.</div>";
  }

  async function load(){
    if(!ready())return;
    styles();panel();$("v67Table").innerHTML="<div class='v67-empty'>⏳ جارٍ التحميل...</div>";
    try{
      const d=await data(),m=build(d),sel=$("v67Group"),cur=sel.value,groups=[...new Set(m.map(s=>s.group).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
      sel.innerHTML='<option value="">كل الشعب</option>'+groups.map(g=>`<option value="${safe(g)}">${safe(g)}</option>`).join("");
      sel.value=groups.includes(cur)?cur:"";window._v67=m;render(filter(m),m.length);
    }catch(e){$("v67Table").innerHTML='<div class="bad">❌ تعذر تحميل مركز V67: '+safe(e.message||e)+"</div>";}
  }

  window.v67EditGroup=async function(id,current){
    if(!ready())return;
    const v=window.prompt("أدخل رقم/اسم الشعبة الجديد:",current||"");if(v===null)return;
    const group_name=v.trim();if(!group_name)return alert("اكتب الشعبة.");
    const r=await window.db.from("profiles").update({group_name}).eq("id",id);
    if(r.error)return alert("تعذر تحديث الشعبة: "+r.error.message);
    await load();if(typeof window.loadTrainerStudents==="function")window.loadTrainerStudents();if(typeof window.loadTrainerOverview==="function")window.loadTrainerOverview();
  };

  function exportCsv(){
    const m=filter(window._v67||[]),rows=[["Student","Student ID","Group","Attempts","Average","Status","Last Activity"],...m.map(s=>[s.name,s.sid,s.group,s.count,s.avg,s.status==="new"?"New":s.status==="risk"?"Needs Follow-up":"Good",s.last||""])];
    const csv="\ufeff"+rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="trainer_v67_students.csv";a.click();
  }

  function hook(){
    if(!ready())return;styles();panel();
    if(typeof window.trainerTab==="function"&&!window.trainerTab.__v67){
      const old=window.trainerTab;
      const wrap=function(tab,btn){const r=old.apply(this,arguments);setTimeout(()=>{panel();if(tab==="overview")load();},50);return r;};
      wrap.__v67=true;window.trainerTab=wrap;
    }
    if(typeof window.renderTrainer==="function"&&!window.renderTrainer.__v67){
      const old=window.renderTrainer;
      const wrap=async function(){const r=await old.apply(this,arguments);await load();return r;};
      wrap.__v67=true;window.renderTrainer=wrap;
    }
  }

  window.addEventListener("DOMContentLoaded",()=>setTimeout(hook,400));
  setTimeout(hook,1200);
})();