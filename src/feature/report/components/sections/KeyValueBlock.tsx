/**
 * 라벨-값 쌍 블록 (프로필 정보 등)
 *
 * [커스텀 가이드]
 * - 라벨 너비: styles.ts kvKey의 width (기본 100pt)
 * - 배경색: kvContainer의 backgroundColor
 * - 라벨/값 정렬: kvRow에 alignItems 추가
 * - 2열 레이아웃: kvRow를 flexWrap: 'wrap'으로 변경하고 width 50%씩
 */

import { Text, View } from '@react-pdf/renderer';

import type { KeyValueSection } from '../../types/reportSchema';
import { styles } from '../styles';

export const KeyValueBlock = ({ section }: { section: KeyValueSection }) => (
  <View style={styles.kvContainer}>
    {section.title && <Text style={styles.kvTitle}>{section.title}</Text>}
    {(section.pairs ?? []).map((pair, i) => (
      <View key={i} style={styles.kvRow}>
        <Text style={styles.kvKey}>{pair.key}</Text>
        <Text style={styles.kvValue}>{pair.value}</Text>
      </View>
    ))}
  </View>
);
