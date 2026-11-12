import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, LogOut, Download, Trash2, FileText, Check, Undo2, AlertTriangle, StickyNote, Clock } from "lucide-react";
import { isVer, isWrong, isUso, isNew } from "@/lib/app-state";
import { markWrongDocs } from "@/lib/resubmit.functions";
import { listTeamUsers, setMemberAccess, saveMemberNote } from "@/lib/team.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ApplicationExport } from "@/components/ApplicationExport";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Applications panel — Alvanto" },
      { name: "description", content: "Private panel for managing Alvanto applications." },
      { property: "og:title", content: "Applications panel — Alvanto" },
      { property: "og:description", content: "Private Alvanto applications panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type App = {
  id: string; application_number: number; created_at: string; name: string; email: string; phone: string | null;
  hours: string | null; days: string[]; start_when: string | null; equipment: string[];
  experience: string | null; pt_level: string | null; strengths: string[]; why: string | null; level: string | null;
  cv_path: string | null; extra_path: string | null; morada_path: string | null; selfie_path: string | null; notes: string | null;
  verified: boolean; wrong_docs: boolean; uso: boolean;
};

function StatusBadge({ verified, wrong, uso }: { verified: boolean; wrong?: boolean; uso?: boolean }) {
  if (wrong && !verified) return <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground"><AlertTriangle className="h-3 w-3" />Incorrect documents</span>;
  if (verified) return <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-navy-foreground"><Check className="h-3 w-3" />Verified</span>;
  if (uso) return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-navy"><Clock className="h-3 w-3" />In use</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-amber px-2.5 py-0.5 text-xs font-semibold text-navy">New</span>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB")} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function Admin() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"todas" | "novas" | "verificadas" | "errados" | "uso" | "usuarios">("novas");

  const role = useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { admin: false, member: false, email: undefined };
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
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
      const { error } = await supabase.from("applications").update(verified ? { verified, wrong_docs: false, uso: false } : { verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps"] }),
  });
  const setUso = useMutation({
    mutationFn: async ({ id, uso }: { id: string; uso: boolean }) => {
      const { error } = await supabase.from("applications").update({ uso, verified: false, wrong_docs: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps"] }),
  });
  const resetState = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").update({ verified: false, uso: false, wrong_docs: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps"] }),
  });
  const counts = {
    novas: (apps.data ?? []).filter(isNew).length,
    uso: (apps.data ?? []).filter(isUso).length,
    ver: (apps.data ?? []).filter(isVer).length,
    err: (apps.data ?? []).filter(isWrong).length,
  };
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
    const name = prompt("Preset name (e.g. illegible document):")?.trim();
    if (!name) return;
    const existing = presets.data?.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const { error } = existing
      ? await supabase.from("email_presets").update({ body }).eq("id", existing.id)
      : await supabase.from("email_presets").insert({ name: name.slice(0, 80), body });
    if (error) return alert("Could not save the preset.");
    qc.invalidateQueries({ queryKey: ["presets"] });
    alert(existing ? "Preset updated." : "Preset saved.");
  };
  const deletePreset = async (id: string, name: string) => {
    if (!confirm(`Delete the preset "${name}"?`)) return;
    await supabase.from("email_presets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["presets"] });
  };
  const wrong = useMutation({
    mutationFn: (v: { id: string; message: string }) => markWrongDocs({ data: v }),
    onSuccess: (r) => { setDraft(null); qc.invalidateQueries({ queryKey: ["apps"] }); alert(r.emailed ? "Email sent to the applicant." : "Status updated, but the email could not be sent to this address."); },
    onError: () => alert("Could not send the email. Please try again."),
  });
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const v = isMember ? "verificadas" : view;
    return (apps.data ?? []).filter((a) =>
      (v === "todas" || (v === "verificadas" ? isVer(a) : v === "errados" ? isWrong(a) : v === "uso" ? isUso(a) : isNew(a))) &&
      (!s || a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s) || String(a.application_number) === s.replace(/^#/, '')));
  }, [apps.data, q, view, isMember]);
  const open = apps.data?.find((a) => a.id === openId) ?? null;

  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  if (role.isLoading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin && !isMember) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
      <h1 className="font-display text-2xl font-extrabold text-navy">No access</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The account {role.data?.email} does not yet have access. Ask the administrator to authorise it in the Team access tab.</p>
      <button onClick={signOut} className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-navy-foreground">Sign out</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-xl font-bold">Alvanto</p>
            <p className="text-xs opacity-80">{isMember ? "Panel — Verified" : "Applications panel"}</p>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-md border border-navy-foreground/30 px-3 py-2 text-sm hover:bg-navy-foreground/10">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
            {view === "usuarios" && isAdmin ? "Team access" : <>Applications <span className="text-base font-semibold text-muted-foreground">({list.length})</span></>}
          </h1>
          {view !== "usuarios" && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {isAdmin && <ApplicationExport key={view + q} ids={list.map(a => a.id)} group={view} />}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number, name or email"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy" />
          </div></div>}
        </div>

        {isAdmin && (
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-background p-1.5 sm:inline-grid sm:w-auto sm:grid-cols-6">
          {([["todas", "All", apps.data?.length ?? 0], ["novas", "New", counts.novas], ["verificadas", "Verified", counts.ver], ["errados", "Incorrect documents", counts.err], ["uso", "In use", counts.uso]] as const).map(([k, label, n]) => (
            <Button variant="ghost" key={k} onClick={() => setView(k)}
              className={`h-auto rounded-lg px-4 py-2 text-sm font-semibold transition ${view === k ? "bg-navy text-navy-foreground hover:bg-navy hover:text-navy-foreground" : "text-navy hover:bg-muted"}`}>
              {label} <span className="opacity-70">({n})</span>
            </Button>
          ))}
          <Button variant="ghost" onClick={() => setView("usuarios")}
            className={`h-auto rounded-lg px-4 py-2 text-sm font-semibold transition ${view === "usuarios" ? "bg-navy text-navy-foreground hover:bg-navy hover:text-navy-foreground" : "text-navy hover:bg-muted"}`}>
            Team access
          </Button>
        </div>
        )}

        {view === "usuarios" && isAdmin ? <TeamPanel /> : (
        <div className="mt-6 space-y-3">
          {apps.isLoading && <p className="text-muted-foreground">Loading...</p>}
          {!apps.isLoading && list.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-muted-foreground">No applications found.</p>
          )}
          {list.map((a) => (
            <button key={a.id} onClick={() => setOpenId(a.id)}
              className="flex w-full flex-col gap-2 rounded-xl border border-border bg-background p-4 text-left transition hover:border-navy/40 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Application # {a.application_number}</p>
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
                <StatusBadge verified={a.verified} wrong={a.wrong_docs} uso={a.uso} />
              </div>
              <p className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">{fmtDate(a.created_at)}</p>
            </button>
          ))}
        </div>
        )}
      </main>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <Detail app={open} member={isMember} busy={setVerified.isPending || setUso.isPending || resetState.isPending || wrong.isPending} onWrong={() => setDraft(defaultWrongMessage(open.application_number))} onVerify={(v) => setVerified.mutate({ id: open.id, verified: v })} onUso={(u) => setUso.mutate({ id: open.id, uso: u })} onReset={() => resetState.mutate(open.id)} onDeleted={() => setOpenId(null)} />}
          {open && draft !== null && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 p-3 sm:items-center">
              <div className="w-full max-w-lg rounded-2xl bg-background p-5 shadow-xl">
                <h3 className="text-lg font-bold">Email to {open.name.split(" ")[0]}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Enviado para {open.email}. Edite o texto à vontade — a saudação, o botão "Resubmit documents" e a assinatura são adicionados automaticamente.</p>
                <div className="mt-3">
                  <p className="text-xs font-semibold">Presets</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button onClick={() => setDraft(defaultWrongMessage(open.application_number))} className="rounded-full border border-input px-3 py-1 text-xs font-semibold hover:bg-muted">Default text</button>
                    {(presets.data ?? []).map((p) => (
                      <span key={p.id} className="inline-flex items-center rounded-full border border-input text-xs font-semibold">
                        <button onClick={() => setDraft(p.body.replaceAll("{numero}", String(open.application_number ?? "")))} className="py-1 pl-3 pr-1.5 hover:underline">{p.name}</button>
                        <button aria-label={`Delete ${p.name}`} onClick={() => deletePreset(p.id, p.name)} className="pr-2 text-muted-foreground hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={9} maxLength={3000}
                  className="mt-3 w-full rounded-xl border border-input bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button disabled={draft.trim().length < 5} onClick={() => savePreset(draft.trim())} className="mr-auto text-xs font-semibold text-muted-foreground underline disabled:opacity-50">Save as preset</button>
                  <button onClick={() => setDraft(null)} className="rounded-full border border-input px-4 py-2 text-sm font-semibold">Cancel</button>
                  <button disabled={wrong.isPending || draft.trim().length < 5} onClick={() => wrong.mutate({ id: open.id, message: draft.trim() })}
                    className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50">{wrong.isPending ? "Sending…" : "Send email"}</button>
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

function Detail({ app, member, busy, onWrong, onVerify, onUso, onReset, onDeleted }: { app: App; member: boolean; busy: boolean; onWrong: () => void; onVerify: (v: boolean) => void; onUso: (u: boolean) => void; onReset: () => void; onDeleted: () => void }) {
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
    if (!r) return alert("Could not save the note.");
    setSaved(true); setTimeout(() => setSaved(false), 1500);
    qc.invalidateQueries({ queryKey: ["apps"] });
  };
  const remove = async () => {
    if (!confirm(`Delete the application from ${app.name}? This action cannot be undone.`)) return;
    const paths = [app.cv_path, app.extra_path, app.morada_path, app.selfie_path].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("candidaturas").remove(paths);
    await supabase.from("applications").delete().eq("id", app.id);
    qc.invalidateQueries({ queryKey: ["apps"] });
    onDeleted();
  };

  const files: [string, string | null][] = [["Identity document — front", app.cv_path], ["Identity document — back", app.extra_path], ["Proof of UK address", app.morada_path], ["Photo of your face (selfie)", app.selfie_path]];

  return (
    <>
      <SheetHeader>
        <p className="text-sm font-semibold text-navy">Application # {app.application_number}</p>
        <SheetTitle className="font-display text-2xl text-navy">{app.name}</SheetTitle>
        <p className="text-sm text-muted-foreground">Received on {fmtDate(app.created_at)}</p>
      </SheetHeader>

      <div className="mt-6 rounded-xl border border-border bg-cream p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-navy">Estado</p>
          <StatusBadge verified={app.verified} wrong={app.wrong_docs} uso={app.uso} />
        </div>
        {!member && (
          <>
            {!app.verified && (
              <button onClick={() => onVerify(true)} disabled={busy}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60">
                <Check className="h-4 w-4" /> Mark as Verified
              </button>
            )}
            {!app.uso && (
              <button onClick={() => onUso(true)} disabled={busy}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-navy disabled:opacity-60 ${app.verified ? "mt-3" : "mt-2"}`}>
                <Clock className="h-4 w-4" /> Mark as In use
              </button>
            )}
            <button onClick={onWrong} disabled={busy}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-3 text-sm font-semibold text-destructive disabled:opacity-60">
              <AlertTriangle className="h-4 w-4" /> {app.wrong_docs ? "Resend document correction email" : "Incorrect documents — request new documents"}
            </button>
            {(app.verified || app.uso || app.wrong_docs) && (
              <button onClick={onReset} disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-navy disabled:opacity-60">
                <Undo2 className="h-4 w-4" /> Mark as New again
              </button>
            )}
          </>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-navy">Files</p>
        <div className="mt-2 space-y-2">
          {files.map(([label, p]) => (
            <button key={label} onClick={() => download(p)} disabled={!p}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-cream px-3 py-2.5 text-left text-sm hover:border-navy/40 disabled:opacity-50">
              <FileText className="h-4 w-4 text-navy" /><span className="flex-1">{label}</span><Download className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Row k="Email" v={<a className="text-navy underline" href={`mailto:${app.email}`}>{app.email}</a>} />
        <Row k="Mobile phone" v={app.phone} />
        <Row k="Estimated level" v={app.level} />
        <Row k="Hours per day" v={app.hours} />
        <Row k="Available days" v={app.days.join(", ")} />
        <Row k="Can start" v={app.start_when} />
        <Row k="Equipment" v={app.equipment.join(", ")} />
        <Row k="Experience" v={app.experience} />
        <Row k="Written English" v={app.pt_level} />
        <Row k="Strengths" v={app.strengths.join(", ")} />
        <Row k="Why they are right for the role" v={<p className="whitespace-pre-wrap">{app.why}</p>} />
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-navy">Internal notes</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
          className="mt-2 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-navy" />
        <button onClick={saveNotes} className="mt-2 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground">{saved ? "Saved ✓" : "Save notes"}</button>
      </div>

      {!member && (
      <button onClick={remove} className="mt-8 inline-flex items-center gap-2 text-sm text-destructive hover:underline">
        <Trash2 className="h-4 w-4" /> Delete application
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
    onError: (e) => alert(e instanceof Error ? e.message : "Could not change access."),
  });

  return (
    <div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Accounts created on the sign-in page appear here. Authorised members can view verified applications and download their documents. They can edit internal notes only; all other editing and deletion is restricted.
      </p>
      <div className="mt-6 space-y-3">
        {team.isLoading && <p className="text-muted-foreground">Loading...</p>}
        {team.error && <p className="text-destructive">Could not load team members.</p>}
        {(team.data ?? []).map((u) => (
          <div key={u.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-navy">{u.email}</p>
              <p className="text-xs text-muted-foreground">Account created on {fmtDate(u.created_at)}</p>
            </div>
            {u.role === "admin" ? (
              <span className="inline-flex w-fit items-center rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-navy-foreground">Administrator</span>
            ) : (
              <button
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ userId: u.id, grant: u.role !== "user" })}
                className={`w-fit rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50 ${u.role === "user" ? "border border-destructive text-destructive" : "bg-navy text-navy-foreground"}`}
              >
                {u.role === "user" ? "Remove access" : "Grant access"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function defaultWrongMessage(n: number | null) {
  return `We have reviewed your application${n != null ? ` #${n}` : ""} and found that the documents submitted are incorrect or illegible.

Para continuarmos o processo, volte a enviar o Identity document — front, a carta de apresentação ou certificado e o comprovativo de morada no link abaixo. Não precisa de preencher o questionário outra vez.`;
}
