import { afterEach, describe, expect, it, vi } from 'vitest';

const mixpanelMock = vi.hoisted(() => ({
  identify: vi.fn(),
  init: vi.fn(),
  people: {
    set: vi.fn(),
  },
  register: vi.fn(),
  reset: vi.fn(),
  track: vi.fn(),
}));

vi.mock('mixpanel-browser', () => ({
  default: mixpanelMock,
}));

const importMixpanel = async (token = '') => {
  vi.resetModules();
  // 항상 stub한다(미지정=빈 토큰). 안 그러면 CI의 실제 VITE_MIXPANEL_TOKEN이 새어들어
  // '토큰 없음' 시나리오가 실패한다.
  vi.stubEnv('VITE_MIXPANEL_TOKEN', token);
  return import('./mixpanel');
};

describe('mixpanel helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('keeps Mixpanel identity on auth UUID and registers DB user_id as a join key', async () => {
    const { identifyUser } = await importMixpanel('test-token');

    identifyUser(
      'auth-uuid',
      {
        email: 'user@example.com',
        name: 'User',
      },
      { joinUserId: 123 }
    );

    expect(mixpanelMock.identify).toHaveBeenCalledWith('auth-uuid');
    expect(mixpanelMock.register).toHaveBeenCalledWith({ user_id: 123 });
    expect(mixpanelMock.people.set).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'User',
      user_id: 123,
    });
  });

  it('does not register invalid join user IDs', async () => {
    const { identifyUser } = await importMixpanel('test-token');

    identifyUser(
      'auth-uuid',
      { email: 'user@example.com' },
      { joinUserId: NaN }
    );

    expect(mixpanelMock.identify).toHaveBeenCalledWith('auth-uuid');
    expect(mixpanelMock.register).not.toHaveBeenCalled();
    expect(mixpanelMock.people.set).toHaveBeenCalledWith({
      email: 'user@example.com',
    });
  });

  it('resets Mixpanel state on logout', async () => {
    const { resetMixpanel } = await importMixpanel('test-token');

    resetMixpanel();

    expect(mixpanelMock.reset).toHaveBeenCalled();
  });

  it('no-ops safely when token is missing', async () => {
    const { identifyUser, resetMixpanel, trackEvent } = await importMixpanel();

    trackEvent('clicked');
    identifyUser('auth-uuid');
    resetMixpanel();

    expect(mixpanelMock.init).not.toHaveBeenCalled();
    expect(mixpanelMock.track).not.toHaveBeenCalled();
    expect(mixpanelMock.identify).not.toHaveBeenCalled();
    expect(mixpanelMock.reset).not.toHaveBeenCalled();
  });
});
