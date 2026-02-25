-- Enable pgvector for AI matching
create extension if not exists vector
with
  schema extensions;

-- Create Jobs Table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  employer_id uuid references public.profiles(id) not null,
  title text not null,
  description text not null,
  skill_tags text[] default '{}',
  wage numeric not null,
  location_text text not null,
  lat double precision,
  lng double precision,
  status text default 'open' check (status in ('open', 'closed')),
  embedding vector(384),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add AI matching column to worker profiles
alter table public.worker_profiles
add column if not exists embedding vector(384);

-- Set up RLS for Jobs
alter table public.jobs enable row level security;

-- Public can view all jobs
create policy "Jobs are viewable by everyone" 
on public.jobs for select 
using (true);

-- Authenticated employers can insert jobs
create policy "Employers can insert own jobs" 
on public.jobs for insert 
with check (
  auth.uid() = employer_id and
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'employer'
  )
);

-- Employers can update their own jobs
create policy "Employers can update own jobs" 
on public.jobs for update 
using (auth.uid() = employer_id);

-- Create a function for smart matching jobs to workers
create or replace function match_workers (
  job_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  worker_id uuid,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    worker_profiles.user_id as worker_id,
    1 - (worker_profiles.embedding <=> match_workers.job_embedding) as similarity
  from worker_profiles
  where 1 - (worker_profiles.embedding <=> match_workers.job_embedding) > match_workers.match_threshold
  order by worker_profiles.embedding <=> match_workers.job_embedding
  limit match_workers.match_count;
end;
$$;
