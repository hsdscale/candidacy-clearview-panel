import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lock, AlertCircle } from "lucide-react";
import { UploadBox } from "@/components/UploadBox";
import { submitApplication } from "@/lib/submit-application";

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
const HOURS: [string, string][] = [
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

function Group({ title, error, msg, children }: { title: string; error?: boolean; msg?: string; children: React.ReactNode }) {
  return (
    <fieldset className={`rounded-xl border bg-background p-4 transition sm:p-6 ${error ? "border-destructive" : "border-border"}`}>
      <legend className="px-2 text-sm font-semibold text-navy sm:text-base">{title}</legend>
      {children}
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {msg ?? "Por favor, selecione uma opção."}
        </p>
      )}
    </fieldset>
  );
}

const EXP = ["Sem experiência direta", "Alguma experiência relevante", "Experiência sólida na área"];
const PT = ["Língua materna", "Fluente", "Bom nível de escrita", "Básico"];
const STRENGTHS = ["Atenção ao detalhe", "Comunicação", "Organização", "Conhecimentos de informática", "Resolução de problemas", "Gestão do tempo"];
const MIN_TEXT = 20;
const MAX_TEXT = 1500;
const inputCls = "mt-2 w-full rounded-lg border bg-cream px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy sm:text-base";
function FieldErr({ msg }: { msg: string }) {
  return (
    <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" /> {msg}
    </p>
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
  const [exp, setExp] = useState<string | null>(null);
  const [pt, setPt] = useState<string | null>(null);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [why, setWhy] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [cv, setCv] = useState<File | null>(null);
  const [extra, setExtra] = useState<File | null>(null);
  const [morada, setMorada] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const errs = {
    hours: !hours, days: days.length === 0, start: !start, equip: equip.length === 0,
    exp: !exp, pt: !pt, strengths: strengths.length === 0, why: why.trim().length < MIN_TEXT,
    name: name.trim().split(/\s+/).filter(Boolean).length < 2,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()),
    agree: !agree,
    cv: !cv,
    extra: !extra,
    morada: !morada,
  };
  const stepKeys: Record<number, (keyof typeof errs)[]> = {
    1: ["hours", "days", "start", "equip"],
    2: ["exp", "pt", "strengths", "why"],
    3: ["name", "email", "agree"],
    4: ["cv", "extra"],
    5: ["morada"],
  };
  const show = (k: keyof typeof errs) => tried && errs[k];
  const level =
    exp === EXP[2] ? "Nível avançado · 60 – 65 €/hora"
    : exp === EXP[1] ? "Nível intermédio · 50 – 55 €/hora"
    : "Nível inicial · 40 – 45 €/hora";

  const go = (s: number) => {
    setTried(false);
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = async () => {
    setTried(true);
    if ((stepKeys[step] ?? []).some((k) => errs[k])) {
      setTimeout(() => { const a = document.querySelector('[role="alert"]'); (a?.closest("fieldset") ?? a?.parentElement)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 0);
      return;
    }
    if (step >= TOTAL) {
      if (sending || !cv || !extra || !morada) return;
      setSending(true);
      setSendErr(null);
      try {
        await submitApplication({ name, email, phone, hours, days, start, equip, exp, pt, strengths, why, level, cv, extra, morada });
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        console.error(e);
        setSendErr("Não foi possível enviar a candidatura. Verifique a ligação e tente novamente.");
      } finally {
        setSending(false);
      }
      return;
    }
    go(step + 1);
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
        ) : step === 2 ? (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">Assistente de processamento de encomendas</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">A sua experiência</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              As suas respostas ajudam-nos a identificar o nível de remuneração adequado ao seu perfil.
            </p>

            <div className="mt-10 space-y-8">
              <Group title="Qual é o seu nível de experiência?" error={show("exp")}>
                <div className="space-y-3">
                  {EXP.map((e) => (
                    <button type="button" key={e} onClick={() => setExp(e)} className={optCls(exp === e)} aria-pressed={exp === e}>
                      <Radio on={exp === e} />{e}
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="Como avalia o seu português escrito?" error={show("pt")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PT.map((p) => (
                    <button type="button" key={p} onClick={() => setPt(p)} className={optCls(pt === p)} aria-pressed={pt === p}>
                      <Radio on={pt === p} />{p}
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="Quais são os seus pontos fortes?" error={show("strengths")}>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {STRENGTHS.map((s) => (
                    <button type="button" key={s} onClick={() => toggle(strengths, setStrengths, s)} className={chipCls(strengths.includes(s))} aria-pressed={strengths.includes(s)}>
                      {strengths.includes(s) && <Check className="h-3.5 w-3.5" />}{s}
                    </button>
                  ))}
                </div>
              </Group>

              <Group
                title="Porque considera ser a pessoa certa para esta função?"
                error={show("why")}
                msg={`Por favor, escreva pelo menos ${MIN_TEXT} caracteres.`}
              >
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value.slice(0, MAX_TEXT))}
                  maxLength={MAX_TEXT}
                  rows={6}
                  placeholder="Explique porque considera ter o perfil adequado para esta função..."
                  className="w-full resize-y rounded-lg border border-border bg-cream px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy sm:text-base"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Mínimo de {MIN_TEXT} caracteres</span>
                  <span>{why.length}/{MAX_TEXT}</span>
                </div>
              </Group>
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => go(1)} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-muted sm:w-auto">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <button type="button" onClick={next} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 sm:w-auto">
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : step === 3 ? (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">Assistente de processamento de encomendas</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">Os seus dados</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              As suas respostas ajudam-nos a identificar o nível de remuneração adequado ao seu perfil.
            </p>

            <div className="mt-10 space-y-6 rounded-xl border border-border bg-background p-4 sm:p-6">
              <div>
                <label htmlFor="name" className="text-sm font-semibold text-navy">Nome completo</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
                  className={`${inputCls} ${show("name") ? "border-destructive" : "border-border"}`} />
                {show("name") && <FieldErr msg="Por favor, indique o seu nome completo." />}
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-navy">Endereço de email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                  className={`${inputCls} ${show("email") ? "border-destructive" : "border-border"}`} />
                {show("email") && <FieldErr msg="Por favor, indique um endereço de email válido." />}
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-semibold text-navy">Número de telemóvel (opcional)</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+351 9XX XXX XXX"
                  className={`${inputCls} border-border`} />
              </div>
              <div>
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-background px-4 py-4 text-sm sm:text-base ${show("agree") ? "border-destructive" : "border-border"}`}>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-navy" />
                  <span>Confirmo que tenho pelo menos 18 anos e que as informações acima são verdadeiras.</span>
                </label>
                {show("agree") && <FieldErr msg="Por favor, confirme para continuar." />}
              </div>
              <div className="rounded-lg bg-navy/5 px-5 py-5">
                <p className="text-sm font-medium text-navy/80">Nível estimado para o seu perfil</p>
                <p className="mt-2 font-display text-xl font-extrabold text-navy sm:text-2xl md:text-3xl">{level}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => go(2)} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-muted sm:w-auto">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <button type="button" onClick={next} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 sm:w-auto">
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : step === 4 ? (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">Assistente de processamento de encomendas</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">Verificação de currículo</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Envie documentos nítidos e legíveis para a nossa equipa de verificação.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <UploadBox title="Currículo (CV)" file={cv} onChange={setCv} error={show("cv")} />
              <UploadBox title="Carta de apresentação ou certificado" file={extra} onChange={setExtra} error={show("extra")} />
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => go(3)} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-muted sm:w-auto">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <button type="button" onClick={next} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 sm:w-auto">
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : submitted ? (
          <div className="mt-12 rounded-xl border border-border bg-background p-8 text-center sm:p-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 text-navy">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-extrabold text-navy sm:text-3xl">Candidatura enviada</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              Obrigado{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""}! Recebemos a sua candidatura e a nossa equipa irá analisá-la. Entraremos em contacto através do email indicado.
            </p>
            <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90">
              Voltar à página inicial
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">Assistente de processamento de encomendas</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">Comprovativo de morada</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Envie documentos nítidos e legíveis para a nossa equipa de verificação.
            </p>

            <div className="mt-10">
              <UploadBox title="Comprovativo de morada" file={morada} onChange={setMorada} error={show("morada")} errorMsg="Envie o seu comprovativo de morada." />
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg bg-navy/5 px-5 py-4 text-sm text-navy/80">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Os seus documentos são guardados de forma privada e apenas a equipa de recrutamento autorizada pode consultá-los.</p>
            </div>

            {sendErr && <FieldErr msg={sendErr} />}
            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => go(4)} disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-muted sm:w-auto">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <button type="button" onClick={next} disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto">
                {sending ? "A enviar..." : <>Enviar candidatura <Check className="h-4 w-4" /></>}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
