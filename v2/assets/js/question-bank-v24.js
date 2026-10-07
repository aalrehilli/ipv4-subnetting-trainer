import {questions as seedQuestions} from "./demo-data.js";

const KEY="ipv4AcademyV24QuestionBank";
const EXAM_CONFIG_KEY="ipv4AcademyV317ExamConfig";
const EXAM_PICK_KEY="ipv4AcademyV319ExamPick";
const topics=["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"];
const difficulties=["easy","medium","hard"];

function uid(){const nums=bank.map(q=>Number(q.id)).filter(Number.isFinite);return nums.length?Math.max(...nums)+1:1}

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

export function refreshBank(){bank=load();return bank}
export function getQuestionBank(){return [...bank]}
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
    <td><strong>${esc(q.q)}</strong><div class="muted">استخدام: ${q.stats?.uses??0} • دقة: ${rate}%</div></td>
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
  const s=stats();
  const rows=filtered();
  if(qbankState.modal==="editor")return editorView();
  if(qbankState.modal==="preview")return previewView();
  if(qbankState.modal==="editor-preview")return previewEditorState();
  if(qbankState.importPreview)return importPreviewView();

  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow purple">04 • بنك الأسئلة • V3.22</span><h2>بنك الأسئلة الاحترافي</h2><p>أدر الأسئلة، انسخها، عطّلها، احذفها، واستورد أو صدّر البنك بصيغ JSON وMoodle XML وAiken مع ربط مباشر بالاختبارات.</p></div>
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
    <div><label>الصعوبة</label><select id="qbank-difficulty"><option value="">كل المستويات</option><option value="easy" ${qbankState.difficulty==="easy"?"selected":""}>سهل</option><option value="medium" ${qbankState.difficulty==="medium"?"selected":""}>متوسط</option><option value="hard" ${qbankState.difficulty==="hard"?"selected":""}>متقدم</option></select></div><div><label>الحالة</label><select id="qbank-status"><option value="">كل الحالات</option><option value="active" ${qbankState.status==="active"?"selected":""}>نشطة</option><option value="inactive" ${qbankState.status==="inactive"?"selected":""}>معطلة</option></select></div>
    <div class="qbank-count"><strong>${rows.length}</strong><span>سؤال مطابق</span></div><div class="qbank-count qbank-selected"><strong>${getExamPick().length}</strong><span>محدد للاختبار</span></div><button class="btn btn-orange mini-btn" data-q-action="apply-exam">اعتماد المحدد للاختبار</button><button class="btn btn-soft mini-btn" data-q-action="export-json">تصدير JSON</button><button class="btn btn-soft mini-btn" data-q-action="export-xml">تصدير XML</button><button class="btn btn-soft mini-btn" data-q-action="export-aiken">تصدير Aiken</button><button class="btn btn-purple mini-btn" data-q-action="import-json">استيراد JSON</button><button class="btn btn-purple mini-btn" data-q-action="import-xml">استيراد XML</button><button class="btn btn-purple mini-btn" data-q-action="import-aiken">استيراد Aiken</button><input id="qbank-import-json-file" type="file" accept=".json,application/json" hidden><input id="qbank-import-xml-file" type="file" accept=".xml,text/xml,application/xml" hidden><input id="qbank-import-aiken-file" type="file" accept=".txt,.aiken,text/plain" hidden>
  </div>

  <div class="card qbank-management-note"><strong>V3.22:</strong> يمكنك نسخ السؤال أو تعطيله أو حذفه، واستيراد/تصدير بنك الأسئلة. تعطيل السؤال يمنع استخدامه في الاختبارات الجديدة.</div>

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
  if(act==="import-confirm"){return confirmImport()}
  if(act==="import-cancel"){return cancelImportPreview()}
  if(act==="back"){qbankState.modal=null;qbankState.editingId=null;qbankState.previewId=null;qbankState.previewEditor=false;return {rerender:true}}
  if(act==="back-editor"){qbankState.modal="editor";return {rerender:true}}
  if(act==="preview-edit"){qbankState.modal="editor-preview";return {rerender:true}}
  if(act==="save"){saveEditor();qbankState.modal=null;qbankState.editingId=null;return {rerender:true}}
  return null;
}

export function updateFilter(kind,value){qbankState[kind]=value;return qbankState;}

function readEditor(){
  const options=[0,1,2,3].map(i=>document.getElementById("q-opt-"+i)?.value||"");
  const correct=Number(document.querySelector('input[name="q-correct"]:checked')?.value||0);
  return {q:document.getElementById("q-edit-text")?.value||"",topic:document.getElementById("q-edit-topic")?.value||"Binary",difficulty:document.getElementById("q-edit-diff")?.value||"easy",options,a:correct,why:document.getElementById("q-edit-why")?.value||""};
}
function saveEditor(){
  const data=readEditor();
  if(!data.q.trim())return;
  if(data.options.filter(Boolean).length<2)return;
  if(qbankState.editingId!=null){
    const idx=bank.findIndex(x=>Number(x.id)===Number(qbankState.editingId));
    if(idx>=0)bank[idx]={...bank[idx],...data};
  }else{
    bank.unshift({id:uid(),...data,active:true,stats:{uses:0,correctRate:0}});
  }
  save(bank);
}
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
  return JSON.stringify({version:"3.21",exportedAt:new Date().toISOString(),questions:bank},null,2);
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
  let invalid=list.length;
  list.forEach(q=>{
    const item=normalizeImported(q);
    if(item)normalized.push(item);
  });
  invalid=invalid-normalized.length;
  const existingTexts=new Set(bank.map(q=>normalizeQuestionKey(q.q)));
  const incomingTexts=new Set();
  const fresh=[];
  let duplicates=0;
  normalized.forEach(q=>{
    const key=normalizeQuestionKey(q.q);
    if(!key||existingTexts.has(key)||incomingTexts.has(key)){duplicates++;return}
    incomingTexts.add(key);
    fresh.push(q);
  });
  return {ok:true,label,format,rows:fresh,totalDetected:list.length,valid:fresh.length,duplicates,invalid,message:"تم تحليل الملف. لم تتم إضافة أي سؤال بعد."};
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
export function confirmImport(){
  const preview=qbankState.importPreview;
  if(!preview||!preview.ok)return {ok:false,message:"لا توجد عملية استيراد معلقة."};
  let added=0;
  preview.rows.forEach(q=>{bank.push({...q,id:uid(),stats:{uses:0,correctRate:0}});added++});
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
  while(options.length<4)options.push("");
  const a=Number(q.a);
  return {
    q:String(q.q).trim(),
    topic:topics.includes(q.topic)?q.topic:"Binary",
    difficulty:difficulties.includes(q.difficulty)?q.difficulty:"easy",
    options,
    a:Number.isInteger(a)&&a>=0&&a<options.length?a:0,
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
  const sample=p.rows.slice(0,10);
  const previewRows=sample.map(function(q,i){
    return '<div class="import-preview-row"><div class="import-preview-index">'+(i+1)+'</div><div><strong>'+esc(q.q)+'</strong><div class="import-preview-meta"><span class="badge">'+esc(q.topic)+'</span><span class="badge '+diffClass(q.difficulty)+'">'+diffLabel(q.difficulty)+'</span><span class="muted">'+q.options.filter(Boolean).length+' خيارات</span></div></div></div>';
  }).join("");
  return `
  <div class="page-intro with-action">
    <div><span class="eyebrow purple">استيراد بنك الأسئلة • معاينة</span><h2>مراجعة قبل الاستيراد</h2><p>راجع نتائج التحليل أولًا. لن تتم إضافة أي سؤال حتى تضغط «تأكيد الاستيراد».</p></div>
    <div class="import-preview-actions">
      <button class="btn btn-soft" data-q-action="import-cancel">إلغاء</button>
      <button class="btn btn-purple" data-q-action="import-confirm">تأكيد الاستيراد</button>
    </div>
  </div>
  <div class="student-grid-4 qbank-import-summary">
    <div class="card trainer-kpi"><div class="muted">المصدر</div><div class="kpi-value" style="font-size:22px">${esc(p.label)}</div><div class="muted">${esc(String(p.format||"").toUpperCase())}</div></div>
    <div class="card trainer-kpi"><div class="muted">المكتشفة</div><div class="kpi-value">${p.totalDetected}</div><div class="muted">سجل في الملف</div></div>
    <div class="card trainer-kpi"><div class="muted">جاهزة للإضافة</div><div class="kpi-value" style="color:var(--green)">${p.valid}</div><div class="muted">أسئلة جديدة</div></div>
    <div class="card trainer-kpi"><div class="muted">مكررة / غير صالحة</div><div class="kpi-value" style="color:var(--orange)">${p.duplicates+p.invalid}</div><div class="muted">${p.duplicates} مكرر • ${p.invalid} غير صالح</div></div>
  </div>
  <div class="card qbank-import-preview-card">
    <div class="section-title"><h3>معاينة الأسئلة الجديدة</h3><span class="badge green">${p.valid} سؤال جاهز</span></div>
    ${sample.length?previewRows:'<div class="empty">لا توجد أسئلة جديدة جاهزة للإضافة.</div>'}
    ${p.valid>10?'<div class="qbank-import-more">تم عرض أول 10 أسئلة فقط. سيتم استيراد جميع الأسئلة الجاهزة بعد التأكيد.</div>':""}
  </div>
  <div class="card qbank-import-note"><strong>مهم:</strong> تم استبعاد الأسئلة التي تطابق أسئلة موجودة في البنك، وكذلك السجلات غير الصالحة. البيانات الحالية لم تُحفظ بعد.</div>
  `;
}

export function previewEditorState(){
  const data=readEditor();
  return `
  <div class="page-intro with-action"><div><span class="eyebrow blue">Question Preview</span><h2>معاينة السؤال</h2><p>معاينة قبل الحفظ.</p></div><button class="btn btn-soft" data-q-action="back-editor">عودة للتحرير</button></div>
  <div class="card preview-question-card"><div class="question-meta"><span class="badge">${esc(data.topic)}</span><span class="badge ${diffClass(data.difficulty)}">${diffLabel(data.difficulty)}</span></div><h2>${esc(data.q||"السؤال فارغ")}</h2><div class="answer-grid">${data.options.map((o,i)=>`<div class="answer-option preview-only"><span>${String.fromCharCode(65+i)}</span>${esc(o||"—")}</div>`).join("")}</div><div class="tip-rule"><strong>التفسير:</strong> ${esc(data.why||"—")}</div></div>`;
}
