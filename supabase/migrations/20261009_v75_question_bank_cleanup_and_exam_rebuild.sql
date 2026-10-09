-- V3.75 • Clean and approve central question bank
-- Production actions were applied during V3.75.

-- Fix the ten MCQ rows with blank options.
update public.trainer_questions set options_json='["10","8","12","14"]'::jsonb,correct_answer='A',question_type='mcq' where id='d55ae6d9-4598-4394-a7ed-02e694396218';
update public.trainer_questions set options_json='["25","21","23","27"]'::jsonb,correct_answer='A',question_type='mcq' where id='ee2fe27d-fb8b-412f-8543-b393b12bdd9e';
update public.trainer_questions set options_json='["45","41","43","47"]'::jsonb,correct_answer='A',question_type='mcq' where id='f0db8009-dace-457a-a5a6-2d240a88acfe';
update public.trainer_questions set options_json='["202","194","200","204"]'::jsonb,correct_answer='A',question_type='mcq' where id='b41f00ec-9602-431c-a21e-575a3cd41a6c';
update public.trainer_questions set options_json='["00001010","00001001","00001100","00010000"]'::jsonb,correct_answer='A',question_type='mcq' where id='366f0843-362c-4555-a02d-ac44444ee615';
update public.trainer_questions set options_json='["00011001","00010101","00011000","00011010"]'::jsonb,correct_answer='A',question_type='mcq' where id='dd25a177-cdb4-4abb-8c8e-c66439d1d4d0';
update public.trainer_questions set options_json='["3","2","4","5"]'::jsonb,correct_answer='A',question_type='mcq' where id='b81df73e-8317-4c84-a71f-869fc381b11e';
update public.trainer_questions set options_json='["255.255.255.224","255.255.255.192","255.255.255.240","255.255.255.248"]'::jsonb,correct_answer='A',question_type='mcq' where id='ae0a1c3b-0a6a-45b0-9c17-4346eb56b7ed';
update public.trainer_questions set options_json='["192.168.10.64","192.168.10.32","192.168.10.96","192.168.10.128"]'::jsonb,correct_answer='A',question_type='mcq' where id='d35a25b8-d76f-47e7-944d-cfbd816dc4ca';
update public.trainer_questions set options_json='["192.168.10.95","192.168.10.63","192.168.10.79","192.168.10.127"]'::jsonb,correct_answer='A',question_type='mcq' where id='36605d7c-c27a-4cc9-9417-4d3da023d056';

-- Normalize imported questions that already have a valid MCQ shape.
update public.trainer_questions
set question_type='mcq'
where active=true
  and question_type='short'
  and options_json is not null
  and upper(correct_answer) in ('A','B','C','D');

-- Retain the oldest copy of the duplicated Magic Number question.
update public.trainer_questions set active=false
where id in (
  '493972c2-6e44-475a-ad2a-12ba1406183a'::uuid,
  '8093c0dc-1542-4441-aada-3a62e2944bc8'::uuid
);

-- Published exam 1111: replace the deactivated duplicate and keep 20 questions.
update public.academy_exams
set question_ids='[
"99292023-bebc-4be5-81cf-a4479d2c5795",
"bde2cc4e-f955-46dc-b989-ebc879c4df2c",
"0651ce86-8313-4243-806b-1035a4d69131",
"118fdce9-4574-41e4-93c5-c9a063d66f8d",
"34d69baf-9c8c-4966-ad3a-fff1ff42ce80",
"f2cf60b0-e804-4276-82c3-90b02f25b37b",
"2b579c37-eae2-47d4-8933-72056a612236",
"50fc300f-7514-4f24-9f5e-3e021f053289",
"d15007e4-f0b9-4093-a06b-f4d8f42dddf5",
"3c62686c-0cc9-45d8-ba24-9ad435a2fbe1",
"843cbd0d-978c-4809-a88b-90bab55670b1",
"73945c9d-2af0-4654-b059-91b583fd6acd",
"37f28d97-384a-4d39-9bfa-2548ea3b530e",
"f8812301-a613-43ed-a9b6-05cc70bc41f8",
"ec09044d-aed0-4884-9c76-54762566662f",
"33ab843b-db60-425a-a11c-250084f1e8c6",
"7180dff3-7b77-4ae3-8383-f0df5aca2266",
"5459d6d3-0f50-4a3f-9e7d-e8ae67c97085",
"312ed528-c2bb-4dd4-86bc-6cf12adb5c07",
"01c21044-de4f-4e98-a0ca-d410622cb6ed"
]'::jsonb,updated_at=now()
where id='6acd33c9-c37c-4249-9877-880fdb886edc';

-- Published exam Test: replace two deactivated duplicate questions and keep 20 questions.
update public.academy_exams
set question_ids='[
"2b579c37-eae2-47d4-8933-72056a612236",
"f2cf60b0-e804-4276-82c3-90b02f25b37b",
"312ed528-c2bb-4dd4-86bc-6cf12adb5c07",
"d15007e4-f0b9-4093-a06b-f4d8f42dddf5",
"37f28d97-384a-4d39-9bfa-2548ea3b530e",
"0651ce86-8313-4243-806b-1035a4d69131",
"7180dff3-7b77-4ae3-8383-f0df5aca2266",
"118fdce9-4574-41e4-93c5-c9a063d66f8d",
"f8812301-a613-43ed-a9b6-05cc70bc41f8",
"ec09044d-aed0-4884-9c76-54762566662f",
"99292023-bebc-4be5-81cf-a4479d2c5795",
"34d69baf-9c8c-4966-ad3a-fff1ff42ce80",
"50fc300f-7514-4f24-9f5e-3e021f053289",
"33ab843b-db60-425a-a11c-250084f1e8c6",
"5459d6d3-0f50-4a3f-9e7d-e8ae67c97085",
"01c21044-de4f-4e98-a0ca-d410622cb6ed",
"3c62686c-0cc9-45d8-ba24-9ad435a2fbe1",
"843cbd0d-978c-4809-a88b-90bab55670b1",
"73945c9d-2af0-4654-b059-91b583fd6acd",
"d55ae6d9-4598-4394-a7ed-02e694396218"
]'::jsonb,updated_at=now()
where id='4a962558-6ced-4851-a856-9c748ea48e82';
