-- First, verify the table exists and has the correct structure
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'user_inputs'
);

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_inputs';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_inputs';

-- Check existing policies
SELECT *
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_inputs';

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_inputs;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.user_inputs;
DROP POLICY IF EXISTS "Enable update for users based on session_id" ON public.user_inputs;
DROP POLICY IF EXISTS "Enable delete for users based on session_id" ON public.user_inputs;
DROP POLICY IF EXISTS "Allow all operations" ON public.user_inputs;

-- Create a single, simple policy that allows everything
CREATE POLICY "Allow everything" ON public.user_inputs
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Grant all privileges
GRANT ALL ON public.user_inputs TO public;
GRANT ALL ON public.user_inputs TO anon;
GRANT ALL ON public.user_inputs TO authenticated;
GRANT ALL ON SEQUENCE public.user_inputs_id_seq TO public;
GRANT ALL ON SEQUENCE public.user_inputs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_inputs_id_seq TO authenticated;

-- Insert a test row if it doesn't exist
INSERT INTO public.user_inputs (session_id, section_name, input_data)
SELECT 
    '00000000-0000-0000-0000-000000000000', 
    'Test', 
    '{"test": true}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_inputs 
    WHERE session_id = '00000000-0000-0000-0000-000000000000'
);

-- Verify the test row
SELECT * FROM public.user_inputs 
WHERE session_id = '00000000-0000-0000-0000-000000000000';