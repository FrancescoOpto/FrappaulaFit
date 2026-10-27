-- Frappaula Fit — schema Supabase (SPEC §10). Eseguire nell'editor SQL del progetto.
-- Una riga per (utente, chiave); valore JSON; last-write-wins sul campo aggiornato.

create table if not exists public.kv (
  user_id uuid not null references auth.users (id) on delete cascade,
  chiave text not null,
  valore jsonb not null,
  aggiornato timestamptz not null default now(),
  primary key (user_id, chiave)
);

alter table public.kv enable row level security;

create policy "kv: solo il proprietario legge" on public.kv
  for select using (auth.uid() = user_id);

create policy "kv: solo il proprietario scrive" on public.kv
  for insert with check (auth.uid() = user_id);

create policy "kv: solo il proprietario aggiorna" on public.kv
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "kv: solo il proprietario cancella" on public.kv
  for delete using (auth.uid() = user_id);

-- Keep-alive: una vista leggera da interrogare dalla GitHub Action settimanale
-- (i progetti gratuiti vengono messi in pausa dopo ~1 settimana di inattività).
create or replace view public.keepalive as select now() as adesso;
grant select on public.keepalive to anon;
