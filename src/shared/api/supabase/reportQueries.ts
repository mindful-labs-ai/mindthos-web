import type { GenogramReport } from '@/features/report/types/reportSchema';
import { supabase } from '@/lib/supabase';
import { serverRequest } from '@/shared/api/server/serverClient';

// ============================================
// 타입 정의
// ============================================

export interface ReportListItem {
  id: string;
  client_id: string;
  user_id: number;
  template_id: string;
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

/** report 상태 (목록 아이템과 동일). */
export type ReportStatus = ReportListItem['status'];

/**
 * generate/retry 응답 — 비동기 이관 후 inline 결과(formatted_json) 없이 report_id + 현재
 * status만 반환한다(generate=IN_PROGRESS, retry=IN_PROGRESS 또는 이미 완료면 SUCCEEDED).
 * 실제 formatted_json은 status가 terminal(SUCCEEDED)이 될 때까지 목록을 폴링한 뒤
 * fetchReportDetail로 조회한다.
 */
interface DispatchReportResponse {
  success: boolean;
  data: {
    report_id: string;
    status: ReportStatus;
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
    throw new Error('PDF 미리보기를 받지 못했어요.');
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

/** 내담자별 보고서 목록 조회 */
export async function listReports(clientId: string): Promise<ReportListItem[]> {
  try {
    const data = await serverRequest<ListReportsResponse>('/report/list', {
      method: 'POST',
      body: { client_id: clientId },
    });

    if (!data.success) {
      throw new Error('보고서 목록을 불러오지 못했어요.');
    }

    return data.data.reports;
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(err.message || '보고서 목록 조회 중 오류가 생겼어요.');
  }
}

// ============================================
// 비동기 결과 폴링
// ============================================

// 폴링 설정 — 가계도 AI 폴링과 유사한 주기, 전체 타임아웃 5분(생성 60s+ · 서버 TTL 고려).
const REPORT_POLL_INTERVAL_MS = 3000;
const REPORT_POLL_TIMEOUT_MS = 5 * 60 * 1000;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** shouldCancel(모달 언마운트 등)로 폴링이 중단되면 던지는 센티넬. */
export class ReportPollCancelledError extends Error {
  constructor() {
    super('report poll cancelled');
    this.name = 'ReportPollCancelledError';
  }
}

/** 타임아웃 안에 terminal 상태가 되지 않아 폴링을 포기할 때 던진다(아직 생성 중일 수 있음). */
export class ReportPollTimeoutError extends Error {
  constructor() {
    super('report poll timed out');
    this.name = 'ReportPollTimeoutError';
  }
}

interface PollReportOptions {
  intervalMs?: number;
  timeoutMs?: number;
  /** true면 즉시 ReportPollCancelledError로 중단(모달 닫힘/언마운트). */
  shouldCancel?: () => boolean;
}

/**
 * 비동기 생성/재시도 후 보고서가 terminal(SUCCEEDED/FAILED)이 될 때까지 목록을 폴링한다.
 * - shouldCancel → ReportPollCancelledError
 * - timeoutMs 초과 → ReportPollTimeoutError (호출부에서 "아직 생성 중" 폴백 처리)
 */
export async function pollReportUntilTerminal(
  clientId: string,
  reportId: string,
  options: PollReportOptions = {}
): Promise<ReportListItem> {
  const intervalMs = options.intervalMs ?? REPORT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? REPORT_POLL_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (options.shouldCancel?.()) throw new ReportPollCancelledError();
    await delay(intervalMs);
    if (options.shouldCancel?.()) throw new ReportPollCancelledError();

    const reports = await listReports(clientId);
    const target = reports.find((report) => report.id === reportId);
    if (target && target.status !== 'IN_PROGRESS') {
      return target;
    }
    // IN_PROGRESS(또는 아직 목록에 없음) → 계속 폴링
  }

  throw new ReportPollTimeoutError();
}

/** 보고서 생성 (비동기 dispatch — report_id + status 반환) */
export async function generateReport(
  params: GenerateReportRequest
): Promise<DispatchReportResponse['data']> {
  try {
    const data = await serverRequest<DispatchReportResponse>(
      '/report/generate',
      { method: 'POST', body: params }
    );

    if (!data.success) {
      throw new Error('보고서를 만들지 못했어요.');
    }

    return data.data;
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: string };

    if (err.statusCode === 'ACCESS_DENIED') {
      throw new Error('이 보고서를 생성하려면 세미나 수료가 필요해요.');
    }

    throw new Error(err.message || '보고서 생성 중 오류가 생겼어요.');
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
    throw new Error('보고서 데이터를 불러오지 못했어요.');
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
    throw new Error(`PDF를 업로드하지 못했어요: ${error.message}`);
  }
}

/** storage key를 DB에 저장 */
export async function savePdfStorageKey(
  reportId: string,
  storageKey: string
): Promise<string> {
  try {
    const data = await serverRequest<SavePdfUrlResponse>('/report/pdf-url', {
      method: 'POST',
      body: { report_id: reportId, storage_key: storageKey },
    });

    if (!data.success) {
      throw new Error('PDF 저장 정보를 처리하지 못했어요.');
    }

    return data.data.storage_key;
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error(err.message || 'PDF storage key 저장 중 오류가 생겼어요.');
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

/** 실패한 보고서 재시도 (비동기 dispatch — report_id + status 반환) */
export async function retryReport(
  reportId: string
): Promise<DispatchReportResponse['data']> {
  try {
    const data = await serverRequest<DispatchReportResponse>('/report/retry', {
      method: 'POST',
      body: { report_id: reportId },
    });

    if (!data.success) {
      throw new Error('보고서를 다시 만들지 못했어요.');
    }

    return data.data;
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: string };

    if (err.statusCode === 'RETRY_COOLDOWN') {
      throw new Error(err.message || '재시도까지 잠시 기다려주세요.');
    }
    if (err.statusCode === 'MAX_RETRY_EXCEEDED') {
      throw new Error(err.message || '최대 재시도 횟수를 넘었어요.');
    }

    throw new Error(err.message || '보고서 재시도 중 오류가 생겼어요.');
  }
}
