CREATE OR REPLACE FUNCTION public.erase_user_financial_data(_user_id uuid, _delete_account boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
$$;
REVOKE ALL ON FUNCTION public.erase_user_financial_data(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erase_user_financial_data(uuid, boolean) TO service_role;