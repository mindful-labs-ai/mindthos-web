import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUtmStore } from '@/stores/utmStore';

import {
  captureAcquisition,
  captureCohortSurvey,
  getCohortSurveyStatus,
} from './acquisitionServerApi';

const mocks = vi.hoisted(() => ({
  serverRequest: vi.fn(),
}));

vi.mock('./serverClient', () => ({
  serverRequest: mocks.serverRequest,
}));

describe('acquisitionServerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUtmStore.setState({
      utmParams:
        'utm_source=google&utm_medium=cpc&utm_campaign=keyword-a&utm_term=therapy&utm_content=banner-1&utm_id=ad-1&cohort=GENOGRAM',
      isInitialized: true,
      shouldPropagateToUrl: true,
    });
  });

  it('저장된 유입 파라미터와 완료 단계를 서버로 보낸다', async () => {
    mocks.serverRequest.mockResolvedValue({
      received: true,
      stage: 'signup_complete',
      cohort: 'GENOGRAM',
    });

    await expect(captureAcquisition('signup_complete')).resolves.toEqual({
      received: true,
      stage: 'signup_complete',
      cohort: 'GENOGRAM',
    });

    expect(mocks.serverRequest).toHaveBeenCalledWith('/auth/acquisition', {
      method: 'POST',
      body: {
        stage: 'signup_complete',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'keyword-a',
        utm_term: 'therapy',
        utm_content: 'banner-1',
        utm_id: 'ad-1',
        cohort: 'GENOGRAM',
      },
    });
    expect(useUtmStore.getState()).toMatchObject({
      shouldPropagateToUrl: false,
      utmParams: expect.stringContaining('cohort=GENOGRAM'),
    });
  });

  it('인증 metadata에 보존된 값이 sessionStorage 값보다 우선한다', async () => {
    mocks.serverRequest.mockResolvedValue({
      received: true,
      stage: 'signup_authenticated',
      cohort: 'CBT',
    });

    await captureAcquisition('signup_authenticated', {
      utm_source: 'naver',
      utm_campaign: 'keyword-b',
      cohort: 'CBT',
    });

    expect(mocks.serverRequest).toHaveBeenCalledWith('/auth/acquisition', {
      method: 'POST',
      body: {
        stage: 'signup_authenticated',
        utm_source: 'naver',
        utm_medium: 'cpc',
        utm_campaign: 'keyword-b',
        utm_term: 'therapy',
        utm_content: 'banner-1',
        utm_id: 'ad-1',
        cohort: 'CBT',
      },
    });
  });

  it('서버 수신 실패가 가입/코호트 완료 흐름을 막지 않도록 null을 반환한다', async () => {
    mocks.serverRequest.mockRejectedValue(new Error('server unavailable'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(captureAcquisition('cohort_complete')).resolves.toBeNull();

    expect(useUtmStore.getState().shouldPropagateToUrl).toBe(true);

    expect(warn).toHaveBeenCalledWith(
      '[acquisition] capture failed',
      expect.any(Error)
    );
    warn.mockRestore();
  });

  it('질문 선택지 번호를 중앙 값으로 변환해 cohort_complete로 보낸다', async () => {
    mocks.serverRequest.mockResolvedValue({
      received: true,
      stage: 'cohort_complete',
      cohort: 'CBT',
    });

    await expect(
      captureCohortSurvey({ clientType: 1, therapyTheory: 1, hasRecord: 2 })
    ).resolves.toEqual({
      received: true,
      stage: 'cohort_complete',
      cohort: 'CBT',
    });

    expect(mocks.serverRequest).toHaveBeenCalledWith('/auth/acquisition', {
      method: 'POST',
      body: {
        stage: 'cohort_complete',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'keyword-a',
        utm_term: 'therapy',
        utm_content: 'banner-1',
        utm_id: 'ad-1',
        cohort: 'GENOGRAM',
        client_type: 'ADULT',
        therapy_theory: 'CBT',
        has_record: 'FALSE',
      },
    });
  });

  it('질문 완료 상태를 서버에서 조회한다', async () => {
    mocks.serverRequest.mockResolvedValue({
      completed: false,
      cohort: null,
      default_template_id: null,
      has_record: null,
    });

    await expect(getCohortSurveyStatus()).resolves.toEqual({
      completed: false,
      cohort: null,
      default_template_id: null,
      has_record: null,
    });
    expect(mocks.serverRequest).toHaveBeenCalledWith(
      '/auth/cohort-survey/status'
    );
  });
});
