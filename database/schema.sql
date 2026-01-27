-- =====================================
-- LOCAL CHURCH DATABASE
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
    active INTEGER DEFAULT 1
);

-- -------------------------------------
-- MEMBERS
-- -------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    phone TEXT NOT NULL,
    whatsapp_number TEXT,

    email TEXT,
    residential_city TEXT,

    country TEXT NOT NULL,
    state TEXT NOT NULL,

    branch_id INTEGER,
    device_id TEXT,

    role TEXT DEFAULT 'Member',
    level INTEGER DEFAULT 1,

    home_church TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(branch_id) REFERENCES branches(id)
);

-- -------------------------------------
-- ATTENDANCE
-- -------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    detected_branch_id INTEGER,
    visit_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
