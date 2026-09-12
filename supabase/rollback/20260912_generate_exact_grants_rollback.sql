-- Run this query BEFORE the read-only migration.
-- Save every row of the rollback_sql column, in line_no order, as a separate
-- rollback script. The generated script restores the table privileges that
-- PUBLIC, anon and authenticated possess at the time this query is run, plus
-- the original ENABLE/FORCE ROW LEVEL SECURITY state.
--
-- This query is read-only: it does not change data, policies, privileges or schema.

with target_table as (
  select
    c.relacl,
    c.relowner,
    c.relrowsecurity,
    c.relforcerowsecurity
  from pg_class as c
  join pg_namespace as n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'prodotti'
    and c.relkind in ('r', 'p')
),
original_grants as (
  select
    case
      when acl.grantee = 0 then 'PUBLIC'
      else pg_get_userbyid(acl.grantee)
    end as grantee,
    lower(acl.privilege_type) as privilege_type,
    acl.is_grantable
  from target_table as target
  cross join lateral aclexplode(
    coalesce(target.relacl, acldefault('r', target.relowner))
  ) as acl
  where acl.grantee = 0
     or pg_get_userbyid(acl.grantee) in ('anon', 'authenticated')
),
generated_grants as (
  select
    row_number() over (order by grantee, is_grantable) + 3 as line_no,
    format(
      'grant %s on table public.prodotti to %s%s;',
      string_agg(privilege_type, ', ' order by privilege_type),
      case
        when grantee = 'PUBLIC' then 'public'
        else format('%I', grantee)
      end,
      case
        when is_grantable then ' with grant option'
        else ''
      end
    ) as rollback_sql
  from original_grants
  group by grantee, is_grantable
),
rls_restore as (
  select
    coalesce((select max(line_no) + 1 from generated_grants), 4::bigint) as line_no,
    format(
      $restore_sql$do $restore_rls_state$
declare
  current_rls boolean;
  current_force_rls boolean;
begin
  select
    c.relrowsecurity,
    c.relforcerowsecurity
  into
    current_rls,
    current_force_rls
  from pg_class as c
  join pg_namespace as n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'prodotti'
    and c.relkind in ('r', 'p');

  if current_force_rls is distinct from %s then
    alter table public.prodotti %s row level security;
  end if;

  if current_rls is distinct from %s then
    alter table public.prodotti %s row level security;
  end if;
end
$restore_rls_state$;$restore_sql$,
      case when relforcerowsecurity then 'true' else 'false' end,
      case when relforcerowsecurity then 'force' else 'no force' end,
      case when relrowsecurity then 'true' else 'false' end,
      case when relrowsecurity then 'enable' else 'disable' end
    ) as rollback_sql
  from target_table
),
rollback_lines as (
  select 1::bigint as line_no, 'begin;'::text as rollback_sql
  union all
  select 2::bigint, 'drop policy if exists devicehub_public_read_only on public.prodotti;'
  union all
  select 3::bigint, 'revoke all privileges on table public.prodotti from public, anon, authenticated;'
  union all
  select line_no, rollback_sql from generated_grants
  union all
  select line_no, rollback_sql from rls_restore
  union all
  select
    (select line_no + 1 from rls_restore),
    'commit;'
)
select
  line_no,
  rollback_sql
from rollback_lines
order by line_no;
