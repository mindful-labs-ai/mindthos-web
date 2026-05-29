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

import { identifyUser, resetMixpanel } from './mixpanel';

describe('mixpanel helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps Mixpanel identity on auth UUID and registers DB user_id as a join key', () => {
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

  it('does not register invalid join user IDs', () => {
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

  it('resets Mixpanel state on logout', () => {
    resetMixpanel();

    expect(mixpanelMock.reset).toHaveBeenCalled();
  });
});
