-- ============================================================
-- Supabase PostgreSQL Migration Script
-- Food Waste Management System
-- ============================================================
-- This script is idempotent: it drops and recreates everything.
-- Security is enforced at the Express layer (JWT middleware),
-- so RLS is intentionally disabled on all tables.
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Drop existing tables (in reverse FK order) and types
-- ------------------------------------------------------------
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS food_requests CASCADE;
DROP TABLE IF EXISTS food_waste_data CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS cost_management CASCADE;
DROP TABLE IF EXISTS reduction_programs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS food_category_enum CASCADE;
DROP TYPE IF EXISTS disposal_method_enum CASCADE;

-- ------------------------------------------------------------
-- STEP 2: Create Enum Types
-- ------------------------------------------------------------
CREATE TYPE food_category_enum AS ENUM (
    'vegetables',
    'fruits',
    'cooked',
    'dairy',
    'dry',
    'others'
);

CREATE TYPE disposal_method_enum AS ENUM (
    'landfill',
    'compost',
    'donation'
);

-- ------------------------------------------------------------
-- STEP 3: Users Table
-- NOTE: The `id` must match the UUID from Supabase Auth (GoTrue).
-- Password management is handled entirely by Supabase Auth.
-- This table only stores public profile data.
-- ------------------------------------------------------------
CREATE TABLE users (
    id          UUID PRIMARY KEY, -- Synced from Supabase Auth UUID
    first_name  VARCHAR(50)  NOT NULL,
    last_name   VARCHAR(50)  NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    phone       VARCHAR(20),
    is_admin    BOOLEAN      DEFAULT false,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ------------------------------------------------------------
-- STEP 4: Reduction Programs Table
-- ------------------------------------------------------------
CREATE TABLE reduction_programs (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name               VARCHAR(255) NOT NULL,
    start_date                 DATE         NOT NULL,
    end_date                   DATE         NOT NULL,
    participating_organizations TEXT,
    created_by                 UUID,  -- user who created the event
    created_at                 TIMESTAMPTZ  DEFAULT NOW(),
    CONSTRAINT fk_program_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- STEP 5: Cost Management Table
-- ------------------------------------------------------------
CREATE TABLE cost_management (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID         NOT NULL,
    labour_cost         NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    maintenance_cost    NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    transportation_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    event_cost          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    other_cost          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_cost          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    CONSTRAINT fk_cost_program
        FOREIGN KEY (program_id)
        REFERENCES reduction_programs(id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 6: Donations Table
-- ------------------------------------------------------------
CREATE TABLE donations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name      VARCHAR(255) NOT NULL,
    donor_email     VARCHAR(255) NOT NULL,
    amount          NUMERIC(10,2) NOT NULL,
    payment_method  VARCHAR(50)  NOT NULL,
    donation_date   TIMESTAMPTZ  DEFAULT NOW()
);

-- ------------------------------------------------------------
-- STEP 7: Food Waste Data Table
-- ------------------------------------------------------------
CREATE TABLE food_waste_data (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_category    food_category_enum   NOT NULL,
    amount_wasted    REAL                 NOT NULL,
    cause_of_waste   TEXT                 NOT NULL,
    location         TEXT                 NOT NULL,
    disposal_method  disposal_method_enum NOT NULL,
    date_of_waste    DATE                 NOT NULL,
    user_id          UUID                 NOT NULL,
    available        BOOLEAN              DEFAULT true,
    created_at       TIMESTAMPTZ          DEFAULT NOW(),
    CONSTRAINT fk_food_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 8: Food Requests Table
-- ------------------------------------------------------------
CREATE TABLE food_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id      UUID         NOT NULL,
    user_id      UUID         NOT NULL,
    request_date TIMESTAMPTZ  DEFAULT NOW(),
    CONSTRAINT fk_request_food
        FOREIGN KEY (food_id)
        REFERENCES food_waste_data(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_request_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 9: Feedback Table
-- program_id is nullable to allow general platform feedback
-- ------------------------------------------------------------
CREATE TABLE feedback (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    program_id UUID,               -- nullable: general feedback has no program
    rating     INT  NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments   TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_program
        FOREIGN KEY (program_id)
        REFERENCES reduction_programs(id)
        ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- STEP 10: Disable Row Level Security on all tables
-- Security is enforced at the Node.js/Express layer via
-- Supabase JWT validation (requireAuth / requireAdmin middleware).
-- ------------------------------------------------------------
ALTER TABLE users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE reduction_programs  DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_management     DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations           DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_waste_data     DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_requests       DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback            DISABLE ROW LEVEL SECURITY;
