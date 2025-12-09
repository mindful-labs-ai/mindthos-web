/**
 * 검색 유틸리티 - 한글 초성 매칭 지원
 */
const KOREAN_INITIALS = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

export const getKoreanInitial = (char: string): string => {
  const code = char.charCodeAt(0) - 44032;
  if (code < 0 || code > 11171) return char;
  const initialIndex = Math.floor(code / 588);
  return KOREAN_INITIALS[initialIndex];
};

export const getInitials = (str: string): string => {
  if (!str) return '';

  return str
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // 한글인 경우 초성 추출
      if (code >= 44032 && code <= 55203) {
        return getKoreanInitial(char);
      }
      // 한글이 아닌 경우 그대로 반환
      return char.toLowerCase();
    })
    .join('');
};

/**
 * 초성 검색 매칭 확인
 * @example matchesInitialSearch('김경민', 'ㄱㄱㅁ') // true
 */
export const matchesInitialSearch = (text: string, query: string): boolean => {
  if (!text || !query) return false;

  const textInitials = getInitials(text);
  const queryLower = query.toLowerCase();

  // 초성 매칭
  if (textInitials.includes(queryLower)) {
    return true;
  }

  // 일반 텍스트 매칭
  if (text.toLowerCase().includes(queryLower)) {
    return true;
  }

  return false;
};

/**
 * 검색 점수 계산 - 정확도에 따른 가중치 부여
 */
export const calculateSearchScore = (text: string, query: string): number => {
  if (!text || !query) return 0;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // 정확히 일치
  if (textLower === queryLower) {
    return 1000;
  }

  // 시작 부분 일치
  if (textLower.startsWith(queryLower)) {
    return 500;
  }

  // 초성 시작 부분 일치
  const textInitials = getInitials(text);
  if (textInitials.startsWith(queryLower)) {
    return 300;
  }

  // 포함
  if (textLower.includes(queryLower)) {
    return 100;
  }

  // 초성 포함
  if (textInitials.includes(queryLower)) {
    return 50;
  }

  return 0;
};

/**
 * 하이라이트용 텍스트 분할
 */
export const highlightMatches = (
  text: string,
  query: string
): { text: string; highlight: boolean }[] => {
  // text가 null/undefined인 경우 빈 배열 반환
  if (!text) {
    return [];
  }

  if (!query.trim()) {
    return [{ text, highlight: false }];
  }

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // 일반 텍스트 매칭
  const index = textLower.indexOf(queryLower);
  if (index !== -1) {
    const parts: { text: string; highlight: boolean }[] = [];

    if (index > 0) {
      parts.push({ text: text.slice(0, index), highlight: false });
    }

    parts.push({
      text: text.slice(index, index + query.length),
      highlight: true,
    });

    if (index + query.length < text.length) {
      parts.push({
        text: text.slice(index + query.length),
        highlight: false,
      });
    }

    return parts;
  }

  // 초성 매칭
  const textInitials = getInitials(text);
  const initialIndex = textInitials.indexOf(queryLower);

  if (initialIndex !== -1) {
    const parts: { text: string; highlight: boolean }[] = [];

    if (initialIndex > 0) {
      parts.push({ text: text.slice(0, initialIndex), highlight: false });
    }

    parts.push({
      text: text.slice(initialIndex, initialIndex + query.length),
      highlight: true,
    });

    if (initialIndex + query.length < text.length) {
      parts.push({
        text: text.slice(initialIndex + query.length),
        highlight: false,
      });
    }

    return parts;
  }

  return [{ text, highlight: false }];
};
