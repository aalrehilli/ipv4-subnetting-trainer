-- IPv4 Academy V3.66.2
-- Server-authoritative grading with topic analytics.

create or replace function public.academy_record_exam_attempt(p_attempt jsonb)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare
  v_id uuid:=(p_attempt->>'attemptId')::uuid;
  v_exam public.academy_exams;
  v_item jsonb;
  v_idtext text;
  v_selected integer;
  v_correct integer;
  v_score integer:=0;
  v_total integer:=0;
  v_percent integer:=0;
  v_passed boolean:=false;
  v_order integer:=0;
  v_topics jsonb:='[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select e.* into v_exam
  from public.academy_exams e
  join public.academy_exam_attempts a on a.exam_id=e.id
  where a.id=v_id and (a.user_id=auth.uid() or public.academy_is_trainer());

  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;

  if (select status from public.academy_exam_attempts where id=v_id)='submitted' then
    select coalesce(jsonb_agg(jsonb_build_object('topic',t.topic,'percent',t.percent,'correct',t.correct,'total',t.total)
      order by t.percent),'[]'::jsonb)
    into v_topics
    from (
      select tq.topic,
        round(sum(case when ea.is_correct then 1 else 0 end)::numeric/count(*)::numeric*100)::integer percent,
        sum(case when ea.is_correct then 1 else 0 end)::integer correct,
        count(*)::integer total
      from public.academy_exam_answers ea
      join public.trainer_questions tq on (tq.legacy_id::text=ea.question_id or tq.id::text=ea.question_id)
      where ea.attempt_id=v_id
      group by tq.topic
    ) t;

    return (select jsonb_build_object('ok',true,'attemptId',id,'attemptNo',attempt_no,'score',score,'total',total,
      'percent',percent,'passed',passed,'topics',v_topics)
      from public.academy_exam_attempts where id=v_id);
  end if;

  delete from public.academy_exam_answers where attempt_id=v_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_attempt->'questionResults','[]'::jsonb)) loop
    v_order:=v_order+1;
    v_idtext:=coalesce(v_item->>'id','');
    v_selected:=-1;
    v_correct:=-1;

    select greatest(0,coalesce((v_item->>'selected')::integer,-1)),
           case when tq.correct_answer ~ '^[A-D]$' then ascii(upper(tq.correct_answer))-65 else -1 end
    into v_selected,v_correct
    from public.trainer_questions tq
    where tq.active=true
      and (tq.legacy_id::text=v_idtext or tq.id::text=v_idtext)
    limit 1;

    v_total:=v_total+1;
    if coalesce(v_selected,-1)>=0 and coalesce(v_selected,-1)=coalesce(v_correct,-1) then v_score:=v_score+1; end if;

    insert into public.academy_exam_answers(
      attempt_id,question_id,question_order,selected_answer,correct_answer,is_correct,points_awarded
    ) values(
      v_id,v_idtext,v_order,to_jsonb(coalesce(v_selected,-1)),to_jsonb(coalesce(v_correct,-1)),
      coalesce(v_selected,-1)>=0 and coalesce(v_selected,-1)=coalesce(v_correct,-1),
      case when coalesce(v_selected,-1)>=0 and coalesce(v_selected,-1)=coalesce(v_correct,-1) then 1 else 0 end
    );
  end loop;

  if v_total=0 then v_total:=coalesce(v_exam.question_count,0); end if;
  v_percent:=case when v_total>0 then round(v_score::numeric/v_total::numeric*100)::integer else 0 end;
  v_passed:=v_percent>=v_exam.pass_percent;

  select coalesce(jsonb_agg(jsonb_build_object('topic',t.topic,'percent',t.percent,'correct',t.correct,'total',t.total)
      order by t.percent),'[]'::jsonb)
  into v_topics
  from (
    select tq.topic,
      round(sum(case when ea.is_correct then 1 else 0 end)::numeric/count(*)::numeric*100)::integer percent,
      sum(case when ea.is_correct then 1 else 0 end)::integer correct,
      count(*)::integer total
    from public.academy_exam_answers ea
    join public.trainer_questions tq on (tq.legacy_id::text=ea.question_id or tq.id::text=ea.question_id)
    where ea.attempt_id=v_id
    group by tq.topic
  ) t;

  update public.academy_exam_attempts
  set status='submitted',score=v_score,total=v_total,percent=v_percent,passed=v_passed,
      duration_seconds=greatest(0,coalesce((p_attempt->>'durationSec')::integer,0)),
      auto_submitted=coalesce((p_attempt->>'autoSubmitted')::boolean,false),
      submitted_at=now(),results_published=true
  where id=v_id;

  return (select jsonb_build_object('ok',true,'attemptId',id,'attemptNo',attempt_no,'score',score,'total',total,
    'percent',percent,'passed',passed,'topics',v_topics)
    from public.academy_exam_attempts where id=v_id);
end;
$function$;

grant execute on function public.academy_record_exam_attempt(jsonb) to authenticated;
