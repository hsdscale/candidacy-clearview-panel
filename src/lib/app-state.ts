export type AppLike = { verified: boolean; wrong_docs: boolean; uso: boolean };

/** Estado Verified. */
export const isVer = (a: AppLike) => a.verified;
/** Estado Incorrect documents (documentos rejeitados, à espera de reenvio). */
export const isWrong = (a: AppLike) => !a.verified && a.wrong_docs;
/** Estado In use (a tratar; nenhum dos outros estados ativo). */
export const isUso = (a: AppLike) => !a.verified && !a.wrong_docs && !!a.uso;
/** Estado New (acabou de chegar; nenhum outro estado ativo). */
export const isNew = (a: AppLike) => !a.verified && !a.wrong_docs && !a.uso;

export function stateName(a: AppLike): "New" | "In use" | "Verified" | "Incorrect documents" {
  if (isVer(a)) return "Verified";
  if (isWrong(a)) return "Incorrect documents";
  if (isUso(a)) return "In use";
  return "New";
}
