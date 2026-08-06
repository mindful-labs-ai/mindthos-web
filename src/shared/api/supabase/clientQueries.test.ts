import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getClientById } from './clientQueries';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  clientMaybeSingle: vi.fn(),
  sessionCountEq: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mocks.from },
}));

describe('getClientById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clientMaybeSingle.mockResolvedValue({
      data: {
        id: 'new-client',
        counselor_id: 81,
        name: '새로 발급된 내담자',
        phone_number: null,
        email: null,
        counsel_theme: null,
        counsel_number: 0,
        counsel_done: false,
        memo: null,
        pin: false,
        created_at: '2026-08-04T00:00:00Z',
        updated_at: '2026-08-04T00:00:00Z',
      },
      error: null,
    });
    mocks.sessionCountEq.mockResolvedValue({ count: 3, error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: mocks.clientMaybeSingle }),
            }),
          }),
        };
      }
      if (table === 'sessions') {
        return {
          select: () => ({ eq: mocks.sessionCountEq }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it('returns the selected client with its current session count', async () => {
    await expect(getClientById('new-client', '81')).resolves.toMatchObject({
      id: 'new-client',
      counselor_id: '81',
      session_count: 3,
    });

    expect(mocks.sessionCountEq).toHaveBeenCalledWith(
      'client_id',
      'new-client'
    );
  });
});
