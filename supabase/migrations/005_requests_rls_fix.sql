-- ========================================================
-- 005_requests_rls_fix.sql
-- Fix owner_requests UPDATE policy to allow cancellation
-- ========================================================

-- The original policy blocked owners from updating once status
-- moved past 'pending'|'in_review'. We need to allow the owner
-- to set status = 'cancelled' while it is 'pending'.
DROP POLICY IF EXISTS "requests_update_own" ON owner_requests;

-- Owners may only update their own requests while still pending.
-- The WITH CHECK ensures they can only write 'cancelled' (not escalate
-- to in_review/approved themselves).
CREATE POLICY "requests_cancel_own"
  ON owner_requests FOR UPDATE
  USING (
    owner_id = current_owner_id()
    AND status = 'pending'
  )
  WITH CHECK (
    owner_id = current_owner_id()
    AND status = 'cancelled'
  );
