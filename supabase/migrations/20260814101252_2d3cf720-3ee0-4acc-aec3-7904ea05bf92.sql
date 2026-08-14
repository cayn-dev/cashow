CREATE TABLE IF NOT EXISTS public.bank_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gocardless',
  requisition_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  institution_name TEXT,
  institution_logo TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, requisition_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_connections TO authenticated;
GRANT ALL ON public.bank_connections TO service_role;

ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own bank connections" ON public.bank_connections;
CREATE POLICY "Users manage their own bank connections"
ON public.bank_connections FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_bank_connections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_bank_connections_updated_at ON public.bank_connections;
CREATE TRIGGER update_bank_connections_updated_at
BEFORE UPDATE ON public.bank_connections
FOR EACH ROW EXECUTE FUNCTION public.set_bank_connections_updated_at();

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS external_account_id TEXT,
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.bank_connections(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bank_accounts_external_unique
  ON public.bank_accounts (user_id, external_account_id)
  WHERE external_account_id IS NOT NULL;