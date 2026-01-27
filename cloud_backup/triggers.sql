-- ======================================
-- AUTO DETECT VISITOR VS LOCAL MEMBER
-- ======================================

CREATE OR REPLACE FUNCTION detect_visit_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.detected_branch_id IS NULL THEN
        NEW.visit_type := 'local';
    ELSIF NEW.detected_branch_id != (
        SELECT branch_id FROM members WHERE id = NEW.member_id
    ) THEN
        NEW.visit_type := 'visitor';
    ELSE
        NEW.visit_type := 'local';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_detect_visit_type
BEFORE INSERT ON attendance
FOR EACH ROW
EXECUTE FUNCTION detect_visit_type();
