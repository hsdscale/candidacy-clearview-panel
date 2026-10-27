import { describe, expect, it } from "vitest";
import { isVer, isWrong, isUso, isNew, stateName } from "@/lib/app-state";

const app = (verified: boolean, wrong_docs: boolean, uso: boolean) => ({ verified, wrong_docs, uso });

describe("estados da candidatura", () => {
  it("candidatura nova sem estados ativos é Novo", () => {
    const a = app(false, false, false);
    expect(isNew(a)).toBe(true);
    expect(stateName(a)).toBe("Novo");
  });

  it("Uso é exclusivo: só conta quando não está verificado nem Doc Errado", () => {
    expect(isUso(app(false, false, true))).toBe(true);
    expect(stateName(app(false, false, true))).toBe("Em uso");
    // Verificado tem prioridade sobre uso
    expect(isUso(app(true, false, true))).toBe(false);
    expect(stateName(app(true, false, true))).toBe("Verificado");
    // Doc Errado tem prioridade sobre uso
    expect(isUso(app(false, true, true))).toBe(false);
    expect(stateName(app(false, true, true))).toBe("Doc Errado");
  });

  it("Doc Errado exige não verificado", () => {
    expect(isWrong(app(false, true, false))).toBe(true);
    expect(isWrong(app(true, true, false))).toBe(false);
  });

  it("Verificado é verificado, mesmo com outras flags", () => {
    expect(isVer(app(true, true, true))).toBe(true);
    expect(isNew(app(true, false, false))).toBe(false);
  });
});
