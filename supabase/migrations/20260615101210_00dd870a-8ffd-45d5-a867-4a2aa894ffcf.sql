
-- Restrict group_invites UPDATE to creator only, with matching WITH CHECK
DROP POLICY IF EXISTS "Members update own invites" ON public.group_invites;
CREATE POLICY "Creator updates own invites"
ON public.group_invites
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid() AND is_group_member(group_id, auth.uid()));

-- Require ongoing group membership for expense modify/delete
DROP POLICY IF EXISTS "Payer deletes expense" ON public.group_expenses;
CREATE POLICY "Payer deletes expense"
ON public.group_expenses
FOR DELETE
TO authenticated
USING (auth.uid() = paid_by AND is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Payer updates expense" ON public.group_expenses;
CREATE POLICY "Payer updates expense"
ON public.group_expenses
FOR UPDATE
TO authenticated
USING (auth.uid() = paid_by AND is_group_member(group_id, auth.uid()))
WITH CHECK (auth.uid() = paid_by AND is_group_member(group_id, auth.uid()));

-- Block any direct client writes to audit_log; only SECURITY DEFINER triggers (running as table owner) bypass these.
CREATE POLICY "Block direct inserts to audit_log"
ON public.audit_log
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Block direct updates to audit_log"
ON public.audit_log
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Block direct deletes from audit_log"
ON public.audit_log
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (false);
