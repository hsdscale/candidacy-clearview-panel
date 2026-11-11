ALTER POLICY "Members read verified application files" ON storage.objects USING (
  bucket_id = 'candidaturas' AND public.has_role(auth.uid(), 'user'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.applications a WHERE a.verified = true
    AND (storage.objects.name = a.cv_path OR storage.objects.name = a.extra_path OR storage.objects.name = a.morada_path OR storage.objects.name = a.selfie_path)
  )
);