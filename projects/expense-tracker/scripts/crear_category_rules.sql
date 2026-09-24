-- Tabla para que Dr. Contable "aprenda" la categoría de cada comercio.
-- Correr una sola vez en Supabase -> SQL Editor.

create table if not exists category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_key text not null,
  categoria text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, merchant_key)
);

alter table category_rules enable row level security;

create policy "category_rules_select_own" on category_rules
  for select using (auth.uid() = user_id);

create policy "category_rules_insert_own" on category_rules
  for insert with check (auth.uid() = user_id);

create policy "category_rules_update_own" on category_rules
  for update using (auth.uid() = user_id);

create policy "category_rules_delete_own" on category_rules
  for delete using (auth.uid() = user_id);
