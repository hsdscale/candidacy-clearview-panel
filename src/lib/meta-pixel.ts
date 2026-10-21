const PIXEL_ID = "1701588181483385";

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown; callMethod?: (...a: unknown[]) => void };

export function initMetaPixel() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const n: Fbq = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue!.push(args);
  } as Fbq;
  n.queue = [];
  n.loaded = true;
  n.version = "2.0";
  n.push = n;
  w.fbq = n;
  w._fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  n("init", PIXEL_ID);
}

export function trackPixel(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq("track", event, params);
}
