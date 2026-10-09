-- V3.82 Patch • Auto-submitted attempts also publish official result notifications

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
  v_target uuid:=p_user_id;
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

      if coalesce(v_selected,-1)=q.correct_idx then v_score:=v_score+1; end if;
    end loop;

    if v_total=0 then v_total:=greatest(0,a.question_count); end if;
    v_percent:=case when v_total>0 then round(v_score::numeric/v_total::numeric*100)::integer else 0 end;
    v_passed:=v_percent>=a.pass_percent;
    v_duration:=greatest(0,round(extract(epoch from (v_expiry-a.started_at)))::integer);

    update public.academy_exam_attempts
    set status='submitted',score=v_score,total=v_total,percent=v_percent,passed=v_passed,
        duration_seconds=v_duration,auto_submitted=true,submitted_at=v_expiry,results_published=true
    where id=a.id and status='in_progress';

    if found then
      perform public.academy_notify_exam_result(a.id);
      v_done:=v_done+1;
    end if;
  end loop;

  return v_done;
end;
$function$;

grant execute on function public.academy_finalize_expired_exam_attempts(uuid) to authenticated;
notify pgrst,'reload schema';
