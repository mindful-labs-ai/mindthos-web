/**
 * ============================================
 * 매 페이지 반복 헤더
 * ============================================
 *
 * [커스텀 가이드]
 * - 좌: "마음토스 가계도 분석 보고서" (고정 텍스트)
 * - 우: "보고서 작성일" + meta.createdAt
 * - 스타일: styles.ts의 header* 계열
 */

import { StyleSheet, Text, View } from '@react-pdf/renderer';

import type { ReportMeta } from '../types/reportSchema';

import { styles } from './styles';
import { colors } from './theme';

const s = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    marginTop: 20,
  },
  titleNormal: {
    fontSize: 11,
    fontWeight: 400,
    color: colors.text,
  },
  titleBold: {
    fontSize: 11,
    fontWeight: 800,
    color: colors.text,
  },
  rightLabel: {
    fontSize: 8,
    color: colors.text,
  },
  rightValue: {
    fontSize: 8,
    color: colors.text,
    marginLeft: 8,
  },
});

interface PageHeaderProps {
  meta: ReportMeta;
}

export const PageHeader = ({ meta }: PageHeaderProps) => (
  <View style={styles.header} fixed>
    <View style={s.container}>
      {/* 좌: 마음토스 가계도 분석 보고서 */}
      <View style={{ flexDirection: 'row' }}>
        <Text style={s.titleBold}>마음토스 가계도 </Text>
        <Text style={s.titleNormal}>분석 보고서</Text>
      </View>

      {/* 우: 보고서 작성일 + 날짜 */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 210 }}
      >
        <Text style={s.rightLabel}>보고서 작성일</Text>
        <Text style={s.rightValue}>{meta.createdAt}</Text>
      </View>
    </View>

    <View
      style={{
        width: '100%',
        marginVertical: 12,
        borderTopWidth: 2,
        borderTopColor: colors.border,
      }}
    />
  </View>
);
