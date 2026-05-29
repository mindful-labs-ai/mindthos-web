import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearGAUserId, setGAUserId, trackGAEvent } from './gtag';

const installGtag = () => {
  const gtag = vi.fn<NonNullable<typeof window.gtag>>();
  window.gtag = gtag;
  return gtag;
};

describe('gtag helpers', () => {
  afterEach(() => {
    delete window.gtag;
    vi.clearAllMocks();
  });

  it('does nothing when gtag is unavailable', () => {
    expect(() =>
      trackGAEvent('sign_up', { method: 'email', userId: 123 })
    ).not.toThrow();
  });

  it('sets numeric userId as GA user_id before sending the event', () => {
    const gtag = installGtag();

    trackGAEvent('sign_up', { method: 'email', userId: 123 });

    expect(gtag).toHaveBeenNthCalledWith(1, 'set', { user_id: '123' });
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'sign_up', {
      method: 'email',
    });
  });

  it('does not send userId as a custom event parameter', () => {
    const gtag = installGtag();

    trackGAEvent('sign_up', { method: 'kakao', user_id: 456 });

    expect(gtag).toHaveBeenNthCalledWith(1, 'set', { user_id: '456' });
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'sign_up', {
      method: 'kakao',
    });
  });

  it('can clear user_id before sending an event', () => {
    const gtag = installGtag();

    trackGAEvent('logout', { userId: null });

    expect(gtag).toHaveBeenNthCalledWith(1, 'set', { user_id: null });
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'logout', {});
  });

  it('can set and clear the global GA user_id', () => {
    const gtag = installGtag();

    setGAUserId(789);
    clearGAUserId();

    expect(gtag).toHaveBeenNthCalledWith(1, 'set', { user_id: '789' });
    expect(gtag).toHaveBeenNthCalledWith(2, 'set', { user_id: null });
  });
});
