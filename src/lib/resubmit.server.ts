import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { sendTemplateEmail } from './email-templates/send-email';

const SITE_URL = 'https://amasom.store';

export function folderOf(path: string | null) {
  return path ? (path.split('/')[0] ?? null) : null;
}

/** Caller must already be verified as admin. */
export async function markWrongDocsAndEmail(id: string, message?: string) {
  const token = crypto.randomUUID();
  const { data, error } = await supabaseAdmin.from('applications')
    .update({ wrong_docs: true, verified: false, resubmit_token: token })
    .eq('id', id).select('name, email, application_number').maybeSingle();
  if (error || !data) throw new Error('Candidatura não encontrada');
  const result = await sendTemplateEmail('wrong-documents', data.email, {
    templateData: { candidateName: data.name, applicationNumber: data.application_number, link: `${SITE_URL}/reenviar/${token}`, message },
    idempotencyKey: `wrong-docs-${token}`,
  });
  return { emailed: result.sent };
}

export async function findByToken(token: string) {
  const { data, error } = await supabaseAdmin.from('applications')
    .select('id, name, application_number, cv_path, selfie_path').eq('resubmit_token', token).maybeSingle();
  if (error) throw new Error('Erro ao verificar o link');
  return data;
}

export async function finishResubmit(token: string, paths: { cv: string; extra: string; morada: string; selfie?: string | undefined }) {
  const app = await findByToken(token);
  if (!app) return { ok: false };
  if (app.selfie_path && !paths.selfie) throw new Error('Envie uma nova selfie.');
  const folder = folderOf(app.cv_path);
  if (!folder || ![paths.cv, paths.extra, paths.morada, ...(paths.selfie ? [paths.selfie] : [])].every((p) => p.startsWith(`${folder}/`) && !p.includes('..'))) {
    throw new Error('Ficheiros inválidos');
  }
  const { error } = await supabaseAdmin.from('applications').update({
    cv_path: paths.cv, extra_path: paths.extra, morada_path: paths.morada,
    ...(paths.selfie ? { selfie_path: paths.selfie } : {}),
    wrong_docs: false, verified: false, resubmit_token: null,
  }).eq('id', app.id);
  if (error) throw new Error('Não foi possível guardar');
  return { ok: true };
}
