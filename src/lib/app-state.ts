export type AppLike = { verified: boolean; wrong_docs: boolean; uso: boolean };

/** Estado Verificado. */
export const isVer = (a: AppLike) => a.verified;
/** Estado Doc Errado (documentos rejeitados, à espera de reenvio). */
export const isWrong = (a: AppLike) => !a.verified && a.wrong_docs;
/** Estado Em uso (a tratar; nenhum dos outros estados ativo). */
export const isUso = (a: AppLike) => !a.verified && !a.wrong_docs && !!a.uso;
/** Estado Novo (acabou de chegar; nenhum outro estado ativo). */
export const isNew = (a: AppLike) => !a.verified && !a.wrong_docs && !a.uso;

export function stateName(a: AppLike): "Novo" | "Em uso" | "Verificado" | "Doc Errado" {
  if (isVer(a)) return "Verificado";
  if (isWrong(a)) return "Doc Errado";
  if (isUso(a)) return "Em uso";
  return "Novo";
}
