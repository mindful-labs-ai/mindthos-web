import { serverRequest } from './serverClient';

/**
 * 검사 업로드 API (mindthos-server).
 *
 * 흐름: presigned URL 배치 발급 → 각 파일 S3 PUT → complete(업로드 확정).
 * 서버가 S3 HeadObject 검증 후 OCR 큐로 publish하고 상태를 PENDING으로 전이한다.
 *
 * 경로(shallow nesting, 2026-05-22 서버 재구성):
 *  - 컬렉션(발급/조회): clients/:clientId/assessments
 *  - 아이템(complete 등): client-assessments/:id
 */

export type AssessmentType = 'MMPI_2' | 'TCI';

export type ProcessingStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface RequestedUpload {
  type: AssessmentType;
  title: string;
}

export type ValidationStatus =
  | 'VALID'
  | 'MISSING_FIELD'
  | 'INVALID'
  | 'UNMATCHED'
  | 'INCOMPLETE';

/** 검사 1건의 외부 표현 (서버 ClientAssessmentDto). presignedUrl 없음. */
export interface AssessmentRow {
  id: string;
  type: AssessmentType;
  title: string;
  assessmentVersion: number;
  sourceFileS3Path: string;
  processingStatus: ProcessingStatus;
  validationStatus: ValidationStatus | null;
  tempOcrScore: Record<string, unknown> | null;
  ocrScore: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/** 발급 응답 행 = 검사 행 + presigned PUT URL. */
export interface IssuedUpload extends AssessmentRow {
  presignedUrl: string;
}

export interface IssueUploadBatchResponse {
  assessmentVersion: number;
  issuedUploadBatch: IssuedUpload[];
}

/**
 * client-assessment 도메인 엔드포인트 경로 빌더.
 * 서버 라우팅이 바뀌면 여기만 수정한다. (path param은 함수 인자로 받음)
 *
 * shallow nesting: 컬렉션은 clients/:clientId/assessments, 아이템은 flat client-assessments/:id.
 */
export const ASSESSMENT_ROUTES = {
  /** 컬렉션: 발급(POST) + 활성 배치 조회(GET) */
  uploadBatch: (clientId: string) => `/clients/${clientId}/assessments`,
  /** 아이템 단건 조회(GET) + 삭제(DELETE) */
  item: (assessmentId: string) => `/client-assessments/${assessmentId}`,
  complete: (assessmentId: string) =>
    `/client-assessments/${assessmentId}/upload-complete`,
  confirm: (assessmentId: string) =>
    `/client-assessments/${assessmentId}/confirm`,
  /** 분석 시작 (POST) */
  analysis: (clientId: string) => `/clients/${clientId}/analysis`,
  /** 분석 진행 상태 조회 (GET) */
  analysisStatus: (clientId: string) => `/clients/${clientId}/analysis-status`,
  /** OCR 단계 복귀(재검토) (POST) — CHAT_ACTIVE→OCR_PHASE */
  ocrPhaseReset: (clientId: string) => `/clients/${clientId}/ocr-phase-reset`,
} as const;

// ─── 분석 도메인 타입 ────────────────────────────────────────────────────────

export type ChatActiveStatus =
  | 'OCR_PHASE'
  | 'ANALYSIS_PHASE'
  | 'CHAT_ACTIVE';

/** POST /clients/:clientId/analysis 응답 data */
export interface AnalysisStartResponse {
  clientId: string;
  assessmentVersion: number;
  chatActiveStatus: 'ANALYSIS_PHASE';
}

/** 개별 검사 보고서 완료 여부 */
export interface AssessmentReportStatus {
  type: 'MMPI_2' | 'TCI';
  completed: boolean;
}

/** GET /clients/:clientId/analysis-status 응답 data */
export interface AnalysisStatusResponse {
  clientId: string;
  assessmentVersion: number;
  chatActiveStatus: ChatActiveStatus;
  assessmentReports: AssessmentReportStatus[];
  integrationReportCompleted: boolean;
}

/** 1) presigned PUT URL 배치 발급 */
export function issueUploadUrlBatch(
  clientId: string,
  uploadBatch: RequestedUpload[],
): Promise<IssueUploadBatchResponse> {
  return serverRequest<IssueUploadBatchResponse>(
    ASSESSMENT_ROUTES.uploadBatch(clientId),
    { method: 'POST', body: { uploadBatch } },
  );
}

/** 2) presigned URL로 S3에 PDF 직접 PUT (서버 우회, 브라우저 → S3) */
export async function putFileToS3(
  presignedUrl: string,
  file: File,
): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    // presigned는 host만 서명됨 → Content-Type만 맞추고 추가 헤더 금지.
    headers: { 'Content-Type': 'application/pdf' },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`S3 업로드 실패 (${res.status})`);
  }
}

/** 3) 업로드 확정 — INITIATED→PENDING, S3 검증 + OCR publish */
export function completeUpload(assessmentId: string): Promise<IssuedUpload> {
  return serverRequest<IssuedUpload>(ASSESSMENT_ROUTES.complete(assessmentId), {
    method: 'POST',
  });
}

/** 현재 활성 배치 조회/폴링 — presignedUrl 없는 행 목록. */
export function getAssessmentBatch(clientId: string): Promise<{
  assessmentVersion: number;
  assessmentList: AssessmentRow[];
}> {
  return serverRequest(ASSESSMENT_ROUTES.uploadBatch(clientId));
}

/** 검사 단건 조회. */
export function getAssessment(assessmentId: string): Promise<AssessmentRow> {
  return serverRequest<AssessmentRow>(ASSESSMENT_ROUTES.item(assessmentId));
}

/** MISSING_FIELD 검사 확정 — 빠진 필드 채운 최종 점수로 VALID 전이. */
export function confirmAssessment(
  assessmentId: string,
  ocrScore: Record<string, unknown>,
): Promise<AssessmentRow> {
  return serverRequest<AssessmentRow>(ASSESSMENT_ROUTES.confirm(assessmentId), {
    method: 'POST',
    body: { ocrScore },
  });
}

/** 드래프트/INVALID 검사 삭제 (재업로드 전). */
export function deleteAssessment(assessmentId: string): Promise<void> {
  return serverRequest<void>(ASSESSMENT_ROUTES.item(assessmentId), {
    method: 'DELETE',
  });
}

/** 분석 시작 — POST /clients/:clientId/analysis (요청 body 없음). */
export function startAnalysis(
  clientId: string,
): Promise<AnalysisStartResponse> {
  return serverRequest<AnalysisStartResponse>(
    ASSESSMENT_ROUTES.analysis(clientId),
    { method: 'POST' },
  );
}

/** 분석 진행 상태 조회 — GET /clients/:clientId/analysis-status. */
export function getAnalysisStatus(
  clientId: string,
): Promise<AnalysisStatusResponse> {
  return serverRequest<AnalysisStatusResponse>(
    ASSESSMENT_ROUTES.analysisStatus(clientId),
  );
}

/** OCR 단계 복귀(재검토) 응답 data. */
export interface OcrPhaseResetResponse {
  clientId: string;
  assessmentVersion: number;
  chatActiveStatus: ChatActiveStatus;
}

/** OCR 단계 복귀 — POST /clients/:clientId/ocr-phase-reset (CHAT_ACTIVE→OCR_PHASE).
 * 활성 검사 버전은 유지(재확정 시 N→N+1). CHAT_ACTIVE가 아니면 서버 409. */
export function resetToOcrPhase(
  clientId: string,
): Promise<OcrPhaseResetResponse> {
  return serverRequest<OcrPhaseResetResponse>(
    ASSESSMENT_ROUTES.ocrPhaseReset(clientId),
    { method: 'POST' },
  );
}

export interface UploadItem {
  type: AssessmentType;
  title: string;
  file: File;
}

export interface UploadOutcome {
  assessmentId: string;
  type: AssessmentType;
  title: string;
  processingStatus: ProcessingStatus;
}

/**
 * 고수준 오케스트레이터: 여러 검사 파일을 한 번에 업로드.
 * presigned 배치 발급 → 파일별 S3 PUT → 파일별 complete.
 * 발급 순서와 업로드 항목 순서가 1:1 대응한다.
 */
export async function uploadAssessments(
  clientId: string,
  items: UploadItem[],
): Promise<{ assessmentVersion: number; outcomes: UploadOutcome[] }> {
  const { assessmentVersion, issuedUploadBatch } = await issueUploadUrlBatch(
    clientId,
    items.map(({ type, title }) => ({ type, title })),
  );

  const outcomes: UploadOutcome[] = [];
  for (let i = 0; i < issuedUploadBatch.length; i++) {
    const issued = issuedUploadBatch[i];
    const item = items[i];
    await putFileToS3(issued.presignedUrl, item.file);
    const completed = await completeUpload(issued.id);
    outcomes.push({
      assessmentId: completed.id,
      type: completed.type,
      title: completed.title,
      processingStatus: completed.processingStatus,
    });
  }

  return { assessmentVersion, outcomes };
}
