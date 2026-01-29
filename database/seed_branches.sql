-- =====================================
-- BRANCH SEED DATA - 9 BRANCHES
-- =====================================

-- Insert all COZA Global branches
INSERT OR REPLACE INTO branches (id, country, state, name, code, city, active) VALUES

-- Nigeria - Abuja (2 branches)
(1, 'Nigeria', 'Abuja', 'COZA Abuja', 'COZA_HQ', 'Guzape', 1),
(2, 'Nigeria', 'Abuja', 'COZA Lugbe', 'COZA_LUGBE', 'Lugbe', 1),

-- Nigeria - Lagos (2 branches)
(3, 'Nigeria', 'Lagos', 'COZA Lagos', 'COZA_LAGOS', 'Ikeja', 1),
(4, 'Nigeria', 'Lagos', 'COZA VI', 'COZA_VI/CHILDREN CHURCH', 'Maryland', 1),

-- Nigeria - Kwara (1 branch)
(5, 'Nigeria', 'Kwara', 'COZA Ilorin', 'COZA_ILORIN', 'Tanke', 1),

-- Nigeria - Rivers (1 branch)
(6, 'Nigeria', 'Rivers', 'COZA Port Harcourt', 'COZA_PH', 'Rumuomasi', 1),

-- United Kingdom - Greater London (1 branch)
(7, 'United Kingdom', 'Greater London', 'COZA London', 'COZA_LONDON', 'London', 1),

-- United Kingdom - West Midlands (1 branch)
(8, 'United Kingdom', 'West Midlands', 'COZA Birmingham', 'COZA_BIRMINGHAM', 'Birmingham', 1),

-- United Kingdom - Greater Manchester (1 branch)
(9, 'United Kingdom', 'Greater Manchester', 'COZA Manchester', 'COZA_MANCHESTER', 'Manchester', 1);

-- Verify branches were inserted
SELECT 'Total branches loaded: ' || COUNT(*) || ' (expected 9)' FROM branches;

-- Show all branches
SELECT id, country, state, name, city FROM branches ORDER BY country, state, id;
