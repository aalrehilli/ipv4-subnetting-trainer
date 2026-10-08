-- IPv4 Academy V3.62
-- Central student 360 profile for trainer course monitoring.

create or replace function public.academy_is_trainer()
returns boolean
language sql
stable
security definer
set search_path=public
as $function$
  select exists(
    select 1 from public.profiles p
    where p.id=auth.uid()
      and coalesce(p.role,'student') in ('trainer','admin')
      and coalesce(p.is_active,true)=true
  );
$function$;

create or replace function public.academy_course_student_360(
  p_course_id text,
  p_student_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $function$
declare
  v_course_id text:=trim(p_course_id);
  v_student uuid:=p_student_id;
  v_group text;
  v_profile jsonb;
  v_summary jsonb;
  v_lessons jsonb;
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  if not exists(select 1 from public.profiles where id=v_student and coalesce(role,'student')='student') then raise exception 'STUDENT_NOT_FOUND'; end if;

  select jsonb_build_object(
    'id',p.id,
    'name',coalesce(nullif(trim(p.full_name),''),'متدرب'),
    'student_id',p.student_id,
    'group',coalesce(nullif(trim(coalesce(p.group_no,p.group_name,'')),''),'—')
  )
  into v_profile
  from public.profiles p where p.id=v_student;
  v_group:=coalesce(v_profile->>'group','');

  if not exists(
    select 1 from public.academy_courses c
    where c.id=v_course_id and c.status='published'
      and (c.visibility='all' or (c.visibility='groups' and v_group<>'' and v_group=any(c.visible_groups)))
  ) then raise exception 'COURSE_NOT_AVAILABLE'; end if;

  select jsonb_build_object(
    'total_lessons',count(*)::integer,
    'completed_lessons',count(*) filter(where coalesce(lp.completed,false))::integer,
    'avg_score',coalesce(round(avg(lp.assessment_percent))::integer,0),
    'attempts',coalesce(sum(lp.attempts),0)::integer,
    'last_activity',max(lp.last_activity_at)
  )
  into v_summary
  from public.academy_course_lessons l
  join public.academy_course_units u on u.id=l.unit_id
  left join public.academy_course_lesson_progress lp on lp.user_id=v_student and lp.lesson_id=l.id
  where l.course_id=v_course_id and l.status='published' and u.status='published';

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'unit_id',split_part(l.unit_id,':',2)::integer,
      'lesson_id',l.local_id,
      'title',l.title,
      'completed',coalesce(lp.completed,false),
      'score',lp.assessment_score,
      'total',lp.assessment_total,
      'percent',lp.assessment_percent,
      'attempts',coalesce(lp.attempts,0),
      'last_activity',lp.last_activity_at
    )
    order by split_part(l.unit_id,':',2)::integer,l.position,l.local_id
  ),'[]'::jsonb)
  into v_lessons
  from public.academy_course_lessons l
  join public.academy_course_units u on u.id=l.unit_id
  left join public.academy_course_lesson_progress lp on lp.user_id=v_student and lp.lesson_id=l.id
  where l.course_id=v_course_id and l.status='published' and u.status='published';

  return jsonb_build_object('profile',v_profile,'summary',v_summary,'lessons',v_lessons);
end;
$function$;

grant execute on function public.academy_course_student_360(text,uuid) to authenticated;
