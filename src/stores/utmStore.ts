import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { UTM_KEYS } from '@/shared/utils/utm';

/**
 * 유입·코호트 파라미터 전역 저장소
 * 첫 진입 시 파라미터를 저장하고, 인증 전까지 라우팅 URL에 유지합니다.
 * sessionStorage를 사용하여 탭/세션 단위로 유지돼요.
 */

interface UtmState {
  /** 저장된 파라미터 문자열 (예: "utm_source=google&cohort=GENOGRAM") */
  utmParams: string;
  /** UTM이 초기화되었는지 여부 */
  isInitialized: boolean;
  /** 인증·획득 처리 이후 라우팅 URL에 UTM을 계속 붙일지 여부 */
  shouldPropagateToUrl: boolean;
}

interface UtmActions {
  /** 첫 진입 시 UTM 파라미터 저장 (이미 저장된 경우 무시) */
  initializeUtm: (search: string) => void;
  /** UTM 파라미터 강제 업데이트 */
  setUtm: (utmParams: string) => void;
  /** 서버 전송을 위해 저장값은 유지하고 URL 전파만 중단 */
  stopUrlPropagation: () => void;
  /** UTM 파라미터 초기화 */
  clearUtm: () => void;
}

type UtmStore = UtmState & UtmActions;

/** 쿼리스트링에서 UTM 파라미터만 추출 */
function extractUtmFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  const utmParams = new URLSearchParams();

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      utmParams.set(key, value);
    }
  }

  return utmParams.toString();
}

export const useUtmStore = create<UtmStore>()(
  devtools(
    persist(
      (set, get) => ({
        utmParams: '',
        isInitialized: false,
        shouldPropagateToUrl: true,

        initializeUtm: (search: string) => {
          const { isInitialized, utmParams } = get();

          // 이미 초기화되었고 UTM이 있으면 무시
          if (isInitialized && utmParams) {
            return;
          }

          const extracted = extractUtmFromSearch(search);
          if (extracted) {
            set(
              { utmParams: extracted, isInitialized: true },
              false,
              'initializeUtm'
            );
          } else {
            set({ isInitialized: true }, false, 'initializeUtm');
          }
        },

        setUtm: (utmParams: string) => {
          set(
            { utmParams, isInitialized: true, shouldPropagateToUrl: true },
            false,
            'setUtm'
          );
        },

        stopUrlPropagation: () => {
          set({ shouldPropagateToUrl: false }, false, 'stopUrlPropagation');
        },

        clearUtm: () => {
          set(
            {
              utmParams: '',
              isInitialized: false,
              shouldPropagateToUrl: true,
            },
            false,
            'clearUtm'
          );
        },
      }),
      {
        name: 'utm-storage',
        storage: {
          getItem: (name) => {
            const str = sessionStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          },
          setItem: (name, value) => {
            sessionStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            sessionStorage.removeItem(name);
          },
        },
      }
    ),
    { name: 'UtmStore', enabled: !import.meta.env.PROD }
  )
);

/** 현재 상태에서 URL로 전파해도 되는 획득 파라미터만 반환합니다. */
export function getUtmParamsForUrl(): string {
  const { shouldPropagateToUrl, utmParams } = useUtmStore.getState();
  return shouldPropagateToUrl ? utmParams : '';
}
