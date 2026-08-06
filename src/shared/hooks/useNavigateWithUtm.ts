import { useCallback } from 'react';

import {
  useLocation,
  useNavigate,
  type NavigateOptions,
  type To,
} from 'react-router-dom';

import { useUtmStore } from '@/stores/utmStore';

import { mergeUtmParams, removeUtmParams } from '../utils/utm';

/**
 * UTM 파라미터를 유지하면서 라우팅하는 훅
 *
 * 전역 저장소(utmStore)에 저장된 UTM 파라미터를 사용하여
 * URL 전파가 활성화된 동안 라우팅 간 UTM을 유지해요.
 *
 * @example
 * // 기본 사용
 * const { navigateWithUtm, setSearchParamsWithUtm } = useNavigateWithUtm();
 * navigateWithUtm('/sessions');
 * navigateWithUtm({ pathname: '/genogram', search: '?clientId=123' });
 *
 * @example
 * // 쿼리 파라미터와 함께 사용
 * setSearchParamsWithUtm({ clientId: '123' });
 * setSearchParamsWithUtm((prev) => { prev.set('tab', 'info'); return prev; });
 */
export function useNavigateWithUtm() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUtm = useUtmStore((state) => state.utmParams);
  const shouldPropagateToUrl = useUtmStore(
    (state) => state.shouldPropagateToUrl
  );

  /**
   * UTM 파라미터를 유지하면서 navigate
   */
  const navigateWithUtm = useCallback(
    (to: To | number, options?: NavigateOptions) => {
      // 저장된 UTM 사용 (없으면 현재 URL의 UTM 사용 - fallback)
      const currentUtm = shouldPropagateToUrl ? storedUtm : '';

      if (typeof to === 'string') {
        // string 형태: '/path' 또는 '/path?query=value'
        const [pathname, search = ''] = to.split('?');
        const mergedSearch = currentUtm
          ? mergeUtmParams(search, currentUtm)
          : shouldPropagateToUrl
            ? search
            : removeUtmParams(search);
        navigate(
          { pathname, search: mergedSearch ? `?${mergedSearch}` : '' },
          options
        );
      } else if (typeof to === 'number') {
        // 히스토리 이동 (-1, 1 등)
        navigate(to);
      } else {
        // To 객체 형태: { pathname, search, hash }
        const baseSearch = to.search || '';
        const mergedSearch = currentUtm
          ? mergeUtmParams(baseSearch, currentUtm)
          : shouldPropagateToUrl
            ? baseSearch
            : removeUtmParams(baseSearch);
        navigate(
          { ...to, search: mergedSearch ? `?${mergedSearch}` : '' },
          options
        );
      }
    },
    [navigate, shouldPropagateToUrl, storedUtm]
  );

  /**
   * UTM 파라미터를 유지하면서 search params 설정
   * react-router-dom의 setSearchParams와 유사한 인터페이스
   */
  const setSearchParamsWithUtm = useCallback(
    (
      nextParams:
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams),
      options?: NavigateOptions
    ) => {
      const currentUtm = shouldPropagateToUrl ? storedUtm : '';

      let newParams: URLSearchParams;
      if (typeof nextParams === 'function') {
        // 함수형 업데이트
        const currentParams = new URLSearchParams(location.search);
        newParams = nextParams(currentParams);
      } else {
        // 객체형 업데이트
        newParams = new URLSearchParams();
        Object.entries(nextParams).forEach(([key, value]) => {
          if (value) {
            newParams.set(key, value);
          }
        });
      }

      // UTM 파라미터 병합
      const mergedSearch = currentUtm
        ? mergeUtmParams(newParams, currentUtm)
        : shouldPropagateToUrl
          ? newParams.toString()
          : removeUtmParams(newParams);

      navigate(
        {
          pathname: location.pathname,
          search: mergedSearch ? `?${mergedSearch}` : '',
        },
        options
      );
    },
    [
      navigate,
      shouldPropagateToUrl,
      storedUtm,
      location.search,
      location.pathname,
    ]
  );

  /**
   * 저장된 UTM 파라미터
   */
  const currentUtmParams = shouldPropagateToUrl ? storedUtm : '';

  return {
    navigateWithUtm,
    setSearchParamsWithUtm,
    currentUtmParams,
  };
}
