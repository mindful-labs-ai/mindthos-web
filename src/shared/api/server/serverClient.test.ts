import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { serverRequest, serverRequestPublic } from './serverClient';

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}));

describe('serverClient', () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: 'supabase-token' } },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            statusCode: 'OK',
            message: 'success',
            data: { ok: true },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('인증 API 요청에 Access 쿠키와 Supabase 토큰을 함께 보낸다', async () => {
    await serverRequest('/sessions');

    expect(fetch).toHaveBeenCalledWith(
      '/v1/sessions',
      expect.objectContaining({
        credentials: 'include',
        headers: {
          Authorization: 'Bearer supabase-token',
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('공개 API 요청도 Access 쿠키를 보내되 Supabase 토큰은 생략한다', async () => {
    await serverRequestPublic('/shared-documents/token');

    expect(fetch).toHaveBeenCalledWith(
      '/v1/shared-documents/token',
      expect.objectContaining({
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
    expect(getSessionMock).not.toHaveBeenCalled();
  });
});
