create or replace function public.academy_trainer_student_roster(
  p_course_id text default null,
  p_group_no text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_course_id text := nullif(trim(coalesce(p_course_id,'')),'');
  v_group_no text := nullif(trim(coalesce(p_group_no,'')),'');
  v_result jsonb;
begin
  if auth.uid() is null or not public.academy_is_trainer() then
    raise exception 'TRAINER_REQUIRED';
  end if;

  with
  course_catalog as (
    select c.id,c.title,count(l.id)::integer as total_lessons
    from public.academy_courses c
    left join public.academy_course_units u on u.course_id=c.id and u.status='published'
    left join public.academy_course_lessons l on l.unit_id=u.id and l.status='published'
    where c.status='published'
      and (v_course_id is null or c.id=v_course_id)
    group by c.id,c.title
  ),
  student_base as (
    select p.id,
      coalesce(nullif(trim(p.full_name),''),'متدرب') student_name,
      coalesce(nullif(trim(coalesce(p.student_id,'')),''),'—') student_id,
      coalesce(nullif(trim(coalesce(p.group_no,p.group_name,'')),''),'—') group_no
    from public.profiles p
    where coalesce(p.role,'student')='student'
      and coalesce(p.is_active,true)=true
      and (v_group_no is null or coalesce(p.group_no,p.group_name)::text=v_group_no)
  ),
  lesson_rows as (
    select s.id student_id,s.student_name,s.student_id student_code,s.group_no,
      c.id course_id,c.total_lessons,
      count(distinct case when lp.completed then lp.lesson_id end)::integer completed_lessons,
      coalesce(round(avg(lp.assessment_percent))::integer,0) assessment_avg,
      count(lp.assessment_percent)::integer assessment_count,
      max(coalesce(lp.last_activity_at,lp.updated_at)) lesson_last_activity
    from student_base s cross join course_catalog c
    left join public.academy_course_lesson_progress lp
      on lp.user_id=s.id and lp.course_id=c.id
    group by s.id,s.student_name,s.student_id,s.group_no,c.id,c.total_lessons
  ),
  exam_rows as (
    select a.user_id student_id,e.course_id,count(*)::integer exam_attempts,
      coalesce(round(avg(a.percent))::integer,0) exam_avg,max(a.submitted_at) exam_last_activity
    from public.academy_exam_attempts a
    join public.academy_exams e on e.id=a.exam_id
    join student_base s on s.id=a.user_id
    where a.status='submitted' and a.results_published=true
      and (v_course_id is null or e.course_id=v_course_id)
    group by a.user_id,e.course_id
  ),
  student_course as (
    select lr.student_id,lr.student_name,lr.student_code,lr.group_no,
      count(*)::integer course_count,
      coalesce(round(avg(case when lr.total_lessons>0 then lr.completed_lessons::numeric/lr.total_lessons::numeric*100 else 0 end))::integer,0) lesson_progress,
      coalesce(round(avg(nullif(lr.assessment_avg,0)))::integer,0) assessment_avg,
      coalesce(sum(lr.assessment_count),0)::integer assessment_count,
      coalesce(sum(er.exam_attempts),0)::integer exam_attempts,
      coalesce(round(avg(nullif(er.exam_avg,0)))::integer,0) exam_avg,
      greatest(max(lr.lesson_last_activity),max(er.exam_last_activity)) last_activity
    from lesson_rows lr
    left join exam_rows er on er.student_id=lr.student_id and er.course_id=lr.course_id
    group by lr.student_id,lr.student_name,lr.student_code,lr.group_no
  ),
  topic_rollup as (
    select a.user_id student_id,coalesce(tq.topic,'غير محدد') topic,count(*)::integer attempts,
      sum(case when ea.is_correct then 1 else 0 end)::integer correct,
      round(sum(case when ea.is_correct then 1 else 0 end)::numeric/nullif(count(*),0)::numeric*100)::integer accuracy
    from public.academy_exam_answers ea
    join public.academy_exam_attempts a on a.id=ea.attempt_id
    left join public.trainer_questions tq on (tq.legacy_id::text=ea.question_id or tq.id::text=ea.question_id)
    join student_base s on s.id=a.user_id
    left join public.academy_exams ex on ex.id=a.exam_id
    where a.status='submitted' and a.results_published=true
      and (v_course_id is null or ex.course_id=v_course_id)
    group by a.user_id,coalesce(tq.topic,'غير محدد')
  ),
  weak_topic as (
    select distinct on (student_id) student_id,topic,accuracy
    from topic_rollup
    order by student_id,accuracy asc,attempts desc,topic
  ),
  students as (
    select sc.*,
      (coalesce(sc.lesson_progress,0)+coalesce(sc.exam_attempts,0)+coalesce(sc.assessment_count,0))::integer activity_count,
      case when coalesce(sc.exam_attempts,0)>0
        then round(sc.lesson_progress*0.45+sc.exam_avg*0.45+sc.assessment_avg*0.10)::integer
        else round(sc.lesson_progress*0.70+sc.assessment_avg*0.30)::integer
      end mastery
    from student_course sc
  ),
  enriched as (
    select s,wt.topic weak_topic,wt.accuracy weak_accuracy
    from students s left join weak_topic wt on wt.student_id=s.student_id
  ),
  flat as (
    select (s).student_id,(s).student_name,(s).student_code,(s).group_no,(s).course_count,
      (s).lesson_progress,(s).assessment_avg,(s).assessment_count,(s).exam_attempts,(s).exam_avg,
      (s).last_activity,(s).activity_count,(s).mastery,weak_topic,weak_accuracy,
      case
        when (s).activity_count=0 then 'جديد'
        when (s).mastery<50 or ((s).last_activity is not null and (s).last_activity<now()-interval '14 days') then 'مرتفع'
        when (s).mastery<70 or ((s).last_activity is not null and (s).last_activity<now()-interval '7 days') then 'متوسط'
        else 'منخفض'
      end risk,
      case
        when (s).last_activity is null then 'لا نشاط'
        when (s).last_activity>=now()-interval '7 days' then 'نشط'
        when (s).last_activity>=now()-interval '14 days' then 'متوسط'
        else 'متوقف'
      end activity_status
    from enriched
  ),
  group_stats as (
    select group_no,count(*)::integer students,round(avg(mastery))::integer avg_mastery,
      round(avg(lesson_progress))::integer avg_progress,round(avg(assessment_avg))::integer avg_assessment,
      round(avg(exam_avg))::integer avg_exam,count(*) filter(where risk='مرتفع')::integer high_risk,
      count(*) filter(where risk='متوسط')::integer medium_risk,count(*) filter(where risk='جديد')::integer new_students,
      count(*) filter(where last_activity>=now()-interval '7 days')::integer active_7d
    from flat group by group_no
  ),
  summary as (
    select count(*)::integer total_students,count(*) filter(where risk='مرتفع')::integer high_risk,
      count(*) filter(where risk='متوسط')::integer medium_risk,count(*) filter(where risk='جديد')::integer new_students,
      count(*) filter(where risk='منخفض')::integer low_risk,count(*) filter(where last_activity>=now()-interval '7 days')::integer active_7d,
      coalesce(round(avg(mastery))::integer,0) avg_mastery,coalesce(round(avg(lesson_progress))::integer,0) avg_progress,
      coalesce(round(avg(exam_avg))::integer,0) avg_exam,coalesce(round(avg(assessment_avg))::integer,0) avg_assessment
    from flat
  )
  select jsonb_build_object(
    'source','supabase','generatedAt',now(),
    'summary',(select to_jsonb(s) from summary s),
    'courses',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'totalLessons',total_lessons) order by title) from course_catalog),'[]'::jsonb),
    'students',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',student_id,'name',student_name,'studentId',student_code,'group',group_no,'courseCount',course_count,
        'progress',lesson_progress,'assessmentAvg',assessment_avg,'examAvg',exam_avg,'examAttempts',exam_attempts,'mastery',mastery,
        'risk',risk,'activity',activity_status,'activityCount',activity_count,'lastActivity',last_activity,
        'weakTopic',coalesce(weak_topic,'—'),'weakAccuracy',weak_accuracy
      ) order by case when risk='مرتفع' then 1 when risk='متوسط' then 2 when risk='جديد' then 3 else 4 end,mastery asc,student_name)
      from flat
    ),'[]'::jsonb),
    'groups',coalesce((select jsonb_agg(to_jsonb(g) order by g.group_no) from group_stats g),'[]'::jsonb)
  ) into v_result;
  return coalesce(v_result,jsonb_build_object('source','supabase','summary',jsonb_build_object('total_students',0),'students','[]'::jsonb,'groups','[]'::jsonb,'courses','[]'::jsonb));
end;
$function$;