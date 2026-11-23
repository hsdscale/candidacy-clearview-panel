import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, CheckCircle2, AlertCircle, Video } from "lucide-react";

const HOLD_MS = 3000;
const MAX_MS = 45000;
// Nose position between the jaw edges on the raw (unmirrored) camera image: 0 = image left, 1 = image right.
function yawRatio(pts: { x: number }[]) {
  const l = pts[0]!.x, r = pts[16]!.x, n = pts[30]!.x;
  return (n - l) / (r - l || 1);
}
const STEP_OK = [
  (y: number) => y > 0.4 && y < 0.6,
  (y: number) => y < 0.32, // user's right appears on the image left
  (y: number) => y > 0.68,
];
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
  const [ready, setReady] = useState(false);
  const [faceSeen, setFaceSeen] = useState(false);
  const [holding, setHolding] = useState(false);
  const faceapiRef = useRef<typeof import("face-api.js") | null>(null);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const holdRef = useRef(0);
  const doneRef = useRef(!!file);

  useEffect(() => stopAll, []);
  useEffect(() => {
    if (!file && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [file, cameraOn]);

  const stopAll = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
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
      const faceapi = await import("face-api.js");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      ]);
      faceapiRef.current = faceapi;
      setReady(true);
      loop();
    } catch {
      setErr("We could not access your camera. Check the browser permissions and try again.");
    }
  };

  const loop = async () => {
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video || !streamRef.current) return;
    if (video.readyState >= 2) {
      const det = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks();
      setFaceSeen(!!det);
      if (det && !recorderRef.current && !doneRef.current) startRecording();
      if (!det) { holdRef.current = 0; setHolding(false); }
      if (det && recorderRef.current) {
        const ok = STEP_OK[stepRef.current]?.(yawRatio(det.landmarks.positions));
        const now = performance.now();
        if (!ok) holdRef.current = 0;
        else if (!holdRef.current) holdRef.current = now;
        setHolding(!!ok);
        if (ok && now - holdRef.current >= HOLD_MS) {
          holdRef.current = 0;
          setHolding(false);
          stepRef.current += 1;
          if (stepRef.current >= STEPS.length) {
            stopRecording(true);
          } else setStep(stepRef.current);
        }
      }
    }
    if (streamRef.current) rafRef.current = requestAnimationFrame(() => void loop());
  };

  const finish = (mime: string) => {
    const blob = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];
    doneRef.current = true;
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
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 1_000_000 } : { videoBitsPerSecond: 1_000_000 });
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
    stepRef.current = 0;
    holdRef.current = 0;
    timersRef.current.push(window.setTimeout(() => {
      stopRecording(false);
      // Discard the partial video; the check restarts when the face is seen again.
      setErr("We couldn't confirm the movements in time. Make sure your face is well lit and try again.");
    }, MAX_MS));
  };

  const msg = err ?? (error && !file ? (errorMsg ?? "Please record the verification video.") : null);

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
            <p className="mt-4 text-lg font-bold tracking-tight text-navy">Verification complete</p>
            <button
              type="button"
              onClick={() => { doneRef.current = false; setErr(null); onChange(null); }}
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
            </div>
            {cameraOn && (
              <div className="mt-4 flex gap-2" aria-hidden>
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-1.5 w-10 rounded-full transition-colors duration-500 ${recording && i <= step ? "bg-azure" : "bg-border"}`} />
                ))}
              </div>
            )}
            <p className="mt-4 text-lg font-bold tracking-tight text-navy">
              {!cameraOn ? "Identity verification" : !ready ? "Preparing…" : (STEPS[recording ? step : 0] ?? STEPS[0])}
            </p>
            {recording && holding && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success" role="status">
                <CheckCircle2 className="h-4 w-4" /> Perfect! Hold still…
              </p>
            )}
            {cameraOn && ready && !faceSeen && <p className="mt-2 text-sm text-muted-foreground">We can't see your face yet.</p>}
            {!cameraOn && (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  A short video of your face is recorded while you follow three movements, and sent with your application.
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-navy-foreground transition hover:opacity-90"
                >
                  <Camera className="h-4 w-4" /> Enable camera
                </button>
              </>
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
