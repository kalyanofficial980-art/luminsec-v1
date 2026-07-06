alter table public.scan_findings
  add column if not exists manual_review_status text not null default 'pending';

alter table public.scan_findings
  add column if not exists manual_review_notes text;

alter table public.scan_findings
  add column if not exists manual_reviewed_by uuid references auth.users(id);

alter table public.scan_findings
  add column if not exists manual_reviewed_at timestamptz;

alter table public.scan_findings
  add column if not exists verified_for_paid_report boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scan_findings_manual_review_status_check'
  ) then
    alter table public.scan_findings
      add constraint scan_findings_manual_review_status_check
      check (manual_review_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists scan_findings_manual_review_status_idx
  on public.scan_findings(manual_review_status);

create index if not exists scan_findings_manual_reviewed_at_idx
  on public.scan_findings(manual_reviewed_at desc);

drop policy if exists "Admins can select scan findings for manual review" on public.scan_findings;
create policy "Admins can select scan findings for manual review"
on public.scan_findings
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update scan findings manual review" on public.scan_findings;
create policy "Admins can update scan findings manual review"
on public.scan_findings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);