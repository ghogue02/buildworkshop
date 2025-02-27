-- Drop existing table if it exists
DROP TABLE IF EXISTS public.user_inputs;

-- Create user_inputs table
CREATE TABLE public.user_inputs (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    section_name TEXT NOT NULL,
    input_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, section_name)
);

-- Enable Row Level Security
ALTER TABLE public.user_inputs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON public.user_inputs
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Grant access to public
GRANT ALL ON public.user_inputs TO anon;
GRANT ALL ON public.user_inputs TO authenticated;
GRANT ALL ON SEQUENCE public.user_inputs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_inputs_id_seq TO authenticated;