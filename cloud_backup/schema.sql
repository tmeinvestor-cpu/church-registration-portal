-- ================================
-- COZA GLOBAL – CLOUD BACKUP SCHEMA
-- ================================

-- MEMBERS
CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,

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

    created_at TIMESTAMP DEFAULT NOW()
);


-- ATTENDANCE LOGS
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,

    member_id BIGINT NOT NULL,
    detected_branch_id INTEGER,

    visit_type TEXT CHECK (
        visit_type IN ('local', 'visitor')
    ),

    timestamp TIMESTAMP DEFAULT NOW()
);


-- FACE EMBEDDINGS BACKUP
CREATE TABLE IF NOT EXISTS face_embeddings (
    member_id BIGINT PRIMARY KEY,
    embedding FLOAT4[] NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
