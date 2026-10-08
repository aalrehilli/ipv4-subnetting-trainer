-- IPv4 Academy V3.66
-- Central question bank + server-side grading.

alter table public.trainer_questions add column if not exists legacy_id bigint;
create unique index if not exists trainer_questions_legacy_id_uq on public.trainer_questions(legacy_id) where legacy_id is not null;

update public.trainer_questions tq
set options_json=(
  select jsonb_agg(
    regexp_replace(trim(x.part),'^[A-D][\\)\\.]\\s*','') order by x.ord
  )
  from regexp_split_to_table(tq.question_text,E'\\r?\\n') with ordinality as x(part,ord)
  where trim(x.part) ~ '^[A-D][\\)\\.]\\s*.+'
)
where tq.options_json is null and tq.question_text is not null;

create or replace function public.academy_sync_question_bank(p_questions jsonb)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare
  item jsonb; v_id uuid; v_legacy bigint; v_count integer:=0; v_opts jsonb; v_correct text;
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  for item in select * from jsonb_array_elements(coalesce(p_questions,'[]'::jsonb)) loop
    v_legacy:=nullif(item->>'id','')::bigint;
    v_opts:=coalesce(item->'options',item->'opts','[]'::jsonb);
    v_correct:=chr(65+greatest(0,coalesce((item->>'a')::integer,0)));
    select id into v_id from public.trainer_questions where legacy_id=v_legacy;
    if v_id is null then
      v_id:=gen_random_uuid();
      insert into public.trainer_questions(id,question_text,correct_answer,difficulty,topic,created_by,active,question_type,options_json,legacy_id)
      values(v_id,coalesce(item->>'q',item->>'prompt',''),v_correct,coalesce(item->>'difficulty','easy'),
             coalesce(item->>'topic','Binary'),auth.uid(),coalesce((item->>'active')::boolean,true),'mcq',v_opts,v_legacy);
    else
      update public.trainer_questions set
        question_text=coalesce(item->>'q',item->>'prompt',question_text),
        correct_answer=v_correct,difficulty=coalesce(item->>'difficulty',difficulty),
        topic=coalesce(item->>'topic',topic),active=coalesce((item->>'active')::boolean,active),
        question_type='mcq',options_json=v_opts
      where id=v_id;
    end if;
    v_count:=v_count+1;
  end loop;
  return jsonb_build_object('ok',true,'count',v_count);
end;
$function$;
grant execute on function public.academy_sync_question_bank(jsonb) to authenticated;

create or replace function public.academy_question_bank()
returns setof jsonb language sql stable security definer set search_path=public
as $function$
  select jsonb_build_object(
    'id',coalesce(tq.legacy_id::text,tq.id::text),'sourceId',tq.id::text,
    'q',tq.question_text,'prompt',tq.question_text,'topic',tq.topic,'difficulty',tq.difficulty,
    'options',coalesce(tq.options_json,'[]'::jsonb),'opts',coalesce(tq.options_json,'[]'::jsonb),
    'a',case when tq.correct_answer ~ '^[A-D]$' then ascii(upper(tq.correct_answer))-65 else 0 end,
    'why','','active',coalesce(tq.active,true),'points',1
  )
  from public.trainer_questions tq
  where public.academy_is_trainer()
  order by coalesce(tq.legacy_id,0),tq.created_at,tq.id;
$function$;
grant execute on function public.academy_question_bank() to authenticated;

create or replace function public.academy_exam_question_set(p_exam_id uuid)
returns setof jsonb language sql stable security definer set search_path=public
as $function$
  with ids as (
    select value::text qid,ordinality::integer ord
    from jsonb_array_elements_text((select question_ids from public.academy_exams where id=p_exam_id)) with ordinality
  )
  select jsonb_build_object(
    'id',coalesce(tq.legacy_id::text,tq.id::text),'sourceId',tq.id::text,'q',tq.question_text,
    'prompt',tq.question_text,'topic',tq.topic,'difficulty',tq.difficulty,
    'options',coalesce(tq.options_json,'[]'::jsonb),'opts',coalesce(tq.options_json,'[]'::jsonb),
    'points',1,'position',ids.ord
  )
  from ids
  join public.trainer_questions tq on tq.active=true and (tq.legacy_id::text=ids.qid or tq.id::text=ids.qid)
  where public.academy_is_trainer() or (select published from public.academy_exams where id=p_exam_id)
  order by ids.ord;
$function$;
grant execute on function public.academy_exam_question_set(uuid) to authenticated;

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
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select e.* into v_exam
  from public.academy_exams e join public.academy_exam_attempts a on a.exam_id=e.id
  where a.id=v_id and (a.user_id=auth.uid() or public.academy_is_trainer());
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;

  if (select status from public.academy_exam_attempts where id=v_id)='submitted' then
    return (select jsonb_build_object('ok',true,'attemptId',id,'attemptNo',attempt_no,'score',score,'total',total,'percent',percent,'passed',passed)
            from public.academy_exam_attempts where id=v_id);
  end if;

  delete from public.academy_exam_answers where attempt_id=v_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_attempt->'questionResults','[]'::jsonb)) loop
    v_order:=v_order+1;
    v_idtext:=coalesce(v_item->>'id','');
    select greatest(0,coalesce((v_item->>'selected')::integer,-1)),
           case when tq.correct_answer ~ '^[A-D]$' then ascii(upper(tq.correct_answer))-65 else -1 end
    into v_selected,v_correct
    from public.trainer_questions tq
    where tq.active=true and (tq.legacy_id::text=v_idtext or tq.id::text=v_idtext)
    limit 1;

    v_total:=v_total+1;
    if v_selected>=0 and v_selected=v_correct then v_score:=v_score+1; end if;

    insert into public.academy_exam_answers(attempt_id,question_id,question_order,selected_answer,correct_answer,is_correct,points_awarded)
    values(v_id,v_idtext,v_order,to_jsonb(v_selected),to_jsonb(v_correct),
           v_selected>=0 and v_selected=v_correct,
           case when v_selected>=0 and v_selected=v_correct then 1 else 0 end);
  end loop;

  if v_total=0 then v_total:=coalesce(v_exam.question_count,0); end if;
  v_percent:=case when v_total>0 then round(v_score::numeric/v_total::numeric*100)::integer else 0 end;
  v_passed:=v_percent>=v_exam.pass_percent;

  update public.academy_exam_attempts set
    status='submitted',score=v_score,total=v_total,percent=v_percent,passed=v_passed,
    duration_seconds=greatest(0,coalesce((p_attempt->>'durationSec')::integer,0)),
    auto_submitted=coalesce((p_attempt->>'autoSubmitted')::boolean,false),
    submitted_at=now(),results_published=true
  where id=v_id;

  return (select jsonb_build_object('ok',true,'attemptId',id,'attemptNo',attempt_no,'score',score,'total',total,'percent',percent,'passed',passed)
          from public.academy_exam_attempts where id=v_id);
end;
$function$;
grant execute on function public.academy_record_exam_attempt(jsonb) to authenticated;
