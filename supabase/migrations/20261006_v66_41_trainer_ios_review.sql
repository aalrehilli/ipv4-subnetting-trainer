-- V66.41 — Trainer access to centrally recorded IOS final attempts
-- Requires V66.39 + V66.40 migrations.

create or replace function public.get_trainer_ios_final_attempts()
returns table (
  attempt_id uuid,
  user_id uuid,
  student_name text,
  student_id text,
  group_name text,
  score integer,
  errors integer,
  duration_seconds integer,
  steps_completed integer,
  total_steps integer,
  passed boolean,
  completed_at timestamptz,
  command_history jsonb
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_role text;
begin
  select p.role into v_role
  from public.profiles p
  where p.id = auth.uid();

  if v_role not in ('trainer','admin') then
    raise exception 'TRAINER_ACCESS_REQUIRED';
  end if;

  return query
  select
    a.id,
    a.user_id,
    coalesce(p.full_name,'المتدرب') as student_name,
    coalesce(p.student_id,'') as student_id,
    coalesce(p.group_name,'') as group_name,
    a.score,
    a.errors,
    a.duration_seconds,
    a.steps_completed,
    a.total_steps,
    a.passed,
    a.completed_at,
    a.command_history
  from public.ios_final_attempts a
  left join public.profiles p on p.id=a.user_id
  order by a.completed_at desc
  limit 300;
end;
$$;

revoke all on function public.get_trainer_ios_final_attempts() from public;
grant execute on function public.get_trainer_ios_final_attempts() to authenticated;
