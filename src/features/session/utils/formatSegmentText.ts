/**
 * 세그먼트의 raw text 를 AI 소비용 평문으로 변환.
 *
 * - 비언어 태그: `(라벨)` 로 감쌈
 *   - advanced: `⟪nv:key⟫` + `nv[]` → `(한숨)`
 *   - legacy(gemini-3): `{%A%한숨%}` / `{%E%슬픔%}` → `(한숨)` / `(슬픔)`
 *   - legacy(gemini-3): `{%S%}` → `(침묵)`, `{%O%}` → `(겹침)`
 *   - 라벨을 찾지 못하면 조용히 제거
 * - 비식별화 태그: `⟪deid:key|원본⟫` → 원본 그대로 (parsed_text 는 AI 전용이므로 라벨 대신 원본)
 *
 * 공백 정리: 태그 제거로 생긴 연속 공백은 1개로 합치고 앞뒤 트림.
 *
 * 편집기에 쓰이는 `segment.text` 는 그대로 두고, 이 함수는 **단방향**(forward-only) 변환만 한다.
 */

const DEID_REGEX = /⟪deid:\w+\|([^⟫]+)⟫/g;
const ADVANCED_NV_REGEX = /⟪nv:([^⟫]+)⟫/g;
const LEGACY_NV_REGEX = /\{%([SAEO])%(?:([^%]+)%)?\}/g;

const LEGACY_SILENT_LABELS: Record<string, string> = {
  S: '침묵',
  O: '겹침',
};

interface SegmentLike {
  text: string;
  nv?: string[];
  // deid 라벨 맵은 사용하지 않음 — 원본이 태그 안에 들어있어서 그대로 복원 가능.
}

const buildNvLookup = (nv: string[] | undefined): Map<string, string> => {
  const map = new Map<string, string>();
  if (!nv) return map;
  for (const entry of nv) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx === -1) continue;
    const key = entry.slice(0, colonIdx);
    const label = entry.slice(colonIdx + 1);
    if (key && label) map.set(key, label);
  }
  return map;
};

export const formatSegmentText = (segment: SegmentLike): string => {
  let text = segment.text ?? '';

  // 1. 비식별화 → 원본
  text = text.replace(DEID_REGEX, (_, original: string) => original);

  // 2. advanced 비언어 → (라벨). 매핑이 없으면 제거.
  const nvLookup = buildNvLookup(segment.nv);
  text = text.replace(ADVANCED_NV_REGEX, (_, key: string) => {
    const label = nvLookup.get(key);
    return label ? `(${label})` : '';
  });

  // 3. legacy 비언어 → (라벨). 내용이 있으면 그대로, 없으면 S/O 기본값, 나머지는 제거.
  text = text.replace(
    LEGACY_NV_REGEX,
    (_, tagType: string, content?: string) => {
      if (content) return `(${content})`;
      const fallback = LEGACY_SILENT_LABELS[tagType];
      return fallback ? `(${fallback})` : '';
    }
  );

  // 4. 태그 제거로 생긴 연속 공백 정리
  text = text.replace(/[ \t]{2,}/g, ' ').trim();

  return text;
};
