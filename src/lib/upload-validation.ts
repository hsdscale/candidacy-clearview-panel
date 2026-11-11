export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function uploadError(file: Pick<File, 'name' | 'size'>, photoOnly = false) {
  if (!(photoOnly ? /\.(jpe?g|png)$/i : /\.(pdf|docx?|jpe?g|png)$/i).test(file.name)) {
    return photoOnly ? 'Formato não suportado. Use JPG ou PNG.' : 'Formato não suportado. Use PDF, DOC, DOCX, JPG ou PNG.';
  }
  if (file.size > MAX_UPLOAD_BYTES) return 'O ficheiro excede o tamanho máximo de 10 MB.';
  return null;
}