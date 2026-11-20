import { supabase } from "@/integrations/supabase/client";
import { notifyNewApplication } from './application-notification.functions';
import { uploadError } from './upload-validation';
import { prepareApplicationUploads } from './upload-urls.functions';
export { extOf };

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

function extOf(f: File) {
  const raw = f.name.includes(".") ? (f.name.split(".").pop() ?? "").toLowerCase() : "";
  return /^[a-z0-9]{1,10}$/.test(raw) ? raw : "bin";
}

export async function uploadToSlot(slot: { path: string; token: string }, f: File) {
  const { error } = await supabase.storage.from("candidaturas").uploadToSignedUrl(slot.path, slot.token, f, f.type ? { contentType: f.type } : {});
  if (error) throw error;
  return slot.path;
}

export async function submitApplication(a: ApplicationInput) {
  if (!a.selfie) throw new Error('Please upload a photo of your face (selfie).');
  const selfieError = uploadError(a.selfie, true);
  if (selfieError) throw new Error(selfieError);
  const order = [["curriculo", a.cv], ["carta-ou-certificado", a.extra], ["comprovativo-morada", a.morada], ["selfie", a.selfie]] as const;
  const { id, slots } = await prepareApplicationUploads({ data: { slug: slugName(a.name), files: order.map(([label, f]) => ({ label, ext: extOf(f) })) } });
  const [cv_path, extra_path, morada_path, selfie_path] = (await Promise.all(order.map(([, f], i) => uploadToSlot(slots[i]!, f)))) as [string, string, string, string];
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
    console.warn('The application was saved, but the email notification was not confirmed.');
  }
}
