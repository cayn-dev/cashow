
-- Correggo la funzione con nome parametro diverso
CREATE OR REPLACE FUNCTION public.calculate_next_run_date(
  p_current_date DATE,
  p_frequency TEXT
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'daily' THEN p_current_date + INTERVAL '1 day'
    WHEN 'weekly' THEN p_current_date + INTERVAL '1 week'
    WHEN 'biweekly' THEN p_current_date + INTERVAL '2 weeks'
    WHEN 'monthly' THEN p_current_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN p_current_date + INTERVAL '3 months'
    WHEN 'yearly' THEN p_current_date + INTERVAL '1 year'
    ELSE p_current_date + INTERVAL '1 month'
  END;
END;
$$;

-- Aggiorno anche la funzione di processamento per usare il nuovo nome
CREATE OR REPLACE FUNCTION public.process_recurring_transactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  processed_count INTEGER := 0;
BEGIN
  FOR rec IN
    SELECT * FROM public.recurring_transactions
    WHERE is_active = true
      AND next_run_at <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  LOOP
    INSERT INTO public.transactions (
      user_id, type, amount, category, description,
      payment_method, is_salary, recurring_source_id, date
    ) VALUES (
      rec.user_id, rec.type, rec.amount, rec.category, rec.description,
      rec.payment_method, rec.is_salary, rec.id, rec.next_run_at
    );
    
    UPDATE public.recurring_transactions
    SET 
      last_run_at = rec.next_run_at,
      next_run_at = public.calculate_next_run_date(rec.next_run_at, rec.frequency),
      updated_at = now()
    WHERE id = rec.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$;
