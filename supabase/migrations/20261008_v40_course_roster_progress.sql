-- V3.40 — Central course roster and learner progress

create table if not exists public.academy_course_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.academy_courses(id) on delete cascade,
  unit_id text not null references public.academy_course_units(id) on delete cascade,
  lesson_id text not null references public.academy_course_lessons(id) on delete cascade,
  completed boolean not null default false,
  assessment_score integer check (assessment_score is null or assessment_score between 0 and 100),
  assessment_total integer check (assessment_total is null or assessment_total >= 0),
  assessment_percent integer check (assessment_percent is null or assessment_percent between 0 and 100),
  attempts integer not null default 0 check (attempts >= 0),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id, lesson_id)
);

create index if not exists academy_course_progress_course_user_idx
  on public.academy_course_lesson_progress(course_id, user_id);

create index if not exists academy_course_progress_lesson_idx
  on public.academy_course_lesson_progress(lesson_id);

alter table public.academy_course_lesson_progress enable row level security;

drop policy if exists "academy progress own select" on public.academy_course_lesson_progress;
create policy "academy progress own select"
on public.academy_course_lesson_progress
for select to authenticated
using (auth.uid() = user_id or public.academy_is_trainer());

drop policy if exists "academy progress own insert" on public.academy_course_lesson_progress;
create policy "academy progress own insert"
on public.academy_course_lesson_progress
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "academy progress own update" on public.academy_course_lesson_progress;
create policy "academy progress own update"
on public.academy_course_lesson_progress
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.academy_record_lesson_progress(
  p_course_id text,
  p_unit_id integer,
  p_lesson_id integer,
  p_completed boolean default false,
  p_score integer default null,
  p_total integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_course_id text := trim(p_course_id);
  v_unit_id text := v_course_id||':'||p_unit_id;
  v_lesson_id text := v_unit_id||':'||p_lesson_id;
  v_percent integer := null;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  if not exists (
    select 1
    from public.academy_courses c
    where c.id=v_course_id
      and c.status='published'
      and (
        c.visibility='all'
        or (
          c.visibility='groups'
          and public.academy_student_group() <> ''
          and public.academy_student_group() = any(c.visible_groups)
        )
      )
  ) then
    raise exception 'COURSE_NOT_AVAILABLE';
  end if;

  if not exists (
    select 1
    from public.academy_course_lessons l
    join public.academy_course_units u on u.id=l.unit_id
    where l.id=v_lesson_id
      and l.course_id=v_course_id
      and u.local_id=p_unit_id
      and l.local_id=p_lesson_id
  ) then
    raise exception 'LESSON_NOT_FOUND';
  end if;

  if p_score is not null and p_total is not null and p_total > 0 then
    v_percent := greatest(0,least(100,round(p_score::numeric/p_total::numeric*100)));
  end if;

  insert into public.academy_course_lesson_progress(
    user_id,course_id,unit_id,lesson_id,completed,
    assessment_score,assessment_total,assessment_percent,
    attempts,last_activity_at,completed_at,updated_at
  )
  values(
    v_user,v_course_id,v_unit_id,v_lesson_id,
    coalesce(p_completed,false),
    p_score,p_total,v_percent,
    case when p_score is null then 0 else 1 end,
    now(),
    case when p_completed then now() else null end,
    now()
  )
  on conflict(user_id,lesson_id) do update set
    completed=academy_course_lesson_progress.completed or excluded.completed,
    assessment_score=coalesce(excluded.assessment_score,academy_course_lesson_progress.assessment_score),
    assessment_total=coalesce(excluded.assessment_total,academy_course_lesson_progress.assessment_total),
    assessment_percent=coalesce(excluded.assessment_percent,academy_course_lesson_progress.assessment_percent),
    attempts=academy_course_lesson_progress.attempts+case when p_score is null then 0 else 1 end,
    last_activity_at=now(),
    completed_at=case
      when academy_course_lesson_progress.completed_at is not null then academy_course_lesson_progress.completed_at
      when excluded.completed then now()
      else null
    end,
    updated_at=now();

  return jsonb_build_object('ok',true,'course_id',v_course_id,'unit_id',p_unit_id,'lesson_id',p_lesson_id,'assessment_percent',v_percent);
end;
$$;

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
    coalesce(nullif(trim(p.full_name),''),p.email,'متدرب') student_name,
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

revoke all on function public.academy_record_lesson_progress(text,integer,integer,boolean,integer,integer) from public;
revoke all on function public.academy_course_student_roster(text,text) from public;

grant execute on function public.academy_record_lesson_progress(text,integer,integer,boolean,integer,integer) to authenticated;
grant execute on function public.academy_course_student_roster(text,text) to authenticated;
