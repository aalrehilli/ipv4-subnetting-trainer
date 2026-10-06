-- V66.38 — Central IOS mastery certificates
-- Run this migration in Supabase SQL Editor before using central issuance/verification.

create table if not exists public.ios_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  certificate_no text not null unique,
  student_name text not null,
  final_score integer not null check (final_score between 0 and 100),
  best_score integer not null check (best_score between 0 and 100),
  best_time integer check (best_time is null or best_time >= 0),
  mastery_level text not null,
  xp integer not null default 0 check (xp >= 0),
  final_completed_at timestamptz,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint ios_certificates_user_unique unique (user_id)
);

alter table public.ios_certificates enable row level security;

drop policy if exists "ios certificates own select" on public.ios_certificates;
create policy "ios certificates own select"
on public.ios_certificates
for select to authenticated
using (auth.uid() = user_id);

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
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(p_score, 0) < 80 then
    raise exception 'IOS_FINAL_NOT_PASSED';
  end if;

  if length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'STUDENT_NAME_REQUIRED';
  end if;

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

  insert into public.ios_certificates (
    user_id, certificate_no, student_name, final_score, best_score,
    best_time, mastery_level, xp, final_completed_at
  )
  values (
    v_user, v_no, left(trim(p_name), 180), p_score, p_best_score,
    p_best_time, left(trim(p_tier), 120), greatest(coalesce(p_xp, 0), 0),
    p_final_completed_at
  )
  on conflict (user_id) do nothing;

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

create or replace function public.get_ios_certificate()
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
language sql
security definer
stable
set search_path = public
as $$
  select i.certificate_no, i.student_name, i.final_score, i.best_score,
         i.best_time, i.mastery_level, i.xp, i.final_completed_at, i.issued_at
  from public.ios_certificates i
  where i.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.verify_ios_certificate(p_certificate_no text)
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
language sql
security definer
stable
set search_path = public
as $$
  select i.certificate_no, i.student_name, i.final_score, i.best_score,
         i.best_time, i.mastery_level, i.xp, i.final_completed_at, i.issued_at
  from public.ios_certificates i
  where i.certificate_no = trim(p_certificate_no)
  limit 1;
$$;

revoke all on function public.issue_ios_certificate(text, integer, integer, integer, text, integer, timestamptz) from public;
revoke all on function public.get_ios_certificate() from public;
revoke all on function public.verify_ios_certificate(text) from public;

grant execute on function public.issue_ios_certificate(text, integer, integer, integer, text, integer, timestamptz) to authenticated;
grant execute on function public.get_ios_certificate() to authenticated;
grant execute on function public.verify_ios_certificate(text) to anon, authenticated;
