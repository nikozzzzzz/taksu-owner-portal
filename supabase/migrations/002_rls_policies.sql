-- ========================================================
-- 002_rls_policies.sql
-- Taksu Owner Portal — Row Level Security Policies
-- ========================================================

-- ========== ENABLE RLS ==========
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_rotation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_portal_audit ENABLE ROW LEVEL SECURITY;

-- ========== HELPER FUNCTION ==========
-- Returns the owner ID for the currently authenticated user
CREATE OR REPLACE FUNCTION current_owner_id()
RETURNS UUID AS $$
  SELECT id FROM owners WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ========== OWNERS POLICIES ==========
CREATE POLICY "owners_view_own"
  ON owners FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "owners_update_own"
  ON owners FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ========== VILLAS POLICIES ==========
CREATE POLICY "villas_view_owned"
  ON villas FOR SELECT
  USING (owner_id = current_owner_id());

-- ========== BOOKINGS POLICIES ==========
-- Owners see bookings for their villas (with anonymized guest data via view)
CREATE POLICY "bookings_view_own_villa"
  ON bookings FOR SELECT
  USING (villa_id IN (
    SELECT id FROM villas WHERE owner_id = current_owner_id()
  ));

-- ========== STATEMENTS POLICIES ==========
-- Owners only see statements that have been sent to them (or paid/disputed)
CREATE POLICY "statements_view_own"
  ON monthly_statements FOR SELECT
  USING (
    owner_id = current_owner_id()
    AND status IN ('sent_to_owner', 'paid', 'disputed')
  );

-- ========== EXPENSES POLICIES ==========
CREATE POLICY "expenses_view_own_villa"
  ON operating_expenses FOR SELECT
  USING (villa_id IN (
    SELECT id FROM villas WHERE owner_id = current_owner_id()
  ));

-- ========== REQUESTS POLICIES ==========
CREATE POLICY "requests_view_own"
  ON owner_requests FOR SELECT
  USING (owner_id = current_owner_id());

CREATE POLICY "requests_create_own"
  ON owner_requests FOR INSERT
  WITH CHECK (owner_id = current_owner_id());

CREATE POLICY "requests_update_own"
  ON owner_requests FOR UPDATE
  USING (
    owner_id = current_owner_id()
    AND status IN ('pending', 'in_review')
  );

-- ========== REQUEST COMMENTS POLICIES ==========
CREATE POLICY "comments_view_own_requests"
  ON request_comments FOR SELECT
  USING (request_id IN (
    SELECT id FROM owner_requests WHERE owner_id = current_owner_id()
  ));

CREATE POLICY "comments_create_own_requests"
  ON request_comments FOR INSERT
  WITH CHECK (
    author_type = 'owner'
    AND request_id IN (
      SELECT id FROM owner_requests WHERE owner_id = current_owner_id()
    )
  );

-- ========== DOCUMENTS POLICIES ==========
CREATE POLICY "documents_view_own"
  ON owner_documents FOR SELECT
  USING (
    owner_id = current_owner_id()
    AND visible_to_owner = TRUE
  );

-- ========== POOL STATE POLICIES ==========
CREATE POLICY "pool_state_view_own"
  ON pool_rotation_state FOR SELECT
  USING (villa_id IN (
    SELECT id FROM villas WHERE owner_id = current_owner_id()
  ));

-- ========== AUDIT POLICIES ==========
CREATE POLICY "audit_view_own"
  ON owner_portal_audit FOR SELECT
  USING (owner_id = current_owner_id());
