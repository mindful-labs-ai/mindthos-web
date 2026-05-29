declare global {
  interface Window {
    wcs?: {
      trans: (conv: Record<string, unknown>) => void;
      inflow: (domain?: string) => void;
    };
    wcs_add?: Record<string, string>;
  }
}

// AccountId must match the landing site (mindthos.com) so click → signup
// conversions stay attached to the same NACOOKIE on the Naver side.
export const NAVER_WCS_ACCOUNT_ID = 's_bfc366d6236';

type NaverConversionType = 'sign_up';

export const trackNaverConversion = (
  type: NaverConversionType,
  params?: Record<string, unknown>
): void => {
  if (typeof window === 'undefined') return;
  if (typeof window.wcs?.trans !== 'function') return;
  if (!window.wcs_add) window.wcs_add = {};
  window.wcs_add['wa'] = NAVER_WCS_ACCOUNT_ID;
  window.wcs.trans({ type, ...(params ?? {}) });
};

export {};
