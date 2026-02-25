/**
 * 프로파일 단일 선택 블록
 *
 * 녹색 왼쪽 보더가 있는 제목 + 4칸 체크박스 행
 * 선택된 항목은 연분홍 배경 + 체크 표시
 *
 * [커스텀 가이드]
 * - 색상: theme.ts의 coverInfoLabel(녹색), coverBadgeBg(분홍) 사용
 * - 옵션 개수: options 배열 길이에 따라 자동 균등 분배
 * - wrap={false}: 블록이 잘리지 않고 통째로 다음 페이지로 넘김
 */

import {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';

import type { ProfileSelectSection } from '../../types/reportSchema';
import { colors } from '../theme';

const s = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  // ---- 제목 (녹색 왼쪽 보더) ----
  titleWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
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
  // ---- 옵션 행 ----
  optionRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  optionCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  optionCellLast: {
    borderRightWidth: 0,
  },
  optionCellSelected: {
    backgroundColor: colors.coverBadgeBg,
  },
  // ---- 체크박스 ----
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.coverBadgeText,
    borderColor: colors.coverBadgeText,
  },
  checkmarkSvg: {
    width: 6,
    height: 6,
  },
  // ---- 라벨 ----
  optionLabel: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1,
  },
  optionLabelSelected: {
    fontWeight: 800,
    color: colors.coverBadgeText,
  },
  // ---- 설명 ----
  description: {
    marginVertical: 16,
    fontSize: 8,
  },
});

export const ProfileSelectBlock = ({
  section,
}: {
  section: ProfileSelectSection;
}) => (
  <View style={s.container} wrap={false}>
    {/* 제목 */}
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

    {/* 옵션 행 */}
    <View style={s.optionRow}>
      {section.options.map((option, i) => {
        const isSelected = i === section.selectedIndex;
        const isLast = i === section.options.length - 1;
        return (
          <View
            key={i}
            style={{
              ...s.optionCell,
              ...(isLast ? s.optionCellLast : {}),
              ...(isSelected ? s.optionCellSelected : {}),
            }}
          >
            {/* 체크박스 */}
            <View
              style={{
                ...s.checkbox,
                ...(isSelected ? s.checkboxSelected : {}),
              }}
            >
              {isSelected && (
                <Svg viewBox="0 0 7 5" style={s.checkmarkSvg}>
                  <Path
                    d="M5.74121 0.146484C5.84683 0.147393 5.94832 0.189307 6.02344 0.263672C6.09848 0.338064 6.14165 0.439168 6.14258 0.544922C6.14343 0.650666 6.10211 0.752484 6.02832 0.828125L6.02637 0.830078L2.65918 4.16309C2.48507 4.33531 2.24942 4.43164 2.00391 4.43164C1.75839 4.43164 1.52274 4.33531 1.34863 4.16309L0.257812 3.08398L0.255859 3.08203L0.256836 3.08105C0.183139 3.00541 0.141694 2.90452 0.142578 2.79883C0.143507 2.69298 0.186557 2.59199 0.261719 2.51758C0.336728 2.44339 0.437556 2.4014 0.542969 2.40039C0.622146 2.39971 0.699772 2.42183 0.765625 2.46387L0.827148 2.5127L0.829102 2.51465L1.91895 3.59375C1.94112 3.6157 1.97194 3.62793 2.00391 3.62793C2.03588 3.62793 2.06669 3.6157 2.08887 3.59375L5.45508 0.260742L5.45703 0.258789C5.53342 0.185751 5.6356 0.145585 5.74121 0.146484Z"
                    fill="white"
                    stroke="white"
                    strokeWidth={0.285714}
                  />
                </Svg>
              )}
            </View>
            {/* 라벨 */}
            <Text
              style={{
                ...s.optionLabel,
                ...(isSelected ? s.optionLabelSelected : {}),
              }}
            >
              {option}
            </Text>
          </View>
        );
      })}
    </View>

    <Text style={s.description}> • {section.description}</Text>
  </View>
);
