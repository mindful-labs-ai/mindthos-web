import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getFamilySummaryStatus,
  resetFamilySummary,
  triggerFamilySummary,
} from './familySummaryServerApi';

const mocks = vi.hoisted(() => ({
  serverRequest: vi.fn(),
}));

vi.mock('./serverClient', () => ({
  serverRequest: mocks.serverRequest,
}));

describe('familySummaryServerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.serverRequest.mockResolvedValue({ clientId: 'c-1', status: 'pending' });
  });

  describe('triggerFamilySummary', () => {
    it('clientId만 있을 때 POST /family-summaries에 clientId만 body로 전송해야 한다', async () => {
      await triggerFamilySummary('c-1');

      expect(mocks.serverRequest).toHaveBeenCalledWith('/family-summaries', {
        method: 'POST',
        body: { clientId: 'c-1' },
      });
    });

    it('forceRefresh가 주어지면 body에 포함해야 한다', async () => {
      await triggerFamilySummary('c-1', { forceRefresh: true });

      expect(mocks.serverRequest).toHaveBeenCalledWith('/family-summaries', {
        method: 'POST',
        body: { clientId: 'c-1', forceRefresh: true },
      });
    });

    it('idempotencyKey가 주어지면 body에 포함해야 한다', async () => {
      await triggerFamilySummary('c-1', { idempotencyKey: 'idem-key-abc' });

      expect(mocks.serverRequest).toHaveBeenCalledWith('/family-summaries', {
        method: 'POST',
        body: { clientId: 'c-1', idempotencyKey: 'idem-key-abc' },
      });
    });

    it('forceRefresh와 idempotencyKey 모두 주어지면 둘 다 body에 포함해야 한다', async () => {
      await triggerFamilySummary('c-1', {
        forceRefresh: false,
        idempotencyKey: 'idem-xyz',
      });

      expect(mocks.serverRequest).toHaveBeenCalledWith('/family-summaries', {
        method: 'POST',
        body: { clientId: 'c-1', forceRefresh: false, idempotencyKey: 'idem-xyz' },
      });
    });

    it('forceRefresh가 undefined면 body에 포함하지 않아야 한다', async () => {
      await triggerFamilySummary('c-1', { forceRefresh: undefined });

      const [, opts] = mocks.serverRequest.mock.calls[0] as [string, { body: Record<string, unknown> }];
      expect(opts.body).not.toHaveProperty('forceRefresh');
    });

    it('idempotencyKey가 undefined면 body에 포함하지 않아야 한다', async () => {
      await triggerFamilySummary('c-1', { idempotencyKey: undefined });

      const [, opts] = mocks.serverRequest.mock.calls[0] as [string, { body: Record<string, unknown> }];
      expect(opts.body).not.toHaveProperty('idempotencyKey');
    });

    it('serverRequest의 반환값을 그대로 반환해야 한다', async () => {
      mocks.serverRequest.mockResolvedValueOnce({ clientId: 'c-1', status: 'completed' });

      const result = await triggerFamilySummary('c-1');

      expect(result).toEqual({ clientId: 'c-1', status: 'completed' });
    });
  });

  describe('getFamilySummaryStatus', () => {
    it('GET /family-summaries/status?clientId=<encoded> 를 호출해야 한다', async () => {
      mocks.serverRequest.mockResolvedValueOnce({
        clientId: 'c-1',
        status: 'none',
      });

      await getFamilySummaryStatus('c-1');

      expect(mocks.serverRequest).toHaveBeenCalledWith(
        '/family-summaries/status?clientId=c-1'
      );
    });

    it('clientId에 특수문자가 있으면 URL 인코딩해야 한다', async () => {
      mocks.serverRequest.mockResolvedValueOnce({
        clientId: 'c 1/x',
        status: 'none',
      });

      await getFamilySummaryStatus('c 1/x');

      expect(mocks.serverRequest).toHaveBeenCalledWith(
        '/family-summaries/status?clientId=c%201%2Fx'
      );
    });

    it('method 인자 없이 GET으로 호출해야 한다 (기본값)', async () => {
      mocks.serverRequest.mockResolvedValueOnce({ clientId: 'c-1', status: 'pending' });

      await getFamilySummaryStatus('c-1');

      // serverRequest가 두 번째 인자 없이 호출돼야 한다 (GET 기본값)
      expect(mocks.serverRequest).toHaveBeenCalledWith(
        expect.stringContaining('/family-summaries/status')
      );
      const args = mocks.serverRequest.mock.calls[0];
      expect(args).toHaveLength(1);
    });

    it('serverRequest의 반환값을 그대로 반환해야 한다', async () => {
      const expected = {
        clientId: 'c-1',
        status: 'completed' as const,
        familySummary: { subjects: [] },
      };
      mocks.serverRequest.mockResolvedValueOnce(expected);

      const result = await getFamilySummaryStatus('c-1');

      expect(result).toEqual(expected);
    });
  });

  describe('resetFamilySummary', () => {
    it('POST /family-summaries/reset 에 clientId를 body로 전송해야 한다', async () => {
      mocks.serverRequest.mockResolvedValueOnce(undefined);

      await resetFamilySummary('c-1');

      expect(mocks.serverRequest).toHaveBeenCalledWith('/family-summaries/reset', {
        method: 'POST',
        body: { clientId: 'c-1' },
      });
    });

    it('정확히 한 번만 serverRequest를 호출해야 한다', async () => {
      mocks.serverRequest.mockResolvedValueOnce(undefined);

      await resetFamilySummary('c-42');

      expect(mocks.serverRequest).toHaveBeenCalledTimes(1);
    });
  });
});
