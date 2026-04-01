/**
 * 서브 헤딩 블록
 *
 * 아이콘 + 제목 텍스트로 구성된 섹션 구분 헤딩
 * 예: 🔲 가족 적응도 프로파일
 *
 * [커스텀 가이드]
 * - 아이콘 크기: s.icon의 width/height 수정
 * - 제목 스타일: s.text의 fontSize, color 수정
 * - 색상: theme.ts의 textMuted (아이콘 색상) 참조
 */

import {
  Circle,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';

import type { SubHeadingSection } from '@/features/report/types/reportSchema';

import { colors } from '../theme';

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  text: {
    fontSize: 14,
    fontWeight: 800,
    color: colors.primaryLight,
  },
});

export const SubHeadingBlock = ({
  section,
}: {
  section: SubHeadingSection;
}) => (
  <View style={s.container}>
    <Svg viewBox="0 0 24 24" style={s.icon}>
      <Rect
        x="1"
        y="1"
        width="8.88889"
        height="8.88889"
        rx="1.11111"
        fill={colors.border}
      />
      <Circle cx="18.9444" cy="5.44444" r="4.44444" fill={colors.border} />
      <Circle cx="11.9444" cy="18.4444" r="4.44444" fill={colors.border} />
      <Path
        d="M5.5 9C5.5 10 5.5 12 5.5 12H19V9"
        stroke={colors.border}
        strokeWidth={1.5}
      />
      <Path d="M12 12.1094V14.3316" stroke={colors.border} strokeWidth={1.5} />
    </Svg>
    <Text style={s.text}>{section.text}</Text>
  </View>
);
