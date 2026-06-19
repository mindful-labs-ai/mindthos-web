import { serverRequest } from '@/shared/api/server/serverClient';

import {
  IMPORT_PROVIDER_KEY,
  type CalendarImportAdapter,
  type CalendarImportFinalizeInput,
  type CalendarImportResult,
  type CalendarProvider,
} from './types';

/**
 * mindthos-server 외부 캘린더 import 어댑터 (서버 매개 OAuth).
 *
 * 서버 계약:
 *  - GET  /calendar/import/:provider/authorize  → { authorizeUrl }  (state는 URL에 내장)
 *    redirect_uri는 서버 env CALENDAR_FRONTEND_CALLBACK_URL 사용(= 우리 콜백 라우트와 동일해야 함).
 *  - POST /calendar/import/:provider/finalize { code, state } → { category, importedEventCount }
 *  - provider=apple → 서버 501 (여기선 isEnabled=false로 사전 차단).
 *
 * serverRequest가 `/v1`·Bearer·envelope(data)를 처리한다.
 */

/** apple은 서버 예약(501) — UI에서 비활성. */
const ENABLED_PROVIDERS: Record<CalendarProvider, boolean> = {
  google: true,
  naver: true,
  apple: false,
};

/** GET authorize 응답 data — 서명 state가 내장된 provider 동의 URL */
interface AuthorizeResponse {
  authorizeUrl: string;
}

/** POST finalize 응답 data (서버가 만든/갱신한 연동 카테고리 + import 건수) */
interface FinalizeResponse {
  category: { id: string; name: string };
  importedEventCount?: number;
}

export const realImportAdapter: CalendarImportAdapter = {
  isEnabled(provider: CalendarProvider): boolean {
    return ENABLED_PROVIDERS[provider] === true;
  },

  async authorize(provider: CalendarProvider): Promise<void> {
    const { authorizeUrl } = await serverRequest<AuthorizeResponse>(
      `/calendar/import/${provider}/authorize`
    );
    // 콜백 redirect_uri엔 provider가 안 실리므로(서버 env 고정) finalize에 쓸 provider를 보관.
    sessionStorage.setItem(IMPORT_PROVIDER_KEY, provider);
    // 동의 URL로 브라우저 이동 (provider가 콜백 페이지로 ?code=&state= 리다이렉트).
    window.location.assign(authorizeUrl);
  },

  async finalize(
    provider: CalendarProvider,
    input: CalendarImportFinalizeInput
  ): Promise<CalendarImportResult> {
    const data = await serverRequest<FinalizeResponse>(
      `/calendar/import/${provider}/finalize`,
      { method: 'POST', body: input }
    );
    return {
      categoryId: data.category.id,
      categoryName: data.category.name,
    };
  },
};
