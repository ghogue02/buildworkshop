-- Drop existing table if it exists
DROP TABLE IF EXISTS public.User_Inputs;

-- Create User_Inputs table
CREATE TABLE public.User_Inputs (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    section_name TEXT NOT NULL,
    input_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, section_name)
);

-- Enable Row Level Security
ALTER TABLE public.User_Inputs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON public.User_Inputs
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Grant access to public
GRANT ALL ON public.User_Inputs TO anon;
GRANT ALL ON public.User_Inputs TO authenticated;
GRANT ALL ON SEQUENCE public.User_Inputs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.User_Inputs_id_seq TO authenticated;