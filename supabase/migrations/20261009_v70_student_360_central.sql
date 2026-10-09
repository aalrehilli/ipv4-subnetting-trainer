create or replace function public.academy_trainer_student_360(p_student_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_student uuid;
  v_profile public.profiles;
  v_result jsonb;
begin
  if auth.uid() is null or not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  select p.id into v_student
  from public.profiles p
  where p.role='student'
    and (p.id::text=trim(p_student_key) or coalesce(p.student_id,'')=trim(p_student_key))
  limit 1;
  if v_student is null then raise exception 'STUDENT_NOT_FOUND'; end if;
  select * into v_profile from public.profiles where id=v_student;

  with catalog as (
    select c.id,c.title,count(l.id) filter(where coalesce(l.status,'published') not in ('draft','hidden'))::integer total_lessons
    from public.academy_courses c left join public.academy_course_lessons l on l.course_id=c.id
    where c.status is distinct from 'archived' group by c.id,c.title
  ),
  lesson_activity as (
    select lp.course_id,count(*) filter(where lp.completed)::integer completed_lessons,
      coalesce(round(avg(lp.assessment_percent))::integer,0) assessment_avg,
      max(coalesce(lp.last_activity_at,lp.updated_at)) last_activity
    from public.academy_course_lesson_progress lp where lp.user_id=v_student group by lp.course_id
  ),
  exam_activity as (
    select e.course_id,count(a.id)::integer exam_attempts,coalesce(round(avg(a.percent))::integer,0) exam_avg,max(a.submitted_at) last_activity
    from public.academy_exam_attempts a join public.academy_exams e on e.id=a.exam_id
    where a.user_id=v_student and a.status='submitted' and a.results_published=true group by e.course_id
  ),
  courses as (
    select ca.id course_id,ca.title,ca.total_lessons,coalesce(la.completed_lessons,0) completed_lessons,
      case when ca.total_lessons>0 then round(coalesce(la.completed_lessons,0)::numeric/ca.total_lessons::numeric*100)::integer else 0 end lesson_progress,
      coalesce(la.assessment_avg,0) assessment_avg,coalesce(ea.exam_avg,0) exam_avg,coalesce(ea.exam_attempts,0) exam_attempts,
      greatest(coalesce(la.last_activity,'epoch'::timestamptz),coalesce(ea.last_activity,'epoch'::timestamptz)) last_activity
    from catalog ca left join lesson_activity la on la.course_id=ca.id left join exam_activity ea on ea.course_id=ca.id
  ),
  submitted as (
    select a.id,a.attempt_no,a.percent,a.score,a.total,a.passed,a.duration_seconds,a.auto_submitted,a.started_at,a.submitted_at,e.title
    from public.academy_exam_attempts a join public.academy_exams e on e.id=a.exam_id
    where a.user_id=v_student and a.status='submitted' and a.results_published=true
  ),
  topics as (
    select coalesce(tq.topic,'غير محدد') topic,count(*)::integer attempts,
      sum(case when ea.is_correct then 1 else 0 end)::integer correct,
      round(sum(case when ea.is_correct then 1 else 0 end)::numeric/nullif(count(*),0)::numeric*100)::integer accuracy
    from public.academy_exam_answers ea join public.academy_exam_attempts a on a.id=ea.attempt_id
    left join public.trainer_questions tq on (tq.legacy_id::text=ea.question_id or tq.id::text=ea.question_id)
    where a.user_id=v_student and a.status='submitted' and a.results_published=true group by coalesce(tq.topic,'غير محدد')
  ),
  summary as (
    select coalesce(round(avg(case when exam_attempts>0 then lesson_progress*0.45+exam_avg*0.45+assessment_avg*0.10 else lesson_progress*0.70+assessment_avg*0.30 end))::integer,0) overall,
      coalesce(round(avg(lesson_progress))::integer,0) lesson_progress,coalesce(round(avg(exam_avg))::integer,0) exam_avg,
      coalesce(round(avg(assessment_avg))::integer,0) assessment_avg,coalesce(sum(exam_attempts),0)::integer exam_attempts,max(last_activity) last_activity
    from courses
  )
  select jsonb_build_object(
    'profile',jsonb_build_object('id',v_profile.id,'name',coalesce(v_profile.full_name,'متدرب'),'studentId',coalesce(v_profile.student_id,''),'groupNo',coalesce(v_profile.group_no,v_profile.group_name,''),'active',coalesce(v_profile.is_active,true)),
    'summary',(select jsonb_build_object('overall',overall,'lessonProgress',lesson_progress,'examAvg',exam_avg,'assessmentAvg',assessment_avg,'examAttempts',exam_attempts,'lastActivity',nullif(last_activity,'epoch'::timestamptz)) from summary),
    'risk',(select case when overall<50 then 'مرتفع' when overall<70 then 'متوسط' else 'منخفض' end from summary),
    'courses',coalesce((select jsonb_agg(jsonb_build_object('courseId',course_id,'title',title,'totalLessons',total_lessons,'completedLessons',completed_lessons,'lessonProgress',lesson_progress,'assessmentAvg',assessment_avg,'examAvg',exam_avg,'examAttempts',exam_attempts,'mastery',case when exam_attempts>0 then round(lesson_progress*0.45+exam_avg*0.45+assessment_avg*0.10)::integer else round(lesson_progress*0.70+assessment_avg*0.30)::integer end,'lastActivity',nullif(last_activity,'epoch'::timestamptz)) order by title) from courses),'[]'::jsonb),
    'topics',coalesce((select jsonb_agg(jsonb_build_object('topic',topic,'accuracy',coalesce(accuracy,0),'attempts',attempts,'correct',correct,'status',case when coalesce(accuracy,0)<50 then 'مرتفع' when coalesce(accuracy,0)<70 then 'متوسط' else 'جيد' end,'priority',greatest(0,100-coalesce(accuracy,0)+case when attempts<3 then 15 else 0 end)) order by greatest(0,100-coalesce(accuracy,0)+case when attempts<3 then 15 else 0 end) desc) from topics),'[]'::jsonb),
    'attempts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'attemptNo',attempt_no,'score',score,'total',total,'percent',percent,'passed',passed,'durationSec',duration_seconds,'autoSubmitted',auto_submitted,'startedAt',started_at,'submittedAt',submitted_at) order by coalesce(submitted_at,started_at) desc) from submitted),'[]'::jsonb)
  ) into v_result;
  return coalesce(v_result,jsonb_build_object('profile',jsonb_build_object('id',v_student),'summary',jsonb_build_object('overall',0),'courses','[]'::jsonb,'topics','[]'::jsonb,'attempts','[]'::jsonb));
end;
$function$;
grant execute on function public.academy_trainer_student_360(text) to authenticated;
notify pgrst,'reload schema';