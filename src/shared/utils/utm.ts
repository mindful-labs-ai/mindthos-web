/**
 * UTM·cohort 파라미터 유틸리티
 * 마케팅 추적과 코호트 분기를 위한 쿼리 파라미터를 관리합니다.
 */

/** UTM 파라미터 키 목록 */
export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'cohort',
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmPayload = Partial<Record<UtmKey, string>>;

/**
 * 쿼리스트링에서 보존·전송 대상 파라미터만 추출
 * @param search - location.search 또는 URLSearchParams
 * @returns 대상 파라미터만 포함된 쿼리스트링 (앞에 ? 없음)
 */
export function extractUtmParams(search: string | URLSearchParams): string {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search;
  const utmParams = new URLSearchParams();

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      utmParams.set(key, value);
    }
  }

  return utmParams.toString();
}

/** 쿼리스트링을 서버 요청용 획득 객체로 변환합니다. */
export function parseUtmPayload(search: string | URLSearchParams): UtmPayload {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search;
  const payload: UtmPayload = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      payload[key] = value;
    }
  }

  return payload;
}

/** Supabase user metadata에서 획득 필드만 안전하게 추출합니다. */
export function parseUtmPayloadFromObject(value: unknown): UtmPayload {
  if (!value || typeof value !== 'object') return {};

  const payload: UtmPayload = {};
  const record = value as Record<string, unknown>;
  for (const key of UTM_KEYS) {
    const utmValue = record[key];
    if (typeof utmValue === 'string' && utmValue) {
      payload[key] = utmValue;
    }
  }

  return payload;
}

/** 외부 인증 redirect에도 획득 파라미터를 붙여 callback에서 복원합니다. */
export function appendUtmParams(
  url: string,
  search: string | URLSearchParams
): string {
  const utmParams = extractUtmParams(search);
  if (!utmParams) return url;

  return `${url}${url.includes('?') ? '&' : '?'}${utmParams}`;
}

/**
 * 기존 쿼리스트링에 획득 파라미터 병합
 * @param baseSearch - 기존 쿼리스트링
 * @param utmSearch - 획득 파라미터가 포함된 쿼리스트링
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

  // 보존 대상 파라미터만 추출하여 병합
  for (const key of UTM_KEYS) {
    const value = utmParams.get(key);
    if (value) {
      baseParams.set(key, value);
    }
  }

  return baseParams.toString();
}

/**
 * 쿼리스트링에 보존 대상 파라미터가 있는지 확인
 */
export function hasUtmParams(search: string | URLSearchParams): boolean {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search;

  return UTM_KEYS.some((key) => params.has(key));
}

/** 쿼리스트링에서 획득 파라미터만 제거하고 라우트 파라미터는 유지합니다. */
export function removeUtmParams(search: string | URLSearchParams): string {
  const params =
    typeof search === 'string'
      ? new URLSearchParams(search)
      : new URLSearchParams(search);

  for (const key of UTM_KEYS) {
    params.delete(key);
  }

  return params.toString();
}

/** 현재 브라우저 URL에서 획득 파라미터만 제거합니다. */
export function removeUtmParamsFromCurrentUrl(): void {
  if (typeof window === 'undefined' || !hasUtmParams(window.location.search)) {
    return;
  }

  const cleanedSearch = removeUtmParams(window.location.search);
  const nextUrl = `${window.location.pathname}${
    cleanedSearch ? `?${cleanedSearch}` : ''
  }${window.location.hash}`;

  window.history.replaceState(window.history.state, '', nextUrl);
}
