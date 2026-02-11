import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * UTM 파라미터 전역 저장소
 * 첫 진입 시 UTM 파라미터를 저장하고, 이후 모든 라우팅에서 자동으로 유지합니다.
 * sessionStorage를 사용하여 탭/세션 단위로 유지됩니다.
 */

interface UtmState {
  /** 저장된 UTM 파라미터 문자열 (예: "utm_source=google&utm_medium=cpc") */
  utmParams: string;
  /** UTM이 초기화되었는지 여부 */
  isInitialized: boolean;
}

interface UtmActions {
  /** 첫 진입 시 UTM 파라미터 저장 (이미 저장된 경우 무시) */
  initializeUtm: (search: string) => void;
  /** UTM 파라미터 강제 업데이트 */
  setUtm: (utmParams: string) => void;
  /** UTM 파라미터 초기화 */
  clearUtm: () => void;
}

type UtmStore = UtmState & UtmActions;

/** UTM 파라미터 키 목록 */
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
] as const;

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
          set({ utmParams, isInitialized: true }, false, 'setUtm');
        },

        clearUtm: () => {
          set({ utmParams: '', isInitialized: false }, false, 'clearUtm');
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
    { name: 'UtmStore' }
  )
);
