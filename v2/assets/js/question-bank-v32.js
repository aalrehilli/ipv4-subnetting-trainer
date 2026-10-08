import {questions as seedQuestions} from "./demo-data.js";

const KEY="ipv4AcademyV32QuestionBank";
const LEGACY_KEY="ipv4AcademyV24QuestionBank";
const ATTEMPTS_KEY="ipv4AcademyV327Attempts";
const EXAM_CONFIG_KEY="ipv4AcademyV317ExamConfig";
const EXAM_PICK_KEY="ipv4AcademyV319ExamPick";
const topics=["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"];
const difficulties=["easy","medium","hard"];

function uid(){const nums=bank.map(q=>Number(q.id)).filter(Number.isFinite);return nums.length?Math.max(...nums)+1:1}

function cloneSeed(){
  const now=Date.now();
  return seedQuestions.map(q=>normalizeQuestion({...q,options:[...q.opts],active:true,createdAt:now,updatedAt:now,version:1}));
}
function normalizeQuestion(q){
  const options=Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);
  const cleanOptions=options.map(x=>String(x??"").trim()).slice(0,4);
  while(cleanOptions.length<4)cleanOptions.push("");
  const usable=cleanOptions.filter(Boolean).length;
  const a=Number(q?.a);
  return {id:Number(q?.id)||0,q:String(q?.q??q?.prompt??"").trim(),topic:topics.includes(q?.topic)?q.topic:"Binary",difficulty:difficulties.includes(q?.difficulty)?q.difficulty:"easy",options:cleanOptions,opts:cleanOptions,a:Number.isInteger(a)&&a>=0&&a<Math.max(1,usable)?a:0,why:String(q?.why??"").trim(),active:q?.active!==false&&q?.is_active!==false,points:Math.max(.25,Number(q?.points??1)||1),lessonId:q?.lessonId==null?null:String(q.lessonId),skill:String(q?.skill??"").trim(),tags:Array.isArray(q?.tags)?q.tags.map(x=>String(x).trim()).filter(Boolean).slice(0,8):String(q?.tags??"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,8),code:String(q?.code??"").trim(),stats:{uses:Math.max(0,Number(q?.stats?.uses)||0),correctRate:Math.max(0,Math.min(100,Number(q?.stats?.correctRate)||0))},createdAt:q?.createdAt||Date.now(),updatedAt:q?.updatedAt||Date.now(),version:Math.max(1,Number(q?.version)||1)};
}
function syncAttemptStats(list){
  let attempts=[];
  try{attempts=JSON.parse(localStorage.getItem(ATTEMPTS_KEY)||"[]");if(!Array.isArray(attempts))attempts=[]}catch{attempts=[]}
  const counts={};
  attempts.forEach(a=>(a.questionResults||[]).forEach(x=>{const id=Number(x.id);if(!Number.isFinite(id))return;if(!counts[id])counts[id]={uses:0,correct:0};counts[id].uses++;if(x.correct===true)counts[id].correct++}));
  return list.map(q=>{const c=counts[Number(q.id)];return c?{...q,stats:{uses:c.uses,correctRate:Math.round(c.correct/c.uses*100)}}:q});
}
function load(){
  try{
    const current=JSON.parse(localStorage.getItem(KEY)||"null");
    if(Array.isArray(current)&&current.length)return current.map(normalizeQuestion);
    const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||"null");
    if(Array.isArray(legacy)&&legacy.length){const migrated=legacy.map(normalizeQuestion);localStorage.setItem(KEY,JSON.stringify(migrated));return migrated;}
  }catch{}
  const seed=cloneSeed();localStorage.setItem(KEY,JSON.stringify(seed));return seed;
}
function save(list){localStorage.setItem(KEY,JSON.stringify(list.map(normalizeQuestion)))}
let bank=load();

export const qbankState={
  search:"",
  topic:"",
  difficulty:"",
  modal:null,
  previewEditor:false,
  editingId:null,
  previewId:null,
  examPick:false,
  status:"",
  importPreview:null
};

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const diffLabel=d=>d==="hard"?"متقدم":d==="medium"?"متوسط":"سهل";
const diffClass=d=>d==="hard"?"red":d==="medium"?"orange":"green";

export function refreshBank(){bank=syncAttemptStats(load());return bank}
export function getQuestionBank(){return [...refreshBank()]}
export function getQuestionById(id){return refreshBank().find(q=>Number(q.id)===Number(id))||null}
export function getQuestionBankStats(){
  const list=refreshBank(),active=list.filter(q=>q.active!==false);
  return {total:list.length,active:active.length,inactive:list.length-active.length,avgAccuracy:active.length?Math.round(active.reduce((s,q)=>s+(q.stats?.correctRate||0),0)/active.length):0,needsReview:active.filter(q=>(q.stats?.uses||0)>=3&&(q.stats?.correctRate||0)<55).length,unlinked:active.filter(q=>!q.lessonId||!q.skill).length};
}
export function validateQuestion(q){
  const issues=[];
  if(!q.q?.trim())issues.push("نص السؤال مطلوب");
  if(!Array.isArray(q.options)||q.options.filter(Boolean).length<2)issues.push("يجب وجود خيارين صالحين على الأقل");
  if(!Number.isInteger(Number(q.a))||Number(q.a)<0||Number(q.a)>=q.options.filter(Boolean).length)issues.push("الإجابة الصحيحة غير صالحة");
  if(!q.topic)issues.push("الموضوع مطلوب");
  if(!q.difficulty)issues.push("مستوى الصعوبة مطلوب");
  return {valid:issues.length===0,issues};
}
function getExamPick(){try{return JSON.parse(localStorage.getItem(EXAM_PICK_KEY)||"[]").map(Number)}catch{return []}}
function setExamPick(ids){localStorage.setItem(EXAM_PICK_KEY,JSON.stringify(Array.from(new Set(ids.map(Number).filter(Number.isFinite))))) }
function applyExamPick(){const ids=getExamPick();if(!ids.length)return null;let cfg={};try{cfg=JSON.parse(localStorage.getItem(EXAM_CONFIG_KEY)||"{}")||{}}catch{};const merged={...cfg,questionIds:ids};localStorage.setItem(EXAM_CONFIG_KEY,JSON.stringify(merged));return merged}

function filtered(){
  return bank.filter(q=>{
    const text=(q.q+" "+q.topic+" "+q.difficulty).toLowerCase();
    return (!qbankState.search||text.includes(qbankState.search.toLowerCase()))
      && (!qbankState.topic||q.topic===qbankState.topic)
      && (!qbankState.difficulty||q.difficulty===qbankState.difficulty)
      && (!qbankState.status||(qbankState.status==="active" ? q.active!==false : q.active===false));
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
  const active=q.active!==false;
  return `
  <tr data-qbank-row data-qbank-text="${esc(q.q+" "+q.topic+" "+diffLabel(q.difficulty))}" data-qbank-topic="${esc(q.topic)}" data-qbank-diff="${esc(q.difficulty)}">
    <td class="qbank-id"><input type="checkbox" class="qbank-pick" data-q-action="pick" data-q-id="${esc(q.id)}" ${getExamPick().includes(Number(q.id))?"checked":""} aria-label="تحديد السؤال للاختبار"><span class="badge">#${esc(q.id)}</span></td>
    <td><strong>${esc(q.q)}</strong><div class="muted">استخدام: ${q.stats?.uses??0} • دقة: ${rate}% • ${q.skill?esc(q.skill):"بدون مهارة"}</div></td>
    <td><span class="badge">${esc(q.topic)}</span></td>
    <td><span class="badge ${diffClass(q.difficulty)}">${diffLabel(q.difficulty)}</span></td>
    <td><span class="badge ${active?"green":"red"}">${active?"نشط":"معطل"}</span> <span class="q-quality ${rate<55?"low":rate<75?"mid":"high"}">${rate<55?"مربك":rate<75?"مقبول":"جيد"}</span></td>
    <td><div class="qactions">
      <button class="btn btn-soft mini-btn" data-q-action="preview" data-q-id="${esc(q.id)}">معاينة</button>
      <button class="btn btn-primary mini-btn" data-q-action="edit" data-q-id="${esc(q.id)}">تعديل</button>
      <button class="btn btn-soft mini-btn" data-q-action="duplicate" data-q-id="${esc(q.id)}">نسخ</button>
      <button class="btn btn-${active?"orange":"green"} mini-btn" data-q-action="toggle" data-q-id="${esc(q.id)}">${active?"تعطيل":"تفعيل"}</button>
      <button class="btn btn-danger mini-btn" data-q-action="delete" data-q-id="${esc(q.id)}">حذف</button>
    </div></td>
  </tr>`;
}

export function questionBankView(){
  const s=getQuestionBankStats();
  const rows=filtered();
  if(qbankState.modal==="editor")return editorView();
  if(qbankState.modal==="preview")return previewView();
  if(qbankState.modal==="editor-preview")return previewEditorState();
  if(qbankState.importPreview)return importPreviewView();

  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow purple">04 • بنك الأسئلة • V3.32</span><h2>بنك الأسئلة النهائي</h2><p>المصدر المركزي للمتدربين والاختبارات والتحليلات. كل سؤال يمتلك هوية وموضوعًا ومستوى ومهارة وبيانات أداء قابلة للتتبع.</p></div>
    <button class="btn btn-purple" data-q-action="new">+ إنشاء سؤال</button>
  </div>

  <div class="student-grid-4 qbank-kpis">
    <div class="card trainer-kpi"><div class="muted">إجمالي الأسئلة</div><div class="kpi-value">${s.total}</div><div class="muted">كل الأنواع</div></div>
    <div class="card trainer-kpi"><div class="muted">نشطة</div><div class="kpi-value">${s.active}</div><div class="muted">جاهزة للاستخدام</div></div>
    <div class="card trainer-kpi"><div class="muted">متوسط الدقة</div><div class="kpi-value">${s.avgAccuracy}%</div><div class="muted">من المحاولات المسجلة</div></div>
    <div class="card trainer-kpi"><div class="muted">أسئلة تحتاج مراجعة</div><div class="kpi-value">${s.needsReview}</div><div class="muted">دقة منخفضة</div></div>
  </div>

  <div class="card qbank-toolbar">
    <div><label>بحث</label><input id="qbank-search" value="${esc(qbankState.search)}" placeholder="ابحث في نص السؤال..."></div>
    <div><label>الموضوع</label><select id="qbank-topic"><option value="">كل الموضوعات</option>${topics.map(x=>`<option ${qbankState.topic===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div><label>الصعوبة</label><select id="qbank-difficulty"><option value="">كل المستويات</option><option value="easy" ${qbankState.difficulty==="easy"?"selected":""}>سهل</option><option value="medium" ${qbankState.difficulty==="medium"?"selected":""}>متوسط</option><option value="hard" ${qbankState.difficulty==="hard"?"selected":""}>متقدم</option></select></div><div><label>الحالة</label><select id="qbank-status"><option value="">كل الحالات</option><option value="active" ${qbankState.status==="active"?"selected":""}>نشطة</option><option value="inactive" ${qbankState.status==="inactive"?"selected":""}>معطلة</option></select></div>
    <div class="qbank-count"><strong>${rows.length}</strong><span>سؤال مطابق</span></div><div class="qbank-count qbank-selected"><strong>${getExamPick().length}</strong><span>محدد للاختبار</span></div><button class="btn btn-orange mini-btn" data-q-action="apply-exam">اعتماد المحدد للاختبار</button><button class="btn btn-soft mini-btn" data-q-action="export-json">تصدير JSON</button><button class="btn btn-soft mini-btn" data-q-action="export-xml">تصدير XML</button><button class="btn btn-soft mini-btn" data-q-action="export-aiken">تصدير Aiken</button><button class="btn btn-purple mini-btn" data-q-action="import-json">استيراد JSON</button><button class="btn btn-purple mini-btn" data-q-action="import-xml">استيراد XML</button><button class="btn btn-purple mini-btn" data-q-action="import-aiken">استيراد Aiken</button><input id="qbank-import-json-file" type="file" accept=".json,application/json" hidden><input id="qbank-import-xml-file" type="file" accept=".xml,text/xml,application/xml" hidden><input id="qbank-import-aiken-file" type="file" accept=".txt,.aiken,text/plain" hidden>
  </div>

  <div class="card qbank-management-note"><strong>V3.32:</strong> البنك الآن مصدر مركزي للسؤال. تم ترحيل بيانات V3.24 تلقائيًا، وتُحتسب الإحصاءات من المحاولات الفعلية.</div>

  <div class="card qbank-table-wrap">
    <table class="table qbank-table">
      <thead><tr><th>اختيار</th><th>ID</th><th>السؤال</th><th>الموضوع</th><th>الصعوبة</th><th>الجودة</th><th>إجراء</th></tr></thead>
      <tbody>${rows.length?rows.map(row).join(""):'<tr><td colspan="7"><div class="empty">لا توجد أسئلة مطابقة للفلاتر.</div></td></tr>'}</tbody>
    </table>
  </div>`;
}

function editorView(){
  const q=bank.find(x=>x.id===qbankState.editingId);
  const isNew=!q;
  const data=q||{q:"",topic:"Binary",difficulty:"easy",options:["","","",""],a:0,why:"",active:true,points:1,lessonId:"",skill:"",tags:[],code:""};
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
      <div class="qbuilder-section"><h3>بيانات السؤال</h3><div class="grid-2"><div><label>المهارة<input id="q-edit-skill" value="${esc(data.skill||"")}" placeholder="مثل: تحويل Binary إلى Decimal"></label></div><div><label>معرف الدرس<input id="q-edit-lesson" value="${esc(data.lessonId||"")}" placeholder="lesson-01"></label></div><div><label>الرمز<input id="q-edit-code" value="${esc(data.code||"")}" placeholder="BIN-001"></label></div><div><label>الدرجة<input type="number" id="q-edit-points" min="0.25" step="0.25" value="${Number(data.points||1)}"></label></div></div><div style="margin-top:8px"><label>وسوم<input id="q-edit-tags" value="${esc((data.tags||[]).join(", "))}" placeholder="subnetting, binary, exam"></label></div></div><div class="qbuilder-section"><h3>الخيارات</h3>
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
  if(act==="edit"){qbankState.modal="editor";qbankState.editingId=Number(target.dataset.qId);return {rerender:true}}
  if(act==="preview"){qbankState.modal="preview";qbankState.previewId=Number(target.dataset.qId);return {rerender:true}}
  if(act==="pick"){const id=Number(target.dataset.qId);const ids=getExamPick();setExamPick(target.checked?ids.concat(id):ids.filter(x=>x!==id));return {rerender:true}}
  if(act==="apply-exam"){const cfg=applyExamPick();return cfg?{rerender:true,examApplied:true}:{rerender:false,message:"حدد سؤالًا واحدًا على الأقل."}}
  if(act==="duplicate"){return duplicateQuestion(Number(target.dataset.qId))}
  if(act==="toggle"){return toggleQuestion(Number(target.dataset.qId))}
  if(act==="delete"){return deleteQuestion(Number(target.dataset.qId))}
  if(act==="export-json"){return {export:"json"}}
  if(act==="export-xml"){return {export:"xml"}}
  if(act==="export-aiken"){return {export:"aiken"}}
  if(act==="import-json"||act==="import-xml"||act==="import-aiken"){return {openImport:act.replace("import-","")}}
  if(act==="import-confirm"){updateImportPreviewFromDom();return confirmImport()}
  if(act==="import-cancel"){return cancelImportPreview()}
  if(act==="import-remove"){return removeImportPreviewItem(target.dataset.importIndex)}
  if(act==="import-select-all"){return setImportSelection(true)}
  if(act==="import-clear-all"){return setImportSelection(false)}
  if(act==="import-select-one"){return toggleImportSelection(target.dataset.importIndex,target.checked)}
  if(act==="back"){qbankState.modal=null;qbankState.editingId=null;qbankState.previewId=null;qbankState.previewEditor=false;return {rerender:true}}
  if(act==="back-editor"){qbankState.modal="editor";return {rerender:true}}
  if(act==="preview-edit"){qbankState.modal="editor-preview";return {rerender:true}}
  if(act==="save"){const ok=saveEditor();if(ok){qbankState.modal=null;qbankState.editingId=null;return {rerender:true}}return {rerender:false}}
  return null;
}

export function updateFilter(kind,value){qbankState[kind]=value;return qbankState;}

function readEditor(){
  const options=[0,1,2,3].map(i=>document.getElementById("q-opt-"+i)?.value||"");
  const correct=Number(document.querySelector('input[name="q-correct"]:checked')?.value||0);
  return {q:document.getElementById("q-edit-text")?.value||"",topic:document.getElementById("q-edit-topic")?.value||"Binary",difficulty:document.getElementById("q-edit-diff")?.value||"easy",options,a:correct,why:document.getElementById("q-edit-why")?.value||"",skill:document.getElementById("q-edit-skill")?.value||"",lessonId:document.getElementById("q-edit-lesson")?.value||"",code:document.getElementById("q-edit-code")?.value||"",points:Math.max(.25,Number(document.getElementById("q-edit-points")?.value||1)),tags:String(document.getElementById("q-edit-tags")?.value||"").split(",").map(x=>x.trim()).filter(Boolean)};
}
function saveEditor(){const data=readEditor(),validation=validateQuestion(data);if(!validation.valid){window.alert("تعذر حفظ السؤال:\n"+validation.issues.join("\n"));return false}const now=Date.now();if(qbankState.editingId!=null){const idx=bank.findIndex(x=>Number(x.id)===Number(qbankState.editingId));if(idx>=0)bank[idx]=normalizeQuestion({...bank[idx],...data,updatedAt:now,version:Number(bank[idx].version||1)+1})}else{bank.unshift(normalizeQuestion({id:uid(),...data,active:true,stats:{uses:0,correctRate:0},createdAt:now,updatedAt:now,version:1}))}save(bank);refreshBank();return true;}
export function getEditingData(){return readEditor()}
export function getExamPickedIds(){return getExamPick()}
function xmlEsc(value){
  return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function xmlCdata(value){
  return String(value??"").replace(/\]\]>/g,"]]]]><![CDATA[>");
}
export function getExportData(format="json"){
  if(format==="aiken")return getAikenExport();
  if(format==="xml")return getMoodleXmlExport();
  return JSON.stringify({version:"3.32",exportedAt:new Date().toISOString(),questions:bank},null,2);
}
function getAikenExport(){
  return bank.map((q)=>{
    const opts=(q.options||q.opts||[]).slice(0,4);
    const lines=[String(q.q||"").trim()];
    opts.forEach((o,n)=>lines.push(String.fromCharCode(65+n)+". "+String(o??"").trim()));
    lines.push("ANSWER: "+String.fromCharCode(65+(Number(q.a)||0)));
    return lines.join("\n");
  }).join("\n\n")+"\n";
}
function getMoodleXmlExport(){
  const questions=bank.map((q,i)=>{
    const opts=(q.options||q.opts||[]).slice(0,4);
    const answers=opts.map((o,n)=>'    <answer fraction="'+(n===Number(q.a)?100:0)+'"><text><![CDATA['+xmlCdata(o)+']]></text><feedback><text></text></feedback></answer>').join("\n");
    return [
      '  <question type="multichoice">',
      '    <name><text>'+xmlEsc("IPv4 Academy Question "+(i+1))+'</text></name>',
      '    <questiontext format="html"><text><![CDATA['+xmlCdata(q.q)+']]></text></questiontext>',
      '    <single>true</single>',
      '    <shuffleanswers>true</shuffleanswers>',
      answers,
      '  </question>'
    ].join("\n");
  }).join("\n");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n'+questions+'\n</quiz>\n';
}
function normalizeQuestionKey(value){
  return String(value||"").toLowerCase().replace(/\s+/g," ").trim();
}
function buildImportPreview(list,label,format){
  if(!Array.isArray(list)||!list.length)return {ok:false,message:"لم يتم العثور على أسئلة صالحة في الملف."};
  const normalized=[];
  const invalidRows=[];
  list.forEach((q,index)=>{
    const item=normalizeImported(q);
    if(item)normalized.push(item);
    else invalidRows.push({index:index+1,q:String(q?.q||q?.question||"").trim(),reason:"السؤال ناقص أو لا يحتوي على خيارين صالحين على الأقل."});
  });
  const existingTexts=new Set(bank.map(q=>normalizeQuestionKey(q.q)));
  const incomingTexts=new Set();
  const fresh=[];
  const duplicateRows=[];
  normalized.forEach((q,index)=>{
    const key=normalizeQuestionKey(q.q);
    if(!key||existingTexts.has(key)||incomingTexts.has(key)){
      duplicateRows.push({q:q.q,index:index+1,reason:existingTexts.has(key)?"موجود مسبقًا في البنك":"مكرر داخل الملف"});
      return;
    }
    incomingTexts.add(key);
    fresh.push(q);
  });
  return {ok:true,label,format,rows:fresh.map(function(q){return {...q,selected:true};}),totalDetected:list.length,valid:fresh.length,duplicates:duplicateRows.length,invalid:invalidRows.length,duplicateRows,invalidRows,message:"تم تحليل الملف. لم تتم إضافة أي سؤال بعد."};
}
export function importQuestionBankText(text,format="json"){
  if(format==="aiken")return importAikenText(text);
  if(format==="xml")return importMoodleXmlText(text);
  let parsed;
  try{parsed=JSON.parse(text)}catch{return {ok:false,message:"ملف JSON غير صالح."}}
  const incoming=Array.isArray(parsed)?parsed:parsed?.questions;
  return prepareImportPreview(incoming,"JSON","json");
}
export function prepareImportPreview(list,label,format){
  const preview=buildImportPreview(list,label,format);
  if(preview.ok)qbankState.importPreview=preview;
  return preview;
}
export function updateImportPreviewFromDom(){
  const preview=qbankState.importPreview;
  if(!preview||!preview.rows)return {ok:false,message:"لا توجد معاينة استيراد."};
  const textareas=[...document.querySelectorAll("[data-import-question]")];
  const topicsEls=[...document.querySelectorAll("[data-import-topic]")];
  const diffs=[...document.querySelectorAll("[data-import-difficulty]")];
  const selectedEls=[...document.querySelectorAll("[data-import-selected]")];
  const optionLists=[...document.querySelectorAll("[data-import-options]")];
  const correctEls=[...document.querySelectorAll("[data-import-correct]")];
  preview.rows=preview.rows.map((q,i)=>{
    const opts=optionLists[i] ? [...optionLists[i].querySelectorAll("input[data-import-option]")].map(x=>(x.value||"").trim()).slice(0,4) : q.options;
    while(opts.length<4)opts.push("");
    const correct=correctEls[i] ? Number(correctEls[i].value) : Number(q.a)||0;
    return {...q,q:(textareas[i]?.value||q.q).trim(),topic:topicsEls[i]?.value||q.topic,difficulty:diffs[i]?.value||q.difficulty,options:opts,a:Number.isInteger(correct)&&correct>=0&&correct<4?correct:q.a,selected:selectedEls[i]?selectedEls[i].checked:q.selected!==false};
  }).filter(q=>q.q&&q.options.filter(Boolean).length>=2);
  preview.rows=preview.rows.map(q=>({...q,selected:q.selected!==false}));
  preview.valid=preview.rows.filter(q=>q.selected).length;
  return {ok:true,rerender:true};
}

export function setImportSelection(all){
  const preview=qbankState.importPreview;
  if(!preview)return {rerender:false};
  preview.rows.forEach(q=>{q.selected=all});
  preview.valid=all?preview.rows.length:0;
  return {rerender:true};
}
export function toggleImportSelection(index,selected){
  const preview=qbankState.importPreview;
  const i=Number(index);
  if(!preview||!preview.rows[i])return {rerender:false};
  preview.rows[i].selected=selected;
  preview.valid=preview.rows.filter(q=>q.selected!==false).length;
  return {rerender:false};
}
export function removeImportPreviewItem(index){
  const preview=qbankState.importPreview;
  const i=Number(index);
  if(!preview||!Array.isArray(preview.rows)||!Number.isInteger(i)||i<0||i>=preview.rows.length)return {rerender:false};
  preview.rows.splice(i,1); preview.valid=preview.rows.length;
  return {rerender:true};
}
function importErrorDetailsView(p){
  const duplicates=(p.duplicateRows||[]).slice(0,8);
  const invalid=(p.invalidRows||[]).slice(0,8);
  return '<div class="import-error-grid"><div><strong>التكرارات</strong>'+ (duplicates.length?duplicates.map(x=>'<div class="import-error-row"><span>•</span><div><b>'+esc(x.q||("السجل "+x.index))+'</b><small>'+esc(x.reason)+'</small></div></div>').join(""): '<p class="muted">لا توجد تكرارات.</p>') + '</div><div><strong>السجلات غير الصالحة</strong>'+ (invalid.length?invalid.map(x=>'<div class="import-error-row"><span>•</span><div><b>'+esc(x.q||("السجل "+x.index))+'</b><small>'+esc(x.reason)+'</small></div></div>').join(""): '<p class="muted">لا توجد أخطاء.</p>') + '</div></div>';
}export function confirmImport(){
  const preview=qbankState.importPreview;
  if(!preview||!preview.ok)return {ok:false,message:"لا توجد عملية استيراد معلقة."};
  let added=0;
  preview.rows.filter(q=>q.selected!==false).forEach(q=>{
    const copy={...q};delete copy.selected;
    bank.push({...copy,id:uid(),stats:{uses:0,correctRate:0}});
    added++;
  });
  save(bank);
  qbankState.importPreview=null;
  return {ok:true,added,duplicates:preview.duplicates,invalid:preview.invalid,total:bank.length,rerender:true,message:"تم تأكيد الاستيراد وإضافة "+added+" سؤال."};
}
export function cancelImportPreview(){
  qbankState.importPreview=null;
  return {rerender:true};
}
function importAikenText(text){
  const lines=String(text||"").replace(/^\uFEFF/,"").split(/\r?\n/);
  const blocks=[];let current=[];
  const flush=()=>{if(current.some(x=>x.trim()))blocks.push(current);current=[]};
  lines.forEach(line=>{if(!line.trim()){if(current.length)flush();return}current.push(line)});
  flush();
  const list=[];
  blocks.forEach(block=>{
    const answerIndex=block.findIndex(x=>/^ANSWER\s*:\s*[A-D]$/i.test(x.trim()));
    if(answerIndex<0)return;
    const question=block.slice(0,answerIndex).find(x=>x.trim())?.trim()||"";
    const optionLines=block.slice(0,answerIndex).filter(x=>/^[A-D][.)]\s+/i.test(x.trim()));
    const answerLine=block[answerIndex].trim().match(/^ANSWER\s*:\s*([A-D])/i);
    if(!question||optionLines.length<2||!answerLine)return;
    const options=optionLines.map(x=>x.trim().replace(/^[A-D][.)]\s+/i,"").trim()).slice(0,4);
    const a="ABCD".indexOf(answerLine[1].toUpperCase());
    list.push({q:question,topic:"Binary",difficulty:"easy",options,a,why:""});
  });
  return prepareImportPreview(list,"Aiken","aiken");
}
function importMoodleXmlText(text){
  try{
    const xml=new DOMParser().parseFromString(String(text||""),"application/xml");
    const parserError=xml.querySelector("parsererror");
    if(parserError)return {ok:false,message:"ملف XML غير صالح."};
    const nodes=[...xml.querySelectorAll("question")].filter(n=>(n.getAttribute("type")||"multichoice").toLowerCase()!=="category");
    const list=[];
    nodes.forEach(node=>{
      const qtext=node.querySelector("questiontext text")?.textContent?.trim()||node.querySelector("questiontext")?.textContent?.trim()||node.querySelector("name text")?.textContent?.trim()||"";
      const answers=[...node.querySelectorAll(":scope > answer")];
      if(!qtext||!answers.length)return;
      const usable=answers.map(a=>{
        const text=a.querySelector(":scope > text")?.textContent?.trim()||a.textContent?.trim()||"";
        const fraction=Number(a.getAttribute("fraction")||0);
        return {text,fraction};
      }).filter(x=>x.text);
      if(!usable.length)return;
      const options=usable.slice(0,4).map(x=>x.text);while(options.length<4)options.push("");
      let a=usable.findIndex(x=>x.fraction===100);if(a<0)a=0;
      const inferredTopic=topics.find(t=>new RegExp(t.replace(" ","\\s?"),"i").test(qtext))||"Binary";
      const inferredDiff=/hard|صعب|متقدم/i.test(qtext)?"hard":/medium|متوسط/i.test(qtext)?"medium":"easy";
      list.push({q:qtext,topic:inferredTopic,difficulty:inferredDiff,options,a,why:""});
    });
    return prepareImportPreview(list,"Moodle XML","xml");
  }catch{return {ok:false,message:"تعذر قراءة ملف XML."}}
}
function normalizeImported(q){
  if(!q||!String(q.q||"").trim())return null;
  const opts=Array.isArray(q.options)?q.options:(Array.isArray(q.opts)?q.opts:[]);
  const options=opts.map(x=>String(x??"").trim()).slice(0,4);
  const usableCount=options.filter(Boolean).length;
  if(usableCount<2)return null;
  while(options.length<4)options.push("");
  const a=Number(q.a);
  return {
    q:String(q.q).trim(),
    topic:topics.includes(q.topic)?q.topic:"Binary",
    difficulty:difficulties.includes(q.difficulty)?q.difficulty:"easy",
    options,
    a:Number.isInteger(a)&&a>=0&&a<usableCount?a:0,
    why:String(q.why||"").trim(),
    active:q.active!==false
  };
}
function duplicateQuestion(id){
  const src=bank.find(q=>Number(q.id)===Number(id));
  if(!src)return {rerender:false};
  const copy={...src,id:uid(),q:String(src.q)+" (نسخة)",stats:{uses:0,correctRate:0}};
  bank.unshift(copy);
  save(bank);
  return {rerender:true,message:"تم نسخ السؤال."};
}
function toggleQuestion(id){
  const idx=bank.findIndex(q=>Number(q.id)===Number(id));
  if(idx<0)return {rerender:false};
  bank[idx]={...bank[idx],active:bank[idx].active===false};
  if(bank[idx].active===false)setExamPick(getExamPick().filter(x=>Number(x)!==Number(id)));
  save(bank);
  return {rerender:true,message:bank[idx].active===false?"تم تعطيل السؤال.":"تم تفعيل السؤال."};
}
function deleteQuestion(id){
  if(!window.confirm("هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن الحذف من داخل المنصة."))return {rerender:false};
  const exists=bank.some(q=>Number(q.id)===Number(id));
  if(!exists)return {rerender:false};
  bank=bank.filter(q=>Number(q.id)!==Number(id));
  save(bank);
  setExamPick(getExamPick().filter(x=>Number(x)!==Number(id)));
  try{
    const cfg=JSON.parse(localStorage.getItem(EXAM_CONFIG_KEY)||"null");
    if(cfg&&Array.isArray(cfg.questionIds)){
      cfg.questionIds=cfg.questionIds.filter(x=>Number(x)!==Number(id));
      localStorage.setItem(EXAM_CONFIG_KEY,JSON.stringify(cfg));
    }
  }catch{}
  return {rerender:true,message:"تم حذف السؤال."};
}

function importPreviewView(){
  const p=qbankState.importPreview;
  const sample=p.rows.slice(0,20);
  const selectedCount=p.rows.filter(q=>q.selected!==false).length;
  const rows=sample.map(function(q,i){
    const topicOptions=topics.map(function(t){return '<option'+(q.topic===t?' selected':'')+'>'+esc(t)+'</option>';}).join('');
    const diffOptions='<option value="easy"'+(q.difficulty==='easy'?' selected':'')+'>سهل</option><option value="medium"'+(q.difficulty==='medium'?' selected':'')+'>متوسط</option><option value="hard"'+(q.difficulty==='hard'?' selected':'')+'>متقدم</option>';
    const opts=q.options||['','','',''];
    const optionInputs=opts.slice(0,4).map(function(o,n){return '<div class="import-option-edit"><span>'+String.fromCharCode(65+n)+'</span><input data-import-option value="'+esc(o)+'" placeholder="الخيار '+(n+1)+'"></div>';}).join('');
    return '<div class="import-preview-edit-row '+(q.selected===false?'is-excluded':'')+'"><div class="import-preview-index">'+(i+1)+'</div><div class="import-preview-edit-main"><div class="import-question-edit-head"><label class="import-select-line"><input type="checkbox" data-import-selected data-q-action="import-select-one" data-import-index="'+i+'" '+(q.selected!==false?'checked':'')+'> اختيار السؤال</label><button class="btn btn-soft mini-btn" data-q-action="import-remove" data-import-index="'+i+'">استبعاد</button></div><textarea data-import-question rows="2">'+esc(q.q)+'</textarea><div class="import-preview-edit-grid"><label>الموضوع<select data-import-topic>'+topicOptions+'</select></label><label>الصعوبة<select data-import-difficulty>'+diffOptions+'</select></label><label>الإجابة الصحيحة<select data-import-correct>'+[0,1,2,3].map(function(n){return '<option value="'+n+'"'+(Number(q.a)===n?' selected':'')+'>'+String.fromCharCode(65+n)+'</option>';}).join('')+'</select></label></div><div class="import-options-grid" data-import-options>'+optionInputs+'</div></div></div>';
  }).join('');
  return '<div class="page-intro with-action"><div><span class="eyebrow purple">V3.32 • الاستيراد الجماعي</span><h2>مركز الاستيراد الجماعي المتقدم</h2><p>حدد الأسئلة، عدل الخيارات والإجابة الصحيحة، ثم اعتمد المجموعة دفعة واحدة.</p></div><div class="import-preview-actions"><button class="btn btn-soft" data-q-action="import-cancel">إلغاء</button><button class="btn btn-purple" data-q-action="import-confirm">تأكيد استيراد المحدد</button></div></div>'
    +'<div class="student-grid-4 qbank-import-summary"><div class="card trainer-kpi"><div class="muted">المكتشفة</div><div class="kpi-value">'+p.totalDetected+'</div><div class="muted">سجل</div></div><div class="card trainer-kpi"><div class="muted">محدد الآن</div><div class="kpi-value" style="color:var(--primary)">'+selectedCount+'</div><div class="muted">جاهز للإضافة</div></div><div class="card trainer-kpi"><div class="muted">مكررة</div><div class="kpi-value" style="color:var(--orange)">'+p.duplicates+'</div><div class="muted">تم استبعادها</div></div><div class="card trainer-kpi"><div class="muted">غير صالحة</div><div class="kpi-value" style="color:var(--red)">'+p.invalid+'</div><div class="muted">تحتاج تصحيحًا خارج الملف</div></div></div>'
    +'<div class="card qbank-bulk-toolbar"><strong>التحكم الجماعي</strong><button class="btn btn-soft mini-btn" data-q-action="import-select-all">تحديد الكل</button><button class="btn btn-soft mini-btn" data-q-action="import-clear-all">إلغاء تحديد الكل</button><span class="muted">'+p.valid+' أسئلة جديدة متاحة</span></div>'
    +'<div class="card qbank-import-preview-card"><div class="section-title"><h3>الأسئلة الجاهزة</h3><span class="badge green">'+selectedCount+' محدد</span></div>'+(sample.length?rows:'<div class="empty">لا توجد أسئلة جديدة جاهزة للإضافة.</div>')+(p.valid>20?'<div class="qbank-import-more">تظهر أول 20 أسئلة للتحرير. جميع الأسئلة غير المستبعدة ستدخل عند التأكيد.</div>':'')+'</div>'
    +'<div class="card qbank-import-errors"><div class="section-title"><h3>تفاصيل الاستبعاد</h3><span class="badge orange">'+(p.duplicates+p.invalid)+'</span></div>'+importErrorDetailsView(p)+'</div>'
    +'<div class="card qbank-import-note"><strong>V3.32:</strong> لا يتم حفظ أي سؤال حتى التأكيد، وكل سؤال يمر عبر التطبيع والتحقق قبل اعتماده.</div>';
}

export function previewEditorState(){
  const data=readEditor();
  return `
  <div class="page-intro with-action"><div><span class="eyebrow blue">Question Preview</span><h2>معاينة السؤال</h2><p>معاينة قبل الحفظ.</p></div><button class="btn btn-soft" data-q-action="back-editor">عودة للتحرير</button></div>
  <div class="card preview-question-card"><div class="question-meta"><span class="badge">${esc(data.topic)}</span><span class="badge ${diffClass(data.difficulty)}">${diffLabel(data.difficulty)}</span></div><h2>${esc(data.q||"السؤال فارغ")}</h2><div class="answer-grid">${data.options.map((o,i)=>`<div class="answer-option preview-only"><span>${String.fromCharCode(65+i)}</span>${esc(o||"—")}</div>`).join("")}</div><div class="tip-rule"><strong>التفسير:</strong> ${esc(data.why||"—")}</div></div>`;
}
