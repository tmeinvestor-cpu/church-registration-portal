-- =====================================
-- LOCAL CHURCH DATABASE SCHEMA
-- =====================================
PRAGMA foreign_keys = ON;

-- -------------------------------------
-- BRANCHES
-- -------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY,
    country TEXT NOT NULL,
    state TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    city TEXT,
    active INTEGER DEFAULT 1
);

-- -------------------------------------
-- MEMBERS
-- Note: residential_city is member's home city (can differ from branch city)
-- Example: Member lives in Manchester but serves at London branch
-- -------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp_number TEXT,
    email TEXT,
    residential_city TEXT,        -- Member's home city (not branch city)
    country TEXT NOT NULL,
    state TEXT NOT NULL,
    branch_id INTEGER,             -- NULL for SOPs (they don't have assigned branch)
    device_id TEXT,
    role TEXT DEFAULT 'member',
    level INTEGER DEFAULT 1,       -- Backend secret: 1=Member, 2=Worker, 3=Leader, 4=CMT, 5=SOP, 7=Pastor
    ministry_name TEXT,            -- For SOPs only - name of their church/ministry
    is_worker INTEGER DEFAULT 0,   -- Boolean: 1 if active in workforce, 0 if not
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id)
);

-- -------------------------------------
-- ATTENDANCE
-- -------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    detected_branch_id INTEGER,
    visit_type TEXT CHECK (visit_type IN ('local', 'visitor')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(member_id) REFERENCES members(id),
    FOREIGN KEY(detected_branch_id) REFERENCES branches(id)
);

-- -------------------------------------
-- INDICES FOR PERFORMANCE
-- -------------------------------------
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_branch ON members(branch_id);
CREATE INDEX IF NOT EXISTS idx_members_level ON members(level);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);

-- -------------------------------------
-- NOTES
-- -------------------------------------
-- 1. branch_id can be NULL for SOPs (Sons of the Prophet)
-- 2. residential_city is independent of branch location
-- 3. level is a backend secret and should not be exposed to users
-- 4. ministry_name is only used for SOPs
