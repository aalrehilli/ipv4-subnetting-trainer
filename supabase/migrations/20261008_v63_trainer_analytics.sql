-- IPv4 Academy V3.63
-- Central trainer analytics over published academy courses and lesson progress.

create or replace function public.academy_trainer_analytics(p_course_id text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $function$
declare
  v_course_id text:=nullif(trim(coalesce(p_course_id,'')),'');
  v_result jsonb;
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;

  with
  courses as (
    select c.id,c.title
    from public.academy_courses c
    where c.status='published'
      and (v_course_id is null or c.id=v_course_id)
  ),
  lesson_counts as (
    select c.id as course_id,count(l.id)::integer total_lessons
    from courses c
    left join public.academy_course_units u on u.course_id=c.id and u.status='published'
    left join public.academy_course_lessons l on l.unit_id=u.id and l.status='published'
    group by c.id
  ),
  base as (
    select
      c.id course_id,c.title,p.id student_id,
      coalesce(nullif(trim(p.full_name),''),'متدرب') student_name,
      coalesce(nullif(trim(coalesce(p.group_no,p.group_name,'')),''),'—') group_no,
      lc.total_lessons,
      count(distinct case when lp.completed then lp.lesson_id end)::integer completed_lessons,
      coalesce(round(avg(lp.assessment_percent))::integer,0) avg_score,
      coalesce(sum(lp.attempts),0)::integer attempts,
      max(lp.last_activity_at) last_activity
    from courses c
    cross join public.profiles p
    join lesson_counts lc on lc.course_id=c.id
    left join public.academy_course_lesson_progress lp
      on lp.user_id=p.id and lp.course_id=c.id
    where coalesce(p.role,'student')='student'
      and coalesce(p.is_active,true)=true
    group by c.id,c.title,p.id,p.full_name,p.group_no,p.group_name,lc.total_lessons
  ),
  enriched as (
    select *,
      case when total_lessons=0 then 0 else round(completed_lessons::numeric/total_lessons::numeric*100)::integer end progress,
      case
        when total_lessons>0 and round(completed_lessons::numeric/total_lessons::numeric*100)::integer<30 then 'مرتفع'
        when avg_score<50 then 'مرتفع'
        when last_activity is not null and last_activity<now()-interval '7 days' then 'مرتفع'
        when total_lessons>0 and round(completed_lessons::numeric/total_lessons::numeric*100)::integer<60 then 'متوسط'
        when avg_score<70 then 'متوسط'
        else 'منخفض'
      end risk
    from base
  ),
  course_stats as (
    select course_id,max(title) title,count(*)::integer students,
      round(avg(progress))::integer avg_progress,round(avg(avg_score))::integer avg_score,
      count(*) filter(where risk='مرتفع')::integer high_risk,
      count(*) filter(where risk='متوسط')::integer medium_risk,
      count(*) filter(where last_activity>=now()-interval '7 days')::integer active_7d
    from enriched group by course_id
  ),
  group_stats as (
    select group_no,count(distinct student_id)::integer students,
      round(avg(progress))::integer avg_progress,round(avg(avg_score))::integer avg_score,
      count(distinct student_id) filter(where risk='مرتفع')::integer high_risk,
      count(distinct student_id) filter(where last_activity>=now()-interval '7 days')::integer active_7d
    from enriched group by group_no
  ),
  student_stats as (
    select student_id,max(student_name) student_name,max(group_no) group_no,
      round(avg(progress))::integer avg_progress,round(avg(avg_score))::integer avg_score,
      count(distinct course_id)::integer courses,max(last_activity) last_activity,
      case when round(avg(progress))<30 or round(avg(avg_score))<50 then 'مرتفع'
           when round(avg(progress))<60 or round(avg(avg_score))<70 then 'متوسط'
           else 'منخفض' end risk
    from enriched
    group by student_id
  ),
  summary as (
    select count(distinct student_id)::integer total_students,
      count(distinct student_id) filter(where last_activity>=now()-interval '7 days')::integer active_7d,
      coalesce(round(avg(progress))::integer,0) avg_progress,
      coalesce(round(avg(avg_score))::integer,0) avg_score,
      count(distinct student_id) filter(where risk='مرتفع')::integer high_risk,
      count(distinct student_id) filter(where risk='متوسط')::integer medium_risk,
      count(distinct student_id) filter(where risk='منخفض')::integer low_risk,
      coalesce(sum(attempts),0)::integer attempts
    from enriched
  )
  select jsonb_build_object(
    'summary',(select to_jsonb(s) from summary s),
    'courses',coalesce((select jsonb_agg(to_jsonb(x) order by x.title) from course_stats x),'[]'::jsonb),
    'groups',coalesce((select jsonb_agg(to_jsonb(x) order by x.group_no) from group_stats x),'[]'::jsonb),
    'students',coalesce((select jsonb_agg(to_jsonb(x) order by case when x.risk='مرتفع' then 1 when x.risk='متوسط' then 2 else 3 end,x.avg_progress,x.student_name) from student_stats x where x.risk<>'منخفض'),'[]'::jsonb)
  ) into v_result;

  return coalesce(v_result,'{}'::jsonb);
end;
$function$;

grant execute on function public.academy_trainer_analytics(text) to authenticated;
