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

  it('[WEB-EF-19] 인증 API 요청에 Access 쿠키와 Supabase 토큰을 함께 보낸다', async () => {
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

  it('[WEB-EF-20] 공개 API 요청도 Access 쿠키를 보내되 Supabase 토큰은 생략한다', async () => {
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

  it('[WEB-EF-21] Bearer session이 없으면 API를 호출하지 않고 인증 상태를 정리한다', async () => {
    mocks.getSession.mockResolvedValueOnce({ data: { session: null } });

    await expect(serverRequest('/sessions')).rejects.toMatchObject({
      status: 401,
      statusCode: 'UNAUTHENTICATED',
    });

    expect(mocks.clearAuth).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('[WEB-EF-22] EF 호환 오류 응답의 error 코드를 보존한다', async () => {
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

  it('[WEB-EF-23] EF 호환 오류 응답의 추가 필드를 기존 UI가 읽을 수 있게 유지한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: 'RESEND_COOLDOWN',
          message: '잠시 후 다시 시도해주세요.',
          retry_after_seconds: 42,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    await expect(
      serverRequest('/auth/phone-verification/request')
    ).rejects.toEqual(
      expect.objectContaining({
        status: 429,
        success: false,
        error: 'RESEND_COOLDOWN',
        message: '잠시 후 다시 시도해주세요.',
        retry_after_seconds: 42,
      })
    );
  });

  it('[WEB-EF-24] ResponseEntity data를 반환하고 요청 body를 JSON으로 직렬화한다', async () => {
    await expect(
      serverRequest<{ ok: boolean }>('/terms/agree', {
        method: 'POST',
        body: { agreements: [{ terms_id: 'terms-1', agreed: true }] },
      })
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/terms\/agree$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          agreements: [{ terms_id: 'terms-1', agreed: true }],
        }),
      })
    );
  });

  it('[WEB-EF-25] canonical statusCode 오류와 401 인증 복구를 보존한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 'TOKEN_EXPIRED',
          message: '세션이 만료됐습니다.',
          data: null,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    await expect(serverRequest('/terms/check')).rejects.toMatchObject({
      status: 401,
      statusCode: 'TOKEN_EXPIRED',
      error: 'TOKEN_EXPIRED',
      message: '세션이 만료됐습니다.',
    });
    expect(mocks.clearAuth).toHaveBeenCalledTimes(1);
  });
});
