/**
 * ============================================
 * PDF 보고서 디자인 토큰
 * ============================================
 *
 * [커스텀 가이드]
 * - colors: 보고서 전체 색상 팔레트. 피그마 컬러와 맞추려면 여기만 수정
 * - spacing: 페이지 여백, 헤더/푸터 높이. A4 기준 pt 단위
 * - fontSize: 본문/제목/캡션 등 글자 크기
 * - fontFamily: 폰트 변경 시 registerFonts.ts의 family명과 동일해야 함
 */

export const colors = {
  /** 주 강조색 (제목, 링크, 아이콘 등) */
  primary: '#714E4A',
  /** 주 강조색 연한 버전 (테이블 헤더 배경 등) */
  primaryLight: '#4A7151',
  /** 기본 텍스트 */
  text: '#4E5550',
  /** 보조 텍스트 (캡션, 라벨 등) */
  textMuted: '#A0ACA2',
  /** 구분선, 테이블 테두리 */
  border: '#DBE5E1',
  /** 페이지 배경 */
  background: '#FEFEFE',
  /** 하이라이트 블록 배경 */
  highlight: '#F2E8E8',
  /** 그라데이션 배경 시작색 (상단) */
  gradientStart: '#EDF4F1',
  /** 그라데이션 배경 끝색 (하단) */
  gradientEnd: '#FFFFFF',
  /** 소제목 배경 (primaryLight 연한 버전) */
  subtitleBg: '#E8F0EA',
  /** 플랫 타이틀 바 배경 (== gradientStart) */
  titleBarBg: '#EDF4F1',

  // ---- 표지 전용 ----
  /** 표지 배경 */
  coverBg: '#FFFFFF',
  /** 표지 메인 제목 */
  coverTitle: '#2C3C35',
  /** 표지 영문 부제 */
  coverSubtitle: '#4A7151',
  /** 표지 "CONFIDENTIAL" 텍스트 */
  coverConfidential: '#969595',
  /** 표지 "임상 분석 보고서" 뱃지 배경 */
  coverBadgeBg: '#F2E8E8',
  /** 표지 "임상 분석 보고서" 뱃지 테두리 */
  coverBadgeBorder: '#C9A9A0',
  /** 표지 "임상 분석 보고서" 뱃지 텍스트 */
  coverBadgeText: '#714E4A',
  /** 표지 정보 라벨 (내담자, 상담사 등) */
  coverInfoLabel: '#4A7151',
  /** 표지 정보 값 */
  coverInfoValue: '#4E5550',
  /** 표지 정보 구분선 */
  coverInfoDivider: '#A6B2AD',
  /** 표지 하단 안내 텍스트 */
  coverDisclaimer: '#A0ACA2',
  /** 표지 장식 그린 */
  coverAccent: '#A8C5B4',
};

export const spacing = {
  /** 페이지 상하 바깥 여백 (pt) */
  pageYMargin: 0,
  /** 페이지 좌우 바깥 여백 (pt) */
  pageXMargin: 28,
  /** 헤더 높이 (pt) */
  headerHeight: 56,
  /** 푸터 높이 (pt) */
  footerHeight: 70,
};

export const fontSize = {
  /** 표지 메인 제목 */
  coverTitle: 34,
  /** 표지 영문 부제 */
  coverSubtitle: 14,
  /** 표지 정보 라벨 */
  coverInfoLabel: 14,
  /** 표지 정보 값 */
  coverInfoValue: 12,
  /** 표지 뱃지 */
  coverBadge: 16,
  /** 표지 CONFIDENTIAL */
  coverConfidential: 14,
  /** 표지 하단 안내 */
  coverDisclaimer: 10,
  /** 표지 정보 라벨/값 (본문 호환) */
  coverInfo: 11,
  /** h1 */
  heading1: 18,
  /** h2 */
  heading2: 14,
  /** h3 */
  heading3: 11,
  /** 기본 본문 */
  body: 11,
  /** 테이블 셀 */
  tableCell: 8,
  /** 캡션, 헤더/푸터 텍스트 */
  caption: 8,
  /** 이미지 캡션 */
  imageCaption: 9,
  /** 이미지 캡션 */
  profileContent: 11,
};

/** registerFonts.ts에서 등록한 family 이름과 동일해야 함 */
export const fontFamily = 'NanumSquareNeo';
