import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

type Ctx = { supabase: any; userId: string };
async function hasRole(context: Ctx, role: 'admin' | 'user') {
  const { data } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: role });
  return !!data;
}

export const listTeamUsers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await hasRole(context as Ctx, 'admin'))) throw new Error('Sem permissão');
    const { listTeam } = await import('./team.server');
    return listTeam();
  });

export const setMemberAccess = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), grant: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    if (!(await hasRole(context as Ctx, 'admin'))) throw new Error('Sem permissão');
    const { setMemberAccess: apply } = await import('./team.server');
    return apply(data.userId, data.grant);
  });

export const saveMemberNote = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), notes: z.string().max(5000) }).parse(i))
  .handler(async ({ data, context }) => {
    const admin = await hasRole(context as Ctx, 'admin');
    const member = await hasRole(context as Ctx, 'user');
    if (!admin && !member) throw new Error('Sem permissão');
    const { saveNote } = await import('./team.server');
    return saveNote(data.id, data.notes, admin);
  });
