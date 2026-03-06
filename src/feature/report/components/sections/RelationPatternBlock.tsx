/**
 * 관계 패턴 해석 블록
 *
 * 두 카드를 나란히 배치:
 * - 왼쪽: 가계도 스냅샷 이미지 + 하단 캡션
 * - 오른쪽: "임상적 해석" 타이틀 + 레터박스 형태 해석 내용
 */

import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { RelationPatternSection } from '../../types/reportSchema';
import { styles } from '../styles';
import { colors } from '../theme';

export const RelationPatternBlock = ({
  section,
}: {
  section: RelationPatternSection;
}) => {
  const { imageData, caption, entries } = section;

  return (
    <View style={styles.twoCardRow} wrap={false}>
      {/* ── 왼쪽 카드: 가계도 스냅샷 ── */}
      <View style={styles.twoCard}>
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
      <View style={[styles.twoCard, styles.twoCardRight]}>
        <View style={styles.flatTitleBar}>
          <Text style={styles.flatTitleText}>임상적 해석</Text>
        </View>
        <View style={s.entryBody}>
          {(entries ?? []).map((entry, i) => (
            <View
              key={i}
              style={[
                s.entry,
                i === (entries ?? []).length - 1 ? { marginBottom: 0 } : {},
              ]}
            >
              <Text style={styles.entrySubtitle}>{entry.subtitle}</Text>
              {(() => {
                const raw = entry.contents;
                const c = Array.isArray(raw) ? raw : raw ? [raw] : [];
                return c.length === 1 ? (
                  <Text style={styles.entryPlainText}>{c[0]}</Text>
                ) : (
                  c.map((content, j) => (
                    <View key={j} style={styles.entryBulletRow}>
                      <Text style={styles.entryBulletDot}>•</Text>
                      <Text style={styles.entryBulletText}>{content}</Text>
                    </View>
                  ))
                );
              })()}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
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

  // ── 오른쪽: 해석 내용 ──
  entryBody: {
    padding: 12,
  },
  entry: {
    marginBottom: 12,
  },
});
