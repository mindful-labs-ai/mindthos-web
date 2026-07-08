/**
 * sttBackend 플래그 선택 — VITE_USE_SERVER_STT
 *
 * index.ts는 import.meta.env.VITE_USE_SERVER_STT를 모듈 초기화 시점에 읽어
 * serverSttBackend / edgeFunctionSttBackend 중 하나를 고른다.
 *
 * 각 테스트에서 vi.resetModules() → vi.doMock() → dynamic import 순서로
 * 환경변수를 주입한 뒤 새로운 모듈 인스턴스를 얻는다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SERVER_FIXTURE = { _fixture: 'server' };
const EDGE_FIXTURE = { _fixture: 'edge' };

describe('sttBackend 플래그 선택 (VITE_USE_SERVER_STT)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('VITE_USE_SERVER_STT==="true" → serverSttBackend 선택', async () => {
    vi.stubEnv('VITE_USE_SERVER_STT', 'true');
    vi.doMock('./serverSttBackend', () => ({ serverSttBackend: SERVER_FIXTURE }));
    vi.doMock('./edgeFunctionSttBackend', () => ({
      edgeFunctionSttBackend: EDGE_FIXTURE,
    }));

    const { sttBackend } = await import('./index');
    expect((sttBackend as unknown as typeof SERVER_FIXTURE)._fixture).toBe(
      'server',
    );
  });

  it('VITE_USE_SERVER_STT 미설정 → edgeFunctionSttBackend 선택', async () => {
    vi.stubEnv('VITE_USE_SERVER_STT', '');
    vi.doMock('./serverSttBackend', () => ({ serverSttBackend: SERVER_FIXTURE }));
    vi.doMock('./edgeFunctionSttBackend', () => ({
      edgeFunctionSttBackend: EDGE_FIXTURE,
    }));

    const { sttBackend } = await import('./index');
    expect((sttBackend as unknown as typeof EDGE_FIXTURE)._fixture).toBe(
      'edge',
    );
  });

  it('VITE_USE_SERVER_STT==="false" → edgeFunctionSttBackend 선택', async () => {
    vi.stubEnv('VITE_USE_SERVER_STT', 'false');
    vi.doMock('./serverSttBackend', () => ({ serverSttBackend: SERVER_FIXTURE }));
    vi.doMock('./edgeFunctionSttBackend', () => ({
      edgeFunctionSttBackend: EDGE_FIXTURE,
    }));

    const { sttBackend } = await import('./index');
    expect((sttBackend as unknown as typeof EDGE_FIXTURE)._fixture).toBe(
      'edge',
    );
  });
});
