-- V3.79 • Central draft answers and seamless attempt resume
-- Applied to production Supabase during V3.79.

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
  v_started timestamptz;
  v_resumed boolean:=false;
  v_group text:=public.academy_student_group();
  v_declared integer;
  v_distinct integer:=0;
  v_ready integer:=0;
  v_questions jsonb;
  v_drafts jsonb;
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
  if e.question_count<=0 or v_declared<=0 or v_declared<>e.question_count then raise exception 'EXAM_NOT_READY'; end if;

  select count(distinct value::text)::integer into v_distinct
  from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb));
  if v_distinct<>v_declared then raise exception 'EXAM_NOT_READY'; end if;

  select count(*)::integer into v_ready
  from public.trainer_questions tq
  where tq.active=true and tq.question_type='mcq'
    and coalesce(jsonb_array_length(tq.options_json),0)=4
    and not exists(select 1 from jsonb_array_elements_text(coalesce(tq.options_json,'[]'::jsonb)) x where trim(x)='')
    and (select count(distinct lower(trim(x))) from jsonb_array_elements_text(coalesce(tq.options_json,'[]'::jsonb)) x)=4
    and upper(coalesce(tq.correct_answer,'')) in ('A','B','C','D')
    and exists(select 1 from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb)) ids where ids=tq.id::text or ids=tq.legacy_id::text);
  if v_ready<>v_declared then raise exception 'EXAM_NOT_READY'; end if;

  select a.id,a.attempt_no,a.started_at into v_attempt,v_attempt_no,v_started
  from public.academy_exam_attempts a
  where a.exam_id=e.id and a.user_id=auth.uid() and a.status='in_progress'
  order by a.started_at desc limit 1;

  if v_attempt is not null then
    v_resumed:=true;
  else
    select count(*)::integer+1 into v_attempt_no
    from public.academy_exam_attempts a where a.exam_id=e.id and a.user_id=auth.uid();
    if e.attempts_limit>0 and v_attempt_no>e.attempts_limit then raise exception 'ATTEMPTS_LIMIT'; end if;
    insert into public.academy_exam_attempts(exam_id,user_id,attempt_no,status,started_at)
    values(e.id,auth.uid(),v_attempt_no,'in_progress',now())
    returning id,started_at into v_attempt,v_started;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',coalesce(tq.legacy_id::text,tq.id::text),'sourceId',tq.id::text,
      'q',tq.question_text,'prompt',tq.question_text,'topic',tq.topic,'difficulty',tq.difficulty,
      'options',tq.options_json,'opts',tq.options_json,'points',1,'position',ids.ord
    ) order by ids.ord
  ),'[]'::jsonb)
  into v_questions
  from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb)) with ordinality ids(value,ord)
  join public.trainer_questions tq on tq.active=true and (tq.id::text=ids.value or tq.legacy_id::text=ids.value);

  if jsonb_array_length(v_questions)<>e.question_count then raise exception 'EXAM_NOT_READY'; end if;

  select coalesce(jsonb_object_agg(ea.question_id,coalesce(ea.selected_answer,'null'::jsonb)),'{}'::jsonb)
  into v_drafts
  from public.academy_exam_answers ea where ea.attempt_id=v_attempt;

  return jsonb_build_object(
    'ok',true,'resumed',v_resumed,'attemptId',v_attempt,'attemptNo',v_attempt_no,'examId',e.id,
    'title',e.title,'durationMinutes',e.duration_minutes,'passPercent',e.pass_percent,'attemptsLimit',e.attempts_limit,
    'questionCount',e.question_count,'selectionMode',e.selection_mode,'difficultyMode',e.difficulty_mode,
    'questionIds',e.question_ids,'shuffleQuestions',e.shuffle_questions,'shuffleOptions',e.shuffle_options,
    'startedAt',v_started,'expiresAt',v_started+(greatest(1,e.duration_minutes)||' minutes')::interval,
    'questions',v_questions,'draftAnswers',v_drafts
  );
end;
$function$;

grant execute on function public.academy_prepare_exam_attempt(uuid) to authenticated;

create or replace function public.academy_save_exam_draft_answer(
  p_attempt_id uuid,p_question_id text,p_selected integer
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  v_exam public.academy_exams;
  v_order integer;
  v_selected integer:=p_selected;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_selected is null or v_selected<0 or v_selected>3 then v_selected:=null; end if;

  select e.* into v_exam
  from public.academy_exams e
  join public.academy_exam_attempts a on a.exam_id=e.id
  where a.id=p_attempt_id and a.user_id=auth.uid() and a.status='in_progress';

  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;

  select min(ord)::integer into v_order
  from (
    select value::text qid,ordinality ord
    from jsonb_array_elements_text(coalesce(v_exam.question_ids,'[]'::jsonb)) with ordinality
  ) x
  where x.qid=trim(p_question_id)
     or exists(
       select 1 from public.trainer_questions tq
       where tq.id::text=trim(p_question_id)
         and (tq.id::text=x.qid or tq.legacy_id::text=x.qid)
     );

  if v_order is null then raise exception 'QUESTION_NOT_IN_EXAM'; end if;

  if v_selected is null then
    delete from public.academy_exam_answers where attempt_id=p_attempt_id and question_id=trim(p_question_id);
  else
    insert into public.academy_exam_answers(
      attempt_id,question_id,question_order,selected_answer,correct_answer,is_correct,points_awarded
    )
    values(p_attempt_id,trim(p_question_id),v_order,to_jsonb(v_selected),null,false,0)
    on conflict(attempt_id,question_id) do update
    set question_order=excluded.question_order,
        selected_answer=excluded.selected_answer,
        correct_answer=null,is_correct=false,points_awarded=0;
  end if;

  return jsonb_build_object('ok',true,'attemptId',p_attempt_id,'questionId',trim(p_question_id),'selected',v_selected,'savedAt',now());
end;
$function$;

grant execute on function public.academy_save_exam_draft_answer(uuid,text,integer) to authenticated;
notify pgrst,'reload schema';
