-- V3.59 — Restore course roster RPC and refresh PostgREST schema cache
create or replace function public.academy_course_student_roster(
  p_course_id text,
  p_group_no text default null
)
returns setof jsonb
language sql
security definer
stable
set search_path = public
as $$
with course_lessons as (
  select count(*)::integer total_lessons
  from public.academy_course_lessons l
  join public.academy_course_units u on u.id=l.unit_id
  where l.course_id=trim(p_course_id)
    and l.status='published'
    and u.status='published'
),
student_rows as (
  select
    p.id,
    coalesce(nullif(trim(p.full_name),''),'متدرب') student_name,
    coalesce(nullif(trim(p.group_no::text),''),'—') group_no,
    coalesce(p.is_active,true) is_active
  from public.profiles p
  where coalesce(p.role,'student')='student'
    and coalesce(p.is_active,true)=true
    and (
      nullif(trim(coalesce(p_group_no,'')),'') is null
      or p.group_no::text=trim(p_group_no)
    )
),
agg as (
  select
    s.*,
    cl.total_lessons,
    count(distinct case when lp.completed then lp.lesson_id end)::integer completed_lessons,
    round(avg(lp.assessment_percent))::integer avg_score,
    max(lp.last_activity_at) last_activity_at,
    count(lp.lesson_id)::integer activity_count
  from student_rows s
  cross join course_lessons cl
  left join public.academy_course_lesson_progress lp
    on lp.user_id=s.id
   and lp.course_id=trim(p_course_id)
  group by s.id,s.student_name,s.group_no,s.is_active,cl.total_lessons
)
select jsonb_build_object(
  'id',a.id,
  'name',a.student_name,
  'group',a.group_no,
  'progress',case when a.total_lessons=0 then 0 else round(a.completed_lessons::numeric/a.total_lessons::numeric*100)::integer end,
  'completedLessons',a.completed_lessons,
  'totalLessons',a.total_lessons,
  'avgScore',coalesce(a.avg_score,0),
  'lastActivity',a.last_activity_at,
  'activityCount',a.activity_count,
  'risk',case
    when a.total_lessons>0 and round(a.completed_lessons::numeric/a.total_lessons::numeric*100)::integer < 30 then 'مرتفع'
    when coalesce(a.avg_score,0) < 50 then 'مرتفع'
    when (a.last_activity_at is not null and a.last_activity_at < now()-interval '7 days') then 'مرتفع'
    when a.total_lessons>0 and round(a.completed_lessons::numeric/a.total_lessons::numeric*100)::integer < 60 then 'متوسط'
    when coalesce(a.avg_score,0) < 70 then 'متوسط'
    else 'منخفض'
  end
)
from agg a
order by a.group_no,a.student_name;
$$;

revoke all on function public.academy_course_student_roster(text,text) from public;
grant execute on function public.academy_course_student_roster(text,text) to authenticated;

-- Force PostgREST to reload the public schema cache.
notify pgrst, 'reload schema';
