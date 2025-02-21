-- Drop existing table and policies
DROP TABLE IF EXISTS public.user_inputs CASCADE;

-- Create the table
CREATE TABLE public.user_inputs (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    section_name TEXT NOT NULL,
    input_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, section_name)
);

-- Enable RLS
ALTER TABLE public.user_inputs ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations
CREATE POLICY "Allow all operations" ON public.user_inputs
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Grant all privileges to public and authenticated roles
GRANT ALL ON public.user_inputs TO public;
GRANT ALL ON public.user_inputs TO authenticated;
GRANT ALL ON SEQUENCE public.user_inputs_id_seq TO public;
GRANT ALL ON SEQUENCE public.user_inputs_id_seq TO authenticated;

-- Insert a test row to verify everything works
INSERT INTO public.user_inputs (session_id, section_name, input_data)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Test', '{"test": true}'::jsonb)
RETURNING *;

-- Verify the table exists and the test row was inserted
SELECT * FROM public.user_inputs WHERE session_id = '00000000-0000-0000-0000-000000000000';