-- ============================================================
-- Supabase Migration: Add Missing Donation Columns
-- This fixes the "[object Object]" error when processing
-- donations from the frontend.
-- ============================================================

ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS mobile_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_last4 VARCHAR(4),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
