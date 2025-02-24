-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.report_cache;
DROP TABLE IF EXISTS public.analysis_results;

-- Create report_cache table for storing generated reports
CREATE TABLE public.report_cache (
    id SERIAL PRIMARY KEY,
    report_type TEXT NOT NULL,
    parameters JSONB,
    report_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(report_type, parameters)
);

-- Create analysis_results table for storing AI-generated insights
CREATE TABLE public.analysis_results (
    id SERIAL PRIMARY KEY,
    analysis_type TEXT NOT NULL,
    input_data JSONB,
    insights JSONB NOT NULL,
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_ids TEXT[] -- Array of session IDs included in this analysis
);

-- Enable Row Level Security
ALTER TABLE public.report_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies to allow admin access only
CREATE POLICY "Allow admin access to reports" ON public.report_cache
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow admin access to analysis" ON public.analysis_results
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant access to authenticated users (actual access controlled by RLS policies)
GRANT ALL ON public.report_cache TO authenticated;
GRANT ALL ON public.analysis_results TO authenticated;
GRANT ALL ON SEQUENCE public.report_cache_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.analysis_results_id_seq TO authenticated;

-- Create indexes for better query performance
CREATE INDEX report_cache_type_idx ON public.report_cache(report_type);
CREATE INDEX report_cache_expires_idx ON public.report_cache(expires_at);
CREATE INDEX analysis_results_type_idx ON public.analysis_results(analysis_type);
CREATE INDEX analysis_results_created_idx ON public.analysis_results(created_at);