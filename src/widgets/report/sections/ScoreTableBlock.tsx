/**
 * 점수/평가 테이블 블록
 *
 * [커스텀 가이드]
 * - 컬럼 너비: tableCellLabel(20%), tableCellScore(15%), tableCellDescription(50%)
 *   → styles.ts에서 width 비율 조정
 * - 헤더 배경: theme.ts colors.primaryLight
 * - wrap={false}: 테이블이 잘리지 않고 통째로 넘김.
 *   행이 매우 많으면 wrap={true}로 변경하여 행 단위로 넘기기 가능
 * - 컬럼 추가: columns 배열과 rows에 필드 추가 후 <View> 추가
 */

import { Text, View } from '@react-pdf/renderer';

import type { ScoreTableSection } from '@/features/report/types/reportSchema';

import { styles } from '../styles';

export const ScoreTableBlock = ({
  section,
}: {
  section: ScoreTableSection;
}) => (
  <View style={styles.tableContainer} wrap={false}>
    {section.title && <Text style={styles.tableTitle}>{section.title}</Text>}

    {/* 헤더 행 */}
    <View style={styles.tableHeader}>
      <View style={styles.tableCellLabel}>
        <Text style={styles.tableHeaderText}>
          {(section.columns ?? [])[0] || '영역'}
        </Text>
      </View>
      <View style={styles.tableCellScore}>
        <Text style={styles.tableHeaderText}>
          {(section.columns ?? [])[1] || '점수'}
        </Text>
      </View>
      <View style={styles.tableCellScore}>
        <Text style={styles.tableHeaderText}>
          {(section.columns ?? [])[2] || '최대'}
        </Text>
      </View>
      <View style={styles.tableCellDescription}>
        <Text style={styles.tableHeaderText}>
          {(section.columns ?? [])[3] || '설명'}
        </Text>
      </View>
    </View>

    {/* 데이터 행 */}
    {(section.rows ?? []).map((row, i) => (
      <View key={i} style={styles.tableRow}>
        <View style={styles.tableCellLabel}>
          <Text>{row.label}</Text>
        </View>
        <View style={styles.tableCellScore}>
          <Text>{row.score}</Text>
        </View>
        <View style={styles.tableCellScore}>
          <Text>{row.maxScore}</Text>
        </View>
        <View style={styles.tableCellDescription}>
          <Text>{row.description || ''}</Text>
        </View>
      </View>
    ))}
  </View>
);
