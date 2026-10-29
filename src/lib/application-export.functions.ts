import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const prepareApplicationExport = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    ids: z.array(z.string().uuid()).min(1).max(25),
    group: z.enum(['todas', 'novas', 'verificadas', 'errados', 'uso']),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { prepareExportBatch } = await import('./application-export.server');
    return prepareExportBatch(context.supabase, context.userId, data.ids, data.group);
  });