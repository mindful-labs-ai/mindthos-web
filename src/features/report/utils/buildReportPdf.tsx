import type { RefObject } from 'react';

import { pdf } from '@react-pdf/renderer';

import type { GenogramPageHandle } from '@/genogram';
import { GenogramReportPDF } from '@/widgets/report/GenogramReportPDF';

import {
  buildStorageKey,
  savePdfStorageKey,
  uploadReportPdf,
} from '../services/reportService';
import type { GenogramReport, ReportSection } from '../types/reportSchema';

import { addPageNumbers } from './addPageNumbers';

type ProcessReportFn = (sections: ReportSection[]) => Promise<ReportSection[]>;

/**
 * 보고서 데이터에 live genogram 그래프를 주입하고
 * 이미지 캡처 → PDF 렌더 → 페이지 번호 삽입까지 수행
 */
export async function buildReportPdf(
  reportData: GenogramReport,
  genogramRef: RefObject<GenogramPageHandle | null>,
  processReport: ProcessReportFn
): Promise<Blob> {
  // 1. genogram 데이터 주입
  const liveGraphData = genogramRef.current?.toJSON() ?? undefined;
  const sectionsWithLiveGraph = reportData.sections.map((section) =>
    (section.type === 'genogram_image' ||
      section.type === 'relation_pattern') &&
    !section.graphData &&
    !section.imageData &&
    liveGraphData
      ? { ...section, graphData: liveGraphData, imageData: undefined }
      : section
  );

  // 2. graphData → imageData 캡처
  const resolvedSections = await processReport(sectionsWithLiveGraph);
  const resolvedReport = { ...reportData, sections: resolvedSections };

  // 3. PDF 생성 + 페이지 번호
  const blob = await pdf(
    <GenogramReportPDF report={resolvedReport} />
  ).toBlob();

  return addPageNumbers(blob);
}

/**
 * PDF blob을 Storage에 업로드하고 storage key를 DB에 저장
 */
export async function uploadPdfToStorage(
  userId: string,
  clientId: string,
  reportId: string,
  blob: Blob
): Promise<void> {
  const storageKey = buildStorageKey(userId, clientId);
  await uploadReportPdf(storageKey, blob);
  await savePdfStorageKey(reportId, storageKey);
}
