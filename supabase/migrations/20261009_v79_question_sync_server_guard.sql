-- V3.79 • Server-side question bank sync guard
-- Applied to production Supabase during V3.79.
-- Invalid MCQ payloads are skipped instead of overwriting central questions.

create or replace function public.academy_sync_question_bank(p_questions jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  item jsonb;
  v_id uuid;
  v_legacy bigint;
  v_count integer:=0;
  v_skipped integer:=0;
  v_opts jsonb;
  v_correct text;
  v_a integer;
  v_text text;
  v_active boolean;
  v_valid boolean;
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;

  for item in select * from jsonb_array_elements(coalesce(p_questions,'[]'::jsonb)) loop
    begin
      v_legacy:=nullif(item->>'id','')::bigint;
    exception when others then
      v_legacy:=null;
    end;

    v_opts:=coalesce(item->'options',item->'opts','[]'::jsonb);
    v_a:=coalesce((item->>'a')::integer,-1);
    v_text:=trim(coalesce(item->>'q',item->>'prompt',''));
    v_active:=coalesce((item->>'active')::boolean,true);

    v_valid := v_legacy is not null
      and v_text<>''
      and jsonb_typeof(v_opts)='array'
      and jsonb_array_length(v_opts)=4
      and not exists(select 1 from jsonb_array_elements_text(v_opts) x where trim(x)='')
      and (select count(distinct lower(trim(x))) from jsonb_array_elements_text(v_opts) x)=4
      and v_a between 0 and 3;

    if not v_valid then
      v_skipped:=v_skipped+1;
      continue;
    end if;

    v_correct:=chr(65+v_a);
    select id into v_id from public.trainer_questions where legacy_id=v_legacy;

    if v_id is null then
      v_id:=gen_random_uuid();
      insert into public.trainer_questions(
        id,question_text,correct_answer,difficulty,topic,created_by,active,question_type,options_json,legacy_id
      ) values(
        v_id,v_text,v_correct,coalesce(item->>'difficulty','easy'),
        coalesce(item->>'topic','Binary'),auth.uid(),v_active,'mcq',v_opts,v_legacy
      );
    else
      update public.trainer_questions set
        question_text=v_text,
        correct_answer=v_correct,
        difficulty=coalesce(item->>'difficulty',difficulty),
        topic=coalesce(item->>'topic',topic),
        active=v_active,
        question_type='mcq',
        options_json=v_opts
      where id=v_id;
    end if;

    v_count:=v_count+1;
  end loop;

  return jsonb_build_object('ok',true,'count',v_count,'skipped',v_skipped);
end;
$function$;

grant execute on function public.academy_sync_question_bank(jsonb) to authenticated;
notify pgrst,'reload schema';
