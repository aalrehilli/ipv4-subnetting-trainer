create or replace function public.academy_student_mastery(
  p_course_id text default null,
  p_student_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_user uuid := coalesce(p_student_id, auth.uid());
  v_is_trainer boolean := public.academy_is_trainer();
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_student_id is not null and p_student_id <> auth.uid() and not v_is_trainer then raise exception 'FORBIDDEN'; end if;

  with course_catalog as (
    select c.id,c.title,
      count(l.id) filter (where coalesce(l.status,'published') not in ('draft','hidden'))::integer as total_lessons
    from public.academy_courses c
    left join public.academy_course_lessons l on l.course_id=c.id
    where c.status is distinct from 'archived'
      and (p_course_id is null or c.id=trim(p_course_id))
    group by c.id,c.title
  ),
  lesson_stats as (
    select lp.course_id,count(*) filter(where lp.completed)::integer as completed_lessons,
      coalesce(round(avg(lp.assessment_percent))::integer,0) as assessment_avg,
      max(coalesce(lp.last_activity_at,lp.updated_at)) as last_activity
    from public.academy_course_lesson_progress lp
    where lp.user_id=v_user and (p_course_id is null or lp.course_id=trim(p_course_id))
    group by lp.course_id
  ),
  course_exams as (
    select e.course_id,count(*)::integer as attempts,
      coalesce(round(avg(a.percent))::integer,0) as exam_avg,max(a.submitted_at) as exam_last_activity
    from public.academy_exam_attempts a
    join public.academy_exams e on e.id=a.exam_id
    where a.user_id=v_user and a.status='submitted' and a.results_published=true
      and (p_course_id is null or e.course_id=trim(p_course_id))
    group by e.course_id
  ),
  courses as (
    select cc.id as course_id,cc.title,cc.total_lessons,coalesce(ls.completed_lessons,0) as completed_lessons,
      case when cc.total_lessons>0 then round(coalesce(ls.completed_lessons,0)::numeric/cc.total_lessons::numeric*100)::integer else 0 end as lesson_progress,
      coalesce(ls.assessment_avg,0) as assessment_avg,coalesce(ce.exam_avg,0) as exam_avg,coalesce(ce.attempts,0) as exam_attempts,
      greatest(coalesce(ls.last_activity,'epoch'::timestamptz),coalesce(ce.exam_last_activity,'epoch'::timestamptz)) as last_activity
    from course_catalog cc left join lesson_stats ls on ls.course_id=cc.id left join course_exams ce on ce.course_id=cc.id
  ),
  topics as (
    select coalesce(tq.topic,'غير محدد') as topic,count(*)::integer as attempts,
      sum(case when ea.is_correct then 1 else 0 end)::integer as correct,
      round(sum(case when ea.is_correct then 1 else 0 end)::numeric/nullif(count(*),0)::numeric*100)::integer as accuracy
    from public.academy_exam_answers ea
    join public.academy_exam_attempts a on a.id=ea.attempt_id
    left join public.trainer_questions tq on (tq.legacy_id::text=ea.question_id or tq.id::text=ea.question_id)
    where a.user_id=v_user and a.status='submitted' and a.results_published=true
    group by coalesce(tq.topic,'غير محدد')
  ),
  summary as (
    select coalesce(round(avg(lesson_progress))::integer,0) as lesson_progress,
      coalesce(round(avg(assessment_avg))::integer,0) as assessment_avg,
      coalesce(round(avg(exam_avg))::integer,0) as exam_avg,
      coalesce(round(avg(case when exam_attempts>0 then lesson_progress*0.45+exam_avg*0.45+assessment_avg*0.10 else lesson_progress*0.70+assessment_avg*0.30 end))::integer,0) as overall,
      coalesce(sum(exam_attempts),0)::integer as exam_attempts,max(last_activity) as last_activity
    from courses
  )
  select jsonb_build_object(
    'summary',(select jsonb_build_object('overall',overall,'lessonProgress',lesson_progress,'assessmentAvg',assessment_avg,'examAvg',exam_avg,'examAttempts',exam_attempts,'lastActivity',nullif(last_activity,'epoch'::timestamptz)) from summary),
    'courses',coalesce((select jsonb_agg(jsonb_build_object('courseId',course_id,'title',title,'totalLessons',total_lessons,'completedLessons',completed_lessons,'lessonProgress',lesson_progress,'assessmentAvg',assessment_avg,'examAvg',exam_avg,'examAttempts',exam_attempts,'mastery',case when exam_attempts>0 then round(lesson_progress*0.45+exam_avg*0.45+assessment_avg*0.10)::integer else round(lesson_progress*0.70+assessment_avg*0.30)::integer end,'lastActivity',nullif(last_activity,'epoch'::timestamptz)) order by title) from courses),'[]'::jsonb),
    'topics',coalesce((select jsonb_agg(jsonb_build_object('topic',topic,'accuracy',coalesce(accuracy,0),'attempts',attempts,'correct',correct,'priority',greatest(0,100-coalesce(accuracy,0)+case when attempts<3 then 15 else 0 end),'status',case when coalesce(accuracy,0)<50 then 'مرتفع' when coalesce(accuracy,0)<70 then 'متوسط' else 'جيد' end) order by greatest(0,100-coalesce(accuracy,0)+case when attempts<3 then 15 else 0 end) desc) from topics),'[]'::jsonb),
    'recommendation',(select jsonb_build_object('topic',topic,'action',case when accuracy<50 then 'مراجعة عاجلة' when accuracy<70 then 'تدريب مستهدف' else 'الانتقال للخطوة التالية' end,'page',case when accuracy<70 then 'review' else 'course' end,'reason',case when accuracy<50 then 'يوجد انخفاض واضح في دقة هذا الموضوع.' when accuracy<70 then 'الموضوع يحتاج تدريبًا إضافيًا قبل الانتقال.' else 'الإتقان جيد ويمكن متابعة المسار.' end) from topics order by greatest(0,100-coalesce(accuracy,0)+case when attempts<3 then 15 else 0 end) desc limit 1)
  ) into v_result;
  return coalesce(v_result,jsonb_build_object('summary',jsonb_build_object('overall',0,'lessonProgress',0,'assessmentAvg',0,'examAvg',0,'examAttempts',0),'courses','[]'::jsonb,'topics','[]'::jsonb,'recommendation',null));
end;
$function$;

grant execute on function public.academy_student_mastery(text,uuid) to authenticated;
notify pgrst,'reload schema';