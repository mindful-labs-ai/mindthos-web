/**
 * 레터박스 블록
 *
 * 테두리 박스 안에 소제목 + 내용 묶음을 렌더링
 * - title이 있으면 그라데이션 타이틀 바 표시
 * - contents가 2개 이상이면 bullet 리스트로 출력
 * - contents가 1개면 일반 텍스트로 출력
 *
 * [커스텀 가이드]
 * - 테두리: s.container의 borderColor, borderWidth 수정
 * - 소제목 색상: theme.ts의 primaryLight 참조
 * - 본문 스타일: s.text의 fontSize, lineHeight 수정
 * - 제목 그라데이션: theme.ts의 gradientStart / gradientEnd
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

import type { LetterBoxSection } from '../../types/reportSchema';
import { colors } from '../theme';

const TITLE_HEIGHT = 32;

const s = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    marginVertical: 12,
  },
  // ---- 제목 ----
  titleWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: TITLE_HEIGHT,
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
  // ---- 내용 ----
  body: {
    padding: 16,
  },
  entry: {
    marginBottom: 12,
  },
  entryLast: {
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 8,
    fontWeight: 800,
    color: colors.primaryLight,
    marginBottom: 8,
  },
  text: {
    fontSize: 8,
    lineHeight: 1.3,
    color: colors.text,
  },
  bulletItem: {
    flexDirection: 'row',
    marginLeft: 4,
    marginBottom: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    color: colors.text,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.3,
    color: colors.text,
  },
});

export const LetterBoxBlock = ({ section }: { section: LetterBoxSection }) => (
  <View style={s.container}>
    {/* 제목 (그라데이션 배경) */}
    {section.title && (
      <View style={s.titleWrap}>
        <Svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={s.titleGradient}
        >
          <Defs>
            <LinearGradient
              id="letterBoxTitleBg"
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
          <Rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="url(#letterBoxTitleBg)"
          />
        </Svg>
        <Text style={s.title}>{section.title}</Text>
      </View>
    )}

    {/* 내용 */}
    <View style={s.body}>
      {section.entries.map((entry, i) => {
        const isLast = i === section.entries.length - 1;
        return (
          <View key={i} style={{ ...s.entry, ...(isLast ? s.entryLast : {}) }}>
            <Text style={s.subtitle}>{entry.subtitle}</Text>
            {entry.contents.length === 1 ? (
              <Text style={s.text}>{entry.contents[0]}</Text>
            ) : (
              entry.contents.map((content, j) => (
                <View key={j} style={s.bulletItem}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{content}</Text>
                </View>
              ))
            )}
          </View>
        );
      })}
    </View>
  </View>
);
