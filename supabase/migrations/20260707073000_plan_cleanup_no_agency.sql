insert into public.subscription_plans (
  id,
  name,
  description,
  monthly_price,
  currency,
  max_websites,
  max_scans_per_month,
  pdf_reports_enabled,
  public_share_enabled,
  agency_mode_enabled,
  manual_payments_enabled,
  priority_support_enabled,
  is_active,
  sort_order
)
values
  (
    'single_report',
    'Single-time Report',
    'One manual-reviewed readiness report for one website. No monthly subscription.',
    999,
    'INR',
    1,
    1,
    true,
    false,
    false,
    true,
    false,
    true,
    1
  ),
  (
    'beginner',
    'Beginner',
    'For very small websites starting basic website security readiness checks.',
    0,
    'INR',
    1,
    3,
    true,
    false,
    false,
    true,
    false,
    true,
    2
  ),
  (
    'starter',
    'Starter',
    'For small businesses starting customer-data security and trust readiness.',
    499,
    'INR',
    2,
    10,
    true,
    true,
    false,
    true,
    false,
    true,
    3
  ),
  (
    'business',
    'Business',
    'For businesses with forms, leads, payments, and customer records.',
    1499,
    'INR',
    5,
    30,
    true,
    true,
    false,
    true,
    true,
    true,
    4
  ),
  (
    'pro',
    'Pro',
    'For deeper manual-reviewed reports, retest proof, and priority support.',
    2999,
    'INR',
    10,
    80,
    true,
    true,
    false,
    true,
    true,
    true,
    5
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price = excluded.monthly_price,
  currency = excluded.currency,
  max_websites = excluded.max_websites,
  max_scans_per_month = excluded.max_scans_per_month,
  pdf_reports_enabled = excluded.pdf_reports_enabled,
  public_share_enabled = excluded.public_share_enabled,
  agency_mode_enabled = false,
  manual_payments_enabled = excluded.manual_payments_enabled,
  priority_support_enabled = excluded.priority_support_enabled,
  is_active = true,
  sort_order = excluded.sort_order;

update public.subscription_plans
set
  is_active = false,
  agency_mode_enabled = false
where id in ('trial', 'basic', 'agency');

update public.subscription_plans
set agency_mode_enabled = false;

update public.user_subscriptions
set plan_id = case
  when plan_id = 'trial' then 'beginner'
  when plan_id = 'basic' then 'starter'
  when plan_id = 'agency' then 'pro'
  else plan_id
end
where plan_id in ('trial', 'basic', 'agency');

update public.subscription_requests
set requested_plan_id = case
  when requested_plan_id = 'trial' then 'beginner'
  when requested_plan_id = 'basic' then 'starter'
  when requested_plan_id = 'agency' then 'pro'
  else requested_plan_id
end
where requested_plan_id in ('trial', 'basic', 'agency');

update public.profiles
set account_type = 'small_business'
where account_type = 'freelancer_agency';