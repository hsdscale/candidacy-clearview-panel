DROP POLICY IF EXISTS "Anyone can submit" ON public.applications;
CREATE POLICY "Anyone can submit" ON public.applications FOR INSERT TO anon, authenticated
WITH CHECK (
  verified = false AND wrong_docs = false AND uso = false
  AND notes IS NULL AND resubmit_token IS NULL
  AND char_length(name) BETWEEN 1 AND 200 AND char_length(email) BETWEEN 3 AND 320
  AND cv_path IS NOT NULL AND split_part(cv_path, '/', 1) LIKE '%\_' || left(id::text, 8)
  AND (extra_path IS NULL OR split_part(extra_path, '/', 1) = split_part(cv_path, '/', 1))
  AND (morada_path IS NULL OR split_part(morada_path, '/', 1) = split_part(cv_path, '/', 1))
  AND (selfie_path IS NULL OR split_part(selfie_path, '/', 1) = split_part(cv_path, '/', 1))
);

DROP POLICY IF EXISTS "Anyone uploads application files" ON storage.objects;
CREATE POLICY "Anyone uploads application files" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'candidaturas'
  AND name ~ '^[a-z0-9-]{1,60}_[0-9a-f]{8}/(curriculo|carta-ou-certificado|comprovativo-morada|selfie)(-reenvio-[0-9]{1,16})?\.[a-z0-9]{1,10}$'
);