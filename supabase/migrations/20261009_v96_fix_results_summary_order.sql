-- V3.96: fix central results summary ordering
-- Root cause: the JSON aggregation ordered by an undefined column "name".
-- Correct column is the CTE field "student_name".
create or replace function public.academy_trainer_results_summary(p_course_id text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_course_id text:=nullif(trim(coalesce(p_course_id,'')),'');
  v_result jsonb;
begin
  if auth.uid() is null or not public.academy_is_trainer() then
    raise exception 'TRAINER_REQUIRED';
  end if;

  with attempts as (
    select a.id,a.exam_id,a.user_id,a.status,a.score,a.total,a.percent,a.passed,
      a.attempt_no,a.duration_seconds,a.auto_submitted,a.started_at,a.submitted_at,
      a.results_published,e.title exam_title,e.course_id,e.question_count,e.duration_minutes,
      coalesce(nullif(trim(p.full_name),''),'متدرب') student_name,
      coalesce(nullif(trim(p.student_id),''),'') student_code,
      coalesce(nullif(trim(coalesce(p.group_no,p.group_name,'')),''),'—') group_no
    from public.academy_exam_attempts a
    join public.academy_exams e on e.id=a.exam_id
    left join public.profiles p on p.id=a.user_id
    where (v_course_id is null or e.course_id=v_course_id)
  ),
  submitted as (
    select * from attempts where status='submitted' and results_published=true
  ),
  active as (
    select id,exam_id,user_id,exam_title,student_name,student_code,group_no,attempt_no,
      started_at,duration_minutes,
      greatest(0,(duration_minutes*60)-extract(epoch from (now()-started_at))::integer)::integer remaining_seconds
    from attempts where status='in_progress'
  ),
  summary as (
    select count(*)::integer total_attempts,
      count(*) filter(where status='submitted' and results_published=true)::integer submitted_attempts,
      count(*) filter(where status='submitted' and results_published=true and passed=true)::integer passed_attempts,
      count(*) filter(where status='in_progress')::integer in_progress_attempts,
      count(distinct user_id) filter(where status='submitted' and results_published=true)::integer students,
      count(distinct exam_id) filter(where status='submitted' and results_published=true)::integer exams,
      coalesce(round(avg(percent) filter(where status='submitted' and results_published=true))::integer,0) avg_percent,
      coalesce(round(avg(duration_seconds) filter(where status='submitted' and results_published=true))::integer,0) avg_duration_seconds,
      coalesce(max(submitted_at) filter(where status='submitted' and results_published=true),'epoch'::timestamptz) last_submission
    from attempts
  ),
  exam_stats as (
    select exam_id,max(exam_title) exam_title,max(question_count)::integer question_count,
      count(*)::integer attempts,count(*) filter(where passed=true)::integer passed,
      coalesce(round(avg(percent))::integer,0) avg_percent,
      coalesce(round(count(*) filter(where passed=true)::numeric/nullif(count(*),0)::numeric*100)::integer,0) pass_rate,
      max(submitted_at) last_submission
    from submitted group by exam_id
  ),
  group_stats as (
    select group_no,count(distinct user_id)::integer students,count(*)::integer attempts,
      coalesce(round(avg(percent))::integer,0) avg_percent,
      count(*) filter(where passed=true)::integer passed,
      coalesce(round(count(*) filter(where passed=true)::numeric/nullif(count(*),0)::numeric*100)::integer,0) pass_rate
    from submitted group by group_no
  ),
  student_stats as (
    select user_id,max(student_name) student_name,max(student_code) student_code,max(group_no) group_no,
      count(*)::integer attempts,coalesce(round(avg(percent))::integer,0) avg_percent,
      coalesce(max(percent),0)::integer best_percent,count(*) filter(where passed=true)::integer passed,
      max(submitted_at) last_submission
    from submitted group by user_id
  ),
  recent as (
    select id,exam_id,exam_title,user_id,student_name,student_code,group_no,attempt_no,
      score,total,percent,passed,status,duration_seconds,auto_submitted,submitted_at
    from attempts order by coalesce(submitted_at,started_at) desc limit 30
  )
  select jsonb_build_object(
    'generatedAt',now(),
    'summary',(select to_jsonb(s) from summary s),
    'exams',coalesce((select jsonb_agg(jsonb_build_object(
      'examId',exam_id,'title',exam_title,'questionCount',question_count,'attempts',attempts,
      'passed',passed,'avgPercent',avg_percent,'passRate',pass_rate,'lastSubmission',last_submission
    ) order by last_submission desc,exam_title) from exam_stats),'[]'::jsonb),
    'groups',coalesce((select jsonb_agg(jsonb_build_object(
      'groupNo',group_no,'students',students,'attempts',attempts,'avgPercent',avg_percent,
      'passed',passed,'passRate',pass_rate
    ) order by group_no) from group_stats),'[]'::jsonb),
    'students',coalesce((select jsonb_agg(jsonb_build_object(
      'studentId',user_id,'name',student_name,'studentCode',student_code,'groupNo',group_no,
      'attempts',attempts,'avgPercent',avg_percent,'bestPercent',best_percent,'passed',passed,
      'lastSubmission',last_submission
    ) order by avg_percent desc,student_name) from student_stats),'[]'::jsonb),
    'recent',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'examId',exam_id,'title',exam_title,'studentId',user_id,'studentName',student_name,
      'studentCode',student_code,'groupNo',group_no,'attemptNo',attempt_no,'score',score,'total',total,
      'percent',percent,'passed',passed,'status',status,'durationSec',duration_seconds,
      'autoSubmitted',auto_submitted,'submittedAt',submitted_at
    ) order by coalesce(submitted_at,'epoch'::timestamptz) desc) from recent),'[]'::jsonb),
    'inProgress',coalesce((select jsonb_agg(jsonb_build_object(
      'attemptId',id,'examId',exam_id,'title',exam_title,'studentId',user_id,'studentName',student_name,
      'studentCode',student_code,'groupNo',group_no,'attemptNo',attempt_no,'startedAt',started_at,
      'durationMinutes',duration_minutes,'remainingSeconds',remaining_seconds
    ) order by started_at asc) from active),'[]'::jsonb)
  ) into v_result;

  return coalesce(v_result,'{}'::jsonb);
end;
$function$;