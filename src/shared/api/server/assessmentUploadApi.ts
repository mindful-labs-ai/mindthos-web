import { serverRequest } from './serverClient';

/**
 * 검사 업로드 API (mindthos-server `/v1/clients/:clientId/assessment-uploads`).
 *
 * 흐름: presigned URL 배치 발급 → 각 파일 S3 PUT → complete(업로드 확정).
 * 서버가 S3 HeadObject 검증 후 OCR 큐로 publish하고 상태를 PENDING으로 전이한다.
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

export interface IssuedUpload {
  assessmentId: string;
  type: AssessmentType;
  title: string;
  assessmentVersion: number;
  s3Path: string;
  processingStatus: ProcessingStatus;
  validationStatus: string | null;
  createdAt: string;
  updatedAt: string;
  presignedUrl: string;
}

export interface IssueUploadBatchResponse {
  assessmentVersion: number;
  issuedUploadBatch: IssuedUpload[];
}

/** 1) presigned PUT URL 배치 발급 */
export function issueUploadUrlBatch(
  clientId: string,
  uploadBatch: RequestedUpload[],
): Promise<IssueUploadBatchResponse> {
  return serverRequest<IssueUploadBatchResponse>(
    `/clients/${clientId}/assessment-uploads`,
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
export function completeUpload(
  clientId: string,
  assessmentId: string,
): Promise<IssuedUpload> {
  return serverRequest<IssuedUpload>(
    `/clients/${clientId}/assessment-uploads/${assessmentId}/complete`,
    { method: 'POST' },
  );
}

/** 현재 활성 배치 상태 폴링 */
export function getUploadBatch(clientId: string): Promise<{
  assessmentVersion: number;
  batch: IssuedUpload[];
}> {
  return serverRequest(`/clients/${clientId}/assessment-uploads`);
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
    const completed = await completeUpload(clientId, issued.assessmentId);
    outcomes.push({
      assessmentId: completed.assessmentId,
      type: completed.type,
      title: completed.title,
      processingStatus: completed.processingStatus,
    });
  }

  return { assessmentVersion, outcomes };
}
