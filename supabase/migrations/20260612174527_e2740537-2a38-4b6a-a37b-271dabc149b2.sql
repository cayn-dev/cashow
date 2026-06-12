-- Tighten expense_splits UPDATE: only the split owner can update their split
DROP POLICY IF EXISTS "Members update own split" ON public.expense_splits;
CREATE POLICY "Users update own split"
ON public.expense_splits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Restrict SELECT on group_invites to invite creator or group owner only
DROP POLICY IF EXISTS "Members can view group invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members view invites" ON public.group_invites;
DROP POLICY IF EXISTS "View group invites" ON public.group_invites;
CREATE POLICY "Creator or owner view invites"
ON public.group_invites
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_group_owner(group_id, auth.uid())
);

-- Allow invite creator or group owner to delete invites
CREATE POLICY "Creator or owner delete invites"
ON public.group_invites
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_group_owner(group_id, auth.uid())
);