/**
 * 전사 텍스트 태그 공통 정의 — 태그 문법의 단일 소스.
 *
 * STT 파이프라인이 segment.text 에 삽입하는 태그:
 * - advanced 비언어: `⟪nv:KEY⟫` — segment.nv(`["KEY:라벨", ...]`)로 라벨 해석
 * - legacy(gemini-3) 비언어: `{%S%}`(침묵), `{%O%}`(겹침), `{%A%라벨%}`, `{%E%라벨%}`
 * - 비식별화: `⟪deid:KEY|원본⟫` — segment.deid(`{KEY: 라벨}`)로 라벨 해석
 *
 * 전역(g) 정규식은 lastIndex 상태를 공유하면 exec/test 루프에서 오동작하므로
 * 상수 대신 팩토리 함수로만 노출한다. 호출마다 새 인스턴스를 반환한다.
 */

/** 비언어 태그 유형: Silence, Action, Emotion, Overlap */
export type NonverbalTagType = 'S' | 'A' | 'E' | 'O';

/**
 * 내용 없는 비언어 태그의 기본 표시 라벨.
 * A(행동)/E(감정)는 내용이 없으면 표시하지 않는다(빈 문자열).
 */
export const NONVERBAL_DEFAULT_LABELS: Record<NonverbalTagType, string> = {
  S: '침묵',
  O: '겹침',
  A: '',
  E: '',
};

/**
 * legacy(gemini-3) 비언어 태그: `{%S%}` 또는 `{%A%라벨%}`
 * - 캡처 1: 태그 유형(SAEO), 캡처 2: 라벨(없을 수 있음)
 */
export const createLegacyNvRegex = (): RegExp => /\{%([SAEO])%(?:([^%]+)%)?\}/g;

/**
 * advanced 비언어 태그: `⟪nv:KEY⟫`
 * - 캡처 1: KEY (segment.nv 매핑 키)
 */
export const createAdvancedNvRegex = (): RegExp => /⟪nv:([^⟫]+)⟫/g;

/**
 * 비식별화 태그: `⟪deid:KEY|원본⟫`
 * - 캡처 1: KEY (segment.deid 매핑 키), 캡처 2: 원본 텍스트
 */
export const createDeidRegex = (): RegExp => /⟪deid:(\w+)\|([^⟫]+)⟫/g;

/** nv 키 접두 → 태그 유형. e→감정(E), s→침묵(S), 그 외→액션(A). (벤더 STT가 침묵을 s 접두로 냄) */
export const nvKeyToTagType = (key: string): 'S' | 'A' | 'E' =>
  key.startsWith('e') ? 'E' : key.startsWith('s') ? 'S' : 'A';

export interface NvEntry {
  tagType: 'S' | 'A' | 'E';
  label: string;
}

/**
 * segment.nv(`["KEY:라벨", ...]`)를 KEY → {tagType, label} 맵으로 변환.
 * 콜론이 없거나 키/라벨이 빈 항목은 무시한다.
 */
export const parseNvEntries = (
  nv: string[] | undefined
): Map<string, NvEntry> => {
  const map = new Map<string, NvEntry>();
  if (!nv) return map;
  for (const entry of nv) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx === -1) continue;
    const key = entry.slice(0, colonIdx);
    const label = entry.slice(colonIdx + 1);
    if (!key || !label) continue;
    map.set(key, { tagType: nvKeyToTagType(key), label });
  }
  return map;
};
