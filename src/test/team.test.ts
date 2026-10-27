import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateMock, calls } = vi.hoisted(() => ({ updateMock: vi.fn(), calls: { eqs: [] as [string, unknown][] } }));
vi.mock('@/integrations/supabase/client.server', () => ({
  supabaseAdmin: {
    from: () => ({
      update: updateMock.mockImplementation(() => ({
        eq: (col: string, val: unknown) => {
          calls.eqs.push([col, val]);
          return {
            eq: (c2: string, v2: unknown) => {
              calls.eqs.push([c2, v2]);
              return { select: () => Promise.resolve({ data: [{ id: 'app-1' }], error: null }) };
            },
            select: () => Promise.resolve({ data: [{ id: 'app-1' }], error: null }),
          };
        },
      })),
    }),
  },
}));
import { saveNote } from '../lib/team.server';

describe('Member note permissions', () => {
  beforeEach(() => { vi.clearAllMocks(); calls.eqs.length = 0; });

  it('a member can only write notes on verified applications', async () => {
    await saveNote('app-1', 'boa candidata', false);
    expect(calls.eqs).toContainEqual(['verified', true]);
  });

  it('an admin can write notes without the verified restriction', async () => {
    await saveNote('app-1', 'nota do admin', true);
    expect(calls.eqs).not.toContainEqual(['verified', true]);
  });

  it('only the notes column is ever updated', async () => {
    await saveNote('app-1', 'só notas', false);
    expect(updateMock).toHaveBeenCalledWith({ notes: 'só notas' });
  });
});
