CREATE POLICY "Members read verified applications"
ON public.applications
FOR SELECT TO authenticated
USING (verified = true AND public.has_role(auth.uid(), 'user'::app_role));