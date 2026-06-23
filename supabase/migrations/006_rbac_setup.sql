-- ========================================================
-- 006_rbac_setup.sql
-- Taksu Owner Portal — RBAC Setup
-- ========================================================

-- 1. Create the new role enum
CREATE TYPE app_role AS ENUM ('root', 'admin', 'accountant', 'service', 'investor', 'guest');

-- 2. Add role to owners table
ALTER TABLE owners ADD COLUMN role app_role NOT NULL DEFAULT 'guest';

-- 3. Trigger to sync role to auth.users.raw_app_meta_data
-- This function will be called whenever an owner's role is updated (or inserted)
CREATE OR REPLACE FUNCTION sync_role_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- We only update if the role changed, to prevent infinite loops or unnecessary updates
  IF TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.auth_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_owner_role_change
  AFTER INSERT OR UPDATE OF role ON owners
  FOR EACH ROW EXECUTE FUNCTION sync_role_to_auth_metadata();

-- Helper function to get role from JWT (simpler to write in policies)
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$ LANGUAGE SQL STABLE;


-- ========================================================
-- RLS POLICIES FOR ADMIN & ROOT (Full Access)
-- ========================================================

-- Owners
CREATE POLICY "admin_all_owners" ON owners FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Pools
CREATE POLICY "admin_all_pools" ON pools FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Villas
CREATE POLICY "admin_all_villas" ON villas FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Bookings
CREATE POLICY "admin_all_bookings" ON bookings FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Statements
CREATE POLICY "admin_all_statements" ON monthly_statements FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Expenses
CREATE POLICY "admin_all_expenses" ON operating_expenses FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Requests
CREATE POLICY "admin_all_requests" ON owner_requests FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Comments
CREATE POLICY "admin_all_comments" ON request_comments FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Documents
CREATE POLICY "admin_all_documents" ON owner_documents FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Pool state
CREATE POLICY "admin_all_pool_state" ON pool_rotation_state FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));

-- Audit
CREATE POLICY "admin_all_audit" ON owner_portal_audit FOR ALL 
USING (auth_user_role() IN ('root', 'admin'));


-- ========================================================
-- RLS POLICIES FOR ACCOUNTANT
-- ========================================================

-- Read-only access for accountant
CREATE POLICY "accountant_view_owners" ON owners FOR SELECT USING (auth_user_role() = 'accountant');
CREATE POLICY "accountant_view_pools" ON pools FOR SELECT USING (auth_user_role() = 'accountant');
CREATE POLICY "accountant_view_villas" ON villas FOR SELECT USING (auth_user_role() = 'accountant');
CREATE POLICY "accountant_view_bookings" ON bookings FOR SELECT USING (auth_user_role() = 'accountant');
CREATE POLICY "accountant_view_pool_state" ON pool_rotation_state FOR SELECT USING (auth_user_role() = 'accountant');

-- Full access to financial records
CREATE POLICY "accountant_all_statements" ON monthly_statements FOR ALL USING (auth_user_role() = 'accountant');
CREATE POLICY "accountant_all_expenses" ON operating_expenses FOR ALL USING (auth_user_role() = 'accountant');
