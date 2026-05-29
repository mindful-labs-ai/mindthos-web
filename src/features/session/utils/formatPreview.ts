/**
 * 리스트 미리보기 텍스트 정제.
 *
 * `transcribe.preview`는 DB에 raw segment text(segments[0:3] 평문화)로 저장됨.
 * raw 텍스트에는 다음 태그가 섞여 있을 수 있어 표시 직전 정제 필요:
 *
 *   - 비식별화: `⟪deid:key|원본⟫` — **원본 노출 차단** 위해 `(비식별)`로 치환
 *   - advanced 비언어: `⟪nv:key⟫` — 라벨 매핑(segment.nv)이 list에 없어 제거
 *   - legacy 비언어:
 *     - `{%A%한숨%}` / `{%E%슬픔%}` → `(한숨)` / `(슬픔)`
 *     - `{%S%}` → `(침묵)`, `{%O%}` → `(겹침)`
 *     - 그 외 → 제거
 *
 * 정제 후 연속 공백 1개로 합치고 앞뒤 trim.
 *
 * `formatSegmentText`(AI 소비용 — deid 원본 복원)와 다르게 list 표시용은 원본을 노출하지 않음.
 */

const DEID_REGEX = /⟪deid:\w+\|[^⟫]+⟫/g;
const ADVANCED_NV_REGEX = /⟪nv:[^⟫]+⟫/g;
const LEGACY_NV_REGEX = /\{%([SAEO])%(?:([^%]+)%)?\}/g;

const LEGACY_SILENT_LABELS: Record<string, string> = {
  S: '침묵',
  O: '겹침',
};

export function formatPreviewText(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  let text = raw;

  // 1. 비식별화 → 안전한 placeholder
  text = text.replace(DEID_REGEX, '(비식별)');

  // 2. advanced 비언어 → 제거 (라벨 맵 없음)
  text = text.replace(ADVANCED_NV_REGEX, '');

  // 3. legacy 비언어 → (라벨) / (침묵)·(겹침) / 제거
  text = text.replace(LEGACY_NV_REGEX, (_, type: string, content?: string) => {
    if (content) return `(${content})`;
    const fallback = LEGACY_SILENT_LABELS[type];
    return fallback ? `(${fallback})` : '';
  });

  // 4. 공백 정리
  text = text.replace(/[ \t]{2,}/g, ' ').trim();
  return text || null;
}
