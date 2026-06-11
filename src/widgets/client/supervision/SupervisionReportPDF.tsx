/**
 * 고정 구조(V2) 다회기 분석 보고서 → PDF 문서.
 *
 * 가계도 보고서 PDF 인프라(@react-pdf/renderer + 로컬 폰트 + pdf-lib 페이지 번호)를
 * 재사용한다. 섹션 제목·순서·표 헤더는 화면 렌더와 동일하게 TemplateConfig가 제공.
 */
import {
  Document,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import type {
  KVItem,
  S2Session,
  S3Row,
  SupervisionReportV2,
} from '@/features/client/types/supervisionReport.types';
import { registerFonts } from '@/features/report/fonts/registerFonts';
import { addPageNumbers } from '@/features/report/utils/addPageNumbers';

import type { TemplateConfig } from './structure';

// 폰트 등록 (모듈 로드 시 1회)
registerFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NanumSquareNeo',
    fontSize: 9,
    lineHeight: 1.6,
    color: '#3C3C3C',
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 6,
  },
  meta: {
    fontSize: 8,
    color: '#9C9EA6',
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECEDF3',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 800,
    marginBottom: 8,
  },
  kvItem: {
    marginBottom: 8,
  },
  kvLabel: {
    fontWeight: 800,
    marginBottom: 2,
  },
  kvValue: {
    paddingLeft: 10,
  },
  sessionCard: {
    backgroundColor: '#F8F9FB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  sessionLabel: {
    fontWeight: 800,
    marginBottom: 6,
  },
  trajectoryLabel: {
    fontWeight: 800,
    marginTop: 4,
    marginBottom: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F5FA',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  thCell: {
    fontWeight: 800,
    padding: 6,
  },
  tdCell: {
    padding: 6,
  },
  colSession: { width: '12%' },
  colWide: { width: '29.33%' },
  question: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  questionNumber: {
    width: 16,
    fontWeight: 800,
  },
  questionText: {
    flex: 1,
  },
});

function KVItems({ items }: { items: KVItem[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.kvItem}>
          {item.label ? (
            <Text style={styles.kvLabel}>• {item.label}</Text>
          ) : null}
          {item.value ? <Text style={styles.kvValue}>{item.value}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function SessionBlocks({
  sessions,
  trajectory,
}: {
  sessions: S2Session[];
  trajectory: string;
}) {
  return (
    <View>
      {sessions.map((session, i) => (
        <View key={i} style={styles.sessionCard}>
          <Text style={styles.sessionLabel}>{session.session_label}</Text>
          <KVItems items={session.items} />
        </View>
      ))}
      {trajectory ? (
        <View>
          <Text style={styles.trajectoryLabel}>전체 변화 궤적</Text>
          <Text>{trajectory}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TranscriptPdfTable({
  headers,
  rows,
}: {
  headers: [string, string, string, string];
  rows: S3Row[];
}) {
  const widths = [
    styles.colSession,
    styles.colWide,
    styles.colWide,
    styles.colWide,
  ];
  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        {headers.map((header, i) => (
          <Text key={i} style={[styles.thCell, widths[i]]}>
            {header}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tdCell, styles.colSession]}>{row.session}</Text>
          <Text style={[styles.tdCell, styles.colWide]}>{row.speech}</Text>
          <Text style={[styles.tdCell, styles.colWide]}>{row.analysis}</Text>
          <Text style={[styles.tdCell, styles.colWide]}>{row.alternative}</Text>
        </View>
      ))}
    </View>
  );
}

interface SupervisionReportPDFProps {
  report: SupervisionReportV2;
  config: TemplateConfig;
  /** 보고서 제목 (템플릿 이름) */
  title: string;
  /** "YYYY년 M월 D일 작성됨" 메타 라인 (빈 문자열이면 생략) */
  dateStr?: string;
}

export function SupervisionReportPDF({
  report,
  config,
  title,
  dateStr,
}: SupervisionReportPDFProps) {
  const renderSection = (
    key: (typeof config.sectionOrder)[number]
  ): React.ReactNode => {
    switch (key) {
      case 'section0':
        return report.section0 ? (
          <KVItems items={report.section0.items} />
        ) : null;
      case 'section1':
        return <KVItems items={report.section1.items} />;
      case 'section2':
        return (
          <SessionBlocks
            sessions={report.section2.sessions}
            trajectory={report.section2.trajectory}
          />
        );
      case 'section3':
        return (
          <TranscriptPdfTable
            headers={config.s3Headers}
            rows={report.section3.rows}
          />
        );
      case 'section4':
        return <KVItems items={report.section4.items} />;
      case 'section5':
        return <KVItems items={report.section5.items} />;
      case 'section6':
        return (
          <View>
            {report.section6.questions.map((question, i) => (
              <View key={i} style={styles.question}>
                <Text style={styles.questionNumber}>{i + 1}.</Text>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  const sections = config.sectionOrder
    .map((key) => ({ key, node: renderSection(key) }))
    .filter((s) => Boolean(s.node));

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>{title}</Text>
        {dateStr ? <Text style={styles.meta}>{dateStr} 작성됨</Text> : null}
        {sections.map(({ key, node }) => (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionTitle}>{config.titles[key]}</Text>
            {node}
          </View>
        ))}
      </Page>
    </Document>
  );
}

/** 보고서 PDF Blob 생성 (페이지 번호 후처리 포함). */
export async function buildSupervisionReportPdfBlob(
  props: SupervisionReportPDFProps
): Promise<Blob> {
  const blob = await pdf(<SupervisionReportPDF {...props} />).toBlob();
  return addPageNumbers(blob, { skipFirstPage: false });
}
