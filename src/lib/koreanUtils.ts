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
] as const;

const HANGUL_START = 44032;
const HANGUL_END = 55203;
const SYLLABLE_COUNT = 588;

export const getKoreanInitial = (char: string): string => {
  const code = char.charCodeAt(0) - HANGUL_START;
  if (code < 0 || code > HANGUL_END - HANGUL_START) return char;

  const initialIndex = Math.floor(code / SYLLABLE_COUNT);
  return KOREAN_INITIALS[initialIndex];
};

export const getGroupKey = (name: string): string => {
  const firstChar = name.charAt(0);
  const code = firstChar.charCodeAt(0);

  if (code >= HANGUL_START && code <= HANGUL_END) {
    return getKoreanInitial(firstChar);
  }

  if (code >= 65 && code <= 90) {
    return firstChar;
  }

  if (code >= 97 && code <= 122) {
    return firstChar.toUpperCase();
  }

  return '0-9!@';
};

export const compareGroupKeys = (a: string, b: string): number => {
  const aIndex = KOREAN_INITIALS.indexOf(a as (typeof KOREAN_INITIALS)[number]);
  const bIndex = KOREAN_INITIALS.indexOf(b as (typeof KOREAN_INITIALS)[number]);

  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }

  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;

  if (a === '0-9!@') return 1;
  if (b === '0-9!@') return -1;

  return a.localeCompare(b);
};
