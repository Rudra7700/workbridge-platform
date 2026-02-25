-- Create a table to store device push tokens for workers
create table public.worker_push_tokens (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) not null,
    token text not null,
    device_type text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.worker_push_tokens enable row level security;

-- Users can only insert their own tokens
create policy "Users can insert their own push tokens"
on public.worker_push_tokens for insert
with check (auth.uid() = user_id);

-- Users can only view their own tokens
create policy "Users can view their own push tokens"
on public.worker_push_tokens for select
using (auth.uid() = user_id);

-- Users can delete their own tokens
create policy "Users can delete their own push tokens"
on public.worker_push_tokens for delete
using (auth.uid() = user_id);

-- Create index on user_id for faster lookups when sending notifications
create index idx_worker_push_tokens_user_id on public.worker_push_tokens(user_id);
