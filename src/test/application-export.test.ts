import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { candidateFolder, candidateDocuments, matchesExportGroup, exportIndex, type ExportCandidate } from '@/lib/application-export';
import { prepareExportBatch } from '@/lib/application-export.server';

const app = { id: 'app-61', application_number: 61, name: 'João Silva', verified: true, wrong_docs: false, uso: false, cv_path: 'folder/cv.pdf', extra_path: 'folder/carta.jpg', morada_path: 'folder/morada.png' };
function client(admin: boolean, rows: ExportCandidate[] = [app]) {
  const sign = vi.fn(async () => ({ data: { signedUrl: 'https://example.test/signed' }, error: null }));
  const from = vi.fn(() => ({ select: () => ({ in: () => ({ order: async () => ({ data: rows, error: null }) }) }) }));
  return { from, sign, value: { rpc: async () => ({ data: admin, error: null }), from, storage: { from: () => ({ createSignedUrl: sign }) } } as unknown as SupabaseClient<Database> };
}

describe('Admin document exports', () => {
  it('includes the selfie in the same numbered candidature folder', async () => {
    const c = client(true, [{ ...app, selfie_path: 'folder/selfie.jpg' }]);
    const [entry] = await prepareExportBatch(c.value, 'admin', [app.id], 'verificadas');
    expect(entry?.folder).toBe('000061_Joao-Silva');
    expect(entry?.files.map(f => f.filename)).toContain('04_Selfie.jpg');
    expect(c.sign).toHaveBeenCalledWith('folder/selfie.jpg', 600);
  });
  it('refuses member access before reading candidatures or signing files', async () => {
    const c = client(false);
    await expect(prepareExportBatch(c.value, 'member', [app.id], 'verificadas')).rejects.toThrow('Só o administrador');
    expect(c.from).not.toHaveBeenCalled();
    expect(c.sign).not.toHaveBeenCalled();
  });
  it('includes all three documents for an admin exporting Verified', async () => {
    const c = client(true);
    const result = await prepareExportBatch(c.value, 'admin', [app.id], 'verificadas');
    const entry = result[0];
    if (!entry) throw new Error('Missing export entry');
    expect(entry.number).toBe(61);
    expect(entry.files.map(f => f.filename)).toEqual(['01_Curriculo.pdf', '02_Carta-ou-certificado.jpg', '03_Comprovativo-morada.png']);
    expect(c.sign).toHaveBeenCalledWith('folder/cv.pdf', 600);
  });
  it('exports Em uso without including Verified candidates', () => {
    expect(matchesExportGroup({ verified: false, wrong_docs: false, uso: true }, 'uso')).toBe(true);
    expect(matchesExportGroup(app, 'uso')).toBe(false);
  });
  it('fails when a candidature no longer belongs to the selected group', async () => {
    const c = client(true);
    await expect(prepareExportBatch(c.value, 'admin', [app.id], 'uso')).rejects.toThrow('O grupo mudou');
    expect(c.sign).not.toHaveBeenCalled();
  });
  it('organizes folders using the persisted number, not list position', () => {
    expect(candidateFolder(app)).toBe('000061_Joao-Silva');
    expect(candidateFolder({ ...app, application_number: 102 })).toBe('000102_Joao-Silva');
  });
  it('keeps document names distinct even when original filenames match', () => {
    const docs = candidateDocuments({ ...app, cv_path: 'x/file.pdf', extra_path: 'x/file.pdf', morada_path: 'x/file.pdf' });
    expect(new Set(docs.map(d => d.filename)).size).toBe(3);
  });
  it('reports missing documents rather than presenting them as included', async () => {
    const c = client(true, [{ ...app, extra_path: null }]);
    const [entry] = await prepareExportBatch(c.value, 'admin', [app.id], 'verificadas');
    if (!entry) throw new Error('Missing export entry');
    expect(entry.files).toHaveLength(2);
    expect(entry.missing).toEqual(['02_Carta-ou-certificado']);
    expect(exportIndex([entry])).toContain('02_Carta-ou-certificado');
  });
});