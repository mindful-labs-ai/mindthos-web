import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, describe, expect, it, vi } from 'vitest';

import handler, { resolveSessionApi } from './create';

describe('legacy session create proxy boundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('Server session URL을 허용한다', () => {
    expect(
      resolveSessionApi({
        SESSION_API_URL: 'https://server.example.com/v1/sessions',
      })
    ).toBe('https://server.example.com/v1/sessions');
  });

  it.each([
    {
      SESSION_API_URL:
        'https://project.supabase.co/functions/v1/create-session',
    },
    {
      VITE_SESSION_API_URL:
        'https://project.supabase.co/functions/v1/create-session',
    },
  ])('/functions/v1 URL을 차단한다', (environment) => {
    expect(() => resolveSessionApi(environment)).toThrow(
      'Supabase Edge Function을 가리킬 수 없습니다.'
    );
  });

  it('Edge Function 설정에서는 외부 요청 전에 실패한다', async () => {
    vi.stubEnv(
      'SESSION_API_URL',
      'https://project.supabase.co/functions/v1/create-session'
    );
    vi.stubGlobal('fetch', vi.fn());

    const req = {
      method: 'POST',
      body: {
        user_id: 1,
        title: '상담',
        s3_key: 'session.wav',
        file_size_mb: 1,
        duration_seconds: 60,
        stt_model: 'basic',
        template_id: 1,
      },
      headers: { authorization: 'Bearer test-token' },
    } as VercelRequest;
    const json = vi.fn();
    const res = {
      setHeader: vi.fn(),
      status: vi.fn(() => ({ json })),
    } as unknown as VercelResponse;

    await handler(req, res);

    expect(fetch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      status: 'failed',
      message: 'SESSION_API_URL은 Supabase Edge Function을 가리킬 수 없습니다.',
    });
  });
});
