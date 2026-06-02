
-- 1) Tighten transactions INSERT/UPDATE policies so bank_account_id must belong to the caller
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    bank_account_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.bank_accounts
      WHERE id = bank_account_id AND user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    bank_account_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.bank_accounts
      WHERE id = bank_account_id AND user_id = auth.uid()
    )
  )
);

-- 2) Defense-in-depth: trigger-level ownership check before mutating balances
CREATE OR REPLACE FUNCTION public.apply_transaction_to_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  delta NUMERIC;
  owner UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      SELECT user_id INTO owner FROM public.bank_accounts WHERE id = NEW.bank_account_id;
      IF owner IS NULL OR owner <> NEW.user_id THEN
        RAISE EXCEPTION 'bank_account_id does not belong to transaction owner';
      END IF;
      delta := CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END;
      UPDATE public.bank_accounts SET current_balance = current_balance + delta, updated_at = now()
        WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      delta := CASE WHEN OLD.type = 'income' THEN -OLD.amount ELSE OLD.amount END;
      UPDATE public.bank_accounts SET current_balance = current_balance + delta, updated_at = now()
        WHERE id = OLD.bank_account_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      delta := CASE WHEN OLD.type = 'income' THEN -OLD.amount ELSE OLD.amount END;
      UPDATE public.bank_accounts SET current_balance = current_balance + delta, updated_at = now()
        WHERE id = OLD.bank_account_id;
    END IF;
    IF NEW.bank_account_id IS NOT NULL THEN
      SELECT user_id INTO owner FROM public.bank_accounts WHERE id = NEW.bank_account_id;
      IF owner IS NULL OR owner <> NEW.user_id THEN
        RAISE EXCEPTION 'bank_account_id does not belong to transaction owner';
      END IF;
      delta := CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END;
      UPDATE public.bank_accounts SET current_balance = current_balance + delta, updated_at = now()
        WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;
