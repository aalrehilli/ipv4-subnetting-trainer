export const lessons = [
  {id:1,title:"مقدمة في IPv4",topic:"IPv4",desc:"فهم مكونات عنوان IPv4 وطريقة قراءته.",time:"12 دقيقة",progress:100,status:"completed"},
  {id:2,title:"التحويل بين Binary وDecimal",topic:"Binary",desc:"تحويل الأعداد بسرعة وفهم قيم الخانات الثمانية.",time:"18 دقيقة",progress:100,status:"completed"},
  {id:3,title:"Prefix Length",topic:"Prefix",desc:"فهم /24 و /25 و /26 وربطها بعدد البتات.",time:"20 دقيقة",progress:55,status:"current"},
  {id:4,title:"Subnet Mask و Magic Number",topic:"Subnet Mask",desc:"استخراج القناع وحجم البلوك وعدد العناوين.",time:"22 دقيقة",progress:0,status:"locked"},
  {id:5,title:"FLSM",topic:"FLSM",desc:"تقسيم الشبكة إلى شبكات متساوية وفق الحاجة.",time:"28 دقيقة",progress:0,status:"locked"},
  {id:6,title:"VLSM",topic:"VLSM",desc:"توزيع الشبكة بمرونة حسب احتياج كل قسم.",time:"32 دقيقة",progress:0,status:"locked"}
];

export const questions = [
  {id:1,topic:"Binary",difficulty:"easy",q:"ما القيمة العشرية للعدد الثنائي 00001010؟",opts:["8","10","12","14"],a:1,why:"الخانة 8 + الخانة 2 = 10."},
  {id:2,topic:"Binary",difficulty:"easy",q:"ما القيمة الثنائية للعدد العشري 9؟",opts:["00001001","00001100","00010001","00000111"],a:0,why:"9 = 8 + 1، لذلك 00001001."},
  {id:3,topic:"Prefix",difficulty:"medium",q:"ما القناع المناسب للبادئة /24؟",opts:["255.0.0.0","255.255.0.0","255.255.255.0","255.255.255.128"],a:2,why:"/24 يعني 24 بت للشبكة، والقناع هو 255.255.255.0."},
  {id:4,topic:"Prefix",difficulty:"easy",q:"أي بادئة توفر 64 عنوانًا إجمالًا؟",opts:["/24","/25","/26","/27"],a:2,why:"32 - 26 = 6 بت للمضيفين، و 2^6 = 64 عنوانًا."},
  {id:5,topic:"Subnet Mask",difficulty:"medium",q:"ما قيمة Magic Number في شبكة /26؟",opts:["16","32","64","128"],a:1,why:"الأوكتت الأخير في /26 يساوي 192، و 256 - 192 = 64. انتبه: الـ block size هنا 64. هذه من أكثر النقاط التي يخطئ فيها المتدربون."},
  {id:6,topic:"Subnet Mask",difficulty:"easy",q:"كم عنوانًا إجماليًا توفر /27؟",opts:["16","32","64","128"],a:1,why:"32 - 27 = 5 بت، و 2^5 = 32 عنوانًا."},
  {id:7,topic:"IPv4",difficulty:"easy",q:"أي عنوان يمثل Network Address صالحًا لشبكة /24؟",opts:["192.168.10.0","192.168.10.1","192.168.10.255","192.168.10.256"],a:0,why:"في /24 يكون الأوكتت الأخير للصرف على المضيفين، لذلك عنوان الشبكة ينتهي بـ 0."},
  {id:8,topic:"FLSM",difficulty:"medium",q:"عند تقسيم شبكة /24 إلى 4 شبكات متساوية، ما البادئة الجديدة؟",opts:["/25","/26","/27","/28"],a:1,why:"نحتاج 2 بت إضافيين لأن 2^2 = 4، فتنتقل /24 إلى /26."},
  {id:9,topic:"VLSM",difficulty:"hard",q:"ما أول خطوة صحيحة في VLSM؟",opts:["توزيع أصغر شبكة أولًا","توزيع المتطلبات عشوائيًا","ترتيب الاحتياجات من الأكبر إلى الأصغر","اختيار /30 لكل الأقسام"],a:2,why:"نرتب متطلبات المضيفين من الأكبر إلى الأصغر لتقليل الهدر."},
  {id:10,topic:"IPv4",difficulty:"medium",q:"كم عدد بتات IPv4 في العنوان الواحد؟",opts:["16","32","64","128"],a:1,why:"عنوان IPv4 طوله 32 بت، مقسم إلى أربعة أوكتتات."}
];

export const defaultStudent = {
  name:"المتدرب التجريبي",
  level:"مبتدئ",
  progress:18,
  avgScore:76,
  streak:4,
  completedLessons:2,
  reviewTopics:["VLSM","Subnet Mask","Prefix"],
  lastActivity:"حل 5 أسئلة في Binary",
  target:"إتقان Subnetting",
  xp:420,
  badges:["أول خطوة","4 أيام متتالية"]
};

export const defaultActivity = [
  {title:"أنهيت درس التحويل الثنائي",type:"تعلم",time:"اليوم",status:"مكتمل"},
  {title:"حللت تدريب Binary",type:"تدريب",time:"اليوم",status:"80%"},
  {title:"راجعت Prefix Length",type:"مراجعة",time:"أمس",status:"مستمر"}
];

export function loadStudent(){
  try{
    const saved=JSON.parse(localStorage.getItem("ipv4AcademyV2DemoStudent")||"null");
    return saved ? {...defaultStudent,...saved} : {...defaultStudent,reviewTopics:[...defaultStudent.reviewTopics],badges:[...defaultStudent.badges]};
  }catch{return {...defaultStudent,reviewTopics:[...defaultStudent.reviewTopics],badges:[...defaultStudent.badges]}}
}

export function saveStudent(student){
  localStorage.setItem("ipv4AcademyV2DemoStudent",JSON.stringify(student));
}

export function resetDemo(){
  localStorage.removeItem("ipv4AcademyV2DemoStudent");
  localStorage.removeItem("ipv4AcademyV2Practice");
}

export function loadPractice(){
  try{return JSON.parse(localStorage.getItem("ipv4AcademyV2Practice")||"{}")}
  catch{return {}}
}

export function savePractice(value){
  localStorage.setItem("ipv4AcademyV2Practice",JSON.stringify(value));
}

export function topicAccuracy(topic){
  const practice=loadPractice();
  const list=(practice.answers||[]).filter(x=>x.topic===topic);
  if(!list.length) return null;
  return Math.round(list.filter(x=>x.correct).length/list.length*100);
}
