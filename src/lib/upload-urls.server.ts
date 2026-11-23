import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const LABELS = ['curriculo', 'carta-ou-certificado', 'comprovativo-morada', 'selfie'] as const;
export type Label = (typeof LABELS)[number];
export type UploadSlot = { label: Label; path: string; token: string };

export function safeExt(ext: string) {
  const e = ext.toLowerCase();
  return /^(pdf|docx?|jpe?g|png|webm|mp4)$/.test(e) ? e : 'bin';
}

export async function signSlots(folder: string, files: { label: Label; ext: string }[], suffix = ''): Promise<UploadSlot[]> {
  const slots: UploadSlot[] = [];
  for (const f of files) {
    const path = `${folder}/${f.label}${suffix}.${safeExt(f.ext)}`;
    const { data, error } = await supabaseAdmin.storage.from('candidaturas').createSignedUploadUrl(path);
    if (error || !data) throw new Error('Could not prepare the upload');
    slots.push({ label: f.label, path, token: data.token });
  }
  return slots;
}
