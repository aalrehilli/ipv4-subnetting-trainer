-- V3.74.1 • Tighten exam readiness checks
-- Applied to Supabase production as migration: v3_74_exam_readiness_tightening

create or replace function public.academy_start_exam(p_exam_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  e public.academy_exams;
  v_attempt_no integer;
  v_attempt uuid;
  v_group text:=public.academy_student_group();
  v_declared integer;
  v_distinct integer:=0;
  v_ready integer:=0;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into e from public.academy_exams where id=p_exam_id;
  if not found then raise exception 'EXAM_NOT_FOUND'; end if;
  v_declared:=jsonb_array_length(coalesce(e.question_ids,'[]'::jsonb));

  if not public.academy_is_trainer() then
    if not e.published then raise exception 'EXAM_NOT_PUBLISHED'; end if;
    if e.starts_at is not null and e.starts_at>now() then raise exception 'EXAM_NOT_STARTED'; end if;
    if e.ends_at is not null and e.ends_at<now() then raise exception 'EXAM_CLOSED'; end if;
    if cardinality(e.visible_groups)>0 and not (v_group=any(e.visible_groups)) then raise exception 'EXAM_NOT_FOR_GROUP'; end if;
  end if;

  if e.question_count<=0 or v_declared<=0 or v_declared<>e.question_count then
    raise exception 'EXAM_NOT_READY';
  end if;

  select count(distinct value::text)::integer into v_distinct
  from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb));
  if v_distinct<>v_declared then raise exception 'EXAM_NOT_READY'; end if;

  select count(*)::integer into v_ready
  from public.trainer_questions tq
  where tq.active=true
    and tq.question_type='mcq'
    and coalesce(jsonb_array_length(tq.options_json),0)=4
    and not exists (
      select 1 from jsonb_array_elements_text(coalesce(tq.options_json,'[]'::jsonb)) x
      where trim(x)=''
    )
    and (select count(distinct lower(trim(x)))
         from jsonb_array_elements_text(coalesce(tq.options_json,'[]'::jsonb)) x)=4
    and upper(coalesce(tq.correct_answer,'')) in ('A','B','C','D')
    and exists (
      select 1 from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb)) ids
      where ids=tq.id::text or ids=tq.legacy_id::text
    );

  if v_ready<>v_declared then raise exception 'EXAM_NOT_READY'; end if;

  select count(*)::integer+1 into v_attempt_no
  from public.academy_exam_attempts a
  where a.exam_id=e.id and a.user_id=auth.uid();
  if e.attempts_limit>0 and v_attempt_no>e.attempts_limit then raise exception 'ATTEMPTS_LIMIT'; end if;

  insert into public.academy_exam_attempts(exam_id,user_id,attempt_no,status,started_at)
  values(e.id,auth.uid(),v_attempt_no,'in_progress',now())
  returning id into v_attempt;

  return jsonb_build_object(
    'ok',true,'attemptId',v_attempt,'attemptNo',v_attempt_no,'examId',e.id,
    'title',e.title,'durationMinutes',e.duration_minutes,'passPercent',e.pass_percent,
    'attemptsLimit',e.attempts_limit,'questionCount',e.question_count,
    'selectionMode',e.selection_mode,'difficultyMode',e.difficulty_mode,
    'questionIds',e.question_ids,'shuffleQuestions',e.shuffle_questions,'shuffleOptions',e.shuffle_options
  );
end;
$function$;