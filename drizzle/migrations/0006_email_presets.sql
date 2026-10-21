CREATE TABLE public.email_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(body) BETWEEN 5 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_presets TO authenticated;
GRANT ALL ON public.email_presets TO service_role;
ALTER TABLE public.email_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage presets" ON public.email_presets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));