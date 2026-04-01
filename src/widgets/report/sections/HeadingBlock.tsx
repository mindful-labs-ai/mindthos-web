/**
 * 제목 블록 (h1 / h2 / h3)
 *
 * [커스텀 가이드]
 * - 레벨별 스타일: styles.ts의 heading1 / heading2 / heading3
 * - 크기: theme.ts의 fontSize.heading1~3
 */

import { StyleSheet, Text, View } from '@react-pdf/renderer';

import type { HeadingSection } from '@/features/report/types/reportSchema';

import { styles } from '../styles';
import { colors } from '../theme';

export const HeadingBlock = ({
  section,
  headingNumber,
}: {
  section: HeadingSection;
  headingNumber?: number;
}) => {
  const style =
    section.level === 1
      ? styles.heading1
      : section.level === 2
        ? styles.heading2
        : styles.heading3;

  const s = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%',
      gap: 9,
      paddingVertical: 16,
    },
    headerHighlight: {
      alignSelf: 'center',
      width: 4,
      height: 16,
      backgroundColor: colors.highlight,
    },
  });

  return (
    <View style={s.container}>
      <View style={s.headerHighlight} />
      <Text style={style}>
        {section.level === 1 && headingNumber
          ? `${headingNumber}. ${section.text}`
          : section.text}
      </Text>
    </View>
  );
};
