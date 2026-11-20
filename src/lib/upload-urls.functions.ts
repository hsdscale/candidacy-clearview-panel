import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const LABELS = ['curriculo', 'carta-ou-certificado', 'comprovativo-morada', 'selfie'] as const;
const files = z.array(z.object({ label: z.enum(LABELS), ext: z.string().max(10) })).min(1).max(4)
  .refine((a) => new Set(a.map((f) => f.label)).size === a.length);

/** New application: the server picks the id and folder; the browser only receives one-time upload tickets. */
export const prepareApplicationUploads = createServerFn({ method: 'POST' })
  .inputValidator((i: unknown) => z.object({ slug: z.string().regex(/^[a-z0-9-]{1,60}$/), files }).parse(i))
  .handler(async ({ data }) => {
    const { signSlots } = await import('./upload-urls.server');
    const id = crypto.randomUUID();
    const folder = `${data.slug}_${id.slice(0, 8)}`;
    return { id, slots: await signSlots(folder, data.files) };
  });

/** Resubmission: only a valid resubmit token unlocks uploads, and only into that application's folder. */
export const prepareResubmitUploads = createServerFn({ method: 'POST' })
  .inputValidator((i: unknown) => z.object({ token: z.string().uuid(), files }).parse(i))
  .handler(async ({ data }) => {
    const { findByToken, folderOf } = await import('./resubmit.server');
    const app = await findByToken(data.token);
    const folder = app ? folderOf(app.cv_path) : null;
    if (!folder) throw new Error('Invalid link');
    const { signSlots } = await import('./upload-urls.server');
    return { slots: await signSlots(folder, data.files, `-reenvio-${Date.now()}`) };
  });
