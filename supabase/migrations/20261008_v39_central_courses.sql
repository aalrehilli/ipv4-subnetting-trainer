-- V3.39 — Central course / unit / lesson management
-- Run after the existing Supabase migrations.

create table if not exists public.academy_courses (
  id text primary key,
  title text not null,
  code text not null unique,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  visibility text not null default 'all' check (visibility in ('all','groups','hidden')),
  visible_groups text[] not null default array[]::text[],
  students integer not null default 0 check (students >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_course_units (
  id text primary key,
  course_id text not null references public.academy_courses(id) on delete cascade,
  local_id integer not null,
  position integer not null default 0,
  title text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  unique(course_id, local_id)
);

create table if not exists public.academy_course_lessons (
  id text primary key,
  course_id text not null references public.academy_courses(id) on delete cascade,
  unit_id text not null references public.academy_course_units(id) on delete cascade,
  local_id integer not null,
  position integer not null default 0,
  title text not null,
  duration integer not null default 20 check (duration > 0),
  type text not null default 'lesson',
  status text not null default 'draft' check (status in ('draft','published')),
  description text not null default '',
  objectives text not null default '',
  content text not null default '',
  media_type text not null default 'none',
  resource text not null default '',
  attachments text not null default '',
  questions text not null default '',
  lab text not null default '',
  unique(unit_id, local_id)
);

create index if not exists academy_courses_status_visibility_idx
  on public.academy_courses(status, visibility);

create index if not exists academy_course_units_course_idx
  on public.academy_course_units(course_id, position);

create index if not exists academy_course_lessons_unit_idx
  on public.academy_course_lessons(unit_id, position);

alter table public.academy_courses enable row level security;
alter table public.academy_course_units enable row level security;
alter table public.academy_course_lessons enable row level security;

create or replace function public.academy_is_trainer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.role,'student') in ('trainer','admin','manager')
      and coalesce(p.is_active,true) = true
  );
$$;

create or replace function public.academy_student_group()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select nullif(trim(p.group_no::text),'') from public.profiles p where p.id=auth.uid()),
    ''
  );
$$;

drop policy if exists "academy courses trainer all" on public.academy_courses;
create policy "academy courses trainer all"
on public.academy_courses
for all to authenticated
using (public.academy_is_trainer())
with check (public.academy_is_trainer());

drop policy if exists "academy courses visible students" on public.academy_courses;
create policy "academy courses visible students"
on public.academy_courses
for select to authenticated
using (
  status = 'published'
  and (
    visibility = 'all'
    or (
      visibility = 'groups'
      and public.academy_student_group() <> ''
      and public.academy_student_group() = any(visible_groups)
    )
  )
);

drop policy if exists "academy units trainer all" on public.academy_course_units;
create policy "academy units trainer all"
on public.academy_course_units
for all to authenticated
using (public.academy_is_trainer())
with check (public.academy_is_trainer());

drop policy if exists "academy units visible students" on public.academy_course_units;
create policy "academy units visible students"
on public.academy_course_units
for select to authenticated
using (
  exists (
    select 1
    from public.academy_courses c
    where c.id = academy_course_units.course_id
      and c.status = 'published'
      and (
        c.visibility = 'all'
        or (
          c.visibility = 'groups'
          and public.academy_student_group() <> ''
          and public.academy_student_group() = any(c.visible_groups)
        )
      )
  )
);

drop policy if exists "academy lessons trainer all" on public.academy_course_lessons;
create policy "academy lessons trainer all"
on public.academy_course_lessons
for all to authenticated
using (public.academy_is_trainer())
with check (public.academy_is_trainer());

drop policy if exists "academy lessons visible students" on public.academy_course_lessons;
create policy "academy lessons visible students"
on public.academy_course_lessons
for select to authenticated
using (
  exists (
    select 1
    from public.academy_courses c
    where c.id = academy_course_lessons.course_id
      and c.status = 'published'
      and (
        c.visibility = 'all'
        or (
          c.visibility = 'groups'
          and public.academy_student_group() <> ''
          and public.academy_student_group() = any(c.visible_groups)
        )
      )
  )
  and exists (
    select 1
    from public.academy_course_units u
    where u.id = academy_course_lessons.unit_id
      and u.status = 'published'
  )
);

create or replace function public.academy_course_bundle_save(p_course jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c jsonb := coalesce(p_course,'{}'::jsonb);
  v_id text := trim(c->>'id');
  u jsonb;
  l jsonb;
  v_unit_id text;
begin
  if not public.academy_is_trainer() then
    raise exception 'TRAINER_REQUIRED';
  end if;

  if v_id is null or v_id = '' then
    raise exception 'COURSE_ID_REQUIRED';
  end if;
  if nullif(trim(c->>'title'),'') is null then
    raise exception 'COURSE_TITLE_REQUIRED';
  end if;
  if nullif(trim(c->>'code'),'') is null then
    raise exception 'COURSE_CODE_REQUIRED';
  end if;

  insert into public.academy_courses(
    id,title,code,description,status,visibility,visible_groups,students,created_by,updated_at
  )
  values(
    v_id,
    trim(c->>'title'),
    trim(c->>'code'),
    coalesce(c->>'description',''),
    case when c->>'status' in ('published','archived','draft') then c->>'status' else 'draft' end,
    case when c->>'visibility' in ('all','groups','hidden') then c->>'visibility' else 'all' end,
    coalesce(array(select jsonb_array_elements_text(coalesce(c->'visibleGroups','[]'::jsonb))),array[]::text[]),
    greatest(coalesce((c->>'students')::integer,0),0),
    auth.uid(),
    now()
  )
  on conflict(id) do update set
    title=excluded.title,
    code=excluded.code,
    description=excluded.description,
    status=excluded.status,
    visibility=excluded.visibility,
    visible_groups=excluded.visible_groups,
    students=excluded.students,
    updated_at=now();

  delete from public.academy_course_lessons where course_id=v_id;
  delete from public.academy_course_units where course_id=v_id;

  for u in select value from jsonb_array_elements(coalesce(c->'units','[]'::jsonb))
  loop
    v_unit_id := v_id||':'||(u->>'id');
    insert into public.academy_course_units(id,course_id,local_id,position,title,status)
    values(
      v_unit_id,
      v_id,
      greatest(coalesce((u->>'id')::integer,0),0),
      greatest(coalesce((u->>'position')::integer,0),0),
      coalesce(u->>'title','الوحدة'),
      case when u->>'status'='published' then 'published' else 'draft' end
    );

    for l in select value from jsonb_array_elements(coalesce(u->'lessons','[]'::jsonb))
    loop
      insert into public.academy_course_lessons(
        id,course_id,unit_id,local_id,position,title,duration,type,status,
        description,objectives,content,media_type,resource,attachments,questions,lab
      )
      values(
        v_unit_id||':'||(l->>'id'),
        v_id,
        v_unit_id,
        greatest(coalesce((l->>'id')::integer,0),0),
        greatest(coalesce((l->>'position')::integer,0),0),
        coalesce(l->>'title','الدرس'),
        greatest(coalesce((l->>'duration')::integer,20),1),
        coalesce(l->>'type','lesson'),
        case when l->>'status'='published' then 'published' else 'draft' end,
        coalesce(l->>'description',''),
        coalesce(l->>'objectives',''),
        coalesce(l->>'content',''),
        coalesce(l->>'mediaType','none'),
        coalesce(l->>'resource',''),
        coalesce(l->>'attachments',''),
        coalesce(l->>'questions',''),
        coalesce(l->>'lab','')
      );
    end loop;
  end loop;

  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

create or replace function public.academy_course_bundle_delete(p_course_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.academy_is_trainer() then raise exception 'TRAINER_REQUIRED'; end if;
  delete from public.academy_courses where id=trim(p_course_id);
  return jsonb_build_object('ok',true,'id',trim(p_course_id));
end;
$$;

create or replace function public.academy_course_bundles()
returns setof jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  select jsonb_build_object(
    'id',c.id,
    'title',c.title,
    'code',c.code,
    'description',c.description,
    'status',c.status,
    'visibility',c.visibility,
    'visibleGroups',to_jsonb(c.visible_groups),
    'students',c.students,
    'units',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',u.local_id,
          'title',u.title,
          'status',u.status,
          'position',u.position,
          'lessons',coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id',l.local_id,
                'title',l.title,
                'duration',l.duration,
                'type',l.type,
                'status',l.status,
                'description',l.description,
                'objectives',l.objectives,
                'content',l.content,
                'mediaType',l.media_type,
                'resource',l.resource,
                'attachments',l.attachments,
                'questions',l.questions,
                'lab',l.lab,
                'position',l.position
              ) order by l.position,l.local_id
            )
            from public.academy_course_lessons l
            where l.unit_id=u.id
          ),'[]'::jsonb)
        ) order by u.position,u.local_id
      )
      from public.academy_course_units u
      where u.course_id=c.id
    ),'[]'::jsonb)
  )
  from public.academy_courses c
  where public.academy_is_trainer()
     or (
       c.status='published'
       and (
         c.visibility='all'
         or (
           c.visibility='groups'
           and public.academy_student_group() <> ''
           and public.academy_student_group() = any(c.visible_groups)
         )
       )
     )
  order by c.title;
end;
$$;

revoke all on function public.academy_course_bundle_save(jsonb) from public;
revoke all on function public.academy_course_bundle_delete(text) from public;
revoke all on function public.academy_course_bundles() from public;

grant execute on function public.academy_course_bundle_save(jsonb) to authenticated;
grant execute on function public.academy_course_bundle_delete(text) to authenticated;
grant execute on function public.academy_course_bundles() to authenticated;

create or replace function public.academy_courses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists academy_courses_updated_at on public.academy_courses;
create trigger academy_courses_updated_at
before update on public.academy_courses
for each row execute function public.academy_courses_updated_at();
