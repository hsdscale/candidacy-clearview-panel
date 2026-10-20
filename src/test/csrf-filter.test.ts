import { describe, expect, it, vi } from "vitest";

const { captureCsrf } = vi.hoisted(() => ({ captureCsrf: vi.fn() }));

vi.mock("@tanstack/react-start", () => ({
  createStart: (configure: () => unknown) => configure(),
  createMiddleware: () => ({ server: vi.fn() }),
  createCsrfMiddleware: captureCsrf,
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => { throw new Error("The filter must use its request context"); },
}));
vi.mock("@/integrations/supabase/auth-attacher", () => ({ attachSupabaseAuth: {} }));

import "@/start";

function shouldValidate(pathname: string, handlerType: "serverFn" | "router") {
  const options = captureCsrf.mock.calls[0]?.[0];
  if (!options) throw new Error("CSRF middleware was not registered");
  return options.filter({ pathname, handlerType });
}

describe("CSRF request filter", () => {
  it("keeps protection enabled for app server functions", () => {
    expect(shouldValidate("/_serverFn/submit", "serverFn")).toBe(true);
  });
  it("leaves independently authenticated email handlers exempt", () => {
    expect(shouldValidate("/lovable/email/transactional/preview", "serverFn")).toBe(false);
  });
  it("does not apply server-function protection to page requests", () => {
    expect(shouldValidate("/candidatura", "router")).toBe(false);
  });
});