-- Enums
CREATE TYPE public.finance_kind AS ENUM ('income','expense');
CREATE TYPE public.loan_direction AS ENUM ('taken','given');
CREATE TYPE public.finance_currency AS ENUM ('BDT','CNY','USD');
CREATE TYPE public.recurring_frequency AS ENUM ('daily','weekly','monthly','yearly');

-- Categories
CREATE TABLE public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind public.finance_kind NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT 'indigo',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fc_all" ON public.finance_categories FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.finance_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fs_all" ON public.finance_subcategories FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Transactions
CREATE TABLE public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind public.finance_kind NOT NULL,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.finance_subcategories(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency public.finance_currency NOT NULL DEFAULT 'BDT',
  pay_for TEXT,
  payment_method TEXT,
  receipt_url TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  recurring_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ft_user_date ON public.finance_transactions(user_id, occurred_at DESC);
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ft_all" ON public.finance_transactions FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Loans
CREATE TABLE public.finance_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  direction public.loan_direction NOT NULL,
  person_name TEXT NOT NULL,
  reason TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency public.finance_currency NOT NULL DEFAULT 'BDT',
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  paid_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fl_all" ON public.finance_loans FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Recurring
CREATE TABLE public.finance_recurring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind public.finance_kind NOT NULL,
  service_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency public.finance_currency NOT NULL DEFAULT 'BDT',
  payment_method TEXT,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_renewal_date DATE NOT NULL,
  frequency public.recurring_frequency NOT NULL DEFAULT 'monthly',
  auto_post BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_recurring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fr_all" ON public.finance_recurring FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Budgets
CREATE TABLE public.finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount_limit NUMERIC(14,2) NOT NULL,
  currency public.finance_currency NOT NULL DEFAULT 'BDT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fb_all" ON public.finance_budgets FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Settings (one row per user). Base currency is CNY.
CREATE TABLE public.finance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  primary_currency public.finance_currency NOT NULL DEFAULT 'BDT',
  -- amount of target currency you get for 1 CNY (base = CNY)
  fx_bdt_per_cny NUMERIC(12,4) NOT NULL DEFAULT 15.5,
  fx_usd_per_cny NUMERIC(12,6) NOT NULL DEFAULT 0.14,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fset_all" ON public.finance_settings FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TRIGGER fset_updated BEFORE UPDATE ON public.finance_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for receipts (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('finance-receipts','finance-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Receipts: users read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='finance-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Receipts: users insert own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='finance-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Receipts: users update own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='finance-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Receipts: users delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='finance-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);