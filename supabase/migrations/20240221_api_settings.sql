-- Enable Row Level Security
ALTER TABLE public.user_inputs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_inputs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_inputs;
DROP POLICY IF EXISTS "Enable update for users based on session_id" ON public.user_inputs;
DROP POLICY IF EXISTS "Enable delete for users based on session_id" ON public.user_inputs;
DROP POLICY IF EXISTS "Allow all operations" ON public.user_inputs;

-- Create new policies
CREATE POLICY "Enable read access for all users" 
ON public.user_inputs FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for all users" 
ON public.user_inputs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for users based on session_id" 
ON public.user_inputs FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for users based on session_id" 
ON public.user_inputs FOR DELETE
USING (true);

-- Grant necessary permissions
GRANT ALL ON public.user_inputs TO anon;
GRANT ALL ON public.user_inputs TO authenticated;
GRANT ALL ON public.user_inputs_id_seq TO anon;
GRANT ALL ON public.user_inputs_id_seq TO authenticated;

-- Verify the table exists and has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_inputs'
    ) THEN
        CREATE TABLE public.user_inputs (
            id SERIAL PRIMARY KEY,
            session_id UUID NOT NULL,
            section_name TEXT NOT NULL,
            input_data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(session_id, section_name)
        );
    END IF;
END
$$;