-- ==============================================================================
-- InsightPilot AI — Supabase Database Initialization Schema
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- Project URL: https://tjbgwejzoepyuavleziw.supabase.co
-- ==============================================================================

-- 1. Datasets Table
CREATE TABLE IF NOT EXISTS public.datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    row_count INTEGER DEFAULT 0,
    col_count INTEGER DEFAULT 0,
    file_size_kb REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    cleaned_path TEXT
);

-- 2. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    quality_score REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    summary_json TEXT
);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow read/write access via API keys
CREATE POLICY "Allow public read on datasets" ON public.datasets FOR SELECT USING (true);
CREATE POLICY "Allow public insert on datasets" ON public.datasets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on datasets" ON public.datasets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on datasets" ON public.datasets FOR DELETE USING (true);

CREATE POLICY "Allow public read on reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert on reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on reports" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on reports" ON public.reports FOR DELETE USING (true);
