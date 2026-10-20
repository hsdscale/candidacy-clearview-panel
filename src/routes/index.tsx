import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.webp";
import logo2 from "@/assets/logo2.webp";
import {
  ArrowRight, MapPin, Home, Wallet, Clock, CircleDollarSign, GraduationCap,
  CheckCircle2, Check, Laptop, ShieldCheck, MousePointerClick, FileText, UserCheck, Headphones, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Estamos a recrutar — Assistente de processamento de encomendas" },
      { name: "description", content: "Função 100% remota em Portugal, pagamento semanal e horário flexível. Formação incluída." },
      { property: "og:title", content: "Estamos a recrutar — Assistente de processamento de encomendas" },
      { property: "og:description", content: "Função 100% remota em Portugal, pagamento semanal e horário flexível." },
    ],
  }),
  component: Index,
});

function Btn({ children, variant = "navy" }: { children: React.ReactNode; variant?: "navy" | "amber" }) {
  const cls = variant === "navy"
    ? "bg-navy text-navy-foreground hover:opacity-90"
    : "bg-amber text-amber-foreground hover:brightness-105";
  return (
    <Link to="/candidatura" className={`inline-flex shrink-0 items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition ${cls}`}>
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-3 px-4 py-4 sm:justify-between sm:px-6">
          <img src={logo} alt="Alvanto" className="h-8 w-auto sm:h-10" width={1415} height={231} />
          <Link to="/candidatura" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-navy px-4 py-2 text-xs font-semibold text-navy-foreground transition hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm">
            Ver requisitos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pb-16 pt-14 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium">
          <MapPin className="h-3.5 w-3.5" /> Portugal · Trabalho a partir de casa
        </span>
        <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight md:text-6xl">Estamos a recrutar!</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Junte-se à nossa equipa numa função remota com horário flexível em Portugal.
        </p>
        <div className="mx-auto mt-10 max-w-3xl rounded-xl bg-navy p-8 text-left text-navy-foreground shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <Eyebrow light>Recrutamento em curso</Eyebrow>
              <h2 className="mt-2 font-display text-3xl font-bold">Assistente de processamento de encomendas</h2>
              <p className="mt-3 max-w-lg text-sm opacity-80">
                Ajude a processar encomendas, confirme os dados dos clientes e contribua para o bom funcionamento das operações diárias.
              </p>
            </div>
            <Btn variant="amber">Candidatar-me</Btn>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              [Home, "100% remoto", "Trabalhe a partir de casa, em qualquer região de Portugal"],
              [Wallet, "Pagamento semanal", "Pagamentos regulares todas as semanas"],
              [Clock, "2–8 horas/dia", "Escolha um horário compatível com a sua rotina"],
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
            <Eyebrow>Trabalho flexível. Remuneração de acordo com a sua disponibilidade.</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold">A sua disponibilidade faz a diferença</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A remuneração mensal estimada depende das horas trabalhadas e do nível de experiência avaliado.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Nível inicial", "5 200 – 5 850 €"],
                ["Nível intermédio", "6 500 – 7 150 €"],
                ["Nível experiente", "7 150 – 7 800 €"],
                ["Potencial máximo", "Até 10 560 €"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-border bg-cream p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</p>
                  <p className="mt-1 font-semibold">{v} <span className="text-xs font-normal">/ mês</span></p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-amber p-8 text-amber-foreground shadow-[var(--shadow-card)]">
            <CircleDollarSign className="h-8 w-8" />
            <p className="mt-6 text-xs font-bold uppercase tracking-wider">Remuneração por hora</p>
            <p className="mt-2 font-display text-5xl font-extrabold">75–95 €</p>
            <p className="mt-1 text-sm">EUR por hora</p>
            <div className="mt-8 border-t border-navy/20 pt-4 text-xs">Pagamento semanal · Horário flexível · Trabalho remoto</div>
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="px-6 py-20 text-center">
        <Eyebrow>Qual é o seu nível?</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold">Três níveis de remuneração</h2>
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 text-left md:grid-cols-3">
          {[
            ["Nível inicial", "40 – 45 €", "Não é necessária experiência", false],
            ["Nível intermédio", "50 – 55 €", "Alguma experiência relevante", true],
            ["Nível experiente", "75 – 95 €", "Experiência sólida na área", false],
          ].map(([t, p, d, hl]: any) => (
            <div key={t} className={`relative rounded-xl border p-6 ${hl ? "border-amber bg-navy text-navy-foreground shadow-[var(--shadow-card)]" : "border-border bg-background"}`}>
              {hl && <span className="absolute right-4 top-4 rounded-full bg-amber px-2.5 py-0.5 text-[11px] font-semibold text-amber-foreground">Mais frequente</span>}
              <GraduationCap className={`h-6 w-6 ${hl ? "text-amber" : ""}`} />
              <h3 className="mt-5 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-2 font-display text-3xl font-extrabold">{p}<span className="text-sm font-medium">/hora</span></p>
              <p className={`mt-3 text-xs ${hl ? "opacity-70" : "text-muted-foreground"}`}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Training */}
      <section id="requisitos" className="bg-navy px-6 py-20 text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <div>
            <Eyebrow light>Acompanhamos a sua aprendizagem</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold">Formação completa incluída</h2>
            <p className="mt-3 text-sm opacity-75">
              Não precisa de experiência anterior no processamento de encomendas. A nossa formação acompanha-o em todas as tarefas da função.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Integração simples, passo a passo", "Apoio contínuo da equipa", "Procedimentos claros e ferramentas fáceis de utilizar"].map((i) => (
                <li key={i} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-amber" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [Laptop, "As suas funções", ["Verificar e processar encomendas", "Confirmar os dados dos clientes", "Atualizar os registos das encomendas", "Seguir as instruções de trabalho"]],
              [ShieldCheck, "Requisitos", ["Ter pelo menos 18 anos", "Residir em Portugal", "Computador ou telemóvel", "Ligação estável à Internet"]],
            ].map(([Icon, t, items]: any) => (
              <div key={t} className="rounded-xl border border-navy-foreground/15 p-5">
                <Icon className="h-5 w-5 text-amber" />
                <h3 className="mt-4 font-display font-semibold">{t}</h3>
                <ul className="mt-3 space-y-2.5 text-xs opacity-85">
                  {items.map((i: string) => (
                    <li key={i} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-amber" />{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="px-6 py-20 text-center">
        <Eyebrow>Simples e transparente</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold">O processo de recrutamento</h2>
        <div className="mx-auto mt-12 grid max-w-6xl gap-8 sm:grid-cols-2 md:grid-cols-4">
          {[
            [MousePointerClick, "Verificar os requisitos", "Responda a algumas perguntas."],
            [FileText, "Preencher os seus dados", "Indique a sua disponibilidade."],
            [UserCheck, "Análise da candidatura", "A nossa equipa analisa a sua candidatura."],
            [Headphones, "Iniciar a formação", "Os candidatos selecionados iniciam a formação."],
          ].map(([Icon, t, d]: any, i) => (
            <div key={t}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber text-amber-foreground"><Icon className="h-5 w-5" /></div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-navy/70">Etapa {i + 1}</p>
              <h3 className="mt-1 font-semibold">{t}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-background px-6 py-20 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-amber" />
        <h2 className="mt-4 font-display text-3xl font-bold">Pronto para trabalhar a partir de casa?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Descubra o nível de remuneração correspondente ao seu perfil. Demora apenas alguns minutos.
        </p>
        <div className="mt-6"><Btn>Ver requisitos</Btn></div>
      </section>

      <footer className="bg-navy px-6 py-14 text-center text-navy-foreground">
        <img src={logo2} alt="Alvanto" className="mx-auto h-8 w-auto sm:h-10" width={1415} height={231} loading="lazy" />
        <p className="mx-auto mt-6 max-w-3xl text-xs opacity-60">
          Os valores apresentados são estimativas e podem variar consoante as horas trabalhadas, a experiência e a disponibilidade da vaga. Esta página não garante a contratação nem um rendimento específico. Os candidatos devem cumprir os requisitos de elegibilidade e de verificação.
        </p>
        <div className="mt-5 flex justify-center gap-3 text-xs opacity-70">
          <a href="#" className="underline">Aviso de privacidade</a>·<a href="#" className="underline">Definições de cookies</a>
        </div>
        <p className="mt-5 text-xs opacity-50">© 2026 Alvanto Careers. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
