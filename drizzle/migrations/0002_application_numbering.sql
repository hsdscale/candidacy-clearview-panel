ALTER TABLE public.applications ADD COLUMN application_number bigint GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1);
ALTER TABLE public.applications ADD CONSTRAINT applications_application_number_unique UNIQUE (application_number);
COMMENT ON COLUMN public.applications.application_number IS 'Permanent auto-assigned candidature number; never reused after deletion.';
CREATE OR REPLACE FUNCTION public.keep_application_number() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.application_number IS DISTINCT FROM OLD.application_number THEN
    RAISE EXCEPTION 'The candidature number cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER applications_keep_number BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.keep_application_number();