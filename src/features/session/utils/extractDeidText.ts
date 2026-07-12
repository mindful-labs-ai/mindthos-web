import { createDeidRegex } from './transcriptTags';

/**
 * deid 태그를 제거하고 텍스트만 추출
 * @param showDeid true: 라벨 텍스트 반환, false: 원본 텍스트 반환
 */
export function extractDeidText(
  text: string,
  deid?: Record<string, string>,
  showDeid?: boolean
): string {
  if (!deid || Object.keys(deid).length === 0) return text;

  return text.replace(createDeidRegex(), (_, key, original) => {
    if (showDeid) {
      return `[${deid[key] || key}]`;
    }
    return original;
  });
}
