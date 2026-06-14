-- Rename profiles.market_value -> club_value (the club's value, used only for
-- league progression) and add club_funds (the spendable budget, in €M, used to
-- buy collectibles in the Mercado). Both start at 0.
ALTER TABLE public.profiles RENAME COLUMN market_value TO club_value;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS club_funds integer NOT NULL DEFAULT 0;

-- The new-user trigger referenced market_value; let column defaults handle the
-- starting values instead.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
