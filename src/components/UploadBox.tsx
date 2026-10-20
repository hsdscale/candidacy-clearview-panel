import { useRef, useState } from "react";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
const OK_EXT = /\.(pdf|docx?|jpe?g|png)$/i;

type Props = {
  title: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: boolean;
  errorMsg?: string;
};

export function UploadBox({ title, file, onChange, error, errorMsg }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [bad, setBad] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!OK_EXT.test(f.name)) return setBad("Formato não suportado. Use PDF, DOC, DOCX, JPG ou PNG.");
    if (f.size > MAX_BYTES) return setBad("O ficheiro excede o tamanho máximo de 10 MB.");
    setBad(null);
    onChange(f);
  };

  const msg = bad ?? (error && !file ? (errorMsg ?? "Por favor, envie um ficheiro.") : null);
  const size = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "";

  return (
    <div>
      <div
        role="button"
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
        <input ref={ref} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {file ? (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
              <FileText className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-navy">{title}</p>
            <p className="mt-2 max-w-full truncate text-sm text-muted-foreground">{file.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{size}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
            >
              <X className="h-4 w-4" /> Remover
            </button>
          </>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
              <UploadCloud className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-navy">{title}</p>
            <p className="mt-2 text-sm text-muted-foreground">Escolha um ficheiro ou tire uma fotografia</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, JPG ou PNG · Máx. 10 MB</p>
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
