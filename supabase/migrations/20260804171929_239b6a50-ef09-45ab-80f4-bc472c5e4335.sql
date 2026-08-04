DROP POLICY IF EXISTS "Owner adds members" ON public.group_members;

CREATE POLICY "Owner adds members" ON public.group_members
FOR INSERT TO authenticated
WITH CHECK (public.is_group_owner(group_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.join_group_with_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.group_invites
  WHERE token = _token
    AND used = false
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  IF NOT public.is_group_member(inv.group_id, auth.uid()) THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (inv.group_id, auth.uid(), 'member');
  END IF;

  UPDATE public.group_invites SET used = true WHERE id = inv.id;

  RETURN inv.group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_group_with_invite(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.join_group_with_invite(text) TO authenticated;