import {getSupabaseConfig} from "./supabase-v30.js?v=460";

const COURSES_KEY="ipv4AcademyV36Courses";
const BACKUP_KEY="ipv4AcademyV38AllCourses";

let clientPromise=null;
let lastSignature="";
let lastCentralIds=[];

function readLocal(){
  try{
    const a=JSON.parse(localStorage.getItem(COURSES_KEY)||"[]");
    return Array.isArray(a)?a:[];
  }catch(e){return [];}
}

function writeLocal(list){
  const value=Array.isArray(list)?list:[];
  localStorage.setItem(COURSES_KEY,JSON.stringify(value));
  localStorage.setItem(BACKUP_KEY,JSON.stringify(value));
  return value;
}

function signature(list){
  try{return JSON.stringify(list);}
  catch(e){return String(Date.now());}
}

async function getClient(){
  if(clientPromise)return clientPromise;
  clientPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function(m){
    const cfg=getSupabaseConfig();
    if(!cfg.url||!cfg.anonKey) return null;
    return m.createClient(cfg.url,cfg.anonKey);
  }).catch(function(){return null;});
  return clientPromise;
}

async function rpc(name,args){
  const client=await getClient();
  if(!client)return {ok:false,reason:"SUPABASE_NOT_CONFIGURED"};
  const session=await client.auth.getSession();
  if(!session?.data?.session)return {ok:false,reason:"AUTH_REQUIRED"};
  const {data,error}=await client.rpc(name,args||{});
  if(error)throw error;
  return {ok:true,data};
}

function normalizeCourse(c){
  return {
    ...c,
    id:Number(c.id)||c.id,
    students:Number(c.students)||0,
    visibility:c.visibility==="hidden"?"hidden":c.visibility==="groups"?"groups":"all",
    visibleGroups:Array.isArray(c.visibleGroups)?c.visibleGroups.map(String):[],
    units:Array.isArray(c.units)?c.units.map(function(u,ui){
      return {
        ...u,
        id:Number(u.id)||ui+1,
        position:Number(u.position)||ui,
        status:u.status==="published"?"published":"draft",
        lessons:Array.isArray(u.lessons)?u.lessons.map(function(l,li){
          return {
            ...l,
            id:Number(l.id)||li+1,
            position:Number(l.position)||li,
            duration:Number(l.duration)||20,
            status:l.status==="published"?"published":"draft"
          };
        }):[]
      };
    }):[]
  };
}

export async function fetchCentralCourses(){
  const result=await rpc("academy_course_bundles",{});
  if(!result.ok)return result;
  const rows=Array.isArray(result.data)?result.data:[];
  const courses=rows.map(normalizeCourse);
  return {ok:true,courses};
}

export async function pullCentralCourses(options){
  const result=await fetchCentralCourses();
  if(!result.ok)return result;
  const preserveOnEmpty=options&&options.preserveOnEmpty===true;
  if(result.courses.length===0&&preserveOnEmpty){
    return {ok:true,count:0,courses:[]};
  }
  writeLocal(result.courses);
  lastCentralIds=result.courses.map(function(c){return String(c.id);});
  lastSignature=signature(result.courses);
  return {ok:true,count:result.courses.length,courses:result.courses};
}

export async function saveCentralCourse(course){
  const result=await rpc("academy_course_bundle_save",{p_course:course});
  if(!result.ok)return result;
  lastSignature=signature(readLocal());
  const id=result.data?.id||course.id;
  if(lastCentralIds.indexOf(String(id))<0)lastCentralIds.push(String(id));
  return {ok:true,id};
}

export async function deleteCentralCourse(courseId){
  const result=await rpc("academy_course_bundle_delete",{p_course_id:String(courseId)});
  if(!result.ok)return result;
  lastCentralIds=lastCentralIds.filter(function(x){return String(x)!==String(courseId);});
  return {ok:true,id:String(courseId)};
}

export async function syncTrainerCourses(){
  const local=readLocal();
  const sig=signature(local);
  if(sig===lastSignature)return {ok:true,changed:false};
  if(!local.length)return {ok:true,changed:false};

  const currentIds=local.map(function(c){return String(c.id);});
  const missing=lastCentralIds.filter(function(id){return currentIds.indexOf(String(id))<0;});

  try{
    for(const course of local){
      const saved=await saveCentralCourse(course);
      if(!saved.ok)return saved;
    }
    for(const id of missing){
      const deleted=await deleteCentralCourse(id);
      if(!deleted.ok)return deleted;
    }
    lastCentralIds=currentIds;
    lastSignature=sig;
    return {ok:true,changed:true};
  }catch(error){
    return {ok:false,error:String(error&&error.message||error)};
  }
}

let bootPromise=null;
export async function bootstrapCentralCourses(role){
  if(bootPromise)return bootPromise;
  bootPromise=(async function(){
    const pulled=await pullCentralCourses();
    if(pulled.ok && role==="trainer" && pulled.count===0){
      // Central catalog is empty: keep the local catalog authoritative for the first migration.
      lastCentralIds=[];
      lastSignature="";
    }
    return pulled;
  })().catch(function(error){return {ok:false,error:String(error&&error.message||error)}})
    .finally(function(){bootPromise=null;});
  return bootPromise;
}

export async function syncForRole(role){
  if(role==="student")return pullCentralCourses();
  return syncTrainerCourses();
}


export async function recordLessonProgress(courseId,unitId,lessonId,completed,score,total){
  const item={
    courseId:String(courseId),
    unitId:Number(unitId),
    lessonId:Number(lessonId),
    completed:!!completed,
    score:score===null||score===undefined?null:Number(score),
    total:total===null||total===undefined?null:Number(total),
    at:new Date().toISOString()
  };
  const local=readLocalProgress();
  local.push(item);
  writeLocalProgress(local.slice(-500));

  const result=await rpc("academy_record_lesson_progress",{
    p_course_id:item.courseId,
    p_unit_id:item.unitId,
    p_lesson_id:item.lessonId,
    p_completed:item.completed,
    p_score:item.score,
    p_total:item.total
  });
  if(result.ok){
    return {...result,central:true,queued:0};
  }
  const queue=readQueue();
  queue.push(item);
  writeQueue(queue.slice(-500));
  return {...result,central:false,queued:queue.length};
}

export async function getCourseRoster(courseId,group){
  const result=await rpc("academy_course_student_roster",{
    p_course_id:String(courseId),
    p_group_no:group?String(group):null
  });
  if(!result.ok)return result;
  return {ok:true,rows:Array.isArray(result.data)?result.data:[]};
}


const V3_51_PROGRESS_QUEUE="ipv4AcademyV51ProgressQueue";
const V3_51_LOCAL_PROGRESS="ipv4AcademyV51LocalProgress";

function readQueue(){
  try{const a=JSON.parse(localStorage.getItem(V3_51_PROGRESS_QUEUE)||"[]");return Array.isArray(a)?a:[];}catch(e){return[];}
}
function writeQueue(a){localStorage.setItem(V3_51_PROGRESS_QUEUE,JSON.stringify(Array.isArray(a)?a:[]));}
function readLocalProgress(){
  try{const a=JSON.parse(localStorage.getItem(V3_51_LOCAL_PROGRESS)||"[]");return Array.isArray(a)?a:[];}catch(e){return[];}
}
function writeLocalProgress(a){localStorage.setItem(V3_51_LOCAL_PROGRESS,JSON.stringify(Array.isArray(a)?a:[]));}

export function getLocalCourseProgress(courseId){
  return readLocalProgress().filter(function(x){return String(x.courseId)===String(courseId);});
}

export async function getCourseConnectionState(){
  const {getSupabaseStatus}=await import("./supabase-v30.js?v=460");
  return getSupabaseStatus();
}

export async function syncPendingLessonProgress(){
  const q=readQueue();
  if(!q.length)return {ok:true,queued:0,synced:0};
  const remaining=[];
  let synced=0;
  for(const item of q){
    const result=await rpc("academy_record_lesson_progress",{
      p_course_id:String(item.courseId),
      p_unit_id:Number(item.unitId),
      p_lesson_id:Number(item.lessonId),
      p_completed:!!item.completed,
      p_score:item.score===null||item.score===undefined?null:Number(item.score),
      p_total:item.total===null||item.total===undefined?null:Number(item.total)
    });
    if(result.ok)synced++;
    else {remaining.push(item); break;}
  }
  if(remaining.length!==q.length){
    const unsent=q.slice(synced);
    writeQueue(unsent);
  }
  return {ok:remaining.length===0,queued:remaining.length,synced};
}
