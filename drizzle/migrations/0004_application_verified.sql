ALTER TABLE public.applications ADD COLUMN verified boolean NOT NULL DEFAULT false;
UPDATE public.applications a SET verified = true WHERE EXISTS (SELECT 1 FROM public.application_tags at JOIN public.tags t ON t.id = at.tag_id WHERE at.application_id = a.id AND lower(t.name) LIKE 'verific%');
CREATE OR REPLACE FUNCTION public.force_new_unverified() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.verified := false; RETURN NEW; END $$;
CREATE TRIGGER applications_force_unverified BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.force_new_unverified();
COMMENT ON TABLE public.tags IS 'DEPRECATED: replaced by applications.verified';
COMMENT ON TABLE public.application_tags IS 'DEPRECATED: replaced by applications.verified';