import { describe, expect, it } from 'vitest';
import { uploadError, uploadVideoError, MAX_UPLOAD_BYTES } from '@/lib/upload-validation';

describe('Selfie uploads', () => {
  it('accepts JPG and PNG photos but refuses documents', () => {
    expect(uploadError({ name: 'selfie.jpg', size: 100 }, true)).toBeNull();
    expect(uploadError({ name: 'selfie.png', size: 100 }, true)).toBeNull();
    expect(uploadError({ name: 'selfie.pdf', size: 100 }, true)).not.toBeNull();
  });
  it('enforces the existing 10 MB per-file limit', () => {
    expect(uploadError({ name: 'selfie.jpg', size: 10 * 1024 * 1024 }, true)).toBeNull();
    expect(uploadError({ name: 'selfie.jpg', size: MAX_UPLOAD_BYTES + 1 }, true)).not.toBeNull();
  });
});

describe('Verification video uploads', () => {
  it('accepts WEBM and MP4 videos but refuses photos and documents', () => {
    expect(uploadVideoError({ name: 'verification.webm', size: 100 })).toBeNull();
    expect(uploadVideoError({ name: 'verification.mp4', size: 100 })).toBeNull();
    expect(uploadVideoError({ name: 'selfie.jpg', size: 100 })).not.toBeNull();
    expect(uploadVideoError({ name: 'doc.pdf', size: 100 })).not.toBeNull();
  });
  it('enforces the existing 10 MB per-file limit', () => {
    expect(uploadVideoError({ name: 'verification.webm', size: 10 * 1024 * 1024 })).toBeNull();
    expect(uploadVideoError({ name: 'verification.webm', size: MAX_UPLOAD_BYTES + 1 })).not.toBeNull();
  });
});