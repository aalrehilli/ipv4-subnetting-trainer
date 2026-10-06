-- V66.40 — Server-authoritative IOS final exam sessions
-- Requires V66.38 + V66.39 migrations.

create table if not exists public.ios_final_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','expired','abandoned')),
  next_step integer not null default 0 check (next_step between 0 and 19),
  score integer not null default 100 check (score between 0 and 100),
  errors integer not null default 0 check (errors >= 0),
  command_history jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint ios_final_sessions_user_active_unique unique (user_id, status)
    deferrable initially immediate
);

-- The unique constraint above cannot express "one active row" only. Replace
-- it with a partial unique index and remove the broad constraint.
alter table public.ios_final_sessions
  drop constraint if exists ios_final_sessions_user_active_unique;

create unique index if not exists ios_final_sessions_one_active
  on public.ios_final_sessions(user_id)
  where status = 'active';

alter table public.ios_final_sessions enable row level security;

drop policy if exists "ios final sessions own select" on public.ios_final_sessions;
create policy "ios final sessions own select"
on public.ios_final_sessions
for select to authenticated
using (auth.uid() = user_id);

create or replace function public.start_ios_final_session()
returns table (
  session_id uuid,
  next_step integer,
  score integer,
  errors integer,
  status text,
  started_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  update public.ios_final_sessions
     set status='abandoned',
         last_activity_at=now()
   where user_id=v_user and status='active';

  insert into public.ios_final_sessions(user_id,status,next_step,score,errors)
  values(v_user,'active',0,100,0)
  returning id into v_id;

  return query
  select s.id, s.next_step, s.score, s.errors, s.status,
         s.started_at, s.started_at + interval '45 minutes'
  from public.ios_final_sessions s
  where s.id=v_id;
end;
$$;

create or replace function public.submit_ios_final_step(
  p_session_id uuid,
  p_command text
)
returns table (
  correct boolean,
  next_step integer,
  score integer,
  errors integer,
  completed boolean,
  passed boolean,
  duration_seconds integer,
  attempt_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  s public.ios_final_sessions%rowtype;
  commands text[] := array[
    'enable',
    'configure terminal',
    'hostname final-sw',
    'enable secret finalclass',
    'interface vlan 1',
    'ip address 10.10.10.1 255.255.255.0',
    'no shutdown',
    'end',
    'configure terminal',
    'ip default-gateway 10.10.10.254',
    'service password-encryption',
    'banner motd #final ios exam#',
    'line vty 0 4',
    'password cisco',
    'login',
    'transport input ssh telnet',
    'end',
    'show ip interface brief',
    'copy running-config startup-config'
  ];
  v_command text;
  v_expected text;
  v_ok boolean := false;
  v_new_step integer;
  v_new_score integer;
  v_new_errors integer;
  v_completed boolean := false;
  v_passed boolean := false;
  v_duration integer;
  v_attempt_id uuid;
  v_history jsonb;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
    into s
  from public.ios_final_sessions
  where id=p_session_id
    and user_id=v_user
  for update;

  if not found then
    raise exception 'IOS_SESSION_NOT_FOUND';
  end if;

  if s.status <> 'active' then
    raise exception 'IOS_SESSION_NOT_ACTIVE';
  end if;

  if now() > s.started_at + interval '45 minutes' then
    update public.ios_final_sessions
       set status='expired', last_activity_at=now()
     where id=s.id;
    raise exception 'IOS_SESSION_EXPIRED';
  end if;

  if s.next_step >= array_length(commands,1) then
    raise exception 'IOS_SESSION_COMPLETE';
  end if;

  v_command := lower(regexp_replace(trim(coalesce(p_command,'')), '\s+', ' ', 'g'));
  v_expected := commands[s.next_step+1];

  v_ok := v_command = v_expected;

  -- Friendly accepted alias for the IOS abbreviated verification command.
  if s.next_step = 17 and v_command = 'show ip int brief' then
    v_ok := true;
  end if;

  v_new_step := s.next_step;
  v_new_score := s.score;
  v_new_errors := s.errors;

  if v_ok then
    v_new_step := s.next_step + 1;
  else
    v_new_errors := s.errors + 1;
    v_new_score := greatest(0, s.score - 5);
  end if;

  v_history := s.command_history || jsonb_build_array(
    jsonb_build_object(
      'command', trim(coalesce(p_command,'')),
      'normalized', v_command,
      'correct', v_ok,
      'step', s.next_step + 1,
      'at', now()
    )
  );

  if v_new_step >= 19 then
    v_completed := true;
    v_passed := v_new_score >= 80;
    v_duration := greatest(0, extract(epoch from (now()-s.started_at))::integer);

    insert into public.ios_final_attempts(
      user_id,score,errors,duration_seconds,steps_completed,total_steps,
      passed,command_history,completed_at
    )
    values(
      v_user,v_new_score,v_new_errors,v_duration,19,19,
      v_passed,v_history,now()
    )
    returning id into v_attempt_id;

    update public.ios_final_sessions
       set status='completed',
           next_step=19,
           score=v_new_score,
           errors=v_new_errors,
           command_history=v_history,
           last_activity_at=now(),
           completed_at=now()
     where id=s.id;
  else
    update public.ios_final_sessions
       set next_step=v_new_step,
           score=v_new_score,
           errors=v_new_errors,
           command_history=v_history,
           last_activity_at=now()
     where id=s.id;
    v_duration := greatest(0, extract(epoch from (now()-s.started_at))::integer);
  end if;

  return query select
    v_ok,v_new_step,v_new_score,v_new_errors,v_completed,v_passed,
    v_duration,v_attempt_id,
    case when v_completed then 'completed' else 'active' end;
end;
$$;

create or replace function public.get_ios_active_session()
returns table (
  session_id uuid,
  next_step integer,
  score integer,
  errors integer,
  status text,
  started_at timestamptz,
  expires_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select s.id,s.next_step,s.score,s.errors,s.status,
         s.started_at,s.started_at + interval '45 minutes'
  from public.ios_final_sessions s
  where s.user_id=auth.uid()
    and s.status='active'
    and now() <= s.started_at + interval '45 minutes'
  limit 1;
$$;

-- V66.39 allowed arbitrary client-supplied results. V66.40 closes that route.
revoke all on function public.save_ios_final_attempt(integer, integer, integer, integer, jsonb, timestamptz) from public;
revoke execute on function public.save_ios_final_attempt(integer, integer, integer, integer, jsonb, timestamptz) from authenticated;

revoke all on function public.start_ios_final_session() from public;
revoke all on function public.submit_ios_final_step(uuid,text) from public;
revoke all on function public.get_ios_active_session() from public;

grant execute on function public.start_ios_final_session() to authenticated;
grant execute on function public.submit_ios_final_step(uuid,text) to authenticated;
grant execute on function public.get_ios_active_session() to authenticated;

-- Make the certificate gate explicitly require a complete 19-step server attempt.
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
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  select coalesce(p.full_name, trim(coalesce(p_name, '')), 'المتدرب')
    into v_name
  from public.profiles p where p.id=v_user;

  if v_name is null or length(trim(v_name))=0 then
    v_name := trim(coalesce(p_name,'المتدرب'));
  end if;

  select a.score,a.duration_seconds,a.completed_at
    into final_score,best_time,v_completed_at
  from public.ios_final_attempts a
  where a.user_id=v_user
    and a.passed=true
    and a.steps_completed=19
    and a.total_steps=19
  order by a.score desc,a.duration_seconds asc,a.completed_at desc
  limit 1;

  if final_score is null then raise exception 'IOS_FINAL_NOT_VERIFIED'; end if;

  select coalesce(max(a.score),final_score),
         coalesce(min(a.duration_seconds) filter (where a.score=(
           select max(z.score) from public.ios_final_attempts z
           where z.user_id=v_user and z.passed=true and z.steps_completed=19
         )),best_time)
    into v_best_score,v_best_time
  from public.ios_final_attempts a
  where a.user_id=v_user and a.passed=true and a.steps_completed=19;

  select i.certificate_no,i.student_name,i.final_score,i.best_score,
         i.best_time,i.mastery_level,i.xp,i.final_completed_at,i.issued_at
    into certificate_no,student_name,final_score,best_score,best_time,
         mastery_level,xp,final_completed_at,issued_at
  from public.ios_certificates i where i.user_id=v_user limit 1;

  if certificate_no is not null then return next; return; end if;

  v_no := 'IOS-'||to_char(now(),'YYYY')||'-'||
          upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.ios_certificates(
    user_id,certificate_no,student_name,final_score,best_score,
    best_time,mastery_level,xp,final_completed_at
  )
  values(
    v_user,v_no,left(trim(v_name),180),final_score,v_best_score,
    v_best_time,left(trim(coalesce(p_tier,'مبتدئ IOS')),120),
    greatest(coalesce(p_xp,0),0),v_completed_at
  )
  on conflict(user_id) do nothing;

  select i.certificate_no,i.student_name,i.final_score,i.best_score,
         i.best_time,i.mastery_level,i.xp,i.final_completed_at,i.issued_at
    into certificate_no,student_name,final_score,best_score,best_time,
         mastery_level,xp,final_completed_at,issued_at
  from public.ios_certificates i where i.user_id=v_user limit 1;

  return next;
end;
$$;

revoke all on function public.issue_ios_certificate(text, integer, integer, integer, text, integer, timestamptz) from public;
grant execute on function public.issue_ios_certificate(text, integer, integer, integer, text, integer, timestamptz) to authenticated;
