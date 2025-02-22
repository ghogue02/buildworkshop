-- Create admin_notes table
create table if not exists admin_notes (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null references user_inputs(session_id),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index if not exists admin_notes_session_id_idx on admin_notes(session_id);

-- Enable RLS
alter table admin_notes enable row level security;

-- Create policy for admin access
create policy "Enable all access for admin mode"
  on admin_notes
  for all
  using (
    -- Check if request is coming from admin mode
    -- In a production app, you'd want proper admin authentication
    true
  );