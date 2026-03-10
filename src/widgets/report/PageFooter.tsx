/**
 * ============================================
 * 매 페이지 반복 푸터
 * ============================================
 *
 * [커스텀 가이드]
 * - 좌: 마음토스 로고 (M 아이콘 + "마음토스" 텍스트)
 * - 중: 안내 문구 2줄 + 저작권 표시 1줄
 * - 우: 페이지 번호는 pdf-lib 후처리로 삽입 (utils/addPageNumbers.ts)
 * - 푸터 숨기기: GenogramReportPDF.tsx에서 <PageFooter> 제거
 * - 스타일: styles.ts의 footer 계열 + 이 파일 내 로컬 스타일(s)
 */

import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { ReportMeta } from '@/features/report/types/reportSchema';

import { styles } from './styles';
import { colors } from './theme';

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  // ---- 좌: 로고 영역 ----
  logoImage: {
    width: 75,
    objectFit: 'contain',
    alignSelf: 'center',
  },

  // ---- 구분선 ----
  divider: {
    width: 1,
    height: 46,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },

  // ---- 중: 안내 문구 ----
  centerWrap: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  disclaimerLine: {
    fontSize: 8,
    fontWeight: 400,
    color: colors.textMuted,
    textAlign: 'left',
    lineHeight: 1.4,
  },
  copyrightLine: {
    fontSize: 8,
    fontWeight: 400,
    color: colors.textMuted,
    textAlign: 'left',
    marginTop: 1,
  },
});

interface PageFooterProps {
  meta: ReportMeta;
}

export const PageFooter = ({ meta: _meta }: PageFooterProps) => (
  <View style={styles.footer} fixed>
    <View
      style={{
        width: '100%',
        marginVertical: 8,
        borderTopWidth: 2,
        borderTopColor: colors.border,
      }}
    />

    <View style={s.container}>
      {/* 좌: 마음토스 로고 */}
      <Image src="/pdf/pdf_cover_logo.png" style={s.logoImage} />

      {/* 로고 우측 세로 구분선 */}
      <View style={s.divider} />

      {/* 중: 안내 문구 */}
      <View style={s.centerWrap}>
        <Text style={s.disclaimerLine}>
          본 보고서는 가계도 면담 및 상담 축어록을 바탕으로 작성된 임상적 분석
          결과이며,
        </Text>
        <Text style={s.disclaimerLine}>
          전문적인 치료 계획 수립을 위한 참고 자료입니다
        </Text>
        <Text style={s.copyrightLine}>
          Copyright © 2026 Mindful Labs Inc. All Right Reserved.
        </Text>
      </View>
    </View>
  </View>
);
