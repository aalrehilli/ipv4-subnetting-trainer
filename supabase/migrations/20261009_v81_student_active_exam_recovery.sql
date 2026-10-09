-- V3.81 • Student server-side active exam recovery

create or replace function public.academy_my_active_exam()
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  a public.academy_exam_attempts;
  e public.academy_exams;
  v_questions jsonb;
  v_drafts jsonb;
  v_remaining integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  perform public.academy_finalize_expired_exam_attempts(auth.uid());

  select ea.* into a
  from public.academy_exam_attempts ea
  where ea.user_id=auth.uid()
    and ea.status='in_progress'
  order by ea.started_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok',true,'hasActiveAttempt',false);
  end if;

  select * into e from public.academy_exams where id=a.exam_id;

  v_remaining:=greatest(
    0,
    e.duration_minutes*60-extract(epoch from (now()-a.started_at))::integer
  );

  if v_remaining<=0 then
    perform public.academy_finalize_expired_exam_attempts(auth.uid());
    return jsonb_build_object('ok',true,'hasActiveAttempt',false);
  end if;

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
  from jsonb_array_elements_text(coalesce(e.question_ids,'[]'::jsonb))
    with ordinality ids(value,ord)
  join public.trainer_questions tq
    on tq.active=true
   and (tq.id::text=ids.value or tq.legacy_id::text=ids.value);

  select coalesce(
    jsonb_object_agg(ea.question_id,coalesce(ea.selected_answer,'null'::jsonb)),
    '{}'::jsonb
  )
  into v_drafts
  from public.academy_exam_answers ea
  where ea.attempt_id=a.id;

  return jsonb_build_object(
    'ok',true,
    'hasActiveAttempt',true,
    'attemptId',a.id,
    'attemptNo',a.attempt_no,
    'examId',e.id,
    'title',e.title,
    'courseId',e.course_id,
    'durationMinutes',e.duration_minutes,
    'passPercent',e.pass_percent,
    'attemptsLimit',e.attempts_limit,
    'questionCount',e.question_count,
    'selectionMode',e.selection_mode,
    'difficultyMode',e.difficulty_mode,
    'questionIds',e.question_ids,
    'shuffleQuestions',e.shuffle_questions,
    'shuffleOptions',e.shuffle_options,
    'startedAt',a.started_at,
    'expiresAt',a.started_at+(greatest(1,e.duration_minutes)||' minutes')::interval,
    'remainingSeconds',v_remaining,
    'questions',v_questions,
    'draftAnswers',v_drafts
  );
end;
$function$;

grant execute on function public.academy_my_active_exam() to authenticated;
notify pgrst,'reload schema';
