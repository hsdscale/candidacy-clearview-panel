import type { AppLike } from './app-state';
import { isNew, isUso, isVer, isWrong, stateName } from './app-state';

export type ExportGroup = 'todas' | 'novas' | 'verificadas' | 'errados' | 'uso';
export const exportLabels: Record<ExportGroup, string> = {
  todas: 'All', novas: 'New', verificadas: 'Verified', errados: 'Incorrect documents', uso: 'In use',
};
export type ExportCandidate = AppLike & {
  id: string; application_number: number; name: string;
  cv_path: string | null; extra_path: string | null; morada_path: string | null; selfie_path?: string | null;
};
export type ExportEntry = {
  id: string; number: number; name: string; state: string; folder: string;
  files: { filename: string; url: string }[];
  missing: string[];
};

export function matchesExportGroup(app: AppLike, group: ExportGroup) {
  return group === 'todas' || ({ novas: isNew, uso: isUso, verificadas: isVer, errados: isWrong }[group])(app);
}

export function safeExportName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'Unnamed';
}

export function candidateFolder(app: Pick<ExportCandidate, 'application_number' | 'name'>) {
  return `${String(app.application_number).padStart(6, '0')}_${safeExportName(app.name)}`;
}

export function candidateDocuments(app: ExportCandidate) {
  return ([['01_Identity-front', app.cv_path], ['02_Identity-back', app.extra_path], ['03_Proof-of-UK-address', app.morada_path], ...(app.selfie_path ? [['04_Verification-video', app.selfie_path] as const] : [])] as const).map(([label, path]) => {
    const ext = path?.split('.').pop()?.toLowerCase();
    return { label, path, filename: `${label}.${ext && /^[a-z0-9]{1,8}$/.test(ext) ? ext : 'bin'}` };
  });
}

export function exportEntry(app: ExportCandidate): Omit<ExportEntry, 'files'> {
  return { id: app.id, number: app.application_number, name: app.name, state: stateName(app), folder: candidateFolder(app), missing: candidateDocuments(app).filter(d => !d.path).map(d => d.label) };
}

const csvCell = (value: string | number) => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
export function exportIndex(entries: ExportEntry[]) {
  return '\uFEFF' + [['Number', 'Name', 'Status', 'Folder', 'Included documents', 'Missing documents'], ...entries.map(e => [e.number, e.name, e.state, e.folder, e.files.map(f => f.filename).join(', '), e.missing.join(', ')])].map(row => row.map(csvCell).join(';')).join('\r\n');
}