import { useRef, useState } from "react";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadError } from "@/lib/upload-validation";

const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

type Props = {
  title: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: boolean;
  errorMsg?: string;
  photoOnly?: boolean;
  description?: string;
};

export function UploadBox({ title, file, onChange, error, errorMsg, photoOnly = false, description }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [bad, setBad] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const problem = uploadError(f, photoOnly);
    if (problem) return setBad(problem);
    setBad(null);
    onChange(f);
  };

  const msg = bad ?? (error && !file ? (errorMsg ?? "Please upload a file.") : null);
  const size = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "";

  return (
    <div>
      <div
        role="button"
        aria-label={title}
        tabIndex={0}
        onClick={() => ref.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), ref.current?.click())}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background p-6 text-center transition hover:border-navy/50 focus:outline-none focus:ring-2 focus:ring-navy/30 ${
          msg ? "border-destructive" : drag ? "border-navy bg-navy/5" : file ? "border-navy/40" : "border-border"
        }`}
      >
        <input ref={ref} type="file" aria-label={title} accept={photoOnly ? ".jpg,.jpeg,.png" : ACCEPT} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {file ? (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
              <FileText className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-navy">{title}</p>
            <p className="mt-2 max-w-full truncate text-sm text-muted-foreground">{file.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{size}</p>
            <Button
              variant="link"
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
            >
              <X className="h-4 w-4" /> Remove
            </Button>
          </>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
              <UploadCloud className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-navy">{title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{description ?? "Choose a file or take a photo"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{photoOnly ? "JPG or PNG" : "PDF, DOC, JPG or PNG"} · Max. 10 MB</p>
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
