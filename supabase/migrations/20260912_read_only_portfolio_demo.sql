-- DeviceHub portfolio demo: Supabase remains the read-only source dataset.
-- This migration changes only RLS configuration, policies and table privileges.
-- It does not alter, insert, update or delete rows and does not change the table schema.

begin;

alter table public.prodotti enable row level security;

-- Replace only the policy owned by this migration. Existing policies are preserved
-- so that rollback does not need to reconstruct unknown expressions or role lists.
drop policy if exists devicehub_public_read_only on public.prodotti;

create policy devicehub_public_read_only
on public.prodotti
as permissive
for select
to anon, authenticated
using (true);

-- RLS policies never grant table privileges by themselves. Remove every direct
-- table privilege from public browser roles, then grant back SELECT only.
-- Revoking from PUBLIC also prevents an accidental grant inherited by all roles.
revoke all privileges on table public.prodotti from public, anon, authenticated;
grant select on table public.prodotti to anon, authenticated;

-- Fail the transaction instead of leaving a partially secured table if either
-- role still inherits a write privilege through an unexpected role membership.
do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated']
  loop
    if not has_table_privilege(role_name, 'public.prodotti', 'select') then
      raise exception '% must retain SELECT on public.prodotti', role_name;
    end if;

    if has_table_privilege(role_name, 'public.prodotti', 'insert')
      or has_table_privilege(role_name, 'public.prodotti', 'update')
      or has_table_privilege(role_name, 'public.prodotti', 'delete') then
      raise exception '% still has a write privilege on public.prodotti', role_name;
    end if;
  end loop;
end
$$;

commit;
