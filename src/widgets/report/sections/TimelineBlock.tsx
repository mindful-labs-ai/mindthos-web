/**
 * 연표(타임라인) 블록
 *
 * [레이어 구조] (painting order = z-index)
 *   1. 그라데이션 바 + 화살표 SVG (absolute, 가장 뒤)
 *   2. 연도 라벨 (absolute, 바 내부)
 *   3. 줄기 (absolute)
 *   4. 점 (absolute, 가장 앞)
 *
 * [커스텀 가이드]
 * - 짝수 인덱스(0,2,4..) → 상단 설명, 홀수(1,3,5..) → 하단 설명
 * - 줄기 끝(바 가장자리)에 점 표시: 짝수→바 상단, 홀수→바 하단
 * - 바: #C8DAD2 → #4A7151 좌→우 그라데이션, 왼쪽 직선, 오른쪽 화살표(12pt)
 * - "현재" 라벨은 바 안쪽 화살표 앞에 배치
 */

import {
  Defs,
  LinearGradient,
  Path,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';

import type { TimelineSection } from '@/features/report/types/reportSchema';

import { colors, fontSize } from '../theme';

const BAR_HEIGHT = 28;
const STEM_HEIGHT = 12;
const ARROW_WIDTH = 12;

/** SVG viewBox 가상 너비 (preserveAspectRatio="none"으로 컨테이너에 맞게 stretch) */
const VB_W = 540;

/** 중간 섹션 전체 높이: 상단줄기 + 바 + 하단줄기 */
const MIDDLE_HEIGHT = STEM_HEIGHT + BAR_HEIGHT + STEM_HEIGHT;

/** 점 크기 */
const DOT_SIZE = 8;
const DOT_BORDER = 1;
const DOT_TOTAL = DOT_SIZE + DOT_BORDER * 2;

/** 바+화살표 합친 SVG Path (왼쪽 직선 + 오른쪽 삼각형) */
const BAR_PATH = [
  'M 0,0',
  `L ${VB_W - ARROW_WIDTH},0`,
  `L ${VB_W},${BAR_HEIGHT / 2}`,
  `L ${VB_W - ARROW_WIDTH},${BAR_HEIGHT}`,
  `L 0,${BAR_HEIGHT}`,
  'Z',
].join(' ');

export const TimelineBlock = ({ section }: { section: TimelineSection }) => {
  const { events = [], title, notes } = section;

  /** descriptions를 항상 배열로 정규화 (API에서 문자열로 올 수 있음) */
  const normalizeDescriptions = (desc: unknown): string[] => {
    if (Array.isArray(desc)) return desc;
    if (typeof desc === 'string') return [desc];
    return [];
  };

  /** 이벤트 + 마지막 "현재" 컬럼 (줄기·점 없이 연도만 표시) */
  const columns = [
    ...(events ?? []).map((ev) => ({
      ...ev,
      descriptions: normalizeDescriptions(ev.descriptions),
      isCurrent: false,
    })),
    { year: '현재', descriptions: [] as string[], isCurrent: true },
  ];

  return (
    <View style={s.container} wrap={false}>
      {/* ── 테두리 영역: 연표 + 제목 ── */}
      <View style={s.bordered}>
        <View style={{ width: 511 }}>
          {/* ── 상단 설명 (짝수 인덱스: 0, 2, 4...) ── */}
          <View style={s.row}>
            {columns.map((col, i) => (
              <View key={`top-${i}`} style={s.column}>
                {i % 2 === 0 && col.descriptions.length > 0 && (
                  <View style={s.descWide}>
                    {col.descriptions.map((desc, j) => (
                      <Text key={j} style={s.descText}>
                        {desc}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* ── 중간 섹션: 그라데이션 바 + 줄기 + 점 + 현재 ── */}
          <View style={{ height: MIDDLE_HEIGHT }}>
            {/* Layer 1: 그라데이션 바 + 화살표 SVG (배경) */}
            <Svg
              viewBox={`0 0 ${VB_W} ${BAR_HEIGHT}`}
              preserveAspectRatio="none"
              style={s.barSvg}
            >
              <Defs>
                <LinearGradient
                  id="barGrad"
                  x1="0"
                  y1="0"
                  x2={String(VB_W - ARROW_WIDTH)}
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0" stopColor="#C8DAD2" />
                  <Stop offset="1" stopColor="#4A7151" />
                </LinearGradient>
              </Defs>
              <Path d={BAR_PATH} fill="url(#barGrad)" />
            </Svg>

            {/* Layer 2: 연도 라벨 (바 내부 중앙, year가 있는 컬럼만) */}
            <View style={s.yearRow}>
              {columns.map((col, i) => (
                <View key={`yr-${i}`} style={s.column}>
                  {col.year ? (
                    <Text style={col.isCurrent ? s.currentLabel : s.yearText}>
                      {col.year}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Layer 3: 줄기 */}
            <View style={s.layerOverlay}>
              {columns.map((col, i) => {
                const hasStem = col.descriptions.length > 0;
                return (
                  <View key={`col-${i}`} style={s.column}>
                    {hasStem && i % 2 === 0 ? (
                      <View style={s.stem} />
                    ) : (
                      <View style={s.stemSpacer} />
                    )}
                    <View style={s.barSpacer} />
                    {hasStem && i % 2 !== 0 ? (
                      <View style={s.stem} />
                    ) : (
                      <View style={s.stemSpacer} />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Layer 4: 점 (가장 앞) */}
            <View style={s.layerOverlay}>
              {columns.map((col, i) => {
                if (col.descriptions.length === 0) {
                  return <View key={`dot-${i}`} style={s.column} />;
                }
                const dotTopOffset =
                  i % 2 === 0
                    ? STEM_HEIGHT - DOT_TOTAL / 2
                    : STEM_HEIGHT + BAR_HEIGHT - DOT_TOTAL / 2;
                return (
                  <View key={`dot-${i}`} style={s.column}>
                    <View style={{ height: dotTopOffset }} />
                    <View style={s.dot} />
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── 하단 설명 (홀수 인덱스: 1, 3, 5...) ── */}
          <View style={s.row}>
            {columns.map((col, i) => (
              <View key={`bot-${i}`} style={s.column}>
                {i % 2 !== 0 && col.descriptions.length > 0 && (
                  <View style={s.descWide}>
                    {col.descriptions.map((desc, j) => (
                      <Text key={j} style={s.descText}>
                        {desc}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── 제목 ── */}
        {title && <Text style={s.title}>{title}</Text>}
      </View>

      {/* ── 부가 설명 (bullet) ── */}
      {notes && notes.length > 0 && (
        <View style={s.notesContainer}>
          {notes.map((note, i) => (
            <View key={`n-${i}`} style={s.noteRow}>
              <Text style={s.noteDot}>•</Text>
              <Text style={s.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 16,
    paddingBottom: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    paddingLeft: 56,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  descWide: {
    marginHorizontal: -30,
    alignItems: 'center',
  },

  // ── 설명 텍스트 ──
  descText: {
    fontSize: 8,
    fontWeight: 800,
    textAlign: 'center',
    lineHeight: 1.3,
    color: colors.primaryLight,
  },

  // ── 그라데이션 바 SVG (absolute → 배경) ──
  barSvg: {
    position: 'absolute',
    top: STEM_HEIGHT,
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
  },

  // ── 연도 라벨 (absolute, 바 내부 중앙) ──
  yearRow: {
    position: 'absolute',
    top: STEM_HEIGHT,
    left: 56,
    right: 0,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearText: {
    fontSize: 11,
    fontWeight: 800,
    color: '#FFFFFF',
  },

  // ── "현재" 라벨 (마지막 컬럼) ──
  currentLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: '#FFFFFF',
  },

  // ── 줄기 + 점 오버레이 (absolute) ──
  layerOverlay: {
    position: 'absolute',
    top: 0,
    left: 56,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  stem: {
    width: 1.5,
    height: STEM_HEIGHT,
    backgroundColor: colors.primaryLight,
  },
  stemSpacer: {
    height: STEM_HEIGHT,
  },
  barSpacer: {
    height: BAR_HEIGHT,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#4A7151',
    borderWidth: DOT_BORDER,
    borderColor: '#FFFFFF',
  },

  // ── 제목 ──
  title: {
    textAlign: 'center',
    fontSize: 8,
    fontWeight: 800,
    color: colors.primaryLight,
    marginTop: 10,
  },

  // ── 부가 설명 ──
  notesContainer: {
    marginTop: 4,
    paddingLeft: 4,
  },
  noteRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  noteDot: {
    width: 14,
    fontSize: fontSize.body,
    color: colors.primaryLight,
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.body,
    lineHeight: 1.6,
    color: colors.text,
  },
});
