-- V3.73 • Production hardening for the central exam engine
-- Applied to Supabase production as migration: v3_73_exam_engine_production_hardening

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

  select count(distinct value::text)::integer
    into v_distinct
  from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb));

  if v_distinct<>v_declared then raise exception 'EXAM_NOT_READY'; end if;

  select count(*)::integer into v_ready
  from public.trainer_questions tq
  where tq.active=true
    and coalesce(jsonb_array_length(tq.options_json),0)>=2
    and upper(coalesce(tq.correct_answer,'')) in ('A','B','C','D')
    and exists (
      select 1 from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb)) ids
      where ids=tq.id::text or ids=tq.legacy_id::text
    );

  if v_ready<>v_declared then raise exception 'EXAM_NOT_READY'; end if;

  select count(*)::integer+1 into v_attempt_no
  from public.academy_exam_attempts a
  where a.exam_id=e.id and a.user_id=auth.uid();

  if e.attempts_limit>0 and v_attempt_no>e.attempts_limit then
    raise exception 'ATTEMPTS_LIMIT';
  end if;

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


create or replace function public.academy_record_exam_attempt(p_attempt jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid:=(p_attempt->>'attemptId')::uuid;
  v_exam public.academy_exams;
  v_status text;
  v_attempt_no integer;
  v_started timestamptz;
  v_item jsonb;
  v_client_item jsonb;
  v_idtext text;
  v_selected integer;
  v_correct integer;
  v_score integer:=0;
  v_total integer:=0;
  v_percent integer:=0;
  v_passed boolean:=false;
  v_order integer:=0;
  v_topics jsonb:='[]'::jsonb;
  v_auto boolean:=coalesce((p_attempt->>'autoSubmitted')::boolean,false);
  v_elapsed integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select e.* into v_exam
  from public.academy_exams e
  join public.academy_exam_attempts a on a.exam_id=e.id
  where a.id=v_id and (a.user_id=auth.uid() or public.academy_is_trainer());

  select status,attempt_no,started_at into v_status,v_attempt_no,v_started
  from public.academy_exam_attempts where id=v_id;

  if v_status is null then raise exception 'ATTEMPT_NOT_FOUND'; end if;

  if v_status='submitted' then
    return (select jsonb_build_object(
      'ok',true,'attemptId',id,'attemptNo',attempt_no,'score',score,'total',total,
      'percent',percent,'passed',passed,'topics','[]'::jsonb
    ) from public.academy_exam_attempts where id=v_id);
  end if;

  if now() >= v_started+(greatest(1,v_exam.duration_minutes)||' minutes')::interval then
    v_auto:=true;
  end if;

  delete from public.academy_exam_answers where attempt_id=v_id;

  for v_item in
    select value from jsonb_array_elements(coalesce(v_exam.question_ids,'[]'::jsonb)) value
  loop
    v_order:=v_order+1;
    v_idtext:=v_item #>> '{}';

    select value into v_client_item
    from jsonb_array_elements(coalesce(p_attempt->'questionResults','[]'::jsonb))
    where coalesce(value->>'id','')=v_idtext
    limit 1;

    v_selected:=coalesce((v_client_item->>'selected')::integer,-1);
    if v_selected<0 or v_selected>3 then v_selected:=-1; end if;

    select case
      when tq.correct_answer ~ '^[A-D]$' then ascii(upper(tq.correct_answer))-65
      else -1 end
    into v_correct
    from public.trainer_questions tq
    where tq.active=true and (tq.legacy_id::text=v_idtext or tq.id::text=v_idtext)
    limit 1;

    v_correct:=coalesce(v_correct,-1);
    v_total:=v_total+1;

    if v_selected>=0 and v_selected=v_correct then v_score:=v_score+1; end if;

    insert into public.academy_exam_answers(
      attempt_id,question_id,question_order,selected_answer,correct_answer,is_correct,points_awarded
    )
    values(
      v_id,v_idtext,v_order,to_jsonb(v_selected),to_jsonb(v_correct),
      v_selected>=0 and v_selected=v_correct,
      case when v_selected>=0 and v_selected=v_correct then 1 else 0 end
    );
  end loop;

  if v_total=0 then v_total:=coalesce(v_exam.question_count,0); end if;
  v_percent:=case when v_total>0 then round(v_score::numeric/v_total::numeric*100)::integer else 0 end;
  v_passed:=v_percent>=v_exam.pass_percent;

  select coalesce(jsonb_agg(
    jsonb_build_object('topic',topic,'percent',percent,'correct',correct,'total',total)
    order by percent
  ),'[]'::jsonb)
  into v_topics
  from (
    select tq.topic,
      round(sum(case when ea.is_correct then 1 else 0 end)::numeric/count(*)::numeric*100)::integer percent,
      sum(case when ea.is_correct then 1 else 0 end)::integer correct,
      count(*)::integer total
    from public.academy_exam_answers ea
    join public.trainer_questions tq
      on (tq.legacy_id::text=ea.question_id or tq.id::text=ea.question_id)
    where ea.attempt_id=v_id
    group by tq.topic
  ) x;

  v_elapsed:=greatest(
    0,
    least(
      greatest(1,v_exam.duration_minutes)*60,
      extract(epoch from (now()-v_started))::integer
    )
  );

  update public.academy_exam_attempts set
    status='submitted',
    score=v_score,
    total=v_total,
    percent=v_percent,
    passed=v_passed,
    duration_seconds=v_elapsed,
    auto_submitted=v_auto,
    submitted_at=now(),
    results_published=true
  where id=v_id;

  return jsonb_build_object(
    'ok',true,'attemptId',v_id,'attemptNo',v_attempt_no,
    'score',v_score,'total',v_total,'percent',v_percent,'passed',v_passed,
    'autoSubmitted',v_auto,'topics',v_topics
  );
end;
$function$;