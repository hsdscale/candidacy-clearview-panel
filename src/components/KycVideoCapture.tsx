import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, CheckCircle2, AlertCircle, Video } from "lucide-react";

const STEP_MS = 4000;
const STEPS = [
  "Centre your face in the circle",
  "Now turn your head to the RIGHT",
  "Now turn your head to the LEFT",
];
const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

type Props = {
  file: File | null;
  onChange: (f: File | null) => void;
  error?: boolean;
  errorMsg?: string;
};

export function KycVideoCapture({ file, onChange, error, errorMsg }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timersRef = useRef<number[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => stopAll, []);

  const stopAll = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setErr("We could not access your camera. Check the browser permissions and try again.");
    }
  };

  const finish = (mime: string) => {
    const blob = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    onChange(new File([blob], `verification.${ext}`, { type: mime }));
    setRecording(false);
  };

  const stopRecording = (save: boolean) => {
    const recorder = recorderRef.current;
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (!recorder) return setRecording(false);
    if (!save) recorder.onstop = null;
    recorderRef.current = null;
    try {
      recorder.stop();
    } catch {
      /* already stopped */
    }
    if (!save) setRecording(false);
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    let recorder: MediaRecorder;
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch {
      setErr("Your browser does not support video recording. Please try another browser.");
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => finish(recorder.mimeType || mime || "video/webm");
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setStep(0);
    timersRef.current.push(window.setTimeout(() => setStep(1), STEP_MS));
    timersRef.current.push(window.setTimeout(() => setStep(2), STEP_MS * 2));
    timersRef.current.push(window.setTimeout(() => stopRecording(true), STEP_MS * 3));
  };

  const msg = err ?? (error && !file ? (errorMsg ?? "Please record the verification video.") : null);
  const size = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "";

  return (
    <div>
      <div
        className={`flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background p-6 text-center ${
          msg ? "border-destructive" : file ? "border-navy/40" : "border-border"
        }`}
      >
        {file ? (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-navy">Identity verification video</p>
            <p className="mt-2 max-w-full truncate text-sm text-muted-foreground">{file.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{size}</p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
            >
              <RotateCcw className="h-4 w-4" /> Record again
            </button>
          </>
        ) : (
          <>
            <div className={`relative aspect-square w-full max-w-[260px] overflow-hidden rounded-full border-4 bg-navy transition-all duration-700 ${recording ? "scale-105 border-azure shadow-[0_0_40px_var(--azure)]" : cameraOn ? "animate-pulse border-azure/60 shadow-[0_0_20px_var(--azure)]" : "border-border"}`}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              />
              {!cameraOn && (
                <span className="absolute inset-0 flex items-center justify-center text-navy-foreground">
                  <Video className="h-10 w-10 opacity-60" />
                </span>
              )}
              {recording && (
                <span className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-navy">
                  <span className="h-2.5 w-2.5 animate-ping rounded-full bg-destructive" />
                  Recording…
                </span>
              )}
            </div>
            {recording && (
              <div className="mt-4 flex gap-2" aria-hidden>
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-1.5 w-10 rounded-full transition-colors duration-500 ${i <= step ? "bg-azure" : "bg-border"}`} />
                ))}
              </div>
            )}
            <p className="mt-4 text-lg font-bold tracking-tight text-navy">{recording ? `Step ${step + 1} of 3` : "Identity verification video"}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {recording
                ? (STEPS[step] ?? STEPS[0])
                : cameraOn
                  ? "Centre your face and follow the on-screen instructions."
                  : "Record a short video: centre your face, then turn your head to each side."}
            </p>
            {!recording ? (
              <button
                type="button"
                onClick={cameraOn ? startRecording : startCamera}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-navy-foreground transition hover:opacity-90"
              >
                <Camera className="h-4 w-4" />
                {cameraOn ? "Start recording" : "Enable camera"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => stopRecording(false)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-6 py-2.5 text-sm font-semibold text-navy transition hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" /> Cancel and restart
              </button>
            )}
          </>
        )}
      </div>
      {msg && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {msg}
        </p>
      )}
    </div>
  );
}
