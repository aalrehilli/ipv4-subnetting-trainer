create or replace function public.academy_student_smart_review_plan(p_limit integer default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit,10), 20));
  v_plan jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  with base as (
    select ea.question_id,tq.question_text as question,tq.topic,tq.difficulty,tq.options_json as options,
      count(*)::integer as total,sum(case when ea.is_correct then 1 else 0 end)::integer as correct
    from public.academy_exam_answers ea
    join public.academy_exam_attempts a on a.id=ea.attempt_id
    left join public.trainer_questions tq on (tq.legacy_id::text=ea.question_id or tq.id::text=ea.question_id)
    where a.user_id=auth.uid() and a.status='submitted' and a.results_published=true
    group by ea.question_id,tq.question_text,tq.topic,tq.difficulty,tq.options_json
  ),
  ranked as (
    select *,case when total>0 then round(correct::numeric/total::numeric*100)::integer else 0 end as accuracy,
      row_number() over(order by case when total>0 then correct::numeric/total::numeric else 0 end asc,total asc,question_id) as rn
    from base
  ),
  topics as (
    select coalesce(topic,'غير محدد') as topic,sum(total)::integer as total,sum(correct)::integer as correct,
      case when sum(total)>0 then round(sum(correct)::numeric/sum(total)::numeric*100)::integer else 0 end as accuracy
    from base group by coalesce(topic,'غير محدد') order by accuracy asc,total desc
  )
  select jsonb_build_object(
    'topics',coalesce((select jsonb_agg(jsonb_build_object('topic',topic,'accuracy',accuracy,'total',total,'correct',correct) order by accuracy asc,total desc) from topics),'[]'::jsonb),
    'questions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',case when tq.legacy_id is not null then tq.legacy_id::text else tq.id::text end,
        'q',tq.question_text,'topic',coalesce(tq.topic,'غير محدد'),'difficulty',coalesce(tq.difficulty,'easy'),
        'opts',case when jsonb_typeof(tq.options_json)='array' then tq.options_json else '[]'::jsonb end,
        'accuracy',r.accuracy,'uses',r.total,
        'priority',greatest(0,(100-r.accuracy)+case when r.total<3 then 15 else 0 end)
      ) order by greatest(0,(100-r.accuracy)+case when r.total<3 then 15 else 0 end) desc,r.total asc)
      from ranked r join public.trainer_questions tq on (tq.legacy_id::text=r.question_id or tq.id::text=r.question_id)
      where r.rn<=v_limit and tq.active=true
    ),'[]'::jsonb)
  ) into v_plan;
  return coalesce(v_plan,jsonb_build_object('topics','[]'::jsonb,'questions','[]'::jsonb));
end;
$function$;

create or replace function public.academy_student_smart_review_check(p_question_id text,p_selected integer)
returns jsonb
language plpgsql security definer set search_path=public
as $function$
declare v_correct integer:=-1; v_is_correct boolean:=false;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select case when tq.correct_answer~'^[A-D]$' then ascii(upper(tq.correct_answer))-65 else -1 end
  into v_correct from public.trainer_questions tq
  where tq.active=true and (tq.legacy_id::text=trim(p_question_id) or tq.id::text=trim(p_question_id)) limit 1;
  if v_correct<0 then raise exception 'QUESTION_NOT_MCQ'; end if;
  v_is_correct:=coalesce(p_selected,-1)=v_correct;
  return jsonb_build_object('correct',v_is_correct,'correctIndex',v_correct,'correctLetter',chr(65+v_correct));
end;
$function$;

create or replace function public.academy_trainer_learning_signals()
returns jsonb language sql stable security definer set search_path=public
as $function$
with submitted as (
  select a.id,a.user_id,a.exam_id,a.percent,a.passed,a.submitted_at,e.title,
    coalesce(p.full_name,'متدرب') as student_name,coalesce(p.group_no,p.group_name,'') as group_no
  from public.academy_exam_attempts a join public.academy_exams e on e.id=a.exam_id
  left join public.profiles p on p.id=a.user_id
  where a.status='submitted' and public.academy_is_trainer()
),
exam_summary as (
  select count(*)::integer as attempts,count(*) filter(where passed)::integer as passed,
    round(avg(percent))::integer as avg_percent,count(distinct user_id)::integer as students from submitted
),
topic_stats as (
  select coalesce(tq.topic,'غير محدد') as topic,count(*)::integer as responses,
    sum(case when ea.is_correct then 1 else 0 end)::integer as correct,
    case when count(*)>0 then round(sum(case when ea.is_correct then 1 else 0 end)::numeric/count(*)::numeric*100)::integer else 0 end as accuracy
  from public.academy_exam_answers ea join public.academy_exam_attempts a on a.id=ea.attempt_id
  left join public.trainer_questions tq on (tq.legacy_id::text=ea.question_id or tq.id::text=ea.question_id)
  where a.status='submitted' and public.academy_is_trainer() group by coalesce(tq.topic,'غير محدد')
),
student_stats as (
  select s.user_id,s.student_name,s.group_no,count(*)::integer as attempts,round(avg(s.percent))::integer as avg_percent,
    max(s.submitted_at) as last_activity,count(*) filter(where not s.passed)::integer as failed_attempts
  from submitted s group by s.user_id,s.student_name,s.group_no
)
select jsonb_build_object(
  'summary',(select to_jsonb(exam_summary) from exam_summary),
  'topics',coalesce((select jsonb_agg(to_jsonb(topic_stats) order by accuracy asc,responses desc) from topic_stats),'[]'::jsonb),
  'students',coalesce((select jsonb_agg(to_jsonb(student_stats) order by avg_percent asc,last_activity asc) from student_stats),'[]'::jsonb)
);
$function$;

grant execute on function public.academy_student_smart_review_plan(integer) to authenticated;
grant execute on function public.academy_student_smart_review_check(text,integer) to authenticated;
grant execute on function public.academy_trainer_learning_signals() to authenticated;
notify pgrst,'reload schema';