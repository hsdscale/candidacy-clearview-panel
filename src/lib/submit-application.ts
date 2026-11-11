import { supabase } from "@/integrations/supabase/client";
import { notifyNewApplication } from './application-notification.functions';
import { uploadError } from './upload-validation';

export function slugName(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "candidato"
  );
}

export type ApplicationInput = {
  name: string; email: string; phone: string;
  hours: string | null; days: string[]; start: string | null; equip: string[];
  exp: string | null; pt: string | null; strengths: string[]; why: string; level: string;
   cv: File; extra: File; morada: File; selfie: File;
};

async function upload(folder: string, label: string, f: File) {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${folder}/${label}.${ext}`;
  const { error } = await supabase.storage.from("candidaturas").upload(path, f, f.type ? { contentType: f.type } : {});
  if (error) throw error;
  return path;
}

export async function submitApplication(a: ApplicationInput) {
  if (!a.selfie) throw new Error('Envie uma fotografia do seu rosto (selfie).');
  const selfieError = uploadError(a.selfie, true);
  if (selfieError) throw new Error(selfieError);
  const id = crypto.randomUUID();
  const folder = `${slugName(a.name)}_${id.slice(0, 8)}`;
  const [cv_path, extra_path, morada_path, selfie_path] = await Promise.all([
    upload(folder, "curriculo", a.cv),
    upload(folder, "carta-ou-certificado", a.extra),
    upload(folder, "comprovativo-morada", a.morada),
    upload(folder, "selfie", a.selfie),
  ]);
  const { error } = await supabase.from("applications").insert({
    id, name: a.name.trim(), email: a.email.trim(), phone: a.phone.trim() || null,
    hours: a.hours, days: a.days, start_when: a.start, equipment: a.equip,
    experience: a.exp, pt_level: a.pt, strengths: a.strengths, why: a.why.trim(), level: a.level,
    cv_path, extra_path, morada_path, selfie_path,
  });
  if (error) throw error;
  try {
    await notifyNewApplication({ data: { applicationId: id } });
  } catch {
    // The saved candidature must not be submitted twice after an email failure.
    console.warn('A candidatura foi guardada, mas o aviso por email não ficou confirmado.');
  }
}
