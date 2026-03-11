/**
 * 구분선 블록
 *
 * [커스텀 가이드]
 * - 두께: styles.ts divider의 borderBottomWidth
 * - 색상: theme.ts colors.border
 * - 상하 여백: divider의 marginVertical
 */

import { View } from '@react-pdf/renderer';

import { styles } from '../styles';

export const DividerBlock = () => <View style={styles.divider} />;
