-- ======================================
-- VISITING MEMBERS REPORT
-- ======================================

CREATE OR REPLACE VIEW visiting_members AS
SELECT
    m.id,
    m.first_name,
    m.last_name,
    m.phone,
    m.role,
    m.level,
    COUNT(a.id) AS visit_count,
    MIN(a.timestamp) AS first_visit,
    MAX(a.timestamp) AS last_visit
FROM attendance a
JOIN members m ON m.id = a.member_id
WHERE a.visit_type = 'visitor'
GROUP BY m.id;


-- ======================================
-- TOP VISITING MEMBERS (50 DAYS)
-- ======================================

CREATE OR REPLACE VIEW top_visiting_members AS
SELECT
    m.id,
    m.first_name,
    m.last_name,
    m.phone,
    m.level,
    COUNT(a.id) AS visits_last_50_days
FROM attendance a
JOIN members m ON m.id = a.member_id
WHERE
    a.visit_type = 'visitor'
    AND a.timestamp >= NOW() - INTERVAL '50 days'
GROUP BY m.id
HAVING COUNT(a.id) >= 2
ORDER BY visits_last_50_days DESC;
