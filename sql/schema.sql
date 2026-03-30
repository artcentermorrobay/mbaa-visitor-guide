-- ============================================================
-- MBAA Visitor Guide Database Schema
-- Run this in the Supabase SQL Editor (SQL tab in dashboard)
-- ============================================================

-- 1. Create the submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core fields
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Eat', 'Drink', 'Shop', 'Do', 'Stay')),
  short_description TEXT NOT NULL,
  location TEXT NOT NULL,
  website TEXT,
  social TEXT,

  -- Participation type
  participation_type TEXT NOT NULL CHECK (participation_type IN (
    'Free Listing', 'Paid Ad', 'Sponsorship', 'Ad + Sponsorship'
  )),

  -- Paid Ad fields
  ad_tier TEXT CHECK (ad_tier IN ('Small', 'Medium', 'Premium')),
  logo_url TEXT,
  image_url TEXT,
  extended_description TEXT,
  offer_text TEXT,

  -- Sponsor fields
  sponsorship_tier TEXT CHECK (sponsorship_tier IN ('Bronze', 'Silver', 'Gold', 'Custom')),
  recognition_name TEXT,
  sponsor_notes TEXT,
  event_presence_interest BOOLEAN DEFAULT FALSE,

  -- Admin/tracking fields
  status TEXT NOT NULL DEFAULT 'Form Received' CHECK (status IN (
    'Contacted', 'Interested', 'Form Received', 'Content Ready',
    'Approved', 'Payment Received', 'Published', 'Declined'
  )),
  payment_status TEXT NOT NULL DEFAULT 'N/A' CHECK (payment_status IN (
    'N/A', 'Invoiced', 'Paid'
  )),
  appears_in TEXT NOT NULL DEFAULT 'Both' CHECK (appears_in IN (
    'Print', 'Online', 'Both'
  )),
  volunteer_assigned TEXT,
  admin_notes TEXT,
  date_submitted TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for common filters
CREATE INDEX idx_submissions_participation ON submissions (participation_type);
CREATE INDEX idx_submissions_status ON submissions (status);
CREATE INDEX idx_submissions_category ON submissions (category);
CREATE INDEX idx_submissions_appears_in ON submissions (appears_in);

-- 3. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- 4. Row Level Security (RLS)
-- Enable RLS on the table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (public form submissions)
CREATE POLICY "Allow public inserts"
ON submissions FOR INSERT
WITH CHECK (true);

-- Allow anyone to SELECT (admin dashboard reads)
-- For production, restrict this with auth
CREATE POLICY "Allow public reads"
ON submissions FOR SELECT
USING (true);

-- Allow anyone to UPDATE (admin dashboard edits)
-- For production, restrict this with auth
CREATE POLICY "Allow public updates"
ON submissions FOR UPDATE
USING (true);

-- 5. Storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Allow public read access to uploaded files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Allow anonymous uploads
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');
