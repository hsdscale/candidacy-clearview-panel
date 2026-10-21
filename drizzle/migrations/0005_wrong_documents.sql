ALTER TABLE public.applications ADD COLUMN wrong_docs boolean NOT NULL DEFAULT false;
ALTER TABLE public.applications ADD COLUMN resubmit_token uuid UNIQUE;