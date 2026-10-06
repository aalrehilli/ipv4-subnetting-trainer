const PRACTICE_KEY="ipv4AcademyV2Practice";
const EXAM_KEY="ipv4AcademyV23ExamResult";
const SUBNET_KEY="ipv4AcademyV25SubnetLab";
const FLSM_KEY="ipv4AcademyV26Flsm";
const VLSM_KEY="ipv4AcademyV27Vlsm";

const TOPICS=["IPv4","Binary","Prefix","Subnet Mask","FLSM","VLSM"];

const defaults={
  IPv4:84,
  Binary:72,
  Prefix:58,
  "Subnet Mask":46,
  FLSM:62,
  VLSM:42
};

function read(key,fallback){
  try{
    const x=JSON.parse(localStorage.getItem(key)||"null");
    return x??fallback;
  }catch{return fallback}
}

function clamp(n){return Math.max(0,Math.min(100,Math.round(n)))}

function practiceScores(){
  const p=read(PRACTICE_KEY,{answers:[]});
  const by={};
  (p.answers||[]).forEach(a=>{
    if(!a.topic)return;
    by[a.topic]??=[];
    by[a.topic].push(a.correct?100:0);
  });
  const out={};
  Object.entries(by).forEach(([topic,arr])=>{
    out[topic]=clamp(arr.reduce((s,x)=>s+x,0)/arr.length);
  });
  return out;
}

function examScores(){
  const result=read(EXAM_KEY,null);
  const out={};
  if(result?.topics)result.topics.forEach(x=>out[x.topic]=clamp(x.percent));
  return out;
}

function labScores(key,topicMap){
  const arr=read(key,[]);
  const out={};
  if(!Array.isArray(arr)||!arr.length)return out;
  const recent=arr.slice(0,5);
  const avg=recent.reduce((s,x)=>s+(Number(x.percent)||0),0)/recent.length;
  topicMap.forEach(topic=>out[topic]=clamp(avg));
  return out;
}

function mergeTopic(topic,sources){
  const values=sources.filter(x=>typeof x==="number");
  if(!values.length)return defaults[topic]??50;
  const avg=values.reduce((s,x)=>s+x,0)/values.length;
  return clamp(avg);
}

export function getLearningSnapshot(){
  const practice=practiceScores();
  const exam=examScores();
  const subnet=labScores(SUBNET_KEY,["Subnet Mask","Prefix"]);
  const flsm=labScores(FLSM_KEY,["FLSM"]);
  const vlsm=labScores(VLSM_KEY,["VLSM"]);

  const scores={};
  TOPICS.forEach(topic=>{
    scores[topic]=mergeTopic(topic,[practice[topic],exam[topic],subnet[topic],flsm[topic],vlsm[topic]]);
  });

  const ranked=[...TOPICS].map(topic=>({
    topic,
    score:scores[topic],
    level:scores[topic]>=80?"متقن":scores[topic]>=65?"جيد":scores[topic]>=50?"يحتاج تدريب":"يحتاج تدخل"
  })).sort((a,b)=>a.score-b.score);

  const weak=ranked.filter(x=>x.score<70).slice(0,3);
  const strong=ranked.filter(x=>x.score>=80).sort((a,b)=>b.score-a.score);

  let next;
  if(scores["VLSM"]<70) next={type:"review",topic:"VLSM",title:"راجع VLSM",reason:"نتيجتك الحالية تشير إلى أن توزيع الشبكات المتفاوتة يحتاج مزيدًا من التطبيق.",page:"review"};
  else if(scores["FLSM"]<70) next={type:"review",topic:"FLSM",title:"تدرّب على FLSM",reason:"أنت قريب من الإتقان، وتحتاج تثبيت خطوات التقسيم المتساوي.",page:"labs"};
  else if(scores["Subnet Mask"]<70) next={type:"practice",topic:"Subnet Mask",title:"راجع Subnet Mask وMagic Number",reason:"هذا الموضوع يؤثر مباشرة على دقة حساب Network وBroadcast.",page:"review"};
  else if(scores["Prefix"]<70) next={type:"practice",topic:"Prefix",title:"ثبّت Prefix Length",reason:"فهم الـPrefix هو المفتاح للانتقال إلى FLSM وVLSM.",page:"review"};
  else if(scores["Binary"]<70) next={type:"practice",topic:"Binary",title:"سرّع التحويل الثنائي",reason:"رفع سرعة Binary سيقلل وقت الحل في مسائل Subnetting.",page:"practice"};
  else next={type:"next","topic":"FLSM",title:"انتقل إلى تحدي FLSM",reason:"مستواك يسمح بالانتقال من المفهوم إلى التطبيق.",page:"labs"};

  return {scores,ranked,weak,strong,next,lastUpdated:Date.now()};
}

export function getSmartRecommendation(){
  return getLearningSnapshot().next;
}

export function getWeakTopics(){
  return getLearningSnapshot().weak.map(x=>x.topic);
}

export function getMastery(topic){
  return getLearningSnapshot().scores[topic]??defaults[topic]??50;
}
