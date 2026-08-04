import { describe, expect, it } from 'vitest';

import {
  appendUtmParams,
  extractUtmParams,
  hasUtmParams,
  mergeUtmParams,
  parseUtmPayload,
  parseUtmPayloadFromObject,
  removeUtmParams,
  removeUtmParamsFromCurrentUrl,
} from './utm';

describe('utm utilities', () => {
  it('extracts the supported UTM fields and ignores unrelated parameters', () => {
    expect(
      extractUtmParams(
        '?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_id=ad-1&cohort=GENOGRAM&foo=ignored'
      )
    ).toBe(
      'utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_id=ad-1&cohort=GENOGRAM'
    );
  });

  it('preserves URL encoding when extracting UTM values', () => {
    expect(extractUtmParams('?utm_campaign=봄 캠페인&utm_content=a%26b')).toBe(
      'utm_campaign=%EB%B4%84+%EC%BA%A0%ED%8E%98%EC%9D%B8&utm_content=a%26b'
    );
  });

  it('converts UTM query values to a server payload and filters unsupported fields', () => {
    expect(
      parseUtmPayload(
        '?utm_source=google&utm_campaign=spring&cohort=GENOGRAM&ref=ignored'
      )
    ).toEqual({
      utm_source: 'google',
      utm_campaign: 'spring',
      cohort: 'GENOGRAM',
    });
    expect(
      parseUtmPayloadFromObject({
        utm_source: 'naver',
        utm_campaign: 'keyword-a',
        cohort: 'CBT',
        ref: 'ignored',
      })
    ).toEqual({
      utm_source: 'naver',
      utm_campaign: 'keyword-a',
      cohort: 'CBT',
    });
  });

  it('appends UTM values to an external auth callback URL', () => {
    expect(
      appendUtmParams(
        'https://app.mindthos.com/auth/callback',
        'utm_source=google&utm_campaign=spring&cohort=GENOGRAM'
      )
    ).toBe(
      'https://app.mindthos.com/auth/callback?utm_source=google&utm_campaign=spring&cohort=GENOGRAM'
    );
  });

  it('merges stored UTM values without removing existing route parameters', () => {
    expect(
      mergeUtmParams(
        '?clientId=client-1&tab=analyze',
        'utm_source=google&utm_campaign=spring&cohort=GENOGRAM'
      )
    ).toBe(
      'clientId=client-1&tab=analyze&utm_source=google&utm_campaign=spring&cohort=GENOGRAM'
    );
  });

  it('replaces an incoming UTM value with the stored value', () => {
    expect(
      mergeUtmParams(
        '?utm_source=direct&clientId=client-1',
        'utm_source=google'
      )
    ).toBe('utm_source=google&clientId=client-1');
  });

  it('detects whether a query contains a supported UTM field', () => {
    expect(hasUtmParams('?utm_source=google')).toBe(true);
    expect(hasUtmParams('?ref=ad')).toBe(false);
  });

  it('removes tracking fields while preserving route query parameters', () => {
    expect(
      removeUtmParams(
        '?clientId=client-1&utm_source=google&tab=genogram&cohort=GENOGRAM'
      )
    ).toBe('clientId=client-1&tab=genogram');
  });

  it('cleans tracking fields from the current URL without removing route state', () => {
    window.history.pushState(
      {},
      '',
      '/clients?clientId=client-1&utm_source=google&tab=genogram#notes'
    );

    removeUtmParamsFromCurrentUrl();

    expect(window.location.pathname).toBe('/clients');
    expect(window.location.search).toBe('?clientId=client-1&tab=genogram');
    expect(window.location.hash).toBe('#notes');

    window.history.pushState({}, '', '/');
  });
});
