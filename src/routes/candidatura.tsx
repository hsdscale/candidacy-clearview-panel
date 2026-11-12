import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lock, AlertCircle, Mail } from "lucide-react";
import { UploadBox } from "@/components/UploadBox";
import { submitApplication } from "@/lib/submit-application";
import { trackPixel } from "@/lib/meta-pixel";
import logo from "@/assets/logo.webp";

export const Route = createFileRoute("/candidatura")({
  head: () => ({
    meta: [
      { title: "Apply — Alvanto Order Processing Assistant" },
      {
        name: "description",
        content: "Apply for the remote order processing assistant role at Alvanto in the United Kingdom.",
      },
      { property: "og:title", content: "Apply — Alvanto Order Processing Assistant" },
      { property: "og:description", content: "Tell us your availability and find your pay level." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Candidatura,
});

const TOTAL = 5;
const HOURS: [string, string][] = [
  ["2–4 hours", "£3,467–5,280/month"],
  ["4–6 hours", "£5,200–7,920/month"],
  ["6–8 hours", "£6,933–10,560/month"],
  ["8+ hours", "Up to £10,560/month"],
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START = ["Immediately", "Within a week", "Within 2 to 4 weeks", "In more than a month"];
const EQUIP = [
  "Laptop or desktop computer",
  "Mobile phone",
  "Stable internet connection",
  "Quiet workspace",
];

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${on ? "border-navy" : "border-border"}`}
    >
      {on && <span className="h-2.5 w-2.5 rounded-full bg-navy" />}
    </span>
  );
}

function Group({
  title,
  error,
  msg,
  children,
}: {
  title: string;
  error?: boolean;
  msg?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      className={`rounded-xl border bg-background p-4 transition sm:p-6 ${error ? "border-destructive" : "border-border"}`}
    >
      <legend className="px-2 text-sm font-semibold text-navy sm:text-base">{title}</legend>
      {children}
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {msg ?? "Please select an option."}
        </p>
      )}
    </fieldset>
  );
}

const EXP = ["No direct experience", "Some relevant experience", "Strong experience in the field"];
const PT = ["Native speaker", "Fluent", "Good written skills", "Basic"];
const STRENGTHS = [
  "Attention to detail",
  "Communication",
  "Organisation",
  "Computer skills",
  "Problem-solving",
  "Time management",
];
const MIN_TEXT = 20;
const MAX_TEXT = 1500;
const inputCls =
  "mt-2 w-full rounded-lg border bg-cream px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy sm:text-base";
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
const hourValCls =
  "shrink-0 whitespace-nowrap rounded-full bg-azure px-3 py-1.5 text-xs font-bold text-navy-foreground sm:text-sm";
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
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const errs = {
    hours: !hours,
    days: days.length === 0,
    start: !start,
    equip: equip.length === 0,
    exp: !exp,
    pt: !pt,
    strengths: strengths.length === 0,
    why: why.trim().length < MIN_TEXT,
    name: name.trim().split(/\s+/).filter(Boolean).length < 2,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()),
    agree: !agree,
    cv: !cv,
    extra: !extra,
    morada: !morada,
    selfie: !selfie,
  };
  const stepKeys: Record<number, (keyof typeof errs)[]> = {
    1: ["hours", "days", "start", "equip"],
    2: ["exp", "pt", "strengths", "why"],
    3: ["name", "email", "agree"],
    4: ["cv", "extra"],
    5: ["morada", "selfie"],
  };
  const show = (k: keyof typeof errs) => tried && errs[k];
  const level =
    exp === EXP[2]
      ? "Advanced level · 60 – £65/hour"
      : exp === EXP[1]
        ? "Intermediate level · 50 – £55/hour"
        : "Entry level · 40 – £45/hour";

  const go = (s: number) => {
    setTried(false);
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = async () => {
    setTried(true);
    if ((stepKeys[step] ?? []).some((k) => errs[k])) {
      setTimeout(() => {
        const a = document.querySelector('[role="alert"]');
        (a?.closest("fieldset") ?? a?.parentElement)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }
    if (step >= TOTAL) {
      if (sending || !cv || !extra || !morada || !selfie) return;
      setSending(true);
      setSendErr(null);
      try {
        await submitApplication({
          name,
          email,
          phone,
          hours,
          days,
          start,
          equip,
          exp,
          pt,
          strengths,
          why,
          level,
          cv,
          extra,
          morada,
          selfie,
        });
        trackPixel("Lead");
        trackPixel("CompleteRegistration");
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        console.error(e);
        setSendErr("We could not submit your application. Check your connection and try again.");
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
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <Link to="/" aria-label="Alvanto" className="min-w-0 shrink">
            <img src={logo} alt="Alvanto" className="h-[24px] w-auto" width={300} height={92} />
          </Link>
          <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted-foreground hover:text-navy sm:text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to the role
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex items-center justify-between text-sm font-medium text-navy">
          <span>Application</span>
          <span>
            Step {step} of {TOTAL}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-amber transition-all duration-500"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>

        {step === 1 ? (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">
              Order Processing Assistant
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">
              Your availability
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Your answers help us identify the pay level that suits your profile.
            </p>

            <div className="mt-10 space-y-8">
              <Group title="How many hours can you work each day?" error={show("hours")}>
                <div className="space-y-3">
                  {HOURS.map(([h, v]) => (
                    <button
                      type="button"
                      key={h}
                      onClick={() => setHours(h)}
                      className={optCls(hours === h)}
                      aria-pressed={hours === h}
                    >
                      <Radio on={hours === h} />
                      <span className="flex-1">{h}</span>
                      <span className={hourValCls}>{v}</span>
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="Which days are you available?" error={show("days")}>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {DAYS.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggle(days, setDays, d)}
                      className={chipCls(days.includes(d))}
                      aria-pressed={days.includes(d)}
                    >
                      {days.includes(d) && <Check className="h-3.5 w-3.5" />}
                      {d}
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="When can you start?" error={show("start")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {START.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setStart(s)}
                      className={optCls(start === s)}
                      aria-pressed={start === s}
                    >
                      <Radio on={start === s} />
                      {s}
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="What equipment do you have at home?" error={show("equip")}>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {EQUIP.map((e) => (
                    <button
                      type="button"
                      key={e}
                      onClick={() => toggle(equip, setEquip, e)}
                      className={chipCls(equip.includes(e))}
                      aria-pressed={equip.includes(e)}
                    >
                      {equip.includes(e) && <Check className="h-3.5 w-3.5" />}
                      {e}
                    </button>
                  ))}
                </div>
              </Group>
            </div>

            <div className="mt-10 flex justify-end border-t border-border pt-8">
              <button
                type="button"
                onClick={next}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 sm:w-auto"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">
              Order Processing Assistant
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">
              Your experience
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Your answers help us identify the pay level that suits your profile.
            </p>

            <div className="mt-10 space-y-8">
              <Group title="What is your experience level?" error={show("exp")}>
                <div className="space-y-3">
                  {EXP.map((e) => (
                    <button
                      type="button"
                      key={e}
                      onClick={() => setExp(e)}
                      className={optCls(exp === e)}
                      aria-pressed={exp === e}
                    >
                      <Radio on={exp === e} />
                      {e}
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="How would you rate your written English?" error={show("pt")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PT.map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPt(p)}
                      className={optCls(pt === p)}
                      aria-pressed={pt === p}
                    >
                      <Radio on={pt === p} />
                      {p}
                    </button>
                  ))}
                </div>
              </Group>

              <Group title="What are your strengths?" error={show("strengths")}>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {STRENGTHS.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggle(strengths, setStrengths, s)}
                      className={chipCls(strengths.includes(s))}
                      aria-pressed={strengths.includes(s)}
                    >
                      {strengths.includes(s) && <Check className="h-3.5 w-3.5" />}
                      {s}
                    </button>
                  ))}
                </div>
              </Group>

              <Group
                title="Why do you think you are right for this role?"
                error={show("why")}
                msg={`Please write at least ${MIN_TEXT} characters.`}
              >
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value.slice(0, MAX_TEXT))}
                  maxLength={MAX_TEXT}
                  rows={6}
                  placeholder="Explain why you think you are a good fit for this role..."
                  className="w-full resize-y rounded-lg border border-border bg-cream px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy sm:text-base"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Minimum of {MIN_TEXT} characters</span>
                  <span>
                    {why.length}/{MAX_TEXT}
                  </span>
                </div>
              </Group>
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-muted sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 sm:w-auto"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : step === 3 ? (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">
              Order Processing Assistant
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">
              Your details
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Your answers help us identify the pay level that suits your profile.
            </p>

            <div className="mt-10 space-y-6 rounded-xl border border-border bg-background p-4 sm:p-6">
              <div>
                <label htmlFor="name" className="text-sm font-semibold text-navy">
                  Full name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={`${inputCls} ${show("name") ? "border-destructive" : "border-border"}`}
                />
                {show("name") && <FieldErr msg="Please enter your full name." />}
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-navy">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={`${inputCls} ${show("email") ? "border-destructive" : "border-border"}`}
                />
                {show("email") && <FieldErr msg="Please enter a valid email address." />}
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-semibold text-navy">
                  Mobile number (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+44 7XXX XXXXXX"
                  className={`${inputCls} border-border`}
                />
              </div>
              <div>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-background px-4 py-4 text-sm sm:text-base ${show("agree") ? "border-destructive" : "border-border"}`}
                >
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-navy"
                  />
                  <span>I confirm that I am at least 18 years old and that the information above is accurate.</span>
                </label>
                {show("agree") && <FieldErr msg="Please confirm to continue." />}
              </div>
              <div className="rounded-lg bg-navy/5 px-5 py-5">
                <p className="text-sm font-medium text-navy/80">Estimated level for your profile</p>
                <p className="mt-2 font-display text-xl font-extrabold text-navy sm:text-2xl md:text-3xl">{level}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => go(2)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-muted sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 sm:w-auto"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : step === 4 ? (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">
              Order Processing Assistant
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">
              Identity verification
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Upload clear, legible documents for our verification team.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <UploadBox title="Identity document — front" file={cv} onChange={setCv} error={show("cv")} />
              <UploadBox
                title="Identity document — back"
                file={extra}
                onChange={setExtra}
                error={show("extra")}
              />
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => go(3)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-muted sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 sm:w-auto"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : submitted ? (
          <div className="mt-12 rounded-xl border border-border bg-background p-8 text-center sm:p-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 text-navy">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-extrabold text-navy sm:text-3xl">Application submitted</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              Thank you{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""}! Your application has been received
              successfully.
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Our team will review your details and documents. We will contact you if we need further
              information or if you are offered the role.
            </p>
            {email.trim() && (
              <p className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-md bg-navy/5 px-4 py-2.5 text-sm text-navy">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{email.trim()}</span>
              </p>
            )}

            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90"
            >
              Back to the home page
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-10 text-sm font-medium text-navy/80 sm:text-base">
              Order Processing Assistant
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl md:text-5xl">
              Proof of UK address and selfie
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Upload clear, legible documents for our verification team.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <UploadBox
                title="Proof of UK address"
                file={morada}
                onChange={setMorada}
                error={show("morada")}
                errorMsg="Please upload proof of your UK address."
              />
              <UploadBox
                title="Photo of your face (selfie)"
                description="Upload a recent photo of yourself with your face clearly visible to help confirm your identity."
                file={selfie}
                onChange={setSelfie}
                error={show("selfie")}
                errorMsg="Please upload a photo of your face (selfie)."
                photoOnly
              />
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg bg-navy/5 px-5 py-4 text-sm text-navy/80">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Your documents are stored privately and can only be viewed by authorised
                recruitment team members.
              </p>
            </div>

            {sendErr && <FieldErr msg={sendErr} />}
            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => go(4)}
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-muted sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={next}
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    Submit application <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
