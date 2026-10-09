-- V3.82 • Official student results + automatic result notifications

create or replace function public.academy_notify_exam_result(p_attempt_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $function$
declare
  a public.academy_exam_attempts;
  e public.academy_exams;
  v_type text;
  v_title text;
  v_message text;
  v_dedupe text;
begin
  select * into a from public.academy_exam_attempts where id=p_attempt_id;
  if not found then return false; end if;

  select * into e from public.academy_exams where id=a.exam_id;

  v_type:=case when a.passed then 'success' else 'warning' end;
  v_title:=case when a.passed then 'نتيجة الاختبار: ناجح' else 'ظهرت نتيجة الاختبار' end;
  v_message:=format('%s — حصلت على %s%% (%s من %s).',coalesce(e.title,'الاختبار'),a.percent,a.score,a.total);
  if a.auto_submitted then
    v_message:=v_message||' تم التسليم تلقائيًا لانتهاء الوقت.';
  end if;

  v_dedupe:='exam-result:'||a.id::text;

  insert into public.student_notifications(
    user_id,title,message,notification_type,reference_id,created_at,dedupe_key,related_attempt_id
  )
  values(a.user_id,v_title,v_message,v_type,a.id::text,now(),v_dedupe,a.id)
  on conflict(dedupe_key) do nothing;

  return true;
end;
$function$;

revoke all on function public.academy_notify_exam_result(uuid) from public,authenticated;

create or replace function public.academy_student_exam_results(p_limit integer default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $function$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'attemptId',a.id,'examId',a.exam_id,'title',e.title,'attemptNo',a.attempt_no,
      'score',a.score,'total',a.total,'percent',a.percent,'passed',a.passed,
      'durationSec',a.duration_seconds,'autoSubmitted',a.auto_submitted,'submittedAt',a.submitted_at
    ) order by a.submitted_at desc)
    from (
      select *
      from public.academy_exam_attempts
      where user_id=auth.uid()
        and status='submitted'
        and results_published=true
      order by submitted_at desc
      limit greatest(1,least(coalesce(p_limit,10),50))
    ) a
    join public.academy_exams e on e.id=a.exam_id
  ),'[]'::jsonb);
end;
$function$;

grant execute on function public.academy_student_exam_results(integer) to authenticated;

-- The submit function remains server-authoritative and now publishes one notification.
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
    perform public.academy_notify_exam_result(v_id);
    return (select jsonb_build_object(
      'ok',true,'attemptId',id,'attemptNo',attempt_no,'score',score,'total',total,
      'percent',percent,'passed',passed,'autoSubmitted',auto_submitted,'topics','[]'::jsonb
    ) from public.academy_exam_attempts where id=v_id);
  end if;

  if now() >= v_started+(greatest(1,v_exam.duration_minutes)||' minutes')::interval then
    v_auto:=true;
  end if;

  delete from public.academy_exam_answers where attempt_id=v_id;

  for v_item in select value from jsonb_array_elements(coalesce(v_exam.question_ids,'[]'::jsonb)) value loop
    v_order:=v_order+1;
    v_idtext:=v_item #>> '{}';

    select value into v_client_item
    from jsonb_array_elements(coalesce(p_attempt->'questionResults','[]'::jsonb))
    where coalesce(value->>'id','')=v_idtext limit 1;

    v_selected:=coalesce((v_client_item->>'selected')::integer,-1);
    if v_selected<0 or v_selected>3 then v_selected:=-1; end if;

    select case when tq.correct_answer ~ '^[A-D]$' then ascii(upper(tq.correct_answer))-65 else -1 end
    into v_correct
    from public.trainer_questions tq
    where tq.active=true and (tq.legacy_id::text=v_idtext or tq.id::text=v_idtext) limit 1;

    v_correct:=coalesce(v_correct,-1);
    v_total:=v_total+1;

    if v_selected>=0 and v_selected=v_correct then v_score:=v_score+1; end if;

    insert into public.academy_exam_answers(
      attempt_id,question_id,question_order,selected_answer,correct_answer,is_correct,points_awarded
    )
    values(v_id,v_idtext,v_order,to_jsonb(v_selected),to_jsonb(v_correct),
           v_selected>=0 and v_selected=v_correct,
           case when v_selected>=0 and v_selected=v_correct then 1 else 0 end);
  end loop;

  if v_total=0 then v_total:=coalesce(v_exam.question_count,0); end if;
  v_percent:=case when v_total>0 then round(v_score::numeric/v_total::numeric*100)::integer else 0 end;
  v_passed:=v_percent>=v_exam.pass_percent;

  select coalesce(jsonb_agg(jsonb_build_object(
    'topic',topic,'percent',percent,'correct',correct,'total',total
  ) order by percent),'[]'::jsonb)
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

  v_elapsed:=greatest(0,least(greatest(1,v_exam.duration_minutes)*60,
    extract(epoch from (now()-v_started))::integer));

  update public.academy_exam_attempts set
    status='submitted',score=v_score,total=v_total,percent=v_percent,passed=v_passed,
    duration_seconds=v_elapsed,auto_submitted=v_auto,submitted_at=now(),results_published=true
  where id=v_id;

  perform public.academy_notify_exam_result(v_id);

  return jsonb_build_object(
    'ok',true,'attemptId',v_id,'attemptNo',v_attempt_no,'score',v_score,'total',v_total,
    'percent',v_percent,'passed',v_passed,'autoSubmitted',v_auto,'topics',v_topics
  );
end;
$function$;

grant execute on function public.academy_record_exam_attempt(jsonb) to authenticated;
notify pgrst,'reload schema';
