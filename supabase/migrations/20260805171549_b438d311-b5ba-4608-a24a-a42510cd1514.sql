ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS salary_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salary_frequency text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS salary_is_gross boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monthly_spending_limit numeric NOT NULL DEFAULT 0;