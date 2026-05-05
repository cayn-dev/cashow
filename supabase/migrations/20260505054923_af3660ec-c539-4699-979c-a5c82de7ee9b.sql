
-- ============================================
-- 1) Auto-update bank account balance from transactions
-- ============================================
CREATE OR REPLACE FUNCTION public.apply_transaction_to_account()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  delta NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
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
    -- Reverse old
    IF OLD.bank_account_id IS NOT NULL THEN
      delta := CASE WHEN OLD.type = 'income' THEN -OLD.amount ELSE OLD.amount END;
      UPDATE public.bank_accounts SET current_balance = current_balance + delta, updated_at = now()
        WHERE id = OLD.bank_account_id;
    END IF;
    -- Apply new
    IF NEW.bank_account_id IS NOT NULL THEN
      delta := CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END;
      UPDATE public.bank_accounts SET current_balance = current_balance + delta, updated_at = now()
        WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_account_balance ON public.transactions;
CREATE TRIGGER sync_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.apply_transaction_to_account();

-- Recompute current balances from existing data to fix any drift
UPDATE public.bank_accounts ba SET current_balance = ba.initial_balance + COALESCE((
  SELECT SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)
  FROM public.transactions t WHERE t.bank_account_id = ba.id
), 0);

-- ============================================
-- 2) Cascade cleanup when a shared group is deleted
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_group_children()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.expense_splits WHERE expense_id IN (
    SELECT id FROM public.group_expenses WHERE group_id = OLD.id
  );
  DELETE FROM public.group_expenses WHERE group_id = OLD.id;
  DELETE FROM public.group_members WHERE group_id = OLD.id;
  DELETE FROM public.group_invites WHERE group_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_group_deleted ON public.shared_groups;
CREATE TRIGGER on_group_deleted
  BEFORE DELETE ON public.shared_groups
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_group_children();

-- ============================================
-- 3) Cascade splits when a group expense is deleted
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_expense_splits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.expense_splits WHERE expense_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_expense_deleted ON public.group_expenses;
CREATE TRIGGER on_expense_deleted
  BEFORE DELETE ON public.group_expenses
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_expense_splits();
