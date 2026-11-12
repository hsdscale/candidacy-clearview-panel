import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Alvanto Applications" },
      { name: "description", content: "Private access to the Alvanto applications panel." },
      { property: "og:title", content: "Sign in — Alvanto Applications" },
      { property: "og:description", content: "Private access to the applications panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) nav({ to: "/admin", replace: true }); });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      setBusy(false);
      if (error) return setErr("Incorrect email or password, or your email has not yet been confirmed.");
      nav({ to: "/admin", replace: true });
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: `${window.location.origin}/auth` } });
      setBusy(false);
      if (error) return setErr(error.message);
      setMsg("Account created. Confirm your email using the link we sent, then sign in.");
      setMode("in");
    }
  };

  const input = "mt-2 w-full rounded-lg border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy";
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-border bg-background p-6 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/10 text-navy"><Lock className="h-5 w-5" /></span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">{mode === "in" ? "Sign in to the panel" : "Create account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Private area for the recruitment team.</p>
        <label className="mt-6 block text-sm font-semibold text-navy">Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-navy">Password
          <input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} className={input} autoComplete={mode === "in" ? "current-password" : "new-password"} />
        </label>
        {err && <p role="alert" className="mt-3 text-sm text-destructive">{err}</p>}
        {msg && <p className="mt-3 text-sm text-navy">{msg}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-md bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground hover:opacity-90 disabled:opacity-60">
          {busy ? "Please wait..." : mode === "in" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); }} className="mt-4 w-full text-sm text-muted-foreground hover:text-navy">
          {mode === "in" ? "Ainda não tem conta? Create account" : "Already have an account? Sign in"}
        </button>
        <Link to="/" className="mt-2 block text-center text-xs text-muted-foreground hover:text-navy">Back to the website</Link>
      </form>
    </div>
  );
}
