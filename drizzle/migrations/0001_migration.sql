CREATE TABLE public.custom_categories (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🏷️',
  color text NOT NULL DEFAULT 'category-other',
  keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_categories TO authenticated;
GRANT ALL ON public.custom_categories TO service_role;
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own categories select" ON public.custom_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own categories insert" ON public.custom_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own categories update" ON public.custom_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own categories delete" ON public.custom_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX custom_categories_user_idx ON public.custom_categories(user_id);

CREATE OR REPLACE FUNCTION public.erase_user_financial_data(_user_id uuid, _delete_account boolean DEFAULT false)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'User is required'; END IF;
  DELETE FROM public.shared_groups WHERE owner_id = _user_id;
  DELETE FROM public.group_expenses WHERE paid_by = _user_id;
  DELETE FROM public.expense_splits WHERE user_id = _user_id;
  DELETE FROM public.group_invites WHERE created_by = _user_id;
  DELETE FROM public.group_members WHERE user_id = _user_id;
  DELETE FROM public.recurring_transactions WHERE user_id = _user_id;
  DELETE FROM public.transactions WHERE user_id = _user_id;
  DELETE FROM public.savings_goals WHERE user_id = _user_id;
  DELETE FROM public.custom_categories WHERE user_id = _user_id;
  DELETE FROM public.csv_imports WHERE user_id = _user_id;
  DELETE FROM public.bank_accounts WHERE user_id = _user_id;
  DELETE FROM public.bank_connections WHERE user_id = _user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = _user_id;
  IF _delete_account THEN
    DELETE FROM public.profiles WHERE user_id = _user_id;
    DELETE FROM public.user_roles WHERE user_id = _user_id;
  ELSE
    UPDATE public.profiles SET monthly_salary = 0, salary_amount = 0, salary_frequency = 'monthly', salary_is_gross = false WHERE user_id = _user_id;
  END IF;
  DELETE FROM public.audit_log WHERE user_id = _user_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.erase_user_financial_data(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erase_user_financial_data(uuid, boolean) TO service_role;