import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UploadBox } from "@/components/UploadBox";
import { getResubmit, completeResubmit } from "@/lib/resubmit.functions";
import logo from "@/assets/logo.webp";

export const Route = createFileRoute("/reenviar/$token")({
  head: () => ({
    meta: [
      { title: "Reenviar documentos — Alvanto" },
      { name: "description", content: "Volte a enviar os documentos da sua candidatura à Alvanto." },
      { property: "og:title", content: "Reenviar documentos — Alvanto" },
      { property: "og:description", content: "Volte a enviar os documentos da sua candidatura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Resubmit,
});

type Info = { firstName: string; number: number; folder: string | null; needsSelfie: boolean } | null;

function Resubmit() {
  const { token } = Route.useParams();
  const [info, setInfo] = useState<Info | undefined>(undefined);
  const [cv, setCv] = useState<File | null>(null);
  const [extra, setExtra] = useState<File | null>(null);
  const [morada, setMorada] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getResubmit({ data: { token } }).then(setInfo).catch(() => setInfo(null));
  }, [token]);

  const upload = async (folder: string, label: string, f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${folder}/${label}-reenvio-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("candidaturas").upload(path, f, f.type ? { contentType: f.type } : {});
    if (error) throw error;
    return path;
  };

  const send = async () => {
    setTried(true); setErr("");
    if (!cv || !extra || !morada || !info?.folder || (info.needsSelfie && !selfie)) return;
    setSending(true);
    try {
      const [p1, p2, p3, p4] = await Promise.all([
        upload(info.folder, "curriculo", cv), upload(info.folder, "carta-ou-certificado", extra), upload(info.folder, "comprovativo-morada", morada),
        selfie ? upload(info.folder, "selfie", selfie) : Promise.resolve(undefined),
      ]);
      const r = await completeResubmit({ data: { token, cv: p1, extra: p2, morada: p3, selfie: p4 } });
      if (!r.ok) throw new Error();
      setDone(true); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErr("Não foi possível enviar. Verifique a ligação e tente novamente.");
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:h-[72px] sm:px-6">
          <Link to="/" aria-label="Alvanto"><img src={logo} alt="Alvanto" className="h-[24px] w-auto" width={300} height={92} /></Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {info === undefined && <p className="text-center text-muted-foreground">A carregar...</p>}
        {info === null && !done && (
          <div className="rounded-2xl border border-border bg-background p-8 text-center">
            <h1 className="font-display text-2xl font-extrabold text-navy">Link inválido ou já utilizado</h1>
            <p className="mt-2 text-sm text-muted-foreground">Este link já não está ativo. Se recebeu um pedido novo, use o link do email mais recente.</p>
          </div>
        )}
        {done && (
          <div className="rounded-2xl border border-border bg-background p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-navy" />
            <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">Documentos recebidos</h1>
            <p className="mt-2 text-sm text-muted-foreground">Obrigado! A nossa equipa irá analisar os novos documentos e entraremos em contacto se for necessário.</p>
          </div>
        )}
        {info && !done && (
          <div className="rounded-2xl border border-border bg-background p-5 sm:p-8">
            <p className="text-sm font-semibold text-navy">Candidatura n.º {info.number}</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">Reenviar documentos</h1>
            <p className="mt-2 text-sm text-muted-foreground">Olá {info.firstName}, envie novamente documentos nítidos e legíveis.</p>
            <div className="mt-6 space-y-4">
              <UploadBox title="Currículo (CV)" file={cv} onChange={setCv} error={tried && !cv} />
              <UploadBox title="Carta de apresentação ou certificado" file={extra} onChange={setExtra} error={tried && !extra} />
              <UploadBox title="Comprovativo de morada" file={morada} onChange={setMorada} error={tried && !morada} />
              {info.needsSelfie && <UploadBox title="Fotografia do rosto (selfie)" file={selfie} onChange={setSelfie} error={tried && !selfie} photoOnly description="Envie uma fotografia recente sua, com o rosto bem visível." />}
            </div>
            {err && <p className="mt-4 text-sm font-medium text-destructive">{err}</p>}
            <button onClick={send} disabled={sending}
              className="mt-6 w-full rounded-lg bg-navy px-6 py-3.5 text-sm font-semibold text-navy-foreground disabled:opacity-60">
              {sending ? "A enviar..." : "Enviar documentos"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
