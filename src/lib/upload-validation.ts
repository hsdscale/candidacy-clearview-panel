export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function uploadError(file: Pick<File, 'name' | 'size'>, photoOnly = false) {
  if (!(photoOnly ? /\.(jpe?g|png)$/i : /\.(pdf|docx?|jpe?g|png)$/i).test(file.name)) {
    return photoOnly ? 'Unsupported format. Use JPG or PNG.' : 'Unsupported format. Use PDF, DOC, DOCX, JPG or PNG.';
  }
  if (file.size > MAX_UPLOAD_BYTES) return 'The file exceeds the maximum size of 10 MB.';
  return null;
}

export function uploadVideoError(file: Pick<File, 'name' | 'size'>) {
  if (!/\.(webm|mp4)$/i.test(file.name)) return 'Unsupported format. The verification video must be WEBM or MP4.';
  if (file.size > MAX_UPLOAD_BYTES) return 'The video exceeds the maximum size of 10 MB.';
  return null;
}