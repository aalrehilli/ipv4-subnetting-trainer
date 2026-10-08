-- IPv4 Academy V3.61
-- Central student progress bootstrap for cross-device course continuity.

create or replace function public.academy_course_my_progress(p_course_id text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  v_user uuid:=auth.uid();
  v_course_id text:=trim(p_course_id);
  v_group text:=public.academy_student_group();
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists(
    select 1
    from public.academy_courses c
    where c.id=v_course_id
      and c.status='published'
      and (
        c.visibility='all'
        or (c.visibility='groups'
            and v_group<>''
            and v_group=any(c.visible_groups))
      )
  ) then
    raise exception 'COURSE_NOT_AVAILABLE';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'unit_id', l.local_unit_id,
        'lesson_id', l.local_lesson_id,
        'completed', p.completed,
        'score', p.assessment_score,
        'total', p.assessment_total,
        'percent', p.assessment_percent,
        'attempts', p.attempts,
        'last_activity_at', p.last_activity_at,
        'completed_at', p.completed_at
      )
      order by l.position, l.local_unit_id, l.local_lesson_id
    ),
    '[]'::jsonb
  )
  into v_result
  from public.academy_course_lesson_progress p
  join public.academy_course_lessons l
    on l.id=p.lesson_id
   and l.course_id=v_course_id
  where p.user_id=v_user
    and p.course_id=v_course_id;

  return v_result;
end;
$function$;

grant execute on function public.academy_course_my_progress(text) to authenticated;
