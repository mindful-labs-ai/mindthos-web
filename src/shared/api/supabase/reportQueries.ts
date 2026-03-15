import type { GenogramReport } from '@/features/report/types/reportSchema';
import { supabase } from '@/lib/supabase';
import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/api/edgeFunctionClient';

// ============================================
// 타입 정의
// ============================================

export interface ReportListItem {
  id: string;
  client_id: string;
  user_id: number;
  template_key: string;
  title: string;
  status: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  error_code: string | null;
  retry_count: number;
  pdf_storage_key: string | null;
  created_at: string;
  last_attempted_at: string | null;
}

interface ListReportsResponse {
  success: boolean;
  data: {
    reports: ReportListItem[];
    total: number;
  };
}

interface GenerateReportRequest {
  client_id: string;
  template_key: string;
  title?: string;
  input_snapshot: {
    client_name?: string;
    counselor_name?: string;
    organization?: string;
    counseling_period?: string;
  };
}

interface GenerateReportResponse {
  success: boolean;
  data: {
    report_id: string;
    formatted_json: GenogramReport;
    status: 'SUCCEEDED';
  };
}

interface RetryReportResponse {
  success: boolean;
  data: {
    report_id: string;
    formatted_json: GenogramReport;
    status: 'SUCCEEDED';
  };
}

interface SavePdfUrlResponse {
  success: boolean;
  data: {
    report_id: string;
    storage_key: string;
  };
}

// ============================================
// 헬퍼
// ============================================

/** pdf_storage_key로 10분 유효 signed URL 발급 */
export async function createSignedPdfUrl(storageKey: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('genogram_report')
    .createSignedUrl(storageKey, 60 * 10);

  if (error || !data?.signedUrl) {
    throw new Error('PDF signed URL 발급에 실패했습니다.');
  }

  return data.signedUrl;
}

/** Storage 업로드 키 생성 (userId/clientId/yy-MM-dd/uuid.pdf) */
export function buildStorageKey(userId: string, clientId: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const uuid = crypto.randomUUID();
  return `${userId}/${clientId}/${yy}-${mm}-${dd}/${uuid}.pdf`;
}

/**
 * 보고서 내보내기 (제목 업데이트 → PDF 다운로드 → 목록 갱신)
 *
 * 미리보기 화면에서 "PDF 출력하기" 시 호출.
 * - reportId가 있으면 DB 제목 업데이트
 * - pdfUrl로 파일 다운로드
 * - onRefresh 콜백으로 목록 갱신
 */
export async function exportReport(params: {
  reportId: string | null;
  title: string;
  pdfUrl: string;
  onRefresh: () => void;
}): Promise<void> {
  const { reportId, title, pdfUrl, onRefresh } = params;

  // 1. 제목 업데이트
  if (reportId) {
    const { error } = await supabase
      .from('reports')
      .update({ title })
      .eq('id', reportId);

    if (error) {
      if (!import.meta.env.PROD)
        console.error('보고서 제목 업데이트 실패:', error.message);
    }
  }

  // 2. PDF 다운로드
  const a = document.createElement('a');
  a.href = pdfUrl;
  a.download = `${title || '가계도_분석_보고서'}.pdf`;
  a.click();

  // 3. 목록 갱신
  onRefresh();
}

// ============================================
// API 함수
// ============================================

/** 클라이언트별 보고서 목록 조회 */
export async function listReports(clientId: string): Promise<ReportListItem[]> {
  try {
    const data = await callEdgeFunction<ListReportsResponse>(
      EDGE_FUNCTION_ENDPOINTS.REPORT.LIST,
      { client_id: clientId }
    );

    if (!data.success) {
      throw new Error('보고서 목록을 불러오지 못했습니다.');
    }

    return data.data.reports;
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(err.message || '보고서 목록 조회 중 오류가 발생했습니다.');
  }
}

/** 보고서 생성 */
export async function generateReport(
  params: GenerateReportRequest
): Promise<GenerateReportResponse['data']> {
  try {
    const data = await callEdgeFunction<GenerateReportResponse>(
      EDGE_FUNCTION_ENDPOINTS.REPORT.GENERATE,
      params
    );

    if (!data.success) {
      throw new Error('보고서 생성에 실패했습니다.');
    }

    return data.data;
  } catch (error: unknown) {
    const err = error as { message?: string; error?: string };

    if (err.error === 'ACCESS_DENIED') {
      throw new Error('이 보고서를 생성하려면 세미나 수료가 필요합니다.');
    }

    throw new Error(err.message || '보고서 생성 중 오류가 발생했습니다.');
  }
}

/** 보고서 상세 조회 (formatted_json 포함) */
export async function fetchReportDetail(
  reportId: string
): Promise<GenogramReport> {
  const { data, error } = await supabase
    .from('reports')
    .select('formatted_json')
    .eq('id', reportId)
    .single();

  if (error || !data?.formatted_json) {
    throw new Error('보고서 데이터를 불러오지 못했습니다.');
  }

  return data.formatted_json as GenogramReport;
}

/** Supabase Storage에 PDF 업로드 */
export async function uploadReportPdf(
  storageKey: string,
  pdfBlob: Blob
): Promise<void> {
  const { error } = await supabase.storage
    .from('genogram_report')
    .upload(storageKey, pdfBlob, { contentType: 'application/pdf' });

  if (error) {
    throw new Error(`PDF 업로드에 실패했습니다: ${error.message}`);
  }
}

/** storage key를 DB에 저장 */
export async function savePdfStorageKey(
  reportId: string,
  storageKey: string
): Promise<string> {
  try {
    const data = await callEdgeFunction<SavePdfUrlResponse>(
      EDGE_FUNCTION_ENDPOINTS.REPORT.PDF_URL,
      { report_id: reportId, storage_key: storageKey }
    );

    if (!data.success) {
      throw new Error('PDF storage key 저장에 실패했습니다.');
    }

    return data.data.storage_key;
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(
      err.message || 'PDF storage key 저장 중 오류가 발생했습니다.'
    );
  }
}

// ============================================
// 보고서 템플릿
// ============================================

export interface ReportTemplate {
  id: string;
  key: string;
  name: string;
  description: string;
  prompt: string;
  schema: string;
  createdAt: string;
}

/** 보고서 템플릿 전체 목록 조회 */
export async function fetchReportTemplates(): Promise<ReportTemplate[]> {
  const { data, error } = await supabase
    .from('report_templates')
    .select('id, key, name, description, prompt, schema, created_at');

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    prompt: row.prompt,
    schema: row.schema,
    createdAt: row.created_at,
  }));
}

/** 실패한 보고서 재시도 */
export async function retryReport(
  reportId: string
): Promise<RetryReportResponse['data']> {
  try {
    const data = await callEdgeFunction<RetryReportResponse>(
      EDGE_FUNCTION_ENDPOINTS.REPORT.RETRY,
      { report_id: reportId }
    );

    if (!data.success) {
      throw new Error('보고서 재생성에 실패했습니다.');
    }

    return data.data;
  } catch (error: unknown) {
    const err = error as { message?: string; error?: string };

    if (err.error === 'RETRY_COOLDOWN') {
      throw new Error(err.message || '재시도까지 잠시 기다려주세요.');
    }
    if (err.error === 'MAX_RETRY_EXCEEDED') {
      throw new Error(err.message || '최대 재시도 횟수를 초과했습니다.');
    }

    throw new Error(err.message || '보고서 재시도 중 오류가 발생했습니다.');
  }
}
