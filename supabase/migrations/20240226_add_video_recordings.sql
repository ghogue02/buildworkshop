-- Create a new table for storing video recordings
CREATE TABLE IF NOT EXISTS video_recordings (
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