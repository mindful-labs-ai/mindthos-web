import { beforeEach, describe, expect, it } from 'vitest';

import { useUtmStore } from './utmStore';

describe('utmStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useUtmStore.getState().clearUtm();
  });

  it('stores only supported UTM fields from the initial URL', () => {
    useUtmStore
      .getState()
      .initializeUtm(
        '?utm_source=google&utm_medium=cpc&utm_campaign=spring&ref=ignored'
      );

    expect(useUtmStore.getState()).toMatchObject({
      isInitialized: true,
      utmParams: 'utm_source=google&utm_medium=cpc&utm_campaign=spring',
    });
    expect(sessionStorage.getItem('utm-storage')).toContain(
      'utm_source=google&utm_medium=cpc&utm_campaign=spring'
    );
  });

  it('keeps the first non-empty UTM when another URL is initialized in the same tab', () => {
    const store = useUtmStore.getState();

    store.initializeUtm('?utm_source=google&utm_campaign=first');
    store.initializeUtm('?utm_source=naver&utm_campaign=second');

    expect(useUtmStore.getState().utmParams).toBe(
      'utm_source=google&utm_campaign=first'
    );
  });

  it('accepts a later UTM when the tab was initially opened without one', () => {
    const store = useUtmStore.getState();

    store.initializeUtm('/home');
    store.initializeUtm('?utm_source=google');

    expect(useUtmStore.getState()).toMatchObject({
      isInitialized: true,
      utmParams: 'utm_source=google',
    });
  });

  it('supports an explicit overwrite through setUtm', () => {
    const store = useUtmStore.getState();

    store.initializeUtm('?utm_source=google');
    store.setUtm('utm_source=naver');

    expect(useUtmStore.getState().utmParams).toBe('utm_source=naver');
  });

  it('keeps stored attribution while stopping URL propagation', () => {
    const store = useUtmStore.getState();

    store.initializeUtm('?utm_source=google&utm_campaign=first');
    store.stopUrlPropagation();

    expect(useUtmStore.getState()).toMatchObject({
      utmParams: 'utm_source=google&utm_campaign=first',
      shouldPropagateToUrl: false,
    });
  });

  it('re-enables URL propagation when the attribution session is cleared', () => {
    const store = useUtmStore.getState();

    store.initializeUtm('?utm_source=google');
    store.stopUrlPropagation();
    store.clearUtm();

    expect(useUtmStore.getState()).toMatchObject({
      utmParams: '',
      isInitialized: false,
      shouldPropagateToUrl: true,
    });
  });
});
