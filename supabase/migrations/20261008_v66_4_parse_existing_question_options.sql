-- IPv4 Academy V3.66.4
-- Parse existing trainer question choices stored inline in question_text.

update public.trainer_questions tq
set options_json=(
  select jsonb_agg(substring(trim(x.part) from 3) order by x.ord)
  from regexp_split_to_table(tq.question_text,E'\r?\n') with ordinality as x(part,ord)
  where left(trim(x.part),2) in ('A)','B)','C)','D)')
)
where tq.options_json is null and tq.question_text is not null;
