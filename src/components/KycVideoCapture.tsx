import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, AlertCircle, Loader2, RotateCcw } from "lucide-react";

// Liveness check based on the supplied KYCVideoCapturePro: noseOffset detection,
// 200 ms polling and a 3 s hold per step that resets when the person moves.
const HOLD_MS = 2000;
const POLL_MS = 150;
const AUTO_START_POLL_MS = 500;
const STEPS = [
  { text: "Center your face in the circle", target: "center" },
  { text: "Turn your head to the RIGHT", target: "right" },
  { text: "Turn your head to the LEFT", target: "left" },
] as const;
const MIME_CANDIDATES = ["video/webm;codecs=vp8", "video/webm;codecs=vp9", "video/webm", "video/mp4"];

type Status = "idle" | "loading" | "waiting" | "recording" | "success" | "error";
type Props = { file: File | null; onChange: (f: File | null) => void; error?: boolean; errorMsg?: string };

export function KycVideoCapture({ file, onChange, error, errorMsg }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const busyRef = useRef(false);
  const faceapiRef = useRef<typeof import("face-api.js") | null>(null);
  const [status, setStatus] = useState<Status>(file ? "success" : "idle");
  const [step, setStep] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const resetTimer = () => {
    setIsHolding(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const stopAll = () => {
    resetTimer();
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    const r = recorderRef.current;
    if (r && r.state !== "inactive") { r.onstop = null; r.stop(); } // discard unfinished video
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => {
    if (!file) void startCamera();
    return stopAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setErr(null);
    setStatus("loading");
    try {
      const faceapi = await import("face-api.js");
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      faceapiRef.current = faceapi;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("waiting");
      intervalRef.current = window.setInterval(() => void waitForFace(), AUTO_START_POLL_MS);
    } catch {
      setStatus("error");
      setErr("We could not access your camera. Check the browser permissions and try again.");
    }
  };

  // Auto-start: begin recording as soon as a face is first detected.
  const waitForFace = async () => {
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video || busyRef.current || recorderRef.current || video.readyState < 2) return;
    busyRef.current = true;
    try {
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
      if (detection && !recorderRef.current && streamRef.current) startRecording();
    } finally {
      busyRef.current = false;
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    setIsHolding(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setIsHolding(false);
      if (stepRef.current < STEPS.length - 1) {
        stepRef.current += 1;
        setStep(stepRef.current);
      } else stopRecording();
    }, HOLD_MS);
  };

  const detectFace = async () => {
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video || busyRef.current || video.readyState < 2) return;
    busyRef.current = true;
    try {
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
      if (!recorderRef.current) return;
      if (!detection) return resetTimer();
      const landmarks = detection.landmarks;
      const nose = landmarks.getNose()[0]!;
      const leftEye = landmarks.getLeftEye()[0]!;
      const rightEye = landmarks.getRightEye()[0]!;
      const faceWidth = Math.abs(rightEye.x - leftEye.x);
      const noseOffset = (nose.x - (leftEye.x + rightEye.x) / 2) / faceWidth;
      let currentTarget = "";
      if (Math.abs(noseOffset) < 0.15) currentTarget = "center";
      else if (noseOffset > 0.15) currentTarget = "right";
      else if (noseOffset < -0.15) currentTarget = "left";
      if (currentTarget === STEPS[stepRef.current]?.target) startTimer();
      else resetTimer();
    } finally {
      busyRef.current = false;
    }
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      setErr("Your browser does not support video recording. Please try another browser.");
      return;
    }
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const type = recorder.mimeType || mime || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      onChange(new File([blob], `verification.${type.includes("mp4") ? "mp4" : "webm"}`, { type }));
      setStatus("success");
    };
    recorderRef.current = recorder;
    recorder.start(250);
    stepRef.current = 0;
    setStep(0);
    setStatus("recording");
    intervalRef.current = window.setInterval(() => void detectFace(), POLL_MS);
  };

  const stopRecording = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    resetTimer();
    const r = recorderRef.current;
    recorderRef.current = null;
    if (r && r.state !== "inactive") r.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const redo = () => { stopAll(); onChange(null); stepRef.current = 0; setStep(0); void startCamera(); };
  const msg = err ?? (error && !file ? (errorMsg ?? "Please record the verification video.") : null);
  const done = status === "success" && file;

  return (
    <div>
      <div className={`flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed bg-background p-6 text-center ${msg ? "border-destructive" : "border-border"}`}>
        {!done && (
          <div className="relative aspect-square w-full max-w-[288px] overflow-hidden rounded-full border-[6px] border-border bg-navy shadow-2xl transition-all duration-500">
            <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className={`h-[83%] w-[83%] rounded-full border-4 transition-all duration-700 ${status === "recording" && isHolding ? "scale-105 border-neon shadow-[0_0_25px_var(--neon),0_0_60px_var(--neon),inset_0_0_25px_var(--neon)]" : status === "recording" ? "border-azure shadow-[0_0_24px_var(--azure)]" : "border-navy-foreground/40"} ${status === "waiting" ? "animate-pulse" : ""}`} />
            </div>
            {status === "loading" && (
              <span className="absolute inset-0 flex items-center justify-center text-navy-foreground"><Loader2 className="h-8 w-8 animate-spin" /></span>
            )}
            {status === "idle" && (
              <span className="absolute inset-0 flex items-center justify-center text-navy-foreground"><Camera className="h-10 w-10 opacity-60" /></span>
            )}
          </div>
        )}
        {done && (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"><CheckCircle2 className="h-7 w-7" /></span>
        )}

        <div className="space-y-3">
          <div className="flex min-h-24 flex-col items-center justify-center gap-1">
            {status === "recording" && isHolding && (
              <div role="status" className="flex animate-in zoom-in-50 fade-in flex-col items-center gap-1 duration-300">
                <span className="flex h-14 w-14 animate-bounce items-center justify-center rounded-full bg-neon text-navy shadow-[0_0_24px_var(--neon)]"><CheckCircle2 className="h-9 w-9" strokeWidth={3} /></span>
                <span className="text-lg font-extrabold text-success">Perfect! Hold still...</span>
              </div>
            )}
          </div>
          {status === "recording" && (
            <div className="flex justify-center gap-2" aria-hidden>
              {STEPS.map((_, i) => <span key={i} className={`h-1.5 w-10 rounded-full transition-colors duration-500 ${i < step ? "bg-success" : i === step ? "bg-azure" : "bg-border"}`} />)}
            </div>
          )}
          <h3 className="text-2xl font-extrabold tracking-tight text-navy">
            {status === "recording" ? STEPS[step]?.text : done ? "Verified!" : "Identity Validation"}
          </h3>
          {status === "recording" && (
            <div className="mx-auto h-3 w-full max-w-[288px] overflow-hidden rounded-full bg-border" role="progressbar" aria-label="Hold progress">
              <div key={`${step}-${isHolding}`} className="h-full rounded-full bg-neon shadow-[0_0_12px_var(--neon)]" style={isHolding ? { animation: `kyc-fill ${HOLD_MS}ms linear forwards` } : { width: 0 }} />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {status === "recording" ? "Follow the instructions to prove you are real."
              : done ? "Your video has been saved and will be sent with your application."
              : status === "waiting" ? "Position your face in the circle to start."
              : "A short video of your face is recorded while you follow three movements, and sent with your application."}
          </p>
        </div>

        {(status === "idle" || status === "error") && (
          <button type="button" onClick={startCamera} className="inline-flex items-center gap-2 rounded-2xl bg-navy px-8 py-3 font-bold text-navy-foreground transition-all hover:opacity-90 active:scale-95">
            <Camera className="h-4 w-4" /> Enable camera
          </button>
        )}
        {done && (
          <button type="button" onClick={redo} className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline">
            <RotateCcw className="h-4 w-4" /> Record again
          </button>
        )}
      </div>
      {msg && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" /> {msg}</p>
      )}
    </div>
  );
}
