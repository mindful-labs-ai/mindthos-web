import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ServerApiError,
  serverRequest,
  serverRequestPublic,
} from './serverClient';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  clearAuth: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mocks.getSession },
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ clear: mocks.clearAuth }),
  },
}));

describe('serverClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'supabase-token' } },
    });
    window.history.replaceState({}, '', '/auth');
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
  });

  it('인증 API 요청에 Access 쿠키와 Supabase 토큰을 함께 보낸다', async () => {
    await serverRequest('/sessions');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/sessions$/),
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
      expect.stringMatching(/\/v1\/shared-documents\/token$/),
      expect.objectContaining({
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it('Bearer session이 없으면 API를 호출하지 않고 인증 상태를 정리해야 합니다.', async () => {
    mocks.getSession.mockResolvedValueOnce({ data: { session: null } });

    await expect(serverRequest('/sessions')).rejects.toMatchObject({
      status: 401,
      statusCode: 'UNAUTHENTICATED',
    });

    expect(mocks.clearAuth).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('EF 호환 오류 응답의 error 코드를 보존한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: 'NAME_TOO_LONG',
          message: '이름은 12자 이하로 입력해주세요.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    await expect(serverRequest('/clients/create')).rejects.toEqual(
      expect.objectContaining<Partial<ServerApiError>>({
        status: 400,
        statusCode: 'NAME_TOO_LONG',
        message: '이름은 12자 이하로 입력해주세요.',
      })
    );
  });
});
