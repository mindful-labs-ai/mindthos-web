import {
  IMPORT_PROVIDER_KEY,
  type CalendarImportAdapter,
  type CalendarImportFinalizeInput,
  type CalendarImportResult,
  type CalendarProvider,
} from './types';

/**
 * Mock import 어댑터 — 백엔드 없이 UI 플로우만 확인할 때 사용.
 * authorize/finalize는 실제 OAuth 없이 즉시 성공 흉내만 낸다.
 */
const ENABLED_PROVIDERS: Record<CalendarProvider, boolean> = {
  google: true,
  naver: true,
  apple: false,
};

export const mockImportAdapter: CalendarImportAdapter = {
  isEnabled(provider: CalendarProvider): boolean {
    return ENABLED_PROVIDERS[provider] === true;
  },

  async authorize(provider: CalendarProvider): Promise<void> {
    sessionStorage.setItem(IMPORT_PROVIDER_KEY, provider);
    // 실제 리다이렉트 없이 콜백 페이지로 이동(mock code/state).
    const url = new URL('/calendar/oauth/callback', window.location.origin);
    url.searchParams.set('code', `mock-code-${provider}`);
    url.searchParams.set('state', `mock-state-${provider}`);
    window.location.assign(url.toString());
  },

  async finalize(
    provider: CalendarProvider,
    _input: CalendarImportFinalizeInput
  ): Promise<CalendarImportResult> {
    return {
      categoryId: `mock-${provider}-category`,
      categoryName: provider === 'google' ? '구글 캘린더' : '네이버 캘린더',
    };
  },
};
