/**
 * 현재 단계 + 적응 수준 블록
 *
 * 두 카드를 나란히 배치:
 * - 왼쪽: "현재 단계" + 단계명
 * - 오른쪽: "적응 수준" + 5단계 스케일 + 분석 텍스트
 *
 * [커스텀 가이드]
 * - 타이틀 바: #EDF4F1 단색 배경
 * - 스케일 라벨: 매우 낮음, 낮음, 보통, 높음, 매우 높음
 * - 선택된 점: colors.primaryLight 채움, 미선택: 빈 원(border)
 * - 점 연결선: colors.border 수평선
 */

import { StyleSheet, Text, View } from '@react-pdf/renderer';

import type { StageAdaptationSection } from '../../types/reportSchema';
import { colors } from '../theme';

const SCALE_LABELS = [
  '매우 낮음',
  '낮음',
  '보통',
  '높음',
  '매우 높음',
] as const;

const DOT_SIZE = 8;
const DOT_OUTER = 12;

export const StageAdaptationBlock = ({
  section,
}: {
  section: StageAdaptationSection;
}) => {
  const { stage, adaptationLevel, analysis } = section;

  return (
    <View style={s.container} wrap={false}>
      {/* ── 왼쪽 카드: 현재 단계 ── */}
      <View style={s.card}>
        <View style={s.titleBar}>
          <Text style={s.titleText}>현재 단계</Text>
        </View>
        <View style={s.stageBody}>
          <Text style={s.stageText}>{stage}</Text>
        </View>
      </View>

      {/* ── 오른쪽 카드: 적응 수준 ── */}
      <View style={[s.card, s.cardRight]}>
        <View style={s.titleBar}>
          <Text style={s.titleText}>적응 수준</Text>
        </View>
        <View style={s.scaleBody}>
          {/* 스케일 영역 */}
          <View style={s.scaleContainer}>
            {/* 연결선 (절대 위치) */}
            <View style={s.scaleLine} />

            {/* 점 + 라벨 */}
            <View style={s.scaleRow}>
              {SCALE_LABELS.map((label, i) => {
                const isSelected = i === adaptationLevel;
                return (
                  <View key={i} style={s.scaleItem}>
                    {isSelected ? (
                      <View style={s.dotOuter}>
                        <View style={s.dotInner} />
                      </View>
                    ) : (
                      <View style={s.dotEmpty} />
                    )}
                    <Text
                      style={[
                        s.scaleLabel,
                        isSelected ? s.scaleLabelSelected : {},
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Text style={s.analysis}>분석</Text>

          {/* 분석 텍스트 */}
          <View style={s.analysisRow}>
            <Text style={s.analysisDot}>•</Text>
            <Text style={s.analysisText}>{analysis}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  cardRight: {
    marginLeft: 9,
  },

  // ── 타이틀 바 ──
  titleBar: {
    backgroundColor: '#EDF4F1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  titleText: {
    fontSize: 10,
    fontWeight: 800,
    color: colors.primaryLight,
  },

  // ── 왼쪽: 단계명 ──
  stageBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  stageText: {
    fontSize: 10,
    fontWeight: 800,
    color: colors.primaryLight,
  },

  // ── 오른쪽: 스케일 ──
  scaleBody: {
    paddingVertical: 26,
    paddingHorizontal: 12,
  },
  scaleContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  scaleLine: {
    position: 'absolute',
    top: DOT_OUTER / 2 - 0.75,
    left: '10%',
    right: '10%',
    height: 1.5,
    backgroundColor: colors.border,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleItem: {
    alignItems: 'center',
    width: 40,
  },
  dotOuter: {
    width: DOT_OUTER,
    height: DOT_OUTER,
    borderRadius: DOT_OUTER / 2,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dotInner: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.primaryLight,
  },
  dotEmpty: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#EDF4F1',
    marginTop: (DOT_OUTER - DOT_SIZE) / 2,
    marginBottom: 4 + (DOT_OUTER - DOT_SIZE) / 2,
  },
  scaleLabel: {
    fontSize: 8,
    color: colors.text,
    fontWeight: 700,
    textAlign: 'center',
  },
  scaleLabelSelected: {
    fontWeight: 800,
    color: colors.primaryLight,
  },

  // ── 분석 텍스트 ──
  analysis: {
    fontSize: 8,
    fontWeight: 800,
    color: colors.primaryLight,
    marginBottom: 8,
  },
  analysisRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  analysisDot: {
    width: 12,
    fontSize: 8,
    color: colors.primaryLight,
  },
  analysisText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.5,
    color: colors.text,
  },
});
