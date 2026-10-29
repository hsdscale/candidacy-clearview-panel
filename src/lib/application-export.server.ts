import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { candidateDocuments, exportEntry, matchesExportGroup, type ExportGroup, type ExportEntry } from './application-export';

export async function prepareExportBatch(client: SupabaseClient<Database>, userId: string, ids: string[], group: ExportGroup): Promise<ExportEntry[]> {
  const { data: admin, error: roleError } = await client.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (roleError || !admin) throw new Error('Só o administrador pode exportar candidaturas.');
  const { data: apps, error } = await client.from('applications')
    .select('id, application_number, name, verified, wrong_docs, uso, cv_path, extra_path, morada_path')
    .in('id', ids).order('application_number');
  if (error) throw new Error('Não foi possível carregar as candidaturas.');
  if (apps.length !== new Set(ids).size || apps.some(a => !matchesExportGroup(a, group))) {
    throw new Error('O grupo mudou. Atualize a lista e tente novamente.');
  }
  const entries: ExportEntry[] = [];
  for (const app of apps) {
    const entry: ExportEntry = { ...exportEntry(app), files: [] };
    for (const doc of candidateDocuments(app)) {
      if (!doc.path) continue;
      const { data: signed, error: signingError } = await client.storage.from('candidaturas').createSignedUrl(doc.path, 600);
      if (signingError || !signed) throw new Error(`Não foi possível preparar um documento da candidatura n.º ${app.application_number}.`);
      entry.files.push({ filename: doc.filename, url: signed.signedUrl });
    }
    entries.push(entry);
  }
  return entries;
}