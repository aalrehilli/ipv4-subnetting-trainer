-- V3.77 • Atomic exam preparation + E2E readiness
-- The database version is the source of truth for exam runtime checks.

-- Repair the last legacy MCQ row that had been reintroduced by an older local-sync payload.
update public.trainer_questions
set options_json='["10","8","12","14"]'::jsonb,
    correct_answer='A',
    question_type='mcq'
where id='d55ae6d9-4598-4394-a7ed-02e694396218';

create or replace function public.academy_prepare_exam_attempt(p_exam_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  e public.academy_exams;
  v_attempt_no integer;
  v_attempt uuid;
  v_group text:=public.academy_student_group();
  v_declared integer;
  v_distinct integer:=0;
  v_ready integer:=0;
  v_questions jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into e from public.academy_exams where id=p_exam_id;
  if not found then raise exception 'EXAM_NOT_FOUND'; end if;

  if not public.academy_is_trainer() then
    if not e.published then raise exception 'EXAM_NOT_PUBLISHED'; end if;
    if e.starts_at is not null and e.starts_at>now() then raise exception 'EXAM_NOT_STARTED'; end if;
    if e.ends_at is not null and e.ends_at<now() then raise exception 'EXAM_CLOSED'; end if;
    if cardinality(e.visible_groups)>0 and not (v_group=any(e.visible_groups)) then raise exception 'EXAM_NOT_FOR_GROUP'; end if;
  end if;

  v_declared:=jsonb_array_length(coalesce(e.question_ids,'[]'::jsonb));
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
    and not exists(
      select 1 from jsonb_array_elements_text(coalesce(tq.options_json,'[]'::jsonb)) x
      where trim(x)=''
    )
    and (
      select count(distinct lower(trim(x)))
      from jsonb_array_elements_text(coalesce(tq.options_json,'[]'::jsonb)) x
    )=4
    and upper(coalesce(tq.correct_answer,'')) in ('A','B','C','D')
    and exists(
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

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',coalesce(tq.legacy_id::text,tq.id::text),
      'sourceId',tq.id::text,
      'q',tq.question_text,
      'prompt',tq.question_text,
      'topic',tq.topic,
      'difficulty',tq.difficulty,
      'options',tq.options_json,
      'opts',tq.options_json,
      'points',1,
      'position',ids.ord
    ) order by ids.ord
  ),'[]'::jsonb)
  into v_questions
  from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb)) with ordinality ids(value,ord)
  join public.trainer_questions tq
    on tq.active=true and (tq.id::text=ids.value or tq.legacy_id::text=ids.value);

  if jsonb_array_length(v_questions)<>e.question_count then
    raise exception 'EXAM_NOT_READY';
  end if;

  return jsonb_build_object(
    'ok',true,'attemptId',v_attempt,'attemptNo',v_attempt_no,'examId',e.id,
    'title',e.title,'durationMinutes',e.duration_minutes,'passPercent',e.pass_percent,
    'attemptsLimit',e.attempts_limit,'questionCount',e.question_count,
    'selectionMode',e.selection_mode,'difficultyMode',e.difficulty_mode,
    'questionIds',e.question_ids,'shuffleQuestions',e.shuffle_questions,
    'shuffleOptions',e.shuffle_options,'questions',v_questions
  );
end;
$function$;

grant execute on function public.academy_prepare_exam_attempt(uuid) to authenticated;

create or replace function public.academy_exam_e2e_readiness()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $function$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;

  with exam_rows as (
    select e.id,e.title,e.published,e.question_count,
      jsonb_array_length(coalesce(e.question_ids,'[]'::jsonb)) declared_count,
      coalesce((
        select count(*)::integer
        from public.trainer_questions tq
        where tq.active=true
          and tq.question_type='mcq'
          and coalesce(jsonb_array_length(tq.options_json),0)=4
          and not exists(
            select 1 from jsonb_array_elements_text(coalesce(tq.options_json,'[]'::jsonb)) x
            where trim(x)=''
          )
          and (
            select count(distinct lower(trim(x)))
            from jsonb_array_elements_text(coalesce(tq.options_json,'[]'::jsonb)) x
          )=4
          and upper(coalesce(tq.correct_answer,'')) in ('A','B','C','D')
          and exists(
            select 1 from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb)) ids
            where ids=tq.id::text or ids=tq.legacy_id::text
          )
      ),0)::integer ready_count,
      (
        select count(distinct value::text)::integer
        from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb))
      ) distinct_count
    from public.academy_exams e
    where e.published=true
  ),
  normalized as (
    select *,
      (declared_count=question_count and distinct_count=question_count and ready_count=question_count) ready
    from exam_rows
  )
  select jsonb_build_object(
    'generatedAt',now(),
    'summary',jsonb_build_object(
      'publishedExams',count(*)::integer,
      'readyExams',count(*) filter(where ready)::integer,
      'blockedExams',count(*) filter(where not ready)::integer,
      'centralAttempts',(select count(*)::integer from public.academy_exam_attempts)
    ),
    'exams',coalesce(jsonb_agg(jsonb_build_object(
      'examId',id,'title',title,'published',published,
      'questionCount',question_count,'declaredCount',declared_count,
      'distinctCount',distinct_count,'readyCount',ready_count,'ready',ready
    ) order by title,id),'[]'::jsonb)
  ) into v_result
  from normalized;

  return coalesce(v_result,'{}'::jsonb);
end;
$function$;

grant execute on function public.academy_exam_e2e_readiness() to authenticated;
notify pgrst,'reload schema';
