create or replace function public.academy_trainer_exam_results(
  p_course_id text default null,
  p_exam_id uuid default null,
  p_group_no text default null,
  p_student_id uuid default null
)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null or not public.academy_is_trainer() then
    raise exception 'TRAINER_REQUIRED';
  end if;

  return query
  select jsonb_build_object(
    'id', a.id,
    'examId', a.exam_id,
    'title', e.title,
    'courseId', e.course_id,
    'studentId', a.user_id,
    'studentName', coalesce(p.full_name, 'متدرب'),
    'studentCode', coalesce(p.student_id, ''),
    'groupNo', coalesce(p.group_no, p.group_name, ''),
    'attemptNo', a.attempt_no,
    'status', a.status,
    'score', a.score,
    'total', a.total,
    'percent', a.percent,
    'passed', a.passed,
    'durationSec', a.duration_seconds,
    'autoSubmitted', a.auto_submitted,
    'startedAt', a.started_at,
    'submittedAt', a.submitted_at,
    'resultsPublished', a.results_published
  )
  from public.academy_exam_attempts a
  join public.academy_exams e on e.id = a.exam_id
  left join public.profiles p on p.id = a.user_id
  where (p_course_id is null or e.course_id = trim(p_course_id))
    and (p_exam_id is null or a.exam_id = p_exam_id)
    and (p_group_no is null or coalesce(p.group_no, p.group_name, '') = trim(p_group_no))
    and (p_student_id is null or a.user_id = p_student_id)
  order by coalesce(a.submitted_at, a.started_at) desc;
end;
$function$;

create or replace function public.academy_exam_result_detail(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_attempt public.academy_exam_attempts;
  v_exam public.academy_exams;
  v_can_view boolean := false;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_attempt
  from public.academy_exam_attempts
  where id = p_attempt_id;

  if not found then
    raise exception 'ATTEMPT_NOT_FOUND';
  end if;

  select * into v_exam
  from public.academy_exams
  where id = v_attempt.exam_id;

  v_can_view :=
    public.academy_is_trainer()
    or (
      v_attempt.user_id = auth.uid()
      and v_attempt.results_published = true
      and v_attempt.status = 'submitted'
    );

  if not v_can_view then
    raise exception 'RESULT_NOT_PUBLISHED';
  end if;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'examId', v_attempt.exam_id,
      'title', v_exam.title,
      'courseId', v_exam.course_id,
      'attemptNo', v_attempt.attempt_no,
      'status', v_attempt.status,
      'score', v_attempt.score,
      'total', v_attempt.total,
      'percent', v_attempt.percent,
      'passed', v_attempt.passed,
      'durationSec', v_attempt.duration_seconds,
      'autoSubmitted', v_attempt.auto_submitted,
      'startedAt', v_attempt.started_at,
      'submittedAt', v_attempt.submitted_at,
      'resultsPublished', v_attempt.results_published
    ),
    'topics',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'topic', x.topic,
          'percent', x.percent,
          'correct', x.correct,
          'total', x.total
        )
        order by x.percent asc, x.topic
      )
      from (
        select
          coalesce(tq.topic, 'غير محدد') as topic,
          round(sum(case when ea.is_correct then 1 else 0 end)::numeric / nullif(count(*),0)::numeric * 100)::integer as percent,
          sum(case when ea.is_correct then 1 else 0 end)::integer as correct,
          count(*)::integer as total
        from public.academy_exam_answers ea
        left join public.trainer_questions tq
          on (tq.legacy_id::text = ea.question_id or tq.id::text = ea.question_id)
        where ea.attempt_id = p_attempt_id
        group by coalesce(tq.topic, 'غير محدد')
      ) x
    ), '[]'::jsonb),
    'answers',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ea.id,
          'questionId', ea.question_id,
          'questionOrder', ea.question_order,
          'question', coalesce(tq.question_text, 'سؤال'),
          'topic', coalesce(tq.topic, 'غير محدد'),
          'difficulty', coalesce(tq.difficulty, 'easy'),
          'selected', ea.selected_answer,
          'correct', ea.correct_answer,
          'isCorrect', ea.is_correct,
          'points', ea.points_awarded
        )
        order by ea.question_order
      )
      from public.academy_exam_answers ea
      left join public.trainer_questions tq
        on (tq.legacy_id::text = ea.question_id or tq.id::text = ea.question_id)
      where ea.attempt_id = p_attempt_id
    ), '[]'::jsonb)
  );
end;
$function$;

grant execute on function public.academy_trainer_exam_results(text,uuid,text,uuid) to authenticated;
grant execute on function public.academy_exam_result_detail(uuid) to authenticated;

notify pgrst, 'reload schema';