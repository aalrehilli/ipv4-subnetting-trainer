-- V3.42 — Central course exam attempts

create table if not exists public.academy_course_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.academy_course_exams(id) on delete cascade,
  course_id text not null references public.academy_courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_no integer not null default 1,
  score integer not null default 0 check(score>=0),
  total integer not null default 0 check(total>=0),
  percent integer not null default 0 check(percent between 0 and 100),
  passed boolean not null default false,
  duration_seconds integer not null default 0 check(duration_seconds>=0),
  auto_submitted boolean not null default false,
  question_results jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists academy_course_exam_attempts_exam_idx
  on public.academy_course_exam_attempts(exam_id,submitted_at desc);

create index if not exists academy_course_exam_attempts_course_user_idx
  on public.academy_course_exam_attempts(course_id,user_id,submitted_at desc);

alter table public.academy_course_exam_attempts enable row level security;

drop policy if exists "academy exam attempts own select" on public.academy_course_exam_attempts;
create policy "academy exam attempts own select"
on public.academy_course_exam_attempts
for select to authenticated
using(auth.uid()=user_id or public.academy_is_trainer());

create or replace function public.academy_record_course_exam_attempt(p_attempt jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  a jsonb:=coalesce(p_attempt,'{}'::jsonb);
  v_user uuid:=auth.uid();
  v_exam uuid;
  v_course text:=trim(a->>'courseId');
  v_score integer:=greatest(0,coalesce((a->>'score')::integer,0));
  v_total integer:=greatest(0,coalesce((a->>'total')::integer,0));
  v_percent integer:=greatest(0,least(100,coalesce((a->>'percent')::integer,0)));
  v_attempt integer;
  v_id uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(trim(a->>'examId'),'') is null then raise exception 'EXAM_ID_REQUIRED'; end if;
  v_exam:=(a->>'examId')::uuid;

  if not exists(
    select 1 from public.academy_course_exams e
    where e.id=v_exam and e.course_id=v_course
  ) then raise exception 'COURSE_EXAM_NOT_FOUND'; end if;

  select coalesce(max(x.attempt_no),0)+1
    into v_attempt
  from public.academy_course_exam_attempts x
  where x.user_id=v_user and x.exam_id=v_exam;

  insert into public.academy_course_exam_attempts(
    exam_id,course_id,user_id,attempt_no,score,total,percent,
    passed,duration_seconds,auto_submitted,question_results,submitted_at
  )
  values(
    v_exam,v_course,v_user,v_attempt,v_score,v_total,v_percent,
    coalesce((a->>'passed')::boolean,false),
    greatest(0,coalesce((a->>'durationSec')::integer,0)),
    coalesce((a->>'autoSubmitted')::boolean,false),
    coalesce(a->'questionResults','[]'::jsonb),
    case when nullif(trim(a->>'submittedAt'),'') is null then now() else to_timestamp(((a->>'submittedAt')::numeric)/1000.0) end
  )
  returning id into v_id;

  return jsonb_build_object('ok',true,'id',v_id,'attemptNo',v_attempt);
end;
$$;

create or replace function public.academy_course_exam_attempts(p_course_id text,p_exam_id uuid default null)
returns setof jsonb
language sql
security definer
stable
set search_path=public
as $$
select jsonb_build_object(
  'id',a.id,
  'examId',a.exam_id,
  'courseId',a.course_id,
  'userId',a.user_id,
  'attemptNo',a.attempt_no,
  'score',a.score,
  'total',a.total,
  'percent',a.percent,
  'passed',a.passed,
  'durationSec',a.duration_seconds,
  'autoSubmitted',a.auto_submitted,
  'questionResults',a.question_results,
  'submittedAt',a.submitted_at
)
from public.academy_course_exam_attempts a
where a.course_id=trim(p_course_id)
  and (p_exam_id is null or a.exam_id=p_exam_id)
  and (public.academy_is_trainer() or a.user_id=auth.uid())
order by a.submitted_at desc;
$$;

revoke all on function public.academy_record_course_exam_attempt(jsonb) from public;
revoke all on function public.academy_course_exam_attempts(text,uuid) from public;
grant execute on function public.academy_record_course_exam_attempt(jsonb) to authenticated;
grant execute on function public.academy_course_exam_attempts(text,uuid) to authenticated;
