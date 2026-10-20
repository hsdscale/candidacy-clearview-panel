import { beforeEach, describe, expect, it, vi } from 'vitest';
import { template } from '../lib/email-templates/new-application';

const { lookup, send } = vi.hoisted(() => ({ lookup: vi.fn(), send: vi.fn() }));
vi.mock('@/integrations/supabase/client.server', () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: lookup }) }) }) },
}));
vi.mock('../lib/email-templates/send-email', () => ({ sendTemplateEmail: send }));
import { sendApplicationNotification } from '../lib/application-notification.server';

describe('New candidature notifications', () => {
  beforeEach(() => vi.resetAllMocks());
  it('uses the owner-selected recipient', () => {
    expect(template.to).toBe('cdrnegociosdigitais@gmail.com');
  });
  it('does not send for an application that was not saved', async () => {
    lookup.mockResolvedValue({ data: null, error: null });
    expect(await sendApplicationNotification('missing')).toEqual({ notified: false });
    expect(send).not.toHaveBeenCalled();
  });
  it('sends the saved name and deduplicates using the event ID', async () => {
    lookup.mockResolvedValue({ data: { id: 'event-123', name: 'Maria Silva' }, error: null });
    send.mockResolvedValue({ sent: true });
    expect(await sendApplicationNotification('event-123')).toEqual({ notified: true });
    expect(send).toHaveBeenCalledWith('new-application', '', {
      templateData: { candidateName: 'Maria Silva' }, idempotencyKey: 'new-application-event-123',
    });
  });
  it('respects recipient suppression without retrying', async () => {
    lookup.mockResolvedValue({ data: { id: 'event-123', name: 'Maria Silva' }, error: null });
    send.mockResolvedValue({ sent: false, reason: 'recipient_suppressed' });
    expect(await sendApplicationNotification('event-123')).toEqual({ notified: false });
    expect(send).toHaveBeenCalledTimes(1);
  });
});