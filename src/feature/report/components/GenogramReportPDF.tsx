/**
 * ============================================
 * PDF 보고서 메인 컴포넌트
 * ============================================
 *
 * [커스텀 가이드]
 * - 이 파일은 조립만 담당. 직접 수정할 일은 거의 없음
 * - 디자인 변경: theme.ts → styles.ts
 * - 헤더/푸터 변경: PageHeader.tsx / PageFooter.tsx
 * - 표지 변경: CoverPage.tsx
 * - 섹션 블록 변경: sections/ 폴더의 개별 파일
 * - 새 섹션 타입 추가: SectionRenderer.tsx
 * - 폰트 변경: fonts/registerFonts.ts + theme.ts fontFamily
 * - 페이지 번호: pdf-lib 후처리로 삽입 (utils/addPageNumbers.ts)
 */

import { Document, Page } from '@react-pdf/renderer';

import { registerFonts } from '../fonts/registerFonts';
import type { CoverSection, GenogramReport } from '../types/reportSchema';

import { CoverPage } from './CoverPage';
import { PageFooter } from './PageFooter';
import { PageHeader } from './PageHeader';
import { SectionRenderer } from './SectionRenderer';
import { styles } from './styles';

// 폰트 등록 (모듈 로드 시 1회)
registerFonts();

interface GenogramReportPDFProps {
  report: GenogramReport;
}

export const GenogramReportPDF = ({ report }: GenogramReportPDFProps) => {
  const { meta } = report;

  const coverSection = report.sections.find((s) => s.type === 'cover') as
    | CoverSection
    | undefined;
  const contentSections = report.sections.filter((s) => s.type !== 'cover');

  return (
    <Document>
      {/* 표지 (별도 페이지, 헤더/푸터 없음) */}
      {coverSection && <CoverPage section={coverSection} />}

      {/* 본문 - 내용이 넘치면 자동 새 페이지, 헤더/푸터는 fixed로 반복 */}
      <Page size="A4" style={styles.page} wrap>
        <PageHeader meta={meta} />
        <PageFooter meta={meta} />

        {contentSections.map((section, i) => (
          <SectionRenderer key={i} section={section} />
        ))}
      </Page>
    </Document>
  );
};
