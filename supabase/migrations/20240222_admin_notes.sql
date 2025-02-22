-- Create admin_notes table without foreign key constraint
create table if not exists admin_notes (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null unique,  -- Added unique constraint
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index if not exists admin_notes_session_id_idx on admin_notes(session_id);

-- Enable RLS
alter table admin_notes enable row level security;

-- Create separate policies for each operation
create policy "Enable read access for admin mode"
  on admin_notes
  for select
  using (true);

create policy "Enable insert access for admin mode"
  on admin_notes
  for insert
  with check (true);

create policy "Enable update access for admin mode"
  on admin_notes
  for update
  using (true)
  with check (true);

create policy "Enable delete access for admin mode"
  on admin_notes
  for delete
  using (true);