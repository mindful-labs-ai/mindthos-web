/**
 * 불릿 리스트 블록
 *
 * [커스텀 가이드]
 * - 불릿 기호 변경: bulletDot의 텍스트 '•' → '-', '▸', '✓' 등
 * - 불릿 색상: theme.ts colors.primary
 * - 들여쓰기: styles.ts bulletList의 paddingLeft
 * - 항목 간격: bulletItem의 marginBottom
 */

import { Text, View } from '@react-pdf/renderer';

import type { BulletListSection } from '../../types/reportSchema';
import { styles } from '../styles';

export const BulletListBlock = ({
  section,
}: {
  section: BulletListSection;
}) => (
  <View style={styles.bulletList}>
    {section.title && (
      <Text style={styles.bulletListTitle}>{section.title}</Text>
    )}
    {(section.items ?? []).map((item, i) => (
      <View key={i} style={styles.bulletItem}>
        <Text style={styles.bulletDot}>•</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);
