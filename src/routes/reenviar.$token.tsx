import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { extOf, uploadToSlot } from "@/lib/submit-application";
import { prepareResubmitUploads } from "@/lib/upload-urls.functions";
import { UploadBox } from "@/components/UploadBox";
import { getResubmit, completeResubmit } from "@/lib/resubmit.functions";
import logo from "@/assets/logo.webp";

export const Route = createFileRoute("/reenviar/$token")({
  head: () => ({
    meta: [
      { title: "Resubmit documents — Alvanto" },
      { name: "description", content: "Resubmit the documents for your Alvanto application." },
      { property: "og:title", content: "Resubmit documents — Alvanto" },
      { property: "og:description", content: "Resubmit your application documents." },
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

  const send = async () => {
    setTried(true); setErr("");
    if (!cv || !extra || !morada || !info?.folder || (info.needsSelfie && !selfie)) return;
    setSending(true);
    try {
      const list = [["curriculo", cv], ["carta-ou-certificado", extra], ["comprovativo-morada", morada], ...(selfie ? [["selfie", selfie] as const] : [])] as const;
      const { slots } = await prepareResubmitUploads({ data: { token, files: list.map(([label, f]) => ({ label, ext: extOf(f) })) } });
      const [p1, p2, p3, p4] = await Promise.all(list.map(([, f], i) => uploadToSlot(slots[i]!, f)));
      const r = await completeResubmit({ data: { token, cv: p1!, extra: p2!, morada: p3!, selfie: p4 } });
      if (!r.ok) throw new Error();
      setDone(true); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErr("We could not send your documents. Check your connection and try again.");
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
        {info === undefined && <p className="text-center text-muted-foreground">Loading...</p>}
        {info === null && !done && (
          <div className="rounded-2xl border border-border bg-background p-8 text-center">
            <h1 className="font-display text-2xl font-extrabold text-navy">Invalid or already used link</h1>
            <p className="mt-2 text-sm text-muted-foreground">This link is no longer active. If you received a new request, use the link in the latest email.</p>
          </div>
        )}
        {done && (
          <div className="rounded-2xl border border-border bg-background p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-navy" />
            <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">Documents received</h1>
            <p className="mt-2 text-sm text-muted-foreground">Thank you! Our team will review the new documents and contact you if necessary.</p>
          </div>
        )}
        {info && !done && (
          <div className="rounded-2xl border border-border bg-background p-5 sm:p-8">
            <p className="text-sm font-semibold text-navy">Application # {info.number}</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">Resubmit documents</h1>
            <p className="mt-2 text-sm text-muted-foreground">Hello {info.firstName}, please upload clear, legible documents again.</p>
            <div className="mt-6 space-y-4">
              <UploadBox title="Identity document — front" file={cv} onChange={setCv} error={tried && !cv} />
              <UploadBox title="Identity document — back" file={extra} onChange={setExtra} error={tried && !extra} />
              <UploadBox title="Proof of UK address" file={morada} onChange={setMorada} error={tried && !morada} />
              {info.needsSelfie && <UploadBox title="Photo of your face (selfie)" file={selfie} onChange={setSelfie} error={tried && !selfie} photoOnly description="Upload a recent photo of yourself with your face clearly visible." />}
            </div>
            {err && <p className="mt-4 text-sm font-medium text-destructive">{err}</p>}
            <button onClick={send} disabled={sending}
              className="mt-6 w-full rounded-lg bg-navy px-6 py-3.5 text-sm font-semibold text-navy-foreground disabled:opacity-60">
              {sending ? "Sending..." : "Enviar documentos"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
