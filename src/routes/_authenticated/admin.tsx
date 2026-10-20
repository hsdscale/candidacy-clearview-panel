import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, LogOut, Tag as TagIcon, Plus, X, Download, Trash2, FileText, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel de candidaturas — Alvanto" },
      { name: "description", content: "Painel privado para gerir candidaturas e etiquetas." },
      { property: "og:title", content: "Painel de candidaturas — Alvanto" },
      { property: "og:description", content: "Painel privado de candidaturas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

export const TAG_COLORS: Record<string, string> = {
  blue: "oklch(0.6 0.15 250)", green: "oklch(0.62 0.15 150)", amber: "oklch(0.75 0.15 75)",
  red: "oklch(0.6 0.2 25)", purple: "oklch(0.58 0.18 300)", pink: "oklch(0.68 0.17 350)",
  teal: "oklch(0.62 0.1 195)", navy: "oklch(0.35 0.08 258)",
};
const color = (c: string) => TAG_COLORS[c] ?? "oklch(0.35 0.08 258)";

type Tag = { id: string; name: string; color: string };
type App = {
  id: string; created_at: string; name: string; email: string; phone: string | null;
  hours: string | null; days: string[]; start_when: string | null; equipment: string[];
  experience: string | null; pt_level: string | null; strengths: string[]; why: string | null; level: string | null;
  cv_path: string | null; extra_path: string | null; morada_path: string | null; notes: string | null;
  application_tags: { tag_id: string }[];
};

function Chip({ tag, on = true, onClick, small }: { tag: Tag; on?: boolean; onClick?: () => void; small?: boolean }) {
  const c = color(tag.color);
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition ${small ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"} ${onClick ? "cursor-pointer" : "cursor-default"}`}
      style={on ? { background: c, borderColor: c, color: "oklch(0.99 0 0)" } : { borderColor: c, color: c }}>
      {on && onClick && <Check className="h-3 w-3" />}{tag.name}
    </button>
  );
}

function Admin() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [manage, setManage] = useState(false);

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id).eq("role", "admin");
      return { admin: (data?.length ?? 0) > 0, email: u.user?.email };
    },
  });
  const tags = useQuery({
    queryKey: ["tags"], enabled: !!role.data?.admin,
    queryFn: async () => { const { data, error } = await supabase.from("tags").select("*").order("created_at"); if (error) throw error; return data as Tag[]; },
  });
  const apps = useQuery({
    queryKey: ["apps"], enabled: !!role.data?.admin,
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*, application_tags(tag_id)").order("created_at", { ascending: false });
      if (error) throw error; return data as App[];
    },
  });

  const toggleTag = useMutation({
    mutationFn: async ({ app, tag, on }: { app: string; tag: string; on: boolean }) => {
      const r = on
        ? await supabase.from("application_tags").delete().eq("application_id", app).eq("tag_id", tag)
        : await supabase.from("application_tags").insert({ application_id: app, tag_id: tag });
      if (r.error) throw r.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps"] }),
  });

  const tagMap = useMemo(() => new Map((tags.data ?? []).map((t) => [t.id, t])), [tags.data]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (apps.data ?? []).filter((a) =>
      (!s || a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s)) &&
      filter.every((f) => a.application_tags.some((t) => t.tag_id === f)));
  }, [apps.data, q, filter]);
  const open = apps.data?.find((a) => a.id === openId) ?? null;

  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  if (role.isLoading) return <div className="p-10 text-center text-muted-foreground">A carregar...</div>;
  if (!role.data?.admin) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
      <h1 className="font-display text-2xl font-extrabold text-navy">Sem acesso</h1>
      <p className="max-w-sm text-sm text-muted-foreground">A conta {role.data?.email} não tem permissão de administrador.</p>
      <button onClick={signOut} className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-navy-foreground">Sair</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-xl font-bold">Alvanto</p>
            <p className="text-xs opacity-80">Painel de candidaturas</p>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-md border border-navy-foreground/30 px-3 py-2 text-sm hover:bg-navy-foreground/10">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
            Candidaturas <span className="text-base font-semibold text-muted-foreground">({list.length})</span>
          </h1>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por nome ou email"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <TagIcon className="h-4 w-4 text-muted-foreground" />
          {(tags.data ?? []).map((t) => (
            <Chip key={t.id} tag={t} on={filter.includes(t.id)} onClick={() => setFilter(filter.includes(t.id) ? filter.filter((x) => x !== t.id) : [...filter, t.id])} small />
          ))}
          {filter.length > 0 && <button onClick={() => setFilter([])} className="text-xs text-muted-foreground underline">Limpar filtro</button>}
          <button onClick={() => setManage(true)} className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline">
            <Plus className="h-4 w-4" /> Gerir etiquetas
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {apps.isLoading && <p className="text-muted-foreground">A carregar...</p>}
          {!apps.isLoading && list.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-muted-foreground">Nenhuma candidatura encontrada.</p>
          )}
          {list.map((a) => (
            <button key={a.id} onClick={() => setOpenId(a.id)}
              className="flex w-full flex-col gap-2 rounded-xl border border-border bg-background p-4 text-left transition hover:border-navy/40 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">{a.name}</p>
                <p className="truncate text-sm text-muted-foreground">{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.application_tags.map((t) => tagMap.get(t.tag_id)).filter(Boolean).map((t) => <Chip key={t!.id} tag={t!} small />)}
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-PT")}</p>
            </button>
          ))}
        </div>
      </main>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <Detail app={open} tags={tags.data ?? []} onToggle={(tag, on) => toggleTag.mutate({ app: open.id, tag, on })} onDeleted={() => setOpenId(null)} />}
        </SheetContent>
      </Sheet>

      <TagManager open={manage} onOpenChange={setManage} tags={tags.data ?? []} />
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

function Detail({ app, tags, onToggle, onDeleted }: { app: App; tags: Tag[]; onToggle: (tag: string, on: boolean) => void; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(app.notes ?? "");
  const [saved, setSaved] = useState(false);
  const has = (id: string) => app.application_tags.some((t) => t.tag_id === id);

  const download = async (path: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from("candidaturas").createSignedUrl(path, 60);
    if (!error && data) window.open(data.signedUrl, "_blank");
  };
  const saveNotes = async () => {
    await supabase.from("applications").update({ notes }).eq("id", app.id);
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
        <SheetTitle className="font-display text-2xl text-navy">{app.name}</SheetTitle>
        <p className="text-sm text-muted-foreground">Recebida a {new Date(app.created_at).toLocaleString("pt-PT")}</p>
      </SheetHeader>

      <div className="mt-6">
        <p className="text-sm font-semibold text-navy">Etiquetas</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => <Chip key={t.id} tag={t} on={has(t.id)} onClick={() => onToggle(t.id, has(t.id))} />)}
        </div>
      </div>

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

      <button onClick={remove} className="mt-8 inline-flex items-center gap-2 text-sm text-destructive hover:underline">
        <Trash2 className="h-4 w-4" /> Apagar candidatura
      </button>
    </>
  );
}

function TagManager({ open, onOpenChange, tags }: { open: boolean; onOpenChange: (o: boolean) => void; tags: Tag[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [c, setC] = useState("blue");
  const [err, setErr] = useState<string | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["tags"] }); qc.invalidateQueries({ queryKey: ["apps"] }); };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("tags").insert({ name: name.trim(), color: c });
    if (error) return setErr("Já existe uma etiqueta com esse nome.");
    setErr(null); setName(""); refresh();
  };
  const del = async (t: Tag) => {
    if (!confirm(`Apagar a etiqueta "${t.name}"? Será removida de todas as candidaturas.`)) return;
    await supabase.from("tags").delete().eq("id", t.id); refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-navy">Gerir etiquetas</DialogTitle></DialogHeader>
        <form onSubmit={add} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Nome da etiqueta (ex.: Entrevista marcada)"
            className="w-full rounded-lg border border-border bg-cream px-3 py-2.5 text-sm outline-none focus:border-navy" />
          <div className="flex flex-wrap gap-2">
            {Object.keys(TAG_COLORS).map((k) => (
              <button type="button" key={k} onClick={() => setC(k)} aria-label={k}
                className={`h-8 w-8 rounded-full border-2 ${c === k ? "border-navy" : "border-transparent"}`} style={{ background: color(k) }} />
            ))}
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button className="inline-flex items-center gap-1 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground"><Plus className="h-4 w-4" /> Criar etiqueta</button>
        </form>
        <div className="mt-4 space-y-2">
          {tags.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Chip tag={t} small />
              <button onClick={() => del(t)} aria-label="Apagar" className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
