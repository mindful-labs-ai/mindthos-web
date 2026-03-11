/**
 * 2열 정보 테이블 블록
 *
 * 각 행이 좌/우 키-값 쌍으로 구성된 테이블
 * 예: 내담자 | 이영숙(여) | 상담 일자 | 2025년 11월 13일 ~ ...
 *
 * [커스텀 가이드]
 * - 키 너비: s.key의 width 수정
 * - 색상: theme.ts의 coverInfoLabel(녹색 라벨) 참조
 * - 제목 그라데이션: theme.ts의 gradientStart / gradientEnd
 * - wrap={false}: 테이블이 잘리지 않고 통째로 다음 페이지로 넘김
 */

import {
  Defs,
  LinearGradient,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';

import type { InfoTableSection } from '../../types/reportSchema';
import { colors } from '../theme';

const TITLE_HEIGHT = 32;

const s = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  // ---- 제목 ----
  titleWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: TITLE_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  titleGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: 800,
    color: colors.primaryLight,
    flexDirection: 'row',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  // ---- 테이블 ----
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: colors.border,
    minHeight: 29,
  },
  cell: {
    flexDirection: 'row',
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  key: {
    width: 68,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 8,
    fontSize: 8,
    lineHeight: 1.3,
    fontWeight: 800,
    color: colors.coverInfoLabel,
  },
  value: {
    flex: 1,
    paddingTop: 7,
    paddingBottom: 5,
    paddingHorizontal: 12,
    fontSize: 8,
    lineHeight: 1.3,
    color: colors.text,
  },
  spliter: {
    width: 1,
    height: '80%',
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: colors.border,
  },
});

export const InfoTableBlock = ({ section }: { section: InfoTableSection }) => (
  <View style={s.container} wrap={false}>
    {/* 제목 (그라데이션 배경) */}
    <View style={s.titleWrap}>
      <Svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={s.titleGradient}
      >
        <Defs>
          <LinearGradient
            id="titleBg"
            x1="0"
            y1="0"
            x2="100"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={colors.gradientStart} />
            <Stop offset="100%" stopColor={colors.gradientEnd} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#titleBg)" />
      </Svg>
      <Text style={s.title}>{section.title}</Text>
    </View>

    {/* 테이블 행 */}
    <View
      style={{
        paddingHorizontal: 12,
      }}
    >
      {(section.rows ?? []).map((row, i) => (
        <View key={i} style={s.row}>
          {/* 좌측 키-값 */}
          <View style={s.cell}>
            <Text style={s.key}>{row.left.key}</Text>
            <View style={s.spliter} />
            <Text style={s.value}>{row.left.value}</Text>
          </View>

          <View style={s.spliter} />

          {/* 우측 키-값 */}
          <View style={s.cell}>
            <Text style={s.key}>{row.right.key}</Text>
            <View style={s.spliter} />
            <Text style={s.value}>{row.right.value}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);
