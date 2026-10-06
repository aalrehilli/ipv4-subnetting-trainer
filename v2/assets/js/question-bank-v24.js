import {questions as seedQuestions} from "./demo-data.js";

const KEY="ipv4AcademyV24QuestionBank";
const topics=["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"];
const difficulties=["easy","medium","hard"];

function uid(){return "q-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)}

function cloneSeed(){
  return seedQuestions.map(q=>({...q,options:[...q.opts],active:true,stats:{uses:Math.floor(5+Math.random()*40),correctRate:Math.floor(45+Math.random()*45)}}));
}
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||"null");
    if(Array.isArray(saved)&&saved.length)return saved;
  }catch{}
  const seed=cloneSeed();
  localStorage.setItem(KEY,JSON.stringify(seed));
  return seed;
}
function save(list){localStorage.setItem(KEY,JSON.stringify(list))}
let bank=load();

export const qbankState={
  search:"",
  topic:"",
  difficulty:"",
  modal:null,
  editingId:null,
  previewId:null
};

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const diffLabel=d=>d==="hard"?"متقدم":d==="medium"?"متوسط":"سهل";
const diffClass=d=>d==="hard"?"red":d==="medium"?"orange":"green";

export function refreshBank(){bank=load();return bank}

function filtered(){
  return bank.filter(q=>{
    const text=(q.q+" "+q.topic+" "+q.difficulty).toLowerCase();
    return (!qbankState.search||text.includes(qbankState.search.toLowerCase()))
      && (!qbankState.topic||q.topic===qbankState.topic)
      && (!qbankState.difficulty||q.difficulty===qbankState.difficulty);
  });
}

function stats(){
  const total=bank.length;
  const active=bank.filter(q=>q.active!==false).length;
  const avg=total?Math.round(bank.reduce((s,q)=>s+(q.stats?.correctRate??0),0)/total):0;
  return {total,active,avg};
}

function row(q){
  const rate=q.stats?.correctRate??0;
  return `
  <tr>
    <td class="qbank-id"><span class="badge">${esc(q.id)}</span></td>
    <td><strong>${esc(q.q)}</strong><div class="muted">استخدام: ${q.stats?.uses??0} • دقة: ${rate}%</div></td>
    <td><span class="badge">${esc(q.topic)}</span></td>
    <td><span class="badge ${diffClass(q.difficulty)}">${diffLabel(q.difficulty)}</span></td>
    <td><span class="q-quality ${rate<55?"low":rate<75?"mid":"high"}">${rate<55?"مربك":rate<75?"مقبول":"جيد"}</span></td>
    <td><div class="qactions"><button class="btn btn-soft mini-btn" data-q-action="preview" data-q-id="${esc(q.id)}">معاينة</button><button class="btn btn-primary mini-btn" data-q-action="edit" data-q-id="${esc(q.id)}">تعديل</button></div></td>
  </tr>`;
}

export function questionBankView(){
  const s=stats();
  const rows=filtered();
  if(qbankState.modal==="editor")return editorView();
  if(qbankState.modal==="preview")return previewView();

  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow purple">04 • بنك الأسئلة</span><h2>بنك الأسئلة</h2><p>كل سؤال له موضوع وصعوبة ونتيجة أداء، ويمكن معاينته قبل إدخاله في اختبار.</p></div>
    <button class="btn btn-purple" data-q-action="new">+ إنشاء سؤال</button>
  </div>

  <div class="student-grid-4 qbank-kpis">
    <div class="card trainer-kpi"><div class="muted">إجمالي الأسئلة</div><div class="kpi-value">${s.total}</div><div class="muted">كل الأنواع</div></div>
    <div class="card trainer-kpi"><div class="muted">نشطة</div><div class="kpi-value">${s.active}</div><div class="muted">جاهزة للاستخدام</div></div>
    <div class="card trainer-kpi"><div class="muted">متوسط الدقة</div><div class="kpi-value">${s.avg}%</div><div class="muted">من المحاولات المسجلة</div></div>
    <div class="card trainer-kpi"><div class="muted">أسئلة تحتاج مراجعة</div><div class="kpi-value">${bank.filter(q=>(q.stats?.correctRate??0)<55).length}</div><div class="muted">دقة منخفضة</div></div>
  </div>

  <div class="card qbank-toolbar">
    <div><label>بحث</label><input id="qbank-search" value="${esc(qbankState.search)}" placeholder="ابحث في نص السؤال..."></div>
    <div><label>الموضوع</label><select id="qbank-topic"><option value="">كل الموضوعات</option>${topics.map(x=>`<option ${qbankState.topic===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div><label>الصعوبة</label><select id="qbank-difficulty"><option value="">كل المستويات</option><option value="easy" ${qbankState.difficulty==="easy"?"selected":""}>سهل</option><option value="medium" ${qbankState.difficulty==="medium"?"selected":""}>متوسط</option><option value="hard" ${qbankState.difficulty==="hard"?"selected":""}>متقدم</option></select></div>
    <div class="qbank-count"><strong>${rows.length}</strong><span>سؤال مطابق</span></div>
  </div>

  <div class="card qbank-table-wrap">
    <table class="table qbank-table">
      <thead><tr><th>ID</th><th>السؤال</th><th>الموضوع</th><th>الصعوبة</th><th>الجودة</th><th>إجراء</th></tr></thead>
      <tbody>${rows.length?rows.map(row).join(""):'<tr><td colspan="6"><div class="empty">لا توجد أسئلة مطابقة للفلاتر.</div></td></tr>'}</tbody>
    </table>
  </div>`;
}

function editorView(){
  const q=bank.find(x=>x.id===qbankState.editingId);
  const isNew=!q;
  const data=q||{q:"",topic:"Binary",difficulty:"easy",options:["","","",""],a:0,why:"",active:true};
  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow purple">Question Builder</span><h2>${isNew?"إنشاء سؤال":"تعديل السؤال"}</h2><p>ابنِ السؤال ثم عاينه قبل الحفظ.</p></div>
    <button class="btn btn-soft" data-q-action="back">رجوع للبنك</button>
  </div>
  <div class="qbuilder-grid">
    <div class="card">
      <div class="qbuilder-section"><h3>المحتوى</h3>
        <label>نص السؤال</label><textarea id="q-edit-text" rows="4" placeholder="اكتب السؤال هنا...">${esc(data.q)}</textarea>
        <div class="grid-2">
          <div><label>الموضوع</label><select id="q-edit-topic">${topics.map(x=>`<option ${data.topic===x?"selected":""}>${x}</option>`).join("")}</select></div>
          <div><label>الصعوبة</label><select id="q-edit-diff"><option value="easy" ${data.difficulty==="easy"?"selected":""}>سهل</option><option value="medium" ${data.difficulty==="medium"?"selected":""}>متوسط</option><option value="hard" ${data.difficulty==="hard"?"selected":""}>متقدم</option></select></div>
        </div>
      </div>
      <div class="qbuilder-section"><h3>الخيارات</h3>
        <div class="qbuilder-options">
          ${data.options.map((o,i)=>`<div class="q-option-edit"><span>${String.fromCharCode(65+i)}</span><input id="q-opt-${i}" value="${esc(o)}" placeholder="الخيار ${i+1}"><label><input type="radio" name="q-correct" value="${i}" ${Number(data.a)===i?"checked":""}> الإجابة الصحيحة</label></div>`).join("")}
        </div>
      </div>
      <div class="qbuilder-section"><h3>التفسير</h3><textarea id="q-edit-why" rows="3" placeholder="اكتب القاعدة أو سبب الإجابة الصحيحة...">${esc(data.why)}</textarea></div>
      <div class="qbuilder-actions"><button class="btn btn-soft" data-q-action="preview-edit">معاينة</button><button class="btn btn-primary" data-q-action="save">حفظ السؤال</button></div>
    </div>
    <div class="card qbuilder-tips"><span class="eyebrow blue">جودة السؤال</span><h3>قائمة سريعة</h3><div class="stat-row"><span>سؤال واضح</span><b>✓</b></div><div class="stat-row"><span>إجابة واحدة صحيحة</span><b>✓</b></div><div class="stat-row"><span>مرتبطة بموضوع</span><b>✓</b></div><div class="stat-row"><span>تفسير للإجابة</span><b>مهم</b></div><div class="smart-rule"><strong>ملاحظة</strong><p class="muted">السؤال الجيد يقيس مفهومًا واحدًا قدر الإمكان، ويحتوي على بدائل معقولة وليست واضحة الخطأ.</p></div></div>
  </div>`;
}

function previewView(){
  const q=bank.find(x=>x.id===qbankState.previewId);
  if(!q){qbankState.modal=null;return questionBankView()}
  return `
  <div class="page-intro with-action"><div><span class="eyebrow blue">Question Preview</span><h2>معاينة السؤال</h2><p>هذه هي الصورة التي يراها المتدرب.</p></div><button class="btn btn-soft" data-q-action="back">رجوع</button></div>
  <div class="preview-layout">
    <div class="card preview-question-card"><div class="question-meta"><span class="badge">${esc(q.topic)}</span><span class="badge ${diffClass(q.difficulty)}">${diffLabel(q.difficulty)}</span></div><h2>${esc(q.q)}</h2><div class="answer-grid">${q.options.map((o,i)=>`<button class="answer-option preview-only"><span>${String.fromCharCode(65+i)}</span>${esc(o)}</button>`).join("")}</div><div class="tip-rule"><strong>التفسير للمدرب:</strong> ${esc(q.why||"لا يوجد تفسير مسجل بعد.")}</div></div>
    <aside class="card"><h3>تحليل السؤال</h3><div class="stat-row"><span>الاستخدام</span><b>${q.stats?.uses??0}</b></div><div class="stat-row"><span>نسبة الإجابة الصحيحة</span><b>${q.stats?.correctRate??0}%</b></div><div class="stat-row"><span>التقييم</span><b>${(q.stats?.correctRate??0)>=75?"جيد":"يحتاج مراجعة"}</b></div><button class="btn btn-primary" data-q-action="edit" data-q-id="${esc(q.id)}" style="margin-top:12px">تعديل السؤال</button></aside>
  </div>`;
}

export function handleQuestionBankAction(target){
  const act=target.dataset.qAction;
  if(act==="new"){qbankState.modal="editor";qbankState.editingId=null;return {rerender:true}}
  if(act==="edit"){qbankState.modal="editor";qbankState.editingId=target.dataset.qId;return {rerender:true}}
  if(act==="preview"){qbankState.modal="preview";qbankState.previewId=target.dataset.qId;return {rerender:true}}
  if(act==="back"){qbankState.modal=null;qbankState.editingId=null;qbankState.previewId=null;return {rerender:true}}
  if(act==="preview-edit"){return {previewData:readEditor(),rerenderPreview:true}}
  if(act==="save"){saveEditor();qbankState.modal=null;qbankState.editingId=null;return {rerender:true}}
  return null;
}

export function updateFilter(kind,value){
  qbankState[kind]=value;
}

function readEditor(){
  const options=[0,1,2,3].map(i=>document.getElementById("q-opt-"+i)?.value||"");
  const correct=Number(document.querySelector('input[name="q-correct"]:checked')?.value||0);
  return {q:document.getElementById("q-edit-text")?.value||"",topic:document.getElementById("q-edit-topic")?.value||"Binary",difficulty:document.getElementById("q-edit-diff")?.value||"easy",options,a:correct,why:document.getElementById("q-edit-why")?.value||""};
}
function saveEditor(){
  const data=readEditor();
  if(!data.q.trim())return;
  if(data.options.filter(Boolean).length<2)return;
  if(qbankState.editingId){
    const idx=bank.findIndex(x=>x.id===qbankState.editingId);
    if(idx>=0)bank[idx]={...bank[idx],...data};
  }else{
    bank.unshift({id:uid(),...data,active:true,stats:{uses:0,correctRate:0}});
  }
  save(bank);
}
export function getEditingData(){return readEditor()}
export function previewEditorState(){
  const data=readEditor();
  return `
  <div class="page-intro with-action"><div><span class="eyebrow blue">Question Preview</span><h2>معاينة السؤال</h2><p>معاينة قبل الحفظ.</p></div><button class="btn btn-soft" data-q-action="back-editor">عودة للتحرير</button></div>
  <div class="card preview-question-card"><div class="question-meta"><span class="badge">${esc(data.topic)}</span><span class="badge ${diffClass(data.difficulty)}">${diffLabel(data.difficulty)}</span></div><h2>${esc(data.q||"السؤال فارغ")}</h2><div class="answer-grid">${data.options.map((o,i)=>`<div class="answer-option preview-only"><span>${String.fromCharCode(65+i)}</span>${esc(o||"—")}</div>`).join("")}</div><div class="tip-rule"><strong>التفسير:</strong> ${esc(data.why||"—")}</div></div>`;
}
