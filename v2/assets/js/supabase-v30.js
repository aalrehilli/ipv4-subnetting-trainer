import {SUPABASE_URL,SUPABASE_ANON_KEY} from "./supabase-config.js";

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
  const attempts=await fetchRemoteAttempts();
  const q=await syncQuestionBankFromSupabase(attempts);
  const a=await syncAttemptsFromSupabase();
  return {status,questions:q.count||0,attempts:a.count||0};
}
export async function syncLocalQuestionsToSupabase(list){
  const client=await getClient();
  if(!client)return {ok:false,reason:"Supabase غير مهيأ"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"تسجيل الدخول مطلوب"};
  const rows=(list||[]).map(q=>({
    id:Number(q.id),
    prompt:q.q||q.prompt||"",
    options:Array.isArray(q.opts)?q.opts:(Array.isArray(q.options)?q.options:[]),
    answer:{correctIndex:Number(q.a||0),why:q.why||""},
    difficulty:q.difficulty||"easy",
    topic:q.topic||"",
    points:Number(q.points||1),
    is_active:q.active!==false
  }));
  if(!rows.length)return {ok:true,count:0};
  const {error}=await client.from("questions").upsert(rows,{onConflict:"id"});
  if(error)throw error;
  return {ok:true,count:rows.length};
}
export async function syncTrainerExamToSupabase(cfg){
  const client=await getClient();
  if(!client)return {ok:false,reason:"Supabase غير مهيأ"};
  const {data:{session}}=await client.auth.getSession();
  if(!session)return {ok:false,reason:"تسجيل الدخول مطلوب"};
  const {data:existing}=await client.from("exams").select("id,title").eq("title",cfg.title).maybeSingle();
  let examId=existing?.id;
  if(examId){
    const {error}=await client.from("exams").update({duration_minutes:cfg.durationMin,pass_score:cfg.passPercent,attempts_limit:cfg.attemptsLimit,status:cfg.published?"open":"draft"}).eq("id",examId);
    if(error)throw error;
  }else{
    const {data:created,error}=await client.from("exams").insert({title:cfg.title,duration_minutes:cfg.durationMin,pass_score:cfg.passPercent,attempts_limit:cfg.attemptsLimit,status:cfg.published?"open":"draft",created_by:session.user.id}).select("id").single();
    if(error)throw error;
    examId=created.id;
  }
  await client.from("exam_questions").delete().eq("exam_id",examId);
  const rows=(cfg.questionIds||[]).map((id,i)=>({exam_id:examId,question_id:Number(id),sort_order:i,points:1}));
  if(rows.length){
    const {error}=await client.from("exam_questions").insert(rows);
    if(error)throw error;
  }
  return {ok:true,examId};
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
