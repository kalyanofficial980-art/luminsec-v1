create table if not exists public.verified_report_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_result_id uuid not null references public.scan_results(id) on delete cascade,
  status text not null default 'requested',
  customer_message text,
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verified_report_requests_status_check
    check (status in ('requested', 'in_review', 'approved', 'rejected', 'delivered')),
  constraint verified_report_requests_user_scan_unique
    unique (user_id, scan_result_id)
);

create index if not exists verified_report_requests_status_idx
  on public.verified_report_requests(status);

create index if not exists verified_report_requests_created_at_idx
  on public.verified_report_requests(created_at desc);

create index if not exists verified_report_requests_scan_result_id_idx
  on public.verified_report_requests(scan_result_id);

alter table public.verified_report_requests enable row level security;

drop policy if exists "Users can select own verified report requests" on public.verified_report_requests;
create policy "Users can select own verified report requests"
on public.verified_report_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own verified report requests" on public.verified_report_requests;
create policy "Users can create own verified report requests"
on public.verified_report_requests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can select all verified report requests" on public.verified_report_requests;
create policy "Admins can select all verified report requests"
on public.verified_report_requests
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

drop policy if exists "Admins can update verified report requests" on public.verified_report_requests;
create policy "Admins can update verified report requests"
on public.verified_report_requests
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