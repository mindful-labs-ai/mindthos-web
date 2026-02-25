/**
 * ============================================
 * PDF StyleSheet
 * ============================================
 *
 * [커스텀 가이드]
 * - 색상/크기 변경 → theme.ts에서 수정 (여기는 건드릴 필요 없음)
 * - 레이아웃 구조 변경 (flexDirection, 정렬 등) → 여기서 직접 수정
 * - 새로운 섹션 스타일 추가 → 이 파일 하단에 추가 후 export
 */

import { StyleSheet } from '@react-pdf/renderer';

import { colors, fontFamily, fontSize, spacing } from './theme';

export const styles = StyleSheet.create({
  // ============================================
  // 페이지 기본
  // ============================================
  page: {
    fontFamily,
    fontSize: fontSize.body,
    color: colors.text,
    paddingTop: spacing.pageYMargin + spacing.headerHeight,
    paddingBottom: spacing.pageYMargin + spacing.footerHeight,
    paddingHorizontal: spacing.pageXMargin,
  },

  // ============================================
  // 헤더 / 푸터
  // ============================================
  header: {
    position: 'absolute',
    top: spacing.pageYMargin,
    left: spacing.pageXMargin,
    right: spacing.pageXMargin,
    height: spacing.headerHeight,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: fontSize.caption + 1,
    fontWeight: 800,
    color: colors.primary,
  },
  headerRight: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.pageYMargin,
    left: spacing.pageXMargin,
    right: spacing.pageXMargin,
    height: spacing.footerHeight,
    paddingBottom: 8,
  },
  footerLeft: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  footerPageNumber: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },

  // ============================================
  // 제목
  // ============================================
  heading1: {
    fontSize: fontSize.heading1,
    fontWeight: 800,
    color: colors.primary,
  },
  heading2: {
    fontSize: fontSize.heading2,
    fontWeight: 800,
    color: colors.text,
  },
  heading3: {
    fontSize: fontSize.heading3,
    fontWeight: 800,
    color: colors.textMuted,
  },

  // ============================================
  // 본문
  // ============================================
  paragraph: {
    fontSize: fontSize.body,
    lineHeight: 1.7,
    marginBottom: 10,
    textAlign: 'justify',
  },
  paragraphHighlight: {
    fontSize: fontSize.body,
    lineHeight: 1.7,
    marginBottom: 10,
    backgroundColor: colors.highlight,
    padding: 10,
    borderRadius: 4,
  },
  paragraphQuote: {
    fontSize: fontSize.body,
    lineHeight: 1.7,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // ============================================
  // 이미지
  // ============================================
  imageContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  image: {
    maxWidth: '100%',
    objectFit: 'contain',
  },
  imageCaption: {
    fontSize: fontSize.imageCaption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },

  // ============================================
  // 테이블
  // ============================================
  tableContainer: {
    marginVertical: 10,
  },
  tableTitle: {
    fontSize: fontSize.coverInfo,
    fontWeight: 800,
    marginBottom: 6,
    color: colors.text,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableCellLabel: {
    width: '20%',
    fontSize: fontSize.tableCell,
    fontWeight: 800,
  },
  tableCellScore: {
    width: '15%',
    fontSize: fontSize.tableCell,
    textAlign: 'center',
  },
  tableCellDescription: {
    width: '50%',
    fontSize: fontSize.tableCell,
    color: colors.textMuted,
  },
  tableHeaderText: {
    fontSize: fontSize.tableCell,
    fontWeight: 800,
    color: colors.primary,
  },

  // ============================================
  // 리스트
  // ============================================
  bulletList: {
    marginVertical: 8,
    paddingLeft: 4,
  },
  bulletListTitle: {
    fontSize: fontSize.coverInfo,
    fontWeight: 800,
    marginBottom: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletDot: {
    width: 14,
    fontSize: fontSize.body,
    color: colors.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.body,
    lineHeight: 1.6,
  },

  // ============================================
  // Key-Value
  // ============================================
  kvContainer: {
    marginVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 12,
  },
  kvTitle: {
    fontSize: fontSize.coverInfo,
    fontWeight: 800,
    marginBottom: 8,
  },
  kvRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  kvKey: {
    width: 100,
    fontSize: fontSize.body,
    fontWeight: 400,
    color: colors.textMuted,
  },
  kvValue: {
    flex: 1,
    fontSize: fontSize.body,
    fontWeight: 400,
  },

  // ============================================
  // 구분선
  // ============================================
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 16,
  },
});
