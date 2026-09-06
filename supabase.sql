-- SELEÇÃO 2027 | COLÉGIO EVOLUÇÃO
-- Execute no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.exam_dates (
  id uuid primary key default gen_random_uuid(),
  exam_date date not null,
  exam_time time not null default '14:30',
  capacity integer default 80 check (capacity > 0),
  segments text[] not null default '{}',
  series text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  application_type text not null check (application_type in ('exam','visit')),
  segment text not null,
  series text,
  student_name text not null,
  birth_date date not null,
  student_phone text,
  guardian_name text not null,
  guardian_rg text not null,
  guardian_cpf text not null,
  guardian_whatsapp text not null,
  guardian_email text not null,
  current_school text not null,
  exam_date date,
  exam_time time,
  status text not null default 'Inscrição confirmada',
  attendance text check (attendance in ('Presente','Ausente') or attendance is null),
  created_at timestamptz not null default now()
);

alter table public.exam_dates enable row level security;
alter table public.applications enable row level security;

-- Público: pode apenas consultar datas abertas.
create policy "public_read_active_exam_dates"
on public.exam_dates
for select
to anon
using (active = true);

-- Público: pode enviar uma inscrição, mas não ler outras inscrições.
create policy "public_insert_application"
on public.applications
for insert
to anon
with check (true);

-- Usuários autenticados: gestão pode consultar e administrar.
create policy "authenticated_manage_exam_dates"
on public.exam_dates
for all
to authenticated
using (true)
with check (true);

create policy "authenticated_manage_applications"
on public.applications
for all
to authenticated
using (true)
with check (true);

-- Datas iniciais da Seleção 2027.
insert into public.exam_dates (exam_date, exam_time, capacity, segments, series, active)
values
('2026-09-11','14:30',80,
 array['Ensino Fundamental Anos Iniciais','Ensino Fundamental Anos Finais','Ensino Médio'],
 array['1º ano','2º ano','3º ano','4º ano','5º ano','6º ano','7º ano','8º ano','9º ano','1ª série','2ª série','3ª série'], true),
('2026-09-25','14:30',80,
 array['Ensino Fundamental Anos Iniciais','Ensino Fundamental Anos Finais','Ensino Médio'],
 array['1º ano','2º ano','3º ano','4º ano','5º ano','6º ano','7º ano','8º ano','9º ano','1ª série','2ª série','3ª série'], true),
('2026-10-09','14:30',80,
 array['Ensino Fundamental Anos Iniciais','Ensino Fundamental Anos Finais','Ensino Médio'],
 array['1º ano','2º ano','3º ano','4º ano','5º ano','6º ano','7º ano','8º ano','9º ano','1ª série','2ª série','3ª série'], true),
('2026-10-23','14:30',80,
 array['Ensino Fundamental Anos Iniciais','Ensino Fundamental Anos Finais','Ensino Médio'],
 array['1º ano','2º ano','3º ano','4º ano','5º ano','6º ano','7º ano','8º ano','9º ano','1ª série','2ª série','3ª série'], true)
on conflict do nothing;
