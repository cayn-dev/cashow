-- 1. Lock down process_recurring_transactions: only service_role (used by edge function/cron) may execute
REVOKE EXECUTE ON FUNCTION public.process_recurring_transactions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_recurring_transactions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_recurring_transactions() FROM authenticated;

-- 2. Fix has_role() to actually use the _user_id parameter instead of always auth.uid()
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. Add INSERT policy on profiles so users can create their own row
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Restrict user_roles INSERT/UPDATE/DELETE to admins only.
-- The existing "Admins can manage all roles" ALL policy is permissive and applies to public,
-- but with no other INSERT/UPDATE/DELETE policies, non-admins are still blocked because the
-- USING/WITH CHECK requires has_role(auth.uid(), 'admin'). However, to make this explicit and
-- to defend in depth, add a RESTRICTIVE policy that blocks any non-admin write.
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));