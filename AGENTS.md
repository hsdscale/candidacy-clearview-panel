<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Candidate submissions insert directly from the browser (anon insert-only RLS) and upload files to the private `candidaturas` bucket under `<name-slug>_<id8>/`; only `has_role(admin)` can read. Why: public form without login, private review.
- Admin panel lives at `src/routes/_authenticated/admin.tsx`; first account ever created becomes admin via trigger on auth.users. Why: bootstrap owner without manual SQL.
- App emails use the managed synchronous send helper and React Email registry, with no local email queues or tables; /lovable/* bypasses app guards because email handlers authenticate their callers.
- CSRF filters in src/start.ts use the supplied request context pathname, not server-only getRequest(); this keeps server imports out of the client graph while preserving server-function protection.
