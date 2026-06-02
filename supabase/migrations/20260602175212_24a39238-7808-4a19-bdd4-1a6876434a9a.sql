
-- 1) group_invites: restrict SELECT to group members (was: USING true)
DROP POLICY IF EXISTS "Anyone can view invites by token" ON public.group_invites;
CREATE POLICY "Members view invites"
ON public.group_invites
FOR SELECT
TO authenticated
USING (public.is_group_member(group_id, auth.uid()) OR public.is_group_owner(group_id, auth.uid()));

-- 2) Scope policies on sensitive tables from {public} to {authenticated}
-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions"
ON public.transactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- recurring_transactions
DROP POLICY IF EXISTS "Users can view own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can view own recurring"
ON public.recurring_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can insert own recurring"
ON public.recurring_transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can update own recurring"
ON public.recurring_transactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can delete own recurring"
ON public.recurring_transactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- savings_goals
DROP POLICY IF EXISTS "Users can view own goals" ON public.savings_goals;
CREATE POLICY "Users can view own goals"
ON public.savings_goals FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.savings_goals;
CREATE POLICY "Users can insert own goals"
ON public.savings_goals FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.savings_goals;
CREATE POLICY "Users can update own goals"
ON public.savings_goals FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.savings_goals;
CREATE POLICY "Users can delete own goals"
ON public.savings_goals FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- audit_log policies → authenticated
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_log;
CREATE POLICY "Admins can view all audit logs"
ON public.audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own audit log" ON public.audit_log;
CREATE POLICY "Users can view own audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3) user_roles: scope all policies strictly to authenticated and split the
-- permissive admin ALL policy so it cannot bypass restrictive policies.
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Lock down SECURITY DEFINER functions: revoke EXECUTE from PUBLIC/anon.
-- has_role and is_group_* are used inside RLS policies, so keep EXECUTE for authenticated.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.expense_group_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expense_group_id(uuid) TO authenticated, service_role;

-- Admin/maintenance/trigger functions: not for client use
REVOKE EXECUTE ON FUNCTION public.process_recurring_transactions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_recurring_transactions() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_owner_as_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_group_children() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expense_splits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_transaction_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_transaction_to_account() FROM PUBLIC, anon, authenticated;
