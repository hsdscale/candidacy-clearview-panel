import { supabaseAdmin } from '@/integrations/supabase/client.server';

/** Caller must already be verified as admin. Lists all auth accounts with their role. */
export async function listTeam() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error('Could not list team members');
  const { data: roles } = await supabaseAdmin.from('user_roles').select('user_id, role');
  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      role: (roles?.find((r) => r.user_id === u.id)?.role ?? null) as 'admin' | 'user' | null,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** Caller must already be verified as admin. Grants or revokes the limited 'user' role. Never touches admins. */
export async function setMemberAccess(userId: string, grant: boolean) {
  const { data: roles } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', userId);
  if (roles?.some((r) => r.role === 'admin')) throw new Error('Cannot change administrator access');
  if (grant) {
    const { error } = await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'user' });
    if (error) throw new Error('Could not grant access');
  } else {
    const { error } = await supabaseAdmin.from('user_roles').delete().eq('user_id', userId).eq('role', 'user');
    if (error) throw new Error('Could not remove access');
  }
  return { ok: true };
}

/**
 * Members (role 'user') may only update notes on verified applications; admins may update notes on any.
 * Only the notes column is ever written here.
 */
export async function saveNote(id: string, notes: string, asAdmin: boolean) {
  let q = supabaseAdmin.from('applications').update({ notes }).eq('id', id);
  if (!asAdmin) q = q.eq('verified', true);
  const { data, error } = await q.select('id');
  if (error) throw new Error('Could not save the note');
  if (!data?.length) throw new Error('You do not have permission to edit this application');
  return { ok: true };
}
