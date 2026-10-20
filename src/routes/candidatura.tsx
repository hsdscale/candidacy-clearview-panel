import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/candidatura")({
  head: () => ({
    meta: [
      { title: "Candidatura — Assistente de processamento de encomendas" },
      { name: "description", content: "Preencha a sua candidatura para a função remota de assistente de processamento de encomendas." },
      { property: "og:title", content: "Candidatura — Assistente de processamento de encomendas" },
      { property: "og:description", content: "Indique a sua disponibilidade e descubra o seu nível de remuneração." },
    ],
  }),
  component: Candidatura,
});

const TOTAL = 5;
const HOURS = [
  ["2-4 horas", "3 467–5 280 €/mês"],
  ["4-6 horas", "5 200–7 920 €/mês"],
  ["6-8 horas", "6 933–10 560 €/mês"],
  ["8+ horas", "Até 10 560 €/mês"],
];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const START = ["De imediato", "Dentro de uma semana", "Dentro de 2 a 4 semanas", "Daqui a mais de um mês"];
const EQUIP = ["Computador portátil ou de secretária", "Telemóvel", "Ligação estável à Internet", "Espaço de trabalho tranquilo"];

function Radio({ on }: { on: boolean }) {
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${on ? "border-navy" : "border-border"}`}>
      {on && <span className="h-2.5 w-2.5 rounded-full bg-navy" />}
    </span>
  );
}

function Group({ title, error, children }: { title: string; error?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className={`rounded-xl border bg-background p-4 transition sm:p-6 ${error ? "border-destructive" : "border-border"}`}>
      <legend className="px-2 text-sm font-semibold text-navy sm:text-base">{title}</legend>
      {children}
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> Por favor, selecione uma opção.
        </p>
      )}
    </fieldset>
  );
}

const optCls = (on: boolean) =>
  `flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left text-sm transition sm:px-5 sm:text-base ${
    on ? "border-navy bg-navy/5 ring-1 ring-navy" : "border-border bg-cream hover:border-navy/40"
  }`;
const chipCls = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
    on ? "border-navy bg-navy text-navy-foreground" : "border-border bg-cream text-navy hover:border-navy/40"
  }`;

function Candidatura() {
  const [step, setStep] = useState(1);
  const [hours, setHours] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [start, setStart] = useState<string | null>(null);
  const [equip, setEquip] = useState<string[]>([]);
  const [tried, setTried] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const errs = { hours: !hours, days: days.length === 0, start: !start, equip: equip.length === 0 };
  const show = (k: keyof typeof errs) => tried && errs[k];

  const next = () => {
    setTried(true);
    if (Object.values(errs).some(Boolean)) {
      setTimeout(() => document.querySelector('[role="alert"]')?.closest("fieldset")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-bold">LOGO</Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Voltar à vaga
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex items-center justify-between text-sm font-medium text-navy">
          <span>Candidatura</span>
          <span>Etapa {step} de {TOTAL}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-amber transition-all duration-500" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>

        {step === 1 ? (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">Assistente de processamento de encomendas</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">A sua disponibilidade</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              As suas respostas ajudam-nos a identificar o nível de remuneração adequado ao seu perfil.
            </p>

            <div className="mt-10 space-y-8">
              <Group title="Quantas horas pode trabalhar por dia?" error={show("hours")}>
                <div className="space-y-3">
                  {HOURS.map(([h, v]) => (
                    <button type="button" key={h} onClick={() => setHours(h)} className={optCls(hours === h)} aria-pressed={hours === h}>
                      <Radio on={hours === h} />
                      <span className="flex-1">{h}</span>
                      <span className="text-right text-xs font-semibold text-navy/80 sm:text-sm">{v}</span>
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="Em que dias tem disponibilidade?" error={show("days")}>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {DAYS.map((d) => (
                    <button type="button" key={d} onClick={() => toggle(days, setDays, d)} className={chipCls(days.includes(d))} aria-pressed={days.includes(d)}>
                      {days.includes(d) && <Check className="h-3.5 w-3.5" />}{d}
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="Quando pode começar?" error={show("start")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {START.map((s) => (
                    <button type="button" key={s} onClick={() => setStart(s)} className={optCls(start === s)} aria-pressed={start === s}>
                      <Radio on={start === s} />{s}
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="Que equipamento tem em casa?" error={show("equip")}>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {EQUIP.map((e) => (
                    <button type="button" key={e} onClick={() => toggle(equip, setEquip, e)} className={chipCls(equip.includes(e))} aria-pressed={equip.includes(e)}>
                      {equip.includes(e) && <Check className="h-3.5 w-3.5" />}{e}
                    </button>
                  ))}
                </div>
              </Group>
            </div>

            <div className="mt-10 flex justify-end border-t border-border pt-8">
              <button type="button" onClick={next} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 sm:w-auto">
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="mt-12 rounded-xl border border-border bg-background p-8 text-center">
            <h1 className="font-display text-2xl font-bold text-navy">Etapa {step}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Esta etapa será adicionada em breve.</p>
            <button type="button" onClick={() => setStep(1)} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy hover:underline">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
