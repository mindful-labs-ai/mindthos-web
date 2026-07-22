import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SERVER_FIXTURE = { _fixture: 'server' };

describe('sttBackend 서버 고정', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('환경 플래그와 무관하게 serverSttBackend를 선택합니다.', async () => {
    vi.stubEnv('VITE_USE_SERVER_STT', 'false');
    vi.doMock('./serverSttBackend', () => ({
      serverSttBackend: SERVER_FIXTURE,
    }));

    const { sttBackend } = await import('./index');

    expect((sttBackend as unknown as typeof SERVER_FIXTURE)._fixture).toBe(
      'server'
    );
  });
});
