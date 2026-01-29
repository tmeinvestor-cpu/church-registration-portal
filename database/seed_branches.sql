-- =====================================
-- BRANCH SEED DATA - UPDATED
-- =====================================

INSERT OR REPLACE INTO branches (id, country, state, name, code, city, active) VALUES

-- Nigeria - Abuja
(1, 'Nigeria', 'Abuja', 'COZA Abuja', 'COZA_HQ', 'Guzape', 1),
(2, 'Nigeria', 'Abuja', 'COZA Lugbe', 'COZA_LUGBE', 'Lugbe', 1),

-- Nigeria - Lagos
(3, 'Nigeria', 'Lagos', 'COZA Lagos', 'COZA_LAGOS', 'Ikeja', 1),
(4, 'Nigeria', 'Lagos', 'COZA VI', 'COZA_VI/CHILDREN CHURCH', 'Maryland', 1),

-- Nigeria - Kwara
(5, 'Nigeria', 'Kwara', 'COZA Ilorin', 'COZA_ILORIN', 'Tanke', 1),

-- Nigeria - Rivers
(6, 'Nigeria', 'Rivers', 'COZA Port Harcourt', 'COZA_PH', 'Rumuomasi', 1),

-- United Kingdom - Greater London
(7, 'United Kingdom', 'Greater London', 'COZA London', 'COZA_LONDON', 'London', 1),

-- United Kingdom - West Midlands
(8, 'United Kingdom', 'West Midlands', 'COZA Birmingham', 'COZA_BIRMINGHAM', 'Birmingham', 1),

-- United Kingdom - Greater Manchester
(9, 'United Kingdom', 'Greater Manchester', 'COZA Manchester', 'COZA_MANCHESTER', 'Manchester', 1);

-- Verify
SELECT 'Total branches: ' || COUNT(*) FROM branches;
