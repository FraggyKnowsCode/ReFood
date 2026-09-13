-- ============================================================
-- Supabase Security and Performance Patch
-- Fixes critical Row-Level Security (RLS) vulnerabilities and
-- adds indexes to handle high concurrency (100k+ users).
-- ============================================================

-- 1. Enable Row-Level Security on all tables
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reduction_programs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_management     ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_waste_data     ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback            ENABLE ROW LEVEL SECURITY;

-- 2. Create Read-Only policies for the public
-- Since the Node.js backend uses a service_role key to manage data,
-- we ONLY need to allow public read access for the frontend dashboard.
-- All write operations from the public (anon key) will be blocked.

CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to reduction_programs" ON reduction_programs FOR SELECT USING (true);
CREATE POLICY "Allow public read access to cost_management" ON cost_management FOR SELECT USING (true);
CREATE POLICY "Allow public read access to donations" ON donations FOR SELECT USING (true);
CREATE POLICY "Allow public read access to food_waste_data" ON food_waste_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access to food_requests" ON food_requests FOR SELECT USING (true);
CREATE POLICY "Allow public read access to feedback" ON feedback FOR SELECT USING (true);

-- 3. Add Performance Indexes for 100,000+ Concurrent Users
-- Indexes on foreign keys and commonly filtered columns prevent
-- full table scans and database CPU spikes under load.

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_reduction_programs_created_by ON reduction_programs(created_by);
CREATE INDEX IF NOT EXISTS idx_reduction_programs_dates ON reduction_programs(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_cost_management_program_id ON cost_management(program_id);

CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date DESC);

CREATE INDEX IF NOT EXISTS idx_food_waste_data_user_id ON food_waste_data(user_id);
CREATE INDEX IF NOT EXISTS idx_food_waste_data_category ON food_waste_data(food_category);
CREATE INDEX IF NOT EXISTS idx_food_waste_data_available ON food_waste_data(available);

CREATE INDEX IF NOT EXISTS idx_food_requests_food_id ON food_requests(food_id);
CREATE INDEX IF NOT EXISTS idx_food_requests_user_id ON food_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_program_id ON feedback(program_id);
