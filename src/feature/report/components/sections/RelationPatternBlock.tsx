/**
 * 관계 패턴 해석 블록
 *
 * 두 카드를 나란히 배치:
 * - 왼쪽: 가계도 스냅샷 이미지 + 하단 캡션
 * - 오른쪽: "임상적 해석" 타이틀 + 레터박스 형태 해석 내용
 *
 * [커스텀 가이드]
 * - 타이틀 바: #EDF4F1 단색 배경
 * - 왼쪽 카드: 이미지가 없으면 빈 박스로 표시
 * - 오른쪽 카드: LetterBoxBlock과 동일한 entry 패턴
 */

import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { RelationPatternSection } from '../../types/reportSchema';
import { colors } from '../theme';

export const RelationPatternBlock = ({
  section,
}: {
  section: RelationPatternSection;
}) => {
  const { imageData, caption, entries } = section;

  return (
    <View style={s.container} wrap={false}>
      {/* ── 왼쪽 카드: 가계도 스냅샷 ── */}
      <View style={s.card}>
        <View style={s.imageBody}>
          {imageData ? (
            <Image src={imageData} style={s.image} />
          ) : (
            <View style={s.imagePlaceholder} />
          )}
        </View>
        {caption && <Text style={s.caption}>{caption}</Text>}
      </View>

      {/* ── 오른쪽 카드: 임상적 해석 ── */}
      <View style={[s.card, s.cardRight]}>
        <View style={s.titleBar}>
          <Text style={s.titleText}>임상적 해석</Text>
        </View>
        <View style={s.entryBody}>
          {entries.map((entry, i) => (
            <View
              key={i}
              style={[
                s.entry,
                i === entries.length - 1 ? { marginBottom: 0 } : {},
              ]}
            >
              <Text style={s.subtitle}>{entry.subtitle}</Text>
              {entry.contents.length === 1 ? (
                <Text style={s.plainText}>{entry.contents[0]}</Text>
              ) : (
                entry.contents.map((content, j) => (
                  <View key={j} style={s.bulletRow}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{content}</Text>
                  </View>
                ))
              )}
            </View>
          ))}
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

  // ── 왼쪽: 이미지 ──
  imageBody: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    objectFit: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    minHeight: 200,
  },
  caption: {
    textAlign: 'center',
    fontSize: 8,
    fontWeight: 800,
    color: colors.primaryLight,
    paddingBottom: 10,
  },

  // ── 오른쪽: 타이틀 바 ──
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

  // ── 오른쪽: 해석 내용 ──
  entryBody: {
    padding: 12,
  },
  entry: {
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 8,
    fontWeight: 800,
    color: colors.primaryLight,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    color: colors.primaryLight,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.5,
    color: colors.text,
  },
  plainText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: colors.text,
    marginTop: 2,
  },
});
