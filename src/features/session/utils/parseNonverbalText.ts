import {
  createAdvancedNvRegex,
  createDeidRegex,
  createLegacyNvRegex,
  parseNvEntries,
  type NonverbalTagType,
} from './transcriptTags';

export interface TextPart {
  type: 'text' | 'nonverbal';
  content: string;
  tagType?: NonverbalTagType; // Silence, Action, Emotion, Overlap
}

/**
 * {%...%} 패턴을 파싱하여 텍스트와 비언어 태그로 분리
 * 예시:
 * - {%S%} → { type: 'nonverbal', tagType: 'S', content: '' }
 * - {%A%한숨%} → { type: 'nonverbal', tagType: 'A', content: '한숨' }
 * - {%E%말을 왜 그렇게 해?%} → { type: 'nonverbal', tagType: 'E', content: '말을 왜 그렇게 해?' }
 */
export function parseNonverbalText(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const regex = createLegacyNvRegex();

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 태그 이전의 일반 텍스트
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent,
        });
      }
    }

    // 비언어 태그
    const tagType = match[1] as NonverbalTagType;
    const tagContent = match[2] || ''; // match[2]는 내용 부분 (없으면 빈 문자열)

    parts.push({
      type: 'nonverbal',
      content: tagContent,
      tagType,
    });

    lastIndex = regex.lastIndex;
  }

  // 마지막 남은 텍스트
  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex);
    if (textContent) {
      parts.push({
        type: 'text',
        content: textContent,
      });
    }
  }

  return parts;
}

/**
 * ⟪nv:KEY⟫ + nv[] 배열을 파싱하여 텍스트와 비언어 태그로 분리 (advanced 포맷)
 * 예시:
 * - text: "⟪nv:a1⟫ 저는 그냥 답답해요.", nv: ["a1:한숨"]
 *   → [{ type: 'nonverbal', tagType: 'A', content: '한숨' }, { type: 'text', content: ' 저는 그냥 답답해요.' }]
 */
export function parseNvTagText(text: string, nv?: string[]): TextPart[] {
  if (!nv || nv.length === 0) {
    return [{ type: 'text', content: text }];
  }

  const nvMap = parseNvEntries(nv);

  const parts: TextPart[] = [];
  const regex = createAdvancedNvRegex();
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const key = match[1];
    const entry = nvMap.get(key);
    if (entry) {
      parts.push({
        type: 'nonverbal',
        content: entry.label,
        tagType: entry.tagType,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * 비언어 태그를 제거하고 순수 텍스트만 추출
 */
export function extractTextOnly(text: string, nv?: string[]): string {
  // 먼저 ⟪nv:KEY⟫, ⟪deid:KEY|원본⟫ 태그를 제거/치환
  const cleaned = text
    .replace(createAdvancedNvRegex(), '')
    .replace(createDeidRegex(), '$2');

  const parts =
    nv && nv.length > 0
      ? parseNvTagText(cleaned, nv)
      : parseNonverbalText(cleaned);
  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.content)
    .join('');
}
