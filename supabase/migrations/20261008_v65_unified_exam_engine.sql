-- IPv4 Academy V3.65
-- Unified central exam definitions, attempts, answers and RPC engine.

create table if not exists public.academy_exams (
  id uuid primary key default gen_random_uuid(),
  course_id text null,
  unit_id integer null,
  lesson_id integer null,
  title text not null,
  description text null,
  duration_minutes integer not null default 10,
  pass_percent integer not null default 60,
  attempts_limit integer not null default 1,
  selection_mode text not null default 'manual',
  question_count integer not null default 10,
  difficulty_mode text not null default 'all',
  topic_targets jsonb not null default '{}'::jsonb,
  question_ids jsonb not null default '[]'::jsonb,
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  visible_groups text[] not null default '{}'::text[],
  published boolean not null default false,
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.academy_exams(id) on delete cascade,
  user_id uuid not null,
  attempt_no integer not null,
  status text not null default 'in_progress',
  score integer not null default 0,
  total integer not null default 0,
  percent integer not null default 0,
  passed boolean not null default false,
  duration_seconds integer not null default 0,
  auto_submitted boolean not null default false,
  started_at timestamptz not null default now(),
  submitted_at timestamptz null,
  results_published boolean not null default true,
  unique(exam_id,user_id,attempt_no)
);

create table if not exists public.academy_exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.academy_exam_attempts(id) on delete cascade,
  question_id text not null,
  question_order integer not null,
  selected_answer jsonb null,
  correct_answer jsonb null,
  is_correct boolean not null default false,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique(attempt_id,question_id)
);

create index if not exists academy_exams_course_idx on public.academy_exams(course_id);
create index if not exists academy_exams_published_idx on public.academy_exams(published);
create index if not exists academy_exam_attempts_user_idx on public.academy_exam_attempts(user_id,submitted_at desc);
create index if not exists academy_exam_attempts_exam_idx on public.academy_exam_attempts(exam_id);
create index if not exists academy_exam_answers_attempt_idx on public.academy_exam_answers(attempt_id);

alter table public.academy_exams enable row level security;
alter table public.academy_exam_attempts enable row level security;
alter table public.academy_exam_answers enable row level security;

drop policy if exists "academy exams trainer all" on public.academy_exams;
create policy "academy exams trainer all" on public.academy_exams
for all to authenticated
using (public.academy_is_trainer() and created_by=auth.uid())
with check (public.academy_is_trainer() and created_by=auth.uid());

drop policy if exists "academy exams students read published" on public.academy_exams;
create policy "academy exams students read published" on public.academy_exams
for select to authenticated
using (
  published=true
  and (
    course_id is null
    or exists (
      select 1 from public.academy_courses c
      where c.id=academy_exams.course_id
        and c.status='published'
        and (
          c.visibility='all'
          or (c.visibility='groups' and public.academy_student_group()<>'' and public.academy_student_group()=any(c.visible_groups))
        )
    )
  )
);

drop policy if exists "academy attempts own" on public.academy_exam_attempts;
create policy "academy attempts own" on public.academy_exam_attempts
for all to authenticated
using (user_id=auth.uid() or public.academy_is_trainer())
with check (user_id=auth.uid() or public.academy_is_trainer());

drop policy if exists "academy answers own" on public.academy_exam_answers;
create policy "academy answers own" on public.academy_exam_answers
for all to authenticated
using (
  exists(select 1 from public.academy_exam_attempts a where a.id=attempt_id and (a.user_id=auth.uid() or public.academy_is_trainer()))
)
with check (
  exists(select 1 from public.academy_exam_attempts a where a.id=attempt_id and (a.user_id=auth.uid() or public.academy_is_trainer()))
);

create or replace function public.academy_course_exams(p_course_id text)
returns setof jsonb language sql stable security definer set search_path=public
as $function$
  select jsonb_build_object(
    'id',e.id,'courseId',e.course_id,'unitId',e.unit_id,'lessonId',e.lesson_id,
    'title',e.title,'description',e.description,'durationMinutes',e.duration_minutes,
    'passPercent',e.pass_percent,'attemptsLimit',e.attempts_limit,'selectionMode',e.selection_mode,
    'questionCount',e.question_count,'difficultyMode',e.difficulty_mode,
    'topicTargets',e.topic_targets,'questionIds',e.question_ids,
    'shuffleQuestions',e.shuffle_questions,'shuffleOptions',e.shuffle_options,
    'visibleGroups',e.visible_groups,'published',e.published,
    'startsAt',e.starts_at,'endsAt',e.ends_at,'updatedAt',e.updated_at
  )
  from public.academy_exams e
  where e.course_id=trim(p_course_id)
    and (
      public.academy_is_trainer()
      or (
        e.published=true
        and (cardinality(e.visible_groups)=0 or public.academy_student_group()=any(e.visible_groups))
        and (e.starts_at is null or e.starts_at<=now())
        and (e.ends_at is null or e.ends_at>=now())
      )
    )
  order by e.updated_at desc;
$function$;
grant execute on function public.academy_course_exams(text) to authenticated;

create or replace function public.academy_save_course_exam(p_exam jsonb)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare v_id uuid; v_course text:=trim(coalesce(p_exam->>'courseId',''));
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  if v_course='' then raise exception 'COURSE_REQUIRED'; end if;
  if nullif(p_exam->>'id','') is not null then
    begin v_id:=(p_exam->>'id')::uuid; exception when others then v_id:=null; end;
  end if;
  if v_id is null then
    insert into public.academy_exams(
      course_id,unit_id,lesson_id,title,description,duration_minutes,pass_percent,attempts_limit,
      selection_mode,question_count,difficulty_mode,topic_targets,question_ids,
      shuffle_questions,shuffle_options,visible_groups,published,created_by
    ) values (
      v_course,nullif(p_exam->>'unitId','')::integer,nullif(p_exam->>'lessonId','')::integer,
      coalesce(nullif(trim(p_exam->>'title'),''),'اختبار المقرر'),p_exam->>'description',
      greatest(1,coalesce((p_exam->>'durationMinutes')::integer,10)),
      greatest(0,least(100,coalesce((p_exam->>'passPercent')::integer,60))),
      greatest(0,coalesce((p_exam->>'attemptsLimit')::integer,1)),
      coalesce(nullif(p_exam->>'selectionMode',''),'manual'),
      greatest(1,coalesce((p_exam->>'questionCount')::integer,10)),
      coalesce(nullif(p_exam->>'difficultyMode',''),'all'),
      coalesce(p_exam->'topicTargets','{}'::jsonb),coalesce(p_exam->'questionIds','[]'::jsonb),
      coalesce((p_exam->>'shuffleQuestions')::boolean,true),coalesce((p_exam->>'shuffleOptions')::boolean,true),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_exam->'visibleGroups','[]'::jsonb))),'{}'::text[]),
      coalesce((p_exam->>'published')::boolean,false),auth.uid()
    ) returning id into v_id;
  else
    update public.academy_exams set
      title=coalesce(nullif(trim(p_exam->>'title'),''),title),
      description=coalesce(p_exam->>'description',description),
      duration_minutes=greatest(1,coalesce((p_exam->>'durationMinutes')::integer,duration_minutes)),
      pass_percent=greatest(0,least(100,coalesce((p_exam->>'passPercent')::integer,pass_percent))),
      attempts_limit=greatest(0,coalesce((p_exam->>'attemptsLimit')::integer,attempts_limit)),
      selection_mode=coalesce(nullif(p_exam->>'selectionMode',''),selection_mode),
      question_count=greatest(1,coalesce((p_exam->>'questionCount')::integer,question_count)),
      difficulty_mode=coalesce(nullif(p_exam->>'difficultyMode',''),difficulty_mode),
      topic_targets=coalesce(p_exam->'topicTargets',topic_targets),question_ids=coalesce(p_exam->'questionIds',question_ids),
      shuffle_questions=coalesce((p_exam->>'shuffleQuestions')::boolean,shuffle_questions),
      shuffle_options=coalesce((p_exam->>'shuffleOptions')::boolean,shuffle_options),
      visible_groups=coalesce(array(select jsonb_array_elements_text(coalesce(p_exam->'visibleGroups','[]'::jsonb))),visible_groups),
      published=coalesce((p_exam->>'published')::boolean,published),updated_at=now()
    where id=v_id;
    if not found then raise exception 'EXAM_NOT_FOUND'; end if;
  end if;
  return (select x from public.academy_course_exams(v_course) x where (x->>'id')=v_id::text limit 1);
end;
$function$;
grant execute on function public.academy_save_course_exam(jsonb) to authenticated;

create or replace function public.academy_delete_course_exam(p_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $function$
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  delete from public.academy_exams where id=p_id;
  return jsonb_build_object('ok',true,'id',p_id);
end;
$function$;
grant execute on function public.academy_delete_course_exam(uuid) to authenticated;

create or replace function public.academy_course_exam_attempts(p_course_id text,p_exam_id uuid default null)
returns setof jsonb language sql stable security definer set search_path=public
as $function$
  select jsonb_build_object(
    'id',a.id,'examId',a.exam_id,'courseId',e.course_id,'studentId',a.user_id,'attemptNo',a.attempt_no,
    'status',a.status,'score',a.score,'total',a.total,'percent',a.percent,'passed',a.passed,
    'durationSec',a.duration_seconds,'autoSubmitted',a.auto_submitted,'startedAt',a.started_at,
    'submittedAt',a.submitted_at,'resultsPublished',a.results_published
  )
  from public.academy_exam_attempts a join public.academy_exams e on e.id=a.exam_id
  where e.course_id=trim(p_course_id) and (p_exam_id is null or a.exam_id=p_exam_id)
    and (a.user_id=auth.uid() or public.academy_is_trainer())
  order by coalesce(a.submitted_at,a.started_at) desc;
$function$;
grant execute on function public.academy_course_exam_attempts(text,uuid) to authenticated;

create or replace function public.academy_start_exam(p_exam_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare e public.academy_exams; v_attempt_no integer; v_attempt uuid; v_group text:=public.academy_student_group();
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into e from public.academy_exams where id=p_exam_id;
  if not found then raise exception 'EXAM_NOT_FOUND'; end if;
  if not public.academy_is_trainer() then
    if not e.published then raise exception 'EXAM_NOT_PUBLISHED'; end if;
    if e.starts_at is not null and e.starts_at>now() then raise exception 'EXAM_NOT_STARTED'; end if;
    if e.ends_at is not null and e.ends_at<now() then raise exception 'EXAM_CLOSED'; end if;
    if cardinality(e.visible_groups)>0 and not (v_group=any(e.visible_groups)) then raise exception 'EXAM_NOT_FOR_GROUP'; end if;
  end if;
  select count(*)::integer+1 into v_attempt_no from public.academy_exam_attempts a where a.exam_id=e.id and a.user_id=auth.uid();
  if e.attempts_limit>0 and v_attempt_no>e.attempts_limit then raise exception 'ATTEMPTS_LIMIT'; end if;
  insert into public.academy_exam_attempts(exam_id,user_id,attempt_no,status) values(e.id,auth.uid(),v_attempt_no,'in_progress') returning id into v_attempt;
  return jsonb_build_object('ok',true,'attemptId',v_attempt,'attemptNo',v_attempt_no,'examId',e.id,'durationMinutes',e.duration_minutes,'attemptsLimit',e.attempts_limit);
end;
$function$;
grant execute on function public.academy_start_exam(uuid) to authenticated;

create or replace function public.academy_start_exam_by_title(p_title text,p_course_id text default null)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare v_id uuid;
begin
  select id into v_id from public.academy_exams
  where title=trim(p_title) and (p_course_id is null or course_id=trim(p_course_id)) and published=true
  order by updated_at desc limit 1;
  if v_id is null then raise exception 'EXAM_NOT_FOUND'; end if;
  return public.academy_start_exam(v_id);
end;
$function$;
grant execute on function public.academy_start_exam_by_title(text,text) to authenticated;

create or replace function public.academy_record_exam_attempt(p_attempt jsonb)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare v_id uuid:=(p_attempt->>'attemptId')::uuid; v_item jsonb; v_index integer:=0;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.academy_exam_attempts where id=v_id and (user_id=auth.uid() or public.academy_is_trainer())) then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  update public.academy_exam_attempts
  set status='submitted',score=greatest(0,coalesce((p_attempt->>'score')::integer,0)),
      total=greatest(0,coalesce((p_attempt->>'total')::integer,0)),
      percent=greatest(0,least(100,coalesce((p_attempt->>'percent')::integer,0))),
      passed=coalesce((p_attempt->>'passed')::boolean,false),
      duration_seconds=greatest(0,coalesce((p_attempt->>'durationSec')::integer,0)),
      auto_submitted=coalesce((p_attempt->>'autoSubmitted')::boolean,false),
      submitted_at=now(),results_published=coalesce((p_attempt->>'resultsPublished')::boolean,true)
  where id=v_id;
  delete from public.academy_exam_answers where attempt_id=v_id;
  for v_item in select * from jsonb_array_elements(coalesce(p_attempt->'questionResults','[]'::jsonb))
  loop
    v_index:=v_index+1;
    insert into public.academy_exam_answers(attempt_id,question_id,question_order,selected_answer,correct_answer,is_correct,points_awarded)
    values(v_id,coalesce(v_item->>'id',v_index::text),v_index,v_item->'selected',v_item->'correctAnswer',
      coalesce((v_item->>'correct')::boolean,false),case when coalesce((v_item->>'correct')::boolean,false) then 1 else 0 end);
  end loop;
  return (select jsonb_build_object('ok',true,'attemptId',id,'attemptNo',attempt_no,'score',score,'total',total,'percent',percent,'passed',passed)
          from public.academy_exam_attempts where id=v_id);
end;
$function$;
grant execute on function public.academy_record_exam_attempt(jsonb) to authenticated;

create or replace function public.academy_trainer_exam_sync(p_exam jsonb)
returns jsonb language plpgsql security definer set search_path=public
as $function$
declare v_id uuid;
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  if nullif(p_exam->>'id','') is not null then
    begin v_id:=(p_exam->>'id')::uuid; exception when others then v_id:=null; end;
  end if;
  if v_id is null then
    select id into v_id from public.academy_exams where course_id is null and title=trim(p_exam->>'title') order by updated_at desc limit 1;
  end if;
  if v_id is null then
    insert into public.academy_exams(
      title,duration_minutes,pass_percent,attempts_limit,selection_mode,question_count,difficulty_mode,topic_targets,
      question_ids,shuffle_questions,shuffle_options,published,created_by
    ) values(
      coalesce(nullif(trim(p_exam->>'title'),''),'اختبار'),greatest(1,coalesce((p_exam->>'durationMin')::integer,5)),
      greatest(0,least(100,coalesce((p_exam->>'passPercent')::integer,60))),greatest(0,coalesce((p_exam->>'attemptsLimit')::integer,1)),
      coalesce(p_exam->>'selectionMode','manual'),greatest(1,coalesce((p_exam->>'questionCount')::integer,10)),
      coalesce(p_exam->>'difficultyMode','all'),coalesce(p_exam->'topicTargets','{}'::jsonb),
      coalesce(p_exam->'questionIds','[]'::jsonb),coalesce((p_exam->>'shuffleQuestions')::boolean,true),
      coalesce((p_exam->>'shuffleOptions')::boolean,true),coalesce((p_exam->>'published')::boolean,false),auth.uid()
    ) returning id into v_id;
  else
    update public.academy_exams set
      duration_minutes=greatest(1,coalesce((p_exam->>'durationMin')::integer,duration_minutes)),
      pass_percent=greatest(0,least(100,coalesce((p_exam->>'passPercent')::integer,pass_percent))),
      attempts_limit=greatest(0,coalesce((p_exam->>'attemptsLimit')::integer,attempts_limit)),
      selection_mode=coalesce(p_exam->>'selectionMode',selection_mode),
      question_count=greatest(1,coalesce((p_exam->>'questionCount')::integer,question_count)),
      difficulty_mode=coalesce(p_exam->>'difficultyMode',difficulty_mode),
      topic_targets=coalesce(p_exam->'topicTargets',topic_targets),
      question_ids=coalesce(p_exam->'questionIds',question_ids),
      shuffle_questions=coalesce((p_exam->>'shuffleQuestions')::boolean,shuffle_questions),
      published=coalesce((p_exam->>'published')::boolean,published),updated_at=now()
    where id=v_id;
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
end;
$function$;
grant execute on function public.academy_trainer_exam_sync(jsonb) to authenticated;

create or replace function public.academy_my_exam_attempts(p_course_id text default null)
returns setof jsonb language sql stable security definer set search_path=public
as $function$
  select jsonb_build_object(
    'id',a.id,'examId',a.exam_id,'title',e.title,'courseId',e.course_id,'attemptNo',a.attempt_no,
    'status',a.status,'score',a.score,'total',a.total,'percent',a.percent,'passed',a.passed,
    'startedAt',a.started_at,'submittedAt',a.submitted_at
  )
  from public.academy_exam_attempts a join public.academy_exams e on e.id=a.exam_id
  where a.user_id=auth.uid() and (p_course_id is null or e.course_id=trim(p_course_id))
  order by coalesce(a.submitted_at,a.started_at) desc;
$function$;
grant execute on function public.academy_my_exam_attempts(text) to authenticated;

insert into public.academy_exams(
  id,course_id,unit_id,lesson_id,title,description,duration_minutes,pass_percent,attempts_limit,
  selection_mode,question_count,difficulty_mode,question_ids,shuffle_questions,shuffle_options,published,created_by,created_at,updated_at
)
select
  te.id,null,null,null,te.title,te.description,te.duration_minutes,60,coalesce(te.max_attempts,1),'manual',te.question_count,
  coalesce(te.difficulty,'all'),
  coalesce((select jsonb_agg(teq.question_id::text order by teq.question_order)
            from public.trainer_exam_questions teq where teq.exam_id=te.id),'[]'::jsonb),
  true,true,te.is_active,te.created_by,te.created_at,te.created_at
from public.trainer_exams te
where not exists(select 1 from public.academy_exams ae where ae.id=te.id);

create index if not exists academy_exams_title_course_idx on public.academy_exams(title,course_id);
