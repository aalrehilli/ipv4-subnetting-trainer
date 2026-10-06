import {getLearningSnapshot} from "./smart-engine-v28.js";
const KEY="ipv4AcademyV29Trainer360";
const profiles={
1:{id:1,name:"أحمد محمد",group:"1",progress:84,avg:88,risk:"منخفض",activity:"نشط",last:"اليوم",trend:"+8%",weakness:"VLSM",attendance:"96%",practice:34,exams:4,labs:9,note:"طالب منتظم وقريب من مستوى الإتقان."},
2:{id:2,name:"محمد خالد",group:"1",progress:62,avg:58,risk:"متوسط",activity:"متوسط",last:"أمس",trend:"-3%",weakness:"Prefix",attendance:"82%",practice:21,exams:3,labs:5,note:"يحتاج تثبيت Prefix قبل الانتقال إلى FLSM."},
3:{id:3,name:"سارة عبدالله",group:"2",progress:91,avg:94,risk:"منخفض",activity:"نشط",last:"اليوم",trend:"+5%",weakness:"—",attendance:"98%",practice:41,exams:5,labs:12,note:"جاهزة لمسار متقدم."},
4:{id:4,name:"خالد علي",group:"3",progress:47,avg:42,risk:"مرتفع",activity:"متوقف",last:"قبل 3 أيام",trend:"-14%",weakness:"Subnet Mask",attendance:"61%",practice:10,exams:2,labs:2,note:"يحتاج تدخلًا فرديًا سريعًا."},
5:{id:5,name:"نورة سالم",group:"2",progress:73,avg:69,risk:"متوسط",activity:"متوسط",last:"أمس",trend:"+2%",weakness:"Binary",attendance:"88%",practice:28,exams:3,labs:7,note:"تحسن ملحوظ مع استمرار التدريب."},
6:{id:6,name:"عبدالرحمن سعد",group:"1",progress:58,avg:61,risk:"متوسط",activity:"نشط",last:"اليوم",trend:"+1%",weakness:"Magic Number",attendance:"91%",practice:25,exams:3,labs:6,note:"يحتاج مراجعة قصيرة ومتكررة."}
};
let noteStore=loadNotes();
function loadNotes(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
function saveNotes(){localStorage.setItem(KEY,JSON.stringify(noteStore))}
function esc(v){return String(v==null?"":v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function riskClass(r){return r==="مرتفع"?"red":r==="متوسط"?"orange":"green"}
function masteryFor(p){
 const base={IPv4:p.avg+4,Binary:p.weakness==="Binary"?56:72,Prefix:p.weakness==="Prefix"?51:61,"Subnet Mask":p.weakness==="Subnet Mask"?39:56,FLSM:66,VLSM:p.weakness==="VLSM"?42:58};
 if(p.id===1){const engine=getLearningSnapshot();return Object.assign(base,engine.scores)}
 return base
}
export function student360View(id){
 const p=profiles[Number(id)]||profiles[1];
 const mastery=masteryFor(p);
 const ranked=Object.entries(mastery).map(x=>({topic:x[0],score:Math.max(0,Math.min(100,Math.round(x[1])))})).sort((a,b)=>a.score-b.score);
 const weak=ranked[0];
 const note=noteStore[p.id]||p.note;
 const suggestion=p.risk==="مرتفع"?"جلسة علاجية فردية اليوم":p.risk==="متوسط"?"تعيين مراجعة ذكية خلال 48 ساعة":"السماح بالانتقال للمحتوى التالي";
 const masteryHtml=ranked.map(x=>"<div class=\"mastery-360-row\"><div><strong>"+esc(x.topic)+"</strong><span class=\"badge "+(x.score<50?"red":x.score<70?"orange":"green")+"\">"+x.score+"%</span></div><div class=\"progress\"><span style=\"width:"+x.score+"%\"></span></div><small>"+(x.score>=80?"متقن":x.score>=65?"جيد":x.score>=50?"يحتاج تدريب":"يحتاج تدخل")+"</small></div>").join("");
 return "<div class=\"page-intro with-action\"><div><span class=\"eyebrow purple\">Student 360 • V2.9</span><h2>"+esc(p.name)+"</h2><p>المجموعة "+esc(p.group)+" • آخر نشاط "+esc(p.last)+" • الاتجاه "+esc(p.trend)+"</p></div><button class=\"btn btn-soft\" data-trainer-page=\"students\">رجوع للمتدربين</button></div>"
 +"<div class=\"student360-banner\"><div class=\"student360-profile\"><div class=\"student360-avatar\">"+esc(p.name.slice(0,1))+"</div><div><span class=\"muted\">حالة الطالب</span><h3>"+esc(p.name)+"</h3><p>"+esc(p.note)+"</p></div></div><div class=\"student360-risk\"><span class=\"badge "+riskClass(p.risk)+"\">"+esc(p.risk)+"</span><strong>"+p.progress+"%</strong><small>تقدم المقرر</small></div></div>"
 +"<div class=\"student-grid-4\"><div class=\"card student-stat\"><div class=\"muted\">متوسط الأداء</div><div class=\"kpi-value\">"+p.avg+"%</div><div class=\"muted\">آخر الاختبارات</div></div><div class=\"card student-stat\"><div class=\"muted\">الحضور</div><div class=\"kpi-value\">"+esc(p.attendance)+"</div><div class=\"muted\">Demo</div></div><div class=\"card student-stat\"><div class=\"muted\">التدريبات</div><div class=\"kpi-value\">"+p.practice+"</div><div class=\"muted\">محاولة</div></div><div class=\"card student-stat\"><div class=\"muted\">المختبرات</div><div class=\"kpi-value\">"+p.labs+"</div><div class=\"muted\">محاولة عملية</div></div></div>"
 +"<div class=\"section-title\"><h3>خريطة الإتقان</h3><span class=\"badge purple\">Smart Engine</span></div><div class=\"card mastery-360\">"+masteryHtml+"</div>"
 +"<div class=\"grid-2\" style=\"margin-top:14px\"><div class=\"card\"><h3>تحليل المدرب</h3><div class=\"analysis-box\"><strong>أضعف موضوع</strong><p class=\"muted\">"+esc(weak.topic)+" • "+weak.score+"%</p></div><div class=\"analysis-box\"><strong>التدخل المقترح</strong><p class=\"muted\">"+esc(suggestion)+"</p></div><div class=\"analysis-box\"><strong>قرار التعلم</strong><p class=\"muted\">"+(p.risk==="منخفض"?"رفع مستوى الصعوبة تدريجيًا.":"تعيين تدريب مستهدف ثم إعادة القياس.")+"</p></div><button class=\"btn btn-purple\" data-360-action=\"assign\" data-student-id=\""+p.id+"\">تعيين التدخل المقترح</button></div>"
 +"<div class=\"card\"><h3>سجل التعلم</h3><div class=\"timeline-360\"><div><b>اليوم</b><span>تمرين "+esc(weak.topic)+"</span><strong>"+weak.score+"%</strong></div><div><b>أمس</b><span>مراجعة Prefix</span><strong>"+p.avg+"%</strong></div><div><b>قبل يومين</b><span>اختبار IPv4 & Binary</span><strong>"+p.avg+"%</strong></div><div><b>قبل 3 أيام</b><span>Subnetting Lab</span><strong>مكتمل</strong></div></div></div></div>"
 +"<div class=\"section-title\"><h3>ملاحظة المدرب</h3></div><div class=\"card trainer-note-card\"><textarea id=\"trainer-note-"+p.id+"\" rows=\"3\">"+esc(note)+"</textarea><div><button class=\"btn btn-primary\" data-360-action=\"save-note\" data-student-id=\""+p.id+"\">حفظ الملاحظة</button></div></div>"
 +"<div class=\"section-title\"><h3>قرار سريع</h3></div><div class=\"card quick-decision\"><div><strong>"+esc(suggestion)+"</strong><span class=\"muted\">مبني على المخاطر والإتقان والنشاط.</span></div><button class=\"btn btn-green\" data-360-action=\"assign\" data-student-id=\""+p.id+"\">تنفيذ القرار</button></div>"
}
export function handleStudent360Action(target){
 const id=Number(target.dataset.studentId);
 const action=target.dataset["360Action"];
 if(action==="save-note"){const value=document.getElementById("trainer-note-"+id)?.value||"";noteStore[id]=value.trim()||profiles[id]?.note||"";saveNotes();return {rerender:true}}
 if(action==="assign"){noteStore[id]="تم تعيين التدخل: "+(profiles[id]?.weakness||"مراجعة")+" — "+new Date().toLocaleDateString("ar-SA");saveNotes();return {rerender:true}}
 return null
}