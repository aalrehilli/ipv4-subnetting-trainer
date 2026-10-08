-- V3.41 — Central course assessments and question links

create table if not exists public.academy_course_exams (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.academy_courses(id) on delete cascade,
  unit_id text references public.academy_course_units(id) on delete set null,
  lesson_id text references public.academy_course_lessons(id) on delete set null,
  title text not null,
  duration_minutes integer not null default 10 check (duration_minutes between 1 and 180),
  pass_percent integer not null default 60 check (pass_percent between 0 and 100),
  attempts_limit integer not null default 1 check (attempts_limit >= 0),
  selection_mode text not null default 'manual' check (selection_mode in ('manual','random')),
  question_count integer not null default 10 check (question_count between 1 and 100),
  difficulty_mode text not null default 'all' check (difficulty_mode in ('all','easy','medium','hard')),
  topic_targets jsonb not null default '{}'::jsonb,
  question_ids jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academy_course_exams_course_idx
  on public.academy_course_exams(course_id, published);

create table if not exists public.academy_course_question_links (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.academy_courses(id) on delete cascade,
  unit_id text references public.academy_course_units(id) on delete set null,
  lesson_id text references public.academy_course_lessons(id) on delete set null,
  question_id text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(course_id,unit_id,lesson_id,question_id)
);

create index if not exists academy_course_questions_course_idx
  on public.academy_course_question_links(course_id,is_active);

alter table public.academy_course_exams enable row level security;
alter table public.academy_course_question_links enable row level security;

drop policy if exists "academy exams trainer all" on public.academy_course_exams;
create policy "academy exams trainer all"
on public.academy_course_exams
for all to authenticated
using (public.academy_is_trainer())
with check (public.academy_is_trainer());

drop policy if exists "academy exams students" on public.academy_course_exams;
create policy "academy exams students"
on public.academy_course_exams
for select to authenticated
using (
  published=true
  and exists (
    select 1 from public.academy_courses c
    where c.id=academy_course_exams.course_id
      and c.status='published'
      and (
        c.visibility='all'
        or (c.visibility='groups'
            and public.academy_student_group() <> ''
            and public.academy_student_group()=any(c.visible_groups))
      )
  )
);

drop policy if exists "academy question links trainer all" on public.academy_course_question_links;
create policy "academy question links trainer all"
on public.academy_course_question_links
for all to authenticated
using (public.academy_is_trainer())
with check (public.academy_is_trainer());

drop policy if exists "academy question links students" on public.academy_course_question_links;
create policy "academy question links students"
on public.academy_course_question_links
for select to authenticated
using (
  is_active=true
  and exists (
    select 1 from public.academy_courses c
    where c.id=academy_course_question_links.course_id
      and c.status='published'
      and (
        c.visibility='all'
        or (c.visibility='groups'
            and public.academy_student_group() <> ''
            and public.academy_student_group()=any(c.visible_groups))
      )
  )
);

create or replace function public.academy_save_course_exam(p_exam jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  e jsonb:=coalesce(p_exam,'{}'::jsonb);
  v_id uuid;
  v_course text:=trim(e->>'courseId');
  v_unit text:=nullif(trim(e->>'unitId'),'');
  v_lesson text:=nullif(trim(e->>'lessonId'),'');
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  if v_course is null or v_course='' then raise exception 'COURSE_ID_REQUIRED'; end if;
  if nullif(trim(e->>'title'),'') is null then raise exception 'EXAM_TITLE_REQUIRED'; end if;

  v_id:=case when nullif(trim(e->>'id'),'') is null then gen_random_uuid() else (e->>'id')::uuid end;

  insert into public.academy_course_exams(
    id,course_id,unit_id,lesson_id,title,duration_minutes,pass_percent,
    attempts_limit,selection_mode,question_count,difficulty_mode,
    topic_targets,question_ids,published,created_by,updated_at
  )
  values(
    v_id,v_course,
    case when v_unit is null then null else v_course||':'||v_unit end,
    case when v_lesson is null then null else v_course||':'||v_unit||':'||v_lesson end,
    left(trim(e->>'title'),200),
    greatest(1,least(180,coalesce((e->>'durationMinutes')::integer,10))),
    greatest(0,least(100,coalesce((e->>'passPercent')::integer,60))),
    greatest(0,coalesce((e->>'attemptsLimit')::integer,1)),
    case when e->>'selectionMode'='random' then 'random' else 'manual' end,
    greatest(1,least(100,coalesce((e->>'questionCount')::integer,10))),
    case when e->>'difficultyMode' in ('easy','medium','hard') then e->>'difficultyMode' else 'all' end,
    coalesce(e->'topicTargets','{}'::jsonb),
    coalesce(e->'questionIds','[]'::jsonb),
    coalesce((e->>'published')::boolean,false),
    auth.uid(),now()
  )
  on conflict(id) do update set
    course_id=excluded.course_id,
    unit_id=excluded.unit_id,
    lesson_id=excluded.lesson_id,
    title=excluded.title,
    duration_minutes=excluded.duration_minutes,
    pass_percent=excluded.pass_percent,
    attempts_limit=excluded.attempts_limit,
    selection_mode=excluded.selection_mode,
    question_count=excluded.question_count,
    difficulty_mode=excluded.difficulty_mode,
    topic_targets=excluded.topic_targets,
    question_ids=excluded.question_ids,
    published=excluded.published,
    updated_at=now();

  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

create or replace function public.academy_course_exams(p_course_id text)
returns setof jsonb
language sql
security definer
stable
set search_path=public
as $$
select jsonb_build_object(
  'id',e.id,
  'courseId',e.course_id,
  'unitId',e.unit_id,
  'lessonId',e.lesson_id,
  'title',e.title,
  'durationMinutes',e.duration_minutes,
  'passPercent',e.pass_percent,
  'attemptsLimit',e.attempts_limit,
  'selectionMode',e.selection_mode,
  'questionCount',e.question_count,
  'difficultyMode',e.difficulty_mode,
  'topicTargets',e.topic_targets,
  'questionIds',e.question_ids,
  'published',e.published,
  'createdAt',e.created_at,
  'updatedAt',e.updated_at
)
from public.academy_course_exams e
where e.course_id=trim(p_course_id)
  and (
    public.academy_is_trainer()
    or (
      e.published=true
      and exists(
        select 1 from public.academy_courses c
        where c.id=e.course_id and c.status='published'
          and (
            c.visibility='all'
            or (c.visibility='groups'
                and public.academy_student_group() <> ''
                and public.academy_student_group()=any(c.visible_groups))
          )
      )
    )
  )
order by e.created_at;
$$;

create or replace function public.academy_save_course_question_link(p_link jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  x jsonb:=coalesce(p_link,'{}'::jsonb);
  cid text:=trim(x->>'courseId');
  uid text:=nullif(trim(x->>'unitId'),'');
  lid text:=nullif(trim(x->>'lessonId'),'');
  qid text:=trim(x->>'questionId');
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  if cid='' or qid='' then raise exception 'COURSE_AND_QUESTION_REQUIRED'; end if;

  insert into public.academy_course_question_links(
    course_id,unit_id,lesson_id,question_id,sort_order,is_active,created_by
  )
  values(
    cid,
    case when uid is null then null else cid||':'||uid end,
    case when lid is null then null else cid||':'||uid||':'||lid end,
    qid,
    coalesce((x->>'sortOrder')::integer,0),
    coalesce((x->>'isActive')::boolean,true),
    auth.uid()
  )
  on conflict(course_id,unit_id,lesson_id,question_id)
  do update set
    sort_order=excluded.sort_order,
    is_active=excluded.is_active;

  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.academy_course_question_links(p_course_id text)
returns setof jsonb
language sql
security definer
stable
set search_path=public
as $$
select jsonb_build_object(
  'id',l.id,
  'courseId',l.course_id,
  'unitId',l.unit_id,
  'lessonId',l.lesson_id,
  'questionId',l.question_id,
  'sortOrder',l.sort_order,
  'isActive',l.is_active
)
from public.academy_course_question_links l
where l.course_id=trim(p_course_id)
  and (
    public.academy_is_trainer()
    or l.is_active=true
  )
order by l.sort_order,l.created_at;
$$;

create or replace function public.academy_delete_course_exam(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  delete from public.academy_course_exams where id=p_id;
  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.academy_save_course_exam(jsonb) from public;
revoke all on function public.academy_course_exams(text) from public;
revoke all on function public.academy_save_course_question_link(jsonb) from public;
revoke all on function public.academy_course_question_links(text) from public;
revoke all on function public.academy_delete_course_exam(uuid) from public;

grant execute on function public.academy_save_course_exam(jsonb) to authenticated;
grant execute on function public.academy_course_exams(text) to authenticated;
grant execute on function public.academy_save_course_question_link(jsonb) to authenticated;
grant execute on function public.academy_course_question_links(text) to authenticated;
grant execute on function public.academy_delete_course_exam(uuid) to authenticated;
