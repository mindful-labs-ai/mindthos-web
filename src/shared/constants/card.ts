/**
 * 카드사 코드 → 브랜드명 매핑
 */
export const CARD_COMPANY_CODE_MAP: Record<string, string> = {
  '3K': '기업비씨',
  '46': '광주',
  '71': '롯데',
  '30': '산업',
  '51': '삼성',
  '38': '새마을',
  '41': '신한',
  '62': '신협',
  '36': '씨티',
  '33': '우리',
  W1: '우리',
  '37': '우체국',
  '39': '저축',
  '35': '전북',
  '42': '제주',
  '15': '카카오뱅크',
  '3A': '케이뱅크',
  '24': '토스뱅크',
  '21': '하나',
  '61': '현대',
  '11': '국민',
  '91': '농협',
  '34': '수협',
  '6D': '다이너스',
  '4M': '마스터',
  '3C': '유니온페이',
  '31': 'BC',
  '7A': '아메리칸 익스프레스',
  '4J': 'JCB',
};

/**
 * 카드사 코드로 브랜드명 조회
 */
export const getCardBrandName = (companyCode?: string | null): string => {
  if (!companyCode) return '';
  return CARD_COMPANY_CODE_MAP[companyCode] || '';
};
