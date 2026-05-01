
-- ============ BANK ACCOUNTS ============
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'checking', -- checking, savings, credit, cash, investment
  bank_name text,
  icon text DEFAULT '🏦',
  color text DEFAULT '#888888',
  current_balance numeric NOT NULL DEFAULT 0,
  initial_balance numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bank accounts" ON public.bank_accounts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER bank_accounts_updated BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Add bank_account_id to transactions
ALTER TABLE public.transactions ADD COLUMN bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- ============ CSV IMPORTS ============
CREATE TABLE public.csv_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  filename text NOT NULL,
  rows_imported integer DEFAULT 0,
  rows_skipped integer DEFAULT 0,
  hash text, -- file content hash for dedup
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.csv_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own imports" ON public.csv_imports
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SHARED GROUPS ============
CREATE TABLE public.shared_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  emoji text DEFAULT '👥',
  type text NOT NULL DEFAULT 'group', -- group, couple, trip, roommates
  currency text DEFAULT 'EUR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'member', -- owner, member
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_groups
    WHERE id = _group_id AND owner_id = _user_id
  );
$$;

-- Policies for shared_groups
CREATE POLICY "Members view groups" ON public.shared_groups
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.is_group_member(id, auth.uid()));

CREATE POLICY "Users create groups" ON public.shared_groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner updates group" ON public.shared_groups
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner deletes group" ON public.shared_groups
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Policies for group_members
CREATE POLICY "Members view members" ON public.group_members
  FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()) OR public.is_group_owner(group_id, auth.uid()));

CREATE POLICY "Owner adds members" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_owner(group_id, auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Owner removes members" ON public.group_members
  FOR DELETE TO authenticated
  USING (public.is_group_owner(group_id, auth.uid()) OR auth.uid() = user_id);

-- Auto-add owner as member
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, display_name)
  VALUES (NEW.id, NEW.owner_id, 'owner', NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created AFTER INSERT ON public.shared_groups
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- ============ GROUP INVITES ============
CREATE TABLE public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  used boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated with the token can read (link sharing)
CREATE POLICY "Anyone can view invites by token" ON public.group_invites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members create invites" ON public.group_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Members update own invites" ON public.group_invites
  FOR UPDATE TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

-- ============ GROUP EXPENSES + SPLITS ============
CREATE TABLE public.group_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
  paid_by uuid NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'other',
  date timestamptz NOT NULL DEFAULT now(),
  split_type text NOT NULL DEFAULT 'equal', -- equal, custom, percentage
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view expenses" ON public.group_expenses
  FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members add expenses" ON public.group_expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id, auth.uid()) AND auth.uid() = paid_by);

CREATE POLICY "Payer updates expense" ON public.group_expenses
  FOR UPDATE TO authenticated
  USING (auth.uid() = paid_by);

CREATE POLICY "Payer deletes expense" ON public.group_expenses
  FOR DELETE TO authenticated
  USING (auth.uid() = paid_by);

CREATE TRIGGER group_expenses_updated BEFORE UPDATE ON public.group_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.group_expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(expense_id, user_id)
);

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.expense_group_id(_expense_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id FROM public.group_expenses WHERE id = _expense_id;
$$;

CREATE POLICY "Members view splits" ON public.expense_splits
  FOR SELECT TO authenticated
  USING (public.is_group_member(public.expense_group_id(expense_id), auth.uid()));

CREATE POLICY "Members create splits" ON public.expense_splits
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(public.expense_group_id(expense_id), auth.uid()));

CREATE POLICY "Members update own split" ON public.expense_splits
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_group_member(public.expense_group_id(expense_id), auth.uid()));

CREATE POLICY "Members delete splits" ON public.expense_splits
  FOR DELETE TO authenticated
  USING (public.is_group_member(public.expense_group_id(expense_id), auth.uid()));

-- Indexes
CREATE INDEX idx_bank_accounts_user ON public.bank_accounts(user_id);
CREATE INDEX idx_transactions_account ON public.transactions(bank_account_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_expenses_group ON public.group_expenses(group_id);
CREATE INDEX idx_expense_splits_expense ON public.expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user ON public.expense_splits(user_id);
CREATE INDEX idx_group_invites_token ON public.group_invites(token);
