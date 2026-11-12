import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Archive, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { prepareApplicationExport } from '@/lib/application-export.functions';
import { exportIndex, exportLabels, safeExportName, type ExportEntry, type ExportGroup } from '@/lib/application-export';
import { deliverFile } from '@/lib/download-file';

export function ApplicationExport({ ids, group }: { ids: string[]; group: ExportGroup }) {
  const prepare = useServerFn(prepareApplicationExport);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState<{ blob: Blob; name: string; count: number; missing: number } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const generate = async () => {
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); setReady(null); setError('');
    const selected = [...ids];
    const selectedGroup = group;
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const root = safeExportName(exportLabels[selectedGroup]);
      const entries: ExportEntry[] = [];
      let bytes = 0;
      for (let i = 0; i < selected.length; i += 25) {
        if (abort.signal.aborted) return;
        setProgress(`Preparing applications ${i + 1}–${Math.min(i + 25, selected.length)} de ${selected.length}…`);
        const batch = await prepare({ data: { ids: selected.slice(i, i + 25), group: selectedGroup } });
        for (const entry of batch) {
          if (abort.signal.aborted) return;
          const folder = `${root}/${entry.folder}`;
          zip.file(`${folder}/Application.txt`, `Application # ${entry.number}\nName: ${entry.name}\nStatus: ${entry.state}\n${entry.missing.length ? `Missing documents: ${entry.missing.join(', ')}\n` : ''}`);
          for (const file of entry.files) {
            setProgress(`Collecting documents — application # ${entry.number} (${entries.length + 1}/${selected.length})…`);
            const response = await fetch(file.url, { signal: abort.signal });
            if (!response.ok) throw new Error(`Could not retrieve a document for application # ${entry.number}. Please try again.`);
            const content = await response.arrayBuffer();
            bytes += content.byteLength;
            if (bytes > 200 * 1024 * 1024) throw new Error('This selection exceeds 200 MB. Use search to export smaller groups.');
            zip.file(`${folder}/${file.filename}`, content);
          }
          entries.push(entry);
        }
      }
      zip.file(`${root}/Index.csv`, exportIndex(entries));
      setProgress('Creating ZIP…');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE', mimeType: 'application/zip' });
      if (!abort.signal.aborted) setReady({ blob, name: `Applications_${root}_${new Date().toISOString().slice(0, 10)}.zip`, count: entries.length, missing: entries.reduce((n, e) => n + e.missing.length, 0) });
    } catch (e) {
      if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Could not create the export. Please try again.');
    } finally { setBusy(false); }
  };

  return <>
    <Button variant="outline" disabled={!ids.length} onClick={() => { setError(''); setReady(null); setOpen(true); }}>
      <Archive /> Export documents
    </Button>
    <Dialog open={open} onOpenChange={value => { if (!value) { controller.current?.abort(); setReady(null); } setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>Export — {exportLabels[group]}</DialogTitle>
          <DialogDescription>{ids.length} candidatura{ids.length === 1 ? '' : 's'} in the current list{'.'}</DialogDescription>
        </DialogHeader>
        {!ready && !busy && <p className="text-sm text-muted-foreground">ZIP with a folder for each application number and name, labelled documents and an index for Excel. Your current search is applied.</p>}
        {busy && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />{progress}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {ready && <p role="status" className="text-sm">ZIP ready: {ready.count} candidaturas · {(ready.blob.size / 1024 / 1024).toFixed(1)} MB{ready.missing ? ` · ${ready.missing} documents not submitted (listed in the index).` : '.'}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => { controller.current?.abort(); setReady(null); setOpen(false); }}>{busy ? 'Cancel' : 'Close'}</Button>
          {ready ? <Button onClick={() => void deliverFile(ready.blob, ready.name)}><Download />Download ZIP</Button> : <Button disabled={busy || !ids.length} onClick={() => void generate()}><Archive />{busy ? 'Preparing…' : 'Prepare ZIP'}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}