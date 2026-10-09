-- V3.75 • Audit now counts only active duplicate questions
create or replace function public.academy_question_bank_audit()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.academy_is_trainer() then
    raise exception 'TRAINER_REQUIRED';
  end if;

  with base as (
    select q.*,
      lower(regexp_replace(trim(coalesce(q.question_text,'')), '[[:punct:][:space:]]+', '', 'g')) as norm_text
    from public.trainer_questions q
  ),
  quality as (
    select b.*,
      case
        when b.question_type='mcq' then
          case
            when trim(coalesce(b.question_text,''))='' then 'نص السؤال مفقود'
            when b.options_json is null or jsonb_array_length(b.options_json)<>4 then 'MCQ يحتاج 4 خيارات'
            when exists(select 1 from jsonb_array_elements_text(coalesce(b.options_json,'[]'::jsonb)) x where trim(x)='') then 'يوجد خيار فارغ'
            when (select count(distinct lower(trim(x))) from jsonb_array_elements_text(coalesce(b.options_json,'[]'::jsonb)) x)<>4 then 'الخيارات مكررة'
            when upper(coalesce(b.correct_answer,'')) not in ('A','B','C','D') then 'الإجابة الصحيحة غير صالحة'
            else null
          end
        when b.question_type='short' then
          case
            when trim(coalesce(b.question_text,''))='' then 'نص السؤال مفقود'
            when trim(coalesce(b.correct_answer,''))='' then 'الإجابة النصية مفقودة'
            else null
          end
        else 'نوع السؤال غير مدعوم'
      end as issue
    from base b
  ),
  duplicate_groups as (
    select norm_text,count(*) cnt
    from base
    where active=true and norm_text<>''
    group by norm_text
    having count(*)>1
  ),
  topic_stats as (
    select coalesce(topic,'غير محدد') topic,count(*)::integer total,
      count(*) filter(where active=true)::integer active,
      count(*) filter(where active=true and issue is null)::integer ready
    from quality group by coalesce(topic,'غير محدد')
  ),
  difficulty_stats as (
    select difficulty,count(*)::integer total,
      count(*) filter(where active=true)::integer active,
      count(*) filter(where active=true and issue is null)::integer ready
    from quality group by difficulty
  ),
  issues as (
    select jsonb_agg(jsonb_build_object(
      'id',id::text,'legacyId',legacy_id,'type',question_type,'topic',topic,
      'difficulty',difficulty,'issue',issue,'text',left(question_text,220),
      'active',coalesce(active,true)
    ) order by case when active=true then 1 else 2 end,created_at) rows
    from quality where issue is not null
  )
  select jsonb_build_object(
    'generatedAt',now(),
    'summary',jsonb_build_object(
      'total',count(*)::integer,
      'active',count(*) filter(where active=true)::integer,
      'inactive',count(*) filter(where active=false)::integer,
      'mcqTotal',count(*) filter(where question_type='mcq')::integer,
      'mcqActive',count(*) filter(where question_type='mcq' and active=true)::integer,
      'mcqReady',count(*) filter(where question_type='mcq' and active=true and issue is null)::integer,
      'shortTotal',count(*) filter(where question_type='short')::integer,
      'shortActive',count(*) filter(where question_type='short' and active=true)::integer,
      'shortReady',count(*) filter(where question_type='short' and active=true and issue is null)::integer,
      'needsReview',count(*) filter(where active=true and issue is not null)::integer,
      'duplicateGroups',(select count(*) from duplicate_groups)::integer,
      'duplicateQuestions',(select coalesce(sum(cnt),0) from duplicate_groups)::integer
    ),
    'topics',coalesce((select jsonb_agg(to_jsonb(t) order by t.total desc,t.topic) from topic_stats t),'[]'::jsonb),
    'difficulties',coalesce((select jsonb_agg(to_jsonb(d) order by d.difficulty) from difficulty_stats d),'[]'::jsonb),
    'issues',coalesce((select rows from issues),'[]'::jsonb)
  ) into v_result
  from quality;

  return coalesce(v_result,'{}'::jsonb);
end;
$function$;