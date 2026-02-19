/**
 * UTM 파라미터 유틸리티
 * 마케팅 추적을 위한 UTM 쿼리 파라미터를 관리합니다.
 */

/** UTM 파라미터 키 목록 */
const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
] as const;

/**
 * 쿼리스트링에서 UTM 파라미터만 추출
 * @param search - location.search 또는 URLSearchParams
 * @returns UTM 파라미터만 포함된 쿼리스트링 (앞에 ? 없음)
 */
export function extractUtmParams(search: string | URLSearchParams): string {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search;
  const utmParams = new URLSearchParams();

  for (const key of UTM_PARAMS) {
    const value = params.get(key);
    if (value) {
      utmParams.set(key, value);
    }
  }

  return utmParams.toString();
}

/**
 * 기존 쿼리스트링에 UTM 파라미터 병합
 * @param baseSearch - 기존 쿼리스트링
 * @param utmSearch - UTM 파라미터가 포함된 쿼리스트링
 * @returns 병합된 쿼리스트링 (앞에 ? 없음)
 */
export function mergeUtmParams(
  baseSearch: string | URLSearchParams,
  utmSearch: string | URLSearchParams
): string {
  const baseParams =
    typeof baseSearch === 'string'
      ? new URLSearchParams(baseSearch)
      : baseSearch;
  const utmParams =
    typeof utmSearch === 'string' ? new URLSearchParams(utmSearch) : utmSearch;

  // UTM 파라미터만 추출하여 병합
  for (const key of UTM_PARAMS) {
    const value = utmParams.get(key);
    if (value) {
      baseParams.set(key, value);
    }
  }

  return baseParams.toString();
}

/**
 * 쿼리스트링에 UTM 파라미터가 있는지 확인
 */
export function hasUtmParams(search: string | URLSearchParams): boolean {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search;

  return UTM_PARAMS.some((key) => params.has(key));
}
