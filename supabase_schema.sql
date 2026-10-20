-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS PROFILE TABLE (linked to auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'basic', 'pro', 'max', 'enterprise')),
  payment_status text not null default 'active' check (payment_status in ('unpaid', 'paid', 'active', 'cancelled', 'expired')),
  subscription_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure existing users tables get migrated with new columns & constraints if already created
alter table public.users add column if not exists payment_status text not null default 'active';
alter table public.users add column if not exists subscription_expires_at timestamp with time zone;
alter table public.users drop constraint if exists users_subscription_tier_check;
alter table public.users add constraint users_subscription_tier_check check (subscription_tier in ('free', 'basic', 'pro', 'max', 'enterprise'));
alter table public.users alter column subscription_tier set default 'free';
alter table public.users drop constraint if exists users_payment_status_check;
alter table public.users add constraint users_payment_status_check check (payment_status in ('unpaid', 'paid', 'active', 'cancelled', 'expired'));

-- 2. WHATSAPP SESSIONS TABLE
create table if not exists public.whatsapp_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  session_name text default 'primary',
  session_data text, -- JSON auth credentials or credentials path / encrypted token
  status text not null default 'disconnected' check (status in ('disconnected', 'qr_ready', 'connecting', 'connected', 'failed')),
  phone_number text,
  push_name text,
  last_active timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MONITORED GROUPS TABLE
create table if not exists public.monitored_groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_jid text not null,
  group_name text not null,
  keywords text[] default '{}'::text[],
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_jid)
);

-- 4. MESSAGES TABLE (Raw WhatsApp messages ingested by Baileys Bridge)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  group_jid text not null,
  sender_jid text not null,
  sender_name text,
  content text not null,
  timestamp timestamp with time zone not null,
  processed boolean default false,
  has_keyword_match boolean default false,
  matched_keywords text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for quick message queries and deduplication
create index if not exists idx_messages_group_timestamp on public.messages(group_jid, timestamp desc);
create index if not exists idx_messages_processed on public.messages(processed);

-- 5. SUMMARIES TABLE
create table if not exists public.summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_jid text not null,
  group_name text,
  summary_content text not null,
  summary_period_start timestamp with time zone not null,
  summary_period_end timestamp with time zone not null,
  key_points jsonb default '[]'::jsonb,
  action_items jsonb default '[]'::jsonb,
  share_token text,
  message_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.summaries add column if not exists share_token text;
create unique index if not exists idx_summaries_share_token
  on public.summaries (share_token)
  where share_token is not null;

-- 6. SCHEDULED MESSAGES TABLE (For bridge to send back to WhatsApp groups/users)
create table if not exists public.scheduled_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_jid text not null,
  message_content text not null,
  scheduled_for timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. KEYWORD ALERTS TABLE (Logs triggered keyword notifications for users)
create table if not exists public.keyword_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_jid text not null,
  group_name text,
  sender_name text,
  keyword text not null,
  message_content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRIGGER FOR NEW USER SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, subscription_tier, payment_status)
  values (
    new.id,
    coalesce(new.email, 'user@chatdigest.app'),
    'free',
    'active'
  )
  on conflict (id) do update set
    email = excluded.email;
  return new;
exception
  when others then
    -- Log error and never crash auth signup
    raise warning 'handle_new_user error: %', sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.users enable row level security;
alter table public.whatsapp_sessions enable row level security;
alter table public.monitored_groups enable row level security;
alter table public.messages enable row level security;
alter table public.summaries enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.keyword_alerts enable row level security;

-- USERS POLICIES
drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- WHATSAPP SESSIONS POLICIES
drop policy if exists "Users can view own whatsapp sessions" on public.whatsapp_sessions;
create policy "Users can view own whatsapp sessions" on public.whatsapp_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own whatsapp sessions" on public.whatsapp_sessions;
create policy "Users can insert own whatsapp sessions" on public.whatsapp_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own whatsapp sessions" on public.whatsapp_sessions;
create policy "Users can update own whatsapp sessions" on public.whatsapp_sessions
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own whatsapp sessions" on public.whatsapp_sessions;
create policy "Users can delete own whatsapp sessions" on public.whatsapp_sessions
  for delete using (auth.uid() = user_id);

-- MONITORED GROUPS POLICIES
drop policy if exists "Users can view own monitored groups" on public.monitored_groups;
create policy "Users can view own monitored groups" on public.monitored_groups
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own monitored groups" on public.monitored_groups;
create policy "Users can insert own monitored groups" on public.monitored_groups
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own monitored groups" on public.monitored_groups;
create policy "Users can update own monitored groups" on public.monitored_groups
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own monitored groups" on public.monitored_groups;
create policy "Users can delete own monitored groups" on public.monitored_groups
  for delete using (auth.uid() = user_id);

-- SUMMARIES POLICIES
drop policy if exists "Users can view own summaries" on public.summaries;
create policy "Users can view own summaries" on public.summaries
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own summaries" on public.summaries;
create policy "Users can insert own summaries" on public.summaries
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own summaries" on public.summaries;
create policy "Users can delete own summaries" on public.summaries
  for delete using (auth.uid() = user_id);

-- SCHEDULED MESSAGES POLICIES
drop policy if exists "Users can view own scheduled messages" on public.scheduled_messages;
create policy "Users can view own scheduled messages" on public.scheduled_messages
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own scheduled messages" on public.scheduled_messages;
create policy "Users can insert own scheduled messages" on public.scheduled_messages
  for insert with check (auth.uid() = user_id);

-- KEYWORD ALERTS POLICIES
drop policy if exists "Users can view own alerts" on public.keyword_alerts;
create policy "Users can view own alerts" on public.keyword_alerts
  for select using (auth.uid() = user_id);

drop policy if exists "Users can delete own alerts" on public.keyword_alerts;
create policy "Users can delete own alerts" on public.keyword_alerts
  for delete using (auth.uid() = user_id);

-- MESSAGES: Accessible to authenticated users whose monitored_groups matches group_jid
drop policy if exists "Users can view messages for their monitored groups" on public.messages;
create policy "Users can view messages for their monitored groups" on public.messages
  for select using (
    exists (
      select 1 from public.monitored_groups
      where public.monitored_groups.group_jid = public.messages.group_jid
      and public.monitored_groups.user_id = auth.uid()
    )
  );

-- Public links expose only the saved digest fields returned by this function, never raw messages or owner data.
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

create or replace function public.set_summary_share(
  p_summary_id uuid,
  p_share_token text
)
returns table (share_token text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_share_token is not null and p_share_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'Invalid share token';
  end if;

  return query
  update public.summaries as s
  set share_token = case
    when p_share_token is null then null
    else coalesce(s.share_token, p_share_token)
  end
  where s.id = p_summary_id
    and s.user_id = auth.uid()
  returning s.share_token;
end;
$$;

revoke all on function public.set_summary_share(uuid, text) from public, anon, authenticated;
grant execute on function public.set_summary_share(uuid, text) to authenticated;
