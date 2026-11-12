import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const markWrongDocs = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), message: z.string().trim().min(5).max(3000) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Permission denied');
    const { markWrongDocsAndEmail } = await import('./resubmit.server');
    return markWrongDocsAndEmail(data.id, data.message);
  });

export const getResubmit = createServerFn({ method: 'POST' })
  .inputValidator((i: unknown) => z.object({ token: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { findByToken, folderOf } = await import('./resubmit.server');
    const app = await findByToken(data.token);
    if (!app) return null;
    return { firstName: app.name.split(' ')[0] ?? '', number: app.application_number, folder: folderOf(app.cv_path) ?? null, needsSelfie: !!app.selfie_path };
  });

const pathSchema = z.string().min(3).max(200);
export const completeResubmit = createServerFn({ method: 'POST' })
  .inputValidator((i: unknown) => z.object({
    token: z.string().uuid(), cv: pathSchema, extra: pathSchema, morada: pathSchema, selfie: pathSchema.optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    const { finishResubmit } = await import('./resubmit.server');
    return finishResubmit(data.token, data);
  });
