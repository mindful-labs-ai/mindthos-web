/**
 * genogramAIQueries — fetchRawAIOutput(= fetchAIOutput) + initFamilySummary 단위 테스트
 *
 * 폴링 루프는 vi.useFakeTimers() + vi.runAllTimersAsync()로 진행시켜 실제 지연 없이 완료.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerApiError } from '@/shared/api/server/serverClient';

import {
  fetchGenerationStatus,
  fetchRawAIOutput,
  initFamilySummary,
} from './genogramAIQueries';

// ─── serverApi 모킹 ───────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  getFamilySummaryStatus: vi.fn(),
  triggerFamilySummary: vi.fn(),
  resetFamilySummary: vi.fn(),
  // supabase
  supabaseFrom: vi.fn(),
  // crypto.randomUUID
  randomUUID: vi.fn(() => 'test-uuid-1234'),
}));

vi.mock('@/shared/api/server/familySummaryServerApi', () => ({
  getFamilySummaryStatus: mocks.getFamilySummaryStatus,
  triggerFamilySummary: mocks.triggerFamilySummary,
  resetFamilySummary: mocks.resetFamilySummary,
}));

// supabase クライアント モック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mocks.supabaseFrom,
  },
}));

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

/** 완료 상태 응답 픽스처 */
const COMPLETED_STATUS = {
  clientId: 'client-abc',
  status: 'completed' as const,
  familySummary: {
    subjects: [{ id: 'p1', name: '홍길동', gender: 'male', role: 'counselee' }],
    partners: [],
    influences: [],
    nuclearFamilies: [],
  },
};

/** 대기 중 상태 */
const PENDING_STATUS = { clientId: 'client-abc', status: 'pending' as const };

/** 없음 상태 */
const NONE_STATUS = { clientId: 'client-abc', status: 'none' as const };

/** 실패 상태 */
const FAILED_STATUS = {
  clientId: 'client-abc',
  status: 'failed' as const,
  errorMessage: '파이프라인 오류 발생',
};

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('fetchRawAIOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // crypto.randomUUID stub
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID });
    mocks.triggerFamilySummary.mockResolvedValue({
      clientId: 'client-abc',
      status: 'pending',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // ── (c) 캐시 히트 ──────────────────────────────────────────────────────────

  it('(c) completed + familySummary 존재하고 forceRefresh=false면 triggerFamilySummary 호출 없이 캐시된 ai_output을 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus.mockResolvedValue(COMPLETED_STATUS);

    const result = await fetchRawAIOutput('client-abc', false);

    expect(mocks.triggerFamilySummary).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      data: {
        client_id: 'client-abc',
        ai_output: COMPLETED_STATUS.familySummary,
      },
    });
  });

  it('(c) opts 생략(기본 forceRefresh=false)일 때도 캐시에서 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus.mockResolvedValue(COMPLETED_STATUS);

    const result = await fetchRawAIOutput('client-abc');

    expect(mocks.triggerFamilySummary).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true });
  });

  // ── (b) 이미 pending — 재트리거 없이 폴링만 ────────────────────────────────

  it('(b) 초기 상태가 pending이면 triggerFamilySummary를 호출하지 않고 폴링만 해야 한다', async () => {
    // 첫 번째(initial) → pending, 두 번째(poll) → completed
    mocks.getFamilySummaryStatus
      .mockResolvedValueOnce(PENDING_STATUS)
      .mockResolvedValueOnce(COMPLETED_STATUS);

    const promise = fetchRawAIOutput('client-abc');
    // 폴링 delay(2000ms) 진행
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(mocks.triggerFamilySummary).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      data: { client_id: 'client-abc' },
    });
  });

  it('(b) pending 폴링 중 completed가 되면 familySummary를 ai_output으로 포함해야 한다', async () => {
    mocks.getFamilySummaryStatus
      .mockResolvedValueOnce(PENDING_STATUS)
      .mockResolvedValueOnce(COMPLETED_STATUS);

    const promise = fetchRawAIOutput('client-abc');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({
      success: true,
      data: { ai_output: COMPLETED_STATUS.familySummary },
    });
  });

  // ── (d) none → trigger → 폴링 ─────────────────────────────────────────────

  it('(d) 초기 상태가 none이면 idempotencyKey를 포함해 triggerFamilySummary를 호출해야 한다', async () => {
    mocks.getFamilySummaryStatus
      .mockResolvedValueOnce(NONE_STATUS)
      .mockResolvedValueOnce(COMPLETED_STATUS);

    const promise = fetchRawAIOutput('client-abc');
    await vi.runAllTimersAsync();
    await promise;

    expect(mocks.triggerFamilySummary).toHaveBeenCalledWith('client-abc', {
      forceRefresh: false,
      idempotencyKey: 'test-uuid-1234',
    });
  });

  it('(d) trigger 후 폴링이 completed로 끝나면 성공 결과를 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus
      .mockResolvedValueOnce(NONE_STATUS)
      .mockResolvedValueOnce(COMPLETED_STATUS);

    const promise = fetchRawAIOutput('client-abc');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({ success: true });
  });

  // ── forceRefresh=true → 캐시 무시 ─────────────────────────────────────────

  it('forceRefresh=true이고 초기 상태가 completed여도 triggerFamilySummary를 호출해야 한다', async () => {
    mocks.getFamilySummaryStatus
      .mockResolvedValueOnce(COMPLETED_STATUS)
      .mockResolvedValueOnce(COMPLETED_STATUS);

    const promise = fetchRawAIOutput('client-abc', true);
    await vi.runAllTimersAsync();
    await promise;

    expect(mocks.triggerFamilySummary).toHaveBeenCalledWith('client-abc', {
      forceRefresh: true,
      idempotencyKey: 'test-uuid-1234',
    });
  });

  it('forceRefresh=true일 때 triggerFamilySummary에 forceRefresh:true를 전달해야 한다', async () => {
    mocks.getFamilySummaryStatus
      .mockResolvedValueOnce(COMPLETED_STATUS)
      .mockResolvedValueOnce(COMPLETED_STATUS);

    const promise = fetchRawAIOutput('client-abc', true);
    await vi.runAllTimersAsync();
    await promise;

    expect(mocks.triggerFamilySummary).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ forceRefresh: true })
    );
  });

  // ── 폴링 중 failed ─────────────────────────────────────────────────────────

  it('폴링 중 status=failed가 되면 PIPELINE_ERROR 코드와 서버 errorMessage를 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus
      .mockResolvedValueOnce(NONE_STATUS) // initial
      .mockResolvedValueOnce(FAILED_STATUS); // poll

    const promise = fetchRawAIOutput('client-abc');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({
      success: false,
      error: {
        code: 'PIPELINE_ERROR',
        message: '파이프라인 오류 발생',
      },
    });
  });

  it('폴링 중 failed이고 errorMessage가 없으면 기본 메시지를 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus
      .mockResolvedValueOnce(NONE_STATUS)
      .mockResolvedValueOnce({
        clientId: 'client-abc',
        status: 'failed' as const,
      });

    const promise = fetchRawAIOutput('client-abc');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({
      success: false,
      error: { code: 'PIPELINE_ERROR' },
    });
    expect(
      (result as { success: false; error: { message: string } }).error.message
    ).toBeTruthy();
  });

  // ── 타임아웃 ──────────────────────────────────────────────────────────────

  it('POLL_TIMEOUT_MS 이내에 완료되지 않으면 PIPELINE_ERROR를 반환해야 한다', async () => {
    // 항상 pending 반환 → 타임아웃 유도
    mocks.getFamilySummaryStatus.mockResolvedValue(PENDING_STATUS);

    const promise = fetchRawAIOutput('client-abc');
    // 타임아웃(3분) + 폴링 간격까지 전부 소진
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({
      success: false,
      error: { code: 'PIPELINE_ERROR' },
    });
  });

  // ── 401 → UNAUTHORIZED ──────────────────────────────────────────────────

  it('getFamilySummaryStatus가 401 ServerApiError를 던지면 UNAUTHORIZED 에러를 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus.mockRejectedValue(
      new ServerApiError(401, 'UNAUTHENTICATED', '로그인이 필요합니다.')
    );

    const result = await fetchRawAIOutput('client-abc');

    expect(result).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '로그인이 필요해요.',
      },
    });
  });

  it('triggerFamilySummary가 401 ServerApiError를 던지면 UNAUTHORIZED 에러를 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus.mockResolvedValueOnce(NONE_STATUS);
    mocks.triggerFamilySummary.mockRejectedValue(
      new ServerApiError(401, 'UNAUTHENTICATED', '로그인이 필요합니다.')
    );

    const result = await fetchRawAIOutput('client-abc');

    expect(result).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '로그인이 필요해요.',
      },
    });
  });

  it('401 이외의 ServerApiError는 PIPELINE_ERROR로 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus.mockRejectedValue(
      new ServerApiError(500, 'INTERNAL_ERROR', '서버 오류')
    );

    const result = await fetchRawAIOutput('client-abc');

    expect(result).toMatchObject({
      success: false,
      error: { code: 'PIPELINE_ERROR', message: '서버 오류' },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('initFamilySummary', () => {
  // supabase 체이닝 헬퍼
  function makeSupabaseChain(error: unknown = null) {
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error }),
    };
    mocks.supabaseFrom.mockReturnValue(chain);
    return chain;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetFamilySummary.mockResolvedValue(undefined);
  });

  it('resetFamilySummary(서버)와 supabase genograms 삭제를 순서대로 호출해야 한다', async () => {
    makeSupabaseChain(null);

    await initFamilySummary('client-abc');

    expect(mocks.resetFamilySummary).toHaveBeenCalledWith('client-abc');
    expect(mocks.supabaseFrom).toHaveBeenCalledWith('genograms');
  });

  it('성공 시 success:true + 정해진 데이터 형태를 반환해야 한다', async () => {
    makeSupabaseChain(null);

    const result = await initFamilySummary('client-abc');

    expect(result).toEqual({
      success: true,
      data: {
        client_id: 'client-abc',
        deleted_genogram: true,
        cleared_client_family_summary: true,
        cleared_transcript_summaries: 0,
      },
    });
  });

  it('supabase delete가 에러를 반환하면 success:false를 반환해야 한다', async () => {
    makeSupabaseChain({ message: 'delete failed' });

    const result = await initFamilySummary('client-abc');

    expect(result).toMatchObject({
      success: false,
      error: expect.objectContaining({
        message: expect.stringContaining('delete failed'),
      }),
    });
  });

  it('resetFamilySummary가 예외를 던지면 success:false를 반환해야 한다', async () => {
    mocks.resetFamilySummary.mockRejectedValue(new Error('서버 리셋 실패'));
    makeSupabaseChain(null);

    const result = await initFamilySummary('client-abc');

    expect(result).toMatchObject({
      success: false,
      error: { message: '서버 리셋 실패' },
    });
  });

  it('ServerApiError가 던져지면 statusCode를 error.code로 사용해야 한다', async () => {
    mocks.resetFamilySummary.mockRejectedValue(
      new ServerApiError(400, 'BAD_REQUEST', '잘못된 요청')
    );
    makeSupabaseChain(null);

    const result = await initFamilySummary('client-abc');

    expect(result).toMatchObject({
      success: false,
      error: { code: 'BAD_REQUEST' },
    });
  });

  it('supabase .delete().eq() 체이닝으로 client_id 기준 row를 삭제해야 한다', async () => {
    const chain = makeSupabaseChain(null);

    await initFamilySummary('client-42');

    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('client_id', 'client-42');
  });
});

describe('fetchGenerationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('서버 상태(pending)를 그대로 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus.mockResolvedValue(PENDING_STATUS);
    await expect(fetchGenerationStatus('client-abc')).resolves.toBe('pending');
  });

  it('completed/none/failed 상태도 그대로 반환해야 한다', async () => {
    mocks.getFamilySummaryStatus.mockResolvedValueOnce(COMPLETED_STATUS);
    await expect(fetchGenerationStatus('client-abc')).resolves.toBe(
      'completed'
    );
    mocks.getFamilySummaryStatus.mockResolvedValueOnce(NONE_STATUS);
    await expect(fetchGenerationStatus('client-abc')).resolves.toBe('none');
    mocks.getFamilySummaryStatus.mockResolvedValueOnce(FAILED_STATUS);
    await expect(fetchGenerationStatus('client-abc')).resolves.toBe('failed');
  });

  it('조회 실패 시 none으로 폴백해야 한다(화면을 막지 않음)', async () => {
    mocks.getFamilySummaryStatus.mockRejectedValue(new Error('network'));
    await expect(fetchGenerationStatus('client-abc')).resolves.toBe('none');
  });
});
