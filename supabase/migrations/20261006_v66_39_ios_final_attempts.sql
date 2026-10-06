-- V66.39 — Central IOS final-attempt registry
-- Requires V66.38 ios_certificates migration first.

create table if not exists public.ios_final_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  errors integer not null default 0 check (errors >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  steps_completed integer not null check (steps_completed between 0 and 19),
  total_steps integer not null default 19 check (total_steps = 19),
  passed boolean not null default false,
  command_history jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ios_final_attempts_user_idx
  on public.ios_final_attempts(user_id, score desc, completed_at desc);

alter table public.ios_final_attempts enable row level security;

drop policy if exists "ios final attempts own select" on public.ios_final_attempts;
create policy "ios final attempts own select"
on public.ios_final_attempts
for select to authenticated
using (auth.uid() = user_id);

create or replace function public.save_ios_final_attempt(
  p_score integer,
  p_errors integer,
  p_duration_seconds integer,
  p_steps_completed integer,
  p_command_history jsonb,
  p_completed_at timestamptz
)
returns table (
  attempt_id uuid,
  score integer,
  errors integer,
  duration_seconds integer,
  steps_completed integer,
  total_steps integer,
  passed boolean,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_score integer := greatest(0, least(coalesce(p_score, 0), 100));
  v_errors integer := greatest(0, coalesce(p_errors, 0));
  v_duration integer := greatest(0, coalesce(p_duration_seconds, 0));
  v_steps integer := greatest(0, least(coalesce(p_steps_completed, 0), 19));
  v_passed boolean := (v_steps = 19 and v_score >= 80);
  v_completed timestamptz := coalesce(p_completed_at, now());
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  insert into public.ios_final_attempts(
    user_id, score, errors, duration_seconds, steps_completed,
    total_steps, passed, command_history, completed_at
  )
  values(
    v_user, v_score, v_errors, v_duration, v_steps,
    19, v_passed, coalesce(p_command_history, '[]'::jsonb), v_completed
  )
  returning id, score, errors, duration_seconds, steps_completed,
            total_steps, passed, completed_at
  into attempt_id, score, errors, duration_seconds, steps_completed,
       total_steps, passed, completed_at;

  return next;
end;
$$;

create or replace function public.get_ios_final_best()
returns table (
  attempt_id uuid,
  score integer,
  errors integer,
  duration_seconds integer,
  steps_completed integer,
  total_steps integer,
  passed boolean,
  completed_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select a.id, a.score, a.errors, a.duration_seconds, a.steps_completed,
         a.total_steps, a.passed, a.completed_at
  from public.ios_final_attempts a
  where a.user_id = auth.uid()
  order by a.score desc, a.passed desc, a.duration_seconds asc, a.completed_at desc
  limit 1;
$$;

create or replace function public.get_ios_final_history()
returns table (
  attempt_id uuid,
  score integer,
  errors integer,
  duration_seconds integer,
  steps_completed integer,
  total_steps integer,
  passed boolean,
  completed_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select a.id, a.score, a.errors, a.duration_seconds, a.steps_completed,
         a.total_steps, a.passed, a.completed_at
  from public.ios_final_attempts a
  where a.user_id = auth.uid()
  order by a.completed_at desc
  limit 20;
$$;

-- Replace V66.38 issuance logic so the certificate is based on a
-- centrally recorded successful attempt.
create or replace function public.issue_ios_certificate(
  p_name text,
  p_score integer,
  p_best_score integer,
  p_best_time integer,
  p_tier text,
  p_xp integer,
  p_final_completed_at timestamptz
)
returns table (
  certificate_no text,
  student_name text,
  final_score integer,
  best_score integer,
  best_time integer,
  mastery_level text,
  xp integer,
  final_completed_at timestamptz,
  issued_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_no text;
  v_name text;
  v_best_score integer;
  v_best_time integer;
  v_completed_at timestamptz;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select coalesce(p.full_name, trim(coalesce(p_name, '')), 'المتدرب')
    into v_name
  from public.profiles p
  where p.id = v_user;

  if v_name is null or length(trim(v_name)) = 0 then
    v_name := trim(coalesce(p_name, 'المتدرب'));
  end if;

  select a.score, a.duration_seconds, a.completed_at
    into final_score, best_time, v_completed_at
  from public.ios_final_attempts a
  where a.user_id = v_user and a.passed = true
  order by a.score desc, a.duration_seconds asc, a.completed_at desc
  limit 1;

  if final_score is null then
    raise exception 'IOS_FINAL_NOT_SYNCED';
  end if;

  select coalesce(max(a.score), final_score),
         coalesce(min(a.duration_seconds) filter (where a.score = (
           select max(z.score)
           from public.ios_final_attempts z
           where z.user_id = v_user and z.passed = true
         )), best_time)
    into v_best_score, v_best_time
  from public.ios_final_attempts a
  where a.user_id = v_user and a.passed = true;

  select i.certificate_no, i.student_name, i.final_score, i.best_score,
         i.best_time, i.mastery_level, i.xp, i.final_completed_at, i.issued_at
    into certificate_no, student_name, final_score, best_score,
         best_time, mastery_level, xp, final_completed_at, issued_at
  from public.ios_certificates i
  where i.user_id = v_user
  limit 1;

  if certificate_no is not null then
    return next;
    return;
  end if;

  v_no := 'IOS-' || to_char(now(), 'YYYY') || '-' ||
          upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.ios_certificates(
    user_id, certificate_no, student_name, final_score, best_score,
    best_time, mastery_level, xp, final_completed_at
  )
  values(
    v_user, v_no, left(trim(v_name), 180), final_score, v_best_score,
    v_best_time, left(trim(coalesce(p_tier, 'مبتدئ IOS')), 120),
    greatest(coalesce(p_xp, 0), 0), v_completed_at
  )
  on conflict(user_id) do nothing;

  select i.certificate_no, i.student_name, i.final_score, i.best_score,
         i.best_time, i.mastery_level, i.xp, i.final_completed_at, i.issued_at
    into certificate_no, student_name, final_score, best_score,
         best_time, mastery_level, xp, final_completed_at, issued_at
  from public.ios_certificates i
  where i.user_id = v_user
  limit 1;

  return next;
end;
$$;

revoke all on function public.save_ios_final_attempt(integer, integer, integer, integer, jsonb, timestamptz) from public;
revoke all on function public.get_ios_final_best() from public;
revoke all on function public.get_ios_final_history() from public;
revoke all on function public.issue_ios_certificate(text, integer, integer, integer, text, integer, timestamptz) from public;

grant execute on function public.save_ios_final_attempt(integer, integer, integer, integer, jsonb, timestamptz) to authenticated;
grant execute on function public.get_ios_final_best() to authenticated;
grant execute on function public.get_ios_final_history() to authenticated;
grant execute on function public.issue_ios_certificate(text, integer, integer, integer, text, integer, timestamptz) to authenticated;
