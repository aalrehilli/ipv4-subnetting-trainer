import {SUPABASE_URL,SUPABASE_ANON_KEY} from "./supabase-config.js?v=468";

const CONFIG_KEY="ipv4AcademySupabaseConfig";
const QUESTION_KEY="ipv4AcademyV32QuestionBank";
const ATTEMPTS_KEY="ipv4AcademyV327Attempts";

let clientPromise=null;

function localConfig(){
  try{
    const x=JSON.parse(localStorage.getItem(CONFIG_KEY)||"null");
    if(x?.url&&x?.anonKey)return {url:x.url,anonKey:x.anonKey};
  }catch{}
  return null;
}
export function getSupabaseConfig(){
  const runtime=window.__IPV4_SUPABASE__||{};
  const stored=localConfig()||{};
  return {
    url:String(runtime.url||SUPABASE_URL||stored.url||"").trim(),
    anonKey:String(runtime.anonKey||SUPABASE_ANON_KEY||stored.anonKey||"").trim()
  };
}
export function isSupabaseConfigured(){
  const c=getSupabaseConfig();
  return !!(c.url&&c.anonKey);
}
export function setSupabaseConfig(url,anonKey){
  if(!url||!anonKey)throw new Error("أدخل Supabase URL و anon key.");
  localStorage.setItem(CONFIG_KEY,JSON.stringify({url:String(url).trim(),anonKey:String(anonKey).trim()}));
  clientPromise=null;
  return true;
}
async function getClient(){
  if(!isSupabaseConfigured())return null;
  if(!clientPromise){
    clientPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(m=>{
      const c=getSupabaseConfig();
      return m.createClient(c.url,c.anonKey,{db:{schema:"public"}});
    });
  }
  return clientPromise;
}
export async function getSupabaseStatus(){
  const configured=isSupabaseConfigured();
  if(!configured)return {configured:false,authenticated:false,role:null,message:"Supabase غير مهيأ"};
  try{
    const client=await getClient();
    const {data:{session}}=await client.auth.getSession();
    if(!session)return {configured:true,authenticated:false,role:null,message:"Supabase مهيأ — يلزم تسجيل الدخول"};
    const {data:profile}=await client.from("profiles").select("id,full_name,role,group_no,is_active").eq("id",session.user.id).maybeSingle();
    return {configured:true,authenticated:true,role:profile?.role||"student",name:profile?.full_name||session.user.email||"متدرب",group:profile?.group_no||"",message:"Supabase متصل"};
  }catch(error){
    return {configured:true,authenticated:false,role:null,message:"تعذر الاتصال بـ Supabase",error:String(error?.message||error)};
  }
}
function mapQuestion(q){
  const opts=Array.isArray(q.options)?q.options:[];
  const ans=q.answer&&typeof q.answer==="object"?q.answer:{};
  const correct=Number.isFinite(Number(ans.correctIndex))?Number(ans.correctIndex):(Number.isFinite(Number(ans.index))?Number(ans.index):Number.isFinite(Number(q.answer))?Number(q.answer):0);
  return {
    id:Number(q.id),topic:q.topic||"غير محدد",difficulty:q.difficulty||"easy",q:q.prompt||"",
    opts,options:opts,a:correct,why:ans.why||"",active:q.is_active!==false,
    points:Number(q.points||1),source:"supabase"
  };
}
export async function fetchRemoteQuestions(){
  const client=await getClient();
  if(!client)return [];
  const {data,error}=await client.from("questions").select("id,course_id,lesson_id,question_type,prompt,options,answer,difficulty,topic,points,is_active").eq("is_active",true).order("id");
  if(error)throw error;
  return (data||[]).map(mapQuestion);
}
function applyQuestionStats(bank,attempts){
  const counts={};
  (attempts||[]).forEach(a=>(a.questionResults||[]).forEach(x=>{
    const id=Number(x.id); if(!counts[id])counts[id]={uses:0,correct:0};
    counts[id].uses++;
    if(x.correct)counts[id].correct++;
  }));
  return bank.map(q=>{
    const c=counts[Number(q.id)];
    if(!c)return q;
    return {...q,stats:{uses:c.uses,correctRate:Math.round(c.correct/c.uses*100)}};
  });
}
export async function syncQuestionBankFromSupabase(attempts=[]){
  const remote=await fetchRemoteQuestions();
  if(!remote.length)return {count:0,updated:false};
  let current=[];
  try{current=JSON.parse(localStorage.getItem(QUESTION_KEY)||"[]")}catch{}
  const merged=remote.map(q=>{
    const old=current.find(x=>Number(x.id)===Number(q.id));
    return {...q,stats:old?.stats||{uses:0,correctRate:0}};
  });
  localStorage.setItem(QUESTION_KEY,JSON.stringify(applyQuestionStats(merged,attempts)));
  return {count:merged.length,updated:true};
}
function mapRemoteAttempt(a){
  const answers=(a.attempt_answers||[]).map(x=>{
    const ans=x.answer&&typeof x.answer==="object"?x.answer:{};
    return {id:Number(x.question_id),selected:ans.selected===null||ans.selected===undefined?null:Number(ans.selected),correct:x.is_correct===true};
  });
  return {
    id:"SB-"+a.id,remoteId:a.id,studentId:a.student_id,studentName:a.profiles?.full_name||"متدرب",
    group:String(a.profiles?.group_no||"1"),exam:a.exams?.title||"IPv4 & Binary",
    attemptNo:1,score:Number(a.score||0)/1,total:answers.length,percent:Number(a.score||0),
    passed:a.passed===true,submittedAt:a.submitted_at?Date.parse(a.submitted_at):Date.now(),
    durationSec:Number(a.duration_seconds||0),autoSubmitted:a.status==="expired",questionResults:answers
  };
}
export async function fetchRemoteAttempts(examTitle=""){
  const client=await getClient();
  if(!client)return [];
  const {data,error}=await client.from("attempts").select("id,exam_id,student_id,status,started_at,submitted_at,score,passed,duration_seconds,exams:exam_id(title),profiles:student_id(full_name,group_no),attempt_answers(question_id,answer,is_correct,points_awarded,answered_at)").in("status",["submitted","graded","expired"]).order("submitted_at",{ascending:false}).limit(500);
  if(error)throw error;
  const mapped=(data||[]).map(mapRemoteAttempt);
  return examTitle?mapped.filter(x=>x.exam===examTitle):mapped;
}
export async function syncAttemptsFromSupabase(){
  try{
    const remote=await fetchRemoteAttempts();
    if(!remote.length)return {count:0,updated:false};
    const local=remote.map(x=>({...x,questionResults:x.questionResults||[]}));
    localStorage.setItem(ATTEMPTS_KEY,JSON.stringify(local));
    return {count:local.length,updated:true};
  }catch(error){
    return {count:0,updated:false,error:String(error?.message||error)};
  }
}
export async function syncAllFromSupabase(){
  const status=await getSupabaseStatus();
  window.__IPV4_SUPABASE_STATUS__=status;
  if(!status.configured||!status.authenticated)return {status,questions:0,attempts:0};

  let questionSync={count:0};
  try{
    const role=String(status.role||"");
    if(role==="trainer"||role==="admin"){
      let local=[];
      try{local=JSON.parse(localStorage.getItem(QUESTION_KEY)||"[]");if(!Array.isArray(local))local=[];}catch{local=[]}
      if(local.length)await syncLocalQuestionsToSupabase(local);
      const remoteBank=await fetchCentralQuestionBank();
      if(remoteBank.ok&&remoteBank.rows.length){
        const numericBank=remoteBank.rows.filter(function(q){return Number.isFinite(Number(q.id));});
        localStorage.setItem(QUESTION_KEY,JSON.stringify(numericBank.map(function(q){
          const opts=Array.isArray(q.opts)?q.opts:[];
          return {id:Number.isFinite(Number(q.id))?Number(q.id):q.id,q:q.q||"",prompt:q.q||"",topic:q.topic||"Binary",
            difficulty:q.difficulty||"easy",options:opts,opts:opts,a:Number(q.a||0),why:q.why||"",
            active:q.active!==false,points:Number(q.points||1),stats:{uses:0,correctRate:0},updatedAt:Date.now()};
        })));
        questionSync={count:numericBank.length};
      }
    }else{
      const attempts=await fetchRemoteAttempts();
      questionSync=await syncQuestionBankFromSupabase(attempts);
    }
  }catch(error){
    questionSync={count:0,error:String(error&&error.message||error)};
  }

  const attempts=await fetchRemoteAttempts();
  const a=await syncAttemptsFromSupabase();
  const u=await syncUnifiedExamAttempts();
  return {status,questions:questionSync.count||0,attempts:(u.ok?u.count:(a.count||0)),unifiedAttempts:u.ok};
}
export async function syncLocalQuestionsToSupabase(list){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const payload=(list||[]).map(function(q){
    return {
      id:Number(q.id),q:q.q||q.prompt||"",prompt:q.q||q.prompt||"",
      options:Array.isArray(q.opts)?q.opts:(Array.isArray(q.options)?q.options:[]),
      a:Number(q.a||0),difficulty:q.difficulty||"easy",topic:q.topic||"",
      active:q.active!==false,points:Number(q.points||1)
    };
  });
  if(!payload.length)return {ok:true,count:0};
  const {data,error}=await client.rpc("academy_sync_question_bank",{p_questions:payload});
  if(error)return {ok:false,error:String(error.message||error)};
  return {ok:true,count:Number(data?.count||payload.length)};
}
export async function syncTrainerExamToSupabase(cfg){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"تسجيل الدخول مطلوب"};
  const {data,error}=await client.rpc("academy_trainer_exam_sync",{p_exam:{
    title:cfg.title,questionIds:cfg.questionIds||[],durationMin:Number(cfg.durationMin||5),
    passPercent:Number(cfg.passPercent||60),attemptsLimit:Number(cfg.attemptsLimit||0),
    selectionMode:cfg.selectionMode||"manual",questionCount:Number(cfg.questionCount||10),
    difficultyMode:cfg.difficultyMode||"all",topicTargets:cfg.topicTargets||{},
    shuffleQuestions:cfg.shuffleQuestions!==false,shuffleOptions:cfg.shuffleOptions!==false,
    published:cfg.published===true,id:localStorage.getItem("ipv4AcademyV365ExamId")||""
  }});
  if(error)return {ok:false,error:String(error.message||error)};
  const id=data?.id||"";
  if(id)localStorage.setItem("ipv4AcademyV365ExamId",String(id));
  return {ok:true,id};
}


export async function persistAttemptToSupabase(result,answers,selectedQuestions){
  const client=await getClient();
  if(!client)return {ok:false,reason:"Supabase غير مهيأ"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"تسجيل الدخول مطلوب"};
  const {data:exam,error:examError}=await client.from("exams").select("id,title").eq("title",result.exam).maybeSingle();
  if(examError||!exam)return {ok:false,reason:examError?.message||"الاختبار غير موجود في Supabase"};
  const {data:attempt,error:attemptError}=await client.from("attempts").insert({exam_id:exam.id,student_id:session.user.id,status:"submitted",started_at:new Date(Date.now()-result.durationSec*1000).toISOString(),submitted_at:new Date(result.submittedAt).toISOString(),score:result.percent,passed:result.passed,duration_seconds:result.durationSec}).select("id").single();
  if(attemptError)throw attemptError;
  const rows=(selectedQuestions||[]).map(q=>{
    const selected=answers?.[q.id]===undefined?null:Number(answers[q.id]);
    const isCorrect=selected!==null&&selected===Number(q.a);
    return {attempt_id:attempt.id,question_id:Number(q.id),answer:{selected},is_correct:isCorrect,points_awarded:isCorrect?Number(q.points||1):0};
  });
  if(rows.length){
    const {error}=await client.from("attempt_answers").insert(rows);
    if(error)throw error;
  }
  return {ok:true,attemptId:attempt.id};
}


export async function fetchMyNotifications(){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {data,error}=await client.from("student_notifications")
    .select("id,user_id,title,message,notification_type,reference_id,created_at,read_at,dedupe_key,related_attempt_id")
    .eq("user_id",session.user.id)
    .order("created_at",{ascending:false})
    .limit(60);
  if(error)return {ok:false,error:error.message};
  return {ok:true,rows:data||[]};
}

export async function markRemoteNotificationRead(id){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {error}=await client.from("student_notifications")
    .update({read_at:new Date().toISOString()})
    .eq("id",id).eq("user_id",session.user.id);
  if(error)return {ok:false,error:error.message};
  return {ok:true};
}

export async function markAllRemoteNotificationsRead(){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {error}=await client.from("student_notifications")
    .update({read_at:new Date().toISOString()})
    .eq("user_id",session.user.id).is("read_at",null);
  if(error)return {ok:false,error:error.message};
  return {ok:true};
}

export async function fetchCentralExamQuestions(examId){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {data,error}=await client.rpc("academy_exam_question_set",{p_exam_id:String(examId)});
  if(error)return {ok:false,error:String(error.message||error)};
  return {ok:true,rows:Array.isArray(data)?data:[]};
}

export async function fetchCentralQuestionBank(){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {data,error}=await client.rpc("academy_question_bank");
  if(error)return {ok:false,error:String(error.message||error)};
  return {ok:true,rows:Array.isArray(data)?data:[]};
}

export async function startCentralExamAttempt(examId,title,courseId){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const args=examId
    ? {p_exam_id:String(examId)}
    : {p_title:String(title||""),p_course_id:courseId?String(courseId):null};
  const fn=examId?"academy_start_exam":"academy_start_exam_by_title";
  const {data,error}=await client.rpc(fn,args);
  if(error){
    const msg=String(error.message||error);
    if(msg.includes("ATTEMPTS_LIMIT"))return {ok:false,reason:"ATTEMPTS_LIMIT",error:"تم استنفاد عدد المحاولات المسموح بها."};
    return {ok:false,error:msg};
  }
  return {ok:true,data};
}

export async function getCentralAttemptResult(){
  return syncUnifiedExamAttempts();
}

export async function recordUnifiedExamAttempt(payload){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {data,error}=await client.rpc("academy_record_exam_attempt",{p_attempt:payload});
  if(error)return {ok:false,error:String(error.message||error)};
  return {ok:true,data};
}

export async function syncUnifiedExamAttempts(){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {data,error}=await client.rpc("academy_my_exam_attempts",{p_course_id:null});
  if(error)return {ok:false,error:String(error.message||error)};
  const remote=Array.isArray(data)?data:[];
  let local=[];
  try{local=JSON.parse(localStorage.getItem(ATTEMPTS_KEY)||"[]");if(!Array.isArray(local))local=[];}catch{local=[]}
  const map=new Map(local.map(x=>[String(x.id),x]));
  remote.forEach(function(x){
    map.set(String(x.id),{
      id:String(x.id),remoteId:String(x.id),studentId:session.user.id,
      studentName:window.__IPV4_SUPABASE_STATUS__?.name||session.user.email||"متدرب",
      group:String(window.__IPV4_SUPABASE_STATUS__?.group||""),
      exam:x.title||"اختبار",
      attemptNo:Number(x.attemptNo||1),score:Number(x.score||0),total:Number(x.total||0),
      percent:Number(x.percent||0),passed:x.passed===true,submittedAt:x.submittedAt?Date.parse(x.submittedAt):Date.now(),
      durationSec:0,autoSubmitted:false,topics:[],questionResults:[]
    });
  });
  localStorage.setItem(ATTEMPTS_KEY,JSON.stringify(Array.from(map.values()).sort(function(a,b){return Number(b.submittedAt||0)-Number(a.submittedAt||0)}).slice(0,500)));
  return {ok:true,count:remote.length};
}

export async function signInWithGitHub(){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const redirectTo=window.location.origin+window.location.pathname;
  const result=await client.auth.signInWithOAuth({
    provider:"github",
    options:{redirectTo}
  });
  if(result.error)return {ok:false,error:result.error.message};
  return {ok:true};
}

export async function signInWithPassword(email,password){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const result=await client.auth.signInWithPassword({
    email:String(email||"").trim(),
    password:String(password||"")
  });
  if(result.error)return {ok:false,error:result.error.message};
  return {ok:true,session:result.data.session,user:result.data.user};
}

export async function signOut(){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const {error}=await client.auth.signOut();
  if(error)return {ok:false,error:error.message};
  return {ok:true};
}
