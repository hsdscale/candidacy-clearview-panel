import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, CreditCard, Loader2, RotateCcw, AlertCircle } from "lucide-react";
import { KycVideoCaptureUltra } from "@/components/KycVideoCaptureUltra";

// Unified identity step: ID front photo -> ID back photo -> liveness video -> done.
// Files are kept in the form and sent privately with the application on submit.
type Props = {
  front: File | null; back: File | null; video: File | null;
  onFront: (f: File | null) => void; onBack: (f: File | null) => void; onVideo: (f: File | null) => void;
  error?: boolean;
};

const DOCS = [
  { title: "ID Front Side", desc: "Position the front of your UK passport or ID inside the frame" },
  { title: "ID Back Side", desc: "Now position the back of your document inside the frame" },
] as const;

function DocCapture({ index, onCaptured }: { index: 0 | 1; onCaptured: (f: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "processing" | "success" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setState("ready");
      })
      .catch(() => setState("error"));
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setState("processing");
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob((blob) => {
      if (!blob) { setState("ready"); return; }
      setState("success");
      window.setTimeout(() => onCaptured(new File([blob], `id-${index === 0 ? "front" : "back"}.jpg`, { type: "image/jpeg" })), 900);
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-3xl border-[6px] border-background bg-navy shadow-2xl">
        <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`h-[62%] w-[82%] rounded-xl border-2 border-dashed transition-all ${state === "success" ? "border-neon shadow-[0_0_25px_var(--neon)]" : "animate-pulse border-navy-foreground/70"}`} />
        </div>
        {(state === "loading" || state === "processing") && (
          <span className="absolute inset-0 flex items-center justify-center text-navy-foreground"><Loader2 className="h-8 w-8 animate-spin" /></span>
        )}
        {state === "success" && (
          <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-neon text-navy shadow-[0_0_24px_var(--neon)]"><CheckCircle2 className="h-10 w-10" strokeWidth={3} /></span></span>
        )}
      </div>
      <div>
        <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-azure/10 text-azure"><CreditCard className="h-5 w-5" /></span>
        <h3 className="text-2xl font-extrabold tracking-tight text-navy">{state === "success" ? "Captured!" : DOCS[index].title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{state === "error" ? "We could not access your camera. Check the browser permissions and reload the page." : DOCS[index].desc}</p>
      </div>
      {state === "ready" && (
        <button type="button" onClick={capture} className="inline-flex items-center gap-2 rounded-full bg-navy px-8 py-3.5 font-bold text-navy-foreground shadow-xl transition hover:opacity-90 active:scale-95">
          <Camera className="h-5 w-5" /> Capture
        </button>
      )}
    </div>
  );
}

export function KycUnifiedStep4({ front, back, video, onFront, onBack, onVideo, error }: Props) {
  const sub = !front ? 0 : !back ? 1 : !video ? 2 : 3;
  const restart = () => { onVideo(null); onBack(null); onFront(null); };
  return (
    <div>
      <div className="mb-6 flex gap-2" aria-hidden>
        {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= sub ? "bg-azure" : "bg-border"}`} />)}
      </div>
      <div className={`rounded-xl border-2 border-dashed bg-background p-6 ${error && sub < 3 ? "border-destructive" : "border-border"}`}>
        {sub === 0 && <DocCapture key="front" index={0} onCaptured={onFront} />}
        {sub === 1 && <DocCapture key="back" index={1} onCaptured={onBack} />}
        {sub === 2 && <KycVideoCaptureUltra file={null} onChange={onVideo} />}
        {sub === 3 && (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-16 w-16 animate-in zoom-in-50 items-center justify-center rounded-full bg-neon text-navy shadow-[0_0_24px_var(--neon)]"><CheckCircle2 className="h-10 w-10" strokeWidth={3} /></span>
            <h3 className="text-2xl font-extrabold tracking-tight text-navy">Verification Complete</h3>
            <p className="text-sm text-muted-foreground">Your identity checks will be sent securely with your application.</p>
            <button type="button" onClick={restart} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"><RotateCcw className="h-4 w-4" /> Start again</button>
          </div>
        )}
      </div>
      {error && sub < 3 && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" /> Please complete all identity checks.</p>
      )}
    </div>
  );
}
