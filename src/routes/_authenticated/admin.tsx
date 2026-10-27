import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, LogOut, Download, Trash2, FileText, Check, Undo2, AlertTriangle, StickyNote, Users } from "lucide-react";
import { markWrongDocs } from "@/lib/resubmit.functions";
import { listTeamUsers, setMemberAccess, saveMemberNote } from "@/lib/team.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel de candidaturas — Alvanto" },
      { name: "description", content: "Painel privado para gerir candidaturas." },
      { property: "og:title", content: "Painel de candidaturas — Alvanto" },
      { property: "og:description", content: "Painel privado de candidaturas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type App = {
  id: string; application_number: number; created_at: string; name: string; email: string; phone: string | null;
  hours: string | null; days: string[]; start_when: string | null; equipment: string[];
  experience: string | null; pt_level: string | null; strengths: string[]; why: string | null; level: string | null;
  cv_path: string | null; extra_path: string | null; morada_path: string | null; notes: string | null;
  verified: boolean; wrong_docs: boolean;
};

function StatusBadge({ verified, wrong }: { verified: boolean; wrong?: boolean }) {
  if (wrong && !verified) return <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground"><AlertTriangle className="h-3 w-3" />Doc Errado</span>;
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-navy-foreground"><Check className="h-3 w-3" />Verificado</span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber px-2.5 py-0.5 text-xs font-semibold text-navy">Novo</span>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-PT")} · ${d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
}

function Admin() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"todas" | "novas" | "verificadas" | "errados" | "usuarios">("novas");

  const role = useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id);
      const roles = (data ?? []).map((r) => r.role);
      return { admin: roles.includes("admin"), member: roles.includes("user"), email: u.user?.email };
    },
  });
  const isAdmin = !!role.data?.admin;
  const isMember = !!role.data?.member && !isAdmin;
  const apps = useQuery({
    queryKey: ["apps"], enabled: isAdmin || isMember,
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
      if (error) throw error; return data as App[];
    },
  });

  const setVerified = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("applications").update(verified ? { verified, wrong_docs: false } : { verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps"] }),
  });
  const isVer = (a: App) => a.verified;
  const isWrong = (a: App) => !a.verified && a.wrong_docs;
  const isNew = (a: App) => !a.verified && !a.wrong_docs;
  const counts = { novas: (apps.data ?? []).filter(isNew).length, ver: (apps.data ?? []).filter(isVer).length, err: (apps.data ?? []).filter(isWrong).length };
  const [draft, setDraft] = useState<string | null>(null);
  const presets = useQuery({
    queryKey: ["presets"], enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("email_presets").select("id, name, body").order("name");
      if (error) throw error;
      return data;
    },
  });
  const savePreset = async (body: string) => {
    const name = prompt("Nome da predefinição (ex.: CV ilegível):")?.trim();
    if (!name) return;
    const existing = presets.data?.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const { error } = existing
      ? await supabase.from("email_presets").update({ body }).eq("id", existing.id)
      : await supabase.from("email_presets").insert({ name: name.slice(0, 80), body });
    if (error) return alert("Não foi possível guardar a predefinição.");
    qc.invalidateQueries({ queryKey: ["presets"] });
    alert(existing ? "Predefinição atualizada." : "Predefinição guardada.");
  };
  const deletePreset = async (id: string, name: string) => {
    if (!confirm(`Apagar a predefinição "${name}"?`)) return;
    await supabase.from("email_presets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["presets"] });
  };
  const wrong = useMutation({
    mutationFn: (v: { id: string; message: string }) => markWrongDocs({ data: v }),
    onSuccess: (r) => { setDraft(null); qc.invalidateQueries({ queryKey: ["apps"] }); alert(r.emailed ? "Email enviado ao candidato." : "Marcado, mas o email não pôde ser enviado a este endereço."); },
    onError: () => alert("Não foi possível enviar o email. Tente novamente."),
  });
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const v = isMember ? "verificadas" : view;
    return (apps.data ?? []).filter((a) =>
      (v === "todas" || (v === "verificadas" ? isVer(a) : v === "errados" ? isWrong(a) : isNew(a))) &&
      (!s || a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s) || String(a.application_number) === s.replace(/^#/, '')));
  }, [apps.data, q, view, isMember]);
  const open = apps.data?.find((a) => a.id === openId) ?? null;

  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  if (role.isLoading) return <div className="p-10 text-center text-muted-foreground">A carregar...</div>;
  if (!isAdmin && !isMember) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
      <h1 className="font-display text-2xl font-extrabold text-navy">Sem acesso</h1>
      <p className="max-w-sm text-sm text-muted-foreground">A conta {role.data?.email} ainda não tem permissão. Peça ao administrador para a autorizar no separador Utilizadores do painel.</p>
      <button onClick={signOut} className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-navy-foreground">Sair</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-xl font-bold">Alvanto</p>
            <p className="text-xs opacity-80">{isMember ? "Painel — Verificadas" : "Painel de candidaturas"}</p>
          </div>
          <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setView(view === "usuarios" ? "novas" : "usuarios")} className="inline-flex items-center gap-2 rounded-md border border-navy-foreground/30 px-3 py-2 text-sm hover:bg-navy-foreground/10">
              <Users className="h-4 w-4" /> <span className="hidden sm:inline">Utilizadores</span>
            </button>
          )}
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-md border border-navy-foreground/30 px-3 py-2 text-sm hover:bg-navy-foreground/10">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span>
          </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {view === "usuarios" && isAdmin ? (
          <TeamPanel />
        ) : (
        <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
            Candidaturas <span className="text-base font-semibold text-muted-foreground">({list.length})</span>
          </h1>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por número, nome ou email"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy" />
          </div>
        </div>

        {!isMember && (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl bg-background p-1.5 sm:inline-grid sm:w-auto">
          {([["todas", "Todas", apps.data?.length ?? 0], ["novas", "Novas", counts.novas], ["verificadas", "Verificadas", counts.ver], ["errados", "Doc Errado", counts.err]] as const).map(([k, label, n]) => (
            <button key={k} onClick={() => setView(k)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${view === k ? "bg-navy text-navy-foreground" : "text-navy hover:bg-muted"}`}>
              {label} <span className="opacity-70">({n})</span>
            </button>
          ))}
        </div>
        )}

        <div className="mt-6 space-y-3">
          {apps.isLoading && <p className="text-muted-foreground">A carregar...</p>}
          {!apps.isLoading && list.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-muted-foreground">Nenhuma candidatura encontrada.</p>
          )}
          {list.map((a) => (
            <button key={a.id} onClick={() => setOpenId(a.id)}
              className="flex w-full flex-col gap-2 rounded-xl border border-border bg-background p-4 text-left transition hover:border-navy/40 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Candidatura n.º {a.application_number}</p>
                <p className="truncate font-semibold text-navy">{a.name}</p>
                <p className="truncate text-sm text-muted-foreground">{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
              </div>
              {a.notes && (
                <p className="flex w-full min-w-0 items-start gap-1.5 text-xs text-muted-foreground sm:w-auto sm:flex-1 sm:items-center">
                  <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
                  <span className="line-clamp-2 sm:truncate">{a.notes}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge verified={a.verified} wrong={a.wrong_docs} />
              </div>
              <p className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">{fmtDate(a.created_at)}</p>
            </button>
          ))}
        </div>
        </>
        )}
      </main>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <Detail app={open} member={isMember} busy={setVerified.isPending || wrong.isPending} onWrong={() => setDraft(defaultWrongMessage(open.application_number))} onVerify={(v) => setVerified.mutate({ id: open.id, verified: v })} onDeleted={() => setOpenId(null)} />}
          {open && draft !== null && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 p-3 sm:items-center">
              <div className="w-full max-w-lg rounded-2xl bg-background p-5 shadow-xl">
                <h3 className="text-lg font-bold">Email para {open.name.split(" ")[0]}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Enviado para {open.email}. Edite o texto à vontade — a saudação, o botão "Reenviar documentos" e a assinatura são adicionados automaticamente.</p>
                <div className="mt-3">
                  <p className="text-xs font-semibold">Predefinições</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button onClick={() => setDraft(defaultWrongMessage(open.application_number))} className="rounded-full border border-input px-3 py-1 text-xs font-semibold hover:bg-muted">Texto padrão</button>
                    {(presets.data ?? []).map((p) => (
                      <span key={p.id} className="inline-flex items-center rounded-full border border-input text-xs font-semibold">
                        <button onClick={() => setDraft(p.body.replaceAll("{numero}", String(open.application_number ?? "")))} className="py-1 pl-3 pr-1.5 hover:underline">{p.name}</button>
                        <button aria-label={`Apagar ${p.name}`} onClick={() => deletePreset(p.id, p.name)} className="pr-2 text-muted-foreground hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={9} maxLength={3000}
                  className="mt-3 w-full rounded-xl border border-input bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button disabled={draft.trim().length < 5} onClick={() => savePreset(draft.trim())} className="mr-auto text-xs font-semibold text-muted-foreground underline disabled:opacity-50">Guardar como predefinição</button>
                  <button onClick={() => setDraft(null)} className="rounded-full border border-input px-4 py-2 text-sm font-semibold">Cancelar</button>
                  <button disabled={wrong.isPending || draft.trim().length < 5} onClick={() => wrong.mutate({ id: open.id, message: draft.trim() })}
                    className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50">{wrong.isPending ? "A enviar…" : "Enviar email"}</button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="border-b border-border py-2.5 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
      <div className="mt-0.5 text-foreground">{v || "—"}</div>
    </div>
  );
}

function Detail({ app, member, busy, onWrong, onVerify, onDeleted }: { app: App; member: boolean; busy: boolean; onWrong: () => void; onVerify: (v: boolean) => void; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(app.notes ?? "");
  const [saved, setSaved] = useState(false);

  const download = async (path: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from("candidaturas").createSignedUrl(path, 60);
    if (!error && data) window.open(data.signedUrl, "_blank");
  };
  const saveNotes = async () => {
    const r = await saveMemberNote({ data: { id: app.id, notes } }).catch(() => null);
    if (!r) return alert("Não foi possível guardar a nota.");
    setSaved(true); setTimeout(() => setSaved(false), 1500);
    qc.invalidateQueries({ queryKey: ["apps"] });
  };
  const remove = async () => {
    if (!confirm(`Apagar a candidatura de ${app.name}? Esta ação não pode ser desfeita.`)) return;
    const paths = [app.cv_path, app.extra_path, app.morada_path].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("candidaturas").remove(paths);
    await supabase.from("applications").delete().eq("id", app.id);
    qc.invalidateQueries({ queryKey: ["apps"] });
    onDeleted();
  };

  const files: [string, string | null][] = [["Currículo (CV)", app.cv_path], ["Carta de apresentação ou certificado", app.extra_path], ["Comprovativo de morada", app.morada_path]];

  return (
    <>
      <SheetHeader>
        <p className="text-sm font-semibold text-navy">Candidatura n.º {app.application_number}</p>
        <SheetTitle className="font-display text-2xl text-navy">{app.name}</SheetTitle>
        <p className="text-sm text-muted-foreground">Recebida a {fmtDate(app.created_at)}</p>
      </SheetHeader>

      <div className="mt-6 rounded-xl border border-border bg-cream p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-navy">Estado</p>
          <StatusBadge verified={app.verified} wrong={app.wrong_docs} />
        </div>
        {!member && (app.verified ? (
          <button onClick={() => onVerify(false)} disabled={busy}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-navy disabled:opacity-60">
            <Undo2 className="h-4 w-4" /> Voltar a marcar como Novo
          </button>
        ) : (
          <button onClick={() => onVerify(true)} disabled={busy}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60">
            <Check className="h-4 w-4" /> Marcar como Verificado
          </button>
        )}
        {!app.verified && (
          <button onClick={onWrong} disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-3 text-sm font-semibold text-destructive disabled:opacity-60">
            <AlertTriangle className="h-4 w-4" /> {app.wrong_docs ? "Reenviar email de Doc Errado" : "Doc Errado — pedir novos documentos"}
          </button>
        ))}
      </div>

      {!member && (
      <div className="mt-6">
        <p className="text-sm font-semibold text-navy">Ficheiros</p>
        <div className="mt-2 space-y-2">
          {files.map(([label, p]) => (
            <button key={label} onClick={() => download(p)} disabled={!p}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-cream px-3 py-2.5 text-left text-sm hover:border-navy/40 disabled:opacity-50">
              <FileText className="h-4 w-4 text-navy" /><span className="flex-1">{label}</span><Download className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="mt-6">
        <Row k="Email" v={<a className="text-navy underline" href={`mailto:${app.email}`}>{app.email}</a>} />
        <Row k="Telemóvel" v={app.phone} />
        <Row k="Nível estimado" v={app.level} />
        <Row k="Horas por dia" v={app.hours} />
        <Row k="Dias disponíveis" v={app.days.join(", ")} />
        <Row k="Pode começar" v={app.start_when} />
        <Row k="Equipamento" v={app.equipment.join(", ")} />
        <Row k="Experiência" v={app.experience} />
        <Row k="Português escrito" v={app.pt_level} />
        <Row k="Pontos fortes" v={app.strengths.join(", ")} />
        <Row k="Porque é a pessoa certa" v={<p className="whitespace-pre-wrap">{app.why}</p>} />
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-navy">Notas internas</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
          className="mt-2 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-navy" />
        <button onClick={saveNotes} className="mt-2 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground">{saved ? "Guardado ✓" : "Guardar notas"}</button>
      </div>

      {!member && (
      <button onClick={remove} className="mt-8 inline-flex items-center gap-2 text-sm text-destructive hover:underline">
        <Trash2 className="h-4 w-4" /> Apagar candidatura
      </button>
      )}
    </>
  );
}

function TeamPanel() {
  const qc = useQueryClient();
  const team = useQuery({ queryKey: ["team"], queryFn: () => listTeamUsers() });
  const toggle = useMutation({
    mutationFn: ({ userId, grant }: { userId: string; grant: boolean }) => setMemberAccess({ data: { userId, grant } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
    onError: (e) => alert(e instanceof Error ? e.message : "Não foi possível alterar o acesso."),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">Utilizadores</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Quem criar conta em /auth aparece aqui. Autorize o acesso para essa pessoa ver apenas as candidaturas Verificadas — sem poder editar, apagar ou descarregar ficheiros, apenas escrever observações.
      </p>
      <div className="mt-6 space-y-3">
        {team.isLoading && <p className="text-muted-foreground">A carregar...</p>}
        {team.error && <p className="text-destructive">Não foi possível carregar os utilizadores.</p>}
        {(team.data ?? []).map((u) => (
          <div key={u.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-navy">{u.email}</p>
              <p className="text-xs text-muted-foreground">Conta criada a {fmtDate(u.created_at)}</p>
            </div>
            {u.role === "admin" ? (
              <span className="inline-flex w-fit items-center rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-navy-foreground">Administrador</span>
            ) : (
              <button
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ userId: u.id, grant: u.role !== "user" })}
                className={`w-fit rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50 ${u.role === "user" ? "border border-destructive text-destructive" : "bg-navy text-navy-foreground"}`}
              >
                {u.role === "user" ? "Remover acesso" : "Autorizar acesso"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function defaultWrongMessage(n: number | null) {
  return `Analisámos a sua candidatura${n != null ? ` n.º ${n}` : ""} e verificámos que os documentos enviados não estão corretos ou não estão legíveis.

Para continuarmos o processo, volte a enviar o Currículo (CV), a carta de apresentação ou certificado e o comprovativo de morada no link abaixo. Não precisa de preencher o questionário outra vez.`;
}
