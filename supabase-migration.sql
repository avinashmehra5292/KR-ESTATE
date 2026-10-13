-- ============================================================
-- KR Estate Noida — Supabase Migration
-- Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Properties table
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  developer TEXT,
  tagline TEXT,
  sector TEXT,
  locality TEXT,
  property_type TEXT NOT NULL,
  status TEXT NOT NULL,
  possession_date TEXT,
  price_display TEXT,
  price_num_in_crores NUMERIC,
  price_per_sq_ft NUMERIC,
  bhk_configurations JSONB DEFAULT '[]',
  rera_number TEXT,
  total_acres NUMERIC,
  open_greens_percentage NUMERIC,
  cover_image TEXT,
  gallery_images JSONB DEFAULT '[]',
  short_description TEXT,
  full_description TEXT,
  amenities JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  location_advantages JSONB DEFAULT '[]',
  floor_plans JSONB DEFAULT '[]',
  distance_to_metro TEXT,
  distance_to_airport TEXT,
  distance_to_expressway TEXT,
  video_tour JSONB,
  architectural_theme JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Site Settings table (single-row pattern)
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Localities table
CREATE TABLE IF NOT EXISTS localities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  subtitle TEXT,
  description TEXT,
  avg_price_per_sq_ft TEXT,
  projected_growth_3yr TEXT,
  highlights JSONB DEFAULT '[]',
  metro_connectivity TEXT,
  landmark_attractions JSONB DEFAULT '[]',
  top_projects JSONB DEFAULT '[]'
);

-- 4. Brochure Requests / Site Leads table
CREATE TABLE IF NOT EXISTS brochure_requests (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  interested_project TEXT,
  property_type TEXT,
  budget_range TEXT,
  message TEXT,
  comment TEXT,
  lead_type TEXT,
  lead_status TEXT,
  property_id TEXT,
  property_title TEXT,
  sector TEXT,
  developer TEXT,
  price_display TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE localities ENABLE ROW LEVEL SECURITY;
ALTER TABLE brochure_requests ENABLE ROW LEVEL SECURITY;

-- Service role key (used by server.ts) automatically bypasses RLS.
-- Public read policies (in case direct read is used):
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read properties' AND tablename = 'properties') THEN
    CREATE POLICY "Public read properties" ON properties FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read site_settings' AND tablename = 'site_settings') THEN
    CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read localities' AND tablename = 'localities') THEN
    CREATE POLICY "Public read localities" ON localities FOR SELECT USING (true);
  END IF;
END $$;

-- 6. Storage Bucket for Uploads (Images & Videos)
-- Run this in Supabase Dashboard → Storage → "New Bucket":
-- Bucket Name: "uploads"
-- Public bucket: ON (Check the box "Public bucket")
-- Allowed MIME types: image/*, video/*
-- Max file size limit: 50MB (or your preferred size)
