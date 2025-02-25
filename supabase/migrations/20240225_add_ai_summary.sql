-- Add AI summary and flag columns to admin_notes table
alter table admin_notes 
add column if not exists ai_summary text,
add column if not exists ai_generated_flag boolean default false;

-- Add comment to explain the columns
comment on column admin_notes.ai_summary is 'AI-generated 4-sentence summary of builder inputs';
comment on column admin_notes.ai_generated_flag is 'Flag indicating if content appears to be AI-generated';