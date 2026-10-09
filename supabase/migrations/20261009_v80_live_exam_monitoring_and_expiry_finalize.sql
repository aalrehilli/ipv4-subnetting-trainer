-- V3.80 • Live exam monitoring + server-side expiry finalization
-- Applied to production Supabase during V3.80.

create or replace function public.academy_finalize_expired_exam_attempts(p_user_id uuid default null)
returns integer
language plpgsql
security definer
set search_path=public
as $function$
declare
  a record;
  q record;
  v_selected integer;
  v_score integer;
  v_total integer;
  v_percent integer;
  v_passed boolean;
  v_duration integer;
  v_expiry timestamptz;
  v_target uuid:=coalesce(p_user_id,auth.uid());
  v_done integer:=0;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_user_id is not null and p_user_id<>auth.uid() and not public.academy_is_trainer() then
    raise exception 'FORBIDDEN';
  end if;
  if p_user_id is null and not public.academy_is_trainer() then
    v_target:=auth.uid();
  end if;

  for a in
    select ea.id,ea.exam_id,ea.user_id,ea.started_at,
           e.duration_minutes,e.pass_percent,e.question_ids,e.question_count
    from public.academy_exam_attempts ea
    join public.academy_exams e on e.id=ea.exam_id
    where ea.status='in_progress'
      and (v_target is null or ea.user_id=v_target)
      and ea.started_at + (greatest(1,e.duration_minutes)||' minutes')::interval <= now()
    order by ea.started_at
  loop
    v_score:=0;
    v_total:=0;
    v_expiry:=a.started_at + (greatest(1,a.duration_minutes)||' minutes')::interval;

    for q in
      select ids.ord,
             coalesce(tq.legacy_id::text,tq.id::text) qid,
             case when upper(coalesce(tq.correct_answer,'')) between 'A' and 'D'
                  then ascii(upper(tq.correct_answer))-65 else -1 end correct_idx
      from jsonb_array_elements_text(coalesce(a.question_ids,'[]'::jsonb)) with ordinality ids(value,ord)
      join public.trainer_questions tq
        on tq.active=true and (tq.id::text=ids.value or tq.legacy_id::text=ids.value)
      order by ids.ord
    loop
      v_total:=v_total+1;

      select case
        when jsonb_typeof(ea.selected_answer)='number' then (ea.selected_answer)::text::integer
        else null
      end
      into v_selected
      from public.academy_exam_answers ea
      where ea.attempt_id=a.id
        and (
          trim(ea.question_id)=trim(q.qid)
          or exists(
            select 1 from public.trainer_questions tq2
            where tq2.active=true
              and (tq2.id::text=ea.question_id or tq2.legacy_id::text=ea.question_id)
              and (tq2.id::text=q.qid or tq2.legacy_id::text=q.qid)
          )
        )
      limit 1;

      insert into public.academy_exam_answers(
        attempt_id,question_id,question_order,selected_answer,correct_answer,is_correct,points_awarded
      )
      values(
        a.id,q.qid,q.ord,
        case when v_selected is null then null else to_jsonb(v_selected) end,
        case when q.correct_idx>=0 then to_jsonb(q.correct_idx) else null end,
        coalesce(v_selected,-1)=q.correct_idx,
        case when coalesce(v_selected,-1)=q.correct_idx then 1 else 0 end
      )
      on conflict(attempt_id,question_id) do update set
        question_order=excluded.question_order,
        selected_answer=excluded.selected_answer,
        correct_answer=excluded.correct_answer,
        is_correct=excluded.is_correct,
        points_awarded=excluded.points_awarded;

      if coalesce(v_selected,-1)=q.correct_idx then
        v_score:=v_score+1;
      end if;
    end loop;

    if v_total=0 then v_total:=greatest(0,a.question_count); end if;
    v_percent:=case when v_total>0 then round(v_score::numeric/v_total::numeric*100)::integer else 0 end;
    v_passed:=v_percent>=a.pass_percent;
    v_duration:=greatest(0,round(extract(epoch from (v_expiry-a.started_at)))::integer);

    update public.academy_exam_attempts
    set status='submitted',score=v_score,total=v_total,percent=v_percent,passed=v_passed,
        duration_seconds=v_duration,auto_submitted=true,submitted_at=v_expiry,
        results_published=true
    where id=a.id and status='in_progress';

    if found then v_done:=v_done+1; end if;
  end loop;

  return v_done;
end;
$function$;

grant execute on function public.academy_finalize_expired_exam_attempts(uuid) to authenticated;

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
  perform public.academy_finalize_expired_exam_attempts(auth.uid());

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
    select count(*)::integer+1 into v_attempt_no from public.academy_exam_attempts a
    where a.exam_id=e.id and a.user_id=auth.uid();

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
    'title',e.title,'durationMinutes',e.duration_minutes,'passPercent',e.pass_percent,
    'attemptsLimit',e.attempts_limit,'questionCount',e.question_count,'selectionMode',e.selection_mode,
    'difficultyMode',e.difficulty_mode,'questionIds',e.question_ids,'shuffleQuestions',e.shuffle_questions,
    'shuffleOptions',e.shuffle_options,'startedAt',v_started,
    'expiresAt',v_started+(greatest(1,e.duration_minutes)||' minutes')::interval,
    'questions',v_questions,'draftAnswers',v_drafts
  );
end;
$function$;

grant execute on function public.academy_prepare_exam_attempt(uuid) to authenticated;

create or replace function public.academy_trainer_live_exam_monitor()
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  v_finalized integer:=0;
  v_result jsonb;
begin
  if auth.uid() is null or not public.academy_is_trainer() then
    raise exception 'TRAINER_REQUIRED';
  end if;

  v_finalized:=public.academy_finalize_expired_exam_attempts(null);

  select jsonb_build_object(
    'generatedAt',now(),
    'finalizedExpired',v_finalized,
    'activeCount',count(*),
    'attempts',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'attemptId',a.id,'examId',a.exam_id,'title',e.title,'studentId',a.user_id,
            'studentName',coalesce(nullif(trim(p.full_name),''),'متدرب'),
            'studentCode',coalesce(nullif(trim(p.student_id),''),''),
            'groupNo',coalesce(nullif(trim(p.group_no),''),nullif(trim(p.group_name),''),'—'),
            'attemptNo',a.attempt_no,'startedAt',a.started_at,'durationMinutes',e.duration_minutes,
            'remainingSeconds',greatest(0,e.duration_minutes*60-extract(epoch from (now()-a.started_at))::integer)::integer,
            'answeredCount',(select count(*) from public.academy_exam_answers ea where ea.attempt_id=a.id and ea.selected_answer is not null),
            'questionCount',e.question_count
          ) order by a.started_at asc
        ),
        '[]'::jsonb
      )
  ) into v_result
  from public.academy_exam_attempts a
  join public.academy_exams e on e.id=a.exam_id
  left join public.profiles p on p.id=a.user_id
  where a.status='in_progress';

  return v_result;
end;
$function$;

grant execute on function public.academy_trainer_live_exam_monitor() to authenticated;
notify pgrst,'reload schema';
