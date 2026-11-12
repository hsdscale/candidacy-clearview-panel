import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.webp";
import logo2 from "@/assets/logo2.webp";
import {
  ArrowRight,
  MapPin,
  Home,
  Wallet,
  Clock,
  CircleDollarSign,
  GraduationCap,
  CheckCircle2,
  Check,
  Laptop,
  ShieldCheck,
  MousePointerClick,
  FileText,
  UserCheck,
  Headphones,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alvanto Careers — Order Processing Assistant" },
      {
        name: "description",
        content: "Fully remote role in the United Kingdom, weekly pay and flexible hours. Training included.",
      },
      { property: "og:title", content: "Alvanto Careers — Order Processing Assistant" },
      { property: "og:description", content: "Fully remote role in the United Kingdom, weekly pay and flexible hours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Btn({ children, variant = "navy" }: { children: React.ReactNode; variant?: "navy" | "amber" }) {
  const cls =
    variant === "navy"
      ? "bg-navy text-navy-foreground hover:opacity-90"
      : "bg-amber text-amber-foreground hover:brightness-105";
  return (
    <Link
      to="/candidatura"
      className={`inline-flex shrink-0 items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition ${cls}`}
    >
      {children} <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-sm font-medium ${light ? "text-amber" : "text-navy/80"}`}>{children}</p>;
}

function Index() {
  return (
    <div className="min-h-screen bg-cream font-sans text-foreground">
      <header className="border-b border-border bg-cream">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <img src={logo} alt="Alvanto" className="h-[24px] w-auto min-w-0 shrink" width={300} height={92} />
          <Link
            to="/candidatura"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-navy px-4 py-2 text-xs font-semibold text-navy-foreground transition hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            View requirements <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pb-16 pt-14 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium">
          <MapPin className="h-3.5 w-3.5" /> United Kingdom · Work from home
        </span>
        <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight md:text-6xl">We’re hiring!</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Join our team in a remote role with flexible hours in the United Kingdom.
        </p>
        <div className="mx-auto mt-10 max-w-3xl rounded-xl bg-navy p-8 text-left text-navy-foreground shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <Eyebrow light>Now recruiting</Eyebrow>
              <h2 className="mt-2 font-display text-3xl font-bold">Order Processing Assistant</h2>
              <p className="mt-3 max-w-lg text-sm opacity-80">
                Help process orders, confirm customer details and keep
                day-to-day operations running smoothly.
              </p>
            </div>
            <Btn variant="amber">Apply now</Btn>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              [Home, "100% remote", "Work from home anywhere in the United Kingdom"],
              [Wallet, "Weekly pay", "Regular payments every week"],
              [Clock, "2–8 hours/day", "Choose hours that fit your routine"],
            ].map(([Icon, t, d]: any) => (
              <div key={t} className="flex gap-3">
                <Icon className="h-5 w-5 shrink-0 text-amber" />
                <div>
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="mt-1 text-xs opacity-70">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Availability */}
      <section className="bg-background px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <Eyebrow>Flexible work. Pay that reflects your availability.</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold">Your availability makes a difference</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Estimated monthly pay depends on the hours worked and your assessed experience level.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Entry level", "5 200 – £5,850"],
                ["Intermediate level", "6 500 – £7,150"],
                ["Experienced level", "7 150 – £7,800"],
                ["Maximum potential", "Up to £10,560"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-border bg-cream p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</p>
                  <p className="mt-1 font-semibold">
                    {v} <span className="text-xs font-normal">/ month</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-amber p-8 text-amber-foreground shadow-[var(--shadow-card)]">
            <CircleDollarSign className="h-8 w-8" />
            <p className="mt-6 text-xs font-bold uppercase tracking-wider">Hourly pay</p>
            <p className="mt-2 font-display text-5xl font-extrabold">£75–95</p>
            <p className="mt-1 text-sm">GBP per hour</p>
            <div className="mt-8 border-t border-navy/20 pt-4 text-xs">
              Weekly pay · Flexible hours · Remote work
            </div>
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="px-6 py-20 text-center">
        <Eyebrow>What is your experience level?</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold">Three pay levels</h2>
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 text-left md:grid-cols-3">
          {[
            ["Entry level", "40 – £45", "No experience required", false],
            ["Intermediate level", "50 – £55", "Some relevant experience", true],
            ["Experienced level", "75 – £95", "Strong experience in the field", false],
          ].map(([t, p, d, hl]: any) => (
            <div
              key={t}
              className={`relative rounded-xl border p-6 ${hl ? "border-amber bg-navy text-navy-foreground shadow-[var(--shadow-card)]" : "border-border bg-background"}`}
            >
              {hl && (
                <span className="absolute right-4 top-4 rounded-full bg-amber px-2.5 py-0.5 text-[11px] font-semibold text-amber-foreground">
                  Most common
                </span>
              )}
              <GraduationCap className={`h-6 w-6 ${hl ? "text-amber" : ""}`} />
              <h3 className="mt-5 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-2 font-display text-3xl font-extrabold">
                {p}
                <span className="text-sm font-medium">/hour</span>
              </p>
              <p className={`mt-3 text-xs ${hl ? "opacity-70" : "text-muted-foreground"}`}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Training */}
      <section id="requisitos" className="bg-navy px-6 py-20 text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <div>
            <Eyebrow light>We support your learning</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold">Full training included</h2>
            <p className="mt-3 text-sm opacity-75">
              You do not need previous experience in order processing. Our training guides you through
              every task in the role.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Straightforward, step-by-step onboarding",
                "Ongoing support from the team",
                "Clear procedures and easy-to-use tools",
              ].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-amber" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [
                Laptop,
                "Your responsibilities",
                [
                  "Check and process orders",
                  "Confirm customer details",
                  "Update order records",
                  "Follow work instructions",
                ],
              ],
              [
                ShieldCheck,
                "Requirements",
                [
                  "Be at least 18 years old",
                  "Live in the United Kingdom",
                  "Computer or mobile phone",
                  "Stable internet connection",
                ],
              ],
            ].map(([Icon, t, items]: any) => (
              <div key={t} className="rounded-xl border border-navy-foreground/15 p-5">
                <Icon className="h-5 w-5 text-amber" />
                <h3 className="mt-4 font-display font-semibold">{t}</h3>
                <ul className="mt-3 space-y-2.5 text-xs opacity-85">
                  {items.map((i: string) => (
                    <li key={i} className="flex gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-amber" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="px-6 py-20 text-center">
        <Eyebrow>Simple and transparent</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold">The recruitment process</h2>
        <div className="mx-auto mt-12 grid max-w-6xl gap-8 sm:grid-cols-2 md:grid-cols-4">
          {[
            [MousePointerClick, "Check the requirements", "Answer a few questions."],
            [FileText, "Enter your details", "Tell us your availability."],
            [UserCheck, "Application review", "Our team reviews your application."],
            [Headphones, "Start training", "Successful candidates begin training."],
          ].map(([Icon, t, d]: any, i) => (
            <div key={t}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber text-amber-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-navy/70">Step {i + 1}</p>
              <h3 className="mt-1 font-semibold">{t}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-background px-6 py-20 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-amber" />
        <h2 className="mt-4 font-display text-3xl font-bold">Ready to work from home?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Find the pay level that matches your profile. It only takes a few minutes.
        </p>
        <div className="mt-6">
          <Btn>View requirements</Btn>
        </div>
      </section>

      <footer className="bg-navy px-6 py-14 text-center text-navy-foreground">
        <img src={logo2} alt="Alvanto" className="mx-auto h-[24px] w-auto" width={300} height={92} loading="lazy" />
        <p className="mx-auto mt-6 max-w-3xl text-xs opacity-60">
          The amounts shown are estimates and may vary depending on hours worked, experience and
          vacancy availability. This page does not guarantee employment or a specific income. Applicants
          must meet the eligibility and verification requirements.
        </p>
        <div className="mt-5 flex justify-center gap-3 text-xs opacity-70">
          <a href="#" className="underline">
            Privacy notice
          </a>
          ·
          <a href="#" className="underline">
            Cookie settings
          </a>
        </div>
        <p className="mt-5 text-xs opacity-50">© 2026 Alvanto Careers. All rights reserved.</p>
      </footer>
    </div>
  );
}
