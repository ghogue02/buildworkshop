-- Create a function to create the video_recordings table if it doesn't exist
CREATE OR REPLACE FUNCTION create_video_recordings_table()
RETURNS void AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'video_recordings'
  ) THEN
    -- Create the table
    CREATE TABLE public.video_recordings (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES user_inputs(session_id) ON DELETE CASCADE,
      video_url TEXT NOT NULL,
      transcript TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add indexes for faster queries
    CREATE INDEX IF NOT EXISTS video_recordings_session_id_idx ON video_recordings(session_id);

    -- Add comment to explain the table
    COMMENT ON TABLE video_recordings IS 'Stores video recordings from users with their transcripts';
    
    -- Create RLS policies
    ALTER TABLE public.video_recordings ENABLE ROW LEVEL SECURITY;
    
    -- Allow anonymous access for inserts and selects
    CREATE POLICY "Allow anonymous insert" ON public.video_recordings
      FOR INSERT TO anon
      WITH CHECK (true);
      
    CREATE POLICY "Allow anonymous select" ON public.video_recordings
      FOR SELECT TO anon
      USING (true);
      
    CREATE POLICY "Allow anonymous update" ON public.video_recordings
      FOR UPDATE TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$ LANGUAGE plpgsql;