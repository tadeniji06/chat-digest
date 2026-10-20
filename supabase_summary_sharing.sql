alter table public.summaries
  add column if not exists share_token text;

create unique index if not exists idx_summaries_share_token
  on public.summaries (share_token)
  where share_token is not null;

create or replace function public.get_public_summary(p_share_token text)
returns table (
  group_name text,
  summary_content text,
  summary_period_start timestamp with time zone,
  summary_period_end timestamp with time zone,
  key_points jsonb,
  action_items jsonb,
  message_count integer,
  created_at timestamp with time zone
)
language sql
security definer
set search_path = ''
as $$
  select
    s.group_name,
    s.summary_content,
    s.summary_period_start,
    s.summary_period_end,
    s.key_points,
    s.action_items,
    s.message_count,
    s.created_at
  from public.summaries as s
  where s.share_token = p_share_token
    and length(p_share_token) = 43
  limit 1;
$$;

revoke all on function public.get_public_summary(text) from public, anon, authenticated;
grant execute on function public.get_public_summary(text) to anon, authenticated;
