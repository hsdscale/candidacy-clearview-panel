LOCK TABLE public.applications IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.applications) THEN
    RAISE EXCEPTION 'Cannot initialise numbering while candidatures exist';
  END IF;
END $$;
ALTER SEQUENCE public.applications_application_number_seq RESTART WITH 1;