import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const notifyNewApplication = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ applicationId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { sendApplicationNotification } = await import('./application-notification.server');
    try {
      return await sendApplicationNotification(data.applicationId);
    } catch {
      // Saving a candidature succeeds even if email delivery is unavailable.
      console.error('New application notification could not be sent');
      return { notified: false };
    }
  });