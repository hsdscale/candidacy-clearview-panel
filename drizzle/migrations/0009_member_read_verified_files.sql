create policy "Members read verified application files" on storage.objects for select to authenticated
using (
  bucket_id = 'candidaturas'
  and public.has_role(auth.uid(), 'user')
  and exists (
    select 1 from public.applications a
    where a.verified = true
      and storage.objects.name in (a.cv_path, a.extra_path, a.morada_path)
  )
);