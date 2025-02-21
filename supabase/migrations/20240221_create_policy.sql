-- Enable Row Level Security
ALTER TABLE public.user_inputs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for all users
CREATE POLICY "Enable all access" ON public.user_inputs
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Grant access to the table
GRANT ALL ON public.user_inputs TO anon;
GRANT ALL ON public.user_inputs TO authenticated;
GRANT ALL ON public.user_inputs_id_seq TO anon;
GRANT ALL ON public.user_inputs_id_seq TO authenticated;