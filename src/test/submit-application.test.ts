import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ upload: vi.fn(), prepare: vi.fn(), insert: vi.fn(), notify: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  storage: { from: () => ({ uploadToSignedUrl: mocks.upload }) },
  from: () => ({ insert: mocks.insert }),
} }));
vi.mock('@/lib/upload-urls.functions', () => ({ prepareApplicationUploads: mocks.prepare }));
vi.mock('@/lib/application-notification.functions', () => ({ notifyNewApplication: mocks.notify }));

import { submitApplication, type ApplicationInput } from '@/lib/submit-application';

const input: ApplicationInput = {
  name: 'Teste Selfie', email: 'teste@example.test', phone: '', hours: '2-4 horas', days: ['Seg'], start: 'De imediato', equip: ['Telemóvel'], exp: 'Sem experiência direta', pt: 'Fluente', strengths: ['Organização'], why: 'Tenho interesse nesta função remota.', level: 'Inicial',
  cv: new File(['test'], 'frente.pdf'), extra: new File(['test'], 'verso.pdf'), morada: new File(['test'], 'morada.pdf'), selfie: new File(['video'], 'verification.webm', { type: 'video/webm' }),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.upload.mockResolvedValue({ error: null });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.prepare.mockImplementation(async ({ data }: any) => { const id = 'abcdef12-0000-4000-8000-000000000000'; return { id, slots: data.files.map((f: any) => ({ label: f.label, path: `${data.slug}_abcdef12/${f.label}.${f.ext}`, token: 't' })) }; });
  mocks.notify.mockResolvedValue({});
});

describe('Submitting the verification video', () => {
  it('requires the video before uploading or saving', async () => {
    const { selfie: _selfie, ...withoutSelfie } = input;
    await expect(submitApplication(withoutSelfie as ApplicationInput)).rejects.toThrow('video');
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('refuses a photo instead of the verification video', async () => {
    const withPhoto = { ...input, selfie: new File(['photo'], 'selfie.jpg', { type: 'image/jpeg' }) };
    await expect(submitApplication(withPhoto)).rejects.toThrow('WEBM or MP4');
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('stores the video path alongside the address in the same private folder', async () => {
    await submitApplication(input);
    const row = mocks.insert.mock.calls[0]?.[0];
    expect(row.selfie_path).toMatch(/^teste-selfie_[a-f0-9]{8}\/selfie.webm$/);
    expect(row.morada_path.split('/')[0]).toBe(row.selfie_path.split('/')[0]);
    expect(mocks.upload).toHaveBeenCalledWith(row.selfie_path, 't', input.selfie, { contentType: 'video/webm' });
    expect(mocks.upload).toHaveBeenCalledTimes(4);
  });
});