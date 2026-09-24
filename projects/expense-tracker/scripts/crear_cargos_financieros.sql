-- Tabla para intereses, comisiones y percepciones del resumen (separada de
-- los consumos). Correr una sola vez en Supabase -> SQL Editor.

create table if not exists cargos_financieros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  concepto text not null,
  categoria text not null,
  monto numeric not null,
  banco text not null,
  import_id uuid,
  filename text,
  created_at timestamptz not null default now()
);

alter table cargos_financieros enable row level security;

create policy "cargos_select_own" on cargos_financieros
  for select using (auth.uid() = user_id);

create policy "cargos_insert_own" on cargos_financieros
  for insert with check (auth.uid() = user_id);

create policy "cargos_update_own" on cargos_financieros
  for update using (auth.uid() = user_id);

create policy "cargos_delete_own" on cargos_financieros
  for delete using (auth.uid() = user_id);
