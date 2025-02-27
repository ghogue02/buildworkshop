-- Create interview_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  interview_data JSONB,
  transcript TEXT,
  ai_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on session_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_id ON interview_sessions(session_id);

-- Enable RLS policies
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (same as other tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'interview_sessions' 
    AND policyname = 'Allow anonymous access to interview_sessions'
  ) THEN
    CREATE POLICY "Allow anonymous access to interview_sessions"
      ON interview_sessions
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;